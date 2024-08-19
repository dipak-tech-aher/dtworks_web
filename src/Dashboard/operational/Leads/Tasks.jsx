import React, { Suspense, useContext, useRef, useState } from "react";
import { OpsDashboardContext } from "../../../AppContext";
import DashboardIcons from "../../../assets/images/dashboard-icons.svg";
import FilterPng from '../../../assets/images/filter-btn.png';
import Livestream from "../../../assets/images/livestream.svg";
import SuspenseFallbackLoader from "../../../common/components/SuspenseFallbackLoader";
import Filter from "./Filter";
import AssignTasks from "./assignedTasks";
import TasksCorner from "./tasksCorner";
// import TopPerformanceTasks from "./TopPerformanceTasks";
import TopFivePerformance from "./TopFivePerformance/TopFivePerformance";
import TopPerformerActivity from "./TopFivePerformanceActivity/TopPerformerActivity";
import AssignToMe from "./assignToMe";
import EngagementByStatus from "./engagementByStatus/EngagementByStatus";
import Overview from "./taskByDueDate/Overview";
import TaskByStatus from "./taskByStatus/taskByStatus";
import DashboardFilteredContent from "../components/showFilteredContent";

const Tasks = (props) => {
    const { data } = useContext(OpsDashboardContext);
    const { meOrMyTeam, appsConfig, auth } = data;
    const childRef = useRef();
    const [screenType, setScreenType] = useState(null);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [viewType, setViewType] = useState('skel-interactive');
    const [searchParams, setSearchParams] = useState({
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId,
        userId: auth?.user?.userId,
    });

    const handleClear = (event) => {
        event.preventDefault();
        childRef?.current?.clearSearchParams();
        setSearchParams({
            roleId: auth?.currRoleId,
            departmentId: auth?.currDeptId,
            userId: auth?.user?.userId,
        })
        setShowFilter(false);
    }

    const getClassName = (viewType) => `list-dashboard-tab db-list-tab-active cursor-pointer skel-btn-submit skel-sw-${viewType}-view`;
    const display = (mode) => viewType === mode ? 'none' : '';

    return (
        <React.Fragment>
            <div className="row">
                <div className="col-md-12">
                    <div className="db-list d-flex-algn-center align-rht-side mb-2 pl-0">
                        <div className={getClassName('informative')} style={{ display: display('skel-informative') }} onClick={() => setViewType('skel-informative')}>
                            <span className="db-title">
                                <img src={Livestream} alt="Livestream" className="img-fluid pr-1" /> Switch to Informative View
                            </span>
                        </div>
                        <div className={getClassName('interactive')} style={{ display: display('skel-interactive') }} onClick={() => setViewType('skel-interactive')}>
                            <span className="db-title">
                                <img src={DashboardIcons} alt="DashboardIcons" className="img-fluid pr-1" /> Switch to Interactive View
                            </span>
                        </div>
                        <div className="mb-0">
                            <div className="list-dashboard-tab cursor-pointer db-list-tab-active skel-btn-submit skel-self db-list-active">
                                <span className="db-title" onClick={() => setShowFilter(!showFilter)}>
                                    Filter <img src={FilterPng} alt="FilterPng" className="img-fluid pl-1" />
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
                    auth
                }}
                handler={{
                    setShowFilter,
                    handleClear,
                    setSearchParams
                }}
            />
            <DashboardFilteredContent searchParams={searchParams} setSearchParams={setSearchParams}/>
            {viewType === 'skel-interactive' ? (
                <div className="skel-interactive-view-data1">
                    <div className="row">
                        <AssignToMe
                            data={{
                                appsConfig,
                                searchParams,
                                fromComp: "TASK"
                            }}
                            handlers={{
                                setSearchParams
                            }}
                            ref={childRef}
                        />
                    </div>
                    <hr className="cmmn-hline mt-3 mb-0" />
                    <div className="row">
                        <div className="col-lg-6 col-md-12 mt-3">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <AssignTasks
                                    data={{
                                        type: 'POOLED',
                                        isFullScreen,
                                        searchParams
                                    }}
                                    handlers={{
                                        setIsFullScreen,
                                        setScreenType
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>
                        <div className="col-lg-6 col-md-12 mt-3">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <AssignTasks
                                    data={{
                                        type: 'ASSIGNED',
                                        isFullScreen,
                                        searchParams
                                    }}
                                    handlers={{
                                        setIsFullScreen,
                                        setScreenType
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>
                    </div>
                </div>
            ) : viewType === 'skel-informative' && (

                <div className="skel-interactive-view-data1">
                    {meOrMyTeam === 'Me' &&  <Overview
                        data={{
                            searchParams,
                            auth
                        }}
                    />}
                    <div className="skel-oper-flex">

                        <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <TasksCorner
                                    data={{
                                        appsConfig,
                                        meOrMyTeam,
                                        searchParams
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>
                        {meOrMyTeam === 'Me' && <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <TaskByStatus
                                    data={{
                                        appsConfig,
                                        searchParams,
                                        meOrMyTeam,
                                        auth
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>}
                        {meOrMyTeam === 'Me' && <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <EngagementByStatus
                                    data={{
                                        appsConfig,
                                        searchParams,
                                        meOrMyTeam,
                                        auth
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>}
                        {meOrMyTeam === 'MyTeam' && <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <TopPerformerActivity
                                    data={{
                                        appsConfig,
                                        searchParams,
                                        meOrMyTeam,
                                        auth
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>}
                        {meOrMyTeam === 'MyTeam' && <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <TopFivePerformance
                                    data={{
                                        appsConfig,
                                        searchParams,
                                        meOrMyTeam,
                                        auth
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div>}
                        {/* <div className="skel-wrap-sect">
                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                <TopPerformanceTasks
                                    data={{
                                        appsConfig,
                                        searchParams
                                    }}
                                    loader={SuspenseFallbackLoader}
                                />
                            </Suspense>
                        </div> */}
                    </div>
                </div>
            )}
        </React.Fragment>
    )
}

export default Tasks;