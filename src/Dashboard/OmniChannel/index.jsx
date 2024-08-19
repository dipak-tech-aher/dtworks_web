import React, { Suspense, useContext, useEffect, useMemo, useState, useRef } from 'react'
import { properties } from '../../properties';
import { get } from '../../common/util/restUtil';
import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import { nanoid } from 'nanoid';
import { toast } from "react-toastify";
import FilterBtn from "../../assets/images/filter-btn.svg";
import Filter from './filter';
import Header2 from './Components/Header2';
import Header1 from './Components/Header1';
import { OmniChannelContext, AppContext } from '../../AppContext';
import SuspenseFallbackLoader from '../../common/components/SuspenseFallbackLoader';
import { statusConstantCode } from '../../AppConstants';
import { orderBy } from 'lodash';
const FCR = React.lazy(() => import('./Components/FCR'));
const AverageHandlingTime = React.lazy(() => import('./Components/AverageHandlingTime'));
const AgentUtilization = React.lazy(() => import('./Components/AgentUtilization'));
const ChannelUtilization = React.lazy(() => import('./Components/ChannelUtilization'));
const SLA = React.lazy(() => import('./Components/SLA'));
const ResponseTimeHelpdesk = React.lazy(() => import('./Components/ResponseTimeHelpdesk'));
const CustomerRetentionRate = React.lazy(() => import('./Components/CustomerRetentionRate'));
const AbandonedHelpdeskRate = React.lazy(() => import('./Components/AbandonedHelpdeskRate'));
const CrossChannelJourneyCompletionRate = React.lazy(() => import('./Components/CrossChannelJourneyCompletionRate'));
const ResolutionRatebyChannel = React.lazy(() => import('./Components/ResolutionRatebyChannel'));
// const ChannelSwitchingRate = React.lazy(() => import('./Components/ChannelSwitchingRate'));
const SelfServiceAdoptionRate = React.lazy(() => import('./Components/SelfServiceAdoptionRate'));
const ResponseTimeChat = React.lazy(() => import('./Components/ResponseTimeChat'));
const AverageHandlingTimeChat = React.lazy(() => import('./Components/AverageHandlingTimeChat'));
const AverageResponseTimeAgent = React.lazy(() => import('./Components/AverageResponseTimeAgent'));
const AverageResolutionTimeAgent = React.lazy(() => import('./Components/AverageResolutionTimeAgent'));
const CustomerSatisfactionScoresAgent = React.lazy(() => import('./Components/CustomerSatisfactionScoresAgent'));
const AdherencetoSLAsAgent = React.lazy(() => import('./Components/AdherencetoSLAsAgent'));
const ByAgeing = React.lazy(() => import('./Components/ByAgeing'));
function getChannelIconClassName(channel) {
    switch (channel) {
        case "FB-LIVECHAT":
            return "fa-facebook-f";
        case "EMAIL":
            return "fas fa-envelope";
        case "WHATSAPP-LIVECHAT":
            return "fa-whatsapp";
        case "WEBSITE-LIVECHAT":
            return "fa fa-comments";
        case "LIVECHAT":
            return "fa fa-comments";
        case "TELEGRAM":
            return "fa-telegram";
        case "INSTAGRAM":
            return "fa-instagram";
        case "IVR":
            return "fa fa-microphone";
        case "WALKIN":
            return "fa fa-user";
        case "MOBILEAPP":
            return "fas fa-mobile-alt";
        case "MOBILE-LIVECHAT":
            return "fa fa-comments";
        case "SELFCARE":
            return "fa fa-globe";
        case "WebSelfcare":
            return "fa fa-globe";
        case "WEBPORTAL":
            return "fa fa-globe";
        case "Web":
            return "fa fa-globe";
        default:
            return "fa fa-globe";
    }
}
export default function OmniChannelDashboard() {
    const { appConfig } = useContext(AppContext)
    const dtWorksProductType = appConfig?.businessSetup?.[0];
    const [entity, setEntity] = useState('Helpdesk')
    const [activeChannel, setActiveChannel] = useState('ALL')
    const [masterLookupData, setMasterLookupData] = useState({});
    const [isPageRefresh, setIsPageRefresh] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [pageRefreshTime, setPageRefreshTime] = useState(30);
    const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const [searchParams, setSearchParams] = useState({
        startDate: startDate,
        endDate: endDate
    });
    const dateRange = useRef()
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INTXN_TYPE,INTXN_CATEGORY,TICKET_CHANNEL,HELPDESK_STATUS,DEPARTMENT,HELPDESK_TYPE,INTERACTION_STATUS,SERVICE_TYPE,SLA_TYPE')
            .then((response) => {
                const { data } = response;
                setMasterLookupData({ ...data });
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const TicketChannel = useMemo(() => {
        let TicketChannel = masterLookupData?.TICKET_CHANNEL ?? [];
        return orderBy(TicketChannel, 'mapping.sortOrder', 'asc')
    }, [masterLookupData])
    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return;
        }
        setIsChecked(event.target.checked);
    }

    useEffect(() => {
        unstable_batchedUpdates(() => {
            console.log('typeof(pageRefreshTime)-------', pageRefreshTime)
            if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
                const intervalId = setInterval(() => {
                    if (isChecked) {
                        // setTime(new Date())
                        setIsPageRefresh(!isPageRefresh)
                        const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                        // setLastDataRefreshTime({})
                        // console.log("Component refreshed!", pageRefreshTime);
                    }
                }, Number(pageRefreshTime) * 60 * 1000);

                return () => clearInterval(intervalId);
            }
        })
    }, [isChecked]);

    const contextProvider = {
        data: {
            channel: activeChannel,
            entity,
            searchParams,
            isPageRefresh
        },
        handlers: {},
        Loader: SuspenseFallbackLoader,
    }
    const clearFilter = (param, value) => {
        if (["project", "status", "severity", 'type', 'createRole', 'currentRole', 'currentDepartment', 'createdDepartment', 'category'].includes(param)) {
            searchParams[param] = searchParams[param].filter(x => x.value != value);
        } else {
            searchParams[param] = null;
        }

        setSearchParams({
            ...searchParams
        })
    }
    const getSelectedFilters = () => {
        let ageing, project, status, currentUser, severity, types, sla, createRole, createdDepartment, currentDepartment, currentRole, category;
        if (searchParams?.fromDate || searchParams?.toDate) {
            let fromDate = searchParams?.fromDate;
            let toDate = searchParams?.toDate ? searchParams?.toDate : fromDate;
            dateRange.current = fromDate + " - " + toDate;
        }
        if (searchParams?.type?.length) types = searchParams?.type;
        if (searchParams?.createRole?.length) createRole = searchParams?.createRole;
        if (searchParams?.createdDepartment?.length) createdDepartment = searchParams?.createdDepartment;
        if (searchParams?.currentDepartment?.length) currentDepartment = searchParams?.currentDepartment;
        if (searchParams?.currentUser?.length) currentUser = searchParams?.currentUser;
        if (searchParams?.currentRole?.length) currentRole = searchParams?.currentRole;
        if (searchParams?.category?.length) category = searchParams?.category;
        if (searchParams?.project?.length) project = searchParams?.project;
        if (searchParams?.status?.length) status = searchParams?.status;
        if (searchParams?.ageing?.value) ageing = searchParams?.ageing;
        if (searchParams?.sla?.value) sla = searchParams?.sla;
        if (searchParams?.severity?.length) severity = searchParams?.severity;

        return (
            <React.Fragment>
                {dateRange && (
                    <li style={{ fontSize: '15px' }}>
                        Date Range:
                        <span className="dash-filter-badge ml-1">{dateRange.current}
                        </span>
                    </li>
                )}
                {types && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        {entity} Types: {types.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('type', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {project && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Projects: {project.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('project', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {status && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Status: {status.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('status', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {createRole && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Created Roles: {createRole.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('createRole', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {currentRole && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Current Roles: {currentRole.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('currentRole', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {createdDepartment && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Created Department: {createdDepartment.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('createdDepartment', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {currentDepartment && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Current Department: {currentDepartment.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('currentDepartment', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {category && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        {entity} Category: {category.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('category', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {ageing && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Ageing:
                        <span className="dash-filter-badge ml-2">{ageing.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('ageing', ageing.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {sla && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        SLA:
                        <span className="dash-filter-badge ml-2">{sla.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('sla', sla.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {severity && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Severity: {severity.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('severity', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {currentUser && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Current Users:
                        {currentUser.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('currentUser', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
            </React.Fragment>
        )
    }

    return (
        <OmniChannelContext.Provider value={contextProvider}>
            <div id="wrapper">
                {[statusConstantCode.type.PUBLIC_SERVICE, statusConstantCode.type.HELPDESK_SERVICE].includes(dtWorksProductType) ? <div className="content-page" style={{ margin: 0 }}>
                    <div className="content">
                        <div className="container-fluid">
                            <div className="cnt-wrapper">
                                <div className="card-skeleton">
                                    <div className="customer-skel mt-0">
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="tab-content">
                                                    <div className="tab-pane fade show active" id="me" role="tabpanel" aria-labelledby="me-tab">
                                                        <div className="skle-swtab-sect">
                                                            <div className="btn-toolbar" role="toolbar">
                                                                <div className="btn-group btn-group-custom" role="group">
                                                                    <button type="button" className={`skel-btn-submit-outline ml-0 ${entity === 'Helpdesk' ? 'active' : ''}`} onClick={() => setEntity('Helpdesk')}>
                                                                        Helpdesk
                                                                    </button>
                                                                    <button type="button" className={`skel-btn-submit-outline ml-0 ${entity === 'Interaction' ? 'active' : ''}`} onClick={() => setEntity('Interaction')}>
                                                                        Interaction
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="db-list mb-0 pl-0 skel-ar-filter-sect">

                                                            </div>
                                                            <form className="form-inline">
                                                                <span className="ml-1">Auto Refresh</span>
                                                                <div className="switchToggle ml-1">
                                                                    <input
                                                                        id="switch1"
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={handleAutoRefresh}
                                                                    />
                                                                    <label htmlFor="switch1">Toggle</label>
                                                                </div>
                                                                <button type="button" className="ladda-button  btn btn-secondary btn-xs ml-1" dir="ltr" data-style="slide-left">
                                                                    <span className="ladda-label" onClick={() => setIsPageRefresh(!isPageRefresh)}>
                                                                        <i className="material-icons">refresh</i>
                                                                    </span>
                                                                    <span className="ladda-spinner"></span>
                                                                </button>
                                                                <select
                                                                    className="custom-select custom-select-sm ml-1"
                                                                    defaultValue={"Set"}
                                                                    value={pageRefreshTime}
                                                                    onChange={(e) => setPageRefreshTime(e.target.value)}
                                                                >
                                                                    <option value="Set">Set</option>
                                                                    <option value={Number(1)}>1 Min</option>
                                                                    <option value={Number(5)}>5 Min</option>
                                                                    <option value={Number(15)}>15 Min</option>
                                                                    <option value={Number(30)}>30 Min</option>
                                                                </select>
                                                                <div className="db-list mb-0 pl-1">
                                                                    <a className="skel-fr-sel-cust cursor-pointer" onClick={() => setShowFilter(!showFilter)}>
                                                                        <div className="list-dashboard db-list-active skel-self">
                                                                            <span className="db-title">
                                                                                Filter <img src={FilterBtn} className="img-fluid pl-1" />
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                </div>
                                                            </form>
                                                        </div>
                                                        <Filter
                                                            data={{ showFilter, searchParams, isParentRefresh: isPageRefresh, masterLookupData, startDate, endDate, entity }}
                                                            handler={{ setShowFilter, setSearchParams, }}
                                                        />
                                                        <div className='tabbable'>
                                                            <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                                <li className="nav-item" role="presentation">
                                                                    <button
                                                                        className={`nav-link ${activeChannel === 'ALL' ? 'active' : ''}`}
                                                                        id="all-tab"
                                                                        data-toggle="tab"
                                                                        data-target="#all"
                                                                        type="button"
                                                                        role="tab"
                                                                        aria-controls="all"
                                                                        aria-selected="true"
                                                                        onClick={() => setActiveChannel('ALL')}
                                                                    >
                                                                        All
                                                                    </button>
                                                                </li>
                                                                {TicketChannel.map((channel) => {
                                                                    return (
                                                                        <li className="nav-item" role="presentation" key={nanoid()}>
                                                                            <button className={`nav-link ${activeChannel === channel?.code ? 'active' : ''}`} id={channel?.code} data-toggle="tab" data-target={`#${channel?.code}`} type="button" role="tab" aria-controls="fb" aria-selected="false"
                                                                                onClick={() => setActiveChannel(channel?.code)}
                                                                            >
                                                                                <i className={`fab ${getChannelIconClassName(channel?.code)} text-12 mr-1"`} />
                                                                                {channel.description}
                                                                            </button>
                                                                        </li>
                                                                    )
                                                                })}
                                                            </ul>
                                                        </div>
                                                        <div className="skle-swtab-sect mt-0 mb-0">
                                                            <ul className="skel-top-inter mt-1 mb-0">
                                                                {getSelectedFilters()}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="tab-content" id="myTabContent">
                                <div className="tab-pane fade show active" id="all" role="tabpanel" aria-labelledby="all-tab">
                                    <Header1 />
                                    <Header2 />
                                </div>
                                <div className="row mx-lg-n1 mt-1" >
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <FCR />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AverageHandlingTime />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AgentUtilization />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <ChannelUtilization />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <SLA />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <ResponseTimeHelpdesk />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <CustomerRetentionRate />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AbandonedHelpdeskRate />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <CrossChannelJourneyCompletionRate />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <ResolutionRatebyChannel />
                                    </Suspense>
                                    {/* <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <ChannelSwitchingRate />
                                    </Suspense> */}
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <SelfServiceAdoptionRate />
                                    </Suspense>
                                    {
                                        entity === 'Helpdesk' && <>
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                <ResponseTimeChat />
                                            </Suspense>
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                <AverageHandlingTimeChat />
                                            </Suspense>
                                        </>
                                    }
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AverageResponseTimeAgent />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AverageResolutionTimeAgent />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <CustomerSatisfactionScoresAgent />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AdherencetoSLAsAgent />
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <ByAgeing />
                                    </Suspense>

                                </div>
                            </div>
                        </div>
                    </div>
                </div> : <div className='d-flex'><div>Comming Soon</div></div>}

            </div>
        </OmniChannelContext.Provider>

    )
}
