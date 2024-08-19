import React, { Suspense, useContext, useEffect, useState } from 'react'
import Livestream from "../../../assets/images/livestream.svg";
import DashboardIcons from "../../../assets/images/dashboard-icons.svg";
import filterPng from '../../../assets/images/filter-btn.png';
import AssignToMe from './AssignToMe';
import { AppContext, OpsDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post, slowPost } from '../../../common/util/restUtil';
import SuspenseFallbackLoader from '../../../common/components/SuspenseFallbackLoader';
import AssignHelpdesks from './assignedHelpdesk';
import { Modal } from 'react-bootstrap';
import Filter from './Filter';
import HelpdeskCorner from './HelpdeskCorner';
import TopPerformanceHelpdesk from '../CategoryPerformance/TopPerformanceHelpdesk';
import { statusConstantCode } from '../../../AppConstants';
import AgentPerformance from '../Performance/AgentPerformance';
import HelpdeskTopPerformerActivity from '../Performance/HelpdeskTopPerformerActivity';
import DashboardFilteredContent from '../components/showFilteredContent';
export default function HelpdeskTab(props) {
    const { auth } = useContext(AppContext);
    const { data, handlers } = useContext(OpsDashboardContext);
    let { meOrMyTeam, isPageRefresh, appsConfig } = data;
    const [viewType, setViewType] = useState('skel-interactive');
    const [showFilter, setShowFilter] = useState(false);
    const [screenType, setScreenType] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [searchParams, setSearchParams] = useState({
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });
    const [isFullScreen, setIsFullScreen] = useState(false)
    const [assignedHelpdeskAge, setAssignedHelpdeskAge] = useState({
        threeDays: 0,
        fiveDays: 0,
        morethan: 0,
        total: 0
    });
    const [agentHelpdeskPerformance, setAgentHelpdeskPerformance] = useState([])
    useEffect(() => {
        if (meOrMyTeam !== 'MyTeam') {
            getOverViewDetails();
        }
    }, [isPageRefresh, meOrMyTeam])

    useEffect(() => {
        if (meOrMyTeam == 'MyTeam') {
            getHelpdesktop5Performance();
        }
    }, [isPageRefresh, meOrMyTeam, searchParams])
    const getHelpdesktop5Performance = async () => {
        try {
            let resp = await slowPost(`${properties.HELPDESK_API}/top-5-performers`, {
                searchParams: {
                    userId: auth?.user?.userId,
                    ...searchParams
                }
            })
            setAgentHelpdeskPerformance(resp?.data || [])
        } catch (e) {
            console.log('error', e)
        }
    }
    const getOverViewDetails = () => {
        try {
            const helpDeskOverViewAPI = `${properties.HELPDESK_API}/get-helpdesk-overview`;

            let searchParamss = {
                ...searchParams,
                userId: auth?.user?.userId,
                roleId: auth?.currRoleId,
            }
            post(helpDeskOverViewAPI, {
                "searchParams": searchParamss,
            }).then((resp) => {
                if (resp.data?.rows && Array.isArray(resp.data?.rows) && resp.data?.rows.length > 0) {
                    const helpdeskResponse = resp?.data?.rows?.map((e) => {
                        return {
                            twoDays: e?.o02DayCnt || 0,
                            fiveDays: e?.o35DayCnt || 0,
                            morethan: e?.oMoreThan5DayCnt || 0,
                            total: e?.oHelpdeskTotalCnt || 0
                        }
                    })
                    setAssignedHelpdeskAge(helpdeskResponse?.[0] || {});
                }
            }).catch((error) => {
                // console.log(error)
            })
        } catch (e) {
            console.log('error', e)
        }
    }

    const handleClear = (event) => {
        event.preventDefault();
        setSearchParams({
            fromDate: undefined, toDate: undefined, serviceCat: undefined,
            serviceType: undefined, teamMemberId: undefined,
            roleId: auth?.currRoleId,
            departmentId: auth?.currDeptId,
            helpdeskType: undefined,
            Channal: undefined,
            severity: undefined,
            status: undefined
        });
        setShowFilter(false);
    }
    const handleClose = () => {
        setIsFullScreen(false);
    };   

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
                                <img src={Livestream} className="img-fluid pr-1" />
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
                                <img src={DashboardIcons} className="img-fluid pr-1" />
                                Switch to Interactive View
                            </span>
                        </div>
                        <div className="mb-0">

                            <div className="list-dashboard-tab db-list-tab-active skel-btn-submit skel-self db-list-active cursor-pointer">
                                <span className="db-title" onClick={() => setShowFilter(!showFilter)}>
                                    Filter{" "}
                                    <img
                                        src={filterPng}
                                        className="img-fluid pl-1"
                                    />
                                </span>
                            </div>
                        </div>
                    </div>
                    <Filter
                        data={{
                            showFilter,
                            meOrMyTeam,
                            serviceTypes,
                            page: 'helpdesk',
                            searchParams
                        }}
                        handler={{
                            setShowFilter,
                            handleClear,
                            setSearchParams,
                            getOverViewDetails,
                            // getTopPerformance,
                            setServiceTypes
                        }}
                    />
                </div>
            </div>
            <DashboardFilteredContent searchParams={searchParams} setSearchParams={setSearchParams}/>           
            {
                (viewType === 'skel-interactive') ?
                    <div className="skel-interactive-view-data1">

                        <div className="row">
                            {(meOrMyTeam === 'Me' && appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.interactiveView?.assignedToMe?.isActive) &&
                                <AssignToMe data={{ appsConfig, assignedHelpdeskAge, searchParams, fromComp: "HELPDESK" }} />}
                        </div>
                        <hr className="cmmn-hline mt-3 mb-0" />
                        <div className="row" id='pooled-block'>
                            {appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.interactiveView?.pooledInteractions?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                <Suspense fallback={<SuspenseFallbackLoader />}>
                                    <AssignHelpdesks data={{ type: 'POOLED', isFullScreen, searchParams }} handlers={{ setIsFullScreen, setScreenType }}
                                        loader={SuspenseFallbackLoader}
                                    />
                                </Suspense>
                            </div>}
                            {appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.interactiveView?.assignedInteractions?.isActive && <div className="col-lg-6 col-md-12 mt-3">
                                <Suspense fallback={<SuspenseFallbackLoader />}>
                                    <AssignHelpdesks data={{ type: 'ASSIGNED', isFullScreen, searchParams }} handlers={{ setIsFullScreen, setScreenType }}
                                        loader={SuspenseFallbackLoader}
                                    />
                                </Suspense>
                            </div>}
                        </div>
                    </div>
                    : (viewType === 'skel-informative') ?
                        <div className="skel-interactive-view-data1">
                            {(meOrMyTeam !== 'Me') && appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.informativeView?.HelpdeskTop5Performance?.isActive && <> <span className="skel-header-title">Top 5 Performance</span>
                                <div className="skel-top-5-perf-sect">

                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <AgentPerformance
                                            data={{
                                                source: statusConstantCode?.entityCategory?.HELPDESK,
                                                agentPerformance: agentHelpdeskPerformance
                                            }}
                                            handlers={{
                                                setAgentPerformance: setAgentHelpdeskPerformance
                                            }} />
                                    </Suspense>
                                </div>
                            </>}
                            <div className="skel-oper-flex">

                                {appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.informativeView?.HelpdeskConner?.isActive && <div className="skel-wrap-sect">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <HelpdeskCorner loader={SuspenseFallbackLoader} data={{ searchParams }} />
                                    </Suspense>
                                </div>}
                                {(meOrMyTeam !== 'Me') && appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.informativeView?.HelpdeskTopPerformerActivity?.isActive && <div className="skel-wrap-sect">
                                    <HelpdeskTopPerformerActivity data={{ searchParams }} />
                                </div>
                                }

                                {(meOrMyTeam === 'Me') && appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.informativeView?.HelpdeskTop5Performance?.isActive && <div className="skel-wrap-sect">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                        <TopPerformanceHelpdesk loader={SuspenseFallbackLoader} data={{ searchParams }} />
                                    </Suspense>
                                </div>}
                            </div>

                        </div>
                        : null
            }
            <Modal show={isFullScreen} backdrop="static" keyboard={false} onHide={handleClose} className="modal-fullscreen-xl">
                <Modal.Body>
                    <Suspense fallback={<SuspenseFallbackLoader />}>
                        <AssignHelpdesks data={{ type: screenType, isFullScreen }} handlers={{ setIsFullScreen, setScreenType }}
                        />
                    </Suspense>
                </Modal.Body>
            </Modal>
        </>
    )
}
