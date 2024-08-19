import React, { Suspense, useContext, useEffect, useState } from 'react'
import Livestream from "../../../assets/images/livestream.svg";
import DashboardIcons from "../../../assets/images/dashboard-icons.svg";
import filterPng from '../../../assets/images/filter-btn.png'
import Filter from '../Filter';
import { AppContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { slowPost } from '../../../common/util/restUtil';
import SuspenseFallbackLoader from '../../../common/components/SuspenseFallbackLoader';
import AssignToMe from '../assignToMe';
import RequestTable from '../../../CRM/Request/table';
import AssignInteractions from './assignedInteractions';
import AgentPerformance from '../Performance/AgentPerformance';
import InteractionHistory from './interactionHistory';
import TopFivePerformer from '../Performance/TopFivePerformer';
import TopPerformanceInteraction from '../CategoryPerformance/TopPerformanceInteraction';
import TopPerformanceChat from '../Performance/TopPerformerChat';
import OverAllPerformance from '../Performance/OverAllPerformance';
import { statusConstantCode } from '../../../AppConstants';
import moment from 'moment';
import Insights from '../insights';
import { Modal } from 'react-bootstrap';
import DashboardFilteredContent from '../components/showFilteredContent';

export default function InteractionsTab(props) {
    // console.log("interaction tab render");
    let { meOrMyTeam, isPageRefresh, appsConfig, requestLastUpdatedAt, getOverViewDetails } = props;
    const { auth } = useContext(AppContext);
    const [showFilter, setShowFilter] = useState(false);
    const [viewType, setViewType] = useState('skel-interactive')
    const [serviceTypes, setServiceTypes] = useState([]);
    const [requestTotalCount, setRequestTotalCount] = useState(0);
    const [requestRefresh, setRequestRefresh] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [screenType, setScreenType] = useState(null)
    const [searchParams, setSearchParams] = useState({
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });
    const [agentInteractionPerformance, setAgentInteractionPerformance] = useState([])
    const [agentAppointmentPerformance, setagentAppointmentPerformance] = useState([]);
    const [agentPerformanceLoader, setAgentPerformanceLoader] = useState(false)
    const handleClose = () => {
        setIsFullScreen(false);
    };
    const handleClear = (event) => {
        event.preventDefault();
        // reset();
        setSearchParams({
            fromDate: undefined, toDate: undefined, serviceCat: undefined,
            serviceType: undefined, teamMemberId: undefined,
            roleId: auth?.currRoleId,
            departmentId: auth?.currDeptId
        });
        setShowFilter(false);
    }
    useEffect(() => {
        getTopPerformance()
    }, [meOrMyTeam, isPageRefresh])
    const getTopPerformance = async () => {

        const requestBody = {
            searchParams: {
                userId: auth?.user?.userId
            }
        }
        try {
            setAgentPerformanceLoader(true)
            let resp = []
            if (appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byInteractions?.isActive) {
                resp = await slowPost(`${properties.INTERACTION_API}/get-top-performance`, { ...requestBody })
                setAgentInteractionPerformance(resp?.data)
            }
            if (appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byAppointments?.isActive) {
                resp = await slowPost(`${properties.APPOINTMENT_API}/get-top-performance`, { ...requestBody })
                setagentAppointmentPerformance(resp?.data)
            }
        } catch (error) {
            // console.log(error)
        } finally {
            setAgentPerformanceLoader(false)

        }
    }   

    return (
        <>
            <div className="row">
                <div className="col-md-12">
                    <div className="db-list d-flex-algn-center align-rht-side mb-2 pl-0">
                        <div
                            className="list-dashboard-tab skel-sw-informative-view db-list-tab-active cursor-pointer skel-btn-submit"
                            id="skel-sw-informative-view"
                            style={{ display: viewType === 'skel-informative' ? "none" : '' }}
                            onClick={() => setViewType('skel-informative')}
                        >
                            <span className="db-title">
                                <img
                                    src={Livestream}
                                    className="img-fluid pr-1"
                                />{" "}
                                Switch to Informative View
                            </span>
                        </div>
                        <div
                            className="list-dashboard-tab db-list-tab-active cursor-pointer skel-sw-interactive-view skel-btn-submit"
                            id="skel-sw-interactive-view"
                            style={{ display: viewType === 'skel-interactive' ? "none" : '' }}
                            onClick={() => setViewType('skel-interactive')}
                        >
                            <span className="db-title">
                                <img
                                    src={DashboardIcons}
                                    className="img-fluid pr-1"
                                />{" "}
                                Switch to Interactive View
                            </span>
                        </div>
                        <div className="mb-0">

                            <div className="list-dashboard-tab db-list-tab-active skel-btn-submit skel-self db-list-active">
                                <span className="db-title cursor-pointer" onClick={() => setShowFilter(!showFilter)}>
                                    Filter{" "}
                                    <img
                                        src={filterPng}
                                        className="img-fluid pl-1"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Filter
                data={{
                    showFilter,
                    meOrMyTeam,
                    serviceTypes,
                    searchParams
                }}
                handler={{
                    setShowFilter,
                    handleClear,
                    setSearchParams,
                    getOverViewDetails,
                    getTopPerformance,
                    setServiceTypes
                }}
            />
            <DashboardFilteredContent searchParams={searchParams} setSearchParams={setSearchParams}/>
            {
                (viewType === 'skel-interactive')
                    ?
                    (
                        <div className="skel-interactive-view-data1">
                            <div className="row">
                                {meOrMyTeam === 'Me' && appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedToMe?.isActive && (

                                    <AssignToMe data={{ appsConfig, searchParams, fromComp: 'INTERACTION' }} />

                                )}

                                {appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.pendingRequest?.isActive && <div className="col-md-12 mt-3">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <div className="cmmn-skeleton">
                                            <div className="skel-dashboard-title-base">
                                                <span className="skel-header-title">Pending Requests ({requestTotalCount})</span>
                                                <div className="skel-dashboards-icons">
                                                    <a><i title="Refresh" className="material-icons" onClick={() => setRequestRefresh(!requestRefresh)}>refresh</i></a>
                                                </div>
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="">
                                                <RequestTable
                                                    requestStatus={"open"}
                                                    selectedTab={"my-request"}
                                                    screenAction={"Manage Request"}
                                                    setRequestTotalCount={setRequestTotalCount}
                                                    requestRefresh={requestRefresh}
                                                    setRequestRefresh={setRequestRefresh}
                                                />
                                            </div>
                                            <hr className="cmmn-hline" />
                                            <div className="skel-refresh-info">
                                                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(requestLastUpdatedAt).fromNow()}</span>
                                                <div className="skel-data-records"></div>
                                            </div>
                                        </div>
                                    </Suspense>
                                </div>}
                            </div>
                            <hr className="cmmn-hline mt-3 mb-0" />
                            <div className="row" id='pooled-block'>
                                {appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.pooledInteractions?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AssignInteractions data={{ type: 'POOLED', isFullScreen, searchParams }} handlers={{ setIsFullScreen, setScreenType }}
                                            loader={SuspenseFallbackLoader}
                                        />
                                    </Suspense>
                                </div>}
                                {appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedInteractions?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AssignInteractions data={{ type: 'ASSIGNED', isFullScreen, searchParams }} handlers={{ setIsFullScreen, setScreenType }}
                                            loader={SuspenseFallbackLoader}
                                        />
                                    </Suspense>
                                </div>}
                            </div>
                        </div>
                    )
                    :
                    (viewType === 'skel-informative')
                        ? (
                            <div className="skel-interactive-view-data1">
                                {meOrMyTeam === "Me" && (
                                    <Insights data={{ searchParams, viewType }} />
                                )}
                                {meOrMyTeam !== 'Me' && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.isActive && <> <span className="skel-header-title">Top 5 Performance</span>
                                    <div className="skel-top-5-perf-sect">
                                        {appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byInteractions?.isActive &&
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                {agentPerformanceLoader ? <SuspenseFallbackLoader /> :
                                                    <AgentPerformance
                                                        data={{
                                                            source: statusConstantCode?.entityCategory?.INTERACTION,
                                                            agentPerformance: agentInteractionPerformance
                                                        }}
                                                        handlers={{
                                                            setAgentPerformance: setAgentInteractionPerformance
                                                        }} />}
                                            </Suspense>}
                                        {!!!statusConstantCode?.businessSetup.includes(appsConfig?.businessSetup?.[0]) && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byAppointments?.isActive &&
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                {agentPerformanceLoader ? <SuspenseFallbackLoader /> :
                                                    <AgentPerformance
                                                        data={{
                                                            source: statusConstantCode?.entityCategory?.APPOINTMENT,
                                                            agentPerformance: agentAppointmentPerformance
                                                        }}
                                                        handlers={{
                                                            setAgentPerformance: setagentAppointmentPerformance
                                                        }} />
                                                }
                                            </Suspense>
                                        }
                                    </div></>}
                                <div className="skel-oper-flex">
                                    {/* {meOrMyTeam === 'Me' && <div className="col-md-6">
                                                                        <PerformanceActivity />
                                                                    </div>} */}
                                    {appsConfig?.clientConfig?.operational_dashboard?.informativeView?.interactionCorner?.isActive && <div className="skel-wrap-sect">
                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                            <InteractionHistory loader={SuspenseFallbackLoader} data={{ searchParams }} />
                                        </Suspense>
                                    </div>}

                                    {meOrMyTeam !== 'Me' && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.topPerformanceActivity?.isActive && <div className="skel-wrap-sect">
                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                            <TopFivePerformer loader={SuspenseFallbackLoader} />
                                        </Suspense>
                                    </div>}
                                    {meOrMyTeam === 'Me' && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Interactions?.isActive &&
                                        <div className="skel-wrap-sect">
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                <TopPerformanceInteraction loader={SuspenseFallbackLoader} data={{ searchParams }} />
                                            </Suspense>
                                        </div>
                                    }

                                    {
                                        meOrMyTeam !== 'Me' &&
                                        <>
                                            {appsConfig?.clientConfig?.operational_dashboard?.informativeView?.topPerformerChat?.isActive && <div className="skel-wrap-sect">
                                                <Suspense fallback={<SuspenseFallbackLoader />}>
                                                    <TopPerformanceChat />
                                                </Suspense>
                                            </div>}
                                            {appsConfig?.clientConfig?.operational_dashboard?.informativeView?.teamCategoryPerformance?.isActive && <div className="skel-wrap-sect">
                                                <Suspense fallback={<SuspenseFallbackLoader />}>
                                                    <OverAllPerformance />
                                                </Suspense>
                                            </div>}
                                        </>
                                    }
                                </div>
                            </div>
                        )
                        :
                        null
            }
            <Modal show={isFullScreen} backdrop="static" keyboard={false} onHide={handleClose} className="modal-fullscreen-xl">
                <Modal.Body>
                    <Suspense fallback={<SuspenseFallbackLoader />}>
                        <AssignInteractions data={{ type: screenType, isFullScreen }} handlers={{ setIsFullScreen, setScreenType }}
                        />
                    </Suspense>
                </Modal.Body>
            </Modal>
        </>
    )
}
