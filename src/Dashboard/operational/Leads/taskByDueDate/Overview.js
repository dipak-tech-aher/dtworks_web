import EquiSvg from "../../../../assets/images/ops/equi.svg"
import SuccessCalSvg from "../../../../assets/images/ops/success-cal.svg"
import WarnCalSvg from "../../../../assets/images/ops/warn-cal.svg"
import DangerCalSvg from "../../../../assets/images/ops/danger-cal.svg"
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { properties } from "../../../../properties";
import { post } from "../../../../common/util/restUtil";
import { OpsDashboardContext } from "../../../../AppContext";
import { unstable_batchedUpdates } from "react-dom";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../../common/table/DynamicTable";
import { TasksColumns } from "../Columns"
import moment from 'moment'

const Overview = (props) => {
    const { searchParams: globalSearchParams, auth } = props.data
    const { data, handlers } = useContext(OpsDashboardContext)
    const { meOrMyTeam, lastDataRefreshTime, isPageRefresh } = data
    const [searchParams, setSearchParams] = useState({})
    // const { setLastDataRefreshTime } = handlers;

    const [result, setResult] = useState({})
    const entityType = "Tasks"
    const taskSearchAPI = `${properties.LEAD_API}/${meOrMyTeam === 'Me' ? 'tasks-by-ageing' : 'tasks-by-ageing/team'}`
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [tasks, setTasks] = useState([])
    const [show, setShow] = useState(false)
    const tableRef = useRef(true)
    const [filters, setFilters] = useState([])

    const modalStyle = {
        'width': '94%',
        'top': '19%',
        'left': '3%',
        'paddingLeft': '2px'
    }

    const updateSearchParams = (range, rangeDesc) => {
        setSearchParams({
            ...searchParams,
            ...globalSearchParams,
            type: range
        })
        setShow(true)
    }

    useEffect(() => {
        let reqBody = {
            ...searchParams,
            ...globalSearchParams,
            userId: meOrMyTeam === 'Me' ? auth?.user?.userId ?? null : null,
            mode: 'cnt'
        }
        post(properties.LEAD_API + `/tasks-by-ageing`, { searchParams: reqBody }).then((response) => {
            if (response.status === 200) {
                setResult({ ...response.data[0] })
            } else {
                setResult({ ...{} })
            }
        }).catch((error) => { })
    }, [searchParams, isPageRefresh, globalSearchParams])

    const fetchData = useCallback(async (currentPage, perPage) => {
        let searchParamss = {
            ...searchParams,
            ...globalSearchParams,
            userId: meOrMyTeam === 'Me' ? auth?.user?.userId ?? null : null,
            "limit": perPage,
            "page": currentPage,
            "mode": 'list'
        }
        post(taskSearchAPI, {
            "searchParams": searchParamss,
        }).then((resp) => {
            if (resp.data) {
                unstable_batchedUpdates(() => {
                    let count = resp?.data?.[0]?.oTotalCnt ?? 0;
                    let rows = resp?.data;
                    if (count > 0) {
                        setTotalCount(count);
                        setTasks([...rows]);
                    } else {
                        setTotalCount(0);
                        setTasks([]);
                    }
                    // setLastDataRefreshTime({ ...lastDataRefreshTime, assignedToMe: moment().format('DD-MM-YYYY HH:mm:ss') })
                })
            }
        }).catch((error) => {
            console.log(error)
        }).finally(() => {
        })
    }, [globalSearchParams, meOrMyTeam, searchParams, taskSearchAPI])

    useEffect(() => {
        fetchData(currentPage, perPage);
    }, [meOrMyTeam, searchParams, isPageRefresh, fetchData, currentPage, perPage]);

    const handleClose = () => {
        unstable_batchedUpdates(() => {
            setShow(false)
            setTotalCount(0)
            setTasks([])
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

    return (
        <div className="skel-four-grid-top">
            <span className="skel-header-title">Task By Due Date ({result?.oTotalCnt || 0})</span>
            <div className="skel-dashboard-tiles">
                {/* <span className="skel-header-title">{entityType} Overview</span> */}
                <div className="skel-tile-sect">
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-b-color">
                            <img src={EquiSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>Total {entityType}</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('all', 'Tasks - All')}>{result?.oTotalCnt || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-g-color">
                            <img src={SuccessCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>0 to 3 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('0_to_3', 'Tasks - 0 to 3 Days')}>{result?.o0To3Days || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-y-color">
                            <img src={WarnCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>3 to 5 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('3_to_5', 'Tasks - 3 to 5 Days')}>{result?.o3To5Days || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-r-color">
                            <img src={DangerCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>&gt; 5 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('to_5', 'Tasks - More than 5 Days')}>{result?.oMore5Days || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                <Modal.Header>
                    <b>Task Status Details</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"Task Status Details"}
                        row={tasks}
                        rowCount={tasks?.length}
                        header={TasksColumns}
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

export default Overview