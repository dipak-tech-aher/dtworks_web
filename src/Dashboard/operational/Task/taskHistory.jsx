/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useEffect, useState, useRef } from "react";
import Chart from "../Chart";
import FilterComponent from "../../components/FilterComponent";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { unstable_batchedUpdates } from "react-dom";

import moment from "moment";
import ReactSelect from "react-select";
import { isEmpty } from 'lodash'
import DynamicTable from "../../../common/table/DynamicTable";
import { InteractionHistoryColumns } from '../Columns'
import { Modal } from 'react-bootstrap';
const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}
const entityTypes = [
    { label: "Status", value: "oIntxnStatus" },
    { label: "Service Category", value: "oServiceCategory" },
    { label: 'Interaction Category', value: "oIntxnCategory" },
    { label: 'Interaction Type', value: "oIntxnType" },
    // {label: 'Request Statement',value: 'requestStatement'},
    // { label: 'Channel', value: 'channelDesc' },
    // { label: 'Service Type', value: 'serviceTypeDesc' },
    // { label: 'Priority', value: 'priorityDesc' }
]


const InteractionHistory = (props) => {
    const { auth } = useContext(AppContext)
    const { searchParams: globalSearchParams } = props?.data
    // const [allIds, setAllIds] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, lastDataRefreshTime, currentTime, isPageRefresh, masterLookupData } = data;
    const { setLastDataRefreshTime, setCurrentTime } = handlers;
    const [filtering, setFiltering] = useState(false);
    const [BarData, setBarDataEnabled] = useState(false);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        //    roleId: auth?.currRoleId,
        // fromDate: moment().startOf('month').format("YYYY-MM-DD"),
        // toDate: moment().endOf('month').format("YYYY-MM-DD")
    });
    const [interactions, setInteractions] = useState([])
    const [intxnKpi, setIntxnKpi] = useState({
        oUserDesc: '',
        oTotalHandlingTime: 0,
        oavgHandlingTime: 0,
        oIntxnCnt: 0
    })

    // const [showFilter, setShowFilter] = useState(false)
    const [entityType, setEntityType] = useState('oIntxnStatus')
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [intxnHistoryData, setIntxnHistoryData] = useState([]);
    const [intxnHandlingData, setIntxnHandlingData] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    const [totalIntxnCount, setTotalIntxnCount] = useState(0);
    /** The function is for grouping object based on "Key"
     * @param {object} items 
     * @param {string} key 
     * @returns {object}
     */
    const groupBy = (items, key) => items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [
                ...(result[item[key]] || []),
                item,
            ],
        }),
        {},
    );

    useEffect(() => {
        // console.log(globalSearchParams, "from assign to me component")
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    const fetchData = async () => {
        try {
            setLoading(true);
            const intxnSearchAPI = `${properties.INTERACTION_API}/${meOrMyTeam === 'Me' ? 'interaction-history-graph' : 'interaction-history-graph-team'}`
            let searchParamss = {
                ...searchParams,
            }
            const resp = await slowPost(intxnSearchAPI, {
                "searchParams": searchParamss,
            })
            if (resp?.data) {
                unstable_batchedUpdates(() => {
                    let {rows, count} = resp?.data;
                    setIntxnHistoryData(rows)
                    setTotalIntxnCount(count)
                    if (entityType === "oIntxnStatus") {
                        const statusGroupedInteraction = groupBy(rows, 'currStatusDesc');
                        const xAxisData = []
                        const yAxisData = []
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(key)
                                yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        // if (meOrMyTeam !== 'Me') {
                            setInteractions([{ xAxisData, yAxisData }]);
                        // }
                    }
                    else if (entityType === "oServiceCategory") {
                        const statusGroupedInteraction = groupBy(rows, 'categoryDescription');
                        const xAxisData = []
                        const yAxisData = []
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(key)
                                yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        // if (meOrMyTeam !== 'Me') {
                            setInteractions([{ xAxisData, yAxisData }]);
                        // }
                    }
                    else if (entityType === "oIntxnCategory") {
                        const statusGroupedInteraction = groupBy(rows, 'intxnCategoryDesc');
                        const xAxisData = []
                        const yAxisData = []
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(key)
                                yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        // if (meOrMyTeam !== 'Me') {
                            setInteractions([{ xAxisData, yAxisData }]);
                        // }
                    }
                    else if (entityType === "oIntxnType") {
                        const statusGroupedInteraction = groupBy(rows, 'intxnTypeDesc');
                        const xAxisData = []
                        const yAxisData = []
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(key)
                                yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        // if (meOrMyTeam !== 'Me') {
                            setInteractions([{ xAxisData, yAxisData }]);
                        // }
                    }
                })
            } else {
                setInteractions([])
            }

            unstable_batchedUpdates(() => {
                if (meOrMyTeam === 'Me') {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, interactionHistory: moment().format('DD-MM-YYYY HH:mm:ss') })
                } else {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, interactionHistoryTeam: moment().format('DD-MM-YYYY HH:mm:ss') })
                }
            })

            const intxnHandlingAPI = `${properties.INTERACTION_API}/${meOrMyTeam === 'Me' ? 'get-handling-time' : 'get-team-handling-time'}`

            const resp2 = await slowPost(intxnHandlingAPI, {
                "searchParams": searchParamss,
            })


            if (resp2?.data) {
                const rows = resp2?.data?.rows.length > 0 ? resp2?.data?.rows[0] : {}
                setIntxnKpi(rows)
                if (meOrMyTeam === 'Me') {
                    setIntxnHandlingData(resp2?.data?.rows)
                    let count = resp2?.data?.rows?.length || 0;
                    let rowss = resp2?.data?.rows;
                    if (rows?.oIntxnCnt) {
                        const uniqueRecords = [...new Map(rowss.map(item => [item['oIntxnNo'], item])).values()];
                        const statusGroupedInteraction = groupBy(uniqueRecords, entityType);
                        const xAxisData = []
                        const yAxisData = [];
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(key)
                                yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        // setInteractions([{ xAxisData, yAxisData }]);
                    } else {
                        // setInteractions([])
                    }
                }
            }
        } catch (error) {
            // console.log(error)
        } finally {
            setFiltering(false);
            setLoading(false);
        }
    };

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
        setShow(true);
        if (BarData) setBarDataEnabled(false);

    }


     
    const OnClick = (params) => {
        console.log('here--->', params);
        showDetail()
    }

    const handleClose = () => {
        setShow(false);
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCreatedAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className=""> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton mh-575">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Interactions Corner</span>
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
                                    intxnKpi?.oTotalHandlingTime && !isEmpty(intxnKpi?.oTotalHandlingTime)
                                        ? intxnKpi?.oTotalHandlingTime
                                        : '0 min'} </span>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '10px', margin: '10px', height: '100px', width: '160px' }}>
                            <div className="skel-avg-perf">
                                <span>Avg Handling Time</span>
                                <span className="skel-txt-bold">{
                                    intxnKpi?.oAvgHandlingTime && !isEmpty(intxnKpi?.oAvgHandlingTime)
                                        ? intxnKpi?.oAvgHandlingTime
                                        : '0 min'}</span>
                            </div>
                        </div>
                        <div className="card" style={{ padding: '10px', margin: '10px', height: '100px', width: '160px' }}>
                            <div className="skel-avg-perf">
                                <span>Count</span>
                                <span className="skel-txt-bold skel-add-templ txt-anchor-link-white" onClick={() => showDetail()}>{((totalIntxnCount !== 0 ? totalIntxnCount : intxnKpi?.oIntxnCnt) ?? 0)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="skel-perf-graph">
                        <Chart
                            data={{
                                chartData: interactions,
                            }}
                        handlers={{ OnClick}}
                        />
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-refresh-info">
                    <span><i className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Interaction History Details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Interaction History"}
                            row={intxnHistoryData}
                            rowCount={totalIntxnCount}
                            header={InteractionHistoryColumns}
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
        )}
        </div>
    )
}

export default InteractionHistory;