import moment from "moment";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import reminder from "../../assets/images/reminder.svg";
import FileUpload from "../../common/uploadAttachment/fileUpload";
import { getColorClass, getFullName } from "../../common/util/commonUtils";
import { DefaultDateFormate } from "../../common/util/dateUtil";
import { toast } from "react-toastify";
import { get, put } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { handleOnAttchmentDownload } from "../../common/util/util";

const TaskDetails = (props) => {
    const { taskDetails, taskList, isModelOpen, existingFiles, currentFiles, appConfig, auth, taskPermissions, tasks, refresh } = props?.data
    const { setTaskDetails, setIsModelOpen, setCurrentFiles, setExistingFiles, setRefresh } = props?.stateHandlers
    const [assignedTask, setAssignedTask] = useState()
    const [taskFiles, setTaskFiles] = useState([])

    const reminderDate = useMemo(() => {
        const currentDate = moment()
        const CompletionDate = taskDetails?.edoc ? moment(taskDetails?.edoc) : undefined
        if (CompletionDate) {
            return CompletionDate.diff(currentDate, 'days')
        }
        return undefined
    }, [taskDetails?.edoc])

    //To find remaining hours of the day
    const reminderHours = useMemo(() => {
        const currentDate = moment();
        const eod = moment().endOf('day');
        if (!reminderDate) {
            return eod.diff(currentDate, 'hours')
        }
        return undefined
    }, [reminderDate])

    const handleOnChange = (e) => {
        const { target } = e
        setIsModelOpen({ ...isModelOpen, [target.id]: true })
    }

    const handleOnTaskNameChange = (e) => {
        const { target } = e
        if (target.id === 'taskName') {
            const task = taskList.filter(f => f.taskNo === target.value)
            setTaskDetails(task?.[0])
            setAssignedTask()
        }
    }


    const handleOnAssignToSelf = (type) => {
        if (taskDetails?.taskNo && type) {
            put(`${properties.TASK_API}/assignSelf/${taskDetails.taskNo}`, {
                type
            }).then((response) => {
                toast.success(`${response.message}`)
                setAssignedTask(taskDetails.taskNo)
                setRefresh(!refresh)
            }).catch((error) => {
                console.error(error)
            }).finally();
        }

    };
   
    const getAttachments = useCallback((type) => {
        if (taskDetails?.taskUuid && type) {
            get(`${properties.ATTACHMENT_API}?entity-id=${taskDetails?.taskUuid}&entity-type=${type}`).then((response) => {
                if (response.data && response.data.length) {
                    setTaskFiles(response.data);
                }
            }).catch((error) => {
                console.error("error", error)
            }).finally()
        }
    }, [taskDetails?.taskUuid])

    useEffect(() => {
        getAttachments('TASK');
    }, [getAttachments, refresh]);

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-flex-card-wrap">
                <div className="skel-btns ml-auto">
                    <button className={taskPermissions.edit ? "skel-btn-submit" : "d-none"} id="isTaskEditOpen" onClick={handleOnChange}>
                        Edit Task
                    </button>
                    <button className={taskPermissions.assignToSelf ? "skel-btn-submit" : "d-none"} id="isAssignToSelfOpen" onClick={() => { handleOnAssignToSelf('SELF') }}>
                        Assign to Self
                    </button>
                </div>
            </div>
            <hr className="cmmn-hline mt-2" />
            <div className="view-int-details-key skel-tbl-details">
                <table>
                    <tr>
                        <td><span className="font-weight-bold">Task Name</span></td>
                        <td width="5%">:</td>
                        <td>{
                            <div className="col-8" style={{ marginLeft: '0px', paddingLeft: '0px' }}>
                                <select className="form-control" onChange={handleOnTaskNameChange} value={assignedTask ? assignedTask : taskDetails.taskNo} id="taskName">
                                    {!!tasks.length && tasks.map((data, key) => (
                                        <option key={key} value={data.code}>{data.value}</option>
                                    ))}
                                </select>
                            </div>
                        }</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Description</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.taskDescription ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Priority</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.taskPriority?.description ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Status</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.taskStatus?.description ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Responsible Party</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.currentUser?.description?.firstName ?? '-'} {taskDetails?.currentUser?.description?.lastName ?? ''}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Dependencies</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.dependencies ?? '-'}</td>
                    </tr>
                </table>
                <table className="ml-4">
                    <tr>
                        <td><span className="font-weight-bold">Due Date</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.dueDate ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Estimated Time</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.estimatedTime ? (taskDetails?.estimatedTime?.hours ?? 0) + ' hours ' + (taskDetails?.estimatedTime?.minutes ?? 0) + ' minutes' : '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Actual Time</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.actualTime ? (taskDetails?.actualTime?.hours ?? 0) + ' hours ' + (taskDetails?.actualTime?.minutes ?? 0) + ' minutes' : '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Department/Role</span></td>
                        <td width="5%">:</td>
                        <td>{taskDetails?.currentDepartment?.description?.unitDesc ?? '-'}/ {taskDetails?.currentRole?.description?.roleDesc ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Tags/Labels</span></td>
                        <td width="5%">:</td>
                        <td className="font-weight-bold">
                            <ul className="skel-top-inter doh-tags m-0">
                                {taskDetails?.tags?.map((tag, i) => (
                                    <li key={i}>{tag}</li>
                                ))}
                            </ul>
                        </td>
                        {/* <td className="font-weight-bold">{taskDetails?.tags ?? '-'}</td> */}

                    </tr>
                    {reminderDate !== undefined && <tr>
                        <td colSpan="3">
                            <div className="jumbotron bg-white border px-2 py-2 w-60 mt-2">
                                <div className="row align-items-center">
                                    <div className="col-md-7 text-center">
                                        <p className="mb-0 mb-0 d-block p-0 line-height-normal">
                                            {reminderDate < 0 ?
                                                <div>Task is<strong> overdue</strong> for more than <strong>{Math.abs(reminderDate)} days</strong> </div>
                                                : reminderDate === 0 ? <div><strong>{reminderHours} more hours</strong> is Task completion date</div>
                                                    : <div><strong>{reminderDate} more days</strong> to go for Task Completion</div>}
                                        </p>
                                    </div>
                                    <div className="col-md">
                                        <img src={reminder} alt={'remider'} width="170" className="img-fluid" />
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>}
                </table>
            </div>
            {taskFiles && taskFiles.length > 0 && <>
                <span className="font-weight-bold mt-2 d-flex mb-2">
                    Attachment
                </span>

                <div className="attachment-details">
                    {taskFiles && taskFiles.length > 0 && taskFiles.map((attachment, i) => {
                        let { fileName = false, attachmentUuid } = attachment
                        return (
                            <span className="img-attachment cursor-pointer" key={i} onClick={() => handleOnAttchmentDownload(attachmentUuid)}>
                                <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                                {fileName ? fileName : ''}
                            </span>
                        )
                    })}
                </div>
            </>}
            {/* <div>
                <span className="font-weight-bold mt-2 d-flex mb-2">Attachments</span>
                <div className="attachment-details">
                    <FileUpload
                        data={{
                            currentFiles: currentFiles,
                            entityType: 'TASK',
                            existingFiles: existingFiles,
                            interactionId: taskDetails?.taskUuid,
                            permission: true
                        }}
                        handlers={{
                            setCurrentFiles: setCurrentFiles,
                            setExistingFiles: setExistingFiles
                        }}
                    />
                </div>
            </div> */}
        </div >
    )

}


export default TaskDetails