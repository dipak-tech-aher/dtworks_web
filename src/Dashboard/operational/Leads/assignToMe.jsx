/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment'
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react"
import { Badge } from 'react-bootstrap'
import { unstable_batchedUpdates } from 'react-dom'
import { toast } from "react-toastify"
import { AppContext, OpsDashboardContext } from '../../../AppContext'
import DynamicTable from "../../../common/table/DynamicTable"
import { post } from "../../../common/util/restUtil"
import { properties } from "../../../properties"
import { TasksAssigedColumns } from "./Columns"
import Overview from "./Overview"
import { useHistory }from '../../../common/util/history'

const AssignToMe = forwardRef((props, ref) => {
    const history = useHistory()
    const { auth } = useContext(AppContext)
    const [isRefresh, setIsRefresh] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { searchParams: globalSearchParams } = props?.data
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh } = data;
    const { setLastDataRefreshTime } = handlers;
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
    const [filtering, setFiltering] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedRange, setSelectedRange] = useState('Tasks - All');
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        type: 'all',
        departmentId: auth?.currDeptId
    });
    const taskSearchAPI = `${properties.LEAD_API}/${meOrMyTeam === 'Me' ? 'tasks-by-ageing' : 'tasks-by-ageing/team'}`;

    useEffect(() => {
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

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
            "limit": perPage,
            "page": currentPage,
            "mode": 'list'
        }
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
    }, [meOrMyTeam, isRefresh, currentPage, perPage, searchParams, isPageRefresh]);

    useEffect(() => {
        if (filtering) {
            setCurrentPage(0);
            setPerPage(10);
            fetchData(0, 10);
        }
    }, [filtering])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
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
                        {<div title="Edit" onClick={() => redirectToRespectivePages(row?.original?.oTaskUuid)} className="action-edit"><i className="material-icons">edit</i></div>}
                        <div title="View" onClick={() => redirectToRespectivePages(row?.original?.oTaskUuid)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        } else if (cell.column.id === "aging-color") {
            // Aging Color Code Update
            let a = moment(row.original.oCreatedAt), b = moment(new Date()), count = b.diff(a, 'days'), colorcode = '';
            count <= 3 ? colorcode = 'g' : count <= 5 ? colorcode = 'y' : colorcode = 'r'
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
        <React.Fragment>
            <div className="col-md-12">
                <Overview
                    data={{
                        searchParams,
                        isPageRefresh,
                        meOrMyTeam
                    }}
                    handler={{
                        updateSearchParams
                    }}
                />
                <div className="mywsp-ageing-rht">
                    {selectedRange && (
                        <Badge pill bg="secondary filter-pills mt-2">
                            {selectedRange} <span onClick={clearSearchParam} className="c-pointer filter-pills-close ml-1">x</span>
                        </Badge>
                    )}
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

                <div className="skel-refresh-info">
                    <span><i className="material-icons" title="Refresh">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
                </div>
            </div>
        </React.Fragment>
    )
});

export default AssignToMe;