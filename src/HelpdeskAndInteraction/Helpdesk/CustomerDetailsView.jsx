import moment from 'moment';
import React, { useState, useEffect } from 'react';
import DynamicTable from '../../common/table/DynamicTable';
import { CustomerDetailsViewColumns } from './CustomerDetailsViewColumn';
import CreateInteraction from './interactionModal';
import { Element } from 'react-scroll';
import { post, get } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { useNavigate, useLocation } from 'react-router-dom';
import { statusConstantCode } from '../../AppConstants';
import { toast } from 'react-toastify';
import { RegularModalCustomStyles } from "../../common/util/util";
import Modal from "react-modal";

const CustomerDetailsView = (props) => {
    const location = useLocation();

    let { detailedViewItem, customerDetails, helpdeskId, readOnly } = props.data;
    // console.log({ helpdeskId })
    if (helpdeskId) {
        detailedViewItem['interactionDetails'] = detailedViewItem?.interactionDetails?.filter(x => x.helpdeskId == helpdeskId);
    }
    const { doSoftRefresh } = props.handler
    const [createInteraction, setCreateInteraction] = useState(false);
    const history = useNavigate();
    const [isWorflowHistoryOpen, setIsWorkflowHistoryOpen] = useState(false);
    const [isFollowUpHistoryOpen, setIsFollowUpHistoryOpen] = useState(false);
    const [interactionData, setInteractionData] = useState({});
    const [workflowHistory, setWorkflowHistory] = useState({
        rows: [],
        count: 0,
    });
    const [followUpHistory, setFollowUpHistory] = useState({
        rows: [],
        count: 0,
    });
    const [isTruncated, setIsTruncated] = useState(true);


    useEffect(() => {
        // console.log('Current route:', location.pathname?.split('/')[3]);
        if (helpdeskId && detailedViewItem['interactionDetails'] && detailedViewItem['interactionDetails']?.length > 0 && location.pathname?.includes("view-helpdesk-ticket")) {
            get(
                `${properties.INTERACTION_API}/history/${detailedViewItem['interactionDetails']?.[0]?.intxnNo}?getFollowUp=false&getAttachment=true`
            )
                .then((response) => {
                    if (response?.data && response?.data) {
                        setWorkflowHistory(response?.data);
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();

            // get Interaction Followup History
            get(
                `${properties.INTERACTION_API}/history/${detailedViewItem['interactionDetails']?.[0]?.intxnNo}?getFollowUp=true&getAttachment=true`
            )
                .then((response) => {
                    if (response?.data && response?.data) {
                        setFollowUpHistory(response?.data);
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();
        }
    }, [])

    const toggleTruncate = () => {
        setIsTruncated(!isTruncated);
    };


    const handleFileDownload = (id) => {
        get(`${properties.COMMON_API}/download-files/${id}`)
            .then((resp) => {
                if (resp?.data?.url) {
                    const downloadLink = document.createElement("a");
                    downloadLink.href = resp.data.url;
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }
            })
            .catch((error) => {
                console.error("error", error)
            })
            .finally(() => {

            })
    }


    const getCustomerDataForComplaint = () => {
        // console.log('customerDetails======>', customerDetails);
        if (customerDetails && customerDetails?.source !== 'PROFILE') {
            const requestParam = {
                customerNo: customerDetails?.profileNo,
                status: ['CS_ACTIVE', 'CS_PEND', 'CS_TEMP', 'CS_PROSPECT']
            }

            post(`${properties.CUSTOMER_API}/get-customer?limit=${1}&page=${0}`, requestParam)
                .then((resp) => {
                    if (resp?.data) {
                        if (resp?.status === 200) {
                            const data = resp?.data?.rows?.[0]
                            if (data) {
                                data.source = statusConstantCode.entityCategory.HELPDESK
                                data.helpdeskDetails = detailedViewItem || {}
                                history(`/create-interaction`, { state: {data} })
                            }
                        }
                    } else {
                        toast.error('No Customer details Found')
                    }
                }).catch((error) => {
                    console.error(error);
                    toast.error('No Customer details Found')
                })
                .finally();

        } else {
            const requestParam = {
                profileNo: customerDetails?.profileNo,
                status: 'AC'
            }
            post(`${properties.PROFILE_API}/search`, requestParam).then((resp) => {
                if (resp?.data && resp?.status === 200) {
                    // console.log('resp --------------->', resp)
                    // let data = {
                    //     helpdeskDetails: detailedViewItem || {}
                    // }
                    // history(`/create-interaction`, { data })
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }

    const handleCreateInteraction = () => {
        getCustomerDataForComplaint();
        // setCreateInteraction(true)
    }

    const redirectToRespectivePages = (e, rows) => {
        const data = {
            intxnNo: rows?.intxnNo,
            customerUid: rows?.customerUid,
            sourceName: 'customer360'
        }
        history(`/interaction360`, { state: {data} })
    }

    const handleCellRender = (cell, row) => {
        if (['Created On', 'Updated On'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD-MMM-YYYY HH:MM:SS A') : '-'}</span>)
        } else if (cell.column.Header === "Interaction Number") {
            return (<span className="text-secondary" style={{ cursor: "pointer" }} onClick={(e) => redirectToRespectivePages(e, row.original)}>{cell.value}</span>)
        } else {
            return (<span>{cell.value || '-'}</span>)
        }
    }


    return (
        <>
            <div className="col-12 row pt-2 m-0 helpdesk-padding-left-0 skel-interaction-detail-section">
                {
                    // (customerDetails && customerDetails.customer && customerDetails.customer.customerId > 0) ?
                    (customerDetails && customerDetails !== null && customerDetails?.profileId && customerDetails.profileNo) ?
                        <>
                            <Element>
                                <table>
                                    <tr>
                                        <td width="100%" className='form-label'>Profile ID</td>
                                        <td width="5">:</td>
                                        <td width="25%">{customerDetails?.customer?.crmCustomerNo || customerDetails?.profileNo}</td>
                                    </tr>
                                    <tr>
                                        <td width="100%" className='form-label'>Full Name</td>
                                        <td width="5%">:</td>
                                        <td width="25%">{customerDetails?.customer?.fullName || ((customerDetails?.firstName || "") + ' ' + (customerDetails?.lastName || ""))}</td>
                                    </tr>
                                    {/* <tr>
                                        <td width="100%" className='form-label'>Customer Type</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.profileCategory?.description}</td>
                                    </tr> */}
                                    <tr>
                                        <td width="100%" className='form-label'>Contact Number</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.contactDetails?.mobileNo}</td>
                                    </tr>
                                    {/* <tr>
                                        <td width="100%" className='form-label'>ID Type</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.idType?.description}</td>
                                    </tr>
                                    <tr>
                                        <td width="100%" className='form-label'>ID Value</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.idValue}</td>
                                    </tr> */}
                                    <tr>
                                        <td width="100%" className='form-label'>Email</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.contactDetails?.emailId}</td>
                                    </tr>
                                    <tr>
                                        <td width="100%" className='form-label'>Cc Email</td>
                                        <td width="5%">:</td>
                                        <td width="50%" onClick={toggleTruncate}>{detailedViewItem?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n")}</td>
                                    </tr>
                                    <tr>
                                        <td width="100%" className='form-label'>Contact Preference</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{customerDetails?.contactPreferences ? customerDetails?.contactPreferences.map((e) => { return ' ' + e.description }) : ''}</td>
                                    </tr>
                                </table>
                                {/* <div className="col-12 row pt-2">
                            <div className="col-6 pl-0">
                                <div className="form-label ">Profile ID:</div>
                                <div className="form-vtext">{customerDetails?.customer?.crmCustomerNo || customerDetails?.profileNo}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">Full Name:</div>
                                <div className="form-vtext">{customerDetails?.customer?.fullName || ( (customerDetails?.firstName || "") + ' ' + (customerDetails?.lastName || "")  )}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-6 pl-0">
                                <div className="form-label ">Customer Type:</div>
                                <div className="form-vtext text-capitalize">{customerDetails?.profileCategory?.description}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">Contact Number:</div>
                                <div className="form-vtext">{customerDetails?.contactDetails?.mobileNo}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-6 pl-0">
                                <div className="form-label ">ID Type:</div>
                                <div className="form-vtext">{customerDetails?.idType?.description}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">ID Value:</div>
                                <div className="form-vtext">{customerDetails?.idValue}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-12 pl-0">
                                <div className="form-label ">Email:</div>
                                <div className="form-vtext text-break">{customerDetails?.contactDetails?.emailId}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-12 pl-0">
                                <div className="form-label ">Contact Preference :</div>
                                <div className="form-vtext">{customerDetails?.contactPreferences ? customerDetails?.contactPreferences.map((e)=> {return ' '+e.description}) : ''}</div>
                            </div>
                        </div> */}
                            </Element>
                        </>
                        :
                        <></>
                }


                {

                    (customerDetails && customerDetails !== null && customerDetails?.profileId && customerDetails.profileNo) ?
                        <Element>
                            <div>
                                <hr className='cmmn-hmline' />
                                <div className="skel-helpdeskinfo-search mt-2">
                                    <span style={{ display: "flex" }}>
                                        <h5 id="list-item-0">Interaction History</h5>
                                        {location.pathname?.includes("view-helpdesk-ticket") && <button
                                            className="skel-btn-submit"
                                            data-target="#skel-view-modal-workflow"
                                            data-toggle="modal"
                                            onClick={() => setIsWorkflowHistoryOpen(true)}
                                        >
                                            Workflow History
                                        </button>}
                                    </span>
                                    <div className={`text-right pt-1 pr-0 ${readOnly ? 'd-none' : ''}`}>
                                        <button type="button" className="skel-btn-submit" data-toggle="modal" data-target="#createlead" onClick={handleCreateInteraction}>Create Interaction</button>
                                    </div>

                                    {/* {console.log('detailedViewItem--------->', detailedViewItem)} */}

                                    {(detailedViewItem?.interactionDetails && detailedViewItem?.interactionDetails?.length > 0) ?
                                        <DynamicTable
                                            row={detailedViewItem?.interactionDetails
                                                ? detailedViewItem.interactionDetails
                                                : []}
                                            header={CustomerDetailsViewColumns}
                                            itemsPerPage={10}
                                            exportBtn={false}
                                            columnFilter={true}
                                            handler={{
                                                handleCellRender: handleCellRender,
                                            }}
                                        />
                                        :
                                        <span className="skel-widget-warning">No interactions found!</span>
                                    }
                                </div>
                            </div>
                        </Element>
                        :
                        <></>

                }
                {
                    createInteraction &&
                    <CreateInteraction
                        data={{
                            isOpen: createInteraction,
                            customerDetails: customerDetails,
                            helpdeskId: helpdeskId,
                            detailedViewItem,
                            forChatInteractions: detailedViewItem?.source === 'E-MAIL' ? false : detailedViewItem?.source === 'LIVECHAT' ? true : false
                        }}
                        handler={{
                            setIsOpen: setCreateInteraction,
                            doSoftRefresh
                        }}
                    />
                }

                <Modal isOpen={isWorflowHistoryOpen} style={RegularModalCustomStyles}>
                    <div
                        className="modal-center"
                        id="followupModal"
                        tabIndex="-1"
                        role="dialog"
                        aria-labelledby="followupModal"
                        aria-hidden="true"
                    >
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header px-4 border-bottom-0 d-block">
                                    <button
                                        type="button"
                                        className="close"
                                        // data-dismiss="modal"
                                        // aria-hidden="true"
                                        onClick={() => setIsWorkflowHistoryOpen(false)}
                                    >
                                        &times;
                                    </button>
                                    <h5 className="modal-title">
                                        {!isFollowUpHistoryOpen
                                            ? "Workflow History"
                                            : "Followup History"}{" "}
                                        for Interaction No {interactionData?.intxnNo}
                                    </h5>
                                </div>
                                <div className="modal-body px-4">
                                    <div className="row">
                                        <div className="col-md-12 pull-right">
                                            <button
                                                type="button"
                                                className="btn waves-effect waves-light btn-primary cmmn-styl-btn-sm"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (followUpHistory?.count === 0) {
                                                        toast.error(
                                                            "No follow-up is available for this interaction."
                                                        );
                                                        return;
                                                    }
                                                    setIsFollowUpHistoryOpen(!isFollowUpHistoryOpen);
                                                }}
                                            >
                                                {!isFollowUpHistoryOpen
                                                    ? `Followup History - ${followUpHistory?.count}`
                                                    : `WorkFlow History - ${workflowHistory?.count}`}
                                            </button>
                                        </div>
                                    </div>
                                    {!isFollowUpHistoryOpen ? (
                                        <div className="timeline-workflow">
                                            <ul>
                                                {workflowHistory?.rows &&
                                                    workflowHistory?.rows.length > 0 &&
                                                    workflowHistory?.rows.map((data) => (
                                                        <li>
                                                            <div className="content">
                                                                <div className="row">
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                From Department/Role
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.fromEntityName?.unitDesc || ""} -{" "}
                                                                                {data?.fromRoleName?.roleDesc || ""}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Servicetype"
                                                                                className="control-label"
                                                                            >
                                                                                To Department/Role
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.toEntityName?.unitDesc || ""} -{" "}
                                                                                {data?.toRoleName?.roleDesc || ""}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Channel"
                                                                                className="control-label"
                                                                            >
                                                                                User
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data.flwCreatedby.flwCreatedBy}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                Status
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.statusDescription?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Servicetype"
                                                                                className="control-label"
                                                                            >
                                                                                Action Performed
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.flowActionDesc?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Servicetype"
                                                                                className="control-label">
                                                                                Attachment
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.AttachmentsDetails && data?.AttachmentsDetails?.map((file) => (

                                                                                    <div className="attach-btn" title={`Click to download ${file.fileName}`} key={file.attachmentUuid} onClick={() => handleFileDownload(file.attachmentUuid)}>
                                                                                        <i className="fa fa-paperclip" aria-hidden="true"></i>
                                                                                        <a key={file.attachmentUuid} alt={file.fileName}>{file.fileName}</a>
                                                                                    </div>
                                                                                ))}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col-md-12">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                Comments
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.remarks}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="time">
                                                                <h4>
                                                                    {moment(
                                                                        data?.intxnCreatedDate || new Date()
                                                                    ).format("DD MMM YYYY hh:mm:ss A")}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="timeline-workflow">
                                            <ul>
                                                {followUpHistory?.rows &&
                                                    followUpHistory?.rows.length > 0 &&
                                                    followUpHistory?.rows.map((data) => (
                                                        <li>
                                                            <div className="content">
                                                                <div className="row">
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                From Department/Role
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.fromEntityName?.unitDesc || ""} -{" "}
                                                                                {data?.fromRoleName?.roleDesc || ""}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Servicetype"
                                                                                className="control-label"
                                                                            >
                                                                                To Department/Role
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.toEntityName?.unitDesc || ""} -{" "}
                                                                                {data?.toRoleName?.roleDesc || ""}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Channel"
                                                                                className="control-label"
                                                                            >
                                                                                User
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data.flwCreatedby.flwCreatedBy}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                Status
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.statusDescription?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Servicetype"
                                                                                className="control-label"
                                                                            >
                                                                                Action Performed
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.flowActionDesc?.description}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col-md-12">
                                                                        <div className="form-group">
                                                                            <label
                                                                                htmlFor="Interactiontype"
                                                                                className="control-label"
                                                                            >
                                                                                Comments
                                                                            </label>
                                                                            <span className="data-cnt">
                                                                                {data?.remarks}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="time">
                                                                <h4>
                                                                    {moment(
                                                                        data?.intxnCreatedDate || new Date()
                                                                    ).format("DD MMM YYYY hh:mm:ss A")}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    )
}

export default CustomerDetailsView;