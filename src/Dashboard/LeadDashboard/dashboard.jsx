import React, { useEffect, useState, useRef } from 'react';
import FilterBtn from "../../assets/images/filter-btn.svg";
import Overview from './overview';
import MissionOverview from './mission-overview';
import CategoryTypeWise from './category-type-wise';
import Filter from './filter';
import { toast } from "react-toastify";
import { unstable_batchedUpdates } from 'react-dom';
import { AppContext } from "../../AppContext";
import moment from "moment";
import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import MissionCategoryTypeWise from './mission-category-type-wise';
import PriorityWiseStakeholdersTask from './priority-wise-stakeholders-task';
import PriorityWiseMissionTask from './priority-wise-mission-task';
import DeptWiseStakeholdersTask from './dept-wise-stakeholders-task';
import DeptWiseMissionTask from './dept-wise-mission-task';
import OpenTasksByAgeingMissions from './open-tasks-by-ageing-missions';
import OpenTaskByAgeingStakeholders from './open-tasks-by-ageing-stakeholders';

const LeadDashboard = () => {
    const [masterLookupData, setMasterLookupData] = useState([]);
    const [showRealTime, setShowRealTime] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [searchParams, setSearchParams] = useState({});
    const [excelFilter, setExcelFilter] = useState({});
    const [isChecked, setIsChecked] = useState(false);
    const [pageRefreshTime, setPageRefreshTime] = useState(1);
    const [isParentRefresh, setIsParentRefresh] = useState(false);
    const [lastDataRefreshTime, setLastDataRefreshTime] = useState({
        AgeingVsFollowups: moment().format('DD-MM-YYYY HH:mm:ss'),
        CategoryTypeWise: moment().format('DD-MM-YYYY HH:mm:ss'),
        TypeWise: moment().format('DD-MM-YYYY HH:mm:ss'),
        Priority: moment().format('DD-MM-YYYY HH:mm:ss')
    })

    const contextProvider = {
        data: {
            lastDataRefreshTime,
            showFilter,
            searchParams,
            isParentRefresh,
            masterLookupData
        },
        handlers: {
            setLastDataRefreshTime,
            setShowFilter,
            setSearchParams,
            setIsParentRefresh
        }
    }

    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return
        }
        setIsChecked(!isChecked);
    }

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false)
            setPageRefreshTime(parseInt(e.target.value));
        })
    }


    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRIORITY')
            .then((response) => {
                const { data } = response;
                setMasterLookupData(data)
            })
            .catch(error => {
                console.error(error);
            });
    }, [])

    useEffect(() => {
        unstable_batchedUpdates(() => {
            if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
                const intervalId = setInterval(() => {
                    if (isChecked) {
                        // const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                        setIsParentRefresh(!isParentRefresh);
                        const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                        setLastDataRefreshTime({
                            performanceActivityTeam: currentTime,
                            interactionHistoryTeam: currentTime,
                            orderHistoryTeam: currentTime
                        })
                    }
                }, Number(pageRefreshTime) * 60 * 1000);
            }
        })
    }, [isChecked]);

    return (
        <AppContext.Provider value={contextProvider}>
            <div className="content">
                <div className="container-fluid pr-1">
                    <div className="cnt-wrapper">
                        <div className="card-skeleton">
                            <div className="customer-skel mt-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="tab-content">
                                            <div className="tab-pane fade show active">
                                                <div className="skle-swtab-sect">
                                                    <div className="d-flex"></div>
                                                    <form className="form-inline" style={{ justifyContent: 'flex-end' }}>
                                                        <span className="ml-1">Auto Refresh</span>
                                                        <div className="switchToggle ml-1">
                                                            <input id="switch1" type="checkbox" checked={isChecked} onChange={handleAutoRefresh} />
                                                            <label htmlFor="switch1">Toggle</label>
                                                        </div>
                                                        <select className="custom-select custom-select-sm ml-1" value={pageRefreshTime} onChange={handleSetRefreshTime}>
                                                            <option value="Set">Set</option>
                                                            <option value={Number(1)}>1 Min</option>
                                                            <option value={Number(5)}>5 Min</option>
                                                            <option value={Number(15)}>15 Min</option>
                                                            <option value={Number(30)}>30 Min</option>
                                                        </select>

                                                        <div className="db-list mb-0 pl-1">
                                                            <a
                                                                className="skel-fr-sel-cust cursor-pointer"
                                                                onClick={() => setShowFilter(!showFilter)}
                                                            >
                                                                <div className="list-dashboard db-list-active skel-self">
                                                                    <span className="db-title">
                                                                        Filter
                                                                        <img
                                                                            src={FilterBtn}
                                                                            className="img-fluid pl-1"
                                                                        />
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </form>
                                                </div>
                                                <Filter data={{ showFilter, searchParams, excelFilter }} handler={{
                                                    setShowFilter,
                                                    setSearchParams,
                                                    setExcelFilter
                                                }} />
                                                <div className="skel-self-data">
                                                    <div className="skel-interaction-dashboard-rht-base">
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <Overview data={{ searchParams, isParentRefresh }} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <MissionOverview data={{ searchParams, isParentRefresh }} />
                                                            </div>
                                                        </div>
                                                        <div className="row mt-3">
                                                            <div className="col-md-6">
                                                                <CategoryTypeWise data={{ label: "Stakeholder", mode: "CATEGORY", searchParams, isParentRefresh }} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <MissionCategoryTypeWise data={{ label: "Mission", mode: "CATEGORY", searchParams, isParentRefresh }} />
                                                            </div>
                                                        </div>

                                                        <div className="row mt-3">
                                                            <div className="col-md-6">
                                                                <PriorityWiseStakeholdersTask data={{ label: "Priority Wise Task - Stakeholder", searchParams, isParentRefresh }} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <PriorityWiseMissionTask data={{ label: "Priority Wise Task - Mission", searchParams, isParentRefresh }} />
                                                            </div>
                                                        </div>
                                                        <div className="row mt-3">
                                                            <div className="col-md-6">
                                                                <DeptWiseStakeholdersTask data={{ label: "Department Wise Open Task - Stakeholder", searchParams, isParentRefresh }} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <DeptWiseMissionTask data={{ label: "Department Wise Open Task - Mission", searchParams, isParentRefresh }} />
                                                            </div>
                                                        </div>
                                                        <div className="row mt-3">
                                                            <div className="col-md-6">
                                                                <OpenTaskByAgeingStakeholders data={{ label: "Open Task By Ageing - Stakeholder", searchParams, isParentRefresh }} />
                                                            </div>
                                                            <div className="col-md-6">
                                                                <OpenTasksByAgeingMissions data={{ label: "Open Task By Ageing - Mission", searchParams, isParentRefresh }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppContext.Provider>
    )
}

export default LeadDashboard;