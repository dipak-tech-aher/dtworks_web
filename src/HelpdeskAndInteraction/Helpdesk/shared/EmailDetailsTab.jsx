import React, { useCallback, useState, useEffect } from 'react';
import { } from '../../../common/spinner';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import Attachements from './Attachments';
import { useNavigate } from "react-router-dom";
import { unstable_batchedUpdates } from 'react-dom';
import { statusConstantCode } from '../../../AppConstants';
import HelpdeskCancelModal from '../HelpdeskCancelModal';
import { Row } from 'react-bootstrap';
import { RegularModalCustomStyles } from "../../../common/util/util";
import Modal from 'react-modal';
import { toast } from 'react-toastify'
import moment from 'moment';
import { isEmpty } from 'lodash'

const EmailDetailsTab = (props) => {
    const { detailedViewItem, readOnly = false } = props.data;

    const [mailAttachments, setMailAttachments] = useState([]);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [helpdeskDetails, setHelpdeskDetails] = useState();
    const [refresh, setRefresh] = useState(false)
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [sourceLookup, setSourceLookup] = useState([]);

    const history = useNavigate();
    const getAttachments = useCallback((type) => {
        if (detailedViewItem?.helpdeskId && type) {
            get(`${properties.ATTACHMENT_API}?entity-id=${detailedViewItem?.helpdeskId}&entity-type=${type}`).then((response) => {
                if (response.data && response.data.length) {
                    setMailAttachments(response.data);
                }
            }).catch((error) => {
                console.error("error", error)
            }).finally()
        }
    }, [detailedViewItem?.helpdeskId])

    useEffect(() => {
        getAttachments('HELPDESK');
    }, [getAttachments])

    useEffect(() => {
        get(
            properties.MASTER_API +
            "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY"
        )
            .then((resp) => {
                if (resp.data) {
                    setSourceLookup(resp.data["TICKET_SOURCE"]);
                    setPriorityLookup(resp.data["FOLLOWUP_PRIORITY"]);
                } else {
                    // toast.error("Error while fetching address details");
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, []);

    const [isTruncated, setIsTruncated] = useState(true);

    const toggleTruncate = () => {
        setIsTruncated(!isTruncated);
    };
    const [followupInputs, setFollowupInputs] = useState({
        priority: "",
        source: "",
        remarks: "",
    });

    const contentStyle = {
        textOverflow: isTruncated ? 'ellipsis' : 'inherit',
        overflow: isTruncated ? 'hidden' : 'visible',
        paddingRight: '10px',
        display: '-webkit-box',
        WebkitLineClamp: isTruncated ? 3 : 300,
        WebkitBoxOrient: 'vertical',
        cursor: 'pointer',
    };

    const handleCancelHelpdesk = (e) => {
        unstable_batchedUpdates(() => {
            setIsCancelOpen(true)
            setHelpdeskDetails(e)
        })

    }

    const handleFollowupHelpdesk = (e) => {
        unstable_batchedUpdates(() => {
            setIsFollowupOpen(true)
            setHelpdeskDetails(e)
        })

    }

    const handleOnAddFollowup = (e) => {
        e.preventDefault();
        const { priority, source, remarks } = followupInputs;
        if (!priority || !source || !remarks) {
            toast.error("Please provide mandatory fields");
            return;
        }
        let payload = {
            priorityCode: priority,
            source,
            remarks,
            helpdeskNo: detailedViewItem?.helpdeskNo,
            channel:statusConstantCode.businessEntity.WEB
        };

        post(`${properties.HELPDESK_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    setIsFollowupOpen(false);
                    setFollowupInputs({
                        priority: "",
                        source: "",
                        remarks: "",
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    };
    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({
            ...followupInputs,
            [target.id]: target.value,
        });
    };

    return (
        <div className="card-body pl-2 skel-helpdesk-right-col-info w-100">
            <Row className="justify-content-end">
                <button type="button" onClick={() => handleFollowupHelpdesk(detailedViewItem?.helpdeskId)} disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode)}
               /*     disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL].includes(row.original?.status.code)}*/ className={([statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode) || readOnly) ? "skel-btn-submit skel-btn-disable" : "skel-btn-submit"} data-toggle="modal" data-target="#search-modal-editservice">
                    Followup
                </button >
                <button type="button" onClick={() => handleCancelHelpdesk(detailedViewItem?.helpdeskId)} disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode)}
               /*     disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL].includes(row.original?.status.code)}*/ className={([statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode) || readOnly) ? "skel-btn-submit skel-btn-disable" : "skel-btn-submit"} data-toggle="modal" data-target="#search-modal-editservice">
                    Cancel
                </button >
            </Row>
            <table className='skel-helpdesk-360-base-view'>
                <tr>
                    <td className='form-label'>Subject</td>
                    <td>:</td>
                    <td>{detailedViewItem?.helpdeskSubject}</td>
                </tr>
                <tr>
                    <td className='form-label'>Helpdesk No</td>
                    <td>:</td>
                    <td>{detailedViewItem?.helpdeskNo}</td>
                </tr>
                <tr>
                    <td className='form-label'>Interaction No</td>
                    <td>:</td>
                    <td><a href="javascript:void(0)" className="txt-underline" onClick={(e) => {
                        history(`/interaction360`, { state: {data: { intxnNo: detailedViewItem?.interactionDetails?.[0]?.intxnNo, intxnUuid: detailedViewItem?.interactionDetails?.[0]?.intxnUuid, intxnId: detailedViewItem?.interactionDetails?.[0]?.intxnId }} })
                    }}>
                        {detailedViewItem?.interactionDetails?.[0]?.intxnNo}
                    </a>
                    </td>
                </tr>
                <tr>
                    <td className='form-label'>{(detailedViewItem?.source)?.toUpperCase() === 'WHATSAPP' ? 'From Whatsapp' : 'From Email'}</td>
                    <td>:</td>
                    <td>{detailedViewItem?.mailId ?? detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix + '' + detailedViewItem?.customerDetails?.contactDetails?.mobileNo}</td>
                </tr>
                <tr>
                    <td className="form-label">
                        Created At
                    </td>
                    <td>:</td>
                    <td>
                        {detailedViewItem?.createdAt ? moment(detailedViewItem?.createdAt).format('DD-MM-YYYY hh:mm:sss A') : ''}
                    </td>
                </tr>
                <tr>
                    <td className='form-label'>Cc Email</td>
                    <td>:</td>
                    <td onClick={toggleTruncate}>{!isEmpty(detailedViewItem?.helpdeskCcRecipients) && detailedViewItem?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n")}</td>
                </tr>
                <tr>
                    <td className='form-label'>Helpdesk Status</td>
                    <td>:</td>
                    <td>{detailedViewItem?.status?.description ?? ''}</td>
                </tr>
                <tr>
                    <td className='form-label'>Helpdesk Type</td>
                    <td>:</td>
                    <td>{detailedViewItem?.helpdeskType?.description ?? ''}</td>
                </tr>
                <tr>
                    <td className='form-label'>Helpdesk Severity</td>
                    <td>:</td>
                    <td>{detailedViewItem?.severity?.description ?? ''}</td>
                </tr>
                <tr>
                    <td className='form-label'>Completion date</td>
                    <td>:</td>
                    <td>{detailedViewItem?.complitionDate ? moment(detailedViewItem?.complitionDate).format('DD-MM-YYYY') : 'NA'}</td>
                </tr>
                {(detailedViewItem?.source)?.toUpperCase() !== 'WHATSAPP' && <tr>
                    <td className='form-label'>Domain</td>
                    <td>:</td>
                    <td>{detailedViewItem?.mailId ? detailedViewItem?.mailId.split('@')[1] : ''}</td>
                </tr>}
                <tr>
                    <td className='form-label'>Project</td>
                    <td>:</td>
                    <td>{detailedViewItem?.project ? detailedViewItem?.project?.description : ''}</td>
                </tr>
                <tr>
                    <td className='form-label'>Content</td>
                    <td>:</td>
                    <td><div className="skel-helpdesk-em-cnt" style={contentStyle} onClick={toggleTruncate}>{detailedViewItem?.helpdeskContent}</div></td>
                </tr>
            </table>
            {/* <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Subject</div>
                <div className="col-9 form-vtext pl-1">{detailedViewItem?.helpdeskSubject}</div>
            </div>
            <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Content</div>
                <div className="col-9 form-vtext pl-1">{detailedViewItem?.helpdeskContent}</div>
            </div>
            <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">From Email</div>
                <div className="col-9 form-vtext pl-1">{detailedViewItem?.mailId}</div>
            </div>
            <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Domain</div>
                <div className="col-9 form-vtext pl-1">{detailedViewItem?.mailId ? detailedViewItem?.mailId.split('@')[1] : ''}</div>
            </div>
            <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Project</div>
                <div className="col-9 form-vtext pl-1">{detailedViewItem?.project ? detailedViewItem?.project?.description : ''}</div>
            </div> */}
            {
                !!mailAttachments?.length && (
                    <div className={`col-12 row pt-2 mb-2 helpdesk-padding-left-0`}>
                        <div className="col-3 form-label pl-1">Attachment</div>
                        {/* Commented for dtWorks 2.0
                            <Attachements
                            data={{
                                attachmentList: mailAttachments,
                                entityId: detailedViewItem?.helpdeskId,
                                entityType: 'HELPDESK'
                            }}
                        /> */}
                    </div>
                )
            }
            <div>
                <HelpdeskCancelModal
                    data={{
                        helpDeskId: helpdeskDetails,
                        isCancelOpen,
                        refresh
                    }}

                    handler={{
                        setIsCancelOpen,
                        setRefresh
                    }}
                />
            </div>

            <Modal
                isOpen={isFollowupOpen}
                contentLabel="Followup Modal"
                style={RegularModalCustomStyles}
            >
                <div
                    className="modal-center"
                    id="cancelModal"
                    tabIndex="-1"
                    role="dialog"
                    aria-labelledby="cancelModal"
                    aria-hidden="true"
                >
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="cancelModal">
                                    Followup for Helpdesk No {detailedViewItem?.helpdeskNo}
                                </h5>
                                <button
                                    type="button"
                                    className="close"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setIsFollowupOpen(false)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row pt-3">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                FollowUp Priority{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                value={followupInputs.priority}
                                                id="priority"
                                                className="form-control"
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="priority" value="">
                                                    Select Priority
                                                </option>
                                                {priorityLookup &&
                                                    priorityLookup.map((e) => (
                                                        <option key={e.code} value={e?.code}>
                                                            {e?.description}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="source" className="col-form-label">
                                                Source{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                id="source"
                                                className="form-control"
                                                value={followupInputs.source}
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="source" value="">
                                                    Select Source
                                                </option>
                                                {sourceLookup &&
                                                    sourceLookup.map((e) => (
                                                        <option key={e.code} value={e.code}>
                                                            {e.description}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12 ">
                                        <div className="form-group ">
                                            <label
                                                htmlFor="inputState"
                                                className="col-form-label pt-0"
                                            >
                                                Remarks{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                required
                                                className="form-control"
                                                maxLength="2500"
                                                id="remarks"
                                                value={followupInputs.remarks}
                                                onChange={handleOnFollowupInputsChange}
                                                name="remarks"
                                                rows="4"
                                            ></textarea>
                                            <span>Maximum 2500 characters</span>
                                        </div>
                                    </div>
                                    <div className="col-md-12 pl-2">
                                        <div className="form-group pb-1">
                                            <div className="d-flex justify-content-center">
                                                <button
                                                    type="button"
                                                    className="skel-btn-cancel"
                                                    onClick={() => setIsFollowupOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="skel-btn-submit"
                                                    onClick={handleOnAddFollowup}
                                                >
                                                    Submit
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default EmailDetailsTab;