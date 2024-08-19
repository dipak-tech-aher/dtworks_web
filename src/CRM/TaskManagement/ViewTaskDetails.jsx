import React, { useContext, useMemo } from "react";
import { AppContext } from "../../AppContext";
import { DefaultDateFormate } from "../../common/util/dateUtil";
import FileUpload from "../../common/uploadAttachment/fileUpload";


const ViewTaskDetails = () => {
    const { data, handlers } = useContext(AppContext)
    const { permissions, taskData, isModelOpen, currentFiles, existingFiles } = data
    const { handleOnAssignToSelf, setIsModelOpen, setCurrentFiles, setExistingFiles } = handlers

    const MenuList = useMemo(() => [
        { module: 'Task', flag: 'Edit Task', id: 'isEditOpen', className: "skel-btn-submit", isEnabled: permissions.edit },
        { module: 'Task', flag: 'Assign To Self', id: 'isAssignToSelfOpen', className: "skel-btn-submit", fn: handleOnAssignToSelf, fnIncluded: true, type: 'SELF', isEnabled: permissions.assignToSelf }

    ], [handleOnAssignToSelf, permissions])

    const handleOnChange = (e) => {
        const { target } = e
        setIsModelOpen({ ...isModelOpen, [target.id]: true })
    }

    return (
        <React.Fragment>
            <div className="cmmn-skeleton mt-2">
                <div className="skel-flex-card-wrap">
                    <div className="skel-btns ml-auto">
                        {MenuList &&
                            MenuList?.map((item, index) => (
                                item?.fnIncluded ? (
                                    <button className={item?.className} key={index} id={item?.id} onClick={() => item?.fn(item.type)} hidden={!item.isEnabled}>
                                        {item?.flag}
                                    </button>) : (
                                    <button className={item?.className} key={index} id={item?.id} onClick={handleOnChange} hidden={!item.isEnabled}>
                                        {item?.flag}
                                    </button>
                                )
                            ))}
                    </div>
                </div>
                <hr className="cmmn-hline mt-2" />
                <div className="skel-tabs-role-config p-2">
                    <div className="col-md-12">
                        {/* <div className="row">
                            {permissions?.Edit && permissions?.readOnly &&
                            <div className="col-6 text-right mb-2">
                                <button className="btn btn-primary btn-sm" onClick={() => setPermissions({ ...permissions, readOnly: false })}>
                                    Edit
                                </button>
                            </div>
                        </div> */}
                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Stakeholder Name</label>
                                    <p>{taskData?.leadDetails?.leadName ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Mission Name</label>
                                    <p>{taskData?.missionDetails?.missionName ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Task Name</label>
                                    <p>{taskData?.taskName ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Priority</label>
                                    <p>{taskData?.priorityDesc?.description ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Status</label>
                                    <p>{taskData?.statusDesc?.description ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Department</label>
                                    <p>{taskData?.departmentDetails?.unitDesc ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Role</label>
                                    <p>{taskData?.roleDetails?.roleDesc ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Assign To</label>
                                    <p>{taskData?.assignedToDetails?.fullName ?? '-'}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Due Date</label>
                                    <p>{taskData?.dueDate ? DefaultDateFormate(taskData?.dueDate) : ''}</p>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label">Tags</label>
                                    <p>{taskData?.tags ? taskData?.tags.map((tag) => tag).join(',') : ''}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label" style={{ whiteSpace: 'pre-wrap' }}>Task Description</label>
                                    <p>{taskData?.taskDescription ?? ''}</p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="stakeholder" className="control-label" style={{ whiteSpace: 'pre-wrap' }}>Remarks</label>
                                    <p>{taskData?.txnDetails?.[taskData?.txnDetails?.length - 1]?.remarks ?? ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <span className="font-weight-bold mt-2 d-flex mb-2">Attachments</span>
                    <div className="attachment-details">
                        <FileUpload
                            data={{
                                currentFiles: currentFiles,
                                entityType: 'TASK',
                                existingFiles: existingFiles,
                                interactionId: taskData?.taskUuid,
                                permission: true
                            }}
                            handlers={{
                                setCurrentFiles: setCurrentFiles,
                                setExistingFiles: setExistingFiles
                            }}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default ViewTaskDetails;