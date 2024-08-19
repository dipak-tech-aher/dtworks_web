import moment from 'moment'
import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { unstable_batchedUpdates } from 'react-dom'
import { get } from "../../../../../common/util/restUtil"
import { properties } from "../../../../../properties"

const InteractionFlowHistory = (props) => {
    //Props
    const { setIsModelOpen } = props?.stateHandlers
    const { isModelOpen, interactionDetails } = props?.data

    //States
    const [activeTab, setActiveTab] = useState(0)
    const [workflowHistory, setWorkflowHistory] = useState({ rows: [], count: 0 })
    const [followUpHistory, setFollowUpHistory] = useState({ rows: [], count: 0 })

    // Get Followup and Interaction History
    const getWorkflowHistory = useCallback(() => {
        if (interactionDetails?.intxnNo) {
            get(`${properties.INTERACTION_API}/history/${interactionDetails?.intxnNo}?getFollowUp=false&getAttachment=true`)
                .then((response) => {
                    if (response?.status === 200) { setWorkflowHistory(response?.data) }
                }).catch((error) => { console.error(error) })
                .finally()
        }

    }, [interactionDetails?.intxnNo])

    const getFollowUpHistory = useCallback(() => {
        if (interactionDetails?.intxnNo) {
            get(`${properties.INTERACTION_API}/history/${interactionDetails?.intxnNo}?getFollowUp=true&getAttachment=true`)
                .then((response) => { if (response?.status === 200) { setFollowUpHistory(response?.data) } })
                .catch((error) => {
                    console.error(error)
                }).finally()
        }
    }, [interactionDetails?.intxnNo])


    const handleOnTabChange = (idx) => { setActiveTab(idx) }

    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isWorkflowHistoryOpen: false })
            setActiveTab(0)
        })
    }

    const handleFileDownload = (id) => {
        get(`${properties.COMMON_API}/download-files/${id}`)
          .then((resp) => {
            if (resp?.data?.url) {
              if (resp?.data?.provider === 'DATABASE') {
                const downloadLink = document.createElement("a");
                downloadLink.href = `data:application/octet-stream;base64,${resp?.data?.url}`;
                downloadLink.download = resp?.data?.fileName; // Specify the file name here
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              } else {
                // console.log("Download URL =>", resp?.data?.url);
                const downloadLink = document.createElement("a");
                downloadLink.href = resp.data.url;
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              }
            }
          })
          .catch((error) => {
            console.error("error", error)
          })
          .finally(() => {
    
          })
      }

    useEffect(() => {
        if (interactionDetails?.intxnNo) {
            if (workflowHistory?.count === 0 && activeTab === 0) { getWorkflowHistory() }
            if (followUpHistory?.count === 0 && activeTab === 1) { getFollowUpHistory() }
        }
    }, [interactionDetails, activeTab, workflowHistory?.count, followUpHistory?.count, getWorkflowHistory, getFollowUpHistory])

    return (
        <Modal aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isWorkflowHistoryOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Interaction History</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="tabbable mt-2">
                    <ul className="nav nav-tabs" id={nanoid()} role="tablist">
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 0 ? 'active' : ''} `} onClick={() => handleOnTabChange(0)} id="cust-conv-tab" data-toggle="tab" href="#workflow" role="tab" aria-controls="workflowtab"
                                aria-selected="false">Workflow History</a>
                        </li>
                        <li className="nav-item">
                            <a c className={`nav-link ${activeTab === 1 ? 'active' : ''} `} onClick={() => handleOnTabChange(1)} id="profile-tab" data-toggle="tab" href="#followup" role="tab" aria-controls="followUptab"
                                aria-selected="true">Follow-Up History</a>
                        </li>
                    </ul>
                </div>
                {activeTab === 0 &&
                    <div className="timeline-workflow">
                        <ul>
                            {workflowHistory?.count > 0 && workflowHistory?.rows?.map((data) => (
                                <li key={nanoid()}>
                                    <div className="content">
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="fromEntityName" className="control-label">From Department/Role</label>
                                                    <span className="data-cnt">{data?.fromEntityName?.unitDesc ?? ""} -{" "}{data?.fromRoleName?.roleDesc ?? ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="toEntityName" className="control-label">To Department/Role</label>
                                                    <span className="data-cnt">{data?.toEntityName?.unitDesc ?? ""} -{" "}{data?.toRoleName?.roleDesc ?? ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="flwCreatedby" className="control-label">User</label>
                                                    <span className="data-cnt">{data?.flwCreatedby?.flwCreatedBy}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="statusDescription" className="control-label">Status</label>
                                                    <span className="data-cnt">{data?.statusDescription?.description}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="flowActionDesc" className="control-label">Action Performed</label>
                                                    <span className="data-cnt">{data?.flowActionDesc?.description}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label htmlFor="Attachment" className="control-label">Attachment</label>
                                                    <span className="data-cnt">
                                                        {(data?.AttachmentsDetails && data?.AttachmentsDetails?.length > 0) ? data?.AttachmentsDetails?.map((file) => (
                                                            <div className="attach-btn" title={`Click to download ${file.fileName}`} key={file.attachmentUuid} onClick={() => handleFileDownload(file.attachmentUuid)}>
                                                                <i className="fa fa-paperclip" aria-hidden="true"></i>
                                                                <span key={file.attachmentUuid} alt={file.fileName}>{file.fileName}</span>
                                                            </div>
                                                        )) :
                                                            <span>No Attachment</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label htmlFor="Interactiontype" className="control-label">Comments</label>
                                                    <span className="data-cnt" style={{ whiteSpace: 'pre-wrap' }}>
                                                        {data?.remarks}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="time">
                                        <h4>{moment(data?.intxnCreatedDate || new Date()).format("DD MMM YYYY hh:mm:ss A")}</h4>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>}

                {activeTab === 1 &&
                    <>
                        {followUpHistory.count > 0 ? <div className="timeline-workflow">
                            <ul>
                                {followUpHistory?.count > 0 && followUpHistory?.rows.map((data) => (
                                    <li>
                                        <div className="content">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">From Department/Role</label>
                                                        <span className="data-cnt">
                                                            {data?.fromEntityName?.unitDesc || ""} -{" "}
                                                            {data?.fromRoleName?.roleDesc || ""}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Servicetype" className="control-label">To Department/Role</label>
                                                        <span className="data-cnt">{data?.toEntityName?.unitDesc || ""} -{" "}{data?.toRoleName?.roleDesc || ""}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Channel" className="control-label">User</label>
                                                        <span className="data-cnt">{data?.flwCreatedby?.flwCreatedBy}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Status</label>
                                                        <span className="data-cnt">{data?.statusDescription?.description}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Servicetype" className="control-label">Action Performed</label>
                                                        <span className="data-cnt">{data?.flowActionDesc?.description}</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Servicetype" className="control-label"> Priority</label>
                                                        <span className="data-cnt"> {data?.priorityCodeDesc?.description}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Comments</label>
                                                        <span className="data-cnt">{data?.remarks}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="time"><h4>{moment(data?.intxnCreatedDate).format("DD MMM YYYY hh:mm:ss A")}</h4></div>
                                    </li>
                                ))}
                            </ul>
                        </div> :
                            <p className='skel-widget-warning'>No Records Found!!!</p>}
                    </>
                }
            </Modal.Body>
        </Modal>

    )
}

export default InteractionFlowHistory