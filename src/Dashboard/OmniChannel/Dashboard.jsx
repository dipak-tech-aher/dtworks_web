import { useState, useRef } from "react";
import { OmniChannelDashboardContext } from "../../AppContext";
import { toast } from "react-toastify";
import InteractionChannel from "../../assets/images/interaction-chnl.svg";
import OrderChannel from "../../assets/images/order-chnl.svg";
import AppointmentChannel from "../../assets/images/appt-chnl.svg";
import SalesChannel from "../../assets/images/sales-chnll.svg";
import Averagechannel from "../../assets/images/avg-perf.svg";
import { get, post } from "../../common/util/restUtil";
import ReactSelect from "react-select";
import { properties } from "../../properties";
import React, { useEffect } from "react";
import VerticalBar from "../charts/barChart";
import Vertical from "../charts/bar-chart";
import Corner from "../charts/corner";
import Order from "../charts/orderBar";
import TotalChatBar from "../charts/totalChatBar";
import AbandonedBar from "../charts/abandonedBar";
import AveragePie from "../charts/averagePie";
import AverageHandlingPie from "../charts/averageHandlingPie";
import TurnArround from "../charts/turnArroundPie";
import Problemsolving from "../charts/problemsolvingbar";
import ChatHistory from "./ChatHistory";
import HeaderCount from "./HeaderCount";
import RevenueByChannel from "./RevenueByChannel";
import Modal from 'react-modal';
import PopupListModal from "./ModalPopups/PopupListModal";
import { RegularModalCustomStyles, pageStyle } from '../../common/util/util';
import TopPerformingChannels from "./Components/TopPerformingChannels";
import InteractionsByChannels from "./Components/InteractionsByChannels";
import OrdersByChannels from "./Components/OrdersByChannels";
import AppointmentsByChannels from "./Components/AppointmentsByChannels";
import { InteractionByChannelsColumns, AssignedOrdersColumns, AppointmentColumns, ProspectCustomerByChannelColumns, CommonColumns, LiveSupportColumns } from "./ModalPopups/PopupListModalColumns";
import FilterBtn from "../../assets/images/filter-btn.svg";
import Filter from "./filter";
import { useReactToPrint } from "react-to-print";
import OverallRevenueByChannel from "./Components/OverallRevenueByChannel";
import moment from 'moment'
import AppoinmentCorner from "./Components/AppoinmentCorner";
const OmniChannelDashboard = (props) => {
  function getChannelClassName(channel) {
    switch (channel) {
      case "IVR":
      case "Walk In":
        return "txt-clr-selfcare";
      case "Live-chat":
        return "txt-clr-ivr";
      case "Email":
        return "txt-clr-email";
      case "Whatsapp Live Chat":
        return "txt-clr-whatsapp";
      case "Facebook Live Chat":
        return "txt-clr-facebook";
      case "Telegram":
        return "txt-clr-telegram";
      case "Instagram":
        return "txt-clr-instagram";
      case "WebSelfcare":
      case "Web Application":
      case "WEB":
        return "txt-clr-selfcare";
      default:
        return "txt-clr-selfcare";
    }
  }
  function getChannelNewClassName(channel) {
    switch (channel) {
      case "IVR":
      case "Walk In":
      case "WALKIN":
        return "pc-ivr";
      case "Live-chat":
        return "txt-clr-ivr";
      case "Email":
        return "pc-email";
      case "EMAIL":
        return "rc-email";
      case "Whatsapp Live Chat":
        return "pc-w";
      case "WHATSAPP-LIVECHAT":
        return "rc-w";
      case "Facebook Live Chat":
        return "pc-f";
      case "FB-LIVECHAT":
        return "rc-f";
      case "Telegram":
        return "txt-clr-telegram";
      case "Instagram":
        return "txt-clr-instagram";
      case "Mobile App":
        return "pc-ma";
      case "MOBILEAPP":
        return "rc-ma";
      case "WebSelfcare":
      case "Web Application":
      case "WEB":
        return "pc-ivr";
      default:
        return "pc-ivr";
    }
  }


  function getChannelIcon(channel) {
    switch (channel) {
      case "Mobile APP":
      case "Mobile App":
        return <i className="fas fa-mobile-alt"></i>;
      case "IVR":
        return <i className="fas fa-microphone"></i>;
      case "Walk In":
      case "WALKIN":
        return <i className="fas fa-walking"></i>;
      case "Live-chat":
        return <i className="fas fa-comments"></i>;
      case "Email":
        return <i className="fas fa-envelope"></i>;
      case "Whatsapp Live Chat":
        return <i className="fab fa-whatsapp"></i>;
      case "Facebook Live Chat":
      case "FB Live Chat":
        return <i className="fab fa-facebook"></i>;
      case "Telegram":
        return <i className="fab fa-telegram"></i>;
      case "Instagram":
        return <i className="fab fa-instagram"></i>;
      case "HUMAN":
        return <i className="fas fa-user"></i>
      case "WebSelfcare":
      case "Selfcare":
      case "SelfCare":
      case "Web Application":
      case "WEB":
        return (
          <>
            <i className="fas fa-globe"></i>
            {channel === null || channel === "HUMAN" ? <h1>!</h1> : null}
          </>
        );
      default:
        return <i className="fab fa-instagram"></i>;
    }
  }

  const { appsConfig } = props;

  const [isInteractionByDynamicChannelPopupOpen, setIsInteractionByDynamicChannelPopupOpen] = useState(false);
  const [isOrderByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen] = useState(false);
  const [channelListCount, setChannelListCount] = useState(0)
  const [channelListPerPage, setChannelListPerPage] = useState(10)
  const [channelCurrentPage, setChannelCurrentPage] = useState(0)

  const [interactionsByChannel, setInteractionsByChannel] = useState();
  const [filteredInteractionsByChannel, setFilteredInteractionsByChannel] = useState();
  const [isInteractionByChannelPopupOpen, setIsInteractionByChannelPopupOpen] = useState(false);
  const [listCount, setListCount] = useState(0)
  const [listPerPage, setListPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)

  const [ordersByChannel, setOrdersByChannel] = useState();
  const [filteredOrdersByChannel, setFilteredOrdersByChannel] = useState();
  const [isOrderByChannelPopupOpen, setIsOrderByChannelPopupOpen] = useState(false);
  const [orderListCount, setOrderListCount] = useState(0)
  const [listOrderPerPage, setListOrderPerPage] = useState(10)
  const [orderCurrentPage, setOrderCurrentPage] = useState(0)

  const [appointmentByChannel, setAppointmentByChannel] = useState();
  const [filteredAppointmentByChannel, setFilteredAppointmentByChannel] = useState();
  const [isAppointmentByChannelPopupOpen, setIsAppointmentByChannelPopupOpen] = useState(false);
  const [appointmentListCount, setAppointmentListCount] = useState(0)
  const [listAppointmentPerPage, setListAppointmentPerPage] = useState(10)
  const [appointmentCurrentPage, setAppointmentCurrentPage] = useState(0)

  const [prospectByChannel, setProspectByChannel] = useState();
  const [filteredProspectByChannel, setFilteredProspectByChannel] = useState();
  const [isProspectByChannelPopupOpen, setIsProspectByChannelPopupOpen] = useState(false);
  const [prospectListCount, setProspectListCount] = useState(0)
  const [listProspectPerPage, setListProspectPerPage] = useState(10)
  const [prospectCurrentPage, setProspectCurrentPage] = useState(0)

  const [liveSupportByChannel, setLiveSupportByChannel] = useState();
  const [filteredLiveSupportByChannel, setFilteredLiveSupportByChannel] = useState();
  const [isLiveSupportByChannelPopupOpen, setIsLiveSupportByChannelPopupOpen] = useState(false);
  const [listLiveSupportPerPage, setListLiveSupportPerPage] = useState(10)
  const [liveSupportCurrentPage, setLiveSupportCurrentPage] = useState(0)

  const [topCustomerByChannel, setTopCustomerByChannel] = useState();
  const [filteredTopCustomerByChannel, setFilteredTopCustomerByChannel] = useState();
  const [isTopCustomerByChannelPopupOpen, setIsTopCustomerByChannelPopupOpen] = useState(false);
  const [topCustomerListCount, setTopCustomerListCount] = useState(0)
  const [listTopCustomerPerPage, setListTopCustomerPerPage] = useState(10)
  const [topCustomerCurrentPage, setTopCustomerCurrentPage] = useState(0)

  const [topCustomersByChannel, setTopCustomersByChannel] = useState();
  const [averagePerformanceByChannel, setAveragePerformanceByChannel] = useState();
  const [totalRevenueByChannel, setTotalRevenueByChannel] = useState();
  const [viewType, setViewType] = useState("skel-channel-all");
  const [isPageRefresh, setIsPageRefresh] = useState(false);
  const [error, setError] = useState();
  const [isChecked, setIsChecked] = useState(false);
  const [pageRefreshTime, setPageRefreshTime] = useState(30);
  const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
  const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
  const [searchParams, setSearchParams] = useState({
    startDate: startDate,
    endDate: endDate
  });
  // const [searchParams, setSearchParams] = useState({});
  const [count, setCount] = useState([]);
  const [orderCount, setOrderCount] = useState([]);
  const [topSales, setTopSales] = useState([]);
  const [totalAppointment, setTotalAppointment] = useState([]);
  const [topPerforming, setTopPerforming] = useState([]);
  const [totalChat, setTotalChat] = useState([]);
  const [abandonedChat, setAbandonedChat] = useState([]);
  let [issueResolved, setIssueResolved] = useState([]);
  let [iss, setIss] = useState([]);
  const [topProblem, setTopProblem] = useState([]);
  const [liveSupport, setLiveSupport] = useState([]);
  const [prospect, setProspect] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [category, setCategory] = useState([]);
  const [corner, setCorner] = useState([]);
  const [order, setOrder] = useState([]);
  const [issueResolvedWalkin, setIssueResolvedwalkin] = useState([]);
  const [overallRevenue, setOverallRevenue] = useState([]);
  const [average, setAverage] = useState([]);
  const [averageHandling, setAverageHandling] = useState([]);
  const [turnArround, setTurnAround] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [axisData, setAxisData] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [isRefresh, setIsRefresh] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const groupBy = (items, key) =>
    items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [...(result[item[key]] || []), item],
      }),
      {}
    );

  useEffect(() => {
    if (issueResolved?.length > 0) {
      const updatedIssueResolved = issueResolved.map((x) => {
        if (!x.channel) x.channel = "Unknown";
        return x;
      });
      const groupedIssueResolved = groupBy(updatedIssueResolved, "channel");
      let labels = [];
      let intxnData = [];
      let orderData = [];
      let result;
      for (const channel in groupedIssueResolved) {
        labels.push(channel);
        result = groupedIssueResolved[channel];
        // console.log('result------->', result);
        result && result.length > 0 && result.map((e) => {
          if (e.isResolvedBy === "HUMAN") {
            intxnData.push(e.count);
          } else if (e.isResolvedBy === "BOT") {
            orderData.push(e.count);
          }
          return e;
        });
      }
    }
  }, [issueResolved]);

  const handleAutoRefresh = (event) => {
    if (!pageRefreshTime) {
      toast.error("Refresh Time Is Require!");
      return;
    }
    setIsChecked(event.target.checked);
  };

  useEffect(() => {
    unstable_batchedUpdates(() => {
      console.log('typeof(pageRefreshTime)-------', pageRefreshTime)
      if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
        const intervalId = setInterval(() => {
          if (isChecked) {
            // setTime(new Date())
            setIsPageRefresh(!isPageRefresh)
            const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
            // setLastDataRefreshTime({})
            // console.log("Component refreshed!", pageRefreshTime);
          }
        }, Number(pageRefreshTime) * 60 * 1000);

        return () => clearInterval(intervalId);
      }
    })
  }, [isChecked]);

  const handleSetRefreshTime = () => { };

  const contextProvider = {
    data: {},
    handlers: {},
  };

  useEffect(() => {
    TotalInterctionCount();
  }, [isRefresh]);


  let requestBody = {
    searchParams: {
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      channel: searchParams.channel,
      serviceCat: searchParams.serviceCat,
      serviceType: searchParams.serviceType,
    },
  };


  useEffect(() => {
    if (
      viewType === "WHATSAPP-LIVECHAT" ||
      viewType === "FB-LIVECHAT" ||
      viewType === "TELEGRAM" ||
      viewType === "INSTAGRAM" ||
      viewType === "EMAIL" ||
      viewType === "MOBILEAPP" ||
      viewType === "SELFCARE" ||
      viewType === "IVR" ||
      viewType === "WALKIN"
    ) {
      watapp();
    } else {
      allchannel();
    }
  }, [viewType, searchParams]);


  const TotalInterctionCount = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.INTERACTION_API + "/total-count-by-channel", requestBody)
      .then((response) => {
        setInteractionsByChannel(response?.data);
        const channelCounts = response?.data?.reduce((acc, obj) => {
          const channel = obj?.channel;
          if (acc[channel]) {
            acc[channel]++;
          } else {
            acc[channel] = 1;
          }
          return acc;
        }, {});

        const result = Object.entries(channelCounts).map(([channel, count]) => {
          return { "intxn_channel": channel, "count": count };
        });

        setCount(result);

      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const filterInteractionsByChannel = (channel) => {
    const data = interactionsByChannel?.filter((ele) => ele?.channel?.toUpperCase() === channel?.toUpperCase());
    setFilteredInteractionsByChannel(data);
  }

  const filterInteractionsByChannelAndBotOrHuman = (channel, botOrHuman) => {
    let data = [];
    if (botOrHuman === 'BOT') {
      data = issueResolved?.filter((ele) => ele?.channel?.toUpperCase() === channel?.toUpperCase() && (ele?.is_resolved_by.toLowerCase() === botOrHuman.toLowerCase() || ele?.is_resolved_by.toLowerCase() === 'Smart Assistance'.toLowerCase()));
    } else {
      data = issueResolved?.filter((ele) => ele?.channel?.toUpperCase() === channel?.toUpperCase() && ele?.is_resolved_by.toLowerCase() === botOrHuman.toLowerCase());
    }

    console.log('data--------------->', data)
    setFilteredInteractionsByChannel(data);
  }

  const TotalOrder = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.ORDER_API + "/total-count-by-channel ", requestBody)
      .then((response) => {
        setOrdersByChannel(response?.data);
        const orderCounts = {};

        for (const order of response?.data) {
          const channel = order.channel;
          if (channel in orderCounts) {
            orderCounts[channel] += 1;
          } else {
            orderCounts[channel] = 1;
          }
        }

        const result = Object.entries(orderCounts).map(([order_channel, count]) => ({
          order_channel,
          count
        }));

        setOrderCount(result);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const filterOrdersByChannel = (channel) => {
    const data = ordersByChannel?.filter((ele) => ele?.channel === channel);
    setFilteredOrdersByChannel(data);
  }

  const TotalAppointment = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.APPOINTMENT_API + "/total-count-by-channel", requestBody)
      .then((response) => {
        setAppointmentByChannel(response?.data);
        const appointmentCounts = {};
        for (const appointment of response?.data) {
          const channel = appointment.channel;
          if (channel in appointmentCounts) {
            appointmentCounts[channel] += 1;
          } else {
            appointmentCounts[channel] = 1;
          }
        }

        const result = Object.entries(appointmentCounts).map(([appointment_channel, count]) => ({
          appointment_channel,
          count
        }));

        setTotalAppointment(result);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const filterAppointmentsByChannel = (channel) => {
    const data = appointmentByChannel?.filter((ele) => ele?.channel === channel);
    setFilteredAppointmentByChannel(data);
  }

  const TopSalesByChannel = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.INTERACTION_API + "/top-sales-by-channel", requestBody)
      .then((response) => {
        setTopSales(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const [topChannels, setTopChannels] = useState([])
  const [orderType, setOrderType] = useState()
  const TopChannelsByOrder = (filterCleared = false, orderType) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    if (orderType) {
      setOrderType(orderType)
      requestBody.orderType = orderType
    }
    post(properties.INTERACTION_API + "/top-channels-by-order", requestBody)
      .then((response) => {
        setTopChannels(response.data);

        const axisData = [...new Set(response.data.map(item => item.channel_desc))]

        setAxisData(axisData)
        const seriesData = axisData.map(channel => {
          const totalCount = response.data.reduce((acc, item) => {
            if (item.channel_desc === channel) {
              return acc + parseInt(item.total_cnt, 10);
            }
            return acc;
          }, 0);

          return {
            value: totalCount,
            name: channel
          };
        });

        setSeriesData(seriesData)


      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const ProspectChannel = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(
      properties.INTERACTION_API + "/prospect-generated-by-channel",
      requestBody
    )
      .then((response) => {
        setProspectByChannel(response?.data);
        const prospectCounts = {};

        for (const prospect of response?.data) {
          const channel = prospect.channel;
          if (channel in prospectCounts) {
            prospectCounts[channel] += 1;
          } else {
            prospectCounts[channel] = 1;
          }
        }

        const result = Object.entries(prospectCounts).map(([prospect_channel, count]) => ({
          prospect_channel,
          count
        }));

        setProspect(result);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const filterProspectByChannel = (channel) => {
    const data = prospectByChannel?.filter((ele) => ele?.channel === channel);
    // console.log('data-------->', data)
    setFilteredProspectByChannel(data);
  }

  const [intxnType, setIntxnType] = useState()
  const ProblemSolvingChannel = (filterCleared = false, intxnType) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    if (intxnType && intxnType?.length > 0) {
      setIntxnType(intxnType)
      requestBody.intxnType = intxnType
    }
    post(
      properties.INTERACTION_API + "/top-problem-solving-by-channel",
      requestBody
    )
      .then((response) => {
        setTopProblem(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const [filteredLiveSupportDataByChannel, setFilteredLiveSupportDataByChannel] = useState([])
  const filterLiveSupportDataByChannel = (channel) => {
    const data = liveSupportData?.filter((ele) => ele?.channel_desc === channel);
    setFilteredLiveSupportDataByChannel(data);
  }

  const [liveSupportDataByChannel, setLiveSupportDataByChannel] = useState([]);
  const [liveSupportData, setLiveSupportData] = useState([]);
  const LiveSupport = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.INTERACTION_API + "/live-support-by-channel", requestBody)
      .then((response) => {
        setLiveSupportData(response?.data)
        const liveSupportCounts = {};

        for (const liveSupport of response?.data) {
          const channel = liveSupport.channel_desc;
          if (channel in liveSupportCounts) {
            liveSupportCounts[channel] += 1;
          } else {
            liveSupportCounts[channel] = 1;
          }
        }

        const result = Object.entries(liveSupportCounts).map(([liveSupport_channel, count]) => ({
          liveSupport_channel,
          count: count == 0 || count == '0' ? '' : count
        }));

        setLiveSupportDataByChannel(result);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const filterLiveSupportByChannel = (channel) => {
    const data = liveSupportByChannel?.filter((ele) => ele?.channel === channel);
    setFilteredLiveSupportByChannel(data);
  }

  const TotalChatChannel = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.CHAT_API + "/total-count-by-channel", requestBody)
      .then((response) => {
        setTotalChat(response.data);

        // console.log(count, "performing");
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const AbandonedChannel = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.CHAT_API + "/count/abandoned", requestBody)
      .then((response) => {
        setAbandonedChat(response.data);
        // console.log(count, "performing");
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const AverageResponse = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.CHAT_API + "/average-response-time", requestBody)
      .then((response) => {
        setAverage(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const AverageHandling = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.CHAT_API + "/average-handling-time", requestBody)
      .then((response) => {
        setAverageHandling(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const TurnArrounds = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.CHAT_API + "/turn-around-time", requestBody)
      .then((response) => {
        setTurnAround(response.data);

        // console.log(count, "count1");
      })
      .catch((error) => {
        console.error("error", error);
      });
  };

  const IssueSolvedChannel = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    post(properties.INTERACTION_API + "/issues-solved-by-channel", requestBody)
      .then((response) => {
        setIssueResolved(response.data);
        // console.log('dat byBotOrHuman-1', response.data);
        // Initialize the result object
        const result = {};

        // Iterate through the data and count occurrences
        response.data.forEach(entry => {
          const { channel, is_resolved_by } = entry;

          // Skip entries with missing or invalid channel or resolution
          if (!channel || !is_resolved_by) {
            return;
          }

          // Create the channel object if it doesn't exist
          if (!result[channel]) {
            result[channel] = {
              bot: 0,
              human: 0,
              'smart assistance': 0
            };
          }

          // Increment the respective resolution count
          result[channel][is_resolved_by.toLowerCase()]++;
        });

        console.log('result---------------->', result)
        setIss(result);
      })
      .catch((error) => {
        console.error("error", error);
      });
  };

  const TopPerformingChannel = () => {
    post(properties.INTERACTION_API + "/top-performing-channel", requestBody)
      .then((response) => {
        if (response.data === "") {
          setError("no data found");
        }
        setTopPerforming(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      });
  };

  const RevenueChannel = () => {
    post(properties.ORDER_API + "/revenue-by-channel", requestBody)
      .then((response) => {
        setRevenue(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const TopCustomersByChannel = () => {
    post(properties.CUSTOMER_API + "/top-customer-by-channel", requestBody)
      .then((response) => {
        setTopCustomerByChannel(response?.data);
        const topCustomerCounts = {};

        for (const topCustomer of response?.data) {
          const channel = topCustomer.channel;
          if (channel in topCustomerCounts) {
            topCustomerCounts[channel] += 1;
          } else {
            topCustomerCounts[channel] = 1;
          }
        }

        const result = Object.entries(topCustomerCounts).map(([topCustomer_channel, count]) => ({
          topCustomer_channel,
          count
        }));
        setTopCustomersByChannel(result);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const AveragePerformanceByChannel = () => {
    post(properties.INTERACTION_API + "/average-performance-by-channel", requestBody)
      .then((response) => {
        setAveragePerformanceByChannel(response?.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };


  const filterTopCustomerByChannel = (channel) => {
    const data = topCustomerByChannel?.filter((ele) => ele?.channel === channel);
    setFilteredTopCustomerByChannel(data);
  }

  const TotalRevenueByChannel = () => {
    post(properties.ORDER_API + "/overall-revenue-count", requestBody)
      .then((response) => {
        setTotalRevenueByChannel(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const TopPerformingChannelwat = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    // console.log(viewType, "viewTypeeeeeee");
    post(properties.INTERACTION_API + "/top-performing-channel", requestBody)
      .then((response) => {
        // setTopPerforming(response.data);
        if (response.data && response.data.length === 0) {
          setTopPerforming("0");
        } else {
          setTopPerforming(response.data);
        }

        // console.log(count, "performing");
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const Revenuechannelwat = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    post(properties.ORDER_API + "/revenue-by-channel", requestBody)
      .then((response) => {
        setRevenue(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const ChatHistorywat = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    post(properties.CHAT_API + "/history", requestBody)
      .then((response) => {
        let repdata = response.data;
        if (response.data && response.data.length === 0) {
          setChatHistory("0");
        } else {
          setChatHistory(response.data);
        }
      })
      .catch((error) => {
        console.error("errorIN CHATHISTORY", error);
      })
      .finally();
    // console.log(setChatHistory, "SetHistortchat");
  };

  const [intxnCategory, setIntxnCategory] = useState();
  const Categorywat = (filterCleared = false, intxnCategory) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    if (intxnCategory && intxnCategory?.length > 0) {
      setIntxnCategory(intxnCategory)
      requestBody.intxnCategory = intxnCategory
    }
    post(properties.INTERACTION_API + "/category", requestBody)
      .then((response) => {
        setCategory(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const InteractionCornerWat = (filterCleared = false, intxnType) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    if (intxnType && intxnType?.length > 0) {
      setIntxnType(intxnType)
      requestBody.intxnType = intxnType
    }
    post(properties.INTERACTION_API + "/corner", requestBody)
      .then((response) => {
        setCorner(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const OrderCornerWat = (filterCleared = false, orderType) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    if (orderType && orderType?.length > 0) {
      setOrderType(orderType);
      requestBody.orderType = orderType
    }
    post(properties.ORDER_API + "/corner", requestBody)
      .then((response) => {
        setOrder(response.data);
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  };

  const IssueSovedWat = (filterCleared = false) => {
    if (filterCleared) {
      requestBody["searchParams"]["startDate"] = "";
      requestBody["searchParams"]["endDate"] = "";
    }
    requestBody.searchParams["channel"] = viewType;
    post(properties.INTERACTION_API + "/issues-solved-by-channel", requestBody)
      .then((response) => {

        const result = {};

        // Iterate through the data and count occurrences
        response.data && response.data?.length > 0 && response.data.forEach(entry => {
          const { channel, is_resolved_by } = entry;

          // Skip entries with missing or invalid channel or resolution
          if (!channel || !is_resolved_by) {
            return;
          }

          // Create the channel object if it doesn't exist
          if (!result[channel]) {
            result[channel] = {
              bot: 0,
              human: 0
            };
          }

          // Increment the respective resolution count
          result[channel][is_resolved_by.toLowerCase()]++;
        });

        // console.log('result---------sss------->', result)
        setIssueResolvedwalkin(result);

      })
      .catch((error) => {
        console.error("error", error);
      });
  };

  const totalinteraction = () => {
    setSearchParams({});
  };

  //////ALLL CHANNEL
  const allchannel = () => {
    TotalInterctionCount();
    TotalOrder();
    TotalAppointment();
    TopSalesByChannel();
    TopChannelsByOrder();
    ProspectChannel();
    ProblemSolvingChannel();
    LiveSupport();
    TotalChatChannel();
    AbandonedChannel();
    AverageResponse();
    AverageHandling();
    TurnArrounds();
    IssueSolvedChannel();
    TopPerformingChannel();
    RevenueChannel();
    TopCustomersByChannel();
    TotalRevenueByChannel();
  };

  //////////////
  const watapp = (e) => {
    // console.log(e, "ee");
    TopPerformingChannelwat();
    Revenuechannelwat();
    ChatHistorywat();
    Categorywat();
    InteractionCornerWat();
    OrderCornerWat();
    IssueSovedWat();
    TotalAppointment();
    ProspectChannel();
    TotalRevenueByChannel();
    AveragePerformanceByChannel();
    TopSalesByChannel();
    TopChannelsByOrder();
  };
  /////WATAPP

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo)
  }

  const [masterLookupData, setMasterLookupData] = useState({});
  useEffect(() => {
    get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=SERVICE_TYPE,PRODUCT_FAMILY,ORDER_TYPE,INTXN_TYPE,INTXN_CATEGORY')
      .then((response) => {
        const { data } = response;
        setMasterLookupData({ ...data });
      })
      .catch(error => {
        console.error(error);
      });
  }, [])

  const orderTypeList = masterLookupData?.ORDER_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));

  const intxnTypeList = masterLookupData?.INTXN_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));

  const intxnCatList = masterLookupData?.INTXN_CATEGORY?.map(elm => ({ label: elm?.description, value: elm?.code }));


  const componentRef = useRef()
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => document.title = 'dtWorks',
    pageStyle: pageStyle
  });

  return (
    <OmniChannelDashboardContext.Provider value={contextProvider}>
      <div className="content-page" style={{ margin: 0 }}>
        <div className="content" ref={componentRef}>
          <div className="">
            <div className="cnt-wrapper">
              <div className="card-skeleton">
                <div className="customer-skel">
                  <div className="row">
                    <div className="col-md-2">
                    </div>
                    <div className="col-md-12">
                      <div className="tab-content">
                        <div
                          className="tab-pane fade show active"
                          id="me"
                          role="tabpanel"
                          aria-labelledby="me-tab"
                        >
                          <div className="skle-swtab-sect">
                            <div></div>
                            <form className="form-inline">
                              {/* <button type="button" className="skel-btn-export" onClick={() => handlePrint()}>
                                Export
                              </button> */}
                              <span className="ml-1">Auto Refresh</span>
                              <div className="switchToggle ml-1">
                                <input
                                  id="switch1"
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={handleAutoRefresh}
                                  onClick={totalinteraction}
                                />
                                <label htmlFor="switch1">Toggle</label>
                              </div>
                              <button
                                type="button"
                                className="ladda-button  btn btn-secondary btn-xs ml-1"
                                dir="ltr"
                                data-style="slide-left"
                              >
                                <span
                                  className="ladda-label"
                                  onClick={() =>
                                    setIsPageRefresh(!isPageRefresh)
                                  }
                                >
                                  <i
                                    className="material-icons"
                                    onClick={totalinteraction}
                                  >
                                    refresh
                                  </i>
                                </span>
                                <span className="ladda-spinner"></span>
                              </button>
                              <select
                                className="custom-select custom-select-sm ml-1"
                                defaultValue={"Set"}
                                value={pageRefreshTime}
                                onChange={handleSetRefreshTime}
                              >
                                <option value="Set">Set</option>
                                <option value={Number(1)}>1 Min</option>
                                <option value={Number(5)}>5 Min</option>
                                <option value={Number(15)}>15 Min</option>
                                <option value={Number(30)}>30 Min</option>
                              </select>
                              <div className="db-list mb-0 pl-1">
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
                            </form>
                          </div>
                          <hr className="cmmn-hline" />
                          <div>
                            <Filter
                              data={{
                                showFilter,
                                searchParams,
                                isParentRefresh: isPageRefresh,
                                masterLookupData,
                                startDate,
                                endDate
                                // excelFilter,
                                // showRealTime,
                              }}
                              handler={{
                                setShowFilter,
                                setSearchParams,
                                isParentRefresh: isPageRefresh,
                                // setExcelFilter,
                              }}
                            />
                            <div className="db-list mb-0 pl-0">
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('ALL') && <a className="skel-fr-sel-cust">
                                <div
                                  value={viewType}
                                  className={`list-dashboard skel-self ${viewType === "skel-channel-all"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("skel-channel-all");
                                    allchannel();
                                  }}
                                >
                                  <span className="db-title">All</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('WHATSAPP-LIVECHAT') && <a className="skel-fr-sel-serv">
                                <div
                                  value={viewType}
                                  className={`list-dashboard skel-informative ${viewType === "WHATSAPP-LIVECHAT"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType(" ");
                                    setViewType("WHATSAPP-LIVECHAT");
                                  }}
                                >
                                  <span className="db-title">WhatsApp</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('FB-LIVECHAT') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "FB-LIVECHAT"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("FB-LIVECHAT");
                                  }}
                                >
                                  <span className="db-title">Facebook</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('TELEGRAM') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "TELEGRAM"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("TELEGRAM");
                                  }}
                                >
                                  <span className="db-title">Telegram</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('INSTAGRAM') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "INSTAGRAM"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("INSTAGRAM");
                                  }}
                                >
                                  <span className="db-title">Instagram</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('EMAIL') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "EMAIL" ? "db-list-active" : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("EMAIL");
                                  }}
                                >
                                  <span className="db-title">Email</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('MOBILEAPP') &&
                                <a className="skel-fr-sel-serv">
                                  <div
                                    className={`list-dashboard skel-informative  ${viewType === "MOBILEAPP"
                                      ? "db-list-active"
                                      : ""
                                      }`}
                                    onClick={() => {
                                      setViewType("");
                                      setViewType("MOBILEAPP");
                                    }}
                                  >
                                    <span className="db-title">Mobile App</span>
                                  </div>
                                </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('SELFCARE') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "SELFCARE"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("SELFCARE");
                                  }}
                                >
                                  <span className="db-title">SelfCare</span>
                                </div>
                              </a>}
                              {appsConfig?.clientConfig?.omniChannelDashboard?.activeChannel.includes('IVR') && <a className="skel-fr-sel-serv">
                                <div
                                  className={`list-dashboard skel-informative  ${viewType === "IVR"
                                    ? "db-list-active"
                                    : ""
                                    }`}
                                  onClick={() => {
                                    setViewType("");
                                    setViewType("IVR");
                                  }}
                                >
                                  <span className="db-title">IVR</span>
                                </div>
                              </a>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OmniChannel */}

                      {viewType === "skel-channel-all" && (
                        <div className="skel-omni-channel-base-all">
                          <div className="skel-omni-channel-lst">
                            {overallRevenue.map((x) => (
                              <div className="skel-omni-rev-chnl-base-all skel-omni-chnl-whtapp">
                                {(x.channel === "Whatsapp Live Chat" ||
                                  x.channel === "IVR") && (
                                    <span>
                                      <i className="fab fa-whatsapp"></i>
                                    </span>
                                  )}
                                {(x.channel === "Mobile APP" ||
                                  x.channel === "SelfCare") && (
                                    <span>
                                      <i className="fas fa-mobile-alt"></i>
                                    </span>
                                  )}
                                <span className="skel-omni-tot-revenue-all">
                                  {x.count}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Ganesh - Added by static content  */}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.OverallRevenueByChannel?.isActive && <OverallRevenueByChannel data={{ searchParams }} handler={{ getChannelIcon, getChannelNewClassName }} />}

                          {/* <div class="wa-detail-list">
                              <span class="skel-header-title">Whatsapp</span>
                              <div className="row row-cols-5 mx-lg-n1 mt-2">
                                <div className="col px-lg-1">
                                    <div className="card wa-interaction">
                                      <div className="card-body">
                                        <svg width="86" height="71" viewBox="0 0 86 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M52.3096 24.1221C52.3096 26.6888 50.2095 28.7889 47.6428 28.7889H5.64198C3.07526 28.7889 0.97522 26.6888 0.97522 24.1221C0.97522 21.5554 3.07526 19.4554 5.64198 19.4554H47.6428C50.2095 19.4554 52.3096 21.5554 52.3096 24.1221ZM0.97522 5.45509C0.97522 8.0218 3.07526 10.1218 5.64198 10.1218H47.6428C50.2095 10.1218 52.3096 8.0218 52.3096 5.45509C52.3096 2.88837 50.2095 0.78833 47.6428 0.78833H5.64198C3.07526 0.78833 0.97522 2.88837 0.97522 5.45509ZM33.6425 42.7891C33.6425 40.2224 31.5425 38.1224 28.9758 38.1224H5.64198C3.07526 38.1224 0.97522 40.2224 0.97522 42.7891C0.97522 45.3559 3.07526 47.4559 5.64198 47.4559H28.9758C31.5425 47.4559 33.6425 45.3559 33.6425 42.7891ZM71.0233 32.849L74.3367 29.5356C74.7684 29.1029 75.2812 28.7597 75.8458 28.5255C76.4103 28.2913 77.0155 28.1708 77.6267 28.1708C78.2379 28.1708 78.8431 28.2913 79.4077 28.5255C79.9722 28.7597 80.485 29.1029 80.9168 29.5356L84.2302 32.849C86.0502 34.669 86.0502 37.609 84.2302 39.4291L80.9168 42.7425L71.0233 32.849ZM67.7099 36.1624L43.6294 60.2428C43.2094 60.6628 42.976 61.2228 42.976 61.8762V68.4563C42.976 69.763 44.0027 70.7897 45.3094 70.7897H51.8895C52.4962 70.7897 53.1029 70.5564 53.5229 70.0897L77.6034 46.0092L67.7099 36.1624Z" fill="white"/>
                                        </svg>
                                        <p className="wa-title">Interaction</p>
                                        <p className="wa-value">1000</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card wa-order">
                                      <div className="card-body">
                                        <svg width="78" height="78" viewBox="0 0 78 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M55.0678 66.6258L68.4103 53.3793L64.3788 49.3478L55.0678 58.4667L51.3243 54.7231L47.2927 58.8507L55.0678 66.6258ZM11.7767 23.4307H57.8515V15.7516H11.7767V23.4307ZM57.8515 77.1846C52.5401 77.1846 48.012 75.3122 44.2671 71.5673C40.5223 67.8225 38.6511 63.2956 38.6537 57.9868C38.6537 52.6754 40.5261 48.1473 44.271 44.4024C48.0158 40.6575 52.5427 38.7864 57.8515 38.789C63.1629 38.789 67.691 40.6614 71.4359 44.4062C75.1807 48.1511 77.0519 52.6779 77.0493 57.9868C77.0493 63.2982 75.1769 67.8263 71.4321 71.5712C67.6872 75.316 63.1604 77.1872 57.8515 77.1846ZM0.258057 73.345V8.07244C0.258057 5.96068 1.01061 4.15225 2.51572 2.64714C4.02083 1.14203 5.82798 0.390757 7.93718 0.393317H61.6911C63.8028 0.393317 65.6113 1.14587 67.1164 2.65098C68.6215 4.15609 69.3728 5.96324 69.3702 8.07244V33.7015C68.1544 33.1256 66.9065 32.6457 65.6266 32.2617C64.3468 31.8777 63.0349 31.5898 61.6911 31.3978V8.07244H7.93718V62.0183H31.2625C31.5825 64.0021 32.0791 65.8899 32.7523 67.6817C33.4255 69.4735 34.3047 71.1693 35.3901 72.7691L34.8141 73.345L29.0548 67.5857L23.2954 73.345L17.5361 67.5857L11.7767 73.345L6.0174 67.5857L0.258057 73.345ZM11.7767 54.1472H31.2625C31.4545 52.8034 31.7425 51.4915 32.1264 50.2117C32.5104 48.9318 32.9903 47.6839 33.5663 46.4681H11.7767V54.1472ZM11.7767 38.789H39.0377C41.4694 36.4212 44.3017 34.5488 47.5346 33.1717C50.7675 31.7946 54.2065 31.1073 57.8515 31.1098H11.7767V38.789Z" fill="white"/>
                                        </svg>
                                        <p className="wa-title">Order</p>
                                        <p className="wa-value">1000</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card wa-appointment">
                                      <div className="card-body">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="70" height="78" viewBox="0 0 70 78" fill="none">
                                          <path d="M8.19428 77.1847C6.07668 77.1847 4.26324 76.43 2.75396 74.9208C1.24469 73.4115 0.491336 71.5993 0.493903 69.4843V15.5817C0.493903 13.4641 1.24854 11.6506 2.75781 10.1413C4.26709 8.63207 6.07924 7.87872 8.19428 7.88128H12.0445V0.180908H19.7448V7.88128H50.5463V0.180908H58.2467V7.88128H62.0969C64.2145 7.88128 66.028 8.63592 67.5372 10.1452C69.0465 11.6545 69.7999 13.4666 69.7973 15.5817V69.4843C69.7973 71.6019 69.0427 73.4153 67.5334 74.9246C66.0241 76.4339 64.2119 77.1872 62.0969 77.1847H8.19428ZM8.19428 69.4843H62.0969V30.9824H8.19428V69.4843ZM8.19428 23.282H62.0969V15.5817H8.19428V23.282ZM35.1456 46.3832C34.0547 46.3832 33.1396 46.0135 32.4004 45.2743C31.6612 44.5351 31.2928 43.6213 31.2954 42.533C31.2954 41.4421 31.665 40.527 32.4043 39.7878C33.1435 39.0486 34.0573 38.6802 35.1456 38.6828C36.2365 38.6828 37.1515 39.0524 37.8908 39.7916C38.63 40.5309 38.9984 41.4447 38.9958 42.533C38.9958 43.6239 38.6262 44.5389 37.8869 45.2782C37.1477 46.0174 36.2339 46.3857 35.1456 46.3832ZM19.7448 46.3832C18.654 46.3832 17.7389 46.0135 16.9997 45.2743C16.2604 44.5351 15.8921 43.6213 15.8947 42.533C15.8947 41.4421 16.2643 40.527 17.0035 39.7878C17.7427 39.0486 18.6565 38.6802 19.7448 38.6828C20.8357 38.6828 21.7508 39.0524 22.49 39.7916C23.2293 40.5309 23.5976 41.4447 23.595 42.533C23.595 43.6239 23.2254 44.5389 22.4862 45.2782C21.7469 46.0174 20.8332 46.3857 19.7448 46.3832ZM50.5463 46.3832C49.4555 46.3832 48.5404 46.0135 47.8012 45.2743C47.0619 44.5351 46.6936 43.6213 46.6962 42.533C46.6962 41.4421 47.0658 40.527 47.805 39.7878C48.5443 39.0486 49.458 38.6802 50.5463 38.6828C51.6372 38.6828 52.5523 39.0524 53.2915 39.7916C54.0308 40.5309 54.3991 41.4447 54.3965 42.533C54.3965 43.6239 54.0269 44.5389 53.2877 45.2782C52.5484 46.0174 51.6347 46.3857 50.5463 46.3832ZM35.1456 61.7839C34.0547 61.7839 33.1396 61.4143 32.4004 60.6751C31.6612 59.9358 31.2928 59.022 31.2954 57.9337C31.2954 56.8428 31.665 55.9278 32.4043 55.1885C33.1435 54.4493 34.0573 54.081 35.1456 54.0835C36.2365 54.0835 37.1515 54.4532 37.8908 55.1924C38.63 55.9316 38.9984 56.8454 38.9958 57.9337C38.9958 59.0246 38.6262 59.9397 37.8869 60.6789C37.1477 61.4181 36.2339 61.7865 35.1456 61.7839ZM19.7448 61.7839C18.654 61.7839 17.7389 61.4143 16.9997 60.6751C16.2604 59.9358 15.8921 59.022 15.8947 57.9337C15.8947 56.8428 16.2643 55.9278 17.0035 55.1885C17.7427 54.4493 18.6565 54.081 19.7448 54.0835C20.8357 54.0835 21.7508 54.4532 22.49 55.1924C23.2293 55.9316 23.5976 56.8454 23.595 57.9337C23.595 59.0246 23.2254 59.9397 22.4862 60.6789C21.7469 61.4181 20.8332 61.7865 19.7448 61.7839ZM50.5463 61.7839C49.4555 61.7839 48.5404 61.4143 47.8012 60.6751C47.0619 59.9358 46.6936 59.022 46.6962 57.9337C46.6962 56.8428 47.0658 55.9278 47.805 55.1885C48.5443 54.4493 49.458 54.081 50.5463 54.0835C51.6372 54.0835 52.5523 54.4532 53.2915 55.1924C54.0308 55.9316 54.3991 56.8454 54.3965 57.9337C54.3965 59.0246 54.0269 59.9397 53.2877 60.6789C52.5484 61.4181 51.6347 61.7865 50.5463 61.7839Z" fill="white"/>
                                        </svg>
                                        <p className="wa-title">Appointment</p>
                                        <p className="wa-value">1000</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card wa-sales">
                                      <div className="card-body">
                                        <svg width="99" height="99" viewBox="0 0 99 99" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M49.163 0.592773C50.0714 0.592773 50.9425 0.953607 51.5848 1.59589C52.2271 2.23818 52.5879 3.10931 52.5879 4.01764V13.1506C52.5879 14.059 52.2271 14.9301 51.5848 15.5724C50.9425 16.2147 50.0714 16.5755 49.163 16.5755C48.2547 16.5755 47.3836 16.2147 46.7413 15.5724C46.099 14.9301 45.7382 14.059 45.7382 13.1506V4.01764C45.7382 3.10931 46.099 2.23818 46.7413 1.59589C47.3836 0.953607 48.2547 0.592773 49.163 0.592773ZM78.9822 19.8634C79.6236 20.5055 79.9839 21.376 79.9839 22.2836C79.9839 23.1912 79.6236 24.0617 78.9822 24.7039L77.4159 26.2702C76.7667 26.8751 75.908 27.2045 75.0207 27.1888C74.1334 27.1732 73.2869 26.8137 72.6594 26.1862C72.0319 25.5587 71.6724 24.7122 71.6568 23.8249C71.6411 22.9376 71.9705 22.0789 72.5755 21.4297L74.1418 19.8634C74.7839 19.222 75.6544 18.8618 76.562 18.8618C77.4696 18.8618 78.3401 19.222 78.9822 19.8634ZM19.3438 19.8634C19.986 19.222 20.8565 18.8618 21.7641 18.8618C22.6717 18.8618 23.5422 19.222 24.1843 19.8634L25.7552 21.4297C26.3788 22.0759 26.7236 22.9412 26.7153 23.8392C26.7071 24.7372 26.3465 25.596 25.7112 26.2307C25.0759 26.8654 24.2168 27.2252 23.3188 27.2326C22.4208 27.24 21.5558 26.8943 20.9102 26.2702L19.3438 24.7039C18.7025 24.0617 18.3422 23.1912 18.3422 22.2836C18.3422 21.376 18.7025 20.5055 19.3438 19.8634ZM48.9073 30.8778C48.0991 31.928 47.1584 33.604 45.656 36.2982L44.9071 37.6407L44.7381 37.9467C44.0988 39.0974 43.3499 40.4583 42.1124 41.399C40.8566 42.3579 39.3359 42.6913 38.0893 42.9698L37.7605 43.0429L36.3084 43.3717C33.3858 44.0293 31.5912 44.4494 30.4085 44.9152C30.2168 44.985 30.0306 45.0689 29.8513 45.1663C29.9153 45.3124 30.0294 45.5271 30.2121 45.8193C30.9199 46.9427 32.1529 48.3994 34.1393 50.7192L35.1302 51.8791L35.3494 52.1348C36.2079 53.1348 37.2125 54.2947 37.6783 55.788C38.135 57.2584 37.9797 58.7882 37.8427 60.1261L37.8107 60.4641L37.66 62.0075C37.3587 65.1082 37.1806 67.0535 37.2399 68.4143C37.2536 68.6746 37.2719 68.8755 37.2947 69.0308C37.4043 69.008 37.5322 68.976 37.692 68.9303C38.9113 68.5787 40.5963 67.8115 43.3362 66.5558L44.697 65.9256L45.003 65.784C46.1629 65.2452 47.5876 64.5785 49.163 64.5785C50.7385 64.5785 52.1632 65.2452 53.3186 65.784L53.6291 65.9256L54.9899 66.5512C57.7298 67.8116 59.4148 68.5787 60.6341 68.9258C60.7939 68.9714 60.9218 69.008 61.0314 69.0308C61.0612 68.8265 61.0795 68.6207 61.0862 68.4143C61.1455 67.0535 60.9629 65.1082 60.666 62.0121L60.5153 60.4641L60.4834 60.1216C60.3464 58.7882 60.1957 57.2584 60.6523 55.7834C61.1136 54.2993 62.1136 53.1348 62.9767 52.1348L63.1959 51.8791L64.1868 50.7192C66.1732 48.3994 67.4062 46.9427 68.114 45.8193C68.2966 45.5271 68.4108 45.317 68.4793 45.1663C68.297 45.0719 68.1095 44.9881 67.9176 44.9152C66.7303 44.4494 64.9403 44.0293 62.0177 43.3717L60.561 43.0429L60.2414 42.9698C58.9901 42.6913 57.4695 42.3534 56.2137 41.399C54.9808 40.4628 54.2227 39.0974 53.588 37.9467C53.5319 37.8445 53.4756 37.7426 53.419 37.6407L52.6701 36.2982C51.1677 33.604 50.2225 31.928 49.4188 30.8778C49.3365 30.7689 49.2512 30.6623 49.163 30.5581C49.0749 30.6623 48.9896 30.7689 48.9073 30.8778ZM68.7305 45.3353L68.6985 45.3033C68.7259 45.3216 68.735 45.3353 68.7305 45.3353ZM68.5661 44.9243C68.5661 44.8969 68.5706 44.8786 68.5752 44.8786L68.5661 44.9243ZM61.4423 69.0947C61.4652 69.0856 61.4789 69.0856 61.4834 69.0902L61.4423 69.0947ZM37.3815 69.4281C37.3877 69.4379 37.3924 69.4487 37.3952 69.4601C37.3952 69.4601 37.3861 69.4509 37.3815 69.4281ZM29.6276 45.3079L29.5956 45.3398C29.5956 45.3398 29.6002 45.3261 29.6276 45.3079ZM43.4641 26.7177C44.6513 25.1742 46.4414 23.4298 49.163 23.4298C51.8847 23.4298 53.6747 25.1742 54.8575 26.7177C56.0036 28.2155 57.1909 30.3435 58.5289 32.7455L59.4011 34.3118C59.7005 34.8639 60.0203 35.4046 60.3601 35.9329C60.9267 36.098 61.4994 36.2411 62.0771 36.3621L63.7804 36.7503C66.3696 37.3348 68.6939 37.8599 70.4292 38.5449C72.2878 39.2755 74.3427 40.5222 75.1327 43.0703C75.9136 45.5819 74.9729 47.7829 73.9134 49.4725C72.9042 51.0708 71.3288 52.9111 69.557 54.9888L68.4017 56.336C68.0244 56.7633 67.6619 57.2034 67.3149 57.6557C67.2728 57.7118 67.2332 57.7697 67.1961 57.8292V58.0575C67.2007 58.4228 67.2418 58.9115 67.3331 59.8065L67.5066 61.6011C67.7761 64.373 68.009 66.8206 67.9268 68.7249C67.84 70.6884 67.3788 73.0904 65.2645 74.6978C63.0908 76.3509 60.6386 76.0586 58.7481 75.5198C56.958 75.0038 54.7844 74.0037 52.3642 72.8895L52.1221 72.7799L50.7659 72.1543C50.2406 71.9012 49.706 71.6682 49.163 71.4556C48.6217 71.6668 48.0886 71.8983 47.5648 72.1497L45.9665 72.8895C43.5417 74.0037 41.368 75.0038 39.578 75.5198C37.6874 76.0586 35.2398 76.3509 33.0616 74.6978C30.9427 73.0904 30.4861 70.6884 30.3993 68.7249C30.3126 66.8161 30.55 64.373 30.8194 61.6011L30.993 59.8065C31.0843 58.9115 31.1254 58.4228 31.13 58.0621V57.8292C31.0929 57.7697 31.0533 57.7118 31.0112 57.6557C30.6644 57.2033 30.3019 56.7631 29.9244 56.336L28.7691 54.9888C26.9973 52.9111 25.4218 51.0754 24.4126 49.4725C23.3532 47.7829 22.4125 45.5819 23.1934 43.0703C23.9834 40.5222 26.0383 39.2801 27.8969 38.5495C29.6322 37.8645 31.9565 37.3348 34.5457 36.7503L34.7969 36.6955L36.249 36.3667C36.8267 36.2442 37.3995 36.0995 37.966 35.9329C38.3056 35.4046 38.6255 34.8638 38.925 34.3118L39.6693 32.9692L39.7972 32.7455C41.1352 30.3435 42.3224 28.2155 43.4686 26.7177H43.4641ZM0.0732422 49.6826C0.0732422 48.7742 0.434076 47.9031 1.07636 47.2608C1.71865 46.6185 2.58978 46.2577 3.49811 46.2577H12.6311C13.5394 46.2577 14.4106 46.6185 15.0528 47.2608C15.6951 47.9031 16.056 48.7742 16.056 49.6826C16.056 50.5909 15.6951 51.462 15.0528 52.1043C14.4106 52.7466 13.5394 53.1074 12.6311 53.1074H3.49811C2.58978 53.1074 1.71865 52.7466 1.07636 52.1043C0.434076 51.462 0.0732422 50.5909 0.0732422 49.6826ZM82.2701 49.6826C82.2701 48.7742 82.631 47.9031 83.2732 47.2608C83.9155 46.6185 84.7867 46.2577 85.695 46.2577H94.828C95.7363 46.2577 96.6074 46.6185 97.2497 47.2608C97.892 47.9031 98.2528 48.7742 98.2528 49.6826C98.2528 50.5909 97.892 51.462 97.2497 52.1043C96.6074 52.7466 95.7363 53.1074 94.828 53.1074H85.695C84.7867 53.1074 83.9155 52.7466 83.2732 52.1043C82.631 51.462 82.2701 50.5909 82.2701 49.6826ZM25.7506 73.095C26.392 73.7372 26.7522 74.6076 26.7522 75.5152C26.7522 76.4228 26.392 77.2933 25.7506 77.9355L24.1843 79.5018C23.5351 80.1067 22.6764 80.4361 21.7891 80.4204C20.9018 80.4048 20.0553 80.0453 19.4278 79.4178C18.8003 78.7904 18.4408 77.9438 18.4252 77.0565C18.4095 76.1692 18.7389 75.3105 19.3438 74.6613L20.9102 73.095C21.5523 72.4536 22.4228 72.0934 23.3304 72.0934C24.238 72.0934 25.1085 72.4536 25.7506 73.095ZM72.5709 73.095C72.8889 72.7767 73.2666 72.5243 73.6823 72.352C74.0979 72.1797 74.5435 72.0911 74.9934 72.0911C75.4434 72.0911 75.8889 72.1797 76.3046 72.352C76.7202 72.5243 77.0979 72.7767 77.4159 73.095L78.9822 74.6613C79.5872 75.3105 79.9166 76.1692 79.9009 77.0565C79.8852 77.9438 79.5258 78.7904 78.8983 79.4178C78.2708 80.0453 77.4243 80.4048 76.537 80.4204C75.6497 80.4361 74.791 80.1067 74.1418 79.5018L72.5755 77.9355C71.9341 77.2933 71.5738 76.4228 71.5738 75.5152C71.5738 74.6076 71.9341 73.7372 72.5755 73.095H72.5709ZM49.163 82.7896C50.0714 82.7896 50.9425 83.1505 51.5848 83.7928C52.2271 84.4351 52.5879 85.3062 52.5879 86.2145V95.3475C52.5879 96.2558 52.2271 97.127 51.5848 97.7693C50.9425 98.4115 50.0714 98.7724 49.163 98.7724C48.2547 98.7724 47.3836 98.4115 46.7413 97.7693C46.099 97.127 45.7382 96.2558 45.7382 95.3475V86.2145C45.7382 85.3062 46.099 84.4351 46.7413 83.7928C47.3836 83.1505 48.2547 82.7896 49.163 82.7896Z" fill="white"/>
                                        </svg>
                                        <p className="wa-title">Total Sales</p>
                                        <p className="wa-value">1000</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card wa-performance">
                                      <div className="card-body">
                                        <svg width="92" height="51" viewBox="0 0 92 51" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.98321 33.9603L11.0526 34.25L29.9671 15.3356C29.5876 13.9458 29.587 12.4797 29.9655 11.0896C30.3439 9.69954 31.0876 8.43609 32.1192 7.43046C35.3475 4.16079 40.5624 4.16079 43.7907 7.43046C45.9843 9.58265 46.6879 12.6454 45.9429 15.3356L56.5797 25.9724L58.6491 25.6827C59.3941 25.6827 60.0977 25.6827 60.7185 25.9724L75.4941 11.1968C75.2044 10.576 75.2044 9.87237 75.2044 9.12738C75.2044 6.93201 76.0765 4.82656 77.6289 3.2742C79.1812 1.72184 81.2867 0.849731 83.482 0.849731C85.6774 0.849731 87.7829 1.72184 89.3352 3.2742C90.8876 4.82656 91.7597 6.93201 91.7597 9.12738C91.7597 11.3227 90.8876 13.4282 89.3352 14.9806C87.7829 16.5329 85.6774 17.405 83.482 17.405C82.7371 17.405 82.0335 17.405 81.4126 17.1153L66.637 31.8909C66.9268 32.5117 66.9268 33.2153 66.9268 33.9603C66.9268 36.1557 66.0546 38.2611 64.5023 39.8135C62.9499 41.3659 60.8445 42.238 58.6491 42.238C56.4537 42.238 54.3483 41.3659 52.7959 39.8135C51.2436 38.2611 50.3715 36.1557 50.3715 33.9603L50.6612 31.8909L40.0244 21.2541C38.7 21.5439 37.21 21.5439 35.8856 21.2541L16.9711 40.1686L17.2609 42.238C17.2609 44.4333 16.3888 46.5388 14.8364 48.0912C13.284 49.6435 11.1786 50.5156 8.98321 50.5156C6.78785 50.5156 4.68239 49.6435 3.13003 48.0912C1.57767 46.5388 0.705566 44.4333 0.705566 42.238C0.705566 40.0426 1.57767 37.9372 3.13003 36.3848C4.68239 34.8324 6.78785 33.9603 8.98321 33.9603Z" fill="white"/>
                                        </svg>
                                        <p className="wa-title">Avg. Performance</p>
                                        <p className="wa-value">1000</p>
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div>

                            <div class="wa-detail-list-1">
                              <div className="row row-cols-5 mx-lg-n1 mt-2">
                                <div className="col px-lg-1">
                                    <div className="card pg">
                                      <div className="card-body">
                                        <p className="wa-title">Prospect Generated</p>
                                        <p className="wa-value">1500k</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card tc">
                                      <div className="card-body">
                                        <p className="wa-title">Total Customers</p>
                                        <p className="wa-value">1500k</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col px-lg-1">
                                    <div className="card ls">
                                      <div className="card-body">
                                        <p className="wa-title">Live Support</p>
                                        <p className="wa-value">150</p>
                                      </div>
                                    </div>
                                  </div>
                                <div className="col-4 px-lg-1 col-with-5">
                                    <div className="card isb">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-4 align-content-center border-r">
                                          <p className="wa-title">Issues Solved By</p>
                                          </div>
                                          <div className="col-md">
                                          <p className="wa-value pl-3"><span className="font-weight-normal w-25 d-inline-block mr-3">BOTS</span> 80%</p>
                                          <p className="wa-value pl-3"><span className="font-weight-normal w-25 d-inline-block mr-3">Humans</span> 20%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div> */}

                          {/* <div class="skel-omni-revenue-channel mt-2">
                            <span class="skel-header-title">Revenue By Channels</span>
                              <div className="row row-cols-4 mx-lg-n1 mt-2">
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-w">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fab fa-whatsapp icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-f">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fab fab fa-facebook icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-t">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fab fa-telegram icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-i">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fab fa-instagram icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-ma">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fas fa-mobile-alt icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-web">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fas fa-globe icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col px-lg-1 mb-2">
                                    <div className="card card-rc-email">
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-auto">
                                            <i class="fas fa-envelope icon"></i>
                                          </div>
                                          <div className="col-md">
                                            <p className="mb-0 text-v">Monthly Avg</p>
                                            <p className="font-weight-bold my-0 text-v">$500</p>
                                          </div>
                                        </div>
                                        <hr className="my-2" />
                                        <div className="row">
                                          <div className="col-md-6 text-center border-right">
                                            <p className="my-0 text-secondary">Prev. Month</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-danger font-12"><i class="fas fa-caret-down"></i> -31.5%</p>
                                          </div>
                                          <div className="col-md-6 text-center">
                                            <p className="my-0 text-secondary">Today</p>
                                            <p className="my-0 font-weight-bold">$1000k</p>
                                            <p className="my-0 text-success font-12"><i class="fas fa-caret-up"></i> +31.5%</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div> */}



                          {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.topPerformingChannels?.isActive &&
                            <TopPerformingChannels data={{ topPerforming }} handlers={{ getChannelIcon, getChannelNewClassName }} />}



                          {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.revenueByChannels?.isActive && revenue?.length > 0 && <div className="skel-reve-by-chnl-wise mt-2">
                            <span className="skel-header-title">
                              Revenue By Channels
                            </span>

                            <div className="skel-rev-chnl-list">
                              {revenue?.length > 0 && revenue?.map((ele) => {
                                return <div className="skel-rev-chnl-by-list fb-rev-brd">
                                  <div className="skel-rev-chnl-top-sect">
                                    <span className={getChannelClassName(ele?.oOrderChannel) + " text-center font-38"}>
                                      {/* {getChannelIcon(ele?.oOrderChannel)} */}
                                      <i className={
                                        ele?.oOrderChannel === 'Email' ? "fas fa-envelope"

                                          : ele?.oOrderChannel === 'IVR' ? "fas fa-walking"

                                            : ele?.oOrderChannel === 'Whatsapp Live Chat' ? "fab fa-whatsapp"

                                              : ele?.oOrderChannel === 'SelfCare' ? "fas fa-globe"

                                                : ele?.oOrderChannel === 'Mobile APP' ? "fas fa-mobile-alt"

                                                  : (ele?.oOrderChannel === 'Facebook Live Chat' || ele?.oOrderChannel === 'FB Live Chat') ? "fab fa-facebook"

                                                    : ele?.oOrderChannel === 'Telegram' ? "fab fa-telegram"

                                                      : ele?.oOrderChannel === 'Instagram' ? "fab fa-instagram"
                                                        : ""}></i>
                                    </span>
                                    <p className="ml-2">
                                      <span>Monthly Avg.</span>
                                      <span className="font-lg-size">${ele?.oMonthlyAvg || 0}</span>
                                    </p>
                                  </div>
                                  <hr className="cmmn-hline" />
                                  <div className="skel-rev-prev-td-info">
                                    <div className="skel-rev-pre-month">
                                      <span className="skel-rev-lbl">
                                        Prev. Month
                                      </span>
                                      <span className="font-lg-size">${ele?.oPrevMonthAvg || 0}</span>
                                    </div>
                                    <div className="skel-rev-pre-month">
                                      <span className="skel-rev-lbl">Today</span>
                                      <span className="font-lg-size">${ele?.oDailySales || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              })}
                            </div>
                          </div>}


                          <div className="row row-cols-3 mx-lg-n1 mt-2">

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.interactionsByChannels?.isActive &&
                              <InteractionsByChannels data={{ count }} handlers={{ TotalInterctionCount, filterInteractionsByChannel, setIsInteractionByChannelPopupOpen }} />}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.ordersByChannels?.isActive &&
                              <OrdersByChannels data={{ orderCount }} handlers={{ TotalOrder, filterOrdersByChannel, setIsOrderByChannelPopupOpen }} />}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.AppointmentsByChannels?.isActive &&
                              <AppointmentsByChannels data={{ totalAppointment }} handlers={{ filterAppointmentsByChannel, setIsAppointmentByChannelPopupOpen, TotalAppointment }} />}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.prospectGeneratedByChannel?.isActive && <div className="col px-lg-1 mb-2"><div className="skel-omni-tot-info-by-chnl skel-top-5-perf-base-sect">
                              <div className="skel-top-title-icons">
                                <span className="skel-heading mb-1">
                                  Prospect Generated By Channel
                                </span>
                                <div className="skel-omni-chnl-icons">
                                  <a>
                                    <i
                                      className="material-icons"
                                      onClick={() => ProspectChannel(true)}
                                    >
                                      refresh
                                    </i>
                                  </a>

                                </div>
                              </div>

                              <hr className="cmmn-hline" />
                              <ul>
                                {prospect?.map((x) => (
                                  <li>
                                    <span>{x?.prospect_channel}</span>{" "}
                                    <span className={
                                      x?.prospect_channel === 'Email' ? "skel-count-chnl  bg-em-violet"
                                        : x?.prospect_channel === 'Whatsapp Live Chat' ? "skel-count-chnl bg-w-green"
                                          : x?.prospect_channel === 'Instagram' ? "skel-count-chnl bg-i-orange"
                                            : x?.prospect_channel === 'Telegram' ? "skel-count-chnl bg-t-blue"
                                              : x?.prospect_channel === 'Facebook Live Chat' ? "skel-count-chnl bg-f-blue"
                                                : (x?.prospect_channel === 'SelfCare' || x?.prospect_channel === 'Web Selfcare' || x?.prospect_channel === 'Web Application') ? "skel-count-chnl skel-omni-chnl-sc" :
                                                  "skel-count-chnl bg-sc-blue"}
                                      onClick={e => {
                                        filterProspectByChannel(x?.prospect_channel);
                                        setIsProspectByChannelPopupOpen(true);
                                      }}
                                    >
                                      <>{x?.count}</>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.liveSupportByChannel?.isActive && <div className="col px-lg-1 mb-2"><div className="skel-omni-tot-info-by-chnl skel-top-5-perf-base-sect">
                              <div className="skel-top-title-icons">
                                <span className="skel-heading mb-1">
                                  Live Support By Channel
                                </span>
                                <div className="skel-omni-chnl-icons">
                                  <a>
                                    <i
                                      className="material-icons"
                                      onClick={() => LiveSupport()}
                                    >
                                      refresh
                                    </i>
                                  </a>

                                </div>
                              </div>

                              <hr className="cmmn-hline" />
                              <ul>
                                {liveSupportDataByChannel.map((x) => (
                                  <li>
                                    <span>{x?.liveSupport_channel}</span>{" "}
                                    <span className={
                                      x?.liveSupport_channel === 'Email' ? "skel-count-chnl  bg-em-violet"
                                        : x?.liveSupport_channel === 'Whatsapp Live Chat' ? "skel-count-chnl bg-w-green"
                                          : x?.liveSupport_channel === 'Instagram' ? "skel-count-chnl bg-i-orange"
                                            : x?.liveSupport_channel === 'Telegram' ? "skel-count-chnl bg-t-blue"
                                              : x?.liveSupport_channel === 'Facebook Live Chat' ? "skel-count-chnl bg-f-blue"
                                                : (x?.liveSupport_channel === 'SelfCare' || x?.liveSupport_channel === 'Web Selfcare' || x?.liveSupport_channel === 'Web Application') ? "skel-count-chnl bg-i-orange" :
                                                  "skel-count-chnl bg-sc-blue"}
                                      onClick={e => {
                                        filterLiveSupportDataByChannel(x?.liveSupport_channel);
                                        setIsLiveSupportByChannelPopupOpen(true);
                                      }}>
                                      <>{x?.count}</>
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.totalCustomersByChannel?.isActive && <div className="col px-lg-1 mb-2"><div className="skel-omni-tot-info-by-chnl skel-top-5-perf-base-sect">
                              <div className="skel-top-title-icons">
                                <span className="skel-heading mb-1">
                                  Total {`${appsConfig?.clientFacingName?.customer ? appsConfig?.clientFacingName?.customer + 's' : ''}`} By Channel
                                </span>
                                <div className="skel-omni-chnl-icons">
                                  <a>
                                    <i className="material-icons" onClick={() => TopCustomersByChannel(true)}>refresh</i>
                                  </a>
                                </div>
                              </div>
                              <hr className="cmmn-hline" />
                              {/* {console.log('topCustomersByChannel--------->', topCustomersByChannel)} */}
                              <ul>
                                {topCustomersByChannel && topCustomersByChannel?.length > 0 && topCustomersByChannel?.map((ele) => {
                                  return <li>
                                    <span>{ele?.topCustomer_channel}</span>{" "}
                                    <span className={
                                      ele?.topCustomer_channel === 'Email' ? "skel-count-chnl  bg-em-violet"
                                        : ele?.topCustomer_channel === 'Whatsapp Live Chat' ? "skel-count-chnl bg-w-green"
                                          : ele?.topCustomer_channel === 'Instagram' ? "skel-count-chnl bg-i-orange"
                                            : ele?.topCustomer_channel === 'Telegram' ? "skel-count-chnl bg-t-blue"
                                              : ele?.topCustomer_channel === 'Facebook Live Chat' ? "skel-count-chnl bg-f-blue"
                                                : (ele?.topCustomer_channel === 'SelfCare' || ele?.topCustomer_channel === 'Web Selfcare' || ele?.topCustomer_channel === 'Web Application') ? "skel-count-chnl bg-i-orange" :
                                                  "skel-count-chnl bg-sc-blue"} onClick={e => {
                                                    filterTopCustomerByChannel(ele?.topCustomer_channel);
                                                    setIsTopCustomerByChannelPopupOpen(true);
                                                  }}>
                                      {ele?.count}
                                    </span>
                                  </li>
                                })}
                              </ul>
                            </div>
                            </div>}
                            {/* </div>

                          <div className="row row-cols-3 mx-lg-n1 mt-2"> */}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.topChannelsByOrder?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-5">
                                    <span className="skel-header-title">
                                      Top 5 Channels By Order
                                    </span>
                                  </div>
                                  <div className="col-md-1"></div>
                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => TopChannelsByOrder(false, val)}
                                    />
                                  </div>
                                  <a>
                                    <i
                                      className="material-icons"
                                      onClick={() => TopChannelsByOrder(true, orderType)}
                                    >
                                      refresh
                                    </i>
                                  </a>
                                </div>

                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {topChannels.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <VerticalBar
                                        data={{
                                          axisData,
                                          seriesData
                                        }}
                                      />)}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.topProblemSolvingChannel?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-5">
                                    <span className="skel-header-title">
                                      Top 5 Problem Solving Channel
                                    </span>
                                  </div>
                                  <div className="col-md-1"></div>
                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => ProblemSolvingChannel(false, val)}
                                    />
                                  </div>
                                  <a>
                                    <i className="material-icons" onClick={() => ProblemSolvingChannel(true)}>refresh</i>
                                  </a>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {topProblem.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Problemsolving
                                        data={{
                                          topProblem: topProblem,
                                        }}
                                      />)}

                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}


                            {/* <div className="skel-omni-tot-by-chnl mt-2">
                            
                          </div> */}


                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.totalChatsByChannel?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Total Chats By Channel
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TotalChatChannel(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {totalChat.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <TotalChatBar
                                        data={{
                                          totalChat: totalChat,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.abandonedChats?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Abandoned Chats
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => AbandonedChannel(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>

                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {abandonedChat.length === 0 ? (<span className="records">No record found</span>) : (<AbandonedBar
                                      data={{
                                        abandonedChat: abandonedChat,
                                      }}
                                    />)}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.avgResponseTime?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Avg. Response Time
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => AverageResponse(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>

                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graphs">
                                    {average.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <AveragePie
                                        data={{
                                          average: average,
                                        }}
                                      />)}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.avgHandlingTime?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Avg. Handling Time
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => AverageHandling(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>

                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graphs">
                                    {averageHandling.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <AverageHandlingPie
                                        data={{
                                          averageHandling: averageHandling,
                                        }}
                                      />)
                                    }
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.turnAroundTime?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    TAT (Turn Around Time)
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TurnArrounds(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>

                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graphs">
                                    {turnArround.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <TurnArround
                                        data={{
                                          turnArround: turnArround,
                                        }}
                                      />)}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.allChannel?.issuesSolvedByChannels?.isActive && <div className="col px-lg-1 mb-2">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Issues Solved By Channels
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => IssueSolvedChannel(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    <div className="skel-solv-by-chnl">
                                      <table>
                                        <tr>
                                          <td>
                                            <b>By Channels</b>
                                          </td>
                                          <td className="text-center">
                                            <b>By Smart Assistance</b>
                                          </td>
                                          <td className="text-center">
                                            <b>By Humans</b>
                                          </td>
                                        </tr>

                                        {Object.keys(iss).map((x) => (
                                          <tr>
                                            <td>
                                              <span>{x}</span>
                                            </td>
                                            <td className={getChannelClassName(x) + " text-center txt-bold"}>
                                              <span onClick={e => {
                                                filterInteractionsByChannelAndBotOrHuman(x, 'BOT');
                                                setIsInteractionByChannelPopupOpen(true);
                                              }}>{((iss[x].bot ?? 0) + (iss[x]['smart assistance'] ?? 0)) || 0}</span>
                                            </td>
                                            <td className={getChannelClassName(x) + " text-center txt-bold"}>
                                              <span onClick={e => {
                                                filterInteractionsByChannelAndBotOrHuman(x, 'HUMAN');
                                                setIsInteractionByChannelPopupOpen(true);
                                              }}>{iss[x].human || 0}</span>
                                            </td>
                                          </tr>
                                        ))}
                                      </table>
                                    </div>
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}

                      {viewType === "WHATSAPP-LIVECHAT" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }}
                            handlers={{
                              setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                              setIsTopCustomerByChannelPopupOpen,
                              filterLiveSupportByChannel,
                              setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                              setIsProspectByChannelPopupOpen,

                              filterInteractionsByChannelAndBotOrHuman,
                              setIsInteractionByChannelPopupOpen,
                              filterLiveSupportDataByChannel
                            }} />

                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <>
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <div className="skel-perf-sect-indiv">
                                      {topPerforming?.map((x) => (
                                        <>
                                          {x.channel === "Whatsapp Live Chat" && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%
                                                </span>{" "}
                                                of
                                                <br /><b>{x?.type}</b>{" "}
                                                created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </div>
                                  )}
                                </>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>

                          {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}

                          {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.interactionCategory?.isActive &&
                            <div className="row mt-2">
                              <div className="col-md-12">
                                <div className="cmmn-skeleton h-100">
                                  <div className="row">
                                    <div className="col-md-6">
                                      <span className="skel-header-title">
                                        Interaction Category
                                      </span>
                                    </div>
                                    <div className="col-md-1"></div>
                                    <div className="form-group col-md-4">
                                      <ReactSelect
                                        placeholder='Interaction Category'
                                        className="w-80"
                                        isMulti={true}
                                        options={intxnCatList}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                        onChange={(val) => Categorywat(false, val)}
                                      />
                                    </div>
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                  {/* <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Interaction Category
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => Categorywat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div> */}
                                  <hr className="cmmn-hline" />
                                  <div className="skel-perf-sect">
                                    <div className="skel-perf-graph">
                                      {category.length === 0 ? (
                                        <div className="noRecord">
                                          <p>NO RECORDS FOUND</p>
                                        </div>
                                      ) : (
                                        <Vertical
                                          data={{
                                            category: category,
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>

                                  <hr className="cmmn-hline" />

                                  <div className="skel-refresh-info">
                                    <span>
                                      <i className="material-icons">refresh</i>{" "}
                                      Updated a few seconds ago
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                          }

                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                {/* <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Interaction Corner
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => InteractionCornerWat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div> */}
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />)}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.appointmentCorner?.isActive && <AppoinmentCorner data={{ searchParams: requestBody, viewType }} />}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.whatsApp?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>

                        </div>
                      )}

                      {(viewType === "FB-LIVECHAT" || viewType === "Facebook Live Chat") && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />

                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {topPerforming?.map((x) => (
                                        <>
                                          {(x.channel === "FACEBOOK" || x.channel === "Facebook Live Chat") && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%{" "}
                                                </span>
                                                of
                                                <br /> <b>{x?.type}</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}

                          </div>

                          {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}


                          {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.interactionCategory?.isActive && <div className="row mt-3">
                            <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">

                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}

                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-6">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <a>
                                    <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                  </a>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.facebook?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                          </div>
                        </div>
                      )}

                      {viewType === "TELEGRAM" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {topPerforming?.map((x) => (
                                        <>
                                          {(x.channel === "TELEGRAM" || x.channel === 'Telegram') && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%{" "}
                                                </span>
                                                of
                                                <br /> <b>Interaction</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.telegram?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}

                      {viewType === "INSTAGRAM" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,

                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {topPerforming?.length > 0 && topPerforming?.map((x) => (
                                        <>
                                          {(x.channel === "INSTAGRAM" || x.channel === 'Instagram') && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%{" "}
                                                </span>
                                                of
                                                <br /> <b>Interaction</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.instagram?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}
                      {viewType === "EMAIL" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.email?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <>
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <div className="skel-perf-sect-indiv">
                                      {topPerforming?.map((x) => (
                                        <>
                                          {x.channel === "Email" && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%
                                                </span>{" "}
                                                of
                                                <br /><b>{x?.type}</b>{" "}
                                                created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </div>
                                  )}
                                </>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.email?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.email?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.email?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.email?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>

                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.email?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}
                      {viewType === "MOBILEAPP" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {Array.isArray(topPerforming) && topPerforming?.map((x) => (
                                        <>
                                          {(x.channel === "MOBILEAPP" || x.channel === "Mobile APP") && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}% {" "}
                                                </span>
                                                of
                                                <br /> <b>{x?.type}</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.appointmentCorner?.isActive && <AppoinmentCorner data={{ searchParams: requestBody, viewType }} />}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.mobileApp?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}
                      {viewType === "SELFCARE" && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {topPerforming?.map((x) => (
                                        <>
                                          {(x.channel === "SELFCARE" || x.channel === 'SelfCare') && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%{" "}
                                                </span>
                                                of
                                                <br /> <b>{x?.type}</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.selfCare?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-6">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <a>
                                    <i
                                      className="material-icons"
                                      onClick={() => OrderCornerWat(true, orderType)}
                                    >
                                      refresh
                                    </i>
                                  </a>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}
                      {(viewType.toLowerCase() === "ivr" || viewType.toLowerCase() === "walkin") && (
                        <div className="skel-omni-channel-individual mt-2">
                          <HeaderCount data={{
                            iss,
                            issueResolvedWalkin,
                            InteractionChannel,
                            corner,
                            OrderChannel,
                            order,
                            AppointmentChannel,
                            totalAppointment,
                            SalesChannel,
                            Averagechannel,
                            viewType,
                            totalRevenueByChannel,
                            liveSupport,
                            liveSupportData,
                            topCustomersByChannel,
                            prospect,
                            averagePerformanceByChannel,
                            appsConfig
                          }} handlers={{
                            setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen, filterTopCustomerByChannel,
                            setIsTopCustomerByChannelPopupOpen,
                            filterLiveSupportByChannel,
                            setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterProspectByChannel,
                            setIsProspectByChannelPopupOpen,
                            filterInteractionsByChannelAndBotOrHuman,
                            setIsInteractionByChannelPopupOpen,
                            filterLiveSupportDataByChannel
                          }} />
                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.performanceByType?.isActive && <div className="col-md">
                              <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Performance By
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => TopPerformingChannelwat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect-indiv">
                                  {topPerforming == "0" ? (
                                    <div className="noRecord">
                                      <p>NO RECORDS FOUND</p>
                                    </div>
                                  ) : (
                                    <>
                                      {topPerforming?.map((x) => (
                                        <>
                                          {(x.channel.toLowerCase() === "ivr" || x.channel.toLowerCase() === 'walkin') && (
                                            <div className="skel-indiv-track-record">
                                              <p>
                                                <span className="skel-omni-chnl-per txt-clr-whatsapp font-21">
                                                  {x?.percentage ?? 0}%{" "}
                                                </span>
                                                of
                                                <br /> <b>{x?.type}</b> created
                                              </p>
                                            </div>
                                          )}
                                        </>
                                      ))}
                                    </>
                                  )}
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                            {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.RevenueByChannel?.isActive && <RevenueByChannel data={{ revenue, viewType, prospect }} handlers={{ Revenuechannelwat }} />}
                          </div>
                          {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.chatHistory?.isActive && <ChatHistory data={{ chatHistory }} handlers={{ ChatHistorywat }} />}
                          {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.interactionCategory?.isActive && <div className="row mt-2">
                            <div className="col-md-12">
                              <div className="cmmn-skeleton h-100">
                                {/* <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Interaction Category
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => Categorywat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div> */}
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Category
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Category'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnCatList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnCategory ? intxnCatList.find(c => c.value === intxnCategory.value) : null}
                                      onChange={(val) => Categorywat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => Categorywat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {category.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Vertical
                                        data={{
                                          category: category,
                                        }}
                                      />
                                    )}

                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>}

                          <div className="row mt-2">
                            {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.interactionCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                {/* <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Interaction Corner
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => InteractionCornerWat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div> */}
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Interaction Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Interaction Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={intxnTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={intxnType ? intxnTypeList.find(c => c.value === intxnType.value) : null}
                                      onChange={(val) => InteractionCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i className="material-icons" onClick={() => InteractionCornerWat(true)}>refresh</i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {corner.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Corner
                                        data={{
                                          corner: corner,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}

                            {appsConfig?.clientConfig?.omniChannelDashboard?.ivr?.orderCorner?.isActive && <div className="col-md-6">
                              <div className="cmmn-skeleton h-100">
                                {/* <div className="skel-dashboard-title-base">
                                  <span className="skel-header-title">
                                    Order Corner
                                  </span>
                                  <div className="skel-dashboards-icons">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div> */}
                                <div className="row">
                                  <div className="col-md-6">
                                    <span className="skel-header-title">
                                      Order Corner
                                    </span>
                                  </div>

                                  <div className="form-group col-md-5">
                                    <ReactSelect
                                      placeholder='Order Type'
                                      className="w-80"
                                      isMulti={true}
                                      options={orderTypeList}
                                      menuPortalTarget={document.body}
                                      styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      value={orderType ? orderTypeList.find(c => c.value === orderType.value) : null}
                                      onChange={(val) => OrderCornerWat(false, val)}
                                    />
                                  </div>
                                  <div className="form-group col-md-1">
                                    <a>
                                      <i
                                        className="material-icons"
                                        onClick={() => OrderCornerWat(true, orderType)}
                                      >
                                        refresh
                                      </i>
                                    </a>
                                  </div>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-perf-sect">
                                  <div className="skel-perf-graph">
                                    {order.length === 0 ? (
                                      <div className="noRecord">
                                        <p>NO RECORDS FOUND</p>
                                      </div>
                                    ) : (
                                      <Order
                                        data={{
                                          order: order,
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>

                                <hr className="cmmn-hline" />

                                <div className="skel-refresh-info">
                                  <span>
                                    <i className="material-icons">refresh</i>{" "}
                                    Updated a few seconds ago
                                  </span>
                                </div>
                              </div>
                            </div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {
        isInteractionByDynamicChannelPopupOpen &&
        <Modal isOpen={isInteractionByDynamicChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: corner,
                  entityType: `Interaction By Channel`,
                  headerColumn: CommonColumns,
                  count: channelListCount,
                  fixedHeader: true,
                  itemsPerPage: channelListPerPage,
                  isScroll: true,
                  backendCurrentPage: channelCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isInteractionByDynamicChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setChannelListPerPage,
                  setCurrentPage: setChannelCurrentPage,
                  setIsPopupOpen: setIsInteractionByDynamicChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isInteractionByChannelPopupOpen &&
        <Modal isOpen={isInteractionByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredInteractionsByChannel,
                  entityType: 'Interactions By Channel',
                  headerColumn: InteractionByChannelsColumns,
                  count: listCount,
                  fixedHeader: true,
                  itemsPerPage: listPerPage,
                  isScroll: true,
                  backendCurrentPage: currentPage,
                  backendPaging: false,
                  isPopupOpen: isInteractionByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListPerPage,
                  setCurrentPage: setCurrentPage,
                  setIsPopupOpen: setIsInteractionByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isOrderByDynamicChannelPopupOpen &&
        <Modal isOpen={isOrderByDynamicChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: order,
                  headerColumn: CommonColumns,
                  entityType: `Orders By Channel`,
                  count: channelListCount,
                  fixedHeader: true,
                  itemsPerPage: channelListPerPage,
                  isScroll: true,
                  backendCurrentPage: channelCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isOrderByDynamicChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setChannelListPerPage,
                  setCurrentPage: setChannelCurrentPage,
                  setIsPopupOpen: setIsOrderByDynamicChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isOrderByChannelPopupOpen &&
        <Modal isOpen={isOrderByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredOrdersByChannel,
                  headerColumn: AssignedOrdersColumns,
                  entityType: 'Orders By Channel',
                  count: orderListCount,
                  fixedHeader: true,
                  itemsPerPage: listOrderPerPage,
                  isScroll: true,
                  backendCurrentPage: orderCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isOrderByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListOrderPerPage,
                  setCurrentPage: setOrderCurrentPage,
                  setIsPopupOpen: setIsOrderByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isAppointmentByChannelPopupOpen &&
        <Modal isOpen={isAppointmentByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredAppointmentByChannel,
                  headerColumn: AppointmentColumns.map((val) => {
                    if (val.Header.includes('Customer')) {
                      return { ...val, Header: val.Header.replace('Customer', appsConfig?.clientFacingName?.customer) }
                    }
                    return val
                  }),
                  entityType: `Appointments By Channel`,
                  count: appointmentListCount,
                  fixedHeader: true,
                  itemsPerPage: listAppointmentPerPage,
                  isScroll: true,
                  backendCurrentPage: appointmentCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isAppointmentByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListAppointmentPerPage,
                  setCurrentPage: setAppointmentCurrentPage,
                  setIsPopupOpen: setIsAppointmentByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isProspectByChannelPopupOpen &&
        <Modal isOpen={isProspectByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredProspectByChannel,
                  entityType: 'Prospects By Channel',
                  headerColumn: ProspectCustomerByChannelColumns,
                  count: prospectListCount,
                  fixedHeader: true,
                  itemsPerPage: listProspectPerPage,
                  isScroll: true,
                  backendCurrentPage: prospectCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isProspectByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListProspectPerPage,
                  setCurrentPage: setProspectCurrentPage,
                  setIsPopupOpen: setIsProspectByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isLiveSupportByChannelPopupOpen &&
        <Modal isOpen={isLiveSupportByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredLiveSupportDataByChannel,
                  headerColumn: LiveSupportColumns.map((val) => {
                    if (val.Header.includes('Customer')) {
                      return { ...val, Header: val.Header.replace('Customer', appsConfig?.clientFacingName?.customer) }
                    }
                    return val
                  }),
                  // headerColumn: LiveSupportColumns,
                  entityType: 'Live Support By Channel',
                  count: 0,
                  fixedHeader: true,
                  itemsPerPage: listLiveSupportPerPage,
                  isScroll: true,
                  backendCurrentPage: liveSupportCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isLiveSupportByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListLiveSupportPerPage,
                  setCurrentPage: setLiveSupportCurrentPage,
                  setIsPopupOpen: setIsLiveSupportByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
      {
        isTopCustomerByChannelPopupOpen &&
        <Modal isOpen={isTopCustomerByChannelPopupOpen} style={RegularModalCustomStyles}>
          <div className="modal-content">
            <div className="">
              <PopupListModal
                data={{
                  isTableFirstRender: false,
                  hasExternalSearch: false,
                  list: filteredTopCustomerByChannel,
                  entityType: `Top ${appsConfig?.clientFacingName?.customer ? appsConfig?.clientFacingName?.customer + 's' : ''} By Channel`,
                  // entityType: 'Top Customers By Channel',
                  headerColumn: ProspectCustomerByChannelColumns.map((val) => {
                    if (val.Header.includes('Customer')) {
                      return { ...val, Header: val.Header.replace('Customer', appsConfig?.clientFacingName?.customer) }
                    }
                    return val
                  }),
                  count: topCustomerListCount,
                  fixedHeader: true,
                  itemsPerPage: listTopCustomerPerPage,
                  isScroll: true,
                  backendCurrentPage: topCustomerCurrentPage,
                  backendPaging: false,
                  isPopupOpen: isTopCustomerByChannelPopupOpen
                }}
                handlers={{
                  handlePageSelect: handlePageSelect,
                  setPerPage: setListTopCustomerPerPage,
                  setCurrentPage: setTopCustomerCurrentPage,
                  setIsPopupOpen: setIsTopCustomerByChannelPopupOpen
                }} />
            </div>
          </div>
        </Modal>
      }
    </OmniChannelDashboardContext.Provider>
  );
};

export default OmniChannelDashboard;
