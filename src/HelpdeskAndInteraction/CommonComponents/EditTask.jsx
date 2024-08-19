import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import FileUpload from "../../common/uploadAttachment/fileUpload";
import { getFullName } from "../../common/util/commonUtils";
import { get, put, slowPut } from "../../common/util/restUtil";
import { properties } from "../../properties";

const EditTask = (props) => {

    let history = useNavigate()
    const currentWorkflowRef = useRef()
    const { setIsModelOpen, setRefresh } = props?.stateHandlers
    const { isModelOpen, taskDetails, appConfig, auth, permissions, slaEdoc, refresh } = props?.data
    const [taskInputs, setTaskInputs] = useState()
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [currStatusLookup, setCurrStatusLookup] = useState([])
    const [currTasksLookup, SetcurrTasksLookup] = useState([])
    const { register, handleSubmit, setValue, formState: { errors } } = useForm()
    const isRoleChangedByUserRef = useRef()
    const [roleLookUp, setRoleLookup] = useState([])
    const [roleLookUpBkp, setRoleLookupBkp] = useState([])
    const [workflowLookup, setWorkflowLookup] = useState();


    const userLookupRef = useRef()
    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isTaskEditOpen: false })
            setTaskInputs({})
        })
    }
    const onSubmit = () => {
        if (!taskInputs?.remarks || taskInputs?.remarks === "") {
            toast.error('Remarks Required.')
            return false
        }

        let reqBody = {
            taskRole: Number(taskInputs?.taskRole),
            taskDept: taskInputs?.taskDept,
            taskStatus: taskInputs?.taskStatus
        }
        if (taskInputs?.remarks) {
            reqBody.remarks = taskInputs?.remarks;
        }

        put(properties.TASK_API + "/update/" + taskDetails.taskUuid, {
            ...reqBody,
        })
            .then((response) => {
                toast.success(`${response?.message}`);
                handleOnClose()
                setRefresh(!refresh)
            })
            .catch((error) => {
                console.error(error);
                toast.error(error);
            })
            .finally();
    }

    const handleInputsChange = (selected, id) => {
        const { target } = selected;

        if (target.id === "taskRole") {          
            const { unitId = "" } = target?.value !== "" && JSON.parse(target.options[target.selectedIndex].dataset.entity);
            setTaskInputs({ ...taskInputs, [target.id]: target.value, taskDept: unitId })
        } else {
            setTaskInputs(prevState => ({
                ...prevState,
                [target.id]: target.value
            }));
        }
    };

    const handleStatusChange = (e) => {
        e.preventDefault()
        const { target } = e
        let entity = []
        handleInputsChange(e)
        workflowLookup && workflowLookup?.entities?.forEach((unit) => {
            for (const property in unit?.status) {
                if (unit.status[property].code === target.value) {
                    entity.push(unit);
                    break
                }
            }
        })
        setValue("taskRole", "");
        if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
            entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
            setTaskInputs({
                ...taskInputs,
                [target.id]: target.value,
                taskRole: entity?.[0]?.roles?.[0].roleId,
                taskDept: entity?.[0]?.entity?.[0]?.unitId
            })
            setValue("taskRole", entity?.[0]?.roles?.[0].roleId);
        }

        setRoleLookup(entity);
    }

    const getTaskWorkflowState = useCallback(() => {
        if (taskDetails?.currentDepartment) {
            get(`${properties.WORKFLOW_DEFN_API}/get-status?entityId=${taskDetails?.taskUuid}&entity=TASK`)
                .then((response) => {
                    if (response.status === 200 && response?.data) {
                        const { data } = response
                        const { flow = '' } = data
                        if (flow !== "DONE") {
                            let statusArray = [], tasksArray = [];
                            response?.data?.entities?.forEach(node => {
                                node.status?.forEach(status => {
                                    statusArray.push(status);
                                })
                                node.task?.forEach(task => {
                                    tasksArray.push(task);
                                })

                            })
                            let statusLookup = [
                                ...new Map(
                                    statusArray.map((item) => [item["code"], item])
                                ).values(),
                            ];
                            let TasksLookup = [
                                ...new Map(
                                    tasksArray.map((item) => [item["taskName"], item])
                                ).values(),
                            ];
                            // const statusLookup = [...statuses]
                            unstable_batchedUpdates(() => {
                                currentWorkflowRef.current = data
                                setWorkflowLookup(data)
                                setCurrStatusLookup(statusLookup);
                                SetcurrTasksLookup(TasksLookup);
                            })
                        }

                    }
                })
        }
    }, [taskDetails?.currentDepartment, taskDetails?.taskUuid])

    useEffect(() => {
        getTaskWorkflowState();
    }, [getTaskWorkflowState, taskDetails]);

    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setMenuIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (

        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen.isTaskEditOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Edit Task</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="mx-2">
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="clearfix"></div>
                        <div className="row pt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="control-label">Task Name</label>
                                    <span disabled>{taskDetails?.taskName}</span>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="control-label">Description</label>
                                    <textarea disabled>
                                        {taskDetails?.taskDescription}
                                    </textarea>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label className="control-label">Priority</label>
                                    <span disabled>{taskDetails?.taskPriority?.description}</span>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="taskStatus" className="control-label">Status<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control" id="taskStatus" value={taskInputs?.taskStatus ?? ''} {...register("taskStatus", { required: 'This is required' })} onChange={(e) => { handleStatusChange(e) }}>
                                        <option value="">Select</option>
                                        {currStatusLookup &&
                                            currStatusLookup?.map((currStatus, index) => (
                                                <option key={index} value={currStatus?.code}>{currStatus?.description}</option>
                                            ))}
                                    </select>
                                    {errors?.taskStatus && <span className="errormsg">{errors.taskStatus.message}</span>}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="taskRole" className="control-label">Department/Role <span
                                        className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custselect" ref={selectRef}>
                                        <select className={`form-control ${errors.taskRole && "error-border"}`} id="taskRole" value={taskDetails?.taskRole} onChange={handleInputsChange}>
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
                                        {errors?.taskRole && <span className="errormsg">{errors.taskRole.message}</span>}

                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="Contactpreferenece" className="control-label">Remarks</label>
                                    <textarea className="form-control" maxLength="2500" id="remarks" name="remarks" rows="4" onChange={handleInputsChange}></textarea>
                                    <span className="skel-fnt-xs">Maximum 2500 characters</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-12 pl-2">
                            <div className="form-group pb-1">
                                <div className="d-flex justify-content-center">
                                    <button type="button" className="skel-btn-cancel" onClick={handleOnClose}>Cancel</button>
                                    <button type="submit" className="skel-btn-submit">Submit</button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default EditTask;
