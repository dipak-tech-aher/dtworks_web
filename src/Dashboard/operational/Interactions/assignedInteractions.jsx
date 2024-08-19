import React, { useEffect, useContext, useState, useRef } from "react";
import { properties } from "../../../properties";
import { slowPost, put } from "../../../common/util/restUtil";
import { AppContext, OpsDashboardContext } from '../../../AppContext';
import { useHistory }from '../../../common/util/history';
import { unstable_batchedUpdates } from 'react-dom';
import FilterComponent from "../../components/FilterComponent";
import moment from 'moment';
import { Dropdown } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { AssignedInteractionsColumns, PooledInteractionsColumns } from "../Columns";
import ColumnFilterComponent from "../../components/ColumnFilterComponent";
import { toast } from 'react-toastify'
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css'
import AssignedIcon from '../../../assets/images/assigned-icon.svg';
import pooledIcon from '../../../assets/images/pooled-icon.svg';

const AssignInteractions = (props) => {
    const history = useHistory()
    const { isFullScreen, searchParams: globalSearchParams } = props?.data
    const { setIsFullScreen, setScreenType } = props?.handlers
    const type = props.data?.type
    const { auth } = useContext(AppContext)
    const [allIds, setAllIds] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);

    const { data, handlers } = useContext(OpsDashboardContext);
    const { meOrMyTeam, pageRefreshTime, masterLookupData, lastDataRefreshTime, currentTime, isPageRefresh, allPooledCounts } = data;
    const { setSelectedInteraction, setSelectedEntityType, setLastDataRefreshTime, setCurrentTime, setIsPageRefresh, setAllPooledCounts } = handlers;
    const [assignedInteractions, setAssignedInteractions] = useState([])
    const [pooledInteractions, setPooledInteractions] = useState([])
    const tableRef = useRef(true);
    const hasExternalSearch = useRef(false);
    const [filtering, setFiltering] = useState(false);
    const [filters, setFilters] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [listSearch, setListSearch] = useState([]);
    const [totalAssignedCount, setTotalAssignedCount] = useState(0);
    const [loading, setLoading] = useState(false)
    const Loader = props.loader
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        roleId: auth?.currRoleId,
        departmentId: auth?.currDeptId
    });

    const redirectToRespectivePages = (response) => {
        // console.log('response-------->', response)
        /************************Srini commented to ensure the view/edit is going to new tab starts*************/
        // const data = {
        //     intxnNo: response?.oIntxnNo,
        //     customerUid: response?.oCustomerUuid,
        //     sourceName: 'customer360'
        // }

        // history(`/interaction360`, { state: {data} })
        /************************Srini commented to ensure the view/edit is going to new tab ends*************/
        const data = { 
            data: response
         }
        if (response?.oCustomerUuid) {
            localStorage.setItem("customerUuid", response.oCustomerUuid)
        }

        localStorage.setItem('viewInteractionData', JSON.stringify(data));
 
        window.open(`${properties.REACT_APP_BASE}/interaction360`, "_blank")

    }

    const handleOpenRightModal = (ele) => {
        setSelectedInteraction([ele]);
        setSelectedEntityType('Interaction')
    }

    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.assignedInteraction : lastDataRefreshTime?.assignedToTeamInteraction, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);



    const handleFullScreen = () => {
        setScreenType(type);
        setIsFullScreen(!isFullScreen);
    }

    const intxnSearchAPI = `${properties.INTERACTION_API}/${meOrMyTeam === 'Me' ? 'get-assigned-interactions' : 'get-team-assigned-interactions'}`;
    const pooledIntxnSearchAPI = `${properties.INTERACTION_API}/${meOrMyTeam === 'Me' ? 'get-pooled-interactions' : 'get-team-pooled-interactions'}`;

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
            slowPost(intxnSearchAPI, {
                "searchParams": searchParamss,
            }).then((resp) => {
                if (resp.data) {
                    unstable_batchedUpdates(() => {
                        let count = resp?.data?.count;
                        let rows = resp?.data?.rows;
                        if (count) {
                            const uniqueRecords = [...new Map(rows.map(item => [item['oIntxnNo'], item])).values()];
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

            slowPost(pooledIntxnSearchAPI, {
                "searchParams": searchParamss,
            }).then((resp) => {
                if (resp.data) {
                    unstable_batchedUpdates(() => {
                        let count = resp?.data?.count;
                        let rows = resp?.data?.rows;
                        if (count) {
                            const uniqueRecords = [...new Map(rows.map(item => [item['oIntxnNo'], item])).values()];
                            const allIds = uniqueRecords.map(ele => ele?.oIntxnNo).filter(Boolean);
                            setAllPooledCounts?.({ ...allPooledCounts, interaction: count })
                            setPooledInteractions([...uniqueRecords]);
                            setAllIds(allIds);                           
                        } else {
                            setAllPooledCounts?.({ ...allPooledCounts, interaction: count })
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
        } catch (error) {
            // console.log(error)
        }
        // } finally {
        //     setLoading(false)
        // }
    };

    Array.prototype.insert = function (index, ...items) {
        this.splice(index, 0, ...items);
    };

    const [columns, setColumns] = useState(type === 'POOLED' ? PooledInteractionsColumns : AssignedInteractionsColumns);

    // Srini commented and brought pooled columns instead of doing this filter INT00001671
    // useEffect(() => {
    //     /**  Bug ID - IS_ID_166, IS_ID_167  - Added type in "if" condition */
    //     if (meOrMyTeam !== "MyTeam" && type !== 'ASSIGNED') {
    //         let filteredColumns = AssignedInteractionsColumns.filter(x => x.id !== 'oCurrUserDesc')
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

    const assignToSelf = (data) => {
        // // console.log('data ', data)
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="alert">
                        <fieldset className="scheduler-border1">
                            <h4 className="alert__title">Would you like to assign the interaction ?</h4>
                            <div className="d-flex justify-content-center">

                                <button onClick={onClose} type="button" className="skel-btn-cancel">Cancel</button>
                                <button onClick={
                                    () => {
                                        if (data) {
                                            put(`${properties.INTERACTION_API}/assignSelf/${data.oIntxnNo}`, {
                                                type: 'SELF'
                                            }).then((res) => {
                                                if (res.status === 200) {
                                                    toast.success("Interaction assigned to self")
                                                    setIsRefresh(!isRefresh)
                                                    setIsPageRefresh(!isPageRefresh)
                                                }
                                            }).catch((error) => {
                                                // console.log(error)
                                            })
                                        }
                                        onClose();
                                    }
                                } type="button" className="skel-btn-submit" >Yes</button>
                            </div>
                        </fieldset>
                    </div>
                );
            }
        });

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
                // <Dropdown className="assigned-ops-menu skel-filter-dropdown">
                //     <Dropdown.Toggle variant="success" id="dropdown-basic">
                //         <i className="material-icons">more_horiz</i>
                //     </Dropdown.Toggle>
                //     <Dropdown.Menu>
                //         <Dropdown.Item onClick={() => redirectToRespectivePages(row.original)}><i className="material-icons">edit</i> Edit</Dropdown.Item>
                //         <Dropdown.Item onClick={() => handleOpenRightModal(row.original)}><a data-toggle="modal" data-target="#view-right-modal"><i className="material-icons">visibility</i> View</a></Dropdown.Item>
                //     </Dropdown.Menu>
                // </Dropdown>
                <div className="skel-action-btn">
                    {/* {row?.original?.oCurrUser === auth?.user?.userId && <div title="Assign to Self" onClick={() => assignToSelf(row.original)} className="action-edit"><i className="material-icons">trending_flat</i></div>} */}
                    {!row?.original?.oCurrUser && <div title="Assign to Self" onClick={() => assignToSelf(row.original)} className="action-edit"><i className="material-icons">trending_flat</i></div>}
                    <div title="Edit" onClick={() => redirectToRespectivePages(row.original)} className="action-edit"><i className="material-icons">edit</i></div>
                    <div title="View" onClick={() => handleOpenRightModal(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                </div>
            )
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).fromNow()}</span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
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
                                
                                {type === 'POOLED' ? 'Pooled' : 'Assigned'} Interactions ({type === 'POOLED' ? allPooledCounts?.interaction ?? 0 : totalAssignedCount})</span>
                            <div className="skel-dashboards-icons skel-max-sect">
                                <a>
                                    <i title="Full Screen" className="material-icons" onClick={() => handleFullScreen()}>
                                        {isFullScreen ? 'fullscreen_exit' : 'fullscreen'}
                                    </i>
                                </a>
                                <a ><i title="Refresh" className="material-icons" onClick={() => { setIsRefresh(!isRefresh); setLoading(true) }}>refresh</i></a>
                                <FilterComponent
                                    data={{
                                        filtering,
                                        componentName: 'INTERACTIONS',
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
                            sourceColumns: type === 'POOLED' ? PooledInteractionsColumns : AssignedInteractionsColumns
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
                                rowCount={type === 'POOLED' ? allPooledCounts?.interaction ?? 0 : totalAssignedCount}
                                header={columns}
                                fixedHeader={true}
                                columnFilter={true}
                                customClassName={'table-sticky-header'}
                                itemsPerPage={perPage}
                                isScroll={false}
                                backendPaging={true}
                                isTableFirstRender={tableRef}
                                hasExternalSearch={hasExternalSearch}
                                backendCurrentPage={currentPage}
                                url={intxnSearchAPI + `?limit=${perPage}&page=${currentPage}`}
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
                    </div>
                )
        }</>

    )
}

export default AssignInteractions;


