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
import AssignedOrders from '../Orders/assignedOrders';
import AgentPerformance from '../Performance/AgentPerformance';
import OrderHistory from '../Orders/orderHistory';
import TopFivePerformer from '../Performance/TopFivePerformer';
import TopPerformanceChat from '../Performance/TopPerformerChat';
import OverAllPerformance from '../Performance/OverAllPerformance';
import TopPerformanceOrder from '../CategoryPerformance/TopPerformanceOrder';
import { statusConstantCode } from '../../../AppConstants';
import moment from 'moment';
import Insights from '../insights';
import DashboardFilteredContent from '../components/showFilteredContent';

export default function OrdersTab(props) {
    // console.log("order tab render");
    let { meOrMyTeam, isPageRefresh, appsConfig, getOverViewDetails, tabSuperScriptCount, setTabSuperScriptCount, source } = props;
    const { auth, appConfig } = useContext(AppContext);
    const [showFilter, setShowFilter] = useState(false);
    const [viewType, setViewType] = useState('skel-interactive')
    const [serviceTypes, setServiceTypes] = useState([]);
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [screenType, setScreenType] = useState(null)
    const [searchParams, setSearchParams] = useState({
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });
    const [agentOrderPerformance, setagentOrderPerformance] = useState([])
    const [agentAppointmentPerformance, setagentAppointmentPerformance] = useState([]);
    const [agentPerformanceLoader, setAgentPerformanceLoader] = useState(false)
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

            if (appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byOrders?.isActive) {
                resp = await slowPost(`${properties.ORDER_API}/get-top-performance`, { ...requestBody })
                setagentOrderPerformance(resp?.data)
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
    // console.log("from order tab setting fromcomp order", viewType, meOrMyTeam, appsConfig?.clientConfig?.operational_dashboard)
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
                    serviceTypes
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

                                    <AssignToMe data={{ appsConfig, searchParams, fromComp: 'ORDER' }} />

                                )}
                            </div>
                            <hr className="cmmn-hline mt-3 mb-0" />
                            <div id='pooled-block' className={!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) ? 'row' : "d-none"}>
                                {appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedOrders?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AssignedOrders data={{ type: 'POOLED', isFullScreen }} handlers={{ setIsFullScreen, setScreenType }}
                                            loader={SuspenseFallbackLoader}
                                        />
                                    </Suspense>
                                </div>}
                                {appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.pooledOrders?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AssignedOrders data={{ type: 'ASSIGNED', isFullScreen }} handlers={{ setIsFullScreen, setScreenType }}
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
                                        {!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byOrders?.isActive &&
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                {agentPerformanceLoader ? <SuspenseFallbackLoader /> :
                                                    <AgentPerformance
                                                        data={{
                                                            source: statusConstantCode?.entityCategory?.ORDER,
                                                            agentPerformance: agentOrderPerformance
                                                        }}
                                                        handlers={{
                                                            setAgentPerformance: setagentOrderPerformance
                                                        }} />
                                                }
                                            </Suspense>
                                        }
                                        {!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byAppointments?.isActive &&
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
                                    {appsConfig?.clientConfig?.operational_dashboard?.informativeView?.orderCorner?.isActive && <div className={!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) ? 'skel-wrap-sect' : "d-none"}>
                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                            <OrderHistory loader={SuspenseFallbackLoader} />
                                        </Suspense>
                                    </div>}
                                    {meOrMyTeam !== 'Me' && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.topPerformanceActivity?.isActive && <div className="skel-wrap-sect">
                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                            <TopFivePerformer loader={SuspenseFallbackLoader} />
                                        </Suspense>
                                    </div>}

                                    {meOrMyTeam !== 'Me' &&
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
                                    {meOrMyTeam === 'Me' && appsConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Orders?.isActive &&
                                        <div className={!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) ? 'skel-wrap-sect' : "d-none"} >
                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                <TopPerformanceOrder />
                                            </Suspense>
                                        </div>
                                    }
                                </div>
                            </div>
                        )
                        :
                        null
            }
        </>
    )
}
