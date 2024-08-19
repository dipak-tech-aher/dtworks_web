import moment from 'moment'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import FileUpload from '../../common/uploadAttachment/fileUpload'
import { get, post } from '../../common/util/restUtil'
import { properties } from '../../properties'
import { unstable_batchedUpdates } from 'react-dom'
import ReactSelect from 'react-select';
import * as Yup from 'yup';
import { toast } from 'react-toastify'

const AddEditTask = (props) => {
    const { taskDetails, isEdit = false, taskList, interactionData, helpdeskData, priorityLookup, taskStatusLookup, userList, tagsLookup, showTaskModal } = props.data
    const { setTaskDetails, setTaskStatusLookup, setShowTaskModal, AddTask } = props.handler
    const [taskFiles, setTaskFiles] = useState([])
    const [workflowLookUp, setWorkflowLookup] = useState([])
    const [roleLookUp, setRoleLookup] = useState([])
    const [userLookUp, setUserLookup] = useState([])
    const [error, setError] = useState({})
    const [tags, setTags] = useState([])
    const [inputTag, setInputTag] = useState('');
    const [edoc, setEdoc] = useState()
    const [initialLoad, setInitialLoad] = useState(true);
   
    useEffect(() => {
        if (interactionData?.edoc) {
            setEdoc(interactionData?.edoc)
        } else if (helpdeskData?.complitionDate) {
            setEdoc(helpdeskData?.complitionDate)
        }
    }, [
        interactionData?.edoc, helpdeskData?.complitionDate
    ])

    useEffect(() => {
        if (initialLoad) {
            if (taskDetails?.taskEstimatedTime) {
                setTaskDetails({
                    ...taskDetails,
                    hours: taskDetails?.taskEstimatedTime.split(':')[0],
                    minutes: taskDetails?.taskEstimatedTime.split(':')[1]
                })
            }
            if (taskDetails.taskTags && taskDetails.taskTags.length > 0) {
                const newTag = []
                for (const tag of taskDetails.taskTags) {
                    newTag.push({ label: tag.trim(), value: tag.trim() })
                }
                setTags(newTag);
            }
            if (taskDetails.attachments && taskDetails.attachments.length > 0) {
                setTaskFiles(taskDetails.attachments );
            }
        }
        setInitialLoad(false);
    }, [taskDetails?.taskEstimatedTime, taskDetails.taskTags, initialLoad])

    const taskSchema = Yup.object().shape({
        taskName: Yup.string().required('Task Name is required'),
        taskDescription: Yup.string().required('Task Description is required'),
        taskPriority: Yup.string().required('Task Priority is required'),
        taskStatus: Yup.string().required('Task Status is required'),
        taskRole: Yup.number().required('Task Role is required'),
        taskDept: Yup.string().required('Task Department is required'),
        dependencies: Yup.string().required('Dependencies are required'),
        taskDueDate: Yup.date().required('Task Due Date is required'),
        hours: Yup.number().required('Task Hour is required'),
        minutes: Yup.number().required('Task Minutes is required'),
        remarks: Yup.string().required('Remarks are required'),
    });

    const taskWorkflowRef = useRef()

    const validate = (schema, data) => {
        try {
            setError({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const handleClear = useCallback(() => {
    
        unstable_batchedUpdates(()=>{
            setTaskDetails({})
            setTaskFiles([])
            setTags([])
            setInputTag('')
            if (isEdit) {
                let taskName = taskDetails?.taskName
                setTaskDetails({ taskName });
            }
        })
        
    }, [showTaskModal])
    
    useEffect(() => {
        if (showTaskModal && !isEdit) {
            handleClear();
        }
    }, [showTaskModal, handleClear]);

    function handleInputChange(e) {
        const { id, value } = e.target
        if (id === 'taskStatus') {
            let entity = []
            workflowLookUp &&
                workflowLookUp?.entities.map((unit) => {
                    for (const property in unit.status) {
                        if (unit.status[property].code === value) {
                            entity.push(unit);
                            break;
                        }
                    }
                })

            unstable_batchedUpdates(() => {
                if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
                    entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
                    setTaskDetails({
                        ...taskDetails,
                        [id]: value,
                        taskRole: entity?.[0]?.roles?.[0].roleId,
                        taskDept: entity?.[0]?.entity?.[0]?.unitId
                    })

                    const l = userList.filter(u => u.mappingPayload?.userDeptRoleMapping?.filter(f => f?.roleId?.includes(entity?.[0]?.roles?.[0].roleId)))
                    // console.log(l)
                    setUserLookup(l)
                } else {
                    setTaskDetails({
                        ...taskDetails,
                        [id]: value
                    })
                }
                setRoleLookup(entity)
            })
        } else if (id === 'taskRole') {
            const { unitId = "" } = value !== "" && JSON.parse(e.target.options[e.target.selectedIndex].dataset.entity);
            setTaskDetails({ ...taskDetails, [id]: value, taskDept: unitId })
        } else if (id === 'hours') {
            setTaskDetails({
                ...taskDetails,
                taskEstimatedTime: `${value}:${taskDetails.minutes}`,
                [id]: value
            })
        } else if (id === 'minutes') {
            setTaskDetails({
                ...taskDetails,
                taskEstimatedTime: `${taskDetails.hours}:${value}`,
                [id]: value
            })
        } else if (id === 'taskTags') {
            setInputTag(value);
        } else {
            setTaskDetails({
                ...taskDetails,
                [id]: value
            })
        }

    }

    function handleAddTask() {
        const error = validate(taskSchema, taskDetails)
        if (error) {
            toast.error('Validation errors found. Please check highlighted fields')
            return
        }
        let currentDate = new Date();
        let dueDate = new Date(taskDetails?.taskDueDate);

        // Calculate the deadline based on currentDate and dueDate
        let deadline = new Date(currentDate);
        deadline.setHours(taskDetails.hours);
        deadline.setMinutes(taskDetails.minutes);
        
        currentDate= moment(currentDate).format('YYYY-MM-DD')
        dueDate= moment(dueDate).format('YYYY-MM-DD')
        deadline= moment(deadline).format('YYYY-MM-DD')
        // Check if the deadline falls within the current date and due date
        if (deadline < currentDate || deadline > dueDate) {
            toast.error('Task estimation should fall between the current date and the due date.');
            return;
        }

        const duplicateTask = taskList?.some(s => s.taskName === taskDetails?.taskName)
        if (duplicateTask && !isEdit) {
            toast.error('Task with same name already added. Kindly provide different name.');
            return;
        }
        delete taskDetails.hours
        delete taskDetails.minutes
        const task = {
            ...taskDetails,
            workflowUuid: taskWorkflowRef.current?.workflowUuid
        }
        if (taskFiles && taskFiles.length) {
            task.attachments = taskFiles
        }
        setTaskDetails(task)
        AddTask(task)
        handleClear();
        setShowTaskModal(false)
    }

    useEffect(() => {
        if (taskDetails.taskPriority) {
            post(`${properties.WORKFLOW_API}/task/get-workflow`, { priority: taskDetails.taskPriority })
                .then((resp) => {
                    if (resp.status === 200) {
                        const statusArray = [];
                        resp.data?.workflow?.entities?.forEach(node => {
                            node.status?.forEach(status => {
                                statusArray.push(status);
                            })
                        })
                        let statusLookup = [
                            ...new Map(
                                statusArray.map((item) => [item["code"], item])
                            ).values(),
                        ];
                        unstable_batchedUpdates(() => {
                            taskWorkflowRef.current = resp.data?.workflowUuid ? { ...resp.data } : {}
                            setTaskStatusLookup(statusLookup)
                            setWorkflowLookup(resp?.data?.workflow)
                        })
                    }
                }).catch(error => console.error(error))
        }
    }, [taskDetails.taskPriority])

    const addTag = () => {
        if (inputTag.trim() !== '') {
            const newTag = { label: inputTag.trim(), value: inputTag.trim() };
            let tempTags = tags.find((val) => val.value.toLowerCase() === inputTag.toLowerCase())
            if (tempTags) {
                toast.info('Tags/labels already exist');
                return;
            }
            setTags([...tags, newTag]);
            setTaskDetails({ ...taskDetails, taskTags: [...(taskDetails?.taskTags ?? []), newTag.value] });
            setInputTag('');
        }
    };

    const removeTag = (tagValue) => {
        const updatedTags = tags?.filter(tag => tag.value !== tagValue);
        const updatedTaskTags = taskDetails.taskTags?.filter(tag => tag !== tagValue);
        setTags(updatedTags);
        setTaskDetails({ ...taskDetails, taskTags: updatedTaskTags });
    };

    return (
        <div className='mt-2'>
            <div className='form-row'>
                <div className='col-md-6'>
                    
                        <div className='form-group'>
                            <label htmlFor="taskName" className="control-label">Task Name
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <input type="text" value={taskDetails?.taskName ?? ''} id="taskName"
                                className={`form-control ${error.taskName && "error-border"}`} onChange={handleInputChange} 
                                disabled={isEdit}
                                maxLength={50}
                                />
                            <span className="errormsg">
                                {error.taskName && error.taskName}
                            </span>
                        </div>
                    
                </div>
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="taskDescription" className="control-label">
                            Task Description
                            <span className="text-danger font-20 pl-1 fld-imp">
                                *
                            </span>
                        </label>
                        <textarea
                            value={taskDetails?.taskDescription ?? ''}
                            className={`form-control ${error.taskDescription && "error-border"}`}
                            id="taskDescription"
                            name="taskDescription"
                            rows="4"
                            maxLength="2500"
                            onChange={handleInputChange}
                        />
                        <span>Maximum 2500 characters</span>
                        <span className="errormsg">
                            {error.taskDescription && error.taskDescription}
                        </span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskPriority" className="control-label">Priority
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className="custselect">
                            <select
                                value={taskDetails?.taskPriority ?? ''}
                                id="taskPriority"
                                className={`form-control ${error.taskPriority && "error-border"}`}
                                onChange={handleInputChange}
                            >
                                <option key="taskPriority" value="">
                                    Select...
                                </option>
                                {priorityLookup &&
                                    priorityLookup.map((e) => (
                                        <option key={e.code} value={e.code}>
                                            {e.description}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <span className="errormsg">
                            {error.taskPriority
                                ? error.taskPriority
                                : ""}
                        </span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskStatus" className="control-label">Status
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className="custselect">
                            <select
                                value={taskDetails?.taskStatus ?? ''}
                                id="taskStatus"
                                className={`form-control ${error.taskStatus && "error-border"
                                    }`}
                                onChange={handleInputChange}
                            >
                                <option key="taskStatus" value="">
                                    Select...
                                </option>
                                {taskStatusLookup &&
                                    taskStatusLookup.map((e) => (
                                        <option key={e.code} value={e.code}>
                                            {e.description}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <span className="errormsg">
                            {error.taskStatus
                                ? error.taskStatus
                                : ""}
                        </span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskRole" className="control-label">
                            Department/Role
                            <span className="text-danger font-20 pl-1 fld-imp">
                                *
                            </span>
                        </label>
                        <select className={`form-control ${error.taskRole && "error-border"}`} id="taskRole" value={taskDetails?.taskRole ?? ''} onChange={handleInputChange}>
                            <option value="">Select Role</option>
                            {roleLookUp &&
                                roleLookUp.map((dept, key) => (
                                    <optgroup key={key} label={dept?.entity?.[0]?.unitDesc}>
                                        {!!dept.roles.length &&
                                            dept.roles.map((data, childKey) => (
                                                <option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity[0])}>{data.roleDesc}</option>
                                            ))}
                                    </optgroup>
                                ))}
                        </select>
                    </div>
                    <span className="errormsg">
                        {error?.taskRole ? error?.taskRole : ""}
                    </span>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="assignedTo" className="control-label">
                            Responsible Party
                        </label>
                        <select className={`form-control ${error.assignedTo && "error-border"}`} id="assignedTo" value={taskDetails?.assignedTo ?? ''} onChange={handleInputChange}>
                            <option value="">Select User</option>
                            {userLookUp && userLookUp.map((user, key) => (
                                <option key={key} value={user?.userId}>{user?.firstName} {user?.lastName}</option>
                            ))}
                        </select>
                    </div>
                    <span className="errormsg">
                        {error?.assignedTo ? error?.assignedTo : ""}
                    </span>
                </div>
                <div className="col-md-3">
                    <div className='form-group'>
                        <label htmlFor="dependencies" className="control-label">Dependencies
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <input type="text" value={taskDetails?.dependencies ?? ''} id="dependencies"
                            className={`form-control ${error.dependencies && "error-border"
                                }`} onChange={handleInputChange} />
                        <span className="errormsg">
                            {error?.dependencies ? error?.dependencies : ""}
                        </span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskDueDate" className="control-label">
                            Due Date <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <input type="date"
                            min={moment().format('YYYY-MM-DD')}
                            max={edoc}
                            value={taskDetails?.taskDueDate ?? ''}
                            id="taskDueDate"
                            className={`form-control ${error.taskDueDate && "error-border"
                                }`} onChange={handleInputChange} />
                    </div>
                    <span className="errormsg">
                        {error.taskDueDate ? error.taskDueDate : ""}
                    </span>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskEstimatedTime" className="control-label">
                            Estimated Time <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className='form-row align-items-center'>
                            <div className="col-md-4">
                                <input
                                    type="number"
                                    className={`form-control ${error.hours && "error-border"}`}
                                    id="hours"
                                    name="hours"
                                    min={0}
                                    value={taskDetails.hours ??''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <label className="col-md-2 mb-0">
                                Hours
                            </label>
                            <div className="col-md-4">
                                <input
                                    type="number"
                                    className={`form-control ${error.minutes && "error-border"}`}
                                    id="minutes"
                                    name="minutes"
                                    min={0}
                                    value={taskDetails?.minutes ??''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <label className="col-md-2 mb-0">
                                Mins
                            </label>
                            <span className="errormsg">{error.hours ? error.hours : ""} {error.minutes ? error.minutes : ""}</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="taskTags" className="control-label">
                            Tags/labels
                            {/* <span className="text-danger font-20 pl-1 fld-imp">*</span> */}
                        </label>
                        <input type="text" value={inputTag}
                            id="taskTags"
                            className={`form-control ${error.taskTags && "error-border"}`}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    addTag();
                                }
                            }}
                        />
                    </div>
                    <div style={{ marginTop: '5px' }}>
                        <ul className="skel-top-inter doh-tags">
                            {tags.map((tag,key) => (
                                <li key={key}>
                                    {tag.label}
                                    <button onClick={() => removeTag(tag.value)}>x</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="remarks" className="control-label">
                            Remarks
                            <span className="text-danger font-20 pl-1 fld-imp">
                                *
                            </span>
                        </label>
                        <textarea
                            value={taskDetails?.remarks ?? ''}
                            className={`form-control ${error.remarks && "error-border"
                                }`}
                            id="remarks"
                            name="remarks"
                            rows="4"
                            maxLength="2500"
                            onChange={handleInputChange}
                        />
                        <span>Maximum 2500 characters</span>
                        <span className="errormsg">
                            {error.remarks && error.remarks}
                        </span>
                    </div>
                </div>
                <div className="col-md-12">
                    <FileUpload
                        data={{
                            currentFiles: taskFiles,
                            entityType: "TASK",
                            shouldGetExistingFiles: false,
                            permission: false,
                        }}
                        handlers={{
                            setCurrentFiles: setTaskFiles,
                        }}
                    />
                </div>
            </div>
            <div className="skel-btn-center-cmmn">
                <button
                    type="button"
                    className="skel-btn-cancel"
                    onClick={(e) => handleClear(e)}
                >
                    Clear
                </button>
                <button
                    type="button"
                    className="skel-btn-submit"
                    onClick={handleAddTask}
                >
                    Submit
                </button>
            </div>
        </div>
    )
}

export default AddEditTask