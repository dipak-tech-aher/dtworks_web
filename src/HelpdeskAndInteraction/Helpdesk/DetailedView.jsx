import React, { memo, useContext, useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { statusConstantCode } from '../../AppConstants';
import { AppContext } from '../../AppContext';
import { get, post } from '../../common/util/restUtil';
import { properties } from '../../properties';
import ChatEditorSocial from './ChatEditorSocial';
import CloseHelpdeskTicket from './CloseHelpdeskTicket';
import HelpdeskInfo from './HelpdeskInfo';
import MailEditor from './MailEditor';
import WorkflowHistory from './WorkflowHistory';
import FacebookDetails from './shared/FacebookDetailsTab';
import InteractionDeatilsPart1 from './shared/InteractionDeatilsPart1';
import moment from 'moment';
import { useNavigate } from "react-router-dom";
import { isEmpty } from 'lodash'

const DetailedView = memo((props) => {
    const { auth } = useContext(AppContext)
    const { detailedViewItem } = props?.data;
    const { doSoftRefresh } = props.handlers;
    const [customerDetails, setCustomerDetails] = useState(null);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [helpdeskStatus, setHelpdeskStatus] = useState([])
    const [helpdeskTypes, setHelpdeskTypes] = useState([])
    const [severities, setSeverities] = useState([])
    const [projectTypes, setProjectTypes] = useState([])
    const [cancelReasonLookup, setCancelReasonLookup] = useState([])
    const [projectLookup, setProjectLookup] = useState([]);
    const history = useNavigate();
    const [preferenceLookup, setPreferenceLookup] = useState()

    // console.log('Detailed View------->', detailedViewItem)
    useEffect(() => {
        unstable_batchedUpdates(() => {
            // console.log('Detailed View Use Effect------->', detailedViewItem.customerDetails)
            setCustomerDetails(detailedViewItem.customerDetails);
            setIsDisabled(detailedViewItem?.laneSource === 'QUEUE' || ['HOLD', 'CLOSED'].includes(detailedViewItem.status) ? true : false);
        })
    }, [detailedViewItem])

    useEffect(() => {
        get(properties.MASTER_API + `/lookup?searchParam=code_type&valueParam=${statusConstantCode.businessEntity.HELPDESK_TYPE},${statusConstantCode.businessEntity.SEVERITY},${statusConstantCode.businessEntity.PROJECT},${statusConstantCode.businessEntity.HELPDESKSTATUS},${statusConstantCode.businessEntity.HELPDESKCANCELREASON},${statusConstantCode.businessEntity.CONTACTPREFERENCE}`).then((resp) => {
            if (resp?.data) {
                const { PROJECT, HELPDESK_STATUS, HELPDESK_CANCEL_REASON, HELPDESK_TYPE, SEVERITY, CONTACT_PREFERENCE } = resp?.data
                const helpdeskStatusList = HELPDESK_STATUS && HELPDESK_STATUS.filter((e) => {
                    if (e?.mapping?.isStatusEnabled?.[0]?.includes("TRUE")) {
                        return true
                    }
                    // if (e?.mapping?.isStatusEnabled) {
                    //     return true
                    // }
                    return false
                })
                unstable_batchedUpdates(() => {
                    setCancelReasonLookup(HELPDESK_CANCEL_REASON)
                    // setProjectTypes(PROJECT)
                    setHelpdeskTypes(HELPDESK_TYPE)
                    setSeverities(SEVERITY)
                    setHelpdeskStatus(helpdeskStatusList)
                    setPreferenceLookup(CONTACT_PREFERENCE)
                    // console.log('detailedViewItem.customerDetails', detailedViewItem)
                    // let projects = resp?.data?.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId))
                    // if (!isEmpty(detailedViewItem.customerDetails)) {
                    //     projects = resp?.data?.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId))
                    // } else {
                    //     resp?.data?.PROJECT.forEach(element => {
                    //         detailedViewItem.customerDetails.projectMapping.forEach((ele) => {
                    //             // console.log('departments', element?.mapping.department, 'customer department', ele?.entity, 'customer project', ele?.project, 'project', element?.code)
                    //             if (element?.mapping && element?.mapping?.hasOwnProperty('department') && element?.mapping?.department?.includes(auth?.currDeptId) && element?.mapping?.department?.includes(ele?.entity) && ele?.project?.includes(element?.code)) {
                    //                 projects.push(element)
                    //             }
                    //         })
                    //     })
                    // }

                    let projects = []
                    let projectOptions = resp?.data?.PROJECT?.filter((f) => f.mapping?.department?.includes(auth?.currDeptId));
                    // console.log('detailedViewItem?.customerDetails?.projectMapping?.length--------->', detailedViewItem?.customerDetails?.projectMapping)
                    if (detailedViewItem?.customerDetails?.projectMapping?.length > 0) {
                        let currentDeptProject = detailedViewItem?.customerDetails?.projectMapping?.filter((f) => f?.entity === auth?.currDeptId)
                        projects = projectOptions?.filter((f) => currentDeptProject?.[0]?.project.includes(f?.code))
                    }

                    setProjectLookup(projects ?? [])
                    setProjectTypes(projects?.length > 0 ? projects : PROJECT)

                })
            }
        }).catch((error) => console.log(error))
            .finally()
        // props
    }, [])


    useEffect(() => {
        setIsVerified(['HOLD', 'NEW'].includes(detailedViewItem.status) ? true : customerDetails && !!Object.keys(customerDetails).length ? true : false);
    }, [customerDetails, detailedViewItem])

    const getCustomerDataForComplaint = () => {
        if (customerDetails && customerDetails?.source !== 'PROFILE') {

            if (!!!customerDetails?.profileNo) {
                toast.error(`No ${props?.appsConfig?.clientFacingName?.customer ?? "Customer"} details Found`)
                return
            }
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
            }
            post(`${properties.PROFILE_API}/search?limit=${1}&page=${0}`, requestParam).then((resp) => {
                if (resp?.data && resp?.status === 200) {
                    const { rows, count } = resp.data;
                    const data = rows[0]
                    if (data) {
                        data.source = statusConstantCode.entityCategory.HELPDESK
                        data.helpdeskDetails = detailedViewItem || {}
                        history(`/create-interaction`, { state: {data} })
                    }
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

    return (
        <div className="helpdesk-detail bg-white skel-helpdesk-sortable-list" id="server-details1">
            <div className="helpdesk-title">
                <div className="row">
                    <div className="col-md-12">
                        <h3>{detailedViewItem?.helpdeskSubject || detailedViewItem?.name || detailedViewItem?.customerName}</h3>
                    </div>
                </div>
                <div className="row col-md-12 pt-1">
                    <div className="col-md-7 tic-id">
                        <p>Help Desk No #{detailedViewItem?.helpdeskNo}</p>
                        <p>Created on {detailedViewItem?.createdAt ? moment(detailedViewItem.createdAt).format('DD/MM/YYYY HH:mm') : ''}</p>
                    </div>
                    <div className='col-md-5'>
                        {(customerDetails && customerDetails?.profileId && detailedViewItem?.statusCode !== 'HS_ESCALATED') &&
                            <div className={`text-right pt-1 pr-0`}>
                                <button type="button" className="skel-btn-submit helpdesk-border" disabled={detailedViewItem?.statusCode === 'HS_ESCALATED'} data-toggle="modal" data-target="#createlead" onClick={handleCreateInteraction}>Create Interaction</button>
                            </div>}
                    </div>
                </div>
            </div>
            <div className='col-12'>
                <ul className="nav nav-tabs nav-bordered nav-justified" style={{ maxWidth: '100%', flexWrap: 'nowrap', overflowX: 'scroll', overflowY: 'hidden' }}>
                    <li className="nav-item text-capitalize">
                        <a key="helpdeskInfo" href="#details" data-toggle="tab" aria-expanded="false" className={`nav-link active`}>
                            Helpdesk Info
                        </a>
                    </li>
                    <li className="nav-item">
                        <a key="moreDetails" href="#historyDetails" data-toggle="tab" aria-expanded="true" className={`nav-link`}>
                            Helpdesk/Interaction History
                        </a>
                    </li>
                    <li className="nav-item">
                        <a key="moreDetails" href="#interactionDetails" data-toggle="tab" aria-expanded="true" className={`nav-link`}>
                            Customer Conversation
                        </a>
                    </li>
                </ul>
                <div className="tab-content p-0">
                    <div className="tab-pane active skel-helpdesk-mh" id="details">
                        <div className="">
                            <div className="col-12">
                                <div className="">
                                    <div className="card-body p-0 pl-4 ml-2">
                                        {
                                            // detailedViewItem?.source === 'LIVECHAT' ? (
                                            //     <ChatDetailsTab
                                            //         data={{
                                            //             detailedViewItem
                                            //         }}
                                            //     />
                                            // ) : detailedViewItem?.source === 'WHATSAPP' || detailedViewItem?.source === 'WTSAPP' || detailedViewItem?.source === 'Whatsapp' ? (
                                            //     <WhatsappChatTab
                                            //         data={{
                                            //             detailedViewItem,
                                            //             socket
                                            //         }}
                                            //     />
                                            // )
                                            //     :
                                            // (
                                            //     <EmailDetailsTab
                                            //         data={{
                                            //             detailedViewItem
                                            //         }}
                                            //     />
                                            // )

                                            (<HelpdeskInfo
                                                data={{
                                                    detailedViewItem,
                                                    customerDetails,
                                                    projectTypes,
                                                    helpdeskStatus,
                                                    helpdeskTypes,
                                                    severities,
                                                    cancelReasonLookup,
                                                    projectLookup,
                                                    preferenceLookup,
                                                    appsConfig: props?.appsConfig ?? {}
                                                }}
                                                handlers={{
                                                    doSoftRefresh
                                                }}
                                            />)
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* workflowHistory */}
                    <div className="tab-pane skel-helpdesk-mh" id="historyDetails">
                        <WorkflowHistory
                            data={{
                                detailedViewItem,
                                customerDetails
                            }}
                            handlers={{
                                doSoftRefresh
                            }}
                        />
                    </div>
                    <div className="tab-pane skel-helpdesk-mh" id="interactionDetails">
                        <InteractionDeatilsPart1
                            data={{
                                detailedViewItem,
                                customerDetails
                            }}
                            handlers={{
                                doSoftRefresh
                            }}
                        />
                        {
                            ['LIVE-CHAT', 'WHATS-APP', 'FACEBOOK']?.includes(detailedViewItem?.helpdeskSource?.code) ? (
                                <ChatEditorSocial
                                    data={{
                                        isVerified,
                                        detailedViewItem,
                                        channelSource: detailedViewItem?.helpdeskSource?.code,
                                        fbId: detailedViewItem?.phoneNo
                                    }}
                                    handlers={{
                                        doSoftRefresh
                                    }}
                                />
                            ) : ['E-MAIL', 'WEB-PORTAL', 'WEB_APP', 'CALL_CENTER'].includes(detailedViewItem?.helpdeskSource?.code) ? (
                                <MailEditor
                                    data={{
                                        isDisabled,
                                        isVerified,
                                        detailedViewItem,
                                        projectTypes,
                                        helpdeskStatus,
                                        helpdeskTypes,
                                        severities,
                                        cancelReasonLookup,
                                        projectLookup
                                    }}
                                    handlers={{
                                        doSoftRefresh
                                    }}
                                />
                            )
                                // : detailedViewItem?.helpdeskSource?.code === 'FACEBOOK' ? (
                                //     <FacebookDetails
                                //         data={{
                                //             isDisabled,
                                //             isVerified,
                                //             detailedViewItem,
                                //             helpdeskStatus,
                                //         }}
                                //         handlers={{
                                //             doSoftRefresh
                                //         }}
                                //     />
                                // )
                                : <CloseHelpdeskTicket data={{
                                    isDisabled,
                                    isVerified,
                                    detailedViewItem,
                                    helpdeskStatus,
                                }}
                                    handlers={{
                                        doSoftRefresh
                                    }}>
                                </CloseHelpdeskTicket>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
})

export default DetailedView;