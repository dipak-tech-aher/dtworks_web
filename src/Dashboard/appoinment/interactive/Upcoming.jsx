import React, { useEffect, useRef, useState, useContext } from "react";
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from "../../../properties";
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment';
import { post } from "../../../common/util/restUtil";
import { UpcomingColumns } from "./Columns/columns";
import ReAssignModal from "./ReAssignModal";
import Filter from "../informative/Filter";
import InteractionsRightModal from "../rightModals/InteractionsRightModal";
import { AppContext } from '../../../AppContext';

const Upcoming = (props) => {
    const { appConfig } = useContext(AppContext);
    const { selectedEntityType, selectedInteraction, selectedCustomer, isUpcomingRefresh, statusReason, searchParams, isOpen } = props.data
    const { setSelectedInteraction, setSelectedOrder, setSelectedEntityType, setSelectedCustomer, setIsUpcomingRefresh } = props.handlers
    const [totalCount, setTotalCount] = useState(0)
    const [appoinments, setAppoinments] = useState([])
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [isPopOpen, setIsPopOpen] = useState(false);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [filterParams, setFilterParams] = useState()
    const [filters, setFilters] = useState([]);

    const filtration = (e) => {
        setFilterParams({ tran_category_type: e?.target?.value })
    }

    useEffect(() => {
        fetchData();
    }, [currentPage, perPage, isUpcomingRefresh, searchParams, filterParams]);

    const fetchData = () => {
        post(properties.APPOINTMENT_API + `/get-upcoming-appoinments?page=${currentPage}&limit=${perPage}&valueParam=AS_SCHED`, { date: new Date(), searchParams, filterParams }).then((resp) => {
            if (resp) {
                unstable_batchedUpdates(() => {
                    setTotalCount(resp?.data?.count || 0);
                    setAppoinments(resp?.data?.rows || []);
                })
            }
        }).catch((error) => {
            console.log(error)
        })
    };

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "CustomerName") {
            return (<span>{row.original?.first_name + ' ' + row.original?.last_name}</span>)
        }
        if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.created_at).format('DD MMM YYYY')}</span>)
        }
        if (cell.column.id === "appointmentDate") {
            return (<span>{moment(row.original?.appoint_date).format('DD MMM YYYY')}</span>)
        }
        if (cell.column.id === "appointStartTime") {
            return (<p className="skel-time"><i className="material-icons">schedule</i> {row.original?.appoint_start_time + ' - ' + row.original?.appoint_end_time}</p>
            )
        }
        if (cell.column.id === "appointModeValue") {
            return ((row.original?.appoint_mode === 'AUDIO_CONF') ? <a target="_blank" href={row.original?.appoint_mode_value}><button className="skel-btn-submit btn-mic"><i
                className="material-icons ml-0">videocam</i>Join</button></a>
                : (row.original?.appoint_mode === 'VIDEO_CONF') ? <a target="_blank" href={row.original?.appoint_mode_value}><button className="skel-btn-submit  btn-video "><i
                    className="material-icons ml-0">videocam</i>Join</button></a>
                    : <span>{row.original?.status_description}</span>
            )
        } else if (cell.column.id === "Action") {
            return (
                <div className="d-flex">
                   {appConfig && appConfig.clientConfig?.appointments?.enabled ? <button className="skel-btn-submit" onClick={() => handlePopUpModal(row.original)}>ReAssign</button> : null}
                    <button className="skel-btn-submit" onClick={() => handleOpenRightModal(row.original)}>View</button>
                </div>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handleOpenRightModal = (ele) => {
        if (ele?.tran_category_type === 'INTERACTION') {
            setSelectedInteraction([ele]);
            setSelectedEntityType('Interaction')
        } else {
            setSelectedOrder([ele]);
            setSelectedEntityType('Order')
        }
    }

    const handlePopUpModal = (ele) => {
        setIsPopOpen(true);
        setSelectedCustomer(ele)
    }

    const [entityType, setEntityType] = useState()

    return (

        <div className="cmmn-skeleton mt-2">
            {!isOpen && <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Upcoming Appointments ({totalCount})</span>
                <div className="skel-dashboards-icons">
                    <a><i className="material-icons" onClick={() => setIsUpcomingRefresh(!isUpcomingRefresh)}>refresh</i></a> &nbsp;&nbsp;&nbsp;&nbsp;
                    <Filter
                        data={{ entityType }}
                        handlers={{
                            filtration,
                            setEntityType
                        }}
                    />
                </div>
            </div>}
            <hr className="cmmn-hline" />
            <div className="">
                <DynamicTable
                    listSearch={[]}
                    listKey={"Upcoming appoinments"}
                    row={appoinments}
                    rowCount={totalCount}
                    header={UpcomingColumns?.map(x => {
                        if (appConfig && appConfig.clientFacingName && appConfig.clientFacingName['Customer'.toLowerCase()]) {
                            x.Header = x.Header?.replace('Customer', appConfig?.clientFacingName['Customer'.toLowerCase()] || 'Customer');
                        }
                        return x;
                    })}
                    fixedHeader={false}
                    itemsPerPage={perPage}
                    isScroll={true}
                    backendPaging={true}
                    isTableFirstRender={isTableFirstRender}
                    hasExternalSearch={hasExternalSearch}
                    backendCurrentPage={currentPage}
                    url={properties.APPOINTMENT_API + `/upcoming-appoinments?page=${currentPage}&limit=${perPage}`}
                    method='POST'
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleFilters: setFilters,
                        handleCurrentPage: setCurrentPage
                    }}
                />
            </div>
            {/* <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i className="material-icons">refresh</i> Updated 5 mins ago</span>
                <div className="skel-data-records">
                    <span>Total {totalCount} records</span>
                </div>
            </div> */}
            <ReAssignModal
                data={{
                    selectedCustomer,
                    isOpen: isPopOpen,
                    isUpcomingRefresh,
                    statusReason
                }}
                handlers={{
                    setIsOpen: setIsPopOpen,
                    setIsUpcomingRefresh
                }}
            />
        </div>

    )
}

export default Upcoming;


