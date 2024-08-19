import moment from "moment";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import { object, string } from 'yup';
import { AppContext } from "../../AppContext";
import FileUpload from "../../common/uploadAttachment/fileUpload";
import { getFullName } from "../../common/util/commonUtils";
import { get, put } from "../../common/util/restUtil";
import { properties } from "../../properties";

const EditTask = () => {

    let history = useNavigate()
    const { data, handlers } = useContext(AppContext)
    const { isModelOpen, taskData, permissions } = data
    const { setIsModelOpen } = handlers
    const { register, handleSubmit, setValue, formState: { errors } } = useForm()

    const [taskInputs, setTaskInputs] = useState()
    const [userLookup, setUserLookup] = useState([])
    const [roleLookUp, setRoleLookup] = useState([])
    const [currentFiles, setCurrentFiles] = useState([])
    const [existingFiles, setExistingFiles] = useState([])
    const [taskStatusLookup, setTaskStatusLookup] = useState([])

    const isRoleChangedByUserRef = useRef()
    const userLookupRef = useRef()
    const taskWorkflowRef = useRef()
    const [formErrors, setFormErrors] = useState({})

    const taskSchema = object({
        taskStatus: string().required().label('Status'),
    })

    const handleOnClose = () => {
        setIsModelOpen({ ...isModelOpen, isEditOpen: false })
        setFormErrors({})
    }

    const validateData = async (schema, data) => {
        return new Promise((resolve, reject) => {
            schema.validate(data, { abortEarly: false }).then(function () {
                resolve({ success: true });
            }).catch(function (err) {
                let errors = {};
                err.inner.forEach(e => {
                    errors[e.path] = e.message;
                });
                resolve({ failure: errors });
            });
        });
    }

    const onSubmit = async (e) => {
        e.preventDefault()
        setFormErrors({});
        const validationResponse = await validateData(taskSchema, taskInputs);
        if (validationResponse.success) {
            const reqBody = {
                ...taskInputs,
                attachments: [
                    ...currentFiles.map((current) => current.entityId),
                ]
            }

            put(`${properties.LEAD_API}/task/update/${taskData.taskUuid}`, reqBody)
                .then((resp) => {
                    if (resp.status === 200) {
                        history("/tasks-list");
                        toast.success(resp.message);
                    }
                }).catch(e => console.error())
        } else {
            setFormErrors({ ...validationResponse?.failure ?? {} })
            toast.error("Please fill the mandatory fields")
        }
    }

    const getExistingTaskWorkflow = useCallback(() => {
        if (taskData?.taskUuid && isModelOpen.isEditOpen) {
            get(`${properties.WORKFLOW_DEFN_API}/get-status?entityId=${taskData?.taskUuid}&entity=TASK`)
                .then((resp) => {
                    if (resp.status === 200) {
                        const statusArray = [];
                        resp.data?.entities?.forEach(node => {
                            node.status?.forEach(status => {
                                statusArray.push(status)
                            })
                        })
                        let statusLookup = [
                            ...new Map(
                                statusArray.map((item) => [item["code"], item])
                            ).values(),
                        ];
                        unstable_batchedUpdates(() => {
                            taskWorkflowRef.current = resp.data ? { ...resp.data } : {}
                            setTaskStatusLookup(statusLookup)
                        })
                    }
                })
                .catch((error) => console.error(error))
        }
    }, [taskData?.taskUuid, isModelOpen.isEditOpen])

    useEffect(() => {
        if (permissions?.edit) {
            getExistingTaskWorkflow();
        }
    }, [getExistingTaskWorkflow, permissions?.edit]);

    const getUsersBasedOnRole = useCallback(() => {
        if ((taskInputs?.taskAssignedRole && taskInputs?.taskAssignedDept)) {
            const data = {
                roleId: taskInputs?.taskAssignedRole,
                deptId: taskInputs?.taskAssignedDept
            }

            get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
                .then((userResponse) => {
                    const { data } = userResponse
                    unstable_batchedUpdates(() => {
                        const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
                        userLookupRef.current = formattedResponse
                        setUserLookup(formattedResponse)
                    })
                }).catch(error => console.error(error))
                .finally()
        }
    }, [taskInputs])

    useEffect(() => {
        if (taskInputs?.taskAssignedRole && !userLookupRef?.current) {
            getUsersBasedOnRole();
        }
    }, [getUsersBasedOnRole, taskInputs])

    const handleOnTicketDetailsInputsChange = (e) => {
        setFormErrors({})
        const { target } = e
        if (target.id === "taskAssignedRole") {
            const { unitId = "" } = target.value && JSON.parse(target.options[target.selectedIndex].dataset.entity)
            unstable_batchedUpdates(() => {
                setTaskInputs({ ...taskInputs, taskAssignedDept: unitId, [target.id]: target.value })
                isRoleChangedByUserRef.current = true;
                userLookupRef.current = undefined
                setUserLookup([])
            })
        } else {
            setTaskInputs({ ...taskInputs, [target.id]: target.value })
        }
    }

    const handleStatusChange = (e) => {
        e.preventDefault()
        const { target } = e
        let entity = []
        handleOnTicketDetailsInputsChange(e)
        taskWorkflowRef.current && taskWorkflowRef.current?.entities?.forEach((unit) => {
            for (const property in unit?.status) {
                if (unit.status[property].code === target.value) {
                    entity.push(unit);
                    break
                }
            }
        })
        unstable_batchedUpdates(() => {
            setValue("assignRole", "");
            setRoleLookup(entity);
        })
    }

    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen.isEditOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Edit Task - {taskData?.taskName}</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="mx-2">
                    <Form onSubmit={onSubmit}>
                        <div className="clearfix"></div>
                        <div className="row pt-2">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="taskStatus" className="control-label">Status<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control" id="taskStatus" value={taskInputs?.taskStatus ?? ''} {...register("taskStatus", { required: 'This is required' })} onChange={(e) => { handleStatusChange(e) }}>
                                        <option value="">Select</option>
                                        {taskStatusLookup &&
                                            taskStatusLookup?.map((currStatus, index) => (
                                                <option key={index} value={currStatus?.code}>{currStatus?.description}</option>
                                            ))}
                                    </select>
                                    {formErrors.taskStatus && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskStatus}</span>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-4" hidden={!permissions.taskAssignedRole}>
                                <div className="form-group">
                                    <label htmlFor="taskAssignedRole" className="control-label">Department/Role
                                        {/* <span className="text-danger font-20 pl-1 fld-imp">*</span> */}
                                    </label>
                                    <div className="custselect">
                                        <select className="form-control" id="taskAssignedRole" {...register("taskAssignedRole")} value={taskData?.taskAssignedRole} onChange={handleOnTicketDetailsInputsChange}>
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
                                        {errors?.taskAssignedRole && <span className="errormsg">{errors.taskAssignedRole.message}</span>}

                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4" hidden={!permissions.taskAssignedTo}>
                                <div className="form-group">
                                    <label htmlFor="user" className="control-label">Assign To</label>
                                    <ReactSelect
                                        className="w-100"
                                        options={userLookup}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                        value={taskInputs?.taskAssignedTo ? userLookup.find(c => c?.value === taskInputs?.taskAssignedTo) : null}
                                        onChange={(val) => { setTaskInputs({ ...taskInputs, taskAssignedTo: val?.userId }) }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4" hidden={!permissions.taskDueDate}>
                                <div className="form-group">
                                    <label htmlFor="user" className="control-label">Due Date</label>
                                    <input className="form-control" id="taskDueDate" placeholder=""
                                        type="date"
                                        min={moment().format('YYYY-MM-DD')}
                                        onChange={handleOnTicketDetailsInputsChange}
                                        value={taskInputs?.taskDueDate ?? ''}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row ">
                            <div className="col-md-12">
                                <span className="font-weight-bold mt-2 d-flex mb-2">Attachments</span>
                            </div>
                            <div className="col-md-12">
                                <div className="attachment-details">
                                    <FileUpload
                                        data={{
                                            currentFiles: currentFiles,
                                            entityType: 'TASK',
                                            existingFiles: existingFiles,
                                            interactionId: taskData?.taskUuid,
                                            permission: false
                                        }}
                                        handlers={{
                                            setCurrentFiles: setCurrentFiles,
                                            setExistingFiles: setExistingFiles
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="Contactpreferenece" className="control-label">Remarks</label>
                                    <textarea className="form-control" maxLength="2500" id="remarks" name="remarks" rows="4" onChange={handleOnTicketDetailsInputsChange}></textarea>
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