import React, { useEffect, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { properties } from '../../properties';
import { put, post, get } from '../../common/util/restUtil';
import { AppContext } from "../../AppContext";
import { statusConstantCode } from '../../AppConstants'
import { unstable_batchedUpdates } from 'react-dom';
import { removeEmptyKey } from '../../common/util/util'
import { useLocation } from 'react-router-dom';


const ChatEditorSocial = (props) => {
    let { auth } = useContext(AppContext);
    const location = useLocation();
    const currentURL = location?.pathname;

    const { detailedViewItem, channelSource, fbId } = props.data;
    // console.log('detailedViewItem---->', detailedViewItem)
    const { doSoftRefresh } = props.handlers;
    const [message, setMessage] = useState('');
    const [messageArr, setMessageArr] = useState([]);
    const [isRefresh, setIsrefresh] = useState(false);
    const [projectTypes, setProjectTypes] = useState([])
    const [helpdeskStatus, setHelpdeskStatus] = useState([])
    const [helpdeskTypes, setHelpdeskTypes] = useState([])
    const [severities, setSeverities] = useState([])
    const [currProject, setCurrProject] = useState("");
    const [currHelpdeskType, setCurrHelpdeskType] = useState("");
    const [currSeverity, setCurrSeverity] = useState("");
    const [cancelReasonLookup, setCancelReasonLookup] = useState([])
    const [cancelReason, setCancelReason] = useState()
    const [pendingWith, setPendingWith] = useState("");
    const [complitionDate, setComplitionDate] = useState("")
    const [status, setStatus] = useState("");
    const [autoRefresh, setAutoRefresh] = useState(false);

    const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

    useEffect(() => {
        const interval = setInterval(() => {
            setAutoRefresh(prevState => !prevState);
        }, 5000);

        return () => {
            clearInterval(interval); // Clear interval on component unmount
        };
    }, []);


    useEffect(() => {
        const body = {
            helpdeskId: detailedViewItem?.helpdeskId,
            helpdeskActionRemark: [
                "HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_DONE",
                "HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_RUNNING",
                "HELPDESK_WHATSAPP_REPLY_TO_AGENT_DONE",
                "HELPDESK_WHATSAPP_REPLY_TO_AGENT_RUNNING",
            ]
        }

        axios({
            method: 'post',
            url: `${API_ENDPOINT}${properties.WADASHBOARD_API}/get-messages`,
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined
            },
            data: body
        }).then(response => {
            setMessageArr(response?.data?.data)
        }).catch((error) => {
            console.log("catch block", error);
        });
    }, [isRefresh, autoRefresh])


    useEffect(() => {
        get(properties.MASTER_API + `/lookup?searchParam=code_type&valueParam=${statusConstantCode.businessEntity.HELPDESK_TYPE},${statusConstantCode.businessEntity.SEVERITY},${statusConstantCode.businessEntity.PROJECT},${statusConstantCode.businessEntity.HELPDESKSTATUS},${statusConstantCode.businessEntity.HELPDESKCANCELREASON}`).then((resp) => {
            if (resp?.data) {
                const { PROJECT, HELPDESK_STATUS, HELPDESK_CANCEL_REASON, HELPDESK_TYPE, SEVERITY } = resp?.data

                const helpdeskStatusList = HELPDESK_STATUS && HELPDESK_STATUS.filter((e) => {
                    if (e.code !== statusConstantCode?.status?.HELPDESK_NEW) {
                        return true
                    }
                    return false
                })
                unstable_batchedUpdates(() => {
                    setCancelReasonLookup(HELPDESK_CANCEL_REASON)
                    setProjectTypes(PROJECT)
                    setHelpdeskTypes(HELPDESK_TYPE)
                    setSeverities(SEVERITY)
                    setHelpdeskStatus(helpdeskStatusList)
                })
            }
        }).catch((error) => console.log(error))
            .finally()
    }, [props])

    const sendMessage = () => {
        // console.log('channelSource-------->', channelSource)
        const socialContactNo = detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix ? `${detailedViewItem?.customerDetails?.contactDetails?.mobilePrefix}${detailedViewItem?.customerDetails?.contactDetails?.mobileNo}` : `${detailedViewItem?.phoneNo}`;
        const body = {
            "message": message,
            "to": channelSource === "FACEBOOK" ? fbId : socialContactNo,
            "source": channelSource === "FACEBOOK" ? channelSource : "WHATSAPP",
            helpdeskId: detailedViewItem?.helpdeskId
        }
        let apiUrl = '';
        if (channelSource === "FACEBOOK") {
            apiUrl = properties.WADASHBOARD_API + "/send-msg-to-fb"
        } else {
            apiUrl = properties.WADASHBOARD_API + "/send-msg-to-whatsapp"
        }
        // console.log('apiUrl------->', apiUrl)
        post(apiUrl, body).then((response) => {
            const { data, status } = response;
            if (status === 200) {
                setMessage('')
                setIsrefresh(!isRefresh)
            }
        })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }


    const handleOnProjectChange = (e) => {
        const { value } = e.target;
        setCurrProject(value);
    }

    const handleOnTypeChange = (e) => {
        const { value } = e.target;
        setCurrHelpdeskType(value);
    }

    const handleOnSeverityChange = (e) => {
        const { value } = e.target;
        setCurrSeverity(value);
    }

    const handleOnCancelReason = (e) => {
        const { value } = e.target;
        setCancelReason(value)
    }

    const handleOnDBComplitionDate = (e) => {
        const { value } = e.target;
        setComplitionDate(value);
    }

    const handleOnPending = (e) => {
        const { value } = e.target;
        setPendingWith(value);
    }

    const handleOnStatusChange = (e) => {
        const { value } = e.target;
        setStatus(value);
    }

    const handleOnSubmit = () => {
        if (detailedViewItem?.status?.code === status) {
            toast.warn('There is no change in status and reply to customer has not been specified')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.project && currProject === "") {
            toast.warn('Please select project')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.helpdeskType && currHelpdeskType === "") {
            toast.warn('Please select helpdesk type')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.severity && currSeverity === "") {
            toast.warn('Please select severity')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CANCEL && !cancelReason) {
            toast.warn('Please select cancel reason')
            return false
        }

        let requestBody = {
            helpdeskId: detailedViewItem?.helpdeskId,
            status,
            helpdeskType: currHelpdeskType,
            severity: currSeverity,
            cancelReason: cancelReason || null,
            project: currProject,
            entityType: statusConstantCode.entityCategory.HELPDESK,
            pending: pendingWith,
            complitionDate
        }
        /** Remove the empty keys in given objects */
        requestBody = removeEmptyKey(requestBody)

        put(`${properties.HELPDESK_API}/update/${detailedViewItem?.helpdeskId}/DO_NOT_REPLY`, requestBody)
            .then((response) => {
                const { status, message } = response;
                if (status === 200) {
                    doSoftRefresh('UPDATE_DETAILED_VIEW', detailedViewItem?.helpdeskId)
                    doSoftRefresh('CANCEL_VIEW');

                    if (status === statusConstantCode?.status?.HELPDESK_CLOSED) {
                        let el = document.querySelector(`li[data-helpdesk-no="${detailedViewItem?.helpdeskNo}"]`);
                        el?.parentNode?.removeChild(el);
                    }

                    toast.success(message);
                }
            })
            .catch(error => {
                console.log(error);
            })
            .finally()
    }

    const handleOnCancel = () => {
        doSoftRefresh('CANCEL_VIEW');
    }

    return (
        <div className="col-12 row pl-2 m-0 ">
            {/* <table>
                <tr>
                    <td width="100%" className='form-label'>Helpdesk No</td>
                    <td width="5%">:</td>
                    <td width="50%">{detailedViewItem?.helpdeskNo}</td>
                </tr>
                <tr>
                    <td width="100%" className='form-label'>Helpdesk Source</td>
                    <td width="5%">:</td>
                    <td width="50%">{detailedViewItem?.helpdeskSource?.description ?? ''}</td>
                </tr>
                <tr>
                    <td width="100%" className='form-label'>Status</td>
                    <td width="5%">:</td>
                    <td width="50%">{detailedViewItem?.status?.description}</td>
                </tr>
                <tr>
                    <td className='form-label'>Subject</td>
                    <td width="5%">:</td>
                    <td width="50%">{detailedViewItem?.helpdeskSubject}</td>
                </tr>
                <tr>
                    <td className='form-label'>{detailedViewItem?.source} Content</td>
                    <td width="5%">:</td>
                    <td width="50%"><div className="skel-helpdesk-em-cnt">{detailedViewItem?.helpdeskContent}</div></td>
                </tr>
                <tr>
                    <td className='form-label'>Domain</td>
                    <td width="5%">:</td>
                    <td width="50%">{detailedViewItem?.mailId ? detailedViewItem?.mailId?.split('@')[1] : detailedViewItem?.email ? detailedViewItem?.email.split('@')[1] : ''}</td>
                </tr>
            </table> */}
            {/*  mt-5 */}
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-12">
                        <div className="card">
                            <div className="card-header text-center" style={{ color: "white" }}>
                                {/* {console.log('detailedViewItem----->', detailedViewItem)} */}
                                {/* {console.log('channelSource----->', channelSource)} */}
                                {channelSource === "FACEBOOK" ? "Facebook User" : channelSource === 'WHATS-APP' ? "Whatsapp User" : detailedViewItem?.customerDetails?.firstName}</div>
                            <div className="card-body" id="chatWindow" style={{ "height": "300px", "overflowY": "scroll" }}>
                                {messageArr?.map((message, index) => (
                                    <div key={index} className={(message?.helpdeskActionRemark === 'HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_RUNNING' || message?.helpdeskActionRemark === 'HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_DONE') ? 'mb-2 text-right' : 'mb-2 text-left'}>
                                        <b>{(message?.helpdeskActionRemark === 'HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_RUNNING' || message?.helpdeskActionRemark === 'HELPDESK_WHATSAPP_REPLY_TO_CUSTOMER_DONE') ? auth?.user?.firstName : (channelSource === "FACEBOOK" ? "Facebook User" : channelSource === 'WHATS-APP' ? "Whatsapp User" : detailedViewItem?.customerDetails?.firstName)}</b>: {message?.helpdeskContent}
                                    </div>
                                ))}
                            </div>
                            {currentURL.includes('view-helpdesk-ticket') ? <></> : <div className="card-footer">
                                <div className="input-group">
                                    <input type="text" className="form-control" placeholder="Type a message..." onKeyPress={(e) => e.key === 'Enter' && sendMessage()} id="message" autoComplete="off"
                                        value={message || ''}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                        }} />
                                    <div className="input-group-append">
                                        <button type='button' className="btn btn-primary" id="sendMessage" onClick={() => sendMessage()}>Send</button>
                                    </div>
                                    <span style={{ fontSize: '12px' }}>Note: Messaging structure, <strong style={{ fontSize: '11px' }}>HELPDESK_NO: #HPDXXXXXX - YOUR MESSAGE</strong> </span>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className={`col p-0 mb-2 ${detailedViewItem?.laneSource === undefined || detailedViewItem?.laneSource === 'QUEUE' ? 'd-none' : ''}`}>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">Status :</div><span className='text-danger font-20 pl-1 fld-imp'>*</span>
                    <select id="mailStatus" className="form-control" value={status} onChange={handleOnStatusChange}>
                        <option value="">Select Status</option>
                        {
                            helpdeskStatus && helpdeskStatus?.map((e) => (
                                <option key={e.code} value={e.code}>{e.description}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">Type:</div>
                    <select id="mailStatus" className="form-control" value={currHelpdeskType} onChange={handleOnTypeChange}>
                        <option value="">Select Type</option>
                        {
                            helpdeskTypes && helpdeskTypes.map((e) => (
                                <option key={e.code} value={e.code}>{e.description}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">Severity:</div>
                    <select id="mailStatus" className="form-control" value={currSeverity} onChange={handleOnSeverityChange}>
                        <option value="">Select Severity</option>
                        {
                            severities && severities.map((e) => (
                                <option key={e.code} value={e.code}>{e.description}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">Project:</div>
                    <select id="mailStatus" className="form-control" value={currProject} onChange={handleOnProjectChange}>
                        <option value="">Select Project Type</option>
                        {
                            projectTypes && projectTypes.map((e) => (
                                <option key={e.code} value={e.code}>{e.description}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">Pending with :</div>
                    <select id="pendingWith" className="form-control" value={pendingWith} onChange={handleOnPending}>
                        <option value="">Select Pending with</option>
                        {
                            projectTypes.map((e) => (
                                <option key={e.code} value={e.code}>{e.description}</option>
                            ))
                        }
                    </select>
                </div>
                <div className="ds-form-group2 clearfix">
                    <div className="form-label">DB Completion Date :</div>
                    <input type="date" id="complitionDate" className="form-control" value={complitionDate} onChange={handleOnDBComplitionDate} />
                </div>
                {status && status === statusConstantCode.status.HELPDESK_CANCEL &&
                    <div className="ds-form-group2 clearfix">
                        <div className="form-label">Cancel Reason</div><span className='text-danger font-20 pl-1 fld-imp'>*</span>

                        <select id="cancelReason" className="form-control" value={cancelReason} onChange={handleOnCancelReason}>
                            <option value="">Select Cancel Reason</option>
                            {
                                cancelReasonLookup && cancelReasonLookup.map((e) => (
                                    <option key={e.code} value={e.code}>{e.description}</option>
                                ))
                            }
                        </select>
                    </div>
                }
            </div> */}
            {/* <div className={`row col-12 justify-content-center ${detailedViewItem?.laneSource === undefined || detailedViewItem?.laneSource === 'QUEUE' ? 'd-none' : ''}`}>
                <button type="button" className="skel-btn-cancel" onClick={handleOnCancel}>Cancel</button>
                <button type="button" className="skel-btn-submit skel-custom-submit-btn" onClick={handleOnSubmit}>Submit</button>
            </div> */}

        </div>
    )
}

export default ChatEditorSocial;