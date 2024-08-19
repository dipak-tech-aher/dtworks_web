/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useEffect, useState, useRef } from "react";
import Chart from "./Chart";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";
import moment from "moment";
import ReactSelect from "react-select";
import { isEmpty } from 'lodash'
import DynamicTable from "../../../common/table/DynamicTable";
import { TasksColumns } from './Columns'
import { Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from "react-dom";

const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}

const entityTypes = [
    // { label: "Task Category", value: "TASK_CATEGORY" },
    // { label: "Task Type", value: "TASK_TYPE" },
    { label: 'Priority', value: "PRIORITY" }
]

const TasksCorner = (props) => {
    const { auth } = useContext(AppContext);
    const { searchParams: globalSearchParams } = props?.data;
    const [isRefresh, setIsRefresh] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh } = data;
    const { setLastDataRefreshTime } = handlers;
    const [filtering, setFiltering] = useState(false);
    const [searchParams, setSearchParams] = useState({});
    const [chartData, setChartData] = useState([])
    const [resultData, setResultData] = useState([])

    const [entityType, setEntityType] = useState('PRIORITY')
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    const fetchData = async () => {
        let searchParamss = {
            ...searchParams,
        }
        post(properties.LEAD_API + `/${meOrMyTeam === 'Me' ? 'tasks-corner' : 'tasks-corner/team'}`, { searchParams: searchParamss }).then((response) => {
            if (response.status === 200) {
                const resp = response.data;
                setTotalCount(~~resp?.[0]?.oTotalCnt ?? 0)
                const uniqueRecords = [...new Map(resp.map(item => [item['oTaskNo'], item])).values()];
                setResultData([...uniqueRecords]);
            } else {
                setResultData([...[]]);
            }
        }).catch((error) => { }).finally(() => {
            setFiltering(false)
        });
    };

    useEffect(() => {
        if (entityType && searchParams) {
            let searchParamss = {
                ...searchParams,
                category: entityType
            }
            
            post(properties.LEAD_API + `/${meOrMyTeam === 'Me' ? 'tasks-corner-chart' : 'tasks-corner-chart/team'}`, { searchParams: searchParamss }).then((response) => {
                if (response.status === 200) {
                    const resp = response.data;
                    setChartData([...resp]);
                } else {
                    setChartData([...[]]);
                }
            }).catch((error) => { }).finally(() => {
                setFiltering(false)
            });
        }
    }, [entityType, searchParams, meOrMyTeam])

    useEffect(() => {
        fetchData();
    }, [isRefresh, meOrMyTeam, entityType, searchParams, isPageRefresh]);

    useEffect(() => {
        if (filtering) {
            fetchData();
        }
    }, [filtering])

    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.interactionHistory : lastDataRefreshTime?.interactionHistoryTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const showDetail = () => {
        unstable_batchedUpdates(() => {
            setShow(false)
            setTotalCount(0)
            setCurrentPage(0)
            setPerPage(10)
        })
    }

    const handleClose = () => {
        setShow(false);
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCreatedAt") {
            return (
                <span>
                    {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
                </span>
            )
        } else if (cell.column.id === "oLeadName") {

        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="cmmn-skeleton mh-575">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Tasks Corner</span>
                <ReactSelect
                    className="skel-cust-graph-select"
                    placeholder="Search..."
                    options={entityTypes}

                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                    value={entityType ? entityTypes.find(c => c.value === entityType) : null}
                    onChange={(val) => setEntityType(val.value)}
                />
                <div className="skel-dashboards-icons">
                    <a ><i title="Refresh" className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-data">
                    <div className="card" style={{ padding: '10px', margin: '10px', height: '100px', width: '160px' }}>
                        <div className="skel-avg-perf">
                            <span>Total Handling Time</span>
                            <span className="skel-txt-bold">{
                                resultData[0]?.oTotalHandlingTime && !isEmpty(resultData[0]?.oTotalHandlingTime)
                                    ? resultData[0]?.oTotalHandlingTime
                                    : '0 min'} </span>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '10px', margin: '10px', height: '100px', width: '160px' }}>
                        <div className="skel-avg-perf">
                            <span>Avg Handling Time</span>
                            <span className="skel-txt-bold">{
                                resultData[0]?.oAvgHandlingTime && !isEmpty(resultData[0]?.oAvgHandlingTime)
                                    ? resultData[0]?.oAvgHandlingTime
                                    : '0 min'}</span>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '10px', margin: '10px', height: '100px', width: '160px' }}>
                        <div className="skel-avg-perf">
                            <span>Count</span>
                            <span className="skel-txt-bold skel-add-templ txt-anchor-link-white" onClick={() => showDetail()}>{(resultData[0]?.oTotalCnt || 0)}</span>
                        </div>
                    </div>
                </div>
                <div className="skel-perf-graph">
                    <Chart
                        data={{
                            chartData: chartData,
                            height: '400px'
                        }}
                    />
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                <Modal.Header>
                    <b>Task Details</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Task Details"}
                        row={resultData}
                        header={TasksColumns}
                        rowCount={totalCount ?? 0}
                        fixedHeader={true}
                        columnFilter={true}
                        backendPaging={true}
                        itemsPerPage={perPage}
                        isScroll={true}
                        isTableFirstRender={tableRef}
                        backendCurrentPage={currentPage}
                        handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setPerPage,
                            handleCurrentPage: setCurrentPage,
                            handleFilters: setFilters
                        }}
                    />
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default TasksCorner;