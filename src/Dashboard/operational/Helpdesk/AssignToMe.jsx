import React, { useContext, useEffect, useRef, useState } from 'react'
import DashboardOverview from '../components/InteractionOverview'
import DynamicTable from '../../../common/table/DynamicTable'
import { Badge } from 'react-bootstrap'
import { AppContext, OpsDashboardContext } from '../../../AppContext'
import moment from 'moment'
import { AssignedHelpdeskColumns } from '../Columns'
import { post } from '../../../common/util/restUtil'
import { unstable_batchedUpdates } from 'react-dom'
import { properties } from '../../../properties'
import { useHistory }from '../../../common/util/history'
import { toast } from 'react-toastify'

export default function AssignToMe(props) {
    const { assignedHelpdeskAge, searchParams: globalSearchParams } = props?.data
    const { auth, appConfig } = useContext(AppContext)
    const [isRefresh, setIsRefresh] = useState(false);
    const [allIds, setAllIds] = useState([])
    const { data, handlers } = useContext(OpsDashboardContext);
    const history = useHistory()
    const { meOrMyTeam, viewType, pageRefreshTime, masterLookupData, lastDataRefreshTime, isPageRefresh, appsConfig, allPooledCounts } = data;
    const { setSelectedInteraction, setSelectedOrder, setSelectedEntityType, setLastDataRefreshTime, setSearchParams: setGlobalSearchParams, setAssignedInteractionAge, setAssignedOrderAge, setIsPageRefresh,clickToScroll } = handlers;
    const [exportBtn, setExportBtn] = useState(true);
    const redirectToRespectivePages = (response) => {
        history(`/view-helpdesk`, {
            state: {data: response}
        })
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
        }
    }

    const [HelpdeskList, setHelpdeskList] = useState([])
    const tableRef = useRef(true);
    const hasExternalSearch = useRef(false);
    const [filters, setFilters] = useState([]);
    const [filtering, setFiltering] = useState(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        entityType: 'all',
        departmentId: auth?.currDeptId
    });
    const HelpdeskSearchAPI = `${properties.HELPDESK_API}/get-assigned-to-me-helpdesk-tickets`;

    useEffect(() => {
        // console.log(globalSearchParams, "from assign to me component")
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])
    const fetchData = async (currentPage, perPage) => {
        let searchParamss = {
            ...searchParams,
            "limit": perPage,
            "page": currentPage
        }
        post(HelpdeskSearchAPI, {
            "searchParams": searchParamss,
        }).then((resp) => {
            if (resp.data) {
                unstable_batchedUpdates(() => {
                    let count = resp?.data?.count;
                    let rows = resp?.data?.rows;
                    if (count > 0) {
                        const uniqueRecords = [...new Map(rows.map(item => [item['oHelpdeskNo'], item])).values()];
                        const allIds = uniqueRecords.map(ele => ele?.oNo).filter(Boolean);
                        setTotalCount(count);
                        setHelpdeskList([...uniqueRecords]);
                        setAllIds(allIds);                      
                    } else {
                        setTotalCount(0);
                        setHelpdeskList([]);
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
        else if (cell.column.id === "oIntxnStatusDesc") {
            let lookUpData = (row.original?.oEntityType == "Order") ? masterLookupData.ORDER_STATUS : masterLookupData.INTXN_STATUS;
            let colorClass = lookUpData?.find(x => x.description == row.original?.oIntxnStatusDesc)?.mapping?.colorClass;
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
                        {/* <div title="View" onClick={() => redirectToRespectivePages(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div> */}
                    </div>
                </>
            )
        }
        else if (cell.column.id === "oAging") {
            // return (<span>{row.original?.oSelfassignedAt ? moment(row.original?.oSelfassignedAt).fromNow() : '-'}</span>)
            return (<span>{row?.original.oHelpdeskAge?.days || 0} Days, {row?.original.oHelpdeskAge?.hours || 0} Hours, {row?.original.oHelpdeskAge?.minutes || 0} Mins</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        else if (cell.column.id === "aging-color") {
            // Aging Color Code Update
            if (row.original?.oSelfassignedAt) {
                let a = moment(row.original.oSelfassignedAt), b = moment(new Date()), count = b.diff(a, 'days'), colorcode = '';
                count <= 2 ? colorcode = 'g' : count <= 5 ? colorcode = 'y' : colorcode = 'r';
                if (selectedEntity === 'Interaction - All') colorcode = 'b';
                return (<span className={`skel-ag-clr-code code-${colorcode}`}></span>)
            } else {
                return (<span ></span>)
            }

        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const [selectedEntity, setSelectedEntity] = useState(null);

    const updateSearchParams = (entityType, startDate, endDate, filterDesc) => {
        if (filterDesc === '0 to 2 Days') {
            entityType = '0_to_2'
        } else if (filterDesc === '3 to 5 Days') {
            entityType = '0_to_2'

        } else if (filterDesc === 'More than 5 Days') {
            entityType = 'more_than_5'
        } else {
            entityType = 'all'
        }
        // console.log({ entityType, startDate, endDate })
        setSearchParams({
            ...searchParams,
            entityType: entityType,
            // fromDate: endDate,
            // toDate: startDate
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
    const HelpdeskOverview = appsConfig?.clientConfig?.operational_dashboard?.helpDesk?.interactiveView?.assignedToMe?.HelpdeskOverview;
   
    return (
        <>
            <div className="skel-dashboard-title-base">
                 <span className="txt-black cursor-pointer skel-targt-info mr-2" onClick={() => clickToScroll?.()}>Pooled Helpdesk ({allPooledCounts?.helpdesk ?? 0}) <span class="blink"><i class="fa fa-angle-double-down" aria-hidden="true"></i></span></span> | <span className="skel-header-title mb-0 pl-2">Assigned To {meOrMyTeam} ({totalCount})</span>
            </div>
            <hr className="cmmn-hline" />
            {HelpdeskOverview && <div className="col-lg-2 col-md-12 col-sm-12">

                <DashboardOverview
                    data={
                        {
                            assignedAge: assignedHelpdeskAge,
                            type: 'Helpdesk',
                            agingShow0to2: true
                        }
                    }
                    handler={
                        {
                            setSelectedEntity,
                            updateSearchParams
                        }
                    }
                />
            </div>}
            <div className={HelpdeskOverview ? "col-lg-10 col-md-12 col-sm-12" : "col-lg-10 col-md-12 col-sm-12"}>
                <div className="mywsp-ageing-rht">

                    {/* <div className="skel-dashboard-data" > */}
                    {selectedEntity && (
                        <Badge pill bg="secondary filter-pills dai">
                            {selectedEntity} <span onClick={clearSearchParam} className="c-pointer filter-pills-close ml-1">x</span>
                        </Badge>
                    )}
                    <DynamicTable
                        listKey={"Assigned Helpdesk"}
                        row={HelpdeskList}
                        rowCount={totalCount}
                        header={AssignedHelpdeskColumns}
                        fixedHeader={true}
                        columnFilter={false}
                        customClassName={'table-sticky-header'}
                        itemsPerPage={perPage}
                        isScroll={false}
                        backendPaging={true}
                        isTableFirstRender={tableRef}
                        hasExternalSearch={hasExternalSearch}
                        backendCurrentPage={currentPage}
                        url={HelpdeskSearchAPI}
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
