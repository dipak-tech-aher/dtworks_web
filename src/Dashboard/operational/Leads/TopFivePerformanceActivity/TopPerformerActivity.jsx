import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Modal } from 'react-bootstrap';
import { OpsDashboardContext } from "../../../../AppContext";
import DynamicTable from "../../../../common/table/DynamicTable";
import { post } from "../../../../common/util/restUtil";
import { properties } from "../../../../properties";
import { TasksColumns } from '../Columns';
import TopPerformerActivityChart from "./TopPerformerActivityChart";

const TopPerformerActivity = (props) => {
    const { searchParams: globalSearchParams } = props?.data;
    const [chartData, setChartData] = useState([])
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());
    const { data } = useContext(OpsDashboardContext);
    const { meOrMyTeam, lastDataRefreshTime } = data;
    const [show, setShow] = useState(false);
    const [resultData, setResultData] = useState([])
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [listFilter, setListFilter] = useState([])

    const modalStyle = {
        'width': '94%',
        'top': '19%',
        'left': '3%',
        'paddingLeft': '2px'
    }

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

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.interactionHistory : lastDataRefreshTime?.interactionHistoryTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime])

    const handleClose = () => {
        setShow(false);
    };

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }


    useEffect(() => {
        let searchParamss = {
            ...globalSearchParams
        }
        post(properties.LEAD_API + `/tasks/top-five/performance-activity`, { searchParams: searchParamss }).then((response) => {
            if (response.status === 200) {
                const resp = response.data;
                if (resp.length > 0) {
                    const formattedResponse = resp.map((items) => ({ oCnt: items?.oTotalCnt, oTypeDesc: items?.oClosedUser, oTypeCode: items?.oStatus }))
                    setChartData([...formattedResponse]);
                } else {
                    setChartData([...[]]);
                }
            } else {
                setChartData([...[]]);
            }
        }).catch((error) => { }).finally(() => {
            // setFiltering(false)
        });
    }, [globalSearchParams, isRefresh])

    const fetchData = useCallback(async () => {
        if (!isEmpty(listFilter)) {
            let searchParamss = {
                ...globalSearchParams,
                limit: perPage,
                page: currentPage,
                type: 'list',
                status: [{ ...listFilter }] ?? null
            }
            console.log('searchParamss', searchParamss)
            post(properties.LEAD_API + `/tasks/top-five/performance-activity`, { searchParams: searchParamss }).then((response) => {
                if (response.status === 200) {
                    const resp = response.data;
                    const uniqueRecords = [...new Map(resp.map(item => [item['oTaskNo'], item])).values()];
                    setResultData([...uniqueRecords]);
                } else {
                    setResultData([...[]]);
                }
            }).catch((error) => { console.error(error) })
                .finally(() => {
                })
        }
    }, [currentPage, globalSearchParams, listFilter, perPage])

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="cmmn-skeleton mh-575">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Top Performer activity</span>
                <div className="skel-dashboards-icons">
                    <a><i title="Refresh" className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-graph">
                    <TopPerformerActivityChart
                        data={{
                            chartData: chartData,
                            height: '400px'
                        }}
                        handlers={{
                            setShow,
                            setListFilter
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
                    <b>Task Status Details</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Task Status Details"}
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

export default TopPerformerActivity;