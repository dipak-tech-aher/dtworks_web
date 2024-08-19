import React, { useCallback, useEffect, useState, useContext, useRef } from "react";
import { unstable_batchedUpdates } from 'react-dom'
import { Form } from 'react-bootstrap';
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import moment from "moment";
import { AppContext } from "../../AppContext";
import { post, get } from "../../common/util/restUtil";
import { properties } from "../../properties";
import TopPerformingChannels from "./Components/TopPerformingChannels";
import RecentChats from "./Components/RecentChats";
import IssueSolvedBy from "./Components/IssueSolvedBy";
import UpcomingAppointments from "./Components/UpcomingAppointments";
import RecentCustomer from "./Components/RecentCustomer";
import TopCustomerIssues from "./Components/Top5ConsumerIssues";
import TopSales from "./Components/PieCharts/TopSales";
import TopGrevience from "./Components/PieCharts/TopGrevience";
import TopProducts from "./Components/PieCharts/TopProducts";
import NewOrders from "./Components/Counts/NewOrders";
import NewInteractions from "./Components/Counts/NewInteractions";
import Sales from "./Components/Counts/Sales";
import { RegularModalCustomStyles } from '../../common/util/util';
import Modal from 'react-modal';
import PopupListModal from "./ModalPopups/PopupListModal";
import ChannelsByLead from "./Components/ChannelsByLead";
import InteractionsByChannel from "./Components/InteractionsByChannel";
import { toast } from 'react-toastify'
import filterPng from '../../assets/images/filter-btn.png'
import Filter from "./Components/filter";
import TopRowAnalytics from "./Components/TopRowAnalytics";
import ConsumerDetails from "./Components/ConsumerDetails";
import InteractionDetails from "./Components/InteractionDetails";
import OrderDetails from "./Components/OrderDetails";
import LeadDetails from "./Components/LeadDetails";
import RevenueDetails from "./Components/RevenueDetails";
import Appointments from "./Components/Appointments";
import LiveCustomerInsights from "./Components/LiveCustomerInsights";
import Top5ConsumerIssues from "./Components/Top5ConsumerIssues";
import TopProductsByConsumer from "./Components/TopProductsByConsumer";
import Top5ChannelsByConsumer from "./Components/Top5ChannelsByConsumer";
import Top5ChannelsByLeads from "./Components/Top5ChannelsByLeads";
import ConsumerByLocation from "./Components/ConsumerByLocation";
import Top5ChannelsByGrievance from "./Components/Top5ChannelsByGrievance";
import ChannelsByInteractions from "./Components/ChannelsByInteractions";

const CustomerEngagement = () => {
    const { auth } = useContext(AppContext)
    const [showFilter, setShowFilter] = useState(false);
    const [excelFilter, setExcelFilter] = useState({});
    const [filterIsOpen, setFilterIsOpen] = useState(false);
    const [isRightModalOpen, setIsRightModalOpen] = useState(false);
    const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const dateRange = useRef()

    const [searchParams, setSearchParams] = useState({
        startDate,
        endDate,
    });
    const [submitError, setSubmitError] = useState(null);
    const [topSales, setTopSales] = useState([]);
    const [topPerforming, setTopPerforming] = useState([]);
    const formRef = useRef();
    const { handleSubmit, control, reset } = useForm();
    const [isChecked, setIsChecked] = useState(false);
    const [isParentRefresh, setIsParentRefresh] = useState(false);
    const [pageRefreshTime, setPageRefreshTime] = useState(1);

    useEffect(() => {
        unstable_batchedUpdates(() => {
            if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
                const intervalId = setInterval(() => {
                    if (isChecked) {

                        // const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                        setIsParentRefresh(!isParentRefresh)
                    }
                }, Number(pageRefreshTime) * 60 * 1000);
                // return () => clearInterval(intervalId);
            }
        })
    }, []); //


    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return
        }
        setIsChecked(!isChecked);
        // setIsChecked(event.target.checked);
    }

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false)
            setPageRefreshTime(parseInt(e.target.value));
        })
    }

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected = !data?.dateRange?.length && !data.serviceCat && !data.serviceType;
        if (noFilterSelected && !data.teamMemberId) {
            setSubmitError("Please apply at least one filter");
            return;
        }

        const startDate = data?.dateRange?.[0] ? moment(data.dateRange[0]).format("YYYY-MM-DD") : null;
        const endDate = data?.dateRange?.[1] ? moment(data.dateRange[1]).format("YYYY-MM-DD") : startDate;

        setSearchParams({
            ...data,
            startDate,
            endDate
        });
    }

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            startDate: undefined,
            endDate: undefined
        });
    }

    useEffect(() => {
        getDashBoardData();
    }, [searchParams]);

    const getDashBoardData = useCallback(() => {
        getCounts('Order');
        getCounts('Interaction');
        getCounts('Sales');
        GetRecentCustomers();
        TopPerformingProducts();
        TopChannelsByGrevience();
        GetTopCustomerIssues();
        GetUpcomingAppointments();
        IssueSolvedChannel();
        TopChannelsByInteractions();
        TopChannelsByLead();
    }, [searchParams]);

    const [countsData, setCountsData] = useState({
        orderCounts: 0,
        interactionCounts: 0,
        salesCounts: 0,
    });

    const getCounts = (type) => {
        let requestBody = { type };
        if (Object.keys(searchParams).length !== 0) {
            delete searchParams.dateRange;
            requestBody = { ...requestBody, ...searchParams };
        }
        post(properties.CUSTOMER_API + '/order-interaction-count', requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (type === 'Sales') {
                        setCountsData(prevCounts => ({ ...prevCounts, salesCounts: resp.data }));
                    }
                    if (type === 'Order') {
                        setCountsData(prevCounts => ({ ...prevCounts, orderCounts: resp.data }));
                    }
                    if (type === 'Interaction') {
                        setCountsData(prevCounts => ({ ...prevCounts, interactionCounts: resp.data }));
                    }
                }
            })
            .catch((error) => {
                console.error("error", error);
            });
    }

    const [interactionsByChannels, setInteractionsByChannels] = useState([]);
    const TopChannelsByInteractions = () => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/interactions-by-channels", requestBody)
            .then((response) => {
                setInteractionsByChannels(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [channelsByLead, setChannelsByLead] = useState([]);
    const TopChannelsByLead = () => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/top-channel-by-leads", requestBody)
            .then((response) => {
                setChannelsByLead(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [topPerformingProducts, setTopPerformingProducts] = useState()
    const TopPerformingProducts = () => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/top-performing-products", requestBody)
            .then((response) => {
                setTopPerformingProducts(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [topChannelsByGrevience, setTopChannelsByGrevience] = useState()
    const TopChannelsByGrevience = () => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/top-channels-grevience", requestBody)
            .then((response) => {
                setTopChannelsByGrevience(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [issueResolvedBy, setIssueResolvedBy] = useState();
    const IssueSolvedChannel = (filterCleared = false) => {
        let requestBody = {
            searchParams: { channel: 'skel-channel-all' }
        };

        if (Object.keys(searchParams).length !== 0) {
            requestBody.searchParams.startDate = searchParams?.startDate
            requestBody.searchParams.endDate = searchParams?.endDate
        }
        post(properties.INTERACTION_API + "/issues-solved-by-channel", requestBody)
            .then((response) => {
                if (response?.data?.length > 0) {
                    let result = {
                        data: response?.data,
                        bot: response?.data?.filter((x) => x.is_resolved_by === 'BOT')?.length,
                        human: response?.data?.filter((x) => x.is_resolved_by === 'HUMAN')?.length
                    }
                    setIssueResolvedBy(result);
                }
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [topChannelsBySales, setTopChannelsBySales] = useState([]);
    const TopChannelBySales = (filterCleared = false) => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.INTERACTION_API + "/top-channel-by-sales", requestBody)
            .then((response) => {
                setTopChannelsBySales(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [recentCustomers, setRecentCustomers] = useState();
    const GetRecentCustomers = (filterCleared = false) => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/recent-customers", requestBody)
            .then((response) => {
                setRecentCustomers(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [topCustomerIssues, setTopCustomerIssues] = useState();
    const GetTopCustomerIssues = (filterCleared = false) => {
        let requestBody = {};
        if (Object.keys(searchParams).length !== 0) {
            requestBody = searchParams;
        }
        post(properties.CUSTOMER_API + "/top-customer-issues", requestBody)
            .then((response) => {
                setTopCustomerIssues(response.data);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [upcomingAppointments, setUpcomingAppointments] = useState();
    const GetUpcomingAppointments = (filterCleared = false) => {
        let searchParamss = {
            ...searchParams,
            type: 'Me',
            fromDate: new Date(),
            userId: auth?.user?.userId,
            roleId: auth?.currRoleId
        }

        post(`${properties.INTERACTION_API}/get-appointment-overview`, { "searchParams": searchParamss })
            .then((response) => {
                const upcoming = response?.data?.filter(x => moment(x.appointDate).isAfter(moment(), 'day'));
                setUpcomingAppointments(upcoming);
            })
            .catch((error) => {
                console.error("error", error);
            });
    };

    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [issueResolvedByFilteredData, setIssueResolvedByFilteredData] = useState([]);
    const handleIssuePopUpOpenClose = (type) => {
        const filteredData = issueResolvedBy?.data?.filter((ele) => ele?.is_resolved_by === type);
        setIssueResolvedByFilteredData(filteredData);
        setIsPopupOpen(true);
    }

    const [isCountDataPopupOpen, setIsCountDataPopupOpen] = useState(false);
    const [countData, setCountData] = useState({
        orderData: [],
        interactionData: [],
        salesData: [],
    });
    const [heading, setHeading] = useState('');
    const getCountsData = (type) => {
        let requestBody = { type };
        if (Object.keys(searchParams).length !== 0) {
            delete searchParams.dateRange;
            requestBody = { ...requestBody, ...searchParams };
        }
        post(properties.CUSTOMER_API + '/order-interaction-count-data', requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (type === 'Sales') {
                        setCountData(prevCounts => ({ ...prevCounts, salesData: resp.data }));
                    }
                    if (type === 'Order') {
                        setCountData(prevCounts => ({ ...prevCounts, orderData: resp.data }));
                    }
                    if (type === 'Interaction') {
                        setCountData(prevCounts => ({ ...prevCounts, interactionData: resp.data }));
                    }
                    setHeading(type)
                    setIsCountDataPopupOpen(true)
                }
            })
            .catch((error) => {
                console.error("error", error);
            });
    }

    const clearFilter = (param, value) => {
        if (["project", "status", "severity"].includes(param)) {
            searchParams[param] = searchParams[param].filter(x => x.value != value);
        } else {
            searchParams[param] = null;
        }
        setSearchParams({
            ...searchParams
        })
    }

    const getSelectedFilters = () => {
        let ageing, project, status, currentUser, severity;
        if (searchParams?.startDate || searchParams?.endDate) {
            let startDate = searchParams?.startDate;
            let endDate = searchParams?.endDate ? searchParams?.endDate : startDate;
            dateRange.current = startDate + " - " + endDate;
        }
        if (searchParams?.project?.length) project = searchParams?.project;
        if (searchParams?.status?.length) status = searchParams?.status;
        if (searchParams?.ageing?.value) ageing = searchParams?.ageing;
        if (searchParams?.currentUser?.value) currentUser = searchParams?.currentUser;
        if (searchParams?.severity?.length) severity = searchParams?.severity;

        return (
            <React.Fragment>
                {dateRange && (
                    <li style={{ fontSize: '15px' }}>
                        Date Range:
                        <span className="dash-filter-badge ml-1">{dateRange.current}
                        </span>
                    </li>
                )}
                {project && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Projects: {project.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('project', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {status && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Status: {status.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('status', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {ageing && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Ageing:
                        <span className="dash-filter-badge ml-2">{ageing.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('ageing', ageing.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {severity && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Severity: {severity.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('severity', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {currentUser && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Ageing:
                        <span className="dash-filter-badge ml-2">{currentUser.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('currentUser', currentUser.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
            </React.Fragment>
        )
    }
    return (
        <div className="card-skeleton ced">
            <div className="customer-skel mt-0">
                <div className="row">
                    <div className="col-md-12">
                        <div className="skle-swtab-sect">
                            <div className="db-list mb-0 pl-0">
                                <span className="skel-fr-sel-serv">
                                    <div className="list-dashboard skel-informative-insights" style={{ display: "none" }}>
                                        <span className="db-title"></span>
                                    </div>
                                </span>
                            </div>
                            <form className="form-inline">
                                <span className="ml-1">Auto Refresh</span>
                                <div className="switchToggle ml-1">
                                    <input id="switch1" type="checkbox" checked={isChecked} onChange={handleAutoRefresh} />
                                    <label htmlFor="switch1">Toggle</label>
                                </div>
                                <select className="custom-select custom-select-sm ml-1" value={pageRefreshTime} onChange={handleSetRefreshTime} >
                                    <option value="Set">Set</option>
                                    <option value={Number(1)}>1 Min</option>
                                    <option value={Number(5)}>5 Min</option>
                                    <option value={Number(15)}>15 Min</option>
                                    <option value={Number(30)}>30 Min</option>
                                </select>
                                <span className="skel-fr-sel-cust" onClick={() => setFilterIsOpen(!filterIsOpen)}>
                                    <div className="list-dashboard db-list-active skel-self cursor-pointer">
                                        <span className="db-title" onClick={() => setShowFilter(!showFilter)}> Filter{" "} <img src={filterPng} className="img-fluid pl-1" />
                                        </span>
                                    </div>
                                </span>
                                {/* <button className="skel-btn-export" onClick={() => exportToCSV()}>Export Excel</button> */}
                            </form>

                        </div>
                        <Filter
                            data={{
                                showFilter,
                                isParentRefresh,
                                excelFilter,
                            }}
                            handler={{
                                setShowFilter,
                                setSearchParams,
                                setIsParentRefresh,
                                setExcelFilter
                            }}
                        />
                        <div className="skle-swtab-sect mt-0 mb-0">
                            <ul className="skel-top-inter mt-1 mb-0">
                                {/* <div className="d-flex"> */}
                                {getSelectedFilters()}
                                {/* </div> */}
                            </ul>
                        </div>
                    </div>
                    <TopRowAnalytics data={{searchParams}}/>
                    <ConsumerDetails data={{searchParams}}/>
                    <div className="customer-skel col-md-12 mb-0">
                        <div className="row">
                            <InteractionDetails data={{searchParams}}/>
                            <OrderDetails data={{searchParams}}/>
                            <LeadDetails data={{searchParams}}/>
                            <RevenueDetails data={{searchParams}}/>
                        </div>
                    </div>
                </div>
                <div className="customer-skel">
                    <div className="row">
                        <Appointments data={{searchParams}}/>
                        <LiveCustomerInsights data={{searchParams}}/>
                    </div>
                </div>
                <div className="customer-skel">
                    <div className="row">
                        <Top5ConsumerIssues data={{searchParams}}/>
                        <TopProductsByConsumer data={{searchParams}}/>
                    </div>
                </div>
                <div className="customer-skel">
                    <div className="row">
                        <Top5ChannelsByConsumer data={{searchParams}}/>
                        {/* <Top5ChannelsByLeads data={{searchParams}}/> */}
                        <ChannelsByLead data={{ channelsByLead}} />
                        <ConsumerByLocation data={{searchParams}}/>
                    </div>
                </div>
                <div className="customer-skel mb-2">
                    <div className="row">
                       <Top5ChannelsByGrievance data={{searchParams}}/>
                       <ChannelsByInteractions data={{searchParams}}/>                            
                    </div>
                </div>
                {
                    isPopupOpen &&
                    <Modal isOpen={isPopupOpen} style={RegularModalCustomStyles}>
                        <div className="modal-content">
                            <div className="">
                                <PopupListModal
                                    data={{
                                        list: issueResolvedByFilteredData,
                                        entityType: 'Issues Resolved By',
                                        count: issueResolvedByFilteredData?.length,
                                        isPopupOpen: isPopupOpen
                                    }}
                                    handlers={{
                                        setIsPopupOpen: setIsPopupOpen
                                    }} />
                            </div>
                        </div>
                    </Modal>
                }

                {
                    isCountDataPopupOpen &&
                    <Modal isOpen={isCountDataPopupOpen} style={RegularModalCustomStyles}>
                        <div className="modal-content">
                            <div className="">
                                <PopupListModal
                                    data={{
                                        list: heading === 'Order' ? countData?.orderData : heading === 'Interaction' ? countData?.interactionData : countData?.salesData,
                                        entityType: heading,
                                        count: countData?.length,
                                        isPopupOpen: isCountDataPopupOpen
                                    }}
                                    handlers={{
                                        setIsPopupOpen: setIsCountDataPopupOpen
                                    }} />
                            </div>
                        </div>
                    </Modal>
                }
            </div>
        </div>
    );
};

export default CustomerEngagement;
