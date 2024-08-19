import React, { useEffect, useContext, useState, useRef, useImperativeHandle, forwardRef } from "react";
import { properties } from "../../../properties";
import { AppContext, OpsDashboardContext } from '../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import moment from 'moment';
import DynamicTable from "../../../common/table/DynamicTable";
import { TasksAssigedColumns } from "./Columns";
import 'react-confirm-alert/src/react-confirm-alert.css'
import AssignedIcon from '../../../assets/images/assigned-icon.svg';
import pooledIcon from '../../../assets/images/pooled-icon.svg';
import Filter from "./Filter";
import { post, put } from "../../../common/util/restUtil";
import { useHistory }from "../../../common/util/history";
import { toast } from "react-toastify";
import { confirmAlert } from 'react-confirm-alert';

const AssignTasks = forwardRef((props, ref) => {
    const history = useHistory()
    const { auth } = useContext(AppContext)
    const [isRefresh, setIsRefresh] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { isFullScreen, searchParams: globalSearchParams, type } = props?.data;
    const { setIsFullScreen, setScreenType } = props?.handlers;
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh } = data;
    const { setLastDataRefreshTime, setIsPageRefresh } = handlers;
    const [exportBtn, setExportBtn] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(lastDataRefreshTime.assignedToMe, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const [tasks, setTasks] = useState([])
    const tableRef = useRef(true);
    const hasExternalSearch = useRef(false);
    const [filters, setFilters] = useState([]);
    const [showFilter, setShowFilter] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedRange, setSelectedRange] = useState('Tasks - All');
    const initialPayload = {
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        type: 'all',
        departmentId: auth?.currDeptId
    }
    const [searchParams, setSearchParams] = useState(initialPayload);

    const taskSearchAPI = `${properties.LEAD_API}/${meOrMyTeam === 'Me' ? 'pooled-assigned-tasks' : 'pooled-assigned-tasks/team'}`;

    const handleFullScreen = () => {
        setScreenType(type);
        setIsFullScreen(!isFullScreen);
    }

    // useEffect(() => {
    //     console.log('chnaging....',globalSearchParams )
    //     setSearchParams({
    //         ...globalSearchParams,
    //         ...searchParams
    //     });
    // }, [globalSearchParams])

    useImperativeHandle(ref, () => ({
        clearSearchParams() {
            setSearchParams({
                userId: auth?.user?.userId,
                roleId: auth?.currRoleId,
                type: 'all',
                departmentId: auth?.currDeptId
            });
        }
    }));

    const fetchData = async (currentPage, perPage) => {
        let searchParamss = {
            ...searchParams,
            ...globalSearchParams,
            "limit": perPage,
            "page": currentPage,
            "type": type
        }
        console.log('searchParams', searchParamss)

        post(taskSearchAPI, {
            "searchParams": searchParamss,
        }).then((resp) => {
            if (resp.data) {
                unstable_batchedUpdates(() => {
                    let count = resp?.data?.[0]?.oTotalCnt ?? 0;
                    let rows = resp?.data;
                    if (count > 0) {
                        setTotalCount(count);
                        setTasks([...rows]);
                    } else {
                        setTotalCount(0);
                        setTasks([]);
                    }
                    setLastDataRefreshTime({ ...lastDataRefreshTime, assignedToMe: moment().format('DD-MM-YYYY HH:mm:ss') })
                })
            }
        }).catch((error) => {
            // console.log(error)
        }).finally(() => {
            setFiltering(false);
        })
    };

    useEffect(() => {
        fetchData(currentPage, perPage);
    }, [meOrMyTeam, isRefresh, currentPage, perPage, searchParams, isPageRefresh, globalSearchParams]);

    useEffect(() => {
        if (filtering) {
            setCurrentPage(0);
            setPerPage(10);
            fetchData(0, 10);
        }
    }, [filtering])

    const handleClear = (event) => {
        event.preventDefault();
        // childRef.current.clearSearchParams();
        setSearchParams(initialPayload)
        setShowFilter(false);
        fetchData(0, 10);
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }


    const assignToSelf = (taskData) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="alert">
                        <fieldset className="scheduler-border1">
                            <h4 className="alert__title">Would you like to assign the Task ?</h4>
                            <div className="d-flex justify-content-center">

                                <button onClick={onClose} type="button" className="skel-btn-cancel">Cancel</button>
                                <button onClick={
                                    () => {
                                        if (taskData) {
                                            put(`${properties.LEAD_API}/assignSelf/${taskData?.oTaskUuid}`, {
                                                type: 'SELF'
                                            }).then((res) => {
                                                if (res.status === 200) {
                                                    toast.success("Task assigned to self")
                                                    setIsRefresh(!isRefresh)
                                                    setIsPageRefresh(!isPageRefresh)
                                                }
                                            }).catch((error) => {
                                                console.error(error)
                                            })
                                        }
                                        onClose();
                                    }
                                } type="button" className="skel-btn-submit" >Yes</button>
                            </div>
                        </fieldset>
                    </div>
                );
            }
        });

    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        } else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY HH:mm:ss") : '-'}</span>)
        } else if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">

                        {!row?.original?.oAssignedUser && type === 'POOLED' && <div title="Assign to Self" onClick={() => assignToSelf(row.original)} className="action-edit"><i className="material-icons">trending_flat</i></div>}

                        {type === 'POOLED' && <div title="Edit" onClick={() => redirectToRespectivePages(row?.original?.oTaskUuid)} className="action-edit"><i className="material-icons">edit</i></div>}

                        <div title="View" onClick={() => redirectToRespectivePages(row?.original?.oTaskUuid)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        } else if (cell.column.id === "aging-color") {
            // Aging Color Code Update
            let a = moment(row.original.oCreatedAt), b = moment(new Date()), count = b.diff(a, 'days'), colorcode = '';
            // if (selectedEntity === 'Interaction - All') colorcode = 'b';
            count <= 3 ? colorcode = 'g' : count <= 5 ? colorcode = 'y' : colorcode = 'r'
            // if (selectedEntity === 'Interaction - 0 to 3 Days') colorcode = 'g';
            // if (selectedEntity === 'Interaction - 3 to 5 Days') colorcode = 'y';
            // if (selectedEntity === 'More than 5 Days') colorcode = 'r';
            return (<span className={`skel-ag-clr-code code-${colorcode}`}></span>)
        }
        return (<span>{cell.value}</span>)
    }
    const redirectToRespectivePages = (taskUuid) => {
        if (taskUuid) {
            history(`/tasks-edit?taskUuid=${taskUuid}`)
        } else {
            toast.info('Task Details not Found')
        }
    }

    const updateSearchParams = (range, rangeDesc) => {
        setSearchParams({
            ...searchParams,
            type: range
        });
        setSelectedRange(rangeDesc);
    }

    const clearSearchParam = () => {
        setSelectedRange(null);
        setSearchParams({
            ...searchParams,
            type: 'all'
        })
    }

    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">
                    <img src={type === 'POOLED' ? pooledIcon : AssignedIcon} alt="typeIcon" className="pr-2" />
                    {type === 'POOLED' ? 'Assignment of' : 'Assigned'} Tasks ({totalCount})
                </span>
                <div className="skel-dashboards-icons skel-max-sect">
                    <a>
                        <i title="Full Screen" className="material-icons" onClick={() => handleFullScreen()}>
                            {isFullScreen ? 'fullscreen_exit' : 'fullscreen'}
                        </i>
                    </a>
                    <a><i title="Refresh" className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                    <FilterAltIcon className="mat-filter" onClick={() => setShowFilter(!showFilter)} />
                </div>
                <Filter
                    data={{
                        showFilter,
                        meOrMyTeam,
                        width: "300px"
                    }}
                    handler={{
                        setShowFilter,
                        handleClear,
                        setSearchParams
                    }}
                />
            </div>
            <hr className="cmmn-hline" />
            <div className="mywsp-ageing-rht">
                <DynamicTable
                    listKey={"Assigned Tasks"}
                    row={tasks}
                    rowCount={totalCount}
                    header={TasksAssigedColumns}
                    fixedHeader={true}
                    columnFilter={false}
                    customClassName={'table-sticky-header'}
                    itemsPerPage={perPage}
                    isScroll={false}
                    backendPaging={true}
                    isTableFirstRender={tableRef}
                    hasExternalSearch={hasExternalSearch}
                    backendCurrentPage={currentPage}
                    url={taskSearchAPI + `?limit=${perPage}&page=${currentPage}`}
                    listSearch={{ searchParams }}
                    method='POST'
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters,
                        handleExportButton: setExportBtn
                    }}
                    exportBtn={exportBtn}
                />
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
            </div>
        </div>
    )
});

export default AssignTasks;


