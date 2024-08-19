/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState,useRef} from "react";
import ReactSelect from "react-select";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import TopPerformingCategory from "./TopPerformingCategory";
import { unstable_batchedUpdates } from "react-dom";
import DynamicTable from "../../../common/table/DynamicTable";
import { InteractionHistoryColumns } from '../Columns'
import { Modal } from 'react-bootstrap';
const modalStyle = {
    'width': '94%',
    'top': '19%',
    'left': '3%',
    'paddingLeft': '2px'
}
const TopPerformanceInteraction = (props) => {
    const { auth } = useContext(AppContext);
    const { searchParams: globalSearchParams } = props?.data;
    const [show, setShow] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [listData, setListData] = useState([]);
    const [listCountData, setListCountData] = useState(0);
    const [countData, setCountData] = useState([]);
    const tableRef = useRef(true);


    const [isRefresh, setIsRefresh] = useState(false);
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        // fromDate: moment().startOf('month').format("YYYY-MM-DD"),
        // toDate: moment().endOf('month').format("YYYY-MM-DD")
    });
    const { data, handlers } = useContext(OpsDashboardContext);
    // // console.log("datadatadata => ", data);
    const { setLastDataRefreshTime } = handlers
    const { meOrMyTeam, lastDataRefreshTime, currentTime, isPageRefresh, masterLookupData } = data;
    const [performer, setPerformer] = useState([])
    const [entityType, setEntityType] = useState({
        label: "Interaction Type",
        value: "interactionType"
    })
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());


    const getinformativeDetails = useCallback(() => {
        if (searchParams && searchParams?.roleId && searchParams?.departmentId) {
            delete searchParams?.roleId
            delete searchParams?.departmentId
        }
        const intxnHandlingAPI = `${properties.INTERACTION_API}/get-interaction-category-performance`
        let searchParamss = {
            ...searchParams,
            limit: 5
        }
        slowPost(intxnHandlingAPI, {
            type: entityType?.value,
            searchParams: searchParamss
        }).then((res) => {
            if (res?.data) {
                const rows = res?.data?.rows.length > 0 ? res?.data?.rows : []
                const totalCount = rows?.reduce((total, obj) => total + Number(obj?.count), 0);
                setTotal(totalCount)
                // const statusGroupedDetails = groupBy(rows, 'oUserDesc');

                const yAxisData = rows.map(r => {
                    return {
                        value: r.count,
                        itemStyle: {
                            color: '#CB4335' // chroma.random().darken().hex()
                        }
                    }
                })
                // console.log("rowsrows ===> ", rows);
                const xAxisData = new Set([...rows.map(n => n.status)])
                const legend = new Set([...rows.map(n => n.description)])
                const seriesData = new Set()

                for (const l of Array.from(legend)) {
                    let data = []

                    let filteredData = []
                    for (const x of Array.from(xAxisData)) {
                        let value = 0
                        filteredData = rows.filter(r => {
                            if (r.description === l && r.status === x) {
                                value += Number(r.count)
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
                            position: "top",
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
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceInteraction: moment().format('DD-MM-YYYY HH:mm:ss') })
                } else {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceInteractionTeam: moment().format('DD-MM-YYYY HH:mm:ss') })
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

    const entityTypes = [{
        label: "Interaction Type",
        value: "interactionType"
    }, {
        label: "Interaction Category",
        value: "interactionCategory"
    }]

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.TopPerformanceInteraction : lastDataRefreshTime?.TopPerformanceInteractionTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);


    const getListData=()=>{
        const intxnHandlingAPI = `${properties.INTERACTION_API}/get-interaction-category-list`
        let searchParamss = {
            ...searchParams,
            limit:perPage
        }
        slowPost(intxnHandlingAPI, {
            type: entityType?.value,
            searchParams: searchParamss
        }).then((res) => {
            if(res?.data){
                console.log("res?.data.............>",res?.data);
                setListData(res?.data?.rows)
                setListCountData(res?.data?.count)
            setShow(true)

            }
        }).catch((error) => {
            console.log(error)
        }).finally(() => {
        })
    }

    

    const OnClick = (params) => {
        console.log('here--->', params);
        getListData(perPage,currentPage);
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
        <div className="cmmn-skeleton mh-575">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Top 5 Interactions ({total})</span>
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
                        handlers={{ OnClick }}
                    />
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>            </div>
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
                            row={listData}
                            rowCount={listCountData}
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

    )

}

export default TopPerformanceInteraction;