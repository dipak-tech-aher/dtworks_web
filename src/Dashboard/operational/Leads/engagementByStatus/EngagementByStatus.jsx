/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../../common/table/DynamicTable";
import { TasksColumns } from '../Columns';
import { post } from "../../../../common/util/restUtil";
import { properties } from "../../../../properties";
import { OpsDashboardContext } from "../../../../AppContext";
import EngagementByStatusChart from "./EngagementByStatusChart"
import { isEmpty } from 'lodash'
import { unstable_batchedUpdates } from "react-dom";

const EngagementByStatus = (props) => {
    const { searchParams: globalSearchParams, auth } = props?.data;
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
    const [totalCount, setTotalCount] = useState(0)

    const modalStyle = {
        'width': '94%',
        'top': '19%',
        'left': '3%',
        'paddingLeft': '2px'
    }

    useEffect(() => {
        let searchParamss = {
            ...globalSearchParams,
            userId: meOrMyTeam === 'Me' ? auth?.user?.userId ?? null : null,

        }
        post(properties.LEAD_API + `/engagement-by-status`, { searchParams: searchParamss })
            .then((response) => {
                if (response.status === 200) {
                    const resp = response.data;
                    if (resp.length > 0) {
                        const formattedResponse = resp.map((items) => ({ oCnt: items.oCnt, oTypeDesc: items.oStatusDesc, oTypeCode: items.oStatus }))
                        setChartData([...formattedResponse]);
                    }else {
                        setChartData([...[]]);
                    }
                } else {
                    setChartData([...[]]);
                }
            }).catch((error) => { }).finally(() => {
                // setFiltering(false)
            });
    }, [globalSearchParams, isRefresh])

    const handleClose = () => {
        unstable_batchedUpdates(() => {
            setShow(false)
            setTotalCount(0)
            setCurrentPage(0)
            setPerPage(10)
        })
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

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.interactionHistory : lastDataRefreshTime?.interactionHistoryTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const fetchData = useCallback(async () => {
        if (!isEmpty(listFilter)) {
            let searchParamss = {
                ...globalSearchParams,
                userId: meOrMyTeam === 'Me' ? auth?.user?.userId ?? null : null,
                limit: perPage,
                page: currentPage,
                type: 'list',
                status: [{ ...listFilter }] ?? null
            }
            console.log('searchParamss', searchParamss)
            post(properties.LEAD_API + `/engagement-by-status`, { searchParams: searchParamss })
                .then((response) => {
                    if (response.status === 200) {
                        const resp = response.data;
                        setTotalCount(~~resp?.[0]?.oTotalCnt ?? 0)
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
                <span className="skel-header-title">Engagement By Status</span>
                <div className="skel-dashboards-icons">
                    <a ><i title="Refresh" className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-graph">
                    <EngagementByStatusChart
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
                    <b>Engagement Details</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Interaction History"}
                        row={resultData}
                        rowCount={totalCount ?? 0}
                        header={TasksColumns}
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

export default EngagementByStatus