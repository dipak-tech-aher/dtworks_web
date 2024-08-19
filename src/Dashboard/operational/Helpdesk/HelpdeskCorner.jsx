/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useEffect, useState, useRef } from "react";
import Chart from "../Chart";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { unstable_batchedUpdates } from "react-dom";
import moment from "moment";
import ReactSelect from "react-select";
import { isEmpty } from 'lodash'
import DynamicTable from "../../../common/table/DynamicTable";
import { AssignedHelpdeskColumns } from '../Columns'
import { Modal } from 'react-bootstrap';
import { useHistory }from "../../../common/util/history";
const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}
const entityTypes = [
    {
        label: "Helpdesk Type",
        value: "helpdesk_by_type"
    },
    {
        label: "Helpdesk severity",
        value: "helpdesk_by_severity"
    },
    {
        label: "Helpdesk Project",
        value: "helpdesk_by_project"
    }]


const HelpdeskCorner = (props) => {
    const history = useHistory()
    const { auth } = useContext(AppContext)
    const { searchParams: globalSearchParams } = props?.data
    // const [allIds, setAllIds] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh } = data;
    const { setLastDataRefreshTime } = handlers;
    const [filtering, setFiltering] = useState(false);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId
    });
    const [interactions, setInteractions] = useState([])
    const [intxnKpi, setIntxnKpi] = useState({
        oUserDesc: '',
        oTotalHandlingTime: 0,
        oavgHandlingTime: 0,
        oIntxnCnt: 0
    })
    const [entityType, setEntityType] = useState('helpdesk_by_type')
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filtersData, setFilteredSummaryData] = useState([]);
    const [BarData, setBarDataEnabled] = useState(false);
    const [countData, setCountData] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
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

    const HelpdeskSearchAPI = `${properties.HELPDESK_API}/${meOrMyTeam === 'Me' ? 'helpdesk-corner' : 'team-helpdesk-corner'}`
    const fetchData = async () => {
        try {
            console.log('jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj')
            setLoading(true);
            let searchParamss = {
                ...searchParams,
                category: entityType
            }
            delete searchParamss?.departmentId
            delete searchParamss?.roleId
            const resp = await slowPost(HelpdeskSearchAPI, {
                "searchParams": searchParamss,
            })
            if (resp?.data) {
                unstable_batchedUpdates(() => {
                    let count = resp?.data?.count;
                    let rows = resp?.data?.rows;
                    console.log("rows......>", rows);
                    if (meOrMyTeam !== 'Me') {
                        if (entityType === "helpdesk_by_project") {
                            rows = rows?.map((ele) => {
                                return {
                                    oCategory: ele?.oCustCategory,
                                    oCnt: ele?.oCnt,
                                    oStatus: ele?.oStatus,
                                    oStatusDesc: ele?.oStatusDesc,
                                    oType: ele?.oProject,
                                    oTypeDesc: ele?.oProject,
                                }
                            })
                        } else if (entityType === "helpdesk_by_type") {
                            rows = rows?.map((ele) => {
                                return {
                                    oCategory: ele?.oCustCategory,
                                    oCnt: ele?.oCnt,
                                    oStatus: ele?.oStatus,
                                    oStatusDesc: ele?.oStatusDesc,
                                    oType: ele?.oHelpdeskType,
                                    oTypeDesc: ele?.oHelpdeskType,
                                }
                            })
                        } else if (entityType === "helpdesk_by_severity") {
                            rows = rows?.map((ele) => {
                                return {
                                    oCategory: ele?.oCustCategory,
                                    oCnt: ele?.oCnt,
                                    oStatus: ele?.oStatus,
                                    oStatusDesc: ele?.oStatusDesc,
                                    oType: ele?.oSeverity,
                                    oTypeDesc: ele?.oSeverity,
                                }
                            })
                        } else {
                            rows = rows?.map((ele) => {
                                return {
                                    oCategory: ele?.oCustCategory,
                                    oCnt: ele?.oCnt,
                                    oStatus: ele?.oStatus,
                                    oStatusDesc: ele?.oStatusDesc,
                                    oType: ele?.oType,
                                    oTypeDesc: ele?.oTypeDesc,
                                }
                            })
                        }

                    }
                    if (count) {
                        const statusGroupedInteraction = groupBy(rows, 'oTypeDesc');
                        const xAxisData = []
                        const yAxisData = []
                        console.log("statusGroupedInteraction...........>", statusGroupedInteraction);
                        for (var key in statusGroupedInteraction) {
                            if (statusGroupedInteraction.hasOwnProperty(key)) {
                                xAxisData.push(statusGroupedInteraction[key]?.[0]?.oTypeDesc)
                                yAxisData.push(statusGroupedInteraction[key]?.[0]?.oCnt)
                                // xAxisData.push(statusGroupedInteraction[key])
                                // yAxisData.push(statusGroupedInteraction[key].length)
                            }
                        }
                        setInteractions([{ xAxisData, yAxisData }]);
                        // }
                    } else {
                        setInteractions([])
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

            const intxnHandlingAPI = `${properties.HELPDESK_API}/${meOrMyTeam === 'Me' ? 'handling' : 'team-handling'}`
            const resp2 = await slowPost(intxnHandlingAPI, {
                "searchParams": searchParamss,
            })

            if (resp2?.data) {
                setCountData(resp2?.data?.rows)
                const rows = resp2?.data?.rows.length > 0 ? resp2?.data?.rows[0] : {}
                setIntxnKpi(rows)



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

    const handleClose = () => {
        setShow(false);
    };
    const redirectToRespectivePages = (response) => {
        history(`/view-helpdesk`, {
            state: {data: response}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oAging") {
            // return (<span>{row?.original?.oSelfassignedAt ? moment(row.original?.oSelfassignedAt).fromNow() : '-'}</span>)
            return (<span>{row?.original.oHelpdeskAge?.days || 0} Days, {row?.original.oHelpdeskAge?.hours || 0} Hours, {row?.original.oHelpdeskAge?.minutes || 0} Mins</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        } else if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" className="action-edit" onClick={() => redirectToRespectivePages(row.original)}><i className="material-icons">edit</i></div>
                        <div title="View" className="action-view" data-toggle="modal" data-target="#view-right-modal" onClick={() => redirectToRespectivePages(row.original)}><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const showDetails = async (param) => {
        try {
            console.log("data...............>", data);
            let { masterLookupData: { HELPDESK_TYPE, SEVERITY, PROJECT } } = data
            setLoading(true);
            let searchParamss = {
                ...searchParams,
                category: entityType,
                mode: 'list'
            }
            if (entityType === 'helpdesk_by_type') {
                if (param.name !== 'In Queue') {
                    let filterdata = HELPDESK_TYPE.filter(val => val.value === param.name)
                    if (filterdata.length) {

                        searchParamss.helpdeskType = filterdata.map((val) => {
                            return { ...val, value: val.code }
                        })
                    } else {
                        searchParamss.helpdeskType = [{ value: param.name }]
                    }
                }

            } else if (entityType === 'helpdesk_by_severity') {
                if (param.name !== 'In Queue') {
                    let filterdata = SEVERITY.filter(val => val.value === param.name)
                    if (filterdata.length) {
                        searchParamss.severity = filterdata.map((val) => {
                            return { ...val, value: val.code }
                        })
                    } else {
                        searchParamss.severity = [{ value: param.name }]
                    }
                }
            } else if (entityType === 'helpdesk_by_project') {
                if (param.name !== 'In Queue') {
                    let filterdata = PROJECT.filter(val => val.value === param.name)
                    if (filterdata.length) {
                        searchParamss.project = filterdata.map((val) => {
                            return { ...val, value: val.code }
                        })
                    } else {
                        searchParamss.project = [{ value: param.name }]
                    }
                }
            }
            delete searchParamss?.departmentId
            delete searchParamss?.roleId
            const resp = await slowPost(HelpdeskSearchAPI, {
                "searchParams": searchParamss,
            });
            let responseData = resp?.data?.rows || []
            unstable_batchedUpdates(() => {
                setFilteredSummaryData(responseData)
                setBarDataEnabled(true)
                setShow(true);
                setLoading(false);
            })
        } catch (e) {
            setLoading(false);
            console.log('error', e)
        }

    }
    return (
        <div className=""> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton mh-575">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Helpdesk Corner </span>
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
                                <span className="skel-txt-bold skel-add-templ txt-anchor-link-white" onClick={() => showDetail()}>{(intxnKpi?.oCnt || 0)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="skel-perf-graph">
                        <Chart
                            data={{
                                chartData: interactions
                            }}
                            handlers={{ OnClick: showDetails }}
                        />
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-refresh-info">
                    <span><i className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
                </div>
                    <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                    <Modal.Header>
                        <b>Helpdesk List</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Helpdesk Corner History"}
                            row={BarData ? filtersData : countData}
                            // row={countData}
                            rowCount={countData?.length}
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
                                handleFilters: (e) => { console.log('table filter enabled', e) }
                            }}
                        />
                    </Modal.Body>
                </Modal>
            </div>
        )}
        </div>
    )
}

export default HelpdeskCorner;