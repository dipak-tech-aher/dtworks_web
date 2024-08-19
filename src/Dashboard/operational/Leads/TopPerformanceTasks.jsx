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

const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}

const entityTypes = [
    { label: "Task Category", value: "TASK_CATEGORY" },
    { label: "Task Type", value: "TASK_TYPE" },
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

    useEffect(() => {
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    useEffect(() => {
        if (entityType) {
            let searchParamss = {
                ...searchParams,
                category: entityType
            }
            post(properties.LEAD_API + `/top-tasks`, { searchParams: searchParamss }).then((response) => {
                if (response.status == 200) {
                    const resp = response.data;
                    setChartData([...resp]);
                } else {
                    setChartData([...[]]);
                }
            }).catch((error) => { }).finally(() => {
                setFiltering(false)
            });
        }
    }, [entityType, searchParams])

    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.interactionHistory : lastDataRefreshTime?.interactionHistoryTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

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
                <span className="skel-header-title">Top 5 Tasks ({chartData[0]?.['oTotalCnt']??0})</span>
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
                <div className="skel-perf-graph">
                    <Chart
                        data={{
                            chartData: chartData,
                            height: '500px'
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
                    <b>Interaction History Details</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Interaction History"}
                        row={resultData}
                        rowCount={resultData?.length}
                        header={TasksColumns}
                        fixedHeader={true}
                        columnFilter={true}
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