import { nanoid } from "nanoid";
import React, { useContext } from "react";
import { AppContext } from "../../AppContext";
import { getFullName } from "../../common/util/commonUtils";
import { DefaultDateFormate } from "../../common/util/dateUtil";
import { useHistory }from "../../common/util/history";
import { properties } from "../../properties";

const EditTaskHeaders = () => {
    const { data } = useContext(AppContext)
    const { taskData } = data
    const history = useHistory()
    return (
        <React.Fragment>
            <div className="cmmn-skeleton mt-2" key={nanoid()}>
                <div className="skel-i360-base">
                    <div className="skel-intcard">
                        <div className="skel-flex-card-int" key={nanoid()}>
                            <span className="skel-profile-heading mb-0">{taskData?.taskName ?? ''}</span>
                            <span className="status-new ml-1 skel-d-status">{taskData?.statusDesc?.description ?? ''}</span>
                            <span className="skel-h-status">{taskData?.priorityDesc?.description ?? ''}</span>
                        </div>
                        {taskData?.leadDetails?.leadName && <div className="my-1" key={nanoid()}>
                            <i className="fa fa-link" aria-hidden="true" />
                            <span className="txt-underline cursor-pointer" style={{ color: 'rgb(6 88 242)' }}
                                onClick={() => {
                                    history("/leads-edit?leadUuid=" + taskData?.leadDetails?.leadUuid)
                                }}> {taskData?.leadDetails?.leadName ?? ''}</span>
                        </div>}
                        {taskData?.createdUserDetails && <span key={nanoid()} className="skel-int-cr-date">{getFullName(taskData?.createdUserDetails) ?? ''} | Last Created at: {taskData?.createdAt ? DefaultDateFormate(taskData?.createdAt, 'DD-MM-YYYY HH:mm:ss A') ?? '-' : '-'}</span>}
                        {/* {(taskData?.taskName) &&
                            <span className="skel-int-statement" key={nanoid()}>
                                <blockquote>{
                                    taskData?.taskName ?? ''
                                }</blockquote>
                            </span>} */}
                    </div>
                </div>
            </div >
        </React.Fragment>

    )
}

export default EditTaskHeaders;