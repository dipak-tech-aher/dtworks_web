import React, { useEffect, useContext, useState, useRef } from "react";
import { properties } from "../../../properties";
import { slowPost, put, post } from "../../../common/util/restUtil";
import { AppContext, OpsDashboardContext } from '../../../AppContext';
import { useHistory } from '../../../common/util/history';
import { unstable_batchedUpdates } from 'react-dom';
import FilterComponent from "../../components/FilterComponent";
import moment from 'moment';
import DynamicTable from "../../../common/table/DynamicTable";
import { AssignedHelpdesksColumns, PooledHelpdesksColumns } from "../Columns";
import { toast } from 'react-toastify'
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'
import AssignedIcon from '../../../assets/images/assigned-icon.svg';
import pooledIcon from '../../../assets/images/pooled-icon.svg';
import EditHelpdeskModal from "../../../HelpdeskAndInteraction/Helpdesk/EditHelpdeskModal";
import { statusConstantCode } from "../../../AppConstants";

const AssignHelpdesks = (props) => {
    const { isFullScreen, searchParams: globalSearchParams } = props?.data
    const { setIsFullScreen, setScreenType } = props?.handlers;
    const history = useHistory()
    const type = props.data?.type
    const { auth, appConfig } = useContext(AppContext)
    const [allIds, setAllIds] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);
    const dtWorksProductType = appConfig?.businessSetup?.[0]
    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, pageRefreshTime, masterLookupData, lastDataRefreshTime, currentTime, isPageRefresh, allPooledCounts } = data;
    // console.log('data', data)
    const { setSelectedInteraction, setSelectedEntityType, setLastDataRefreshTime, setCurrentTime, setIsPageRefresh, setAllPooledCounts } = handlers;
    const [assignedInteractions, setAssignedInteractions] = useState([])
    const [pooledInteractions, setPooledInteractions] = useState([])
    const tableRef = useRef(true);
    const hasExternalSearch = useRef(false);
    const [mode, setMode] = useState();
    const [filtering, setFiltering] = useState(false);
    const [filters, setFilters] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [listSearch, setListSearch] = useState([]);
    const [totalAssignedCount, setTotalAssignedCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const Loader = props.loader
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });

    // Assign Helpdesk Fn State and Popup Values
    const helpdeskStatus = masterLookupData?.HELPDESK_STATUS;
    const severities = masterLookupData?.SEVERITY?.map(elm => ({ description: elm.description, code: elm.code }));
    const helpdeskTypes = masterLookupData?.HELPDESK_TYPE?.map(elm => ({ description: elm?.description, code: elm?.code }));
    const [detailedViewItem, setdetailedViewItem] = useState({});
    const [projectTypes, setProjectTypes] = useState([])
    const [projectLookup, setProjectLookup] = useState([]);
    // Assign Helpdesk Fn State and Popup Values End
    const redirectToRespectivePages = (response) => {
        // history(`/view-helpdesk`, {
        //     state: {data: response}
        // })
        const data = {
            data: response
        }
        localStorage.setItem('viewHelpdeskData', JSON.stringify(data));

        window.open(`${properties.REACT_APP_BASE}/view-helpdesk`, "_blank")

    }
    const [isModelOpen, setIsModelOpen] = useState({
        isEditOpen: false
    })

    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.assignedInteraction : lastDataRefreshTime?.assignedToTeamInteraction, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);


    const handleFullScreen = () => {
        setScreenType(type);
        setIsFullScreen(!isFullScreen);
    }

    const HelpdeskAssignedSearchAPI = `${properties.HELPDESK_API}/${meOrMyTeam === 'Me' ? 'get-assigned-helpdesk' : 'get-team-assigned-helpdesk'}`;
    const pooledHelpdeskSearchAPI = `${properties.HELPDESK_API}/${meOrMyTeam === 'Me' ? 'get-pooled-helpdesk' : 'get-team-pooled-helpdesks'}`;

    useEffect(() => {
        // // console.log(globalSearchParams, "from assign to me component")
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
        try {
           // setLoading(true)
            if (type === 'ASSIGNED') {
                slowPost(HelpdeskAssignedSearchAPI, {
                    "searchParams": searchParamss,
                }).then((resp) => {
                    if (resp.data) {
                        unstable_batchedUpdates(() => {
                            let count = resp?.data?.count;
                            let rows = resp?.data?.rows;
                            if (count) {
                                const uniqueRecords = [...new Map(rows.map(item => [item['oHelpdeskNo'], item])).values()];
                                const allIds = uniqueRecords.map(ele => ele?.oIntxnNo).filter(Boolean);
                                setTotalAssignedCount(count)
                                setAssignedInteractions([...uniqueRecords]);
                                setAllIds(allIds);
                            } else {
                                setTotalAssignedCount(0)
                                setAssignedInteractions([])
                                setAllIds([])
                            }
                            setCurrentTime(moment().format('DD-MM-YYYY HH:mm:ss'))
                            if (meOrMyTeam === 'Me') {
                                setLastDataRefreshTime({ ...lastDataRefreshTime, assignedInteraction: moment().format('DD-MM-YYYY HH:mm:ss') })
                            } else {
                                setLastDataRefreshTime({ ...lastDataRefreshTime, assignedToTeamInteraction: moment().format('DD-MM-YYYY HH:mm:ss') })
                            }
                        })
                    }
                }).catch((error) => {
                    // console.log(error)
                }).finally(() => {
                    unstable_batchedUpdates(()=>{
                        setFiltering(false);
                        setLoading(false)
                    })
                })
            }
            if (type === 'POOLED') {
                slowPost(pooledHelpdeskSearchAPI, {
                    "searchParams": searchParamss,
                }).then((resp) => {
                    if (resp.data) {
                        unstable_batchedUpdates(() => {
                            let count = resp?.data?.count;
                            let rows = resp?.data?.rows;
                            if (count) {
                                const uniqueRecords = [...new Map(rows.map(item => [item['oHelpdeskNo'], item])).values()];
                                const allIds = uniqueRecords.map(ele => ele?.oIntxnNo).filter(Boolean);
                                setAllPooledCounts?.({ ...allPooledCounts, helpdesk: count })
                                setPooledInteractions([...uniqueRecords]);
                                setAllIds(allIds);
                            } else {
                                setAllPooledCounts?.({ ...allPooledCounts, helpdesk: 0 })
                                setPooledInteractions([])
                                setAllIds([])
                            }
                            setCurrentTime(moment().format('DD-MM-YYYY HH:mm:ss'))
                            if (meOrMyTeam === 'Me') {
                                setLastDataRefreshTime({ ...lastDataRefreshTime, assignedInteraction: moment().format('DD-MM-YYYY HH:mm:ss') })
                            } else {
                                setLastDataRefreshTime({ ...lastDataRefreshTime, assignedToTeamInteraction: moment().format('DD-MM-YYYY HH:mm:ss') })
                            }
                        })
                    }
                }).catch((error) => {
                    // console.log(error)
                }).finally(() => {
                    unstable_batchedUpdates(()=>{
                        setFiltering(false);
                        setLoading(false)
                    })
                  
                })
            }
        } catch (error) {
            // console.log(error)

        }
        // finally {
        //     setLoading(false)
        // }
    };

    Array.prototype.insert = function (index, ...items) {
        this.splice(index, 0, ...items);
    };

    const [columns, setColumns] = useState(type === 'POOLED' ? PooledHelpdesksColumns : AssignedHelpdesksColumns);

    // Srini commented and brought pooled columns instead of doing this filter INT00001671
    // useEffect(() => {
    //     /**  Bug ID - IS_ID_166, IS_ID_167  - Added type in "if" condition */
    //     if (meOrMyTeam !== "MyTeam" && type !== 'ASSIGNED') {
    //         let filteredColumns = AssignedHelpdesksColumns.filter(x => x.id !== 'oCurrUser')
    //         setColumns([...filteredColumns]);
    //     }
    // }, [meOrMyTeam]);

    useEffect(() => {
        fetchData(currentPage, perPage);
    }, [currentPage, perPage, isRefresh, meOrMyTeam, searchParams, isPageRefresh]);

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

    const assignToSelf = (rowData) => {
        try {
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className="alert">
                            <fieldset className="modal-cust-sm mt-3 mb-3">
                                <span className="skel-heading alert__title mb-2">Would you like to assign the helpdesk ?</span>
                                <div className="d-flex justify-content-center">

                                    <button onClick={onClose} type="button" className="skel-btn-cancel">Cancel</button>
                                    <button onClick={
                                        () => {
                                            onClose();
                                            let requestBody = {
                                                helpdeskNo: rowData.oHelpdeskNo,
                                                contain: ['CUSTOMER'],
                                            }
                                            post(`${properties.HELPDESK_API}/search?limit=1&page=0`, requestBody).then((response) => {
                                                const { status, data } = response;
                                                if (status === 200 && data && !!Object.keys(data).length) {
                                                    let helpdeskData = data?.rows?.[0];
                                                    let projects = []
                                                    if (dtWorksProductType !== statusConstantCode.type.HELPDESK_SERVICE) {
                                                        projects = masterLookupData?.PROJECT.filter((f) => f?.mapping && f?.mapping?.hasOwnProperty('department') && f?.mapping?.department?.includes(auth?.currDeptId))
                                                    } else {
                                                        masterLookupData?.PROJECT?.forEach(element => {
                                                            helpdeskData?.customerDetails?.projectMapping?.forEach((ele) => {
                                                                if (element?.mapping && element?.mapping?.hasOwnProperty('department') && element?.mapping?.department?.includes(auth?.currDeptId) && element?.mapping?.department?.includes(ele?.entity) && ele?.project?.includes(element?.code)) {
                                                                    projects.push(element)
                                                                }
                                                            })
                                                        })
                                                    }
                                                    unstable_batchedUpdates(() => {
                                                        setdetailedViewItem(data?.rows?.[0] ?? {})
                                                        setIsModelOpen({ isEditOpen: true });
                                                        setProjectLookup(projects ?? []);
                                                        setProjectTypes(projects)
                                                    });
                                                }
                                            }).catch((error) => {
                                                console.error(error);

                                            })

                                        }
                                    } type="button" className="skel-btn-submit" >Yes</button>
                                </div>
                            </fieldset>
                        </div>
                    );
                }
            });
        } catch (e) {
            console.log('error', e)
        }

    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oIntxnSeverityDesc") {
            let colorClass = masterLookupData.INTXN_STATUS?.find(x => x.description == row.original?.oIntxnSeverityDesc)?.mapping?.colorClass;
            return (
                <span className={colorClass}>
                    {cell.value}
                </span>
            )
        }
        else if (cell.column.id === "oIntxnStatusDesc") {
            let colorClass = masterLookupData.INTXN_STATUS?.find(x => x.description == row.original?.oIntxnStatusDesc)?.mapping?.colorClass;
            return (
                <span className={colorClass}>
                    {row.original?.oIntxnStatusDesc}
                </span>
            )
        }
        else if (cell.column.id === "oIntxnNo-Action") {
            return (

                <div className="skel-action-btn">
                    {!row?.original?.oCurrUser && <div title="Assign to Self" onClick={() => assignToSelf(row.original)} className="action-edit"><i className="material-icons">trending_flat</i></div>}
                    <a title="Edit"
                        onClick={() => redirectToRespectivePages(row.original)}
                        // href={`/view-helpdesk`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="action-edit">
                        <i className="material-icons">visibility</i></a>
                    {/* <div title="View" onClick={() => redirectToRespectivePages(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div> */}
                </div>
            )
        }
        else if (cell.column.id === "oAging") {
            // return (<span>{moment(row.original?.oSelfassignedAt ? moment(row.original?.oSelfassignedAt).fromNow() : '-').fromNow()}</span>)
            return (<span>{row?.original.oHelpdeskAge?.days || 0} Days, {row?.original.oHelpdeskAge?.hours || 0} Hours, {row?.original.oHelpdeskAge?.minutes || 0} Mins</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const assignHelpdesk = (helpdeskId) => {
        return new Promise((resolve, reject) => {
            put(`${properties.HELPDESK_API}/assign/${helpdeskId}`, { status: statusConstantCode.status.HELPDESK_ASSIGN })
                .then((response) => {
                    const { status, message } = response;
                    if (status === 200) {
                        toast.success(message);
                        resolve(true);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(false);
                })
                .finally()
        })
    }
    const doSoftRefresh = () => {
        fetchData(currentPage, perPage);
        setIsPageRefresh(!isPageRefresh)
    }
 
    return (
        <>{
            loading ?
                <Loader /> :
                (
                    <div className="cmmn-skeleton">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title">
                                <img
                                    src={type === 'POOLED' ? pooledIcon : AssignedIcon}
                                    className="pr-2"
                                />

                                {type === 'POOLED' ? 'Pooled' : 'Assigned'} Helpdesk ({type === 'POOLED' ? allPooledCounts?.helpdesk ?? 0 : totalAssignedCount})</span>
                            <div className="skel-dashboards-icons skel-max-sect">
                                <a>
                                    <i title="Full Screen" className="material-icons" onClick={() => handleFullScreen()}>
                                        {isFullScreen ? 'fullscreen_exit' : 'fullscreen'}
                                    </i>
                                </a>
                                <a ><i title="Refresh" className="material-icons" onClick={() => {setIsRefresh(!isRefresh); setLoading(true)}}>refresh</i></a>
                                <FilterComponent
                                    data={{
                                        filtering,
                                        componentName: 'HELPDESK',
                                        hideStatus: type === 'POOLED' ? true : false
                                    }}
                                    handlers={{
                                        setSearchParams,
                                        setFiltering
                                    }}
                                />
                                {/* <ColumnFilterComponent
                        data={{
                            type: type,
                            sourceColumns: type === 'POOLED' ? PooledInteractionsColumns : AssignedHelpdesksColumns
                        }}
                        handlers={{
                            setColumns
                        }}
                    /> */}
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        {/* <div className="skel-dashboard-data"> */}
                        <div className="">
                            <DynamicTable
                                listSearch={listSearch}
                                listKey={"Assigned Interactions"}
                                row={type === 'POOLED' ? pooledInteractions : assignedInteractions}
                                rowCount={type === 'POOLED' ? allPooledCounts?.helpdesk ?? 0 : totalAssignedCount}
                                header={columns.filter((val) => val.id !== 'oAging')}
                                fixedHeader={true}
                                columnFilter={true}
                                customClassName={'table-sticky-header'}
                                itemsPerPage={perPage}
                                isScroll={false}
                                backendPaging={true}
                                isTableFirstRender={tableRef}
                                hasExternalSearch={hasExternalSearch}
                                backendCurrentPage={currentPage}
                                url={HelpdeskAssignedSearchAPI + `?limit=${perPage}&page=${currentPage}`}
                                method='POST'
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handlePageSelect: handlePageSelect,
                                    handleItemPerPage: setPerPage,
                                    handleCurrentPage: setCurrentPage,
                                    handleFilters: setFilters
                                }}
                            />
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-refresh-info">
                            <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
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
                        {
                            isModelOpen.isEditOpen &&
                            <EditHelpdeskModal
                                data={{
                                    isModelOpen,
                                    detailedViewItem,
                                    projectTypes,
                                    helpdeskStatus,
                                    helpdeskTypes,
                                    severities,
                                    // cancelReasonLookup,
                                    projectLookup,
                                    helpdeskID: detailedViewItem?.helpdeskId,
                                    source: 'Assign',
                                    shortInfo:true 
                                }}
                                handlers={{
                                    doSoftRefresh,
                                    setProjectLookup,
                                    setProjectTypes,
                                    setIsModelOpen,
                                    assignHelpdesk,
                                    // getCustomerDetails
                                }}
                            />
                        }
                    </div>
                )
        }
        </>

    )
}

export default AssignHelpdesks;


