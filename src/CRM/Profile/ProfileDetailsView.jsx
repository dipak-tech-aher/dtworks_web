import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { unstable_batchedUpdates } from "react-dom";
import { useTranslation } from "react-i18next";
import { useReactToPrint } from 'react-to-print';
import { toast } from "react-toastify";
import { moduleConfig } from "../../AppConstants";
import { AppContext } from "../../AppContext";
import vIcon from "../../assets/images/v-img.png";
import DynamicTable from "../../common/table/DynamicTable";
import { useHistory } from "../../common/util/history";
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import Helpdesk from "../Customer360/InteractionTabs/Helpdesk";
import Interactions from "../Customer360/InteractionTabs/Interactions";
import ChannelActivityChart from "./ChannelActivityChart";
import ChannelPerformanceChart from "./ChannelPerformanceChart";
import CustomerDetailsFormViewMin from "./CustomerDetailsFormViewMin";
import CustomerJourney from "./CustomerJourney";
import CustomerViewPrint from './CustomerViewPrint';
import NegativeScatterChart from "./NegativeScatterChart";
import SentimentChart from "./SentimentChart";
import SentimentGauge from "./SentimentScoreGauge";
import AddressDetailsFormViewMin from '../Address/AddressDetailsFormViewMin';
import { log } from 'ol/console';
import AttachmentInformation from '../../HelpdeskAndInteraction/Interaction/InteractionAction/components/Normal/AttachmentInformation';
import SurveyFeedback from '../Customer/Components/Customer360/SurveyFeedback';

const ProfileDetailsView = (props) => {
  // const modulePermission = props?.appsConfig?.moduleSetupPayload
  const profileUuid = localStorage.getItem("profileUuid") || null;
  const profileNo = localStorage.getItem("profileNo") || null;
  const profileIds = localStorage.getItem("profileIds") || null;
  const history = useHistory()
  const viewConsumer = JSON.parse(localStorage.getItem('viewConsumer'))

  const [perPage, setPerPage] = useState(10);
  const [modalHeaderValue, setModalHeaderValue] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [customerDetails, setCustomerDetails] = useState(
    props?.location?.state?.data?.profileData ? props?.location?.state?.data?.profileData : viewConsumer?.data
  );
  const [modulePermission, setModulePermission] = useState([])


  const categories = useMemo(() => [
    { module: 'Customer', permissions: 'Search Customer', flag: 'Customer' },
    { module: 'Interaction', permissions: 'Search Interaction', flag: 'Interaction' },
    { module: 'Helpdesk', permissions: 'Search Helpdesk', flag: 'Helpdesk' }
  ], []);


  const entityTypes = useMemo(() => [
    {
      value: 'All',
      label: 'All'
    },
    {
      value: 'Helpdesk',
      label: 'Helpdesk'
    },
    {
      value: 'Interaction',
      label: 'Interaction'
    }
  ], [])

  // const [entityTypes, setEntityTypes] = useState();
  const [filteredType, setFilteredType] = useState([{
    chartType: null,
    value: 'All'
  }])

  const [interactionModalData, setInteractionModalData] = useState();
  const [helpdeskModalData, setHelpdeskModalData] = useState();
  const [appointmentList, setAppointmentList] = useState([]);
  const [isPrint, setIsPrint] = useState(false);
  let openInteractionCount = useRef(0),
    closedInteractionCount = useRef(0);
  const { auth, appsConfig } = useContext(AppContext);
  const dtWorksProductType = appsConfig?.businessSetup?.[0]
  const { t } = useTranslation();
  const [refreshPage, setRefreshPage] = useState(false);
  const [isManageHelpdeskOpen, setIsManageHelpdeskOpen] = useState(false);
  const [isInteractionListOpen, setIsInteractionListOpen] = useState(false);
  const [isHelpdeskListOpen, setIsHelpdeskListOpen] = useState(false);
  const [interactionStatusType, setInteractionStatusType] = useState();
  const [customerDetailsList, setCustomerDetailsList] = useState([]);
  const [sentimentScore, setSentimentScore] = useState(0);
  const [customerAddressList, setCustomerAddressList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openInteractionModal, setOpenInteractionModal] = useState(false);
  const [userPermission, setUserPermission] = useState({
    addAttachment: false,
    editUser: false,
    editAccount: false,
    addService: false,
    addComplaint: false,
    addInquiry: false,
    viewCustomer: false,
  });
  const [tabType, setTabType] = useState("customerHistory");
  const [customerEmotions, setCustomerEmotions] = useState([]);
  const [customerEmotionsData, setCustomerEmotionsData] = useState([]);
  const [channelActivity, setChannelActivity] = useState([]);
  const [sentimentChart, setSentimentChart] = useState([]);
  const [sentimentChartData, setSentimentChartData] = useState([]);
  const [sentimentGaugeChartData, setSentimentGaugeChartData] = useState([]);
  const [topStatementChartData, setTopStatementChartData] = useState([]);
  const [channelPercentChartData, setChannelPercentChartData] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCountAddress, setTotalCountAddress] = useState(0);
  const [perPageAddress, setPerPageAddress] = useState(10);
  const [currentPageAddress, setCurrentPageAddress] = useState(0);
  const [isSetimentPopupOpen, setIssetimentPopupOpen] = useState(false)
  const [sentimentFilter, setSentimentFilter] = useState({})
  const [sentimentFilterData, setSentimentFilterData] = useState([])
  const [sentimentCurrentPage, setSentimentCurrentPage] = useState(0);
  const [sentimentPerPage, setSentimentPerPage] = useState(10);

  // Interaction List

  const [interactionCurrentPage, setInteractionCurrentPage] = useState(0)
  const [interactionPerPage, setInteractionPerPage] = useState(10)
  const [interactionList, setInteractionList] = useState([]);
  const [interactionData, setInteractionData] = useState([]);

  // Helpdesk List

  const [helpdeskPerPage, setHelpdeskPerPage] = useState(10)
  const [helpdeskCurrentPage, setHelpdeskCurrentPage] = useState(0)
  const [helpdeskListData, setHelpdeskListData] = useState([]);
  const [helpdeskList, setHelpdeskList] = useState([]);

  //Followups
  const [followUpList, setFollowupList] = useState([]);
  const [followUpCurrentPage, setFollowUpCurrentPage] = useState(0)
  const [followUpPerpage, setFollowupPerpage] = useState(10)
  const [isFolloupListOpen, setIsFolloupListOpen] = useState(false)

  // Profile History

  const [profileHistory, setProfileHistory] = useState([])
  const [addressHistory, setAddressHistory] = useState([])

  // Attachment List

  const [attachmentCurrentPage, setAttachmentCurrentPage] = useState(0)
  const [attachmentPerPage, setAttachmentPerPage] = useState(10)
  const [attachmentList, setAttachmentList] = useState([]);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [isAttachmentListOpen, setIsAttachmentListOpen] = useState(false)


  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    onAfterPrint: () => {
      setIsPrint(false)
    }
  });

  //permission
  const grantPermissions = useCallback(() => {
    let rolePermission = []
    categories?.forEach((ele) => {
      auth && auth?.permissions && auth?.permissions.forEach(element => {
        if (element?.moduleName === ele?.module) {
          let value = element?.moduleScreenMap ?? []
          rolePermission = { ...rolePermission, [ele?.module]: value }
        }
      })

    })

    // if (rolePermission && rolePermission?.length > 0) {
    let finalPermission = []
    const enabledCategory = []
    categories?.forEach((e) => {
      rolePermission?.[e?.module]?.forEach((ele) => {
        if (ele?.screenName === e?.permissions) {
          finalPermission = { ...finalPermission, [e?.module]: ele?.accessType }
          enabledCategory.push(e.flag)
        }
      })
    })

    unstable_batchedUpdates(() => {
      setModulePermission(finalPermission)
    })
    // }
  }, [auth, categories])

  // Helpdesk follow Up 
  const [HelpdeskFollowUpList, setHelpdeskFollowUpList] = useState([]);
  const [HelpdeskFollowUpCurrentPage, setHelpdeskFollowUpCurrentPage] = useState(0)
  const [HelpdeskFollowUpPerpage, setHelpdeskFollowUpPerpage] = useState(10)
  const [isHelpdeskFollowupListOpen, setisHelpdeskFollowListOpen] = useState(false)
  useEffect(() => {
    if (!isEmpty(sentimentFilter) && Array.isArray(sentimentChartData) && sentimentChartData?.length > 0) {
      const filterData = sentimentChartData?.filter(ch => ch?.monthYear === sentimentFilter?.monthYear && ch?.emotion === sentimentFilter?.emotion).map((e) => e?.details) || []
      setSentimentFilterData(filterData)
    }
  }, [sentimentChartData, sentimentFilter])

  const getCustomerHistoryData = useCallback((type) => {
    if (['customerHistory', 'addressHistory'].includes(type)) {
      const requestBody = {
        profileNo
      }
      post(`${properties.PROFILE_API}/details/history?limit=${perPage}&page=${currentPage}`, requestBody)
        .then((response) => {
          if (response.data) {
            const { count, rows } = response.data;
            if (!!rows.length) {
              let customerDetails = [];
              setProfileHistory(rows)
              // setProfileHistory(rows?.[0]?.customerContactHistory)
              rows?.forEach((data) => {
                const { idValue, idTypeDesc, contactTypeDesc, updatedAt, modifiedBy, profileContact } = data;
                profileContact && profileContact.map((val) => (
                  customerDetails.push({
                    idType: idTypeDesc?.description,
                    contactPreferencesDesc: idTypeDesc?.contactPreferencesDesc,
                    idValue,
                    email: val.emailId,
                    contactType: contactTypeDesc?.description,
                    contactNo: val.mobileNo,
                    updatedAt: moment(updatedAt).format('DD-MM-YYYY hh:mm:ss A'),
                    modifiedBy: `${data.updatedByName ? (data.updatedByName?.firstName || '') + ' ' + (data.updatedByName?.lastName || '') : (data.createdByName?.firstName || '') + ' ' + (data.createdByName?.lastName || '')}`
                  })
                ))

              });
              unstable_batchedUpdates(() => {
                setTotalCount(count)
                setCustomerDetailsList(customerDetails);
              })
            }
          }
        })
        .catch(error => {
          console.error(error);
        })

      post(`${properties.PROFILE_API}/address/history?limit=${perPageAddress}&page=${currentPageAddress}`, requestBody)
        .then((response) => {
          if (response.data) {
            const { count, rows } = response.data;
            if (!!rows.length) {
              let customerAddress = [];
              // setProfileHistory(rows?.[0]?.customerContactHistory)
              rows?.forEach((data) => {
                const { updatedAt, modifiedBy, address1, address2, address3, city, district, state, postcode, country } = data;
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
                  updatedAt,
                  modifiedBy: `${(modifiedBy?.firstName || '') + ' ' + (modifiedBy?.lastName || '')}`
                })

              });
              unstable_batchedUpdates(() => {
                setTotalCountAddress(count)
                setCustomerAddressList(customerAddress);
              })
            }
          }
        })
        .catch(error => {
          console.error(error);
        })
    }
  }, [currentPage, currentPageAddress, perPage, perPageAddress, profileNo])

  useEffect(() => {
    if (tabType === 'customerHistory')
      getCustomerHistoryData('customerHistory', currentPage, perPage)
  }, [customerDetails, getCustomerHistoryData, tabType, currentPage, perPage])

  const pageRefresh = () => {
    setRefreshPage(!refreshPage);
  };

  const handleTypeSelect = (type) => {
    setTabType(type);
  };

  const handleInteractionModal = async(data) => {
    try{
      const AttachList=await get(`${properties?.COMMON_API}/attachment/${data?.intxnUuid}`)
      if (AttachList?.status === 200 && AttachList?.data && Array?.isArray(AttachList?.data) && AttachList?.data?.length > 0) {
        data.attachment=AttachList?.data
      }
      console.log('AttachList',data)
      setInteractionModalData(data);
      setOpenInteractionModal(true);
    }catch(e){
      console.log('error',e)
    }
    console.log('data',data)
    
  };

  const handleOnModelClose = () => {
    setOpenInteractionModal(false);
    setIsInteractionListOpen(false);
    setIsHelpdeskListOpen(false);
    setIsFolloupListOpen(false)
    setisHelpdeskFollowListOpen(false)
    setIsAttachmentListOpen(false)
  };

  const handleSentimentModelClose = () => {
    setIssetimentPopupOpen(false)
    setSentimentFilter({})
  };

  // useEffect(() => {
  //   if (refreshPage) {
  //     window.location.reload();
  //   }
  // }, [refreshPage])

  useEffect(() => {
    get(
      properties.INTERACTION_API + "/counts?profileUuid=" + profileUuid
    ).then((resp) => {
      if (resp.data.count !== 0) {
        closedInteractionCount.current = resp?.data?.rows?.filter((e) =>
          ["CLOSED", "CANCELLED"].includes(e?.intxnStatus?.code)
        );
        openInteractionCount.current = resp?.data?.rows.filter(
          (e) => !["CLOSED", "CANCELLED"].includes(e?.intxnStatus?.code)
        );
      }
    }).catch((error) => console.error(error));
  }, []);

  const [followUpHistory, setFollowUpHistory] = useState({
    rows: [],
    count: 0,
  });

  const callFollowupHistory = (val) => {
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

  useEffect(() => {
    if (profileUuid && profileUuid !== "") {
      if (!customerDetails || refreshPage) {
        post(`${properties.PROFILE_API}/get-profile?limit=1&page=0`, {
          profileUuid,
        })
          .then((resp) => {
            if (resp.data) {
              if (resp.status === 200) {
                const { rows } = resp.data;
                unstable_batchedUpdates(() => {
                  setCustomerDetails(rows[0]);
                  pageRefresh()
                });
              }
            }
          }).catch((error) => console.error(error))
          .finally();
      }
    }
  }, [refreshPage]);

  useEffect(() => {
    if (profileUuid && profileUuid !== "") {
      get(properties.PROFILE_API + "/profile-interaction/" + profileUuid)
        .then((resp) => {
          if (resp && resp.data) {
            // console.log("graph issue............>", setSentimentChart([...resp.data]));
            // console.log("chartdata---------------------->", setChartData([...resp.data]));
            setSentimentChart([...resp.data]);
            setSentimentChartData([...resp.data]);
            setSentimentGaugeChartData([...resp.data]);
            let helpdeskList = resp?.data?.filter((ele) => ele?.details?.entityType?.includes('Helpdesk'))?.slice(0, 5), interactionList = resp?.data?.filter((ele) => ele?.details?.entityType?.includes('Interaction'))?.slice(0, 5);
            setTopStatementChartData([...helpdeskList, ...interactionList]);
            setChartData([...resp.data])
            // console.log("chartData after........................:", chartData);
          }
        })
        .catch((error) => console.error(error));
      get(properties.PROFILE_API + "/profile-emotions/" + profileUuid)
        .then((resp) => {
          if (resp && resp.data) {
            setCustomerEmotions([...resp.data]?.filter((ele) => ele?.id?.includes("Helpdesk")));
            setCustomerEmotionsData([...resp.data]);
          }
        })
        .catch((error) => console.error(error));

      get(properties.PROFILE_API + "/profiles-channel-activity/" + profileUuid)
        .then((resp) => {
          if (resp && resp.data) {
            setChannelPercentChartData([...resp.data]);
            setChannelActivity([...resp.data]);
          }
        })
        .catch((error) => console.error(error));
    }
  }, []);

  useEffect(() => {
    if (customerDetails?.profileId) {
      get(properties.APPOINTMENT_API + `/customer/${customerDetails.profileId}`)
        .then((resp) => {
          setAppointmentList(resp?.data || []);
        })
        .catch((error) => console.error(error));
    }
  }, [customerDetails]);

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
    grantPermissions()
  }, [auth]);

  const handlePageSelect = (pageNo) => {
    if (isInteractionListOpen) {
      setInteractionCurrentPage(pageNo)
    } else if (isHelpdeskListOpen) {
      setHelpdeskCurrentPage(pageNo)
    } else if (isHelpdeskFollowupListOpen) {
      setHelpdeskFollowUpCurrentPage(pageNo)
    } else if(tabType) {
      setAttachmentCurrentPage(pageNo);
    } else {
      setCurrentPage(pageNo);
    }
  };

  const handleSentimentPageSelect = (pageNo) => {
    setSentimentCurrentPage(pageNo)
  };

  const handlePageSelectAddress = (pageNo) => {
    setCurrentPageAddress(pageNo)
  }

  const handleCellRender = (cell, row) => {
    if (cell.column.Header === "Created At") {
      return (<span>{cell.value ? moment(cell.value).format('DD-MM-YYYY hh:mm:ss A') : '-'}</span>)
    }
    if (cell.column.id === "updatedAt") {
      return (<span>{cell?.value ? moment(cell?.value).format('DD-MM-YYYY hh:mm:ss A') : '-'}</span>)
    }
    else if (cell.column.id === "modifiedBy") {
      return (<span>{(row?.original?.updatedByName?.firstName ?? '') + ' ' + (row?.original?.updatedByName?.lastName ?? '')}</span>)
    }
    else if (cell.column.id === "profileName") {
      return (<span>{row?.original?.firstName + ' ' + row?.original?.lastName}</span>)
    }
    else if (cell.column.id === "contactPreferences") {
      return (<span>{Array.isArray(cell?.value) ? cell?.value?.map((val) => val.description)?.join(", ") : (cell?.value || '')}</span>)
    }
    else if (cell.column.id === "fileName") {
      return (<span><a href={`data:${row.original.fileType};base64,${row.original.attachedContent}`} download={cell.value} target="_new">{cell.value}</a></span>)
    }
    else {
      return <span>{cell.value}</span>
    }
  };

  const handleOnManageHelpdesk = (data) => {
    setHelpdeskModalData(data);
    setIsManageHelpdeskOpen(true);
  };

  function handlePrintClick() {
    setIsPrint(true);
    setTimeout(() => {
      handlePrint()
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
        if (response.profileUuid) {
          localStorage.setItem("profileUuid", response.profileUuid)
          localStorage.setItem("profileIds", response.customerId)
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
    post(`${properties.INTERACTION_API}/search?limit=${interactionPerPage}&page=${interactionCurrentPage}`, { searchParams: { profileNo } })
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setInteractionList(resp.data);
          setInteractionData(resp.data?.rows);
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [interactionPerPage, interactionCurrentPage, profileUuid, profileIds])

  const getHelpdeskList = useCallback(() => {
    post(`${properties.HELPDESK_API}/search?limit=${helpdeskPerPage}&page=${helpdeskCurrentPage}`, { profileNo: profileNo })
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setHelpdeskList(resp.data);
          setHelpdeskListData(resp.data?.rows);
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [helpdeskPerPage, helpdeskCurrentPage, profileUuid, profileIds])

  const getFollowUpList = useCallback(() => {
    get(`${properties.PROFILE_API}/followup/${profileUuid}?limit=${followUpPerpage}&page=${followUpCurrentPage}`)
      .then((resp) => {
        unstable_batchedUpdates(() => {
          setFollowupList(resp?.data)
        })
      })
      .catch((error) => console.error(error))
      .finally();
  }, [followUpCurrentPage, followUpPerpage, profileUuid])

  useEffect(() => {
    if (profileUuid && profileUuid !== "") {
      getInteractionList()
    }
  }, [interactionPerPage, interactionCurrentPage, profileUuid, getInteractionList])

  useEffect(() => {
    if (profileUuid && profileUuid !== "") {
      getHelpdeskList()
    }
  }, [helpdeskPerPage, helpdeskCurrentPage, profileUuid, profileIds, getHelpdeskList])

  useEffect(() => {
    if (profileUuid && profileUuid !== "") {
      getFollowUpList();
      getHelpdeskFollowUpList()
    }
  }, [followUpCurrentPage, followUpPerpage, profileUuid, getFollowUpList])
  useEffect(() => {
    console.log("attachmentCurrentPage, attachmentPerPage", attachmentCurrentPage, attachmentPerPage)
    post(
      `${properties.PROFILE_API}/get-attachments?limit=${attachmentPerPage}&page=${attachmentCurrentPage}`, { profileUuid: profileUuid }
    ).then((resp) => {
      if (resp.data && resp?.data?.count > 0) {
        setAttachmentList(resp.data.rows)
        setAttachmentCount(resp.data.count)
      }
    }).catch((error) => console.error(error));
  }, [attachmentCurrentPage, attachmentPerPage])

  const onChangeType = (e, chartType) => {
    const existingIndex = filteredType.findIndex(item => item.chartType === chartType);
    console.log('e------------>', e?.target?.value)
    setModalHeaderValue(e?.target?.value)
    if (e.target.value === "Helpdesk" || e.target.value === "Interaction") {
      if (existingIndex !== -1) {
        const updatedFilteredType = [...filteredType];
        updatedFilteredType[existingIndex].value = e.target.value;
        setFilteredType(updatedFilteredType);
      } else {
        setFilteredType([...filteredType, { value: e.target.value, chartType }]);
      }
      if (chartType === 'Sentiment') {
        setSentimentChartData(sentimentChart?.filter((ele) => ele?.details?.entityType?.includes(e.target.value)))
      }
      if (chartType === 'AverageSentiment') {
        console.log('for averagsenti......................>', sentimentChart?.filter((ele) => ele?.details?.entityType?.includes(e.target.value)))
        setSentimentGaugeChartData(sentimentChart?.filter((ele) => ele?.details?.entityType?.includes(e.target.value)))
      }
      if (chartType === 'Top10Statement') {
        setTopStatementChartData(sentimentChart?.filter((ele) => ele?.details?.entityType?.includes(e.target.value))?.slice(0,10))
      }
      if (chartType === 'ChannelPercentage') {
        console.log('for helpdesk-------->', channelActivity?.filter((ele) => ele?.id?.includes(e.target.value)))
        setChannelPercentChartData(channelActivity?.filter((ele) => ele?.id?.includes(e.target.value)))
      }
      if (chartType === 'Journey') {
        setCustomerEmotions(customerEmotionsData?.filter((ele) => ele?.id?.includes(e.target.value)))
      }
    } else {
      if (existingIndex !== -1) {
        const updatedFilteredType = [...filteredType];
        updatedFilteredType[existingIndex].value = "";
        setFilteredType(updatedFilteredType);
      } else {
        setFilteredType([...filteredType, { value: "", chartType }]);
      }
      if (chartType === 'Sentiment') {
        setSentimentChartData(sentimentChart)
      }
      if (chartType === 'AverageSentiment') {
        setSentimentGaugeChartData(sentimentChart)
      }
      if (chartType === 'Top10Statement') {
        let helpdeskList = sentimentChart?.filter((ele) => ele?.details?.entityType?.includes('Helpdesk'))?.slice(0, 5), interactionList = sentimentChart?.filter((ele) => ele?.details?.entityType?.includes('Interaction'))?.slice(0, 5)
        setTopStatementChartData([...helpdeskList, ...interactionList])
      }
      if (chartType === 'ChannelPercentage') {
        setChannelPercentChartData(channelActivity)
      }
      if (chartType === 'Journey') {
        setCustomerEmotions(customerEmotionsData)
      }
    }
  }

  const checkPermission = (key) => {
    let response = false
    if (key && !isEmpty(key)) {
      response = modulePermission?.[key] === 'allow'
    }
    return response
  }
  const getHelpdeskFollowUpList = useCallback(() => {
    if (profileNo) {
      post(`${properties.PROFILE_API}/helpdesk/get-followup?limit=${HelpdeskFollowUpPerpage}&page=${HelpdeskFollowUpCurrentPage}`, {
        "searchParams": {
          "profileNo": profileNo
        }
      })
        .then((resp) => {
          unstable_batchedUpdates(() => {
            setHelpdeskFollowUpList(resp?.data)
          })
        })
        .catch((error) => console.error(error))
        .finally();
    }

  }, [HelpdeskFollowUpPerpage, HelpdeskFollowUpCurrentPage, profileNo]);
  useEffect(() => {
    if (profileNo && profileNo !== "") {
      getHelpdeskFollowUpList()
    }
  }, [HelpdeskFollowUpPerpage, HelpdeskFollowUpCurrentPage, profileNo])

  return (
    <>
      <div className="cnt-wrapper skel-print-hide">
        <div className="card-skeleton">
          <div className="cmmn-skeleton mt-2">
            <span className="skel-profile-heading">Overall Insights</span>
            <div className="lft-skel skel-insights-top">

              <div className="skel-grid-auto">
                {<div className="skel-tot">
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
                </div>}
                {
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
                }{
                  <div className="skel-tot">
                    Total Follow-ups Count
                    <span>
                      {/* {console.log('HelpdeskFollowUpList-------->', HelpdeskFollowUpList)} */}
                      <a style={{ color: '#000' }}
                        data-toggle="modal"
                        data-target="#skel-view-modal-interactions"
                        onClick={() => {
                          if (HelpdeskFollowUpList?.count) {
                            setisHelpdeskFollowListOpen(true);
                          } else {
                            toast.error("No follow up records found")
                          }
                        }}
                        className='cursor-pointer'
                      >
                        {HelpdeskFollowUpList?.count || 0}
                      </a>
                    </span>
                  </div>
                }
                <div className="skel-tot">
                  Overall Experience
                  <p>
                    {/* Number(sentimentScore)?.toFixed(0) < 1 && Number(sentimentScore)?.toFixed(0) >= 0 ? '😡'  */}
                    {Number(sentimentScore)?.toFixed(0) >= 4 ? '😃' : Number(sentimentScore)?.toFixed(0) < 4 && Number(sentimentScore)?.toFixed(0) >= 3 ? '😐' : Number(sentimentScore)?.toFixed(0) < 3 && Number(sentimentScore)?.toFixed(0) >= 2 ? '😟' : Number(sentimentScore)?.toFixed(0) < 2 && Number(sentimentScore)?.toFixed(0) >= 1 ? '😡' : 'NA'}
                  </p>
                </div>
              </div>
              <div className="skel-btn-center-cmmn">

                <button className="skel-btn-submit" onClick={() => history(`/create-interaction`,
                  {
                    state: {
                      data: {
                        ...customerDetails
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
                            interactionCount: interactionList?.count,
                            hideAccSerInt: true,
                            source: "PROFILE",
                            modulePermission: modulePermission,
                            userPermission: userPermission,
                            profileUuid,
                            refreshPage,
                            dtWorksProductType
                          }}
                          handler={{ setCustomerDetails, pageRefresh, handlePrintClick, setRefreshPage }}
                        />
                      </div>
                    </div>
                    <div className="col-8">
                      {
                        customerDetails?.profileAddress?.length > 0 ?
                          <AddressDetailsFormViewMin data={{ addressDetails: customerDetails?.profileAddress[0] }} />
                          : <></>
                      }
                    </div>
                    <hr className="cmmn-hline mt-2" />
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
                        Profile Sentiments
                      </span>
                      <select className='form-control' style={{ width: "150px" }}
                        value={filteredType.find((item) => item.chartType === 'Sentiment')?.value || ''}
                        onChange={(e) => {
                          onChangeType(e, 'Sentiment')
                        }}
                      >
                        {
                          entityTypes.map(k => (
                            <option value={k.value}>{k.label}</option>
                          ))
                        }
                      </select>
                    </div>
                    <SentimentChart data={{ chartData: sentimentChartData }} handlers={{ setIssetimentPopupOpen, setSentimentFilter }} />
                  </div>
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className='d-flex'>
                      <span className="skel-profile-heading">
                        Avg Sentiment Score
                      </span>
                      <select className='form-control' style={{ width: "150px" }}
                        value={filteredType.find((item) => item.chartType === 'AverageSentiment')?.value || ''}
                        onChange={(e) => {
                          onChangeType(e, 'AverageSentiment')
                        }}
                      >
                        {
                          entityTypes.map(k => (
                            <option value={k.value}>{k.label}</option>
                          ))
                        }
                      </select>
                    </div>
                    <SentimentGauge
                      data={{ chartData: sentimentGaugeChartData }}
                      handler={{
                        setSentimentScore
                      }}
                    />
                  </div>
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className='d-flex'>
                      <span className="skel-profile-heading">
                        Top 10 Interactions/Helpdesks (Red- Most Negative)
                      </span>
                      <select className='form-control' style={{ width: "150px" }}
                        value={filteredType.find((item) => item.chartType === 'Top10Statement')?.value || ''}
                        onChange={(e) => {
                          onChangeType(e, 'Top10Statement')
                        }}
                      >
                        {
                          entityTypes.map(k => (
                            <option value={k.value}>{k.label}</option>
                          ))
                        }
                      </select>
                    </div>
                    <NegativeScatterChart data={{ chartData: topStatementChartData }} />
                  </div>
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <div className="d-flex">
                      <span className="skel-profile-heading">
                        Channel Activity by Percentage(%)
                      </span>
                      <select className='form-control' style={{ width: "150px" }}
                        value={filteredType.find((item) => item.chartType === 'ChannelPercentage')?.value || ''}
                        onChange={(e) => {
                          onChangeType(e, 'ChannelPercentage')
                        }}
                      >
                        {/* {console.log("entityTypes..................>", entityTypes)} */}
                        {
                          entityTypes.map(k => (
                            <option value={k.value}>{k.label}</option>
                          ))
                        }
                      </select>
                    </div>
                    {/* {console.log('channelPercentChartData---------->', channelPercentChartData)} */}
                    <ChannelActivityChart data={{ chartData: channelPercentChartData }} />
                  </div>
                </div>
                <div className="col-lg-6 col-md-12 col-xs-12">
                  <div className="skel-view-base-card skel-cust-ht-sect">
                    <span className="skel-profile-heading">
                      Channel Performance
                    </span>
                    <ChannelPerformanceChart data={{ chartData: channelActivity }} />
                  </div>
                </div>
              </div>
              <div className="form-row d-flex-wrap">
                {
                  <div className='f-wrap-child'>
                    <div className="col-lg-12 col-md-12 col-xs-12">
                      <div className="skel-view-base-card">
                        <span className="skel-profile-heading">
                          Top 10 Helpdesks
                        </span>
                        <div className="skel-cust-view-det">
                          {helpdeskListData ? <>
                            {
                              helpdeskListData?.map((val, idx) => (
                                <div
                                  key={idx}
                                  className="skel-inter-hist"
                                  onClick={() => handleOnManageHelpdesk(val)}
                                >
                                  <div className="skel-serv-sect-lft">
                                    <span
                                      className="skel-lbl-flds"
                                      data-toggle="modal"
                                      data-target="#skel-view-modal-accountdetails"
                                    >
                                      ID: {val.helpdeskNo}
                                    </span>
                                    <span className="mt-1">{val.problemCause}</span>
                                    <span className="skel-cr-date">
                                      Created On: {val?.createdAt ? moment(val.createdAt).format('DD-MM-YYYY') : '-'}
                                    </span>
                                    <span className="skel-h-status mt-1">
                                      {val?.severity?.description}
                                    </span>
                                  </div>
                                </div>
                              ))
                            }</>
                            : <span className="skel-widget-warning">
                              No Helpdesk Found!!!
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
                <div className='f-wrap-child'>
                  <div className="col-lg-12 col-md-12 col-xs-12">
                    <div className="skel-view-base-card">
                      <div className="skel-inter-statement">
                        <span className="skel-profile-heading">
                          Top 10 Interactions
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
                      </div>
                    </div>
                  </div>
                </div>
                <SurveyFeedback data={{ profileNo: customerDetails?.profileNo }} />
              </div>
              <div className="form-row">
                <div className="col-lg-12 col-md-12 col-xs-12">
                  <div className="skel-view-base-card">
                    <div style={{ display: "flex" }}>
                      <span className="skel-profile-heading">Profile Journey</span>
                      <select className='form-control' style={{ width: "150px" }}
                        value={filteredType.find((item) => item.chartType === 'Journey')?.value || ''}
                        onChange={(e) => {
                          onChangeType(e, 'Journey')
                        }}
                      >
                        {
                          entityTypes.map(k => (
                            <option value={k.value}>{k.label}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="skel-cust-view-det skel-emoj-data mt-3">
                      <CustomerJourney
                        data={{ customerEmotions, height: "400%" }}
                      />
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
                        {<a className={`nav-link  ${tabType === "customerHistory" ? "active" : ""}`}
                          id="CUSTHIST-tab"
                          data-toggle="tab"
                          href="#CUSTHIST"
                          role="tab"
                          aria-controls="CUSTHIST"
                          aria-selected="true"
                          onClick={(evnt) => {
                            handleTypeSelect("customerHistory");
                            getCustomerHistoryData('customerHistory')
                          }}>
                          Profile History ({totalCount})
                        </a>}
                      </li>
                      <li className="nav-item">
                        {<a
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
                          Address History ({totalCountAddress})
                        </a>}
                      </li>
                      <li className="nav-item">
                        {<a
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
                          Interactions ({interactionList?.count || 0})
                        </a>}
                      </li>
                      <li className="nav-item">
                        {<a
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
                          Helpdesk ({helpdeskList?.count || 0})
                        </a>}
                      </li>
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
                      <li className="nav-item">
                        {<a
                          className={`nav-link  ${tabType === "attachment" ? "active" : ""
                            }`}
                          id="attachment-tab"
                          data-toggle="tab"
                          href="#attachment"
                          role="tab"
                          aria-controls="attachment"
                          aria-selected="false"
                          onClick={(evnt) => handleTypeSelect("attachment")}
                        >
                          Attachments ({attachmentCount || 0})
                        </a>}
                      </li>
                    </ul>
                  </div>
                </div>
                {/* {console.log('profileHistory ', profileHistory)} */}
                <div className="card-body">
                  <div className="tab-content">
                    <div
                      className={`tab-pane fade ${tabType === "customerHistory" ? "show active" : ""
                        }`}
                      id="CUSTHIST"
                      role="tabpanel"
                      aria-labelledby="CUSTHIST-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        {
                          profileHistory?.length > 0 ?
                            <DynamicTable
                              listKey={"Profile Details History"}
                              row={profileHistory}
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
                          customerAddressList.length > 0 ?
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
                      className={`tab-pane fade ${tabType === "helpdesk" ? "show active" : ""
                        }`}
                      id="helpdesk"
                      role="tabpanel"
                      aria-labelledby="helpdesk-tab"
                    >
                      <div className="cmmn-container-base no-brd">
                        <Helpdesk
                          data={{
                            customerDetails: { profileNo },
                          }}
                        />
                      </div>
                    </div>
                    <div className={`tab-pane fade ${tabType === "interaction" ? "show active" : ""}`} id="interaction" role="tabpanel" aria-labelledby="interaction-tab">
                      <div className="cmmn-container-base no-brd">
                        <Interactions
                          data={{
                            customerDetails: { profileNo },
                          }}
                        />
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
                    <div className={`tab-pane fade ${tabType === "attachment" ? "show active" : ""}`} id="attachment" role="tabpanel" aria-labelledby="appointment-tab">
                      <div className="cmmn-container-base no-brd">
                        <DynamicTable
                          row={attachmentList}
                          header={AttachmentListColumns}
                          rowCount={attachmentCount}
                          itemsPerPage={attachmentPerPage}
                          backendPaging={true}
                          // columnFilter={true}
                          backendCurrentPage={attachmentCurrentPage}
                          handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setAttachmentPerPage,
                            handleCurrentPage: setAttachmentCurrentPage,
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
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={openInteractionModal} onHide={handleOnModelClose} dialogClassName='cust-lg-modal' >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">Details for Interaction Number  {interactionModalData?.intxnNo}</h5>
                <a style={{ cursor: 'pointer', color: "#1675e0", marginRight: '100px' }}
                  onClick={() => fetchInteractionDetail(interactionModalData?.intxnNo)}
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
              {/* {console.log("interactionModalData...............>",interactionModalData)} */}
              <div className="modal-body px-4">
                <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label
                          htmlFor="Statement"
                          className="control-label"
                        >
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
                        <label
                          htmlFor="Interactiontype"
                          className="control-label"
                        >
                          Interaction Category
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnCategory?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Interactiontype"
                          className="control-label"
                        >
                          Interaction Type
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnType?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Servicetype"
                          className="control-label"
                        >
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
                        <label
                          htmlFor="Servicetype"
                          className="control-label"
                        >
                          Project
                        </label>
                        <span className="data-cnt">
                          {
                            interactionModalData?.
                              projectDesc?.description

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
                    {/* <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Problemstatement"
                          className="control-label"
                        >
                          Problem Statement
                        </label>
                        <span className="data-cnt">
                          {interactionModalData?.intxnDescription}
                        </span>
                      </div>
                    </div> */}
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
                        <AttachmentInformation data={{ existingFiles:interactionModalData?.attachment ??[] }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </Modal.Body>
          </Modal>
        }
        {
          <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageHelpdeskOpen} onHide={() => setIsManageHelpdeskOpen(false)} dialogClassName='cust-lg-modal'  >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">
                  Details for Helpdesk Number {helpdeskModalData?.helpdeskNo}</h5>
                <a style={{ cursor: 'pointer', color: "#1675e0", marginRight: '100px' }} onClick={() => history(`/view-helpdesk`, { state: { data: helpdeskModalData } })}>Go to Helpdesk 360 View</a>
              </Modal.Title>
              <CloseButton onClick={() => setIsManageHelpdeskOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="modal-body px-4">
                <form>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label
                          htmlFor="Servicetype"
                          className="control-label"
                        >
                          Helpdesk Subject
                        </label>
                        <span className="data-cnt">
                          {
                            helpdeskModalData?.helpdeskSubject
                          }
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
                          User Name
                        </label>
                        <span className="data-cnt">
                          {helpdeskModalData?.userName}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Statement"
                          className="control-label"
                        >
                          Email Id
                        </label>
                        <span className="data-cnt">
                          {helpdeskModalData?.mailId}
                        </span>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="form-group">
                        <label
                          htmlFor="Servicetype"
                          className="control-label"
                        >
                          Project
                        </label>
                        <span className="data-cnt">
                          {
                            helpdeskModalData?.project?.description
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
                          Helpdesk type
                        </label>
                        <span className="data-cnt">
                          {helpdeskModalData?.helpdeskType?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Channel" className="control-label">
                          Source
                        </label>
                        <span className="data-cnt">
                          {helpdeskModalData?.helpdeskSource?.description}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label htmlFor="Priority" className="control-label">
                          Severity
                        </label>
                        <span className="data-cnt">
                          {helpdeskModalData?.severity?.description}
                        </span>
                      </div>
                    </div>
                  </div>

                </form>
              </div>
            </Modal.Body>
          </Modal>
        }
        {
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isInteractionListOpen || isFolloupListOpen || isHelpdeskListOpen || isHelpdeskFollowupListOpen} onHide={handleOnModelClose} dialogClassName='cust-lg-modal' >
            <Modal.Header>
              <Modal.Title>
                <h5 className="modal-title">
                  {isHelpdeskListOpen ? 'Helpdesk' : (isFolloupListOpen || isHelpdeskFollowupListOpen) ? 'Follow up' : 'Interaction'} Details for Profile Number {profileNo}
                </h5>
              </Modal.Title>
              <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                {/* <span>×</span> */}
              </CloseButton>
            </Modal.Header>
            <Modal.Body>
              <div className="col-lg-12 col-md-12 col-xs-12">
                {/* {console.log("helpdeskListData............>", helpdeskListData)} */}
                <DynamicTable
                  row={isInteractionListOpen ? interactionData : isFolloupListOpen ? followUpList?.rows : isHelpdeskListOpen ? helpdeskListData : isHelpdeskFollowupListOpen ? HelpdeskFollowUpList?.rows : []}
                  header={isInteractionListOpen ? interactionListColumns : isFolloupListOpen ? followupListColumns : isHelpdeskListOpen ? helpdeskListColumns : isHelpdeskFollowupListOpen ? HelpdeskfollowupListColumns : []}
                  itemsPerPage={isInteractionListOpen ? interactionPerPage : isFolloupListOpen ? followUpPerpage : isHelpdeskListOpen ? helpdeskPerPage : isHelpdeskFollowupListOpen ? HelpdeskFollowUpPerpage : perPage}
                  backendPaging={true}
                  columnFilter={true}
                  backendCurrentPage={isInteractionListOpen ? interactionCurrentPage : isFolloupListOpen ? followUpCurrentPage : isHelpdeskListOpen ? helpdeskCurrentPage : isHelpdeskFollowupListOpen ? HelpdeskFollowUpCurrentPage : currentPage}
                  rowCount={isInteractionListOpen ? interactionList.count : isFolloupListOpen ? followUpList?.count : isHelpdeskListOpen ? helpdeskList?.count : isHelpdeskFollowupListOpen ? HelpdeskFollowUpList?.count : 0}
                  handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handlePageSelect,
                    handleItemPerPage: isHelpdeskListOpen ? setHelpdeskPerPage : isInteractionListOpen ? setInteractionPerPage : isFolloupListOpen ? setFollowupPerpage : isHelpdeskFollowupListOpen ? setHelpdeskFollowUpPerpage : setPerPage,
                    handleCurrentPage: isHelpdeskListOpen ? setHelpdeskCurrentPage : isInteractionListOpen ? setInteractionCurrentPage : isFolloupListOpen ? setFollowUpCurrentPage : isHelpdeskFollowupListOpen ? setHelpdeskFollowUpCurrentPage : setCurrentPage,
                  }}
                />

              </div>
            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
              <div className="skel-btn-center-cmmn">
                <button type="button" className="skel-btn-cancel" onClick={handleOnModelClose}>Close</button>
              </div>
            </Modal.Footer>
          </Modal>
        }

        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isSetimentPopupOpen} onHide={handleSentimentModelClose} dialogClassName='cust-lg-modal'>
          <Modal.Header>
            <Modal.Title>
              <h5 className="modal-title ewrtwreewwererewrrewr">{(modalHeaderValue === 'All' || modalHeaderValue === null) ? 'Helpdesk and Interactions' : modalHeaderValue} Details for {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'}  Number{" "}
                {customerDetails?.customerNo}</h5>
              {/* {selectedOption === "Interaction" ? "Interaction" : "Helpdesk"} Details for {props?.appsConfig?.clientFacingName?.customer ?? 'Customer'} Number {customerDetails?.customerNo} */}


            </Modal.Title>
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

        {
          isPrint &&
          <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isPrint} dialogClassName='cust-lg-modal'>
            <CustomerViewPrint data={{
              customerDetails,
              interactionList,
              sentimentChartData,
              channelActivity,
              interactionData,
              appointmentList,
              customerEmotions,
              customerDetailsList,
              customerAddressList,
              modulePermission,
              moduleConfig,
              helpdeskList,
              helpdeskListData
            }}
              handler={{
                handlePreviewCancel: false,
                handlePrint: false,
                setCustomerDetails,
                checkPermission
              }}
              ref={componentRef}
            />
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
      </div>
    </>
  );
};

const sentimentColumns = [
  {
    Header: "#ID",
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
];

const interactionListColumns = [
  {
    Header: "#ID",
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

const CustomerDetailsColumns = [
  {
    Header: "#ID",
    accessor: "profileNo",
    disableFilters: true,
    id: "profileNo"
  },
  {
    Header: "Profile Name",
    accessor: "profileName",
    disableFilters: true,
    id: "profileName"
  },
  {
    Header: "Email",
    accessor: "emailId",
    disableFilters: true,
    id: "emailId"
  },
  {
    Header: "Contact Number",
    accessor: "mobileNo",
    disableFilters: true,
    id: "mobileNo"
  },
  {
    Header: "Contact Preference",
    accessor: "contactPreferencesDesc",
    disableFilters: true,
    id: "contactPreferences"
  },
  {
    Header: "Modified Date Time",
    accessor: "updatedAt",
    disableFilters: true,
    id: "updatedAt"
  },
  {
    Header: "Modified By",
    accessor: "updatedByName",
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
    id: "updatedAt"
  },
  {
    Header: "Modified By",
    accessor: "modifiedBy",
    disableFilters: true,
    id: "updatedBy"
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
  accessor: "helpdeskNo",
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

const HelpdeskfollowupListColumns = [{
  Header: "Helpdesk No",
  accessor: "helpdeskDetails.helpdeskNo",
  disableFilters: true
}, {
  Header: "Status",
  accessor: "statusDesc.description",
  disableFilters: true
},
{
  Header: "Helpdesk Subject",
  accessor: "helpdeskDetails.helpdeskSubject",
  id: "helpdeskDetails.helpdeskSubject",
  disableFilters: true
},
{
  Header: "remarks",
  accessor: "remarkDescription.description",
  id: "remarkDescription.description",
  disableFilters: true
}, {
  Header: "Created At",
  accessor: "createdAt",
  disableFilters: true
}]

const AttachmentListColumns = [{
  Header: "#ID",
  accessor: "attachmentUuid",
  disableFilters: true
}, {
  Header: "Type",
  accessor: "entityType",
  disableFilters: true
},
{
  Header: "Download",
  accessor: "fileName",
  id: "fileName",
  disableFilters: true
}]

export default ProfileDetailsView;
