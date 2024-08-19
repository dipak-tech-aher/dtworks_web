/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useContext, useState, useRef } from "react";
import { post } from "../../../common/util/restUtil";
import { AppContext, OpsDashboardContext } from '../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { useHistory }from "../../../common/util/history";
import { properties } from "../../../properties";
import moment from 'moment';
import { Dropdown, Badge } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { toast } from "react-toastify";
import { statusConstantCode } from "../../../AppConstants";
import { AssignedTaskColumns } from "../Columns";
import DashboardOverview from "../components/InteractionOverview";

const AssignToMeTask = (props) => {
    const history = useHistory()
    const { appsConfig, searchParams: globalSearchParams, fromComp } = props?.data
    const { auth, appConfig } = useContext(AppContext)
    const [isRefresh, setIsRefresh] = useState(false);
    const [allIds, setAllIds] = useState([])
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, viewType, pageRefreshTime, masterLookupData, lastDataRefreshTime, assignedInteractionAge, assignedOrderAge, assignedRequestAge, isPageRefresh, allPooledCounts } = data;
    const { setSelectedInteraction, setSelectedOrder, setSelectedEntityType, setLastDataRefreshTime, setSearchParams: setGlobalSearchParams, setAssignedInteractionAge, setAssignedOrderAge, setIsPageRefresh, setSource, clickToScroll } = handlers;
    const [exportBtn, setExportBtn] = useState(true);
    const redirectToRespectivePages = (response) => {
        let data = {
            customerUid: response?.oCustomerUuid,
            sourceName: 'customer360'
        }
        if (response?.oReferenceName === 'ORDER') {
            data.orderNo = response?.oNo ? response?.oNo : response?.oReferenceValue
            data.childOrderId = response?.oChildOrderNo

            if (data?.customerUid) {
                localStorage.setItem("customerUuid", response.oCustomerUuid)
            }
            history("/order360", { state: {data} })
        } else if (response?.oReferenceName === 'INTERACTION') {
            data.intxnNo = response?.oNo ? response?.oNo : response?.oReferenceValue
            data.intxnId = response?.oReferenceId
            if (data?.customerUid) {
                localStorage.setItem("customerUuid", response.oCustomerUuid)
            }
            history("/interaction360", { state: {data} })
        } else if (response?.oReferenceName === 'HELPDESK') {
            data.helpdeskNo = response?.oNo ? response?.oNo : response?.oReferenceValue
            data.helpdeskId = response?.oReferenceId
            if (data?.customerUid) {
                localStorage.setItem("customerUuid", response.oCustomerUuid)
            }
            history(`/view-helpdesk`, { state: {data} })
        } else {
            toast.error(`There is no specific screen for ${response?.oEntityType}`)
        }
    }

    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(lastDataRefreshTime.assignedToMe, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    const handleOpenRightModal = (ele) => {
        // // console.log('ele---------->', ele)
        if (ele?.oEntityType === 'Order') {
            setSelectedEntityType('Order')
            setSelectedOrder([ele]);
        } else if (ele?.oEntityType === 'Interaction') {
            setSelectedEntityType('Interaction')
            setSelectedInteraction([ele]);
            setSource('assign-to-me')
        }
    }

    const [interactions, setInteractions] = useState([])
    const tableRef = useRef(true);
    const hasExternalSearch = useRef(false);
    const [columns, setColumns] = useState(AssignedTaskColumns);
    const [filters, setFilters] = useState([]);
    const [filtering, setFiltering] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        entityType: fromComp ? fromComp?.toLowerCase() : 'all',
        departmentId: auth?.currDeptId
    });
    const TaskSearchAPI = `${properties.TASK_API}/get-assigned-to-me-task`;

    useEffect(() => {
        // // console.log(globalSearchParams, "from assign to me component")
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    const fetchData = async (currentPage, perPage) => {
        // // console.log(searchParams, "============== assigntome ===================");
        let searchParamss = {
            ...searchParams,
            "limit": perPage,
            "page": currentPage
        }
        post(TaskSearchAPI, {
            "searchParams": searchParamss,
        }).then((resp) => {
            if (resp.data) {
                unstable_batchedUpdates(() => {
                    let count = resp?.data?.count;
                    let rows = resp?.data?.rows;
                    if (count > 0) {
                        const uniqueRecords = [...new Map(rows.map(item => [item['oTaskId'], item])).values()];
                        const allIds = uniqueRecords.map(ele => ele?.oTaskId).filter(Boolean);
                        setTotalCount(count);
                        setInteractions([...uniqueRecords]);
                        setAllIds(allIds);
                    } else {
                        setTotalCount(0);
                        setInteractions([]);
                        setAllIds([])
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

    // // console.log({ masterLookupData })
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oIntxnSeverityDesc") {
            let lookUpData = (row.original?.oEntityType === "Order") ? masterLookupData.ORDER_STATUS : masterLookupData.INTXN_STATUS;
            let colorClass = lookUpData?.find(x => x.description == row.original?.oIntxnSeverityDesc)?.mapping?.colorClass;
            return (
                <span className={colorClass}>
                    {cell.value}
                </span>
            )
        }
        else if (cell.column.id === "oTaskStatusDesc") {
            let lookUpData = (row.original?.oEntityType == "Order") ? masterLookupData.ORDER_STATUS : masterLookupData.INTXN_STATUS;
            let colorClass = lookUpData?.find(x => x.description == row.original?.oTaskStatusDesc)?.mapping?.colorClass;
            return (
                <span className={colorClass}>
                    {cell.value}
                </span>
            )
        }
        else if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" onClick={() => redirectToRespectivePages(row.original)} className="action-edit"><i className="material-icons">edit</i></div>
                        {/* <div title="View" onClick={() => handleOpenRightModal(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div> */}
                    </div>
                </>
            )
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{row.original?.oCreatedAt}</span>)
        }
        else if (cell.column.id === "oEstimatedTime") {
            return (<span>{row.original?.oEstimatedTime?.hours ??0} hours {row.original?.oEstimatedTime?.minutes ?? 0} minutes</span>)
        }
        else if (cell.column.id === "oActualtime") {
            return (<span>{row.original?.oActualtime?.hours ??0} hours {row.original?.oActualtime?.minutes ?? 0} minutes</span>)
        }
        else if (cell.column.id === "aging-color") {
            // Aging Color Code Update
            let a = moment(row.original.oCreatedAt), b = moment(new Date()), count = b.diff(a, 'days'), colorcode = '';
            if (selectedEntity === 'Interaction - All') colorcode = 'b';
            count <= 3 ? colorcode = 'g' : count <= 5 ? colorcode = 'y' : colorcode = 'r'
            // if (selectedEntity === 'Interaction - 0 to 3 Days') colorcode = 'g';
            // if (selectedEntity === 'Interaction - 3 to 5 Days') colorcode = 'y';
            // if (selectedEntity === 'More than 5 Days') colorcode = 'r';
            return (<span className={`skel-ag-clr-code code-${colorcode}`}></span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const [selectedEntity, setSelectedEntity] = useState(null);

    const updateSearchParams = (entityType, startDate, endDate, filterDesc) => {
        // console.log({ entityType, startDate, endDate })
        setSearchParams({
            ...searchParams,
            entityType: entityType,
            fromDate: endDate,
            toDate: startDate
        })
    }

    const clearSearchParam = () => {
        setSelectedEntity(null);
        setSearchParams({
            ...searchParams,
            entityType: 'all',
            fromDate: undefined,
            toDate: undefined
        })
    }
    return (
        <>
            <div className="skel-dashboard-title-base">
                <span className="txt-black cursor-pointer skel-targt-info mr-2" onClick={() => clickToScroll?.()}>Pooled Tasks ({allPooledCounts?.task ?? 0 } ) <span class="blink"><i class="fa fa-angle-double-down" aria-hidden="true"></i></span></span> | <span className="skel-header-title mb-0 pl-2">Assigned To {meOrMyTeam} ({totalCount})</span>
            </div>
            <hr className="cmmn-hline" />

            <div className="col-lg-2 col-md-12 col-sm-12">
                {fromComp == "INTERACTION" && appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedToMe?.interactionOverview &&
                    <DashboardOverview
                        data={{
                            assignedAge: assignedInteractionAge,
                            type: 'Interaction'
                        }}
                        handler={{
                            setSelectedEntity,
                            updateSearchParams
                        }}
                    />
                }
                {fromComp == "ORDER" && !!!(statusConstantCode?.businessSetup.includes(appConfig?.businessSetup?.[0])) && appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedToMe?.orderOverview &&
                    <DashboardOverview
                        data={{
                            assignedAge: assignedOrderAge,
                            type: 'Order'
                        }}
                        handler={{
                            setSelectedEntity,
                            updateSearchParams
                        }}
                    />
                }
                {fromComp == "INTERACTION" && appsConfig?.clientConfig?.operational_dashboard?.interactiveView?.assignedToMe?.requestOverview &&
                    <DashboardOverview
                        data={{
                            assignedAge: assignedRequestAge,
                            type: 'Request'
                        }}
                        handler={{
                            setSelectedEntity,
                            updateSearchParams
                        }}
                    />
                }
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12">
                <div className="mywsp-ageing-rht">
                    {selectedEntity && (
                        <Badge pill bg="secondary filter-pills ssss">
                            {selectedEntity} <span onClick={clearSearchParam} className="c-pointer filter-pills-close ml-1">x</span>
                        </Badge>
                    )}
                    <DynamicTable
                        listKey={"Assigned Operations"}
                        row={interactions}
                        rowCount={totalCount}
                        header={columns}
                        fixedHeader={true}
                        columnFilter={false}
                        customClassName={'table-sticky-header'}
                        itemsPerPage={perPage}
                        isScroll={false}
                        backendPaging={true}
                        isTableFirstRender={tableRef}
                        hasExternalSearch={hasExternalSearch}
                        backendCurrentPage={currentPage}
                        url={TaskSearchAPI + `?limit=${perPage}&page=${currentPage}`}
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
                        exportIcon={true}
                    />
                </div>

                <hr className="cmmn-hline" />
                <div className="skel-refresh-info">
                    <span><i className="material-icons" title="Refresh">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
                    <span></span>
                    <div className="skel-data-records">
                        <div className="skel-img-circle">
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                            <span className="skel-data-img">
                                <img src="./assets/images/banner2.jpg" alt="" className="img-fluid" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AssignToMeTask;