import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'
import { get, post } from '../../../../common/util/restUtil';
import { toast } from 'react-toastify';
import { properties } from '../../../../properties';
import HelpdeskHeader from './HelpdeskHeader';
import HelpdeskDetails from './HelpdeskDetails';
import Profile from './tabPanel/Profile';
import HelpdeskSimilar7Days from './HelpdeskSimilar7Days';
import HelpdeskStatement7Days from './HelpdeskStatement7Days';
import HelpdeskTypeOverView from './HelpdeskTypeOverview';
import HelpdeskChannelsLast7Days from './HelpdeskChannelsLast7Days';
import Interaction from './tabPanel/Interaction';
import Attachment from './tabPanel/Attachment';
import WorkforceAnalytics from './WorkforceAnalytics';
import Customer from './tabPanel/Customer';
import Logs from './tabPanel/Logs';
import NotSure from '../../../../assets/images/not-sure.png'
import { unstable_batchedUpdates } from 'react-dom';
import ViewHelpdeskTicketPDF from './PDF';
import { useReactToPrint } from 'react-to-print';
import Modal from 'react-modal';
import moment from 'moment';
import { getPermissions, getConfig } from '../../../../common/util/util';
import { metaConfig } from '../../../../AppConstants'
import { AppContext } from '../../../../AppContext';

import { statusConstantCode } from '../../../../AppConstants';
import AppointmentInformation from '../../../Interaction/InteractionAction/components/Normal/AppointmentInformation';
export default function ViewHelpdeskTicket(props) {
    const viewHelpdeskData = JSON.parse(localStorage.getItem('viewHelpdeskData'))
    // console.log("props ==> ", props)
    const propsData = props?.location?.state?.data ? props?.location?.state?.data : viewHelpdeskData?.data;
    // console.log('propsData ', propsData)
    const [activeTab, setActiveTab] = useState(false)
    const [PageView, setPageView] = useState('InsightView')
    let helpdeskId = propsData?.helpdeskId ?? propsData?.oHelpdeskId
    const [detailedViewItem, setDetailedViewItem] = useState();
    const [mailAttachments, setMailAttachments] = useState([]);
    const [refresh, setRefresh] = useState(false)
    const [logList, setLogList] = useState([]);
    const [generatePdf, setGeneratePdf] = useState(false)
    const componentRef = useRef();
    const pdfRef = useRef();
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [consumerFromIsEnabled, setConsumerFromIsEnabled] = useState("")
    const { systemConfig } = useContext(AppContext)

    const getHelpdeskData = useCallback(() => {
        if (!helpdeskId) {
            toast.warn("Helpdesk Id not found");
        }
        const requestBody = {
            helpdeskId: Number(helpdeskId),
            contain: ["CUSTOMER", "INTERACTION", 'USER', 'ROLE', 'DEPARTMENT'],
        };
        post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
            .then((response) => {
                const { status, data } = response;
                if (status === 200) {
                    if (
                        response &&
                        response?.data &&
                        response?.data?.rows &&
                        response?.data?.rows.length > 0
                    ) {
                        if (data?.rows?.[0].userCategory === 'CUSTOMER') {
                            setActiveTab("CUSTOMER")
                        } else if (data?.rows?.[0].userCategory === 'PROFILE') {
                            setActiveTab("PROFILE")
                        } else {
                            setActiveTab("Attachment")
                        }
                        // console.log('data row',data)
                        setDetailedViewItem(data?.rows?.[0]);
                    }
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, [helpdeskId]);

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig, metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config?.configValue);
            } catch (error) {
                console.error('Error fetching specific system config:', error);
            }
        };
        fetchConfigData();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('HELPDESK_360');
                // // console.log('permissions', permissions);
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    useEffect(() => {
        getHelpdeskData();
    }, [getHelpdeskData, refresh]);

    const getAttachments = useCallback((type) => {
        if (detailedViewItem?.helpdeskUuid && type) {
            get(`${properties.ATTACHMENT_API}?entity-id=${detailedViewItem?.helpdeskUuid}&entity-type=${type}`).then((response) => {
                if (response.data && response.data.length) {
                    setMailAttachments(response.data);
                }
            }).catch((error) => {
                console.error("error", error)
            }).finally()
        }
    }, [detailedViewItem?.helpdeskUuid])

    useEffect(() => {
        getAttachments('HELPDESK');
    }, [getAttachments, refresh]);


    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: `${detailedViewItem?.helpdeskNo} ${detailedViewItem?.helpdeskType?.description} ${moment().format('DD-MM-YYYY')}`,
        onAfterPrint: () => {
            setGeneratePdf(false)
        }
    });
    const handleGeneratePdf = () => {
        setGeneratePdf(true)
        setTimeout(() => {
            handlePrint()
        }, 1000)
    }
    const setExportData = (name, value) => {
        pdfRef.current = { [name]: value, ...pdfRef.current }
    }
    const checkReportEnabled = () => {

        const { updatedAt, createdAt, helpdeskType, status } = detailedViewItem || {};
        const diffMinutes = moment(updatedAt).diff(moment(createdAt), 'minutes');
        const { configValue = '' } = systemConfig?.find(val => val.configKey === metaConfig?.HELPDESK_REPORT_TYPES) ?? {};
        let { helpdeskClosedTime, helpdeskTypes = [] } = configValue ? JSON.parse(configValue) : {};
        helpdeskTypes = helpdeskTypes.map((type) => type.value)

        const isReportEnabled = (
            diffMinutes <= helpdeskClosedTime &&
            helpdeskTypes.includes(helpdeskType?.code) &&
            status?.code === statusConstantCode.status.HELPDESK_CLOSED &&
            checkComponentPermission('HELPDESK_REPORT')
        );
        return isReportEnabled;
    };

    return (
        <>
            {/* Start Content*/}
            <div className="container-fluid pr-1">
                {/* Main Content */}
                <div className="cnt-wrapper">
                    {/* New skeleton base */}
                    <div className="card-skeleton">
                        <div className="cmmn-skeleton mt-2">
                            <div className="skel-i360-base">
                                <HelpdeskHeader
                                    data={{ detailedViewItem, PageView, refresh }}
                                    handler={{ setPageView, setRefresh, handleGeneratePdf, checkComponentPermission, checkReportEnabled }}
                                />
                            </div>
                        </div>

                        {PageView === 'InsightView' ?
                            <>

                                <div className="skel-self-data">
                                    <HelpdeskDetails data={{ detailedViewItem, mailAttachments, refresh, logList }} handler={{ getHelpdeskData, setRefresh }} />
                                    <div className="cmmn-skeleton mt-2" >
                                        <div className="tabbable mt-2">
                                            <ul className="nav nav-tabs" id="myTab1" role="tablist">
                                                {(detailedViewItem && detailedViewItem.userCategory === 'CUSTOMER') && <li className="nav-item">
                                                    <a
                                                        className={`nav-link ${activeTab === 'CUSTOMER' ? 'active' : ""}`}
                                                        id="cust-conv-tab"
                                                        data-toggle="tab"
                                                        href="#customerinformation"
                                                        role="tab"
                                                        aria-controls="custconvtab"
                                                        aria-selected="false"
                                                        onClick={() => setActiveTab('CUSTOMER')}
                                                    >
                                                        Customer Information
                                                    </a>
                                                </li>}
                                                {(detailedViewItem && detailedViewItem.userCategory === 'PROFILE') && <li className="nav-item">
                                                    <a
                                                        className={`nav-link ${activeTab === 'PROFILE' ? 'active' : ""}`}
                                                        id="profile-tab"
                                                        data-toggle="tab"
                                                        href="#profiledetails"
                                                        role="tab"
                                                        aria-controls="custtab"
                                                        aria-selected="true"
                                                        onClick={() => setActiveTab('PROFILE')}
                                                    >
                                                        Profile Details
                                                    </a>
                                                </li>}
                                                <li className="nav-item">
                                                    <a
                                                        className={`nav-link ${activeTab === 'Attachment' ? 'active' : ""}`}
                                                        id="att-tab"
                                                        data-toggle="tab"
                                                        href="#attachment"
                                                        role="tab"
                                                        aria-controls="atttab"
                                                        aria-selected="false"
                                                        onClick={() => setActiveTab('Attachment')}
                                                    >
                                                        Attachment
                                                    </a>
                                                </li>
                                                <li className="nav-item">
                                                    <a
                                                        className="nav-link"
                                                        id="helpdesk-tab"
                                                        data-toggle="tab"
                                                        href="#helpdesktab"
                                                        role="tab"
                                                        aria-controls="helpdesktab"
                                                        aria-selected="false"
                                                        onClick={() => setActiveTab('Interaction')}
                                                    >
                                                        Interaction Details
                                                    </a>
                                                </li>
                                                <li className="nav-item">
                                                    <a
                                                        className="nav-link"
                                                        id="appointment-tab"
                                                        data-toggle="tab"
                                                        href="#appointmenttab"
                                                        role="tab"
                                                        aria-controls="appointmenttab"
                                                        aria-selected="false"
                                                        onClick={() => setActiveTab('Appointment')}
                                                    >
                                                        Upcoming Appointments
                                                    </a>
                                                </li>
                                                <li className="nav-item">
                                                    <a
                                                        className="nav-link"
                                                        id="log-tab"
                                                        data-toggle="tab"
                                                        href="#logtab"
                                                        role="tab"
                                                        aria-controls="loginfo"
                                                        aria-selected="false"
                                                        onClick={() => setActiveTab('LogInfo')}
                                                    >
                                                        Log Info
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="tab-content mt-2">
                                            {(detailedViewItem && detailedViewItem.userCategory === 'CUSTOMER') && <div
                                                className={`tab-pane fade ${activeTab === 'CUSTOMER' ? 'active show' : ''}`}
                                                id="customerinformation"
                                                role="tabpanel"
                                                aria-labelledby="custtab"
                                            >
                                                <Customer data={{ detailedViewItem }} handler={{ setExportData }} />
                                            </div>}
                                            {(detailedViewItem && detailedViewItem.userCategory === 'PROFILE') && <div
                                                className={`tab-pane fade ${activeTab === 'PROFILE' ? 'active show' : ''}`}
                                                id="profiledetails"
                                                role="tabpanel"
                                                aria-labelledby="profiletab"
                                            >
                                                <Profile data={{ detailedViewItem }} handler={{ setExportData }} />
                                            </div>}

                                            <div
                                                className={`tab-pane fade ${activeTab === 'Attachment' ? 'active show' : ''}`}
                                                id="attachment"
                                                role="tabpanel"
                                                aria-labelledby="atttab"
                                            >
                                                <Attachment data={mailAttachments} />
                                            </div>
                                            <div
                                                className={`tab-pane fade ${activeTab === 'Interaction' ? 'active show' : ''}`}
                                                id="helpdesktab"
                                                role="tabpanel"
                                                aria-labelledby="helpdesktab"
                                            >
                                                <Interaction data={{ detailedViewItem }} />
                                            </div>
                                            <div
                                                className={`tab-pane fade ${activeTab === 'Appointment' ? 'active show' : ''}`}
                                                id="appointmenttab"
                                                role="tabpanel"
                                                aria-labelledby="appointmenttab"
                                            >
                                                {activeTab === 'Appointment' && <AppointmentInformation data={{ informationHelpdeskDetails: detailedViewItem }} />}
                                            </div>
                                            <div
                                                className={`tab-pane fade ${activeTab === 'LogInfo' ? 'active show' : ''}`}
                                                id="logtab"
                                                role="tabpanel"
                                                aria-labelledby="atttab"
                                            >
                                                <Logs data={{ detailedViewItem, logList }} handler={{ setLogList }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                            :
                            <div
                                className="skel-informative-data mt-2 mb-2"

                            >
                                <div className='row'>
                                    <div className="col-md-8">
                                        <HelpdeskSimilar7Days data={{ detailedViewItem }} />
                                        <HelpdeskStatement7Days data={{ detailedViewItem }} />
                                        <WorkforceAnalytics data={{ detailedViewItem }} />
                                    </div>
                                    <div className="col-md-4">
                                        <div className="cmmn-skeleton mb-2">
                                            <div className="text-center mt-4 mb-3">
                                                <img
                                                    src={NotSure}
                                                    width={60}
                                                    className=""
                                                />
                                                <h5 className="text-center rating mb-0">
                                                    <span>0</span>/5
                                                </h5>
                                                <p className="line-height-normal">
                                                    <span className="text-40">“</span>Query has not resolved
                                                    successfully with-in short period! Not happy with their
                                                    resolution.
                                                </p>
                                            </div>
                                        </div>
                                        <HelpdeskTypeOverView data={{ ...detailedViewItem }} />
                                        <HelpdeskChannelsLast7Days data={{ ...detailedViewItem }} />
                                    </div>
                                </div>
                            </div>
                        }

                    </div>
                </div>
                {/* Main Content Ends */}

                {
                    generatePdf &&
                    <Modal isOpen={generatePdf} >
                        <ViewHelpdeskTicketPDF ref={componentRef} consumerFromIsEnabled={consumerFromIsEnabled} data={{ detailedViewItem, logList, pdfData: pdfRef.current }} />
                    </Modal>
                }
            </div>
        </>



    )
}
