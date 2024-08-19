/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useContext, useEffect, useRef, useState } from "react";
import { OpsDashboardContext } from "../../../AppContext";
import { slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import TopPerformance from "./TopPerformance";
import { unstable_batchedUpdates } from "react-dom";
import { groupBy } from "../../../common/util/util";
import { Modal } from "react-bootstrap";
import DynamicTable from "../../../common/table/DynamicTable";
import { AssignedHelpdeskColumns } from "../Columns";

const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}
const HelpdeskHandlingAPI = `${properties.HELPDESK_API}/top-performers-user-wise`
const HelpdeskTopPerformerActivity = (props) => {
    let { searchParams:globalSearchParams } = props?.data
    const [isRefresh, setIsRefresh] = useState(false);
    const [filtering, setFiltering] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh, auth } = data;
    const { setLastDataRefreshTime, setCurrentTime } = handlers;
    const [performer, setPerformer] = useState([])
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        // fromDate: moment().startOf('month').format("YYYY-MM-DD"),
        // toDate: moment().endOf('month').format("YYYY-MM-DD"),
        limit: 5
    })
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment())
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [BarData, setFilteredBarData] = useState([]);

    const getinformativeDetails = () => {
        let searchParamss = {
            ...searchParams,
        }
        slowPost(HelpdeskHandlingAPI, {
            "searchParams": searchParamss,
        }).then((res) => {
            if (res?.data) {
                const rows = res?.data?.rows.length > 0 ? res?.data?.rows : []
                const statusGroupedDetails = groupBy(rows, 'oUserDesc');
                const xAxisData = []
                const yAxisData = []
                for (var key in statusGroupedDetails) {
                    if (statusGroupedDetails.hasOwnProperty(key)) {
                        xAxisData.push(key);
                        let result = statusGroupedDetails[key].reduce(function (acc, obj) { return acc + Number(obj.oCnt); }, 0);
                        yAxisData.push(result)
                        // yAxisData.push(statusGroupedDetails[key].length)

                    }
                }

                setCurrentTime(moment().format('DD-MM-YYYY HH:mm:ss'))
                setLastDataRefreshTime({ ...lastDataRefreshTime, performanceActivity: moment().format('DD-MM-YYYY HH:mm:ss') })
                setPerformer([{ yAxisData, xAxisData }])

            }
            unstable_batchedUpdates(() => {
                if (meOrMyTeam === 'Me') {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopFivePerformer: moment().format('DD-MM-YYYY HH:mm:ss') })
                } else {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopFivePerformerTeam: moment().format('DD-MM-YYYY HH:mm:ss') })
                }
            })
        }).catch((error) => {
            // console.log(error)

        }).finally(() => { })
    }


    useEffect(() => {
        getinformativeDetails()
    }, [isRefresh, meOrMyTeam, isPageRefresh, searchParams]);

    useEffect(() => {
        if (filtering) {
            getinformativeDetails()
        }
    }, [filtering, getinformativeDetails])
    useEffect(() => {
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.TopFivePerformer : lastDataRefreshTime?.TopFivePerformerTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const showDetails = async (param) => {
        try {
            let searchParamss = {
                ...searchParams,
                mode: 'LIST'
            }
            const resp = await slowPost(HelpdeskHandlingAPI, {
                "searchParams": searchParamss,
            });
            let responseData = resp?.data?.rows || []
            console.log(responseData)
            unstable_batchedUpdates(() => {
                setFilteredBarData(responseData)
                setShow(true);
            })
        } catch (e) {
            console.log('error', e)
        }
    }
    const handleClose = () => {
        setShow(false);
    };
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oAging") {
            // return (<span>{row.original?.oSelfassignedAt ? moment(row.original?.oSelfassignedAt).fromNow() : '-'}</span>)
            return (<span>{row?.original.oHelpdeskAge?.days || 0} Days, {row?.original.oHelpdeskAge?.hours || 0} Hours, {row?.original.oHelpdeskAge?.minutes || 0} Mins</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        } else if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" className="action-edit"><i className="material-icons">edit</i></div>
                        <div title="View" className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }
    return (
        <div className="cmmn-skeleton mh-575">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Top Performance Activity</span>
                <div className="skel-dashboards-icons">
                    <a title="Refresh"><i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>

                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-data j-center">
                </div>
                <div className="skel-perf-graph">
                    <TopPerformance
                        data={{
                            chartData: performer,
                            entity: 'Helpdesk'
                        }}
                        handlers={{ OnClick: showDetails }}
                    />
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                <Modal.Header>
                    <b></b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Interaction History"}
                        row={BarData}
                        rowCount={BarData?.length}
                        header={AssignedHelpdeskColumns.filter((val) => val.id !== 'aging-color')}
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
                            handleFilters: () => { }
                        }}
                    />
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default HelpdeskTopPerformerActivity;