/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import ReactSelect from "react-select";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import TopPerformingCategory from "./TopPerformingCategory";
import { unstable_batchedUpdates } from "react-dom";
import { Modal } from "react-bootstrap";
import DynamicTable from "../../../common/table/DynamicTable";
import { AssignedHelpdeskColumns } from "../Columns";
import { useHistory }from "../../../common/util/history";

const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}

const TopPerformanceHelpdesk = (props) => {
    const history = useHistory()
    const { auth } = useContext(AppContext);
    const { searchParams: globalSearchParams } = props?.data
    const [isRefresh, setIsRefresh] = useState(false);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        // fromDate: moment().startOf('month').format("YYYY-MM-DD"),
        // toDate: moment().endOf('month').format("YYYY-MM-DD")
    });
    const { data, handlers } = useContext(OpsDashboardContext);
    // // console.log("datadatadata => ", data);
    const { setLastDataRefreshTime } = handlers
    const { meOrMyTeam, lastDataRefreshTime, currentTime, isPageRefresh, masterLookupData } = data;
    const [performer, setPerformer] = useState([]);
    const [entityType, setEntityType] = useState({
        label: "Helpdesk Type",
        value: "helpdesk_by_type_status"
    })
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());
    const [filtersData, setFilteredSummaryData] = useState([]);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);

    const HelpdeskHandlingAPI = `${properties.HELPDESK_API}/top-5-helpdesk`
    const getinformativeDetails = useCallback(() => {
        if (searchParams && searchParams?.roleId && searchParams?.departmentId) {
            delete searchParams?.roleId
            delete searchParams?.departmentId
        }
        let searchParamss = {
            ...searchParams,
            category: entityType?.value,
            limit: 5
        }
        slowPost(HelpdeskHandlingAPI, {
            // category: entityType?.value,
            searchParams: searchParamss
        }).then((res) => {
            if (res?.data) {
                const rows = res?.data?.rows.length > 0 ? res?.data?.rows : []
                const totalCount = rows?.reduce((total, obj) => total + Number(obj?.oCnt), 0);
                setTotal(totalCount)
                // const statusGroupedDetails = groupBy(rows, 'oUserDesc');

                const yAxisData = rows.map(r => {
                    return {
                        value: r.oCnt,
                        itemStyle: {
                            color: '#CB4335' // chroma.random().darken().hex()
                        }
                    }
                })
                // console.log("rowsrows ===> ", rows);
                const xAxisData = new Set([...rows.map(n => n.oTypeDesc)])
                const legend = new Set([...rows.map(n => n.oStatusDesc)])
                const seriesData = new Set()

                for (const l of Array.from(legend)) {
                    let data = []

                    let filteredData = []
                    for (const x of Array.from(xAxisData)) {
                        let value = 0
                        filteredData = rows.filter(r => {
                            if (r.oStatusDesc === l && r.oTypeDesc === x) {
                                value += Number(r.oCnt)
                            }
                        })
                        data.push(value)
                    }

                    const obj = {
                        barMaxWidth: 100,
                        name: l,
                        type: 'bar',
                        barGap: 0,
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: '15',
                                fontWeight: 'bold'
                            }
                        },
                        label: {
                            show: true,
                            position: "insideBottom",
                            distance: 15,
                            align: "left",
                            verticalAlign: "middle",
                            fontSize: 16,
                        },
                        data: data
                    }
                    seriesData.add(obj);
                }
                setPerformer([{ yAxisData, xAxisData: Array.from(xAxisData), legend: Array.from(legend), seriesData: Array.from(seriesData) }])
            }
            unstable_batchedUpdates(() => {
                if (meOrMyTeam === 'Me') {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceHelpdesk: moment().format('DD-MM-YYYY HH:mm:ss') })
                } else {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceHelpdeskTeam: moment().format('DD-MM-YYYY HH:mm:ss') })
                }
            })
        }).catch((error) => {
            // console.log(error)

        }).finally(() => {
        })

    }, [meOrMyTeam, searchParams, entityType])

    useEffect(() => {
        getinformativeDetails()
    }, [isRefresh, meOrMyTeam, entityType, getinformativeDetails, isPageRefresh]);

    useEffect(() => {
        // // console.log(globalSearchParams, "from assign to me component")
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    const entityTypes = [
        {
            label: "Helpdesk Type",
            value: "helpdesk_by_type_status"
        },
        {
            label: "Helpdesk severity",
            value: "helpdesk_by_severity_status"
        },
        {
            label: "Helpdesk Project",
            value: "helpdesk_by_project_status"
        }]

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.TopPerformanceHelpdesk : lastDataRefreshTime?.TopPerformanceHelpdeskTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);
    const handleClose = () => {
        setShow(false);
    };
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const redirectToRespectivePages = (response) => {
        history(`/view-helpdesk`, {
            state: {data: response}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oAging") {
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
    const showDetails = async (param) => {
        try {
            console.log('seriesName-------->', param?.seriesName)
            let { masterLookupData: { HELPDESK_TYPE, SEVERITY, PROJECT, HELPDESK_STATUS } } = data
            let searchParamss = {
                ...searchParams,
                category: entityType?.value,
                mode: 'list'
            }
            let filterStatusdata = HELPDESK_STATUS.filter(val => val.value === param.seriesName)
            if (filterStatusdata.length) {
                searchParamss.status = filterStatusdata.map((val) => {
                    return { value: val.code }
                })
            } else {
                searchParamss.status = [{ value: param.seriesName }]
            }

            if (entityType?.value === 'helpdesk_by_type_status') {
                if (param.name !== 'In Queue') {
                    let filterdata = HELPDESK_TYPE.filter(val => val.value === param.name)
                    if (filterdata.length) {
                        searchParamss.helpdeskType = filterdata.map((val) => {
                            return { ...val, value: val.code }
                        })
                    } else {
                        searchParamss.helpdeskType = [{ value: param.name }]
                        searchParamss.status = [{ value: param.seriesName }]
                    }
                }

            } else if (entityType?.value === 'helpdesk_by_severity_status') {
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
            } else if (entityType?.value === 'helpdesk_by_project_status') {
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
            const resp = await slowPost(HelpdeskHandlingAPI, {
                "searchParams": searchParamss,
            });
            let responseData = resp?.data?.rows || []

            unstable_batchedUpdates(() => {
                setFilteredSummaryData(responseData)
                setShow(true);
            })
        } catch (e) {
            console.log('error', e)
        }
    }
    return (
        <div className="cmmn-skeleton mh-575">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Top 5 Helpdesk ({total})</span>
                <ReactSelect
                    className="skel-cust-graph-select"
                    options={entityTypes}

                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                    value={entityType ? entityTypes.find(c => c.value === entityType.value) : null}
                    onChange={(val) => setEntityType(val)}
                />
                <div className="skel-dashboards-icons">
                    <a title="Refresh"><i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-data j-center">
                </div>
                <div className="skel-perf-graph">
                    <TopPerformingCategory
                        data={{
                            chartData: performer,
                            entity: entityType.label,
                            masterLookupData
                        }}
                        handlers={{ OnClick: showDetails }}
                    />
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                <Modal.Header>
                    <b>Helpdesk List</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Interaction History"}
                        row={filtersData}
                        rowCount={filtersData?.length}
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

export default TopPerformanceHelpdesk;