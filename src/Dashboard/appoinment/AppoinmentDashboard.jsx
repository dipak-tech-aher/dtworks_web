import React, { useEffect, useState, useRef } from "react";
import InteractionsRightModal from "./rightModals/InteractionsRightModal";
import OrdersRightModal from "./rightModals/OrdersRightModal";
import ReScheduleModal from "./rightModals/RescheduleModal";
import InformativeDashboard from "./informative/InformativeDashboard";
import InteractiveDashboard from "./interactive/InteractiveDashboard";
import Counts from "./interactive/Counts";
import CreateAppointment from "./create/CreateAppointment";
import { properties } from "../../properties";
import { get } from "../../common/util/restUtil";
import CustomModal from "./rightModals/CustomModal";
import { Controller, useForm } from "react-hook-form";
// import ReactSelect from "react-select";
// import { DateRangePicker } from 'rsuite';
// import moment from "moment";
import CreateAppointmentForm from "./create/CreateAppointmentForm";
import Modal from 'react-modal';
import { RegularModalCustomStyles } from "../../common/util/util";
import PopupListModal from "../../common/components/PopupListModal";
import FilterBtn from "../../assets/images/filter-btn.svg";
import Filter from "./filter";
const AppoinmentDashboard = (props) => {
    const [apptDate, setApptDate] = useState();
    const [statuses, setStatuses] = useState([])
    const [statusReason, setStatusReason] = useState([])
    const [selectedInteraction, setSelectedInteraction] = useState([])
    const [appointmentList, setAppointmentList] = useState([])
    const [appointmentListCount, setAppointmentListCount] = useState(0)
    const [appointmentListPerPage, setAppointmentListPerPage] = useState(10)
    const [appointmentListCurrentPage, setAppointmentListCurrentPage] = useState(0)

    const [selectedEntityType, setSelectedEntityType] = useState('')
    const [selectedOrder, setSelectedOrder] = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState([]);
    const [isReScheduleOpen, setIsReScheduleOpen] = useState(false);
    const [isReScheduleOpenData, setIsReScheduleOpenData] = useState();
    const [interactionData, setInteractionData] = useState([]);
    const [isUpcomingRefresh, setIsUpcomingRefresh] = useState(false);
    const [isCalenderRefresh, setIsCalenderRefresh] = useState(false);
    const [isInformative, setIsInformative] = useState(false);
    const [isInteractive, setIsInteractive] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isCreateApptFormOpen, setIsCreateApptFormOpen] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [cancelCount, setCancelCount] = useState(0)
    const [completedCount, setCompletedCount] = useState(0)
    const [upcomming, setUpcomming] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [successFullCount, setSuccessFullCount] = useState(0)
    const [unSuccessFullCount, setUnSuccessFullCount] = useState(0)
    const [successCount, setSuccessCount] = useState({
        sales: 0,
        problem: 0,
        fullfillment: 0
    })
    const [unSuccessCount, setUnSuccessCount] = useState({
        sales: 0,
        problem: 0,
        fullfillment: 0
    })
    const [completedCounts, setCompletedCounts] = useState({
        sales: 0,
        problem: 0,
        fullfillment: 0
    });

    const [selectedStatus, setSelectedStatus] = useState({});
    const [searchParams, setSearchParams] = useState({});
    // const [submitError, setSubmitError] = useState(null);
    const [chatWidth, setChatWidth] = useState(undefined);
    // const [sidebarTop, setSidebarTop] = useState(undefined);
    const [isAppointmentPopupOpen, setIsAppointmentPopupOpen] = useState(false)


    const handleOpenView = (viewType) => {
        if (viewType === "Interactive") {
            setIsInteractive(true)
            setIsInformative(false)
        }
        if (viewType === "Informative") {
            setIsInteractive(false)
            setIsInformative(true)
        }
        if (viewType === 'CreateSchedule') {

        }
    }

    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(!isCreateModalOpen)
    }

    // useEffect(() => {
    //     const chatEl = document.querySelector('.skel-op-dashboard-lft-base').getBoundingClientRect();
    //     // setChatWidth(chatEl.width);
    //     setChatWidth(200);
    //     setSidebarTop(chatEl.top);
    // }, []);

    // useEffect(() => {
    //     if (!sidebarTop) return;
    //     // console.log("calling...")
    //     window.addEventListener('scroll', isSticky);
    //     return () => {
    //         window.removeEventListener('scroll', isSticky);
    //     };
    // }, [sidebarTop]);

    // const isSticky = (e) => {
    //     const chatEl = document.querySelector('.skel-op-dashboard-lft-base');
    //     const scrollTop = window.scrollY;
    //     if (scrollTop >= sidebarTop - 10) {
    //         chatEl?.classList?.add('is-sticky');
    //     } else {
    //         chatEl?.classList?.remove('is-sticky');
    //     }
    // };

    useEffect(() => {
        get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=APPOINT_STATUS,APPOINT_STATUS_REASON')
            .then((resp) => {
                if (resp.data) {
                    setStatusReason(resp.data.APPOINT_STATUS_REASON)
                    setStatuses(resp.data.APPOINT_STATUS)
                }
            }).catch((error) => {
                console.log(error)
            })
    }, []);


    const handlePageSelect = (pageNo) => {
        setAppointmentListCurrentPage(pageNo)
    }

    return (
        <>
            <div className="cnt-wrapper">
                <div className="card-skeleton">
                    <div className="customer-skel">
                        <div className="row">
                            {/* <div className="col-xl-2 col-lg-2 col-md-12 col-xs-12 skel-resp-w-100">
                                <div className="skel-op-dashboard-lft-base cmmn-skeleton" >
                                    
                            </div> */}
                            <div className="col-xl-12 col-lg-12 col-md-12 col-xs-12 skel-resp-w-100 " >
                                <div className="skle-swtab-sect">
                                    <div className="db-list mb-0 pl-0">
                                        <a onClick={() =>
                                            handleOpenView('Interactive')} className="skel-fr-sel-cust">
                                            <div className={isInteractive ? "list-dashboard db-list-active skel-self" : "list-dashboard skel-self"}>
                                                <span className="db-title">Interactive View</span>
                                            </div>
                                        </a>
                                        <a onClick={() =>
                                            handleOpenView('Informative')} className="skel-fr-sel-serv">
                                            <div className={isInformative ? "list-dashboard db-list-active  skel-informative" : "list-dashboard skel-informative"}>
                                                <span className="db-title">Informative View</span>
                                            </div>
                                        </a>
                                    </div>
                                    <div className="db-list mb-0 pl-1 " /*skel-op-dashboard-lft-base */ style={{ width: chatWidth }}>
                                        <a
                                            className="skel-fr-sel-cust cursor-pointer"
                                            onClick={() => setShowFilter(!showFilter)}
                                        >
                                            <div className="list-dashboard db-list-active skel-self">
                                                <span className="db-title">
                                                    Filter
                                                    <img
                                                        src={FilterBtn}
                                                        className="img-fluid pl-1"
                                                    />
                                                </span>
                                            </div>
                                        </a>
                                    </div>
                                    {/* <a
                                        data-target="#createScheduleModal"
                                        data-toggle="modal"
                                        onClick={() =>
                                            handleOpenCreateModal()} className="skel-fr-sel-serv">
                                        <div className={isInformative ? "list-dashboard db-list-active  skel-informative" : "list-dashboard skel-informative"}>
                                            <span className="db-title">Create Appointment</span>
                                        </div>
                                    </a> */}
                                </div>
                                <Filter
                                    data={{
                                        showFilter,
                                        searchParams
                                    }}
                                    handler={{
                                        setShowFilter,
                                        setSearchParams,
                                    }}
                                />
                                {isInteractive && <Counts
                                    data={{
                                        cancelCount,
                                        completedCount,
                                        upcomming,
                                        totalCount,
                                        successFullCount,
                                        unSuccessFullCount,
                                        successCount,
                                        unSuccessCount,
                                        completedCounts,
                                        searchParams
                                    }}
                                    handlers={{
                                        setCancelCount,
                                        setCompletedCount,
                                        setUpcomming,
                                        setTotalCount,
                                        setSuccessFullCount,
                                        setUnSuccessFullCount,
                                        setSuccessCount,
                                        setUnSuccessCount,
                                        setCompletedCounts,
                                        setAppointmentList,
                                        setAppointmentListCount,
                                        setIsAppointmentPopupOpen
                                    }} />
                                }

                                {isInteractive && <InteractiveDashboard data={{
                                    statusReason,
                                    selectedInteraction,
                                    selectedEntityType,
                                    selectedOrder,
                                    selectedCustomer,
                                    isReScheduleOpen,
                                    interactionData,
                                    isUpcomingRefresh,
                                    isCalenderRefresh,
                                    cancelCount,
                                    completedCount,
                                    upcomming,
                                    totalCount,
                                    successFullCount,
                                    unSuccessFullCount,
                                    searchParams
                                }}
                                    handlers={{
                                        setSelectedInteraction,
                                        setSelectedEntityType,
                                        setSelectedOrder,
                                        setSelectedCustomer,
                                        setIsReScheduleOpen,
                                        setIsReScheduleOpenData,
                                        setInteractionData,
                                        setIsUpcomingRefresh,
                                        setIsCalenderRefresh,
                                        setCancelCount,
                                        setCompletedCount,
                                        setUpcomming,
                                        setTotalCount,
                                        setSuccessFullCount,
                                        setUnSuccessFullCount,
                                        setAppointmentList,
                                        setAppointmentListCount,
                                        setIsAppointmentPopupOpen
                                    }}
                                />}

                                {isInformative && <InformativeDashboard data={{
                                    cancelCount,
                                    completedCount,
                                    upcomming,
                                    totalCount,
                                    successFullCount,
                                    unSuccessFullCount,
                                    searchParams
                                }} handler={{
                                    setAppointmentList,
                                    setAppointmentListCount,
                                    setIsAppointmentPopupOpen
                                }} />}
                            </div>
                        </div >
                    </div>
                    {selectedInteraction && selectedInteraction.length > 0 && selectedEntityType === 'Interaction' &&
                        <InteractionsRightModal
                            data={{
                                selectedEntityType,
                                selectedInteraction,
                                isReScheduleOpen,
                                interactionData,
                                statuses,
                                statusReason,
                                isCancelOpen,
                                selectedStatus
                            }}
                            handlers={{
                                setSelectedInteraction,
                                setSelectedEntityType,
                                setIsReScheduleOpen,
                                setIsReScheduleOpenData,
                                setInteractionData,
                                setIsCancelOpen,
                                setSelectedStatus
                            }}
                        />
                    }
                    {
                        selectedOrder && selectedOrder.length > 0 && selectedEntityType === 'Order' &&
                        <OrdersRightModal
                            data={{
                                selectedEntityType,
                                selectedOrder,
                                isReScheduleOpen,
                                statuses,
                                statusReason,
                                isCancelOpen,
                                selectedStatus

                            }}
                            handlers={{
                                setSelectedOrder,
                                setSelectedEntityType,
                                setIsReScheduleOpen,
                                setIsReScheduleOpenData,
                                setSelectedStatus,
                                setIsCancelOpen
                            }}
                        />
                    }
                    {
                        isReScheduleOpen && <ReScheduleModal data={{ selectedStatus, interactionData, selectedInteraction, isReScheduleOpen, isUpcomingRefresh, selectedOrder, statusReason, isReScheduleOpenData }} handlers={{ setIsReScheduleOpen, setIsUpcomingRefresh, setIsReScheduleOpenData }} />
                    }
                    {
                        isCreateModalOpen && <CreateAppointment data={{ isCreateModalOpen, isUpcomingRefresh }} handlers={{ setIsCreateModalOpen, setIsUpcomingRefresh }} />
                    }
                    {
                        isCancelOpen && <CustomModal data={{ selectedStatus, isCancelOpen, selectedInteraction, statusReason, isUpcomingRefresh }} handlers={{ setIsCancelOpen, setIsUpcomingRefresh }} />
                    }
                    {
                        isAppointmentPopupOpen &&
                        <Modal isOpen={isAppointmentPopupOpen} style={RegularModalCustomStyles}>
                            <div className="modal-content">
                                <div className="">
                                    <PopupListModal
                                        data={{
                                            isTableFirstRender: false,
                                            hasExternalSearch: false,
                                            list: appointmentList,
                                            entityType: 'APPOINTMENT',
                                            count: appointmentListCount,
                                            fixedHeader: true,
                                            itemsPerPage: appointmentListPerPage,
                                            isScroll: true,
                                            backendCurrentPage: appointmentListCurrentPage,
                                            backendPaging: false,
                                            isPopupOpen: isAppointmentPopupOpen
                                        }}
                                        handlers={{
                                            handlePageSelect: handlePageSelect,
                                            setPerPage: setAppointmentListPerPage,
                                            setCurrentPage: setAppointmentListCurrentPage,
                                            setIsPopupOpen: setIsAppointmentPopupOpen
                                        }} />
                                </div>
                            </div>
                        </Modal>
                    }
                </div>
            </div>
            {isCreateApptFormOpen && <CreateAppointmentForm data={{ isCreateApptFormOpen, isCancelOpen, selectedInteraction, statusReason, isUpcomingRefresh, apptDate }} handlers={{
                setIsCancelOpen, setIsUpcomingRefresh, setIsCreateApptFormOpen, setApptDate
            }} />}
        </>
    )
}

export default AppoinmentDashboard;


