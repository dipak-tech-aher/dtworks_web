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
import UpcomingAppoinments from './upcomingAppoinments';
import AssignedOrders from '../Orders/assignedOrders';
import AgentPerformance from '../Performance/AgentPerformance';
import OrderHistory from '../Orders/orderHistory';
import AppoinmentHistory from './appoinmentHistory';
import TopFivePerformer from '../Performance/TopFivePerformer';
import TopPerformanceChat from '../Performance/TopPerformerChat';
import OverAllPerformance from '../Performance/OverAllPerformance';
import TopPerformanceOrder from '../CategoryPerformance/TopPerformanceOrder';
import { statusConstantCode } from '../../../AppConstants';
import moment from 'moment';
import Insights from '../insights';
import DashboardFilteredContent from '../components/showFilteredContent';

export default function AppoinmentsTab(props) {
    // console.log("order tab render");
    let { meOrMyTeam, isPageRefresh, getOverViewDetails } = props;
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
            if (appConfig?.clientConfig?.operational_dashboard?.informativeView?.top5Performance?.byAppointments?.isActive) {
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
            <DashboardFilteredContent searchParams={searchParams} setSearchParams={setSearchParams} />
            {
                (viewType === 'skel-interactive')
                    ?
                    (
                        <div className="skel-interactive-view-data1">
                            <div className="row">
                                {/* appConfig?.clientConfig?.operational_dashboard?.interactiveView?.upcomingAppointments?.isActive && */}
                                <div className={!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) ? 'col-md-12 mt-3' : "d-none"}>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <UpcomingAppoinments data={{ searchParams }} />
                                    </Suspense>
                                </div>
                            </div>

                        </div>
                    )
                    :
                    (viewType === 'skel-informative')
                        ? (
                            <div className="skel-interactive-view-data1">
                                <div className="skel-oper-flex">
                                    {/* appConfig?.clientConfig?.operational_dashboard?.informativeView?.appointmentsCorner?.isActive */}
                                    <div className={!!!statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0]) ? 'skel-wrap-sect' : "d-none"}>
                                        <Suspense fallback={<SuspenseFallbackLoader />}>
                                            <AppoinmentHistory loader={SuspenseFallbackLoader} />
                                        </Suspense>
                                    </div>
                                </div>
                            </div>
                        )
                        :
                        null
            }
        </>
    )
}
