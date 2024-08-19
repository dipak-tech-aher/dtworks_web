/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useContext, useEffect, useState, } from "react";
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from "react-toastify";
import { AppContext, OpsDashboardContext } from "../../AppContext";
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import InteractionsRightModal from "./RightModals/InteractionsRightModal";
import OrdersRightModal from "./RightModals/OrdersRightModal";
import { default as LeadTasks } from "./Leads/Tasks";
import InteractionsTab from "./Interactions/interactionsTab";
import TaskTab from "./Task/taskTab";
import HelpdeskTab from "./Helpdesk/helpdeskTab";
import OrdersTab from "./Orders/ordersTab";
import AppoinmentsTab from "./Appoinment/appoinmentsTab";
import { orderBy, groupBy } from 'lodash'

const capitalizeFirstLetter = (string) => {
    string = string?.toLowerCase();
    return string?.charAt(0)?.toUpperCase() + string?.slice(1);
}

const OperationalDashboard = (props) => {
    const { appsConfig } = props;

    const [meOrMyTeam, setMeOrMyTeam] = useState('Me')

    const { auth } = useContext(AppContext);

    const permissions = auth?.permissions?.filter(permission => permission.moduleCode === 'DASH');
    const dashboardPermission = permissions?.[0]?.moduleScreenMap?.find(screen => screen.screenCode === 'OPERATIONAL_DASH');
    const entities = (dashboardPermission?.components ?? []).filter(entity => entity.accessType === 'allow' && entity.componentType === 'TAB');
    let enabledEntities = entities.map(entity => ({ name: capitalizeFirstLetter(entity.componentName), code: entity.componentCode, tabOrder: entity.componentOrder }));
    const counts = enabledEntities.reduce((acc, entity) => {
        acc[entity.code] = 0;
        return acc;
    }, {});

    const [tabSuperScriptCount, setTabSuperScriptCount] = useState(counts)

    enabledEntities = orderBy(enabledEntities, ['tabOrder'], ['asc'])
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    useEffect(() => {
        //   const handlePopState = () => {
        const storedTab = localStorage.getItem("myWorkspaceTab");
        if (storedTab) {
            const foundIndex = enabledEntities.findIndex(entity => entity.code === storedTab);
            if (foundIndex !== -1) {
                setActiveTabIndex(foundIndex);
            }
        } else {
            setActiveTabIndex(0);
            // const foundIndex = enabledEntities[0];
            // if (foundIndex !== -1) {
            //     console.log('foundIndex',foundIndex)
            //     setActiveTabIndex(foundIndex);
            // }
        }
        // };

        // window.addEventListener("popstate", handlePopState);
        // return () => window.removeEventListener("popstate", handlePopState);
    }, [enabledEntities?.length]);

    const handleTabClick = (entityCode, index) => {
        setActiveTabIndex(index);
        localStorage.setItem("myWorkspaceTab", entityCode);
    };

    const [showMyTeam, setShowMyTeam] = useState(false)

    const [masterLookupData, setMasterLookupData] = useState({});
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedInteraction, setSelectedInteraction] = useState([])
    const [selectedEntityType, setSelectedEntityType] = useState('')
    const [source, setSource] = useState('')
    const [selectedOrder, setSelectedOrder] = useState([])
    //Refresh states
    const [isPageRefresh, setIsPageRefresh] = useState(false)
    const [isChecked, setIsChecked] = useState(false);
    // const [time, setTime] = useState();
    const [pageRefreshTime, setPageRefreshTime] = useState(30);
    const [lastDataRefreshTime, setLastDataRefreshTime] = useState({
        assignedToMe: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedInteraction: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedOrder: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedAppointment: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedToTeamInteraction: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedToTeamOrder: moment().format('DD-MM-YYYY HH:mm:ss'),
        assignedToTeamAppointment: moment().format('DD-MM-YYYY HH:mm:ss'),
        performanceActivity: moment().format('DD-MM-YYYY HH:mm:ss'),
        interactionHistory: moment().format('DD-MM-YYYY HH:mm:ss'),
        orderHistory: moment().format('DD-MM-YYYY HH:mm:ss'),
        appoinmentHistory: moment().format('DD-MM-YYYY HH:mm:ss'),
        performanceActivityTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        interactionHistoryTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        orderHistoryTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        appoinmentHistoryTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceInteraction: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceInteractionTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceOrder: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceOrderTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopFivePerformer: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopFivePerformerTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceChat: moment().format('DD-MM-YYYY HH:mm:ss'),
        TopPerformanceChatTeam: moment().format('DD-MM-YYYY HH:mm:ss'),
        requestAssignedToMe: moment().format('DD-MM-YYYY HH:mm:ss'),
        requestAssignedToTeam: moment().format('DD-MM-YYYY HH:mm:ss')
    })
    const [currentTime, setCurrentTime] = useState(moment().format('DD-MM-YYYY HH:mm:ss'))
    const [assignedInteractionAge, setAssignedInteractionAge] = useState({
        threeDays: 0,
        fiveDays: 0,
        morethan: 0,
        total: 0
    })
    const [assignedOrderAge, setAssignedOrderAge] = useState({
        threeDays: 0,
        fiveDays: 0,
        morethan: 0,
        total: 0
    })
    const [assignedRequestAge, setAssignedRequestAge] = useState({
        threeDays: 0,
        fiveDays: 0,
        morethan: 0,
        total: 0
    })

    const [searchParams, setSearchParams] = useState({
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });
    const [allPooledCounts, setAllPooledCounts] = useState({
        helpdesk: 0,
        interaction: 0,
        order: 0,
        task: 0
    })


    useEffect(() => {
        const intervalId = setInterval(() => {
            // // console.log("current time");
            setCurrentTime(moment().format('DD-MM-YYYY HH:mm:ss'))
            // // console.log('-------------> refresh', moment().format('DD-MM-YYYY HH:MM:SS'))
        }, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [])


    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=APPOINT_TYPE,TICKET_CHANNEL,PRIORITY,ORDER_STATUS,ORDER_CATEGORY,ORDER_TYPE,HELPDESK_TYPE,HELPDESK_STATUS,SEVERITY,HELPDESK_SOURCE,PROJECT')
            .then((response) => {
                get(properties.MASTER_API + '/lookup/interaction?searchParam=code_type&valueParam=SERVICE_TYPE,INTXN_TYPE,INTXN_CATEGORY,INTXN_STATUS,SERVICE_CATEGORY')
                    .then((resp) => {

                        setMasterLookupData({ ...response.data, ...resp.data });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            })
            .catch(error => {
                console.error(error);
            });


        get(properties.USER_API + '/get-my-team-members')
            .then((response) => {
                const { data } = response;
                if (data) {
                    setTeamMembers([...data]);
                }
            })
            .catch(error => {
                console.error(error);
            });

        // this api call used to check the current user manager or not 
        post(properties.ROLE_API + '/role-manager', { "userId": auth?.user?.userId, "roleId": auth?.currRoleId })
            .then((response) => {
                const { data = [] } = response;
                if (data.length > 0) {
                    setShowMyTeam(true)
                }
            })
            .catch(error => {
                console.error(error);
            });

        post(properties.HELPDESK_API + '/get-overall-workspace-count', { ...searchParams, entityType: 'all', category: meOrMyTeam })
            .then((response) => {
                const { rows } = response?.data;
                if (rows.length) {
                    const counts = rows.reduce((acc, row) => {
                        const { oEntityType, oEntityCode, oCount } = row;
                        acc[oEntityCode] = oCount;
                        return acc;
                    }, {});
                    setTabSuperScriptCount(counts)
                }
            })
            .catch(error => {
                console.error(error);
            });
    }, [])

    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return
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
                        setLastDataRefreshTime({
                            assignedToMe: currentTime,
                            assignedInteraction: currentTime,
                            assignedOrder: currentTime,
                            assignedAppointment: currentTime,
                            assignedToTeamInteraction: currentTime,
                            assignedToTeamOrder: currentTime,
                            assignedToTeamAppointment: currentTime,
                            performanceActivity: currentTime,
                            interactionHistory: currentTime,
                            orderHistory: currentTime,
                            appoinmentHistory: currentTime,
                            performanceActivityTeam: currentTime,
                            interactionHistoryTeam: currentTime,
                            orderHistoryTeam: currentTime,
                            appoinmentHistoryTeam: currentTime,
                            TopPerformanceInteraction: currentTime,
                            TopPerformanceInteractionTeam: currentTime,
                            TopPerformanceOrder: currentTime,
                            TopPerformanceOrderTeam: currentTime,
                            TopFivePerformer: currentTime,
                            TopFivePerformerTeam: currentTime,
                            TopPerformanceChat: currentTime,
                            TopPerformanceChatTeam: currentTime,
                            requestAssignedToMe: currentTime,
                            requestAssignedToTeam: currentTime
                        })
                        // // console.log("Component refreshed!", pageRefreshTime);
                    }
                }, Number(pageRefreshTime) * 60 * 1000);

                return () => clearInterval(intervalId);
            }
        })
    }, [isChecked]);

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false)
            setPageRefreshTime(parseInt(e.target.value));
        })
    }
    const getOverViewDetails = () => {
        const interactionOverViewAPI = `${properties.INTERACTION_API}/get-interaction-overview`;

        let searchParamss = {
            ...searchParams,
            userId: auth?.user?.userId,
            roleId: auth?.currRoleId,
        }
        post(interactionOverViewAPI, {
            "searchParams": searchParamss,
        }).then((resp) => {
            if (resp.data?.rows && Array.isArray(resp.data?.rows) && resp.data?.rows.length > 0) {
                const interactionResponse = resp?.data?.rows?.map((e) => {
                    return {
                        threeDays: e?.oIntxn3DayCnt || 0,
                        fiveDays: e?.oIntxn5DayCnt || 0,
                        morethan: e?.oIntxnMoreThan5DayCnt || 0,
                        total: e?.oIntxnTotalCnt || 0
                    }
                })
                const orderResponse = resp?.data?.rows?.map((e) => {
                    return {
                        threeDays: e?.oOrder3DayCnt || 0,
                        fiveDays: e?.oOrder5DayCnt || 0,
                        morethan: e?.oOrderMoreThan5DayCnt || 0,
                        total: e?.oOrderTotalCnt || 0
                    }
                })
                const requestResponse = resp?.data?.rows?.map((e) => {
                    return {
                        threeDays: e?.oRequest3DayCnt || 0,
                        fiveDays: e?.oRequest5DayCnt || 0,
                        morethan: e?.oRequestMoreThan5DayCnt || 0,
                        total: e?.oRequestTotalCnt || 0
                    }
                })
                unstable_batchedUpdates(() => {
                    setAssignedInteractionAge(interactionResponse?.[0] || {})
                    setAssignedOrderAge(orderResponse?.[0] || {})
                    setAssignedRequestAge(requestResponse?.[0] || {})
                })
            }
        }).catch((error) => {
            // console.log(error)
        })
    }
    useEffect(() => {
        getOverViewDetails()
    }, [meOrMyTeam, isPageRefresh])
    const clickToScroll = () => {
        let element = document.getElementById("pooled-block");
        console.log(element)
        if (element) {
            element.scrollIntoView();
            element.scrollIntoView(false);
            element.scrollIntoView({ block: "end" });
            element.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
        }

    }
    const contextProvider = {
        data: {
            auth,
            appsConfig,
            meOrMyTeam,
            // viewType,
            pageRefreshTime,
            masterLookupData,
            teamMembers,
            lastDataRefreshTime,
            currentTime,
            searchParams,
            assignedInteractionAge,
            assignedOrderAge,
            assignedRequestAge,
            isPageRefresh,
            allPooledCounts
        },
        handlers: {
            setSelectedInteraction,
            setSource,
            setSelectedOrder,
            setSelectedEntityType,
            setLastDataRefreshTime,
            setCurrentTime,
            setAssignedInteractionAge,
            setAssignedOrderAge,
            setAssignedRequestAge,
            setSearchParams,
            setIsPageRefresh,
            clickToScroll,
            setAllPooledCounts
        }
    }
    const [requestLastUpdatedAt, setRequestLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => {
            setRequestLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.requestAssignedToMe : lastDataRefreshTime?.requestAssignedToTeam, "DD-MM-YYYY HH:mm:ss"))
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const isEntityAvaliable = (entity) => {
        return enabledEntities.find((x) => x.code === entity)
    }

    const renderEntityComponent = (entityCode) => {
        switch (entityCode) {
            case 'INTXN_TAB':
                return <InteractionsTab source={entityCode}
                    dashboardPermission={dashboardPermission}
                    meOrMyTeam={meOrMyTeam} appsConfig={appsConfig}
                    isPageRefresh={isPageRefresh}
                    requestLastUpdatedAt={requestLastUpdatedAt}
                    getOverViewDetails={getOverViewDetails} />;
            case 'HELPDESK_TAB':
                return <HelpdeskTab source={entityCode} dashboardPermission={dashboardPermission} />;
            case 'ORDER_TAB':
                return <OrdersTab source={entityCode} dashboardPermission={dashboardPermission} meOrMyTeam={meOrMyTeam} appsConfig={appsConfig} isPageRefresh={isPageRefresh} requestLastUpdatedAt={requestLastUpdatedAt} getOverViewDetails={getOverViewDetails} />;
            case 'TASK_TAB':
                // return <LeadTasks source={entityCode} dashboardPermission={dashboardPermission} />;
                return <TaskTab source={entityCode} dashboardPermission={dashboardPermission} meOrMyTeam={meOrMyTeam}/>;
            case 'APPMNT_TAB':
                return <AppoinmentsTab source={entityCode} dashboardPermission={dashboardPermission} />;
            default:
                return null;
        }
    };

    return (
        <OpsDashboardContext.Provider value={contextProvider}>
            <div className="" style={{ margin: 0 }}>
                <div className="">
                    <div className="" style={{ margin: 0 }}>
                        <div className="cnt-wrapper">
                            <div className="card-skeleton">
                                <div className="customer-skel">
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="skle-swtab-sect">
                                                <div className="db-list mb-0 pl-0">
                                                    <a className="skel-fr-sel-serv cursor-pointer">
                                                        <div className={`list-dashboard skel-self ${meOrMyTeam === 'Me' ? 'db-list-active' : ''}`} onClick={() => setMeOrMyTeam('Me')}>
                                                            <span className="db-title">Me</span>
                                                        </div>
                                                    </a>
                                                    {showMyTeam && <a className="skel-fr-sel-serv cursor-pointer">
                                                        <div className={`list-dashboard db-list skel-depart ${meOrMyTeam === 'MyTeam' ? 'db-list-active' : ''}`} onClick={() => setMeOrMyTeam('MyTeam')}>
                                                            <span className="db-title" >My Team</span>
                                                        </div>
                                                    </a>}
                                                </div>
                                                <form className="form-inline">
                                                    <span className="ml-1">Auto Refresh</span>
                                                    <div className="switchToggle ml-1">
                                                        <input id="switch1" type="checkbox" checked={isChecked} onChange={handleAutoRefresh} />
                                                        <label htmlFor="switch1">Toggle</label>
                                                    </div>
                                                    <button type="button" className="ladda-button  btn btn-secondary btn-xs ml-1" dir="ltr" data-style="slide-left">
                                                        <span className="ladda-label"
                                                            onClick={() => setIsPageRefresh(!isPageRefresh)}
                                                        ><i className="material-icons" title="Refresh">refresh</i>
                                                        </span><span className="ladda-spinner"></span>
                                                    </button>
                                                    <select className="custom-select custom-select-sm ml-1" value={pageRefreshTime} onChange={handleSetRefreshTime} >
                                                        <option value="Set">Set</option>
                                                        <option value={Number(1)}>1 Min</option>
                                                        <option value={Number(5)}>5 Min</option>
                                                        <option value={Number(15)}>15 Min</option>
                                                        <option value={Number(30)}>30 Min</option>
                                                    </select>
                                                </form>
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="skel-self-data">
                                                <div className="cmmn-skeleton">
                                                    <div className="tabbable mb-2">
                                                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                                                            {enabledEntities.map((entity, i) => (
                                                                <li className="nav-item" key={entity.code}>
                                                                    <a
                                                                        className={`nav-link ${i === activeTabIndex ? 'active' : ''}`}
                                                                        id={`${entity.code}-tab`}
                                                                        data-toggle="tab"
                                                                        href={`#${entity.code}tab`}
                                                                        role="tab"
                                                                        aria-controls="me"
                                                                        aria-selected={i === activeTabIndex ? 'true' : 'false'}
                                                                        onClick={() => handleTabClick(entity.code, i)}
                                                                    >
                                                                        {entity.name} <span className="badge-cust-styl text-12">{tabSuperScriptCount[entity.code]??0}</span>
                                                                    </a>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div className="tab-content">
                                                        {enabledEntities.map(entity => (
                                                            <div
                                                                key={entity.code}
                                                                className={`tab-pane fade show ${entity.code === enabledEntities[activeTabIndex]?.code ? 'active' : ''}`}
                                                                id={`${entity.code}tab`}
                                                                role="tabpanel"
                                                                aria-labelledby={`${entity.code}-tab`}
                                                            >
                                                                {entity.code === enabledEntities[activeTabIndex]?.code && renderEntityComponent(entity.code)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <InteractionsRightModal
                            data={{
                                source,
                                selectedInteraction,
                                selectedEntityType
                            }}
                        />
                        <OrdersRightModal
                            data={{
                                selectedOrder,
                                selectedEntityType
                            }}
                        />
                    </div>
                </div>
            </div>
        </OpsDashboardContext.Provider>
    )
}

export default OperationalDashboard;