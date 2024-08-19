/* eslint-disable array-callback-return */
import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { unstable_batchedUpdates } from "react-dom";
import { useTranslation } from "react-i18next";
import Joyride from 'react-joyride';
import { Link, useLocation } from "react-router-dom";
import { useReactToPrint } from 'react-to-print';
import { toast } from "react-toastify";
import { moduleConfig, statusConstantCode } from "../../AppConstants";
import { AppContext } from "../../AppContext";
import PaymentHistory from "../../InvoiceAndBilling/Accounting/AccountDetailsView/PaymentHistory";
import SearchContract from "../../InvoiceAndBilling/Contract/SearchContract";
import SearchInvoice from "../../InvoiceAndBilling/Invoice/SearchInvoice";
import arrowDown from "../../assets/images/updown.svg";
import vIcon from "../../assets/images/v-img.png";
import DynamicTable from "../../common/table/DynamicTable";
import { useHistory } from "../../common/util/history";
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import Helpdesk from "../Customer360/InteractionTabs/Helpdesk";
import Interactions from "../Customer360/InteractionTabs/Interactions";
import Payment from "../Customer360/InteractionTabs/Payment";
import WorkOrders from "../Customer360/InteractionTabs/WorkOrders";
import ManageService from "../Customer360/ManageServices/ManageServices";
import CustomerServiceForm from "../ServiceManagement/CustomerServiceForm";
import ChannelActivityChart from "./ChannelActivityChart";
import ChannelPerformanceChart from "./ChannelPerformanceChart";
import CustomerDetailsFormViewMin from "./CustomerDetailsFormViewMin";
import CustomerJourney from "./CustomerJourney";
import NegativeScatterChart from "./NegativeScatterChart";
import SentimentChart from "./SentimentChart";
import SentimentGauge from "./SentimentScoreGauge";
import CustomerViewPrint from './CustomerViewPrint';
import ViewTicketDetails from '../OMS/ViewTicketDetails';
import CardFilter from './CardFilter';
import SurveyFeedback from './Components/Customer360/SurveyFeedback';
// import ratingSad from "../../assets/images/very-dislike.png";

const CustomerDetailsView = (props) => {
  // console.log('props------->', props)
  const location = useLocation()
  // console.log(location.state)
  // const modulePermission = props?.appsConfig?.moduleSetupPayload
  const history = useHistory()
  const [runTour, setRunTour] = useState(true);
  const steps = [
    {
      target: '.step-1', // CSS selector of the element you want to highlight
      content: 'This is step 1. Click Next to continue.',
    },
    {
      target: '.step-2',
      content: 'Step 2 description.',
    },
    // Add more steps as needed
  ];

  // function handleOnClickBack() {
  //   history.goBack();
  // }
  const viewConsumer = JSON.parse(localStorage.getItem('viewConsumer'))

  const customerUuid = localStorage.getItem("customerUuid") || location.state.data.customerUuid || null;
  const customerIds = localStorage.getItem("customerIds") || location.state.data.customerId || null;
  const accountNo = localStorage.getItem("accountNo")
    ? Number(localStorage.getItem("accountNo"))
    : null;
  const [perPage, setPerPage] = useState(10);
  const [customerDetails, setCustomerDetails] = useState(
    props?.location?.state?.data?.customerData ? props?.location?.state?.data?.customerData : viewConsumer?.data
  );
  const [accountDetails, setAccountDetails] = useState(
    props?.location?.state?.data?.accountData
  );
  const [showActiveTab, setShowActiveTab] = useState(false)

  let crmCustomerNo = props?.location?.state?.data?.crmCustomerNo;

  useEffect(() => {
    if (crmCustomerNo) {
      post(`${properties.CUSTOMER_API}/get-service`, { searchInput: crmCustomerNo }).then((response) => {
        setShowActiveTab(response?.data?.data?.result?.type)
      }).catch((error) => {
        console.log('error------>', error)
      })
    }
  }, [crmCustomerNo])


  const [servicesList, setServicesList] = useState(
    props?.location?.state?.data?.serviceDetails
  );

  const [interactionModalData, setInteractionModalData] = useState();
  const [orderModalData, setOrderModalData] = useState();
  const [intelligenceList, setIntelligenceList] = useState([]);
  const [appointmentList, setAppointmentList] = useState([]);
  const [isPrint, setIsPrint] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  // const [showReschedule, setShowReschedule] = useState(false);
  // const [showRescheduleDelete, setShowRescheduleDelete] = useState(false);

  const [invoiceCounts, setInvoiceCounts] = useState({
    totoalOutstanding: "0",
    dueOutStanding: "0",
    advancePayment: "0",
    noOfActvieServices: "0"
  })


  // let limiter = new Limiter({ concurrency: 1 });
  // let serviceCardRef = useRef(null);
  // const refVoid = useRef(null)
  // let serviceRef = useRef(null);
  // let accountRef = useRef(null);
  let openInteractionCount = useRef(0),
    closedInteractionCount = useRef(0);
  const { auth, appsConfig } = useContext(AppContext);
  const dtWorksProductType = appsConfig?.businessSetup?.[0]
  const { t } = useTranslation();
  const [refreshPage, setRefreshPage] = useState(true);
  const [searchInput, setSearchInput] = useState({});
  const [activeService, setActiveService] = useState("");
  const [accountList, setAccountList] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState({});
  const [accountRealtimeDetails, setAccountRealtimeDetails] = useState({});
  const [accountUuid, setAccountUuid] = useState();
  // const [serviceIdsList, setServiceIdsList] = useState([])
  const [expiryServicesList, setExpiryServicesList] = useState([]);
  // const [servicesSummary, setServicesSummary] = useState([])
  const [serviceModal, setServiceModal] = useState({ state: false });
  const [selectedService, setSelectedService] = useState({ idx: -1 });
  const [productList, setProductList] = useState([]);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
  const [isInteractionListOpen, setIsInteractionListOpen] = useState(false);
  const [isOrderListOpen, setIsOrderListOpen] = useState(false);


  const [interactionStatusType, setInteractionStatusType] = useState();
  const [customerDetailsList, setCustomerDetailsList] = useState([]);
  const [sentimentScore, setSentimentScore] = useState(0);

  const manageServiceRef = useRef();

  // const [leftNavCounts, setLeftNavCounts] = useState({})
  // const [leftNavCountsInquiry, setLeftNavCountsInquiry] = useState({})
  // const [leftNavWoCounts, setLeftNavWoCounts] = useState({})
  const [newAccountAddded, setNewAccountAdded] = useState({
    isAccountAdded: false,
  });
  // const [newServiceAddded, setNewServiceAdded] = useState({ isServicesAdded: false })
  // const [refreshServiceList, setRefreshServiceList] = useState(null)
  // const [refreshServiceRequest, setRefreshServiceRequest] = useState(true);
  // const [refreshComplaint, setRefreshComplaint] = useState(true);
  // const [refreshInquiry, setRefreshInquiry] = useState(true)
  const [serviceStatus, setServiceStatus] = useState("");
  const [buttonDisable, setButtonDisable] = useState(true);
  // const [openAccModal, setAccOpenModal] = useState(false)
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [openAddServiceModal, setOpenAddServiceModal] = useState(false);
  const [customerAddressList, setCustomerAddressList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openOrderModal, setOpenOrderModal] = useState(false);
  const [openInteractionModal, setOpenInteractionModal] = useState(false);
  // const [openBillHistoryModal, setOpenBillHistoryModal] = useState(false)
  // const [billingDetails, setBillingDetails] = useState()
  const [accountCount, setAccountCount] = useState();
  const [serviceTypeLookup, setServiceTypeLookup] = useState([]);
  const [serviceData, setServiceData] = useState({
    serviceType: "",
    totalRc: 0,
    totalNrc: 0,
    isNeedQuoteOnly: "N",
  });
  const [selectedProductList, setSelectedProductList] = useState([]);
  const [userPermission, setUserPermission] = useState({
    addAttachment: false,
    editUser: false,
    editAccount: false,
    addService: false,
    addComplaint: false,
    addInquiry: false,
    viewCustomer: false,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [service, setService] = useState(
    localStorage.getItem("service") === "true" ? true : false
  );
  const [account, setAccount] = useState(
    localStorage.getItem("account") === "true" ? true : false
  );
  const [tabType, setTabType] = useState("customerHistory");
  const [customerEmotions, setCustomerEmotions] = useState([]);

  const [channelActivity, setChannelActivity] = useState([]);

  const [channelActivityData, setChannelActivityData] = useState([]);
  const [channelActivityDataCopy, setChannelActivityDataCopy] = useState([]);

  const [sentimentChartData, setSentimentChartData] = useState([]);
  const [sentimentChartDataCopy, setSentimentChartDataCopy] = useState([]);

  const [avgSentimentData, setAvgSentimentData] = useState([]);
  const [avgSentimentDataCopy, setAvgSentimentDataCopy] = useState([]);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageRefreshHandlers, setPageRefreshHandlers] = useState({
    attachmentRefresh: true,
    customerRefresh: true,
    accountEditRefresh: true,
    serviceRefresh: true,
    contractInvoicePaymentRefresh: true,
  });
  // const [customerRefresh, setCustomerRefresh] = useState(true);
  const [scheduleContract, setScheduleContract] = useState([]);
  const [revenueDetails, setRevenueDetails] = useState({});
  const [totalCountAddress, setTotalCountAddress] = useState(0);
  const [perPageAddress, setPerPageAddress] = useState(10);
  const [currentPageAddress, setCurrentPageAddress] = useState(0);
  // const [filtersAddress, setFiltersAddress] = useState([])
  const [productBenefitLookup, setProductBenefitLookup] = useState([])
  const businessMasterRef = useRef()
  const [isSetimentPopupOpen, setIssetimentPopupOpen] = useState(false)
  const [sentimentFilter, setSentimentFilter] = useState({})
  const [sentimentFilterData, setSentimentFilterData] = useState([])
  const [sentimentCurrentPage, setSentimentCurrentPage] = useState(0);
  const [sentimentPerPage, setSentimentPerPage] = useState(10);
  const [isHelpdeskListOpen, setIsHelpdeskListOpen] = useState(false);
  // Interaction List

  const [interactionList, setInteractionList] = useState([]);
  const [interactionData, setInteractionData] = useState([]);

  // Order List
  const [orderList, setOrderList] = useState({ count: 0, rows: [] });

  //Followups
  const [followUpList, setFollowupList] = useState([]);
  const [isFolloupListOpen, setIsFolloupListOpen] = useState(false)

  // Helpdesk List

  const [helpdeskListData, setHelpdeskListData] = useState([]);
  const [helpdeskList, setHelpdeskList] = useState([]);

  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      setIsPrint(false)
    }
  });


  useEffect(() => {
    if (!isEmpty(sentimentFilter) && Array.isArray(sentimentChartData) && sentimentChartData?.length > 0) {
      const filterData = sentimentChartData?.filter(ch => ch?.monthYear === sentimentFilter?.monthYear && ch?.emotion === sentimentFilter?.emotion).map((e) => e?.details) || []
      setSentimentFilterData(filterData)
    }
  }, [sentimentChartData, sentimentFilter])

  const getCustomerHistoryData = useCallback((type) => {
    if (['customerHistory', 'addressHistory'].includes(type) && customerDetails) {

      const { customerUuid, customerNo } = customerDetails;
      const requestBody = {
        customerUuid,
        customerNo
      }
      post(`${properties.CUSTOMER_API}/${type === "customerHistory" ? 'details/' : type === "addressHistory" ? 'address/' : ''}history?limit=${type === "customerHistory" ? perPage : type === "addressHistory" ? perPageAddress : 10}&page=${type === "customerHistory" ? currentPage : type === "addressHistory" ? currentPageAddress : 0}`, requestBody)
        .then((response) => {
          if (response.data) {
            const { count, rows } = response.data;
            if (!!rows.length) {
              let customerDetails = [];
              let customerAddress = [];
              // let customerProperty = [];
              rows?.forEach((data) => {
                const { idValue, idTypeDesc, contactTypeDesc, updatedAt, modifiedBy,
                  address1, address2, address3, city, district, state, postcode, country, customerContact } = data;
                if (data && type === "customerHistory") {
                  customerContact && customerContact.map((val) => (
                    customerDetails.push({
                      idType: idTypeDesc?.description,
                      idValue,
                      email: val.emailId,
                      contactType: contactTypeDesc?.description,
                      contactNo: val.mobileNo,
                      updatedAt: moment(updatedAt).format('DD-MM-YYYY hh:mm:ss A'),
                      modifiedBy: `${data.updatedByName ? (data.updatedByName?.firstName || '') + ' ' + (data.updatedByName?.lastName || '') : (data.createdByName?.firstName || '') + ' ' + (data.createdByName?.lastName || '')}`
                    })
                  ))

                }
                if (type === "addressHistory") {
                  customerAddress.push({
                    address1,
                    address2,
                    address3,
                    city,
                    district,
                    districtDesc: data?.districtDesc || district,
                    state,
                    stateDesc: state,
                    postcode,
                    zipDesc: postcode,
                    country,
                    countryDesc: data?.countryDesc?.description || country,
                    updatedAt: moment(updatedAt).format('DD-MM-YYYY hh:mm:ss A'),
                    modifiedBy: `${modifiedBy?.firstName || ""} ${modifiedBy?.lastName || ""}`
                  })
                }
              });
              unstable_batchedUpdates(() => {
                if (type === "customerHistory") {
                  setTotalCount(count)
                  setCustomerDetailsList(customerDetails);
                }
                if (type === "addressHistory") {
                  setTotalCountAddress(count)
                  setCustomerAddressList(customerAddress);
                }
              })
            }
          }
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {

        })
    }
  }, [customerDetails])

  useEffect(() => {
    if (tabType === 'customerHistory')
      getCustomerHistoryData('customerHistory')
  }, [customerDetails, getCustomerHistoryData, tabType])


  const handleContractInvoicePaymentRefresh = () => {
    setPageRefreshHandlers({
      ...pageRefreshHandlers,
      contractInvoicePaymentRefresh:
        !pageRefreshHandlers.contractInvoicePaymentRefresh,
    });
  };

  // const handleAttachmentRefresh = () => {
  //     setPageRefreshHandlers({
  //         ...pageRefreshHandlers,
  //         attachmentRefresh: !pageRefreshHandlers.attachmentRefresh
  //     })
  // }

  const capitalizeFirstLetter = (string) => {
    return string?.charAt(0)?.toUpperCase() + string?.slice(1);
  };

  const pageRefresh = () => {
    setRefreshPage(!refreshPage);
  };

  const handleTypeSelect = (type) => {
    setTabType(type);
  };

  const handleInteractionModal = (data) => {
    // console.log('in data==', data)
    setInteractionModalData(data);
    setOpenInteractionModal(true);
  };

  const hanldeOpenOrderModal = (data) => {
    setOrderModalData(data);
    setOpenOrderModal(true);
  };
  // const customerRefreshDetails = () => {
  //     setCustomerRefresh(!customerRefresh)
  // }

  const handleOnModelClose = () => {
    setOpenServiceModal(false);
    setOpenAddServiceModal(false);
    setOpenInteractionModal(false);
    setOpenOrderModal(false);
    setIsInteractionListOpen(false);
    setIsOrderListOpen(false);
    setIsFolloupListOpen(false);
    setIsHelpdeskListOpen(false);
    setCurrentPage(0)
    setPerPage(10)
  };

  const handleSentimentModelClose = () => {
    setIssetimentPopupOpen(false)
    setSentimentFilter({})
  };

  // const onClickScrollTo = () => {
  //
  //     setTimeout(() => {

  //         if (Number(accountNo) === Number(selectedAccount.accountNo) && accountNo !== null && accountNo !== undefined && accountNo !== '') {
  //             if (accountRef && accountRef !== null && account === true) {
  //                 accountRef.current.scrollIntoView({ top: serviceCardRef.current.offsetTop, behavior: 'smooth', block: "start" })
  //             }
  //             if (searchInput.serviceId !== null && activeService !== null && activeService !== undefined && serviceCardRef !== null && serviceCardRef !== undefined && serviceCardRef !== '') {
  //                 if (searchInput.serviceId !== null && Number(searchInput.serviceId) === Number(activeService)) {
  //                     if (serviceCardRef && serviceCardRef !== null && service === true) {
  //                         serviceCardRef.current.scrollIntoView({ top: serviceCardRef.current.offsetTop, bottom: 10, behavior: 'smooth', block: "start" })
  //                         serviceRef.current.scrollIntoView({ top: serviceRef.current.offsetTop, behavior: 'smooth', block: "start" })
  //                     }

  //                 }
  //             }
  //         }
  //         else {
  //             setService(false)
  //             setAccount(false)
  //         }
  //
  //     }, 5000)
  // }
  useEffect(() => {
    get(
      properties.INTERACTION_API + "/counts?customerUuid=" + customerUuid
    ).then((resp) => {
      // console.log('count rows================', resp.data)
      if (resp.data.count !== 0) {
        closedInteractionCount.current = resp.data?.rows.filter((e) =>
          ["CLOSED", "CANCELLED"].includes(e.intxnStatus.code)
        );
        openInteractionCount.current = resp.data?.rows.filter(
          (e) => !["CLOSED", "CANCELLED"].includes(e.intxnStatus.code)
        );
      }

    }).catch((error) => console.error(error));

    get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT')
      .then((response) => {
        if (response.data) {
          businessMasterRef.current = response.data
          unstable_batchedUpdates(() => {
            setProductBenefitLookup(response.data.PRODUCT_BENEFIT)
          })
        }
      }).catch((error) => console.error(error))

    get(properties.INVOICE_API + '/ar-bill/' + customerUuid)
      .then((response) => {
        if (response.data) {
          setInvoiceCounts(response.data)
        }
      })
      .catch(error => {
        console.error(error)
      })
      .finally()
  }, []);

  const [followUpHistory, setFollowUpHistory] = useState({
    rows: [],
    count: 0,
  });

  useEffect(() => {
    post(`${properties.CUSTOMER_API}/get-customer?limit=1&page=0`, { customerUuid }).then((resp) => {
      if (resp.data) {
        if (resp.status === 200) {
          const { rows } = resp.data;
          unstable_batchedUpdates(() => {
            setCustomerDetails(rows[0]);
            const accountList = rows[0]?.customerAccounts
            setAccountDetails(accountList?.[0]);
            setAccountList(accountList);

            for (const account of accountList) {
              if (account.accountServices.length > 0) {
                const svcList = [];
                // for (let s of account.accountServices) {
                //   if (
                //     searchInput &&
                //     searchInput.serviceNo &&
                //     Number(searchInput.serviceNo) === s.serviceNo
                //   ) {
                //     svcList.splice(0, 0, s);
                //   } else {
                //     svcList.push(s);
                //   }
                // }
                //setServiceIdsList(svcIdsList)

                const acclist = [];
                for (const s of account.accountServices) {
                  if (s.accountUuid === account.accountUuid) {
                    acclist.push({
                      ...account,
                      ...s,
                    });
                  }
                }

                setServicesList(acclist);
                if (accountNo !== selectedAccount.accountNo) {
                  // service = false
                  // account = false
                  setAccount(false);
                  setService(false);
                  setActiveService(account.accountServices[0].serviceNo);
                }
              }
            }

          });
        }
      }
    }).catch((error) => console.error(error))
      .finally();
  }, [currentPage, perPage, refreshPage])

  const callFollowupHistory = (val) => {
    // get Interaction Followup History
    get(
      `${properties.INTERACTION_API}/history/${val}?getFollowUp=true&getAttachment=true`
    )
      .then((response) => {
        if (response?.data && response?.data) {
          setFollowUpHistory(response?.data);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }

  const getHelpdeskList = useCallback(() => {
    post(`${properties.HELPDESK_API}/search?limit=${perPage}&page=${currentPage}`, { customerNo: customerDetails?.customerNo })
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setHelpdeskList(resp.data);
          setHelpdeskListData(resp.data?.rows);
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [perPage, currentPage, customerDetails?.customerNo])

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      getHelpdeskList()
    }
  }, [perPage, currentPage, customerUuid, getHelpdeskList])

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=SERVICE_TYPE")
        .then((response) => {
          if (response.data) {
            setServiceTypeLookup(response.data.SERVICE_TYPE);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();

      // if (!customerDetails) {
      //   post(`${properties.CUSTOMER_API}/get-customer?limit=1&page=0`, {
      //     customerUuid,
      //   })
      //     .then((resp) => {
      //       if (resp.data) {
      //         if (resp.status === 200) {
      //           const { rows } = resp.data;
      //           unstable_batchedUpdates(() => {
      //             setCustomerDetails(rows[0]);
      //           });
      //         }
      //       }
      //     }).catch((error) => console.error(error))
      //     .finally();
      // }
      get(properties.CUSTOMER_API + "/recent-activities/" + customerUuid)
        .then((resp) => {
          setRecentActivity(resp.data);
        }).catch((error) => console.error(error))
        .finally();

      //   const searchParams = {
      //   customerUuid,
      // };
      // post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`,{ searchParams })
      // .then((resp) => {
      //     // console.log('interaction list====================', resp?.data?.rows)
      //     setInteractionList(resp.data);
      //     setInteractionData(resp.data?.rows);
      //   })
      //   .catch((error) => console.error(error))
      //   .finally();

      // console.log('customerUuid------------->', customerIds)
      // post(
      //   `${properties.ORDER_API}/search?limit=${perPage}&page=${currentPage}`,
      //   {
      //     searchParams: {
      //       customerId: customerIds
      //     }
      //   }
      // )
      //   .then((resp) => {
      //     // console.log('order list====================', resp?.data?.row)
      //     setOrderList(resp?.data?.row || []);
      //   }).catch((error) => console.error(error))
      //   .finally();

      get(
        properties.INTELLIGENCE_API + "/get-events?customerUuid=" + customerUuid
      )
        .then((resp) => {
          // console.log('intelligence data == ', resp.data)
          setIntelligenceList(resp?.data || []);
        }).catch((error) => console.error(error))
        .finally();

      // get schedule contract
      get(`${properties.CONTRACT_API}/get-scheduled-contracts/${customerUuid}`)
        .then((response) => {
          if (response?.data && response?.data) {
            setScheduleContract(response?.data);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();

      // get customer revenue
      get(`${properties.CUSTOMER_API}/getCustomerRevenue/${customerUuid}`)
        .then((response) => {
          if (response?.data && response?.data) {
            setRevenueDetails(response?.data);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();

    }
  }, [currentPage, perPage]);

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      // console.log('customerUuid=--------------------', customerUuid)
      // get(properties.INTERACTION_API + "/customers-interaction/" + customerUuid)
      //   .then((resp) => {
      //     if (resp && resp.data) {
      //       // console.log('emotions===> ', resp.data)
      //       setSentimentChartData([...resp.data]);
      //       setCustomerEmotions([...resp.data]);
      //     }
      //   })
      //   .catch((error) => console.error(error));
      get(properties.CUSTOMER_API + "/customers-interaction/" + customerUuid)
        .then((resp) => {
          if (resp && resp.data) {
            setSentimentChartData([...resp.data]);
            setSentimentChartDataCopy([...resp.data]);

            setAvgSentimentData([...resp?.data])
            setAvgSentimentDataCopy([...resp?.data])

            setCustomerEmotions([...resp.data]);
          }
        })
        .catch((error) => console.error(error));

      get(
        properties.CUSTOMER_API + "/customers-channel-activity/" + customerUuid
      )
        .then((resp) => {
          if (resp && resp.data) {
            console.log('resp.data--------->', resp.data)
            setChannelActivity([...resp.data]);
            setChannelActivityData([...resp.data]);
            setChannelActivityDataCopy([...resp.data]);
          }
        })
        .catch((error) => console.error(error));
    }
  }, []);

  useEffect(() => {
    if (customerDetails?.customerId) {
      get(
        properties.APPOINTMENT_API + `/customer/${customerDetails?.customerId}`
      )
        .then((resp) => {
          // console.log('appointment data == ', resp.data)
          setAppointmentList(resp?.data || []);
        })
        .catch((error) => console.error(error));


    }
  }, [customerDetails]);

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      get(
        properties.ACCOUNT_DETAILS_API + "/get-accountid-list/" + customerUuid
      )
        .then((resp) => {
          if (resp && resp.data) {
            let acctData = [];
            let selIdx = 0;
            let loopCount = 0;
            setAccountCount(resp?.data?.length);
            //setAccountUuid(resp.data[0])
            for (let r of resp.data) {
              if (String(r.accountUuid) === String(accountUuid)) {
                selIdx = loopCount;
              }
              acctData.push({
                customerUuid: customerUuid,
                accountUuid: r.accountUuid,
                accountNo: r.accountNo,
              });
              loopCount++;
            }
            setAccountList(resp?.data);
            //console.log('accountUuid==',accountUuid)
            if (accountUuid && accountUuid !== null) {
              setSelectedAccount({
                customerUuid: customerUuid,
                accountUuid: accountUuid,
                accountNo: accountNo,
              });
            } else {
              setSelectedAccount({
                customerUuid: acctData[selIdx]?.customerUuid,
                accountUuid: acctData[selIdx]?.accountUuid,
                accountNo: acctData[selIdx]?.accountNo,
              });
            }
          } else {
            toast.error("Failed to fetch account ids data - " + resp.status);
          }
        }).catch((error) => console.error(error))
        .finally();
    }
  }, [newAccountAddded, props?.location?.state, refreshPage]);

  useEffect(() => {
    // if (newAccountAddded.isAccountAdded) {
    //     setAccOpenModal(false)
    // }

    if (customerUuid) {
      //&& selectedAccount?.accountUuid && selectedAccount?.customerUuid !== '' && selectedAccount?.accountUuid !== ''

      // post(
      //   properties.ACCOUNT_DETAILS_API + "/get-account-list?limit=10&page=0",
      //   { customerUuid: customerUuid }
      // ) //,
      //   .then((resp) => {
      //     if (resp && resp.data) {
      //       const accrowData = resp?.data?.rows?.[0];
      //       const acclistData = resp?.data?.rows;
      //       setAccountDetails(accrowData);
      //       setAccountList(acclistData);
      //       // setAccountNo(rowData.accountNo)
      //       post(
      //         properties.ACCOUNT_DETAILS_API +
      //         "/get-service-list?limit=10&page=0",
      //         { customerUuid: customerUuid }
      //       ).then((resp) => {
      //         if (resp && resp.data) {
      //           if (resp.data.length > 0) {
      //             const svcList = [];
      //             for (let s of resp.data) {
      //               if (
      //                 searchInput &&
      //                 searchInput.serviceNo &&
      //                 Number(searchInput.serviceNo) === s.serviceNo
      //               ) {
      //                 svcList.splice(0, 0, s);
      //               } else {
      //                 svcList.push(s);
      //               }
      //             }
      //             //setServiceIdsList(svcIdsList)

      //             const acclist = [];
      //             for (const a of acclistData) {
      //               for (const s of svcList) {
      //                 if (s.accountUuid === a.accountUuid) {
      //                   acclist.push({
      //                     ...a,
      //                     ...s,
      //                   });
      //                 }
      //               }
      //             }
      //             setServicesList(acclist);
      //             if (accountNo !== selectedAccount.accountNo) {
      //               // service = false
      //               // account = false
      //               setAccount(false);
      //               setService(false);
      //               setActiveService(svcList[0].serviceNo);
      //             }
      //           }
      //         } else {
      //           toast.error(
      //             "Failed to fetch account ids data - " + resp.status
      //           );
      //         }
      //       }).catch((error) => console.error(error));
      //     }
      //   }).catch((error) => {
      //     console.error(error)
      //   })
      //   .finally(() => { });

      post(
        properties.ACCOUNT_DETAILS_API +
        "/get-expiry-service-list?limit=10&page=0",
        { customerUuid: customerUuid }
      ).then((resp) => {
        if (resp && resp.data) {
          if (resp.data.length > 0) {
            setExpiryServicesList(resp.data);
          }
        }
      }).catch((error) => console.error(error));
    }
  }, []);

  const [sourceLookup, setSourceLookup] = useState([]);
  const [priorityLookup, setPriorityLookup] = useState([]);

  useEffect(() => {
    get(
      properties.MASTER_API +
      "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY,INTXN_STATUS_REASON"
    )
      .then((resp) => {
        if (resp.data) {
          setSourceLookup(resp.data["TICKET_SOURCE"]);
          setPriorityLookup(resp.data["FOLLOWUP_PRIORITY"]);
        } else {
          // toast.error("Error while fetching address details");
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }, []);

  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [intxnNo, setIntxnNo] = useState("");
  const [followupInputs, setFollowupInputs] = useState({
    priority: "",
    source: "",
    remarks: "",
  });
  const handleOnAddFollowup = (e) => {
    e.preventDefault();
    const { priority, source, remarks } = followupInputs;
    if (!priority || !source || !remarks) {
      toast.error("Please provide mandatory fields");
      return;
    }
    let payload = {
      priorityCode: priority,
      source,
      remarks,
      interactionNumber: intxnNo,
    };

    post(`${properties.INTERACTION_API}/followUp`, { ...payload })
      .then((response) => {
        if (response?.status === 200) {
          toast.success("Follow Up Created Successfully");
          setIsFollowupOpen(false);
          setFollowupInputs({
            priority: "",
            source: "",
            remarks: "",
          });
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  };

  const handleOnFollowupInputsChange = (e) => {
    const { target } = e;
    setFollowupInputs({
      ...followupInputs,
      [target.id]: target.value,
    });
  };

  //useEffect forhtml user permissions
  useEffect(() => {
    let rolePermission = [];

    auth &&
      auth.permissions &&
      auth.permissions.filter(function (e) {
        let property = Object.keys(e);
        if (property[0] === "Users") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            users: Object.values(value[0]),
          };
        } else if (property[0] === "Attachment") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            attachment: Object.values(value[0]),
          };
        } else if (property[0] === "Account") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            account: Object.values(value[0]),
          };
        } else if (property[0] === "Service") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            service: Object.values(value[0]),
          };
        } else if (property[0] === "Complaint") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            complaint: Object.values(value[0]),
          };
        } else if (property[0] === "Inquiry") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            inquiry: Object.values(value[0]),
          };
        } else if (property[0] === "Customer") {
          let value = Object.values(e);
          rolePermission = {
            ...rolePermission,
            customer: Object.values(value[0]),
          };
        }
      });

    let attachmentAdd,
      userEdit,
      accountEdit,
      serviceAdd,
      complaintAdd,
      inquiryAdd,
      viewCust,
      editCust;
    rolePermission?.users &&
      rolePermission?.users.map((screen) => {
        if (screen?.screenName === "Edit User") {
          userEdit = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.attachment &&
      rolePermission?.attachment?.map((screen) => {
        if (screen?.screenName === "Add Attachment") {
          attachmentAdd = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.account &&
      rolePermission?.account.map((screen) => {
        if (screen?.screenName === "Edit Account") {
          accountEdit = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.service &&
      rolePermission?.service.map((screen) => {
        if (screen?.screenName === "Add Service") {
          serviceAdd = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.complaint &&
      rolePermission?.complaint.map((screen) => {
        if (screen?.screenName === "Add Complaint") {
          complaintAdd = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.inquiry &&
      rolePermission?.inquiry.map((screen) => {
        if (screen?.screenName === "Add Inquiry") {
          inquiryAdd = screen?.accessType;
        }
      });
    rolePermission &&
      rolePermission?.customer &&
      rolePermission?.customer.map((screen) => {
        if (screen?.screenName === "View Customer") {
          viewCust = screen?.accessType;
        } else if (screen?.screenName === "Edit Employee") {
          editCust = screen?.accessType;
        }
      });
    setUserPermission({
      editUser: userEdit,
      addAttachment: attachmentAdd,
      editAccount: accountEdit,
      addService: serviceAdd,
      addComplaint: complaintAdd,
      addInquiry: inquiryAdd,
      viewCustomer: viewCust,
      editCustomer: editCust
    });
  }, [auth]);

  // const handleLoadBalances = async (serviceId) => {
  //   if (serviceId !== undefined && serviceId !== null) {
  //     await fetchServiceDetails(serviceId, undefined);
  //   }
  // };

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo);
  };

  const handleSentimentPageSelect = (pageNo) => {
    setSentimentCurrentPage(pageNo)
  };

  const handlePageSelectAddress = (pageNo) => {
    setCurrentPageAddress(pageNo)
  }

  // useEffect(() => {
  //     if (newServiceAddded.isServicesAdded) {
  //         setServiceModal(false)
  //     }
  //     if (selectedAccount && selectedAccount.customerUuid && selectedAccount.accountUuid && selectedAccount.customerUuid !== '' && selectedAccount.accountUuid !== '') {

  //     }
  // }, [newServiceAddded, refreshServiceList]);

  // const fetchServiceDetails = async (serviceId, updatedPortalData) => {
  //   //commented by Alsaad forhtml demo.
  //   // const resp = await slowGet(properties.SERVICE_REALTIME_API + '/' + selectedAccount.customerUuid + '?' + 'account-id=' + selectedAccount.accountUuid + '&service-id=' + serviceId)
  //   // if (resp && resp.data) {
  //   //     updateAccountRealtimeDetails(resp)
  //   //     let found = false
  //   //     setServicesList((prevState) => {
  //   //         const list = prevState.map((e) => {
  //   //             if (e.serviceId === serviceId) {
  //   //                 found = true
  //   //                 if (updatedPortalData) {
  //   //                     updatedPortalData.realtime = resp.data
  //   //                     updatedPortalData.realtimeLoaded = true
  //   //                     return updatedPortalData
  //   //                 } else {
  //   //                     e.realtime = resp.data
  //   //                     e.realtimeLoaded = true
  //   //                     return e
  //   //                 }
  //   //             } else {
  //   //                 return e
  //   //             }
  //   //         })
  //   //         return list
  //   //     })
  //   // } else {
  //   //     toast.error("Failed to fetch account ids data - " + resp.status);
  //   // }
  // };

  // const updateAccountRealtimeDetails = (resp) => {
  //   if (
  //     accountRealtimeDetails.filled === undefined ||
  //     !accountRealtimeDetails.filled
  //   ) {
  //     if (resp.data) {
  //       let firstService = resp.data;
  //       let realtimeData = {};
  //       if (firstService.accountBalance !== undefined) {
  //         realtimeData.accountBalance = firstService.accountBalance;
  //       }
  //       if (firstService.lastPayment !== undefined) {
  //         realtimeData.lastPayment = firstService.lastPayment;
  //       }
  //       if (firstService.lastPaymentDate) {
  //         realtimeData.lastPaymentDate = firstService.lastPaymentDate;
  //       }
  //       if (firstService.accountCreationDate) {
  //         realtimeData.accountCreationDate = firstService.accountCreationDate;
  //       }
  //       if (firstService.billCycle) {
  //         realtimeData.billCycle = firstService.billCycle;
  //       }
  //       if (firstService.billingDetails) {
  //         realtimeData.billingDetails = firstService.billingDetails;
  //       }

  //       realtimeData.serviceType = firstService.serviceType;
  //       realtimeData.filled = true;
  //       setAccountRealtimeDetails(realtimeData);
  //     }
  //   }
  // };

  const handleCellRender = (cell, row) => {
    // if (cell.column.Header === "Campaign Name") {
    //     return (<span className="text-primary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
    // }
    // else if (['Valid From', 'Valid To'].includes(cell.column.Header)) {
    //     return (<span>{formatISODateDDMMMYY(cell.value)}</span>)
    // }
    // else if (cell.column.Header === "Created At") {
    //     return (<span>{formatISODateTime(cell.value)}</span>)
    // }
    // else {
    //     return (<span>{cell.value}</span>)
    // }

    if (cell.column.Header === "Created At") {
      return (<span>{cell.value ? moment(cell.value).format('DD-MM-YYYY') : '-'}</span>)
    } else {
      return <span>{cell.value}</span>
    }
  };

  // const handleAccountSelect = (evnt, e) => {
  //   // console.log('Handle select e is ', e)
  //   setAccountUuid(e?.accountUuid);
  //   setSelectedAccount({
  //     customerUuid: e?.customerUuid,
  //     accountUuid: e?.accountUuid,
  //     accountNo: e?.accountNo,
  //   });
  //   // setAccountNo(e?.accountNo)
  //   pageRefresh();
  // };

  // const handleServicePopupOpen = (evnt, idx) => {
  //   setServiceModal({ state: true });
  //   setSelectedService({ idx: idx });
  // };

  // const handleServicePopupClose = () => {
  //   setServiceModal({ state: false });
  // };

  useEffect(() => {
    if (serviceStatus !== "PENDING") {
      setButtonDisable(false);
    } else {
      setButtonDisable(true);
    }
  }, [activeService]);

  // useEffect(() => {
  //   if (selectedAccount?.accountUuid) {
  //     post(
  //       properties.ACCOUNT_DETAILS_API + "/get-service-list?limit=10&page=0",
  //       {
  //         customerUuid: customerUuid,
  //         accountUuid: selectedAccount?.accountUuid,
  //       }
  //     )
  //       .then((response) => {
  //         if (response.data) {
  //           // console.log(response.data)
  //           let { productDetails } = response.data;
  //           let serviceNo = localStorage.getItem("serviceNo")
  //             ? Number(localStorage.getItem("serviceNo"))
  //             : null;
  //           let selectedService = false;
  //           if (activeService === "") {
  //             if (!!productDetails?.length) {
  //               productDetails.map((product) => {
  //                 if (Number(product.serviceNo) === serviceNo) {
  //                   selectedService = true;
  //                   setActiveService(product.serviceNo);
  //                 }
  //               });
  //             }
  //             if (selectedService === false) {
  //               if (!!productDetails?.length) {
  //                 setActiveService(
  //                   productDetails && productDetails[0]?.productUuid
  //                 );
  //               }
  //             }
  //           }
  //           productDetails = productDetails ? productDetails : [];
  //           // console.log(productDetails)
  //           unstable_batchedUpdates(() => {
  //             setProductList(productDetails);
  //           });
  //         }
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //       })
  //       .finally();
  //   }
  // }, [pageRefreshHandlers.serviceRefresh, refreshPage, selectedAccount]);

  const handleOnManageService = (serviceObject) => {
    console.log("serviceObject ", serviceObject);
    // manageServiceRef.current = serviceObject;
    // setIsManageServicesOpen(true);
    const { accountServices, ...restServiceData } = serviceObject;
    const data = {
      ...accountServices?.filter(f => f.serviceNo === serviceObject.serviceNo)?.[0],
      accountDetails: accountDetails,
      customerDetails
    }

    localStorage.setItem('viewServiceData', JSON.stringify(data))
    window.open(`${properties.REACT_APP_BASE}/view-service`, "_blank");
  };

  const handleAddProduct = (product) => {
    // console.log(product, "============> handleAddProduct handleAddProduct");
    setSelectedProductList([...selectedProductList, product]);
    let totalRc = 0;
    let totalNrc = 0;
    const list = [...selectedProductList, product];
    list.forEach((y) => {
      totalRc = totalRc + Number(y?.totalRc || 0);
      totalNrc = totalNrc + Number(y?.totalNrc || 0);
    });
    setServiceData({ ...serviceData, totalRc, totalNrc });
  };

  const handleDeleteProduct = (product) => {
    setSelectedProductList(
      selectedProductList.filter(
        (x) => Number(x?.productId) !== Number(product?.productId)
      )
    );
    let totalRc = 0;
    let totalNrc = 0;
    selectedProductList
      .filter((x) => Number(x?.productId) !== Number(product?.productId))
      .forEach((y) => {
        totalRc = totalRc + Number(y?.totalRc || 0);
        totalNrc = totalNrc + Number(y?.totalNrc || 0);
      });
    setServiceData({ ...serviceData, totalRc, totalNrc });
  };

  const fetchProductList = (serviceType) => {
    // console.log("serviceType", serviceType);

    get(properties.PRODUCT_API + "?serviceType=" + serviceType?.code)
      .then((response) => {
        if (response.data) {
          const list = response?.data;
          let totalRc = 0;
          let totalNrc = 0;
          list.map((x) => {
            if (x?.productChargesList && x?.productChargesList.length > 0) {
              x?.productChargesList.forEach((y) => {
                if (y?.chargeDetails?.chargeCat === "CC_RC") {
                  totalRc = totalRc + Number(y?.chargeAmount || 0);
                } else if (y?.chargeDetails?.chargeCat === "NCC_RC") {
                  totalNrc = totalNrc + Number(y?.chargeAmount || 0);
                }
              });
            }
            x.totalRc = totalRc;
            x.totalNrc = totalNrc;
            x.serviceTypeDescription = serviceType?.description;
          });
          setProductList(list);
          // console.log("response.data", response.data);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  };

  const getContactDetail = (contacts) => {
    if (contacts && contacts.length) {
      let primaryContact = contacts.find((x) => x.isPrimary);
      primaryContact = primaryContact ? primaryContact : contacts[0];
      return `+${primaryContact.mobilePrefix} ${primaryContact.mobileNo}`;
    }
  };

  function handlePrintClick() {
    setIsPrint(true);
    setTimeout(() => {
      // window.print();
      handlePrint()
      //  setIsPrint(false); // set the state variable back to false after printing
      // setAccountDetailsData(accountDetailsData);
    }, 400);
  }

  const fetchInteractionDetail = (intxnNo) => {
    get(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
      if (resp.status === 200) {
        const response = resp.data?.[0];
        const data = {
          ...response,
          sourceName: 'customer360'
        }
        if (response.customerUuid) {
          localStorage.setItem("customerUuid", response.customerUuid)
          localStorage.setItem("customerIds", response.customerId)
        }
        history(`/interaction360`, { state: { data } })
      } else {
        //
      }
    }).catch(error => {
      console.error(error);
    });
  }

  const getInteractionList = useCallback(() => {
    post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: { customerUuid, customerNo: customerDetails?.customerNo } })
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setInteractionList(resp.data);
          setInteractionData(resp.data?.rows);
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [perPage, currentPage, customerUuid, customerDetails?.customerNo])

  const getOrderList = useCallback(() => {
    post(
      `${properties.ORDER_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: { customerUuid, customerNo: customerDetails?.customerNo } })
      .then((resp) => {
        if (resp?.status === 200) {
          const response = resp?.data && Array.isArray(resp?.data) ? { count: 0, rows: [] } : resp?.data
          setOrderList({ count: response.count, rows: response?.rows ? response?.rows : (response?.row ?? []) });
        } else {
          setOrderList({ count: 0, rows: [] })
        }
      }).catch((error) => console.error(error))
      .finally();
  }, [perPage, currentPage, customerUuid, customerDetails?.customerNo])

  const getFollowUpList = useCallback(() => {
    get(`${properties.CUSTOMER_API}/followup/${customerUuid}?limit=${currentPage}&page=${perPage}`)
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setFollowupList(resp?.data)
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [perPage, currentPage, customerUuid])

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      getInteractionList()
    }
  }, [perPage, currentPage, customerUuid, getInteractionList])

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      getOrderList()
    }
  }, [perPage, currentPage, customerUuid, getOrderList])

  useEffect(() => {
    if (customerUuid && customerUuid !== "") {
      getFollowUpList()
    }
  }, [perPage, currentPage, customerUuid, getFollowUpList])


  const handleFilter = useCallback((filterBy, cardName) => {
    if (cardName === "Channel_Activity_by_Percentage") {
      // console.log('filterBy------------>', filterBy)
      // console.log('channelActivityDataCopy------------>', channelActivityDataCopy)
      if (filterBy === "All") {
        setChannelActivityData(channelActivityDataCopy)
      } else {
        // console.log('channelActivityDataCopy-------->', channelActivityDataCopy)
        const filteredData = channelActivityDataCopy?.filter((ele) => ele?.event === filterBy)
        // console.log('filteredData------>', filteredData)
        setChannelActivityData(filteredData)
      }
    }
    if (cardName === "Avg_Sentiment_Score") {
      if (filterBy === "All") {
        setAvgSentimentData(avgSentimentDataCopy)
      } else {
        const filteredData = avgSentimentDataCopy?.filter((ele) => ele?.details?.entityType === filterBy)
        setAvgSentimentData(filteredData)
      }
    }
    if (cardName === "Sentiments") {
      if (filterBy === "All") {
        setSentimentChartData(sentimentChartDataCopy)
      } else {
        const filteredData = sentimentChartDataCopy?.filter((ele) => ele?.details?.entityType === filterBy)
        setSentimentChartData(filteredData)
      }
    }
  }, [channelActivityDataCopy, sentimentChartDataCopy, avgSentimentDataCopy])

  return (
    <>
      {/* <button onClick={() => setRunTour(true)}>Start Tour</button> */}
      <div className="cnt-wrapper skel-print-hide">
        <div className="card-skeleton">
          <div className="cmmn-skeleton mt-2">
            <span className="skel-profile-heading">
              Overall Insights
            </span>
            <div className="lft-skel skel-insights-top">

              <div className="skel-grid-auto">
                <div className="skel-tot">
                  Total Interaction Count
                  <span>
                    <a style={{ color: '#000' }}
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      onClick={() => {
                        setIsInteractionListOpen(true);
                        setInteractionStatusType("ALL");
                      }}
                    >
                      {interactionList?.count || 0}
                    </a>
                  </span>
                </div>
                <div className="skel-tot">
                  Total Helpdesk Count
                  <span>
                    <a style={{ color: '#000' }}
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      onClick={() => {
                        setIsHelpdeskListOpen(true);
                      }}
                    >
                      {helpdeskList?.count || 0}
                    </a>
                  </span>
                </div>
                {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.OverallInsights?.totalOrderCount || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('OverallInsights')) && <div className="skel-tot">
                  Total Order Count
                  <span>
                    <a style={{ color: '#000' }}
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      onClick={() => {
                        setIsOrderListOpen(true);
                      }}
                    >
                      {orderList?.count || 0}
                    </a>
                  </span>
                </div>}

                <div className="skel-tot">
                  Total Followups
                  <span>
                    <a style={{ color: '#000' }}
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      onClick={() => {
                        setIsFolloupListOpen(true)
                        //setIsInteractionListOpen(true);
                        //  setInteractionStatusType("ALL");
                      }}
                    >
                      {followUpList?.count || 0}
                    </a>
                  </span>
                </div>
                <div className="skel-tot">
                  Overall Experience
                  <p>
                    {/* Number(sentimentScore)?.toFixed(0) < 1 && Number(sentimentScore)?.toFixed(0) >= 0 ? '😡'  */}
                    {Number(sentimentScore)?.toFixed(0) >= 4 ? '😃' : Number(sentimentScore)?.toFixed(0) < 4 && Number(sentimentScore)?.toFixed(0) >= 3 ? '😐' : Number(sentimentScore)?.toFixed(0) < 3 && Number(sentimentScore)?.toFixed(0) >= 2 ? '😟' : Number(sentimentScore)?.toFixed(0) < 2 && Number(sentimentScore)?.toFixed(0) >= 1 ? '😡' : '-'}
                  </p>
                </div>
              </div>
              <div className="skel-btn-center-cmmn">

                <button className="skel-btn-submit" onClick={() => history(`/create-interaction`,
                  {
                    state: {
                      data: {
                        ...customerDetails,
                        ...accountCount,
                      }
                    }
                  })}>Create Interaction</button>
                <button className="skel-btn-submit" onClick={() => history(`/create-helpdesk`,
                  {
                    state: {
                      data: {
                        ...customerDetails
                      }
                    }
                  })}>Create Helpdesk</button>

              </div>
            </div>
          </div>

          {/* <div className="cmmn-skeleton customer-skel"> */}
          <div className="">
            <div className="mt-2">
              <div className="form-row">
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className="skel-profile-base">
                      <div className="skel-profile-info">
                        <CustomerDetailsFormViewMin
                          data={{
                            customerData: customerDetails,
                            accountCount: accountCount,
                            serviceCount: servicesList?.length,
                            interactionCount: interactionList?.count,
                            invoiceCounts,
                            hideAccSerInt: true,
                            source: "CUSTOMER",
                            dtWorksProductType,
                            // modulePermission: modulePermission,
                            userPermission: userPermission
                          }}
                          handler={{ setCustomerDetails, pageRefresh, handlePrintClick }}
                        />
                      </div>
                    </div>
                    <div className="skel-serv-sect-revenue">
                      <div>
                        <span>
                          Revenue:
                          <br />
                          {revenueDetails?.currency}{revenueDetails?.totalAmount
                            ? Number(revenueDetails?.totalAmount)
                            : 0}
                        </span>
                      </div>
                      <div>
                        <span>
                          Average:
                          <br />
                          {revenueDetails?.currency}{revenueDetails?.averageAmount
                            ? Number(revenueDetails?.averageAmount).toFixed(2)
                            : 0}
                        </span>
                      </div>
                    </div>
                    <hr className="cmmn-hline mt-2" />
                    {/* <div className="skel-inter-view-history mt-2">
                    <span className="skel-header-title">Interactions</span>
                    <div className="skel-tot-inter">
                      <div className="skel-tot">
                        Total
                        <span>
                          <a
                            data-toggle="modal"
                            data-target="#skel-view-modal-interactions"
                            onClick={() => {
                              setIsInteractionListOpen(true);
                              setInteractionStatusType("ALL");
                            }}
                          >
                            {interactionList?.count || 0}
                          </a>
                        </span>
                      </div>
                      <div className="skel-tot">
                        Open
                        <span>
                          <a
                            data-toggle="modal"
                            data-target="#skel-view-modal-interactions"
                            onClick={() => {
                              setIsInteractionListOpen(true);
                              setInteractionStatusType("OPEN");
                            }}
                          >
                            {openInteractionCount.current.length || 0}
                          </a>
                        </span>
                      </div>
                      <div className="skel-tot">
                        Closed
                        <span>
                          <a
                            data-toggle="modal"
                            data-target="#skel-view-modal-interactions"
                            onClick={() => {
                              setIsInteractionListOpen(true);
                              setInteractionStatusType("CLOSED");
                            }}
                          >
                            {closedInteractionCount.current.length || 0}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div> */}
                    <img
                      src={vIcon}
                      alt=""
                      className="img-fluid skel-place-img"
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className='d-flex'>
                      <span className="skel-profile-heading">
                        {props?.appsConfig?.clientFacingName?.customer} Sentiments
                      </span>
                      <CardFilter cardName='Sentiments' hanlder={{ handleFilter }} />
                    </div>
                    <SentimentChart data={{ chartData: sentimentChartData }} handlers={{ setIssetimentPopupOpen, setSentimentFilter }} />
                  </div>
                  {/* <div className="skel-view-base-card skel-cust-ht-sect">
                                    <span className="skel-profile-heading">Intelligence Corner</span>
                                    <IntelligenceCorner data={{ intelligenceList, interactionData, customerData: customerDetails, servicesList }} />

                                </div> */}
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className='d-flex'>
                      <span className="skel-profile-heading">
                        Avg Sentiment Score
                      </span>
                      <CardFilter cardName='Avg_Sentiment_Score' hanlder={{ handleFilter }} />
                    </div>
                    <SentimentGauge
                      data={{ chartData: avgSentimentData }}
                      handler={{
                        setSentimentScore
                      }}
                    />
                  </div>
                  {/* <div className="skel-view-base-card skel-cust-ht-sect">
                                    <span className="skel-profile-heading">Intelligence Corner</span>
                                    <IntelligenceCorner data={{ intelligenceList, interactionData, customerData: customerDetails, servicesList }} />

                                </div> */}
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className='d-flex'>
                      <span className="skel-profile-heading">
                        Top 10 Interactions with Negative Sentiments (Red- Most Negative)
                      </span>
                      {/* <CardFilter hanlder={{ handleFilter }} /> */}
                    </div>
                    <NegativeScatterChart data={{ chartData: sentimentChartData }} />
                  </div>
                  {/* <div className="skel-view-base-card skel-cust-ht-sect">
                                    <span className="skel-profile-heading">Intelligence Corner</span>
                                    <IntelligenceCorner data={{ intelligenceList, interactionData, customerData: customerDetails, servicesList }} />

                                </div> */}
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className="d-flex">
                      <span className="skel-profile-heading">
                        Channel Activity by Percentage (%)
                      </span>
                      <CardFilter cardName='Channel_Activity_by_Percentage' hanlder={{ handleFilter }} />
                    </div>
                    <ChannelActivityChart data={{ chartData: channelActivityData }} />
                  </div>
                  {/* <div className="skel-view-base-card skel-cust-ht-sect">
                                    <span className="skel-profile-heading">Intelligence Corner</span>
                                    <IntelligenceCorner data={{ intelligenceList, interactionData, customerData: customerDetails, servicesList }} />

                                </div> */}
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <span className="skel-profile-heading">
                      Channel Performance
                    </span>
                    <ChannelPerformanceChart data={{ chartData: channelActivity }} />
                  </div>
                  {/* <div className="skel-view-base-card skel-cust-ht-sect">
                                    <span className="skel-profile-heading">Intelligence Corner</span>
                                    <IntelligenceCorner data={{ intelligenceList, interactionData, customerData: customerDetails, servicesList }} />

                                </div> */}
                </div>
              </div>
              <div className="form-row d-flex-wrap">
                <div className='f-wrap-child'>
                  <div className="">
                    <div className="skel-view-base-card">
                      <div className="skel-inter-statement">
                        <span className="skel-profile-heading">
                          Interaction Details({interactionList?.count || 0}){" "}
                          <span
                            className="skel-badge badge-yellow"
                            onClick={() => {
                              history(
                                `/create-interaction`,
                                { state: { data: customerDetails } }
                              );
                            }}
                          >
                            <a>+</a>
                          </span>
                        </span>
                        <div className="skel-cust-view-det">
                          {interactionData?.length ? (
                            interactionData.map((val, idx) => (
                              <>
                                <div
                                  key={idx}
                                  className="skel-inter-hist"
                                  onClick={() => {
                                    handleInteractionModal(val);
                                  }}
                                >
                                  <div className="skel-serv-sect-lft">
                                    <span
                                      className="skel-lbl-flds"
                                      data-toggle="modal"
                                      data-target="#skel-view-modal-accountdetails"
                                    // style={{ color: "#1675e0" }}
                                    >
                                      ID: {val.intxnNo}
                                    </span>
                                    <span className="mt-1">{val.problemCause}</span>
                                    <span className="skel-cr-date">
                                      Created On: {val?.createdAt ? moment(val.createdAt).format('DD-MM-YYYY') : '-'}
                                    </span>
                                    <span className="skel-h-status mt-1">
                                      {val.intxnPriority?.description}
                                    </span>
                                  </div>
                                </div>
                              </>
                            ))
                          ) : (
                            <span className="skel-widget-warning">
                              No Interaction Found!!!
                            </span>
                          )}
                        </div>
                        {/* <a className="skel-a-lnk" data-target="#skel-view-modal-inter" data-toggle="modal">View All Interactions</a> */}
                      </div>
                    </div>
                  </div>
                </div>

                {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.Order || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Order')) && <div className='f-wrap-child'>
                  <div className="">
                    <div className="skel-view-base-card">
                      <span className="skel-profile-heading">
                        Order Details({orderList?.rows?.length}){" "}
                        <span className="skel-badge badge-blue" onClick={() => {
                          //setOpenAddServiceModal(true)

                          history(
                            `/new-customer`,
                            {
                              state: {
                                data: {
                                  customerDetails,
                                  pageIndex: 2,
                                  edit: true,
                                }
                              }
                            }
                          )
                        }}>
                          <span
                            data-toggle="modal"
                            data-target="#skel-view-modal-interactions"
                          >
                            +
                          </span>
                        </span>
                      </span>
                      <div className="skel-cust-view-det">
                        {orderList?.rows?.length > 0 ?
                          <>
                            {orderList?.rows?.map((val, idx) => (
                              <div
                                key={idx}
                                className="skel-inter-hist"
                                onClick={() => {
                                  hanldeOpenOrderModal(val);
                                }}
                              >
                                <div className="skel-serv-sect-lft">
                                  <span className="skel-lbl-flds">
                                    ID: {val.orderNo}
                                  </span>
                                  <span className="mt-1">{val.orderDescription}</span>
                                  <span className="skel-cr-date">
                                    Created On: {val.orderDate}
                                  </span>
                                  <span className="skel-m-status mt-1">
                                    {val.orderPriority?.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </> :
                          <span className="skel-widget-warning">
                            No order Found!!!
                          </span>
                        }
                      </div>
                      {/* <a className="skel-a-lnk" data-target="#skel-view-modal-inter" data-toggle="modal">View All Orders</a> */}
                    </div>
                  </div>
                </div>}

                {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.Services || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Services')) && <div className='f-wrap-child'>
                  <div className="">
                    <div className="skel-view-base-card">
                      <span className="skel-profile-heading">
                        Service Details({servicesList?.length || 0}){" "}
                        <span
                          className="skel-badge badge-marron"
                          onClick={() => {
                            //setOpenAddServiceModal(true)
                            history(
                              `/new-customer`,
                              {
                                state: {
                                  data: {
                                    customerDetails,
                                    pageIndex: 2,
                                    edit: true,
                                  },
                                }
                              }
                            )
                          }}
                        >
                          <span>+</span>
                        </span>
                      </span>
                      <div className="skel-cust-view-det">
                        {servicesList ? <>
                          {
                            servicesList.map((val, idx) => (
                              <div
                                key={idx}
                                className="skel-inter-hist"
                                onClick={() => handleOnManageService(val)}
                              >
                                <div className="skel-serv-sect-lft">
                                  <span
                                    className="skel-lbl-flds"
                                    data-toggle="modal"
                                    data-target="#skel-view-modal-accountdetails"
                                  >
                                    {val?.serviceNo}
                                    {/* {val?.accountNo} */}
                                  </span>
                                  <span>
                                    {/* {val?.serviceNo}:-{" "} */}
                                    {val?.accountNo}:-{" "}
                                    {val?.productDetails?.[0]?.productName}
                                  </span>
                                  <span className="skel-cr-date">
                                    Type: {val?.srvcTypeDesc?.description}
                                  </span>
                                  <span className="skel-cr-date">
                                    Activate From: {val?.activationDate}
                                  </span>
                                </div>
                                <div className="skel-updown-icon">
                                  <a>
                                    <img src={arrowDown} />
                                  </a>
                                </div>
                              </div>
                            ))
                          }</>
                          : <span className="skel-widget-warning">
                            No Service Found!!!
                          </span>
                        }
                      </div>
                      {/* <a className="skel-a-lnk" data-toggle="modal" data-target="#skel-view-modal-accountdetails">View All Services</a> */}
                    </div>
                  </div>
                </div>}

                {/*** Feedback ***/}
                <SurveyFeedback data={{ customerNo: customerDetails?.customerNo }} />
                {/*** Feedback Ends ***/}
              </div>
              <div className="form-row">
                {/* <div className="col-md-4">
                                <div className="skel-view-base-card">
                                    <div className="skel-inter-statement">
                                        <span className="skel-profile-heading">Billing Scheduled ({scheduleContract?.rows && scheduleContract?.rows?.length || 0})</span>
                                        <div className="skel-cust-view-det">
                                            {scheduleContract?.rows && scheduleContract?.rows.length > 0 ? <> {
                                                scheduleContract?.rows.map((val, idx) => (
                                                    <>
                                                        <div key={idx} className="skel-inter-hist">
                                                            <div className="skel-serv-sect-lft">
                                                                <span className="skel-lbl-flds" data-toggle="modal" data-target="#skel-view-modal-accountdetails">Contract Name: {val?.contractName || ""}</span>
                                                                <span className="mt-1"> start Date: {val?.actualStartDate ? moment(val?.actualStartDate).format('DD-MM-YYYY') : ''}</span>
                                                                <span className="skel-cr-date">End Date: {val?.actualEndDate ? moment(val?.actualEndDate).format('DD-MM-YYYY') : ''}</span>
                                                                <span className="skel-h-status mt-1">{val?.statusDesc?.description}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ))
                                            }</> : <span className="skel-widget-warning">No Schedule Billing</span>

                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="skel-view-base-card">
                                    <div className="skel-inter-statement">
                                        <span className="skel-profile-heading">Payment Scheduled ({scheduleContract?.rows && scheduleContract?.rows?.length || 0})</span>
                                        <div className="skel-cust-view-det">
                                            {scheduleContract?.rows && scheduleContract?.rows.length > 0 ? <> {
                                                scheduleContract?.rows.map((val, idx) => (
                                                    <>
                                                        <div key={idx} className="skel-inter-hist">
                                                            <div className="skel-serv-sect-lft">
                                                                <span className="skel-lbl-flds" data-toggle="modal" data-target="#skel-view-modal-accountdetails">Contract Name: {val?.contractName || ""}</span>
                                                                <span className="mt-1"> start Date: {val?.actualStartDate ? moment(val?.actualStartDate).format('DD-MM-YYYY') : ''}</span>
                                                                <span className="skel-cr-date">End Date: {val?.actualEndDate ? moment(val?.actualEndDate).format('DD-MM-YYYY') : ''}</span>
                                                                <span className="skel-h-status mt-1">{val?.statusDesc?.description}</span>
                                                            </div>
                                                        </div>
                                                    </>
                                                ))
                                            }</> : <span className="skel-widget-warning">No Schedule Payment</span>

                                            }
                                        </div>
                                    </div>
                                </div>
                            </div> */}
                {/* <div className="col-md-4">
                                <div className="skel-view-base-card">
                                    <div className="skel-inter-statement">
                                        <span className="skel-profile-heading">Revenue and ARPU</span>
                                        <div className="skel-cust-view-det">
                                            <div className="skel-inter-hist">
                                                <div className="skel-serv-sect-lft">
                                                    <span className="skel-cr-date" data-toggle="modal" data-target="#skel-view-modal-accountdetails">Revenue: {revenueDetails?.totalAmount ? Number(revenueDetails?.totalAmount) : 0}</span>
                                                    <span className="skel-cr-date" data-toggle="modal" data-target="#skel-view-modal-accountdetails">Average: {revenueDetails?.averageAmount ? Number(revenueDetails?.averageAmount).toFixed(2) : 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div> */}
              </div>
              <div className="form-row d-flex-wrap">
                {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.Appointments || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Appointments')) && <div className='f-wrap-child f-flex-grow'>
                  <div className="col-lg-12 col-md-12 col-xs-12">
                    <div className="skel-view-base-card">
                      <span className="skel-profile-heading">
                        Appointment Details{" "}
                        <span className="skel-badge badge-green">
                          <span data-toggle="modal"
                            data-target="#skel-view-modal-appointment">
                            {appointmentList?.length}
                          </span>
                        </span>
                      </span>
                      <div
                        className={`skel-cust-view-det ${appointmentList?.length > 0 ? "" : "text-center"
                          }`}
                      >
                        {appointmentList?.length > 0 ? (
                          appointmentList?.map((appointment, index) => (
                            <div
                              key={index}
                              className="skel-inter-hist appt-hist d-flex"
                            >
                              <div className="skel-appt-date">
                                {moment(appointment.appointDate).format("DD-MMM")}{" "}
                                <span>
                                  {moment(appointment.appointDate).format("YYYY")}
                                </span>
                              </div>
                              <div className="skel-appt-bk-det appt-hist-det">
                                <span>
                                  {appointment?.appointmentCustomer?.firstName}{" "}
                                  {appointment?.appointmentCustomer?.lastName}
                                </span>
                                <br />
                                <span>
                                  {getContactDetail(
                                    appointment?.appointmentCustomer
                                      ?.customerContact
                                  )}
                                </span>
                                <br />
                                <span className="skel-cr-date">
                                  {moment(appointment.createdAt).format(
                                    "DD MMM, YYYY"
                                  )}
                                </span>
                                <div className="skel-appt-type-bk">
                                  <ul>
                                    <li className="skel-ty-clr">
                                      {capitalizeFirstLetter(
                                        appointment?.appointMode?.description ?
                                          appointment?.appointMode?.description
                                            ?.toLowerCase()
                                            ?.split("_")[0] :
                                          appointment?.appointMode?.toLowerCase()
                                            ?.split("_")[0]
                                      )}
                                    </li>
                                    <li className="skel-ch-clr">
                                      {appointment?.appointStartTime} - {appointment?.appointEndTime}
                                    </li>
                                    <li>
                                      {["AUDIO_CONF", "VIDEO_CONF"].includes(appointment.appointMode) ? (
                                        <a href={appointment.appointModeValue} target="_blank">Click here</a>
                                      ) : (
                                        <span>{appointment?.appointModeValue?.description ? appointment?.appointModeValue?.description : appointment?.appointModeValue}</span>
                                      )}
                                    </li>
                                  </ul>
                                </div>

                                {/*** Reschedule Appointment ***/}
                                {/* <div className='skel-appt-shcld'>
                                  <ul className="wsc-schdl-appt skel-btn-center-cmmn">
                                    <li><a href="#" className="wsc-cancel-appt skel-btn-cancel" onClick={() => setShowRescheduleDelete(true)}>Cancel Appointment</a></li>
                                    <li><a href="#" className="wsc-reschedule-appt skel-btn-submit" onClick={() => setShowReschedule(true)}>Reschedule</a></li>
                                  </ul>
                                </div> */}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="skel-widget-warning">
                            No Appointments Found!!!
                          </span>
                        )}
                      </div>
                      {/* <a className="skel-a-lnk" data-toggle="modal" data-target="#skel-view-modal-appointment">View Appointment</a> */}
                    </div>
                  </div>
                </div>}
                <div className='f-wrap-child'>
                  <div className="col-lg-12 col-md-12 col-xs-12">
                    <div className="skel-view-base-card">
                      <span className="skel-profile-heading">{props?.appsConfig?.clientFacingName?.customer ?? 'Customer'} Journey</span>
                      <div className="skel-cust-view-det skel-emoj-data mt-3">
                        <CustomerJourney
                          data={{ customerEmotions, height: "400%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tab-scroller mt-2">
                <div className="container-fluid" id="list-wrapper">
                  <div className="wrapper1">
                    <ul
                      className="nav nav-tabs skel-tabs list"
                      id="list"
                      role="tablist"
                    >
                      <li className="nav-item">
                        <a className={`nav-link  ${tabType === "customerHistory" ? "active" : ""}`}
                          id="CUSTHIST-tab"
                          data-toggle="tab"
                          href="#CUSTHIST"
                          role="tab"
                          aria-controls="CUSTHIST"
                          aria-selected="true"
                          onClick={(evnt) => { handleTypeSelect("customerHistory"); getCustomerHistoryData('customerHistory') }}>
                          {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'} History
                        </a>
                      </li>
                      <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "addressHistory" ? "active" : ""
                            }`}
                          id="ADDRHIST-tab"
                          data-toggle="tab"
                          href="#ADDRHIST"
                          role="tab"
                          aria-controls="ADDRHIST"
                          aria-selected="true"
                          onClick={(evnt) => { handleTypeSelect("addressHistory"); getCustomerHistoryData('addressHistory') }}
                        >
                          Address History
                        </a>
                      </li>
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Billed Contract'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Billed Contract')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "monthlyBilled" ? "active" : ""
                            }`}
                          id="BC-tab"
                          data-toggle="tab"
                          href="#BC"
                          role="tab"
                          aria-controls="BC"
                          aria-selected="true"
                          onClick={() => handleTypeSelect("monthlyBilled")}
                        >
                          Billed Contract
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['UnBilled Contract'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('UnBilled Contract')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "unbilled" ? "active" : ""
                            }`}
                          id="UBC-tab"
                          data-toggle="tab"
                          href="#UBC"
                          role="tab"
                          aria-controls="UBC"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("unbilled")}
                        >
                          UnBilled Contract
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Billing Scheduled'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Billing Scheduled')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "history" ? "active" : ""
                            }`}
                          id="CH-tab"
                          data-toggle="tab"
                          href="#CH"
                          role="tab"
                          aria-controls="CH"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("history")}
                        >
                          Billing Scheduled
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Invoice'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Invoice')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "Invoice" ? "active" : ""
                            }`}
                          id="invoice-tab"
                          data-toggle="tab"
                          href="#invoice"
                          role="tab"
                          aria-controls="invoice"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("Invoice")}
                        >
                          Invoice
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Interaction'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Interaction')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "interaction" ? "active" : ""
                            }`}
                          id="interaction-tab"
                          data-toggle="tab"
                          href="#interaction"
                          role="tab"
                          aria-controls="interaction"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("interaction")}
                        >
                          Interaction
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Order'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Order')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "order" ? "active" : ""
                            }`}
                          id="order-tab"
                          data-toggle="tab"
                          href="#order"
                          role="tab"
                          aria-controls="order"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("order")}
                        >
                          Order
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Help Desk'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Help Desk')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "helpdesk" ? "active" : ""
                            }`}
                          id="helpdesk-tab"
                          data-toggle="tab"
                          href="#helpdesk"
                          role="tab"
                          aria-controls="helpdesk"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("helpdesk")}
                        >
                          Help Desk
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Payment Scheduled'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Payment Scheduled')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "payment" ? "active" : ""
                            }`}
                          id="payment-tab"
                          data-toggle="tab"
                          href="#paymenthistory"
                          role="tab"
                          aria-controls="payment"
                          aria-selected="true"
                          onClick={(evnt) => handleTypeSelect("payment")}
                        >
                          Payment Scheduled
                        </a>
                      </li>}
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['Payment History'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('Payment History')) && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "paymentHistory" ? "active" : ""
                            }`}
                          id="payment-tab-history"
                          data-toggle="tab"
                          href="#paymenttabhistory"
                          role="tab"
                          aria-controls="payment"
                          aria-selected="true"
                          onClick={(evnt) => handleTypeSelect("paymentHistory")}
                        >
                          Payment History
                        </a>
                      </li>}
                      <li className="nav-item">
                        {<a
                          className={`nav-link  ${tabType === "appointment" ? "active" : ""
                            }`}
                          id="appointment-tab"
                          data-toggle="tab"
                          href="#appointment"
                          role="tab"
                          aria-controls="appointment"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("appointment")}
                        >
                          Appointment History ({appointmentList?.length || 0})
                        </a>}
                      </li>
                      {(props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs?.['oms'] || !props?.appsConfig?.clientConfig?.["Customer 360"]?.sectionConfigs.hasOwnProperty('oms')) && showActiveTab === "FIXED LINE" && <li className="nav-item">
                        <a
                          className={`nav-link  ${tabType === "oms" ? "active" : ""
                            }`}
                          id="oms-tab"
                          data-toggle="tab"
                          href="#oms"
                          role="tab"
                          aria-controls="oms"
                          aria-selected="true"
                          onClick={(evnt) => handleTypeSelect("oms")}
                        >
                          OMS
                        </a>
                      </li>}
                    </ul>
                  </div>
                </div>

                <div className="card-body">
                  <div className="tab-content">
                    <div
                      className={`tab-pane fade ${tabType === "oms" ? "show active" : ""
                        }`}
                      id="oms"
                      role="tabpanel"
                      aria-labelledby="oms-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "oms" && showActiveTab === "FIXED LINE" && <ViewTicketDetails
                          data={{
                            customerDetail: customerDetails,
                            identificationNo: props?.location?.state?.data?.customerRefNo
                          }}
                        />}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "customerHistory" ? "show active" : ""
                        }`}
                      id="CUSTHIST"
                      role="tabpanel"
                      aria-labelledby="CUSTHIST-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {
                          tabType === "customerHistory" && customerDetailsList.length > 0 ?
                            <DynamicTable
                              listKey={"Customer Details History"}
                              row={customerDetailsList}
                              rowCount={totalCount}
                              header={CustomerDetailsColumns}
                              itemsPerPage={perPage}
                              backendPaging={true}
                              columnFilter={true}
                              backendCurrentPage={currentPage}
                              handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage
                              }}
                            />
                            :
                            <p className="skel-widget-warning">No records found!!!</p>
                        }
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "addressHistory" ? "show active" : ""
                        }`}
                      id="ADDRHIST"
                      role="tabpanel"
                      aria-labelledby="ADDRHIST-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {
                          tabType === "addressHistory" && customerAddressList.length > 0 ?
                            <DynamicTable
                              listKey={"Customer Address History"}
                              row={customerAddressList}
                              rowCount={totalCountAddress}
                              header={CustomerAddressColumns}
                              itemsPerPage={perPageAddress}
                              backendPaging={true}
                              columnFilter={true}
                              backendCurrentPage={currentPageAddress}
                              handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelectAddress,
                                handleItemPerPage: setPerPageAddress,
                                handleCurrentPage: setCurrentPageAddress,
                              }}
                            />
                            :
                            <p className="skel-widget-warning">No records found!!!</p>
                        }
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "monthlyBilled" ? "show active" : ""
                        }`}
                      id="BC"
                      role="tabpanel"
                      aria-labelledby="BC-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "monthlyBilled" && selectedAccount && selectedAccount?.accountNo ? (
                          <SearchContract
                            data={{
                              data: {
                                //   billRefNo: selectedAccount?.accountNo,
                                customerUuid,
                              },
                              hideForm: true,
                              contractType: tabType,
                              // contractType: "billed",
                              refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                              from: "Customer360",
                            }}
                            handler={{
                              pageRefresh: handleContractInvoicePaymentRefresh,
                            }}
                          />
                        ) : (
                          <span className="msg-txt pt-1">
                            No Contracts Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "unbilled" ? "show active" : ""
                        }`}
                      id="UBC"
                      role="tabpanel"
                      aria-labelledby="UBC-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "unbilled" && selectedAccount && selectedAccount?.accountNo ? (
                          <SearchContract
                            data={{
                              data: {
                                //   billRefNo: selectedAccount?.accountNo,
                                customerUuid,
                              },
                              hideForm: true,
                              contractType: tabType,
                              // contractType: "unbilled",
                              refresh:
                                pageRefreshHandlers.contractInvoicePaymentRefresh,
                              from: "Customer360",
                            }}
                            handler={{
                              pageRefresh: handleContractInvoicePaymentRefresh,
                            }}
                          />
                        ) : (
                          <span className="msg-txt pt-1">
                            No Contracts Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "history" ? "show active" : ""
                        }`}
                      id="CH"
                      role="tabpanel"
                      aria-labelledby="CH-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "history" && selectedAccount && selectedAccount?.accountNo ? (
                          <SearchContract
                            data={{
                              data: {
                                //     billRefNo: selectedAccount?.accountNo,
                                customerUuid,
                              },
                              hideForm: true,
                              contractType: tabType,
                              // contractType: "history",
                              refresh:
                                pageRefreshHandlers.contractInvoicePaymentRefresh,
                              from: "Customer360",
                            }}
                            handler={{
                              pageRefresh: handleContractInvoicePaymentRefresh,
                            }}
                          />
                        ) : (
                          <span className="msg-txt pt-1">
                            No Contracts Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "Invoice" ? "show active" : ""
                        }`}
                      id="invoice"
                      role="tabpanel"
                      aria-labelledby="Invoice-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "Invoice" && selectedAccount && selectedAccount?.accountNo ? (
                          <SearchInvoice
                            data={{
                              data: {
                                customerUuid,
                                customerDetails,
                                startDate: null,
                                endDate: null,
                                billingStatus: statusConstantCode?.status?.PENDING,
                                billingStatusCondition: 'notIn',
                              },
                              hideForm: true,
                              tabType,
                              refresh:
                                pageRefreshHandlers.contractInvoicePaymentRefresh,
                              from: "Customer360",
                            }}
                          />
                        ) : (
                          <span className="msg-txt pt-1">
                            No Invoice Available
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "helpdesk" ? "show active" : ""
                        }`}
                      id="helpdesk"
                      role="tabpanel"
                      aria-labelledby="helpdesk-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "helpdesk" && customerDetails && (
                          <Helpdesk
                            data={{
                              customerDetails: customerDetails,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "payment" ? "show active" : ""
                        }`}
                      id="paymenthistory"
                      role="tabpanel"
                      aria-labelledby="payment-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {
                          tabType === "payment" && <Payment
                            data={{
                              selectedAccount: selectedAccount,
                            }}
                          />
                        }
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "paymentHistory" ? "show active" : ""
                        }`}
                      id="paymenttabhistory"
                      role="tabpanel"
                      aria-labelledby="payment-tab-history"
                    >
                      <div className="cmmn-container-base no-brd">
                        {
                          tabType === "paymentHistory" &&
                          <PaymentHistory
                            data={{
                              accountData: { customerUuid },
                              refresh: refreshPage
                            }}
                            handler={{
                              pageRefresh: pageRefresh
                            }}
                          />
                        }
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "order" ? "show active" : ""
                        }`}
                      id="order"
                      role="tabpanel"
                      aria-labelledby="order-tab"
                    >
                      {/* {console.log('tabType-------->', tabType)} */}
                      <div className="cmmn-container-base no-brd">
                        {tabType === "order" && customerDetails && (
                          <WorkOrders
                            data={{
                              customerDetails,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className={`tab-pane fade ${tabType === "interaction" ? "show active" : ""
                        }`}
                      id="interaction"
                      role="tabpanel"
                      aria-labelledby="interaction-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {tabType === "interaction" && customerDetails && (
                          <Interactions
                            data={{
                              customerDetails,
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className={`tab-pane fade ${tabType === "appointment" ? "show active" : ""}`} id="appointment" role="tabpanel" aria-labelledby="appointment-tab">
                      <div className="cmmn-container-base no-brd">
                        <DynamicTable
                          row={appointmentList}
                          header={appointmentColumns}
                          itemsPerPage={perPage}
                          backendPaging={false}
                          columnFilter={true}
                          rowCount={appointmentList?.length}
                          handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setPerPage,
                            handleCurrentPage: setCurrentPage,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={openAddServiceModal} contentLabel="Search Modal" onHide={handleOnModelClose} dialogClassName='cust-lg-modal'
          >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">Add Service</h5>
              </Modal.Title>
              <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="row">
                <CustomerServiceForm
                  data={{
                    serviceTypeLookup,
                    serviceData,
                    productList,
                    selectedProductList,
                  }}
                  handler={{
                    setServiceData,
                    fetchProductList,
                    handleAddProduct,
                    handleDeleteProduct,
                  }}
                />
                {/* <button
                type="button"
                className="close"
                onClick={handleOnModelClose}
              >
                <span aria-hidden="true">&times;</span>
              </button> */}
              </div>
            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
              <div className="skel-btn-center-cmmn">
                <button type="button" className="skel-btn-cancel" onClick={handleOnModelClose}>Close</button>
              </div>
            </Modal.Footer>
          </Modal>
        }
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={openInteractionModal} onHide={handleOnModelClose} dialogClassName='cust-lg-modal' >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">Details for Interaction Number  {interactionModalData?.intxnNo}</h5>
                <a style={{ cursor: 'pointer', color: "#1675e0", marginRight: '100px' }} onClick={() => fetchInteractionDetail(interactionModalData?.intxnNo)}
                >Go to Interaction 360 View</a>
                <a style={{ cursor: 'pointer', color: "#1675e0" }}
                  onClick={() => {
                    setIntxnNo(interactionModalData?.intxnNo)
                    callFollowupHistory(interactionModalData?.intxnNo)
                    setIsFollowupOpen(true)
                    handleOnModelClose()
                  }}
                >Do a followup</a>
              </Modal.Title>
              <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="modal-body px-4">
                <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label htmlFor="Statement" className="control-label">
                          Statement
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.requestStatement}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Interactiontype" className="control-label">
                          Interaction Category
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnCategory?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Interactiontype" className="control-label">
                          Interaction Type
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnType?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Servicetype" className="control-label">
                          Service Category
                        </label>
                        <span className="data-cnt">
                          {
                            interactionModalData?.serviceCategory
                              ?.description
                          }
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Servicetype" className="control-label">
                          Project
                        </label>
                        <span className="data-cnt">
                          {
                            interactionModalData?.project
                          }
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Servicetype"
                          className="control-label"
                        >
                          Service type
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.serviceType?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Channel" className="control-label">
                          Channel
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnChannel?.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Priority" className="control-label">
                          Priority
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnPriority?.description}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group uploader">
                        <label
                          htmlFor="Contactpreferenece"
                          className="control-label"
                        >
                          Attachment
                        </label>
                        <div className="attachment-details">
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </Modal.Body>
          </Modal>
        }
        {/* {console.log('orderModalData====', orderModalData)} */}
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={openOrderModal} onHide={handleOnModelClose} dialogClassName='cust-lg-modal' >
            {/* <div className="row">
              <div
                className=""
                style={{ width: "100%" }}
                id="skel-view-modal-inter"
                tabIndex="-1"
              >
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header px-4 border-bottom-0 d-block">
                      <h5 className="modal-title">
                        Details for Order Number {orderModalData?.orderNo}
                      </h5>
                      <Link
                        to={{
                          pathname: `/order360`,
                          state: {
                            data: { orderNo: orderModalData?.orderNo, customerUid: orderModalData?.customerDetails?.customerUuid },
                          }
                        }}
                      >
                        Go to Order 360 View
                      </Link>
                      <button
                        type="button"
                        className="close"
                        onClick={handleOnModelClose}
                      >
                        <span aria-hidden="true">&times;</span>
                      </button>
                    </div> */}
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">Details for Order Number {orderModalData?.orderNo}</h5>
                <Link
                  to={`/order360`}
                  state={{
                    data: {
                      orderNo: orderModalData?.orderNo,
                      customerUid: orderModalData?.customerDetails?.customerUuid
                    }
                  }}
                >Go to Order 360 View</Link>
              </Modal.Title>
              <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              {orderModalData?.orderProductDetails.map((val, i) => (
                <div
                  key={i}
                  className="skel-view-base-card modal-body px-4"
                >
                  <form>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="Statement" className="control-label">
                            Order Details
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderDescription}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="Statement" className="control-label">
                            Child Order No
                          </label>
                          <span className="data-cnt">
                            {orderModalData.orderNo}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Interactiontype"
                            className="control-label"
                          >
                            Order Type
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderType?.description}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Servicetype"
                            className="control-label"
                          >
                            Service type
                          </label>
                          <span className="data-cnt">
                            {val?.serviceType?.description}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Channel"
                            className="control-label"
                          >
                            Channel
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderChannel?.description}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Channel"
                            className="control-label"
                          >
                            Order Family
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderFamily?.description}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Channel"
                            className="control-label"
                          >
                            Order Status
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderStatus?.description}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Problemstatement"
                            className="control-label"
                          >
                            Product Name1
                          </label>
                          <span className="data-cnt">
                            {
                              val?.productDetails
                                ?.productName
                            }
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Problemstatement"
                            className="control-label"
                          >
                            Product Family
                          </label>
                          <span className="data-cnt">
                            {
                              val?.productDetails
                                ?.productFamily?.description
                            }
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Problemstatement"
                            className="control-label"
                          >
                            Product Categry
                          </label>
                          <span className="data-cnt">
                            {
                              val?.productDetails
                                ?.productCategory?.description
                            }
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Problemstatement"
                            className="control-label"
                          >
                            Product Amount
                          </label>
                          <span className="data-cnt">
                            {val?.productDetails?.chargeList.reduce((acc, item) => {
                              return acc + Number(item?.chargeAmount || 0);
                            }, 0)}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label
                            htmlFor="Priority"
                            className="control-label"
                          >
                            Priority
                          </label>
                          <span className="data-cnt">
                            {orderModalData?.orderPriority?.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

              ))}
            </Modal.Body>
            {/* </div>
                </div>
              </div>
            </div> */}
          </Modal>
        }
        {
          <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >
            <ManageService
              data={{
                isManageServicesOpen,
                manageServiceRef,
                selectedAccount,
                selectedService,
                productBenefitLookup
              }}
              handlers={{
                setIsManageServicesOpen,
                pageRefresh,
              }}
            />
          </Modal>
        }
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isInteractionListOpen || isOrderListOpen || isHelpdeskListOpen || isFolloupListOpen} onHide={handleOnModelClose} dialogClassName='cust-lg-modal' >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">
                  {isHelpdeskListOpen ? 'Helpdesk' : isOrderListOpen ? 'Order' : isFolloupListOpen ? 'Follow up' : 'Interaction'} Details for {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'} Number {customerDetails?.customerNo}
                </h5>
              </Modal.Title>
              <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="col-lg-12 col-md-12 col-xs-12">
                <DynamicTable
                  row={isHelpdeskListOpen ? (helpdeskListData || []) : isInteractionListOpen ? (interactionData || []) : isOrderListOpen ? (orderList?.rows || []) : isFolloupListOpen ? (followUpList?.rows || []) : []}
                  header={isInteractionListOpen ? interactionListColumns : isOrderListOpen ? orderListColumns : isFolloupListOpen ? followupListColumns : isHelpdeskListOpen ? helpdeskListColumns : []}
                  itemsPerPage={isInteractionListOpen ? perPage : isOrderListOpen ? perPage : isFolloupListOpen ? currentPage : isHelpdeskListOpen ? perPage : perPage}
                  backendPaging={true}
                  columnFilter={true}
                  backendCurrentPage={isInteractionListOpen ? currentPage : isOrderListOpen ? currentPage : isFolloupListOpen ? perPage : isHelpdeskListOpen ? currentPage : currentPage}
                  rowCount={isInteractionListOpen ? interactionList.count : isOrderListOpen ? orderList?.count : isFolloupListOpen ? followUpList?.count : isHelpdeskListOpen ? helpdeskList?.count : 0}
                  handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handlePageSelect,
                    handleItemPerPage: setPerPage,
                    handleCurrentPage: setCurrentPage,
                  }}
                />
              </div>
            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
              <div className="skel-btn-center-cmmn">
                <button type="button" className="skel-btn-cancel" onClick={handleSentimentModelClose}>Close</button>
              </div>
            </Modal.Footer>
          </Modal>
        }
        {
          isPrint &&
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isPrint} dialogClassName='cust-lg-modal'>
            <CustomerViewPrint data={{
              customerDetails,
              accountCount,
              servicesList,
              interactionList,
              followUpList: followUpList,
              revenueDetails,
              sentimentChartData,
              channelActivity,
              interactionData,
              orderList: orderList?.rows,
              appointmentList,
              customerEmotions,
              customerDetailsList,
              customerAddressList,
              selectedAccount,
              // modulePermission,
              moduleConfig
            }}
              handler={{
                handlePreviewCancel: false,
                handlePrint: false,
                setCustomerDetails
              }}
              ref={componentRef}
            />
          </Modal>
        }
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isSetimentPopupOpen} onHide={handleSentimentModelClose} dialogClassName='cust-lg-modal'>
            <Modal.Header>
              <Modal.Title><h5 className="modal-title">Interaction Details for {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'}  Number{" "}
                {customerDetails?.customerNo}</h5></Modal.Title>
              <CloseButton onClick={handleSentimentModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="col-lg-12 col-md-12 col-xs-12">
                <DynamicTable
                  row={sentimentFilterData}
                  header={sentimentColumns}
                  itemsPerPage={sentimentPerPage}
                  backendPaging={false}
                  columnFilter={true}
                  backendCurrentPage={sentimentCurrentPage}
                  handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handleSentimentPageSelect,
                    handleItemPerPage: setSentimentPerPage,
                    handleCurrentPage: setSentimentCurrentPage,
                  }}
                />
              </div>
            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
              <div className="skel-btn-center-cmmn">
                <button type="button" className="skel-btn-cancel" onClick={handleSentimentModelClose}>Close</button>
              </div>
            </Modal.Footer>
          </Modal>
        }
        {
          <Modal
            show={isFollowupOpen}
            contentLabel="Followup Modal"
          >
            <div
              className="modal-center"
              id="cancelModal"
              tabIndex="-1"
              role="dialog"
              aria-labelledby="cancelModal"
              aria-hidden="true"
            >
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title" id="cancelModal">
                      Followup for Interaction No {intxnNo}
                    </h5>
                    <button
                      type="button"
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                      onClick={() => setIsFollowupOpen(false)}
                    >
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>
                  <div className="modal-body">
                    <hr className="cmmn-hline" />
                    <div className="clearfix"></div>
                    <div className="row">
                      <div className="col-md-12 pt-2">
                        <p style={{ fontWeight: "600" }}>
                          You Currently have {followUpHistory?.count || 0}{" "}
                          <a style={{ textDecoration: "underline" }}>
                            Followup(s)
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="row pt-3">
                      <div className="col-6">
                        <div className="form-group">
                          <label htmlFor="priority" className="col-form-label">
                            Followup Priority{" "}
                            <span className="text-danger font-20 pl-1 fld-imp">
                              *
                            </span>
                          </label>
                          <select
                            required
                            value={followupInputs.priority}
                            id="priority"
                            className="form-control"
                            onChange={handleOnFollowupInputsChange}
                          >
                            <option key="priority" value="">
                              Select Priority
                            </option>
                            {priorityLookup &&
                              priorityLookup.map((e) => (
                                <option key={e.code} value={e?.code}>
                                  {e?.description}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="form-group">
                          <label htmlFor="source" className="col-form-label">
                            Source{" "}
                            <span className="text-danger font-20 pl-1 fld-imp">
                              *
                            </span>
                          </label>
                          <select
                            required
                            id="source"
                            className="form-control"
                            value={followupInputs.source}
                            onChange={handleOnFollowupInputsChange}
                          >
                            <option key="source" value="">
                              Select Source
                            </option>
                            {sourceLookup &&
                              sourceLookup.map((e) => (
                                <option key={e.code} value={e.code}>
                                  {e.description}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-12 ">
                        <div className="form-group ">
                          <label
                            htmlFor="inputState"
                            className="col-form-label pt-0"
                          >
                            Remarks{" "}
                            <span className="text-danger font-20 pl-1 fld-imp">
                              *
                            </span>
                          </label>
                          <textarea
                            required
                            className="form-control"
                            maxLength="2500"
                            id="remarks"
                            value={followupInputs.remarks}
                            onChange={handleOnFollowupInputsChange}
                            name="remarks"
                            rows="4"
                          ></textarea>
                          <span>Maximum 2500 characters</span>
                        </div>
                      </div>
                      <div className="col-md-12 pl-2">
                        <div className="form-group pb-1">
                          <div className="d-flex justify-content-center">
                            <button
                              type="button"
                              className="skel-btn-cancel"
                              onClick={() => setIsFollowupOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="skel-btn-submit"
                              onClick={handleOnAddFollowup}
                            >
                              Submit
                            </button>

                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        }


        {/*<!-- Reschedule Modal -->*/}
        {/* <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={showReschedule} onHide={() => setShowReschedule(false)} dialogClassName='cust-sm-modal'>
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Reschedule Appointment
            </h5></Modal.Title>
            <CloseButton onClick={() => setShowReschedule(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <span className="skel-header-title mb-2">Enquiry about new Insurance policy.</span>
            <table className="w-100 border table-striped skel-appt-sch-details">

              <tr>
                <td>Appointment Type</td>
                <td>:</td>
                <td>Branch Visit</td>
              </tr>
              <tr>
                <td>Branch</td>
                <td>:</td>
                <td>Sample Address, Location, Postal Code.</td>
              </tr>
              <tr>
                <td>Current Slot</td>
                <td>:</td>
                <td>05 July 2024 09:00 AM to 05 July 2024 09:30 AM</td>
              </tr>
            </table>
            <div className="row">
              <div className="col-md-6">
                <div className="form-group mt-3">
                  <label for="dateFrom" className="control-label">Appointment
                    Date</label>
                  <input type="date" id="dateFrom" className="form-control" value="" />
                </div>
              </div>
            </div>
            <div className="skel-avl-slots mt-2">
              <p><strong>Available Slots</strong></p>
              <ul className="mon-slots" style="display: none;">
                <li className="skel-slots-avl">09:00 AM - 10:00 AM</li>
                <li className="skel-slots-avl">10:00 AM - 11:00 AM</li>

                <li className="skel-slots-bkd">12:00 PM - 01:00 PM</li>
                <li className="skel-slots-bkd">02:00 PM - 03:00 PM</li>
                <li className="skel-slots-avl">03:00 PM - 04:00 PM</li>
                <li className="skel-slots-bkd">04:00 PM - 05:00 PM</li>
                <li className="skel-slots-avl">05:00 PM - 06:00 PM</li>
              </ul>
              <ul className="tue-slots" style="display: none;">
                <li className="skel-slots-avl">09:00 AM - 10:00 AM</li>
                <li className="skel-slots-avl">10:00 AM - 11:00 AM</li>
                <li className="skel-slots-bkd">11:00 AM - 12:00 PM</li>
                <li className="skel-slots-bkd">12:00 PM - 01:00 PM</li>
                <li className="skel-slots-bkd">02:00 PM - 03:00 PM</li>
                <li className="skel-slots-avl">03:00 PM - 04:00 PM</li>
              </ul>
              <ul className="wed-slots">
                <li className="skel-slots-avl">09:00 AM - 10:00 AM</li>
                <li className="skel-slots-avl">10:00 AM - 11:00 AM</li>
                <li className="skel-slots-bkd">11:00 AM - 12:00 PM</li>
                <li className="skel-slots-bkd">12:00 PM - 01:00 PM</li>
                <li className="skel-slots-bkd">02:00 PM - 03:00 PM</li>
                <li className="skel-slots-avl">03:00 PM - 04:00 PM</li>
                <li className="skel-slots-bkd">04:00 PM - 05:00 PM</li>
                <li className="skel-slots-avl">05:00 PM - 06:00 PM</li>
              </ul>
              <ul className="thr-slots" style="display: none;">

                <li className="skel-slots-bkd">12:00 PM - 01:00 PM</li>
                <li className="skel-slots-bkd">02:00 PM - 03:00 PM</li>
                <li className="skel-slots-avl">03:00 PM - 04:00 PM</li>
                <li className="skel-slots-bkd">04:00 PM - 05:00 PM</li>
                <li className="skel-slots-avl">05:00 PM - 06:00 PM</li>
              </ul>
              <ul className="fri-slots" style="display: none;">
                <li className="skel-slots-avl">09:00 AM - 10:00 AM</li>
                <li className="skel-slots-avl">10:00 AM - 11:00 AM</li>
                <li className="skel-slots-avl">11:00 AM - 12:00 PM</li>
                <li className="skel-slots-avl">12:00 PM - 01:00 PM</li>
                <li className="skel-slots-avl">02:00 PM - 03:00 PM</li>
                <li className="skel-slots-avl">03:00 PM - 04:00 PM</li>
                <li className="skel-slots-avl">04:00 PM - 05:00 PM</li>
                <li className="skel-slots-avl">05:00 PM - 06:00 PM</li>
              </ul>

            </div>
          </Modal.Body>
          <Modal.Footer style={{ display: 'block' }}>
            <div className="skel-btn-center-cmmn">

            </div>
          </Modal.Footer>
        </Modal> */}

        {/*<!-- Cancel Appointment Modal -->*/}
        {/* <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={showRescheduleDelete} onHide={() => setShowRescheduleDelete(false)} dialogClassName='cust-sm-modal'>
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Cancel Appointment
            </h5></Modal.Title>
            <CloseButton onClick={() => setShowRescheduleDelete(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <p class="justify-content-center d-flex text-center mb-0 pb-0">Do you really want to delete the scheduled appointments? <br />Once you delete the appointment you need to book new appointment.</p>
          </Modal.Body>
          <Modal.Footer style={{ display: 'block' }}>
            <div class="modal-footer justify-content-center mb-3">
              <button type="button" class="skel-btn-cancel" data-dismiss="modal">No</button>
              <button type="button" class="skel-btn-delete">Yes</button>
            </div>
          </Modal.Footer>
        </Modal> */}

      </div >
      <Joyride
        steps={steps}
        run={runTour}
        continuous={true} // Whether to restart the tour when it's completed
        showProgress={true} // Show progress indicator
        showSkipButton={true} // Show skip button
        callback={(data) => {
          // You can handle events like "tour finished" here
          if (data.status === 'finished') {
            setRunTour(false); // Stop the tour
          }
        }}
      />
    </>
  );
};

const sentimentColumns = [
  {
    Header: "#id",
    accessor: "id",
    disableFilters: true,
  },
  {
    Header: "Entity Type",
    accessor: "entityType",
    disableFilters: true,
  },
  {
    Header: "Type",
    accessor: "type",
    disableFilters: true,
  },
  {
    Header: "Status",
    accessor: "status",
    disableFilters: true,
  }, {
    Header: "Created At",
    accessor: "createdAt",
    disableFilters: true,
    id: "updatedBy"
  }
  // ,{
  //   Header: "Created By",
  //   accessor: "createdBy",
  //   disableFilters: true,
  //   id: "modifiedBy"
  // }
];

const interactionListColumns = [
  {
    Header: "Interaction No",
    accessor: "intxnNo",
    disableFilters: true,
  },
  {
    Header: "Interaction Category",
    accessor: "intxnCategory.description",
    disableFilters: true,
  },
  {
    Header: "Interaction Type",
    accessor: "intxnType.description",
    disableFilters: true,
  },
  {
    Header: "Service Category",
    accessor: "serviceCategory.description",
    disableFilters: true,
  },
  {
    Header: "Service Type",
    accessor: "serviceType.description",
    disableFilters: true,
  },
  {
    Header: "Status",
    accessor: "intxnStatus.description",
    disableFilters: true,
  },
];

const orderListColumns = [
  {
    Header: "Order No",
    accessor: "orderNo",
    disableFilters: true,
  },
  {
    Header: "Order Category",
    accessor: "orderCategory.description",
    disableFilters: true,
  },
  {
    Header: "Order Type",
    accessor: "orderType.description",
    disableFilters: true,
  },
  // {
  //   Header: "Service Category",
  //   accessor: "serviceCategory.description",
  //   disableFilters: true,
  // },
  // {
  //   Header: "Service Type",
  //   accessor: "serviceType.description",
  //   disableFilters: true,
  // },
  {
    Header: "Status",
    accessor: "orderStatus.description",
    disableFilters: true,
  },
];

const CustomerDetailsColumns = [
  {
    Header: "Customer ID Type",
    accessor: "idType",
    disableFilters: true,
    id: "idType"
  },
  {
    Header: "ID Number",
    accessor: "idValue",
    disableFilters: true,
    id: "idValue"
  },
  {
    Header: "Email",
    accessor: "email",
    disableFilters: true,
    id: "email"
  },
  // {
  //     Header: "Contact Type",
  //     accessor: "contactType",
  //     disableFilters: true,
  //     id: "contactType",
  // },
  {
    Header: "Contact Number",
    accessor: "contactNo",
    disableFilters: true,
    id: "contactNo"
  },
  {
    Header: "Modified Date Time",
    accessor: "updatedAt",
    disableFilters: true,
    id: "updatedAt"
  },
  {
    Header: "Modified By",
    accessor: "modifiedBy",
    disableFilters: true,
    id: "modifiedBy"
  }
]

const CustomerAddressColumns = [
  {
    Header: "Address 1",
    accessor: "address1",
    disableFilters: true,
    id: "address1"
  },
  {
    Header: "Address 2",
    accessor: "address2",
    disableFilters: true,
    id: "address2"
  },
  {
    Header: "Address 3",
    accessor: "address3",
    disableFilters: true,
    id: "address3"
  },
  {
    Header: "City/Town",
    accessor: "city",
    disableFilters: true,
    id: "city"
  },
  {
    Header: "District/Province",
    accessor: "district",
    disableFilters: true,
    id: "district"
  },
  {
    Header: "State/Region",
    accessor: "state",
    disableFilters: true,
    id: "state"
  },
  {
    Header: "Post Code",
    accessor: "postcode",
    disableFilters: true,
    id: "postcode"
  },
  {
    Header: "Country",
    accessor: "country",
    disableFilters: true,
    id: "country"
  },
  {
    Header: "Modified Date Time",
    accessor: "updatedAt",
    disableFilters: true,
    id: "updatedBy"
  },
  {
    Header: "Modified By",
    accessor: "modifiedBy",
    disableFilters: true,
    id: "modifiedBy"
  }
]

const followupListColumns = [{
  Header: "#ID",
  accessor: "id",
  disableFilters: true
}, {
  Header: "Status",
  accessor: "status.description",
  disableFilters: true
}, {
  Header: "Service Category",
  accessor: "serviceCategory.description",
  disableFilters: true
}, {
  Header: "Type",
  accessor: "type.description",
  disableFilters: true
},
{
  Header: "Service Type",
  accessor: "serviceType.description",
  disableFilters: true
},
{
  Header: "remarks",
  accessor: "remarks",
  disableFilters: true
}, {
  Header: "Created At",
  accessor: "createdDate",
  disableFilters: true
}]

const appointmentColumns = [{
  Header: "#ID",
  accessor: "appointTxnId",
  disableFilters: true
}, {
  Header: "Appointment Date",
  accessor: "appointDate",
  disableFilters: true
}, {
  Header: "Start Time",
  accessor: "appointStartTime",
  disableFilters: true
}, {
  Header: "End Time",
  accessor: "appointEndTime",
  disableFilters: true
},
{
  Header: "Appointment Mode",
  accessor: "appointMode.description",
  disableFilters: true
},
{
  Header: "remarks",
  accessor: "status.description",
  disableFilters: true
}, {
  Header: "Created At",
  accessor: "createdDate",
  disableFilters: true
}]

const helpdeskListColumns = [{
  Header: "#ID",
  accessor: "helpdeskId",
  disableFilters: true
},
{
  Header: "Status",
  accessor: "status.description",
  disableFilters: true
},
{
  Header: "Source",
  accessor: "helpdeskSource.description",
  disableFilters: true
},
{
  Header: "UserName",
  accessor: "userName",
  disableFilters: true
},
{
  Header: "Subject",
  accessor: "helpdeskSubject",
  disableFilters: true
},
{
  Header: "Type",
  accessor: "helpdeskType.description",
  disableFilters: true
},
{
  Header: "Project",
  accessor: "project.description",
  disableFilters: true
},
{
  Header: "Severity",
  accessor: "severity.description",
  disableFilters: true
},
// {
//   Header: "profileNo",
//   accessor: "profileNo",
//   disableFilters: true
// },
{
  Header: "Created At",
  accessor: "createdAt",
  disableFilters: true
}]

export default CustomerDetailsView;
