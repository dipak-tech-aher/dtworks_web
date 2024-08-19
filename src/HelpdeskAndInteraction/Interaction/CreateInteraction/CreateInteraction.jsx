import React, { useCallback, useEffect, useRef, useState, useContext, useMemo } from "react";
import profileLogo from "../../../assets/images/profile.png";
import Select from "react-select";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import InteractionWidget from "./InteractionWidgets";
import CreateInteractionForm from "./CreateInteractionForm";
import * as Yup from "yup";
import { get, post, slowGet, slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import moment from "moment";
import { Modal, CloseButton } from "react-bootstrap"
import { RegularModalCustomStyles, getPermissions, removeDuplicatesFromArrayObject, removeEmptyKey, getConfig } from "../../../common/util/util";
import Swal from "sweetalert2";
import ReactSwitch from "react-switch";
import AddProductModal from "../../../CRM/ServiceManagement/AddProductModal";
import { DatalistInput, useComboboxControls } from "react-datalist-input";
import PopupModal from "../../../common/popUpModal";
import { statusConstantCode, metaConfig } from "../../../AppConstants";
import { unstable_batchedUpdates } from "react-dom";
import { confirmAlert } from 'react-confirm-alert';
import { isEmpty } from 'lodash'
import { AppContext } from "../../../AppContext";
import DynamicTable from "../../../common/table/DynamicTable";
import RequestStatement from "./RequestStatement";
import AddressDetailsFormView from "../../../CRM/Address/AddressDetailsFormView";
import { getFullName } from "../../../common/util/commonUtils";
import ConsumerDetailsView from "./ConsumerDetailsView";
import { isObjectEmpty } from "../../../common/util/validateUtil";

// import { hideSpeenner, showSpeenner } from '../../../common/speenner';

let clone = require("clone");

const CreateInteraction = (props) => {

  const { appsConfig } = props
  const { auth, systemConfig } = useContext(AppContext)

  const customerDetails = props?.location?.state?.data;

  // console.log('customerDetails ', customerDetails)
  const dtWorksProductType = appsConfig.businessSetup?.[0]
  const history = useNavigate();
  const anonymous = customerDetails?.anonymous;

  let customerUuid, customerNo, customerContactNo, customerMobileNo, customerEmailId, customerContact, customerAddress, customerAccounts, customerService, customerName, mobileNo, emailId, subscriptionNumber

  if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
    if (customerDetails) {
      let customerData, accountData, serviceData
      if (customerDetails.customerDetails) {
        serviceData = {}
        accountData = {}
        customerData = customerDetails.customerDetails;
        const { accountDetails, ...restServiceData } = customerDetails;
        accountData = accountDetails;
        serviceData = restServiceData;
      } else {
        serviceData = []
        accountData = []
        customerData = customerDetails
        if (customerDetails?.helpdeskDetails?.serviceUuid) {
          accountData = customerDetails?.customerAccounts.filter(a => {
            return a.accountServices.filter(s => s.serviceUuid === customerDetails?.helpdeskDetails?.serviceUuid).length > 0
          })?.[0]
          serviceData = accountData?.accountServices?.filter(s => s.serviceUuid === customerDetails?.helpdeskDetails?.serviceUuid)?.[0]
        } else {
          accountData = customerDetails?.customerAccounts
          accountData.forEach(a => {
            a.accountServices.forEach(s => {
              serviceData.push(s)
            })
          })
        }
      }
      customerUuid = customerData?.customerUuid
      customerNo = customerData?.customerNo
      customerContactNo = customerData?.customerContact?.[0]?.contactNo
      customerMobileNo = customerData?.customerContact?.[0]?.mobileNo
      customerEmailId = customerData?.customerContact?.[0]?.emailId
      customerContact = customerData?.customerContact?.[0]
      customerAddress = customerData?.customerAddress?.[0]
      customerAccounts = accountData
      customerService = serviceData
    }
  } else {
    customerUuid = customerDetails?.profileUuid
    customerNo = customerDetails?.profileNo;
    customerContactNo = customerDetails?.profileContact?.[0]?.contactNo;
    customerMobileNo = customerDetails?.profileContact?.[0]?.mobileNo;
    customerEmailId = customerDetails?.profileContact?.[0]?.emailId;
    customerContact = customerDetails?.profileContact?.[0];
    customerAddress = customerDetails?.profileAddress?.[0];
  }
  const screenSource = props?.location?.state?.data?.source;
  const [openMinimalInfo, setOpenMinimalInfo] = useState(false)
  // const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  let [resolutionData, setResolutionData] = useState([]);
  let [selectedContactPreference, setSelectedContactPreference] = useState([]);

  let newArray = clone(resolutionData);

  const [resolutionPayloadData, setResolutionPayloadData] = useState();
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [sourceLookup, setSourceLookup] = useState([]);

  const customerData = customerDetails;
  const [switchStatus, setSwitchStatus] = useState(false);
  const [isSmartOpen, setIsSmartOpen] = useState(true);
  const [withStatement, setWithStatement] = useState(true);
  const placeholder = "Type to search...";
  const actionCount = 1
  let [workflowResponse, setWorkflowResponse] = useState([]);
  let [multipleServiceData, setMultipleServiceData] = useState([]);
  let [serviceMsg, setServiceMsg] = useState();
  let [selectedInteraction, setSelectedInteraction] = useState([]);
  const [consumerFromIsEnabled, setConsumerFromIsEnabled] = useState("")
  const [workflowPaylod, setWorkflowPaylod] = useState({
    flowId: "",
    conversationUid: "",
    data: {
      source: "SmartAssistance",
    },
  });
  const [firstTimeResolved, setFirstTimeResolved] = useState(false);

  const [productArr, setProductArr] = useState([]);
  const [orderId, setOrderId] = useState([]);
  const initIntxnData = {
    interactionResolution: "",
    statement: "",
    statementId: "",
    statementSolution: "",
    interactionType: "",
    interactionCategory: "",
    serviceType: "",
    serviceCategory: "",
    channel: "IVR",
    problemCause: "",
    priorityCode: "",
    // contactPreference: "",
    contactPreference: [],
    remarks: "",
    switchStatus,
    useCustomerAddress: true,
    project: "",
    severity: "",
    intxnProblemCode: "",
    agentName: "",
    toRole: "",
    markAsInteractionAddress: true,
    toStatus: ""
  };
  const [buttonDisable, setButtonDisable] = useState(false);
  const [interactionData, setInteractionData] = useState(initIntxnData);
  const [knowledgeBaseInteractionList, setKnowledgeBaseInteractionList] =
    useState([]);
  const [currentFiles, setCurrentFiles] = useState([]);
  const [error, setError] = useState({});
  const [intxnTypeLookup, setIntxnTypeLookup] = useState([]);
  const [intxnCategoryLookup, setIntxnCategoryLookup] = useState([]);
  const [problemCodeLookupData, setProblemCodeLookupData] = useState([]);
  const [channelLookup, setChannelLookup] = useState([]);
  const [serviceTypeLookup, setServiceTypeLookup] = useState([]);
  const [priorityLookup, setPriorityLookup] = useState([]);
  const [preferenceLookup, setPreferenceLookup] = useState([]);
  const [notificationLookup, setNotificationLookup] = useState([]);
  const [problemCaseLookup, setProblemCauseLookup] = useState([]);
  const [serviceCategoryLookup, setServiceCategoryLookup] = useState([]);
  const [timer, setTimer] = useState(null);
  const lookupData = useRef({});
  const [frequentInteraction, setFrequentInteraction] = useState([]);
  const [frequentCustomerInteraction, setFrequentCustomerInteraction] =
    useState([]);
  const [frequentDayInteraction, setFrequentDayInteraction] = useState([]);
  const [frequentTenInteraction, setFrequentTenInteraction] = useState([]);
  const [kbRequestId, setKbRequestId] = useState();
  const [exKbRequestId, setExKbRequestId] = useState();
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [serviceList, setServiceList] = useState([]);
  let [selectedService, setSelectedService] = useState({});
  let openInteractionCount = useRef(0),
    closedInteractionCount = useRef(0),
    totalInteractionsCount = useRef(0);
  const [interactionList, setInteractionList] = useState([]);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [openCreateInteraction, setOpenCreateInteraction] = useState(false);
  const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
    isExpanded: true,
  });
  const [items, setItems] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [addressData, setAddressData] = useState({
    address1: "",
    address2: "",
    address3: "",
    district: "",
    state: "",
    city: "",
    country: "",
    postcode: "",
    countryCode: "",
  });
  const [addressLookUpRef, setAddressLookUpRef] = useState(null);
  const [addressError, setAddressError] = useState({});
  const [helpdeskDetails, setHelpdeskDetails] = useState();
  const [helpdeskChannel, setHelpdeskChannel] = useState()
  const [isFormDisabled, setIsFormDisabled] = useState(false)
  const [formDetails, setFormDetails] = useState({})
  const [addressList, setAddressList] = useState([{
    addressType: '',
    address1: '',
    address2: '',
    postcode: '',
    country: '',
    state: '',
    district: '',
    city: ''
  }])
  const [enableInteractionAddress, setEnableInteractionAddress] = useState(false);


  const [interactionStatusType, setInteractionStatusType] = useState();
  const [popupType, setPopupType] = useState("");
  const [isInteractionListOpen, setIsInteractionListOpen] = useState(false);
  const [currentPageModal, setCurrentPageModal] = useState(0);
  const [perPageModal, setPerPageModal] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [interactionCustomerHistoryDetails, setInteractionCustomerHistoryDetails] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState()
  const [QaUserList, setQaUserList] = useState()
  let isQAFormEnabled = appsConfig?.clientFacingName?.QAFormRole?.roleId?.filter((e) => e?.id === auth?.currRoleId)?.[0]
  const [roleLookUp, setRoleLookup] = useState([])
  const [userLookUp, setUserLookup] = useState([])
  const [userList, setUserList] = useState([])
  const [currStatusLookup, setCurrStatusLookup] = useState([])
  const [slaEdoc, setslaEdoc] = useState()
  const [enableTask, setEnableTask] = useState(false);
  const [taskDetails, setTaskDetails] = useState({})
  const [taskStatusLookup, setTaskStatusLookup] = useState([])
  const [taskList, setTaskList] = useState([])
  const [tagsLookup, setTagsLookup] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isTaskEdit, setIsTaskEdit] = useState(false)

  const interactionDetailsValidationSchema = Yup.object().shape({
    interactionType: Yup.string().required("Interaction Type is required"),
    interactionCategory: Yup.string().required("Interaction Category is required"),
    serviceType: Yup.string().required("Service Type is required"),
    serviceCategory: Yup.string().required("Service Category is required"),
    channel: Yup.string().required("Ticket Channel is required"),
    intxnProblemCode: !withStatement ? Yup.string().required("Problem Code is required") : Yup.string().nullable(true),
    priorityCode: Yup.string().required("Priority is required"),
    contactPreference: Yup.array().required("Contact Preference is required"),
    remarks: Yup.string().required("Remarks is required"),
    project: Yup.string().required("Project is required"),
    severity: Yup.string().required("Severity is required"),
    edoc: Yup.string().required("Completion date is required"),
    toStatus: Yup.string().required("Status is required"),
    toRole: Yup.string().required("Department/Role is required"),
    agentName: isQAFormEnabled?.isEnabled ? Yup.string().required("Agent name is required") : Yup.string().nullable(true),
  });

  const AddressValidationSchema = Yup.object().shape({
    addressType: Yup.string().nullable(false).required("Address Type is required"),
    address1: Yup.string().nullable(false).required("Address line one is required"),
    address2: Yup.string().nullable(false).required("Address line two is required"),
    postcode: Yup.string().nullable(false).required("Post code two is required"),
    country: Yup.string().nullable(false).required("Country is required"),
    state: Yup.string().nullable(false).required("State is required"),
    district: Yup.string().nullable(false).required("District is required"),
    city: Yup.string().nullable(false).required("City is required"),
  });

  const [followupInputs, setFollowupInputs] = useState({
    priority: "",
    source: "",
    remarks: "",
  });

  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [userResolutionList, setUserResolutionList] = useState([]);
  const [values, setValues] = useState([]);
  const [permission, setPermission] = useState({})
  const userLookupRef = useRef()
  const isRoleChangedByUserRef = useRef()

  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        const consumer_from_config = await getConfig(systemConfig, metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
        setConsumerFromIsEnabled(consumer_from_config?.configValue);
      } catch (error) {
        console.error('Error fetching specific system config:', error);
      }
    };
    fetchConfigData();
  }, [])

  const handleFrequentInteractionChange = (interaction, type) => {
    console.log("inside frequent interaction");
    resolutionData = [];
    selectedService = {};
    setResolutionData([]);
    newArray = []
    unstable_batchedUpdates(() => {
      setServiceMsg();
      setIsFormDisabled(false)
      setFormDetails([])
      setValues([])
      setMultipleServiceData([]);
      setSelectedInteraction(interaction);
      setKbRequestId(interaction?.requestId);
      setExKbRequestId(kbRequestId);
      if (type !== "frequent10") {
        const reqBody = {
          requestId: interaction?.requestId || selectedInteraction?.requestId || exKbRequestId,
          consumerUuid: customerUuid ? customerUuid : "",
          consumerId: (customerDetails?.customerId ? customerDetails?.customerId : customerDetails?.profileId) || "",
          consumerNo: customerNo,
          accountUuid: customerAccounts?.accountUuid || interaction?.accountUuid,
          serviceUuid: selectedService?.serviceUuid || interaction?.serviceUuid,
          actionCount: actionCount,
          helpdeskId: helpdeskDetails?.helpdeskId || "",
          from: statusConstantCode.entityCategory.INTERACTION,
        };
        console.log("inside frequent interaction call get-knowledge-base");
        post(`${properties.KNOWLEDGE_API}/get-smartassistance-list`, { ...reqBody }).then(async (resp) => {
          // console.log("resp?.data?.requestId", resp?.data?.requestId);
          if (resp?.data?.requestId) {
            const intelligenceResponse = resp?.data?.intelligenceResponse;
            if (switchStatus && resp?.data?.resolutionAction?.data?.length > 1) {
              setMultipleServiceData(resp);
            } else {
              if (switchStatus) {
                if (!resp?.data?.conversationUid && !resp?.data?.flwId) {
                  setServiceMsg(resp?.message);
                } else {
                  setWorkflowPaylod({
                    flowId: resp?.data?.flwId,
                    conversationUid: resp?.data?.conversationUid,
                    data: {
                      source: "knowledgeBase",
                    },
                  });
                  workflowApiCall({
                    flowId: resp?.data?.flwId,
                    conversationUid: resp?.data?.conversationUid,
                    data: {
                      source: "knowledgeBase",
                      reqBody
                    },
                  });
                }
              }
              setValue(resp.data.requestStatement);
              if (resp?.data?.userResolution && !isEmpty(resp?.data?.userResolution)) {
                setUserResolutionList(resp?.data?.userResolution)
              }
              let slaDate
              try {
                const slaDateResp = await getEdoc({ requestId: resp?.data?.requestId ?? null });
                if (slaDateResp?.data && slaDateResp?.data?.oResolutionDate) {
                  slaDate = moment(slaDateResp?.data?.oResolutionDate).format('YYYY-MM-DD');
                  setslaEdoc(slaDate ?? '');
                }
              } catch (error) {
                console.error('Error fetching edoc:', error);
              }
              const setData = {
                interactionResolution: resp.data.intxnResolutionDesc?.description || "",
                statementId: resp.data.requestId || "",
                statement: resp.data.requestStatement || "",
                statementSolution: resp.data.intxnResolution || "",
                problemCause: resp.data.intxnCause || "",
                serviceType: resp.data.serviceType || "",
                switchStatus,
                interactionType: resp.data.intxnType || "",
                interactionCategory: resp.data.intxnCategory || "",
                serviceCategory: resp.data.serviceCategory || "",
                contactPreference: customerData?.contactPreferences,
                intelligenceResponse: intelligenceResponse,
                appointmentRequired: resp?.data?.isAppointment === 'Y' ? true : false,
                priorityCode: resp?.data?.priorityCode,
                project: interaction?.project || interactionData?.project || "",
                severity: interaction?.severity || interactionData?.severity || "",
                edoc: interaction?.edoc || interactionData?.edoc || slaDate || ""
              }
              // console.log("interaction ==> ", interaction)
              // console.log("interactionData ==> ", interactionData)
              // console.log("slaDate ==> ", slaDate)
              setInteractionData({
                ...interactionData,
                ...setData
              });
              setError({
                ...error,
                statementId: "",
                statement: "",
                statementSolution: "",
                problemCause: "",
                serviceType: "",
                interactionType: "",
                interactionCategory: "",
                serviceCategory: "",
              })

              !switchStatus && getWorkFlow(setData)
            }
          }
        })
          .catch((error) => {
            console.error(error);
          })
          .finally();
      }
    });
  };

  useEffect(() => {
    if (
      props?.location?.state?.data?.source ===
      statusConstantCode.entityCategory.HELPDESK
    ) {
      const helpdeskDetails = props?.location?.state?.data?.helpdeskDetails
      setHelpdeskDetails(helpdeskDetails);
      setInteractionData({
        ...interactionData,
        project: helpdeskDetails?.project?.code,
        severity: helpdeskDetails?.severity?.code,
        edoc: helpdeskDetails?.complitionDate
      });
      if (helpdeskDetails?.project?.code) {
        getAgentUserList(helpdeskDetails?.project?.code)
      }

      get(`${properties.HELPDESK_API}/statementIdByStatement?statement=${helpdeskDetails.helpdeskSubject}`).then((resp) => {
        console.log('resp ', resp)
        if (resp?.data?.requestId) {
          handleFrequentInteractionChange({
            requestId: resp.data.requestId,
            project: helpdeskDetails?.project?.code,
            severity: helpdeskDetails?.severity?.code,
            edoc: helpdeskDetails?.complitionDate
          }, 'frequent')

        } else {
          setWithStatement(false)
        }
      }).catch(err => {
        // console.log(err)
      })
    }
  }, [props]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const permissions = await getPermissions('CREATE_INTXN_OTHERS');
        // // console.log('permissions', permissions);
        setPermission(permissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };

    fetchData();
  }, []);

  let selectedOptions = useRef({});
  useMemo(() => {
    // setWorkflowResponse([])
    setValue("");
    setslaEdoc()
    unstable_batchedUpdates(() => {
      if (customerUuid) {
        // console.log('inside here ', customerUuid)
        const searchParams = {
          customerUuid,
        };
        post(`${properties.INTERACTION_API}/search?limit=&page=`, { searchParams })
          .then((resp) => {
            setInteractionList(resp.data);
          }).catch(error => {
            console.error(error);
          })
          .finally();

        get(`${properties.INTERACTION_API}/frequent?customerUuid=${customerUuid}`)
          .then((resp) => {
            if (resp.data) {
              setFrequentCustomerInteraction(resp?.data || []);
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();
        if (customerNo) {
          get(`${properties.INTERACTION_API}/get-customer-history-count/${customerNo}`)
            .then((resp) => {

              if (resp.data) {
                closedInteractionCount.current = resp.data?.closedInteraction || 0;
                openInteractionCount.current = resp.data?.openInteraction || 0;
                totalInteractionsCount.current = Number(resp.data?.openInteraction) + Number(resp.data?.closedInteraction) || 0;
              }
            })
            .catch((error) => {
              console.error(error);
            })
            .finally();
        }
      }
      get(`${properties.INTERACTION_API}/frequent`)
        .then((resp) => {
          if (resp.data) {
            let newArray = removeDuplicatesFromArrayObject(resp.data, "requestStatement");
            setFrequentInteraction(newArray || []);
          } else {
            toast.error("Error while fetching details");
          }
        }).catch(error => {
          // console.log(error)
        })
        .finally();

      get(`${properties.INTERACTION_API}/frequent?today=${moment().format("YYYY-MM-DD")}`)
        .then((resp) => {
          if (resp.data) {
            let newArray = removeDuplicatesFromArrayObject(resp.data, "requestStatement");
            setFrequentDayInteraction(newArray || []);
          } else {
            toast.error("Error while fetching details");
          }
        })
        .catch(error => {
          // console.log(error)
        }).finally()

      get(`${properties.INTERACTION_API}/top-catagory?st=`)
        .then((resp) => {
          if (resp.data) {
            const newArray = [];
            const uniqueObject = {};
            for (const i in resp.data) {
              const item = resp.data[i]["intxnCategory"]?.code;
              if (item) {
                uniqueObject[item] = resp.data[i];
              }
            }
            // Loop to push unique object into array
            for (const i in uniqueObject) {
              newArray.push(uniqueObject[i]);
            }

            setFrequentTenInteraction(newArray || []);
          } else {
            toast.error("Error while fetching top 10 category");
          }
        })
        .catch(error => {
          // console.log(error)
        }).finally();

      post(properties.USER_API + "/search?limit=&page=")
        .then((resp) => {
          if (resp.data) {
            setUserList(resp.data?.rows);
          } else {
            toast.error("Error while fetching details");
          }
        })
        .catch(error => {
          // console.log(error)
        }).finally();

      get(
        properties.MASTER_API +
        "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,INTXN_TYPE,INTXN_CATEGORY,SERVICE_TYPE,SERVICE_CATEGORY,TICKET_CHANNEL,PRIORITY,CONTACT_PREFERENCE,INTXN_CAUSE,APPOINT_TYPE,PRODUCT_FAMILY,LOCATION,COUNTRY,PROD_SUB_TYPE,NOTIFICATION_TYPE,PROBLEM_CODE,TASK_STATUS,TAGS"
      )
        .then((resp) => {
          if (resp.data) {
            lookupData.current = resp.data;
            setSourceLookup(resp.data["TICKET_SOURCE"]);
            setIntxnTypeLookup(resp.data.INTXN_TYPE || []);
            setIntxnCategoryLookup(resp.data.INTXN_CATEGORY || []);
            // setIntxnProblemCodesLookup(resp.data.PROBLEM_CODE || []);
            setChannelLookup(resp.data.TICKET_CHANNEL || []);
            setPriorityLookup(resp.data.PRIORITY || []);
            setPreferenceLookup(resp.data.CONTACT_PREFERENCE || []);
            setNotificationLookup(resp.data.NOTIFICATION_TYPE || []);
            setServiceTypeLookup(resp.data.SERVICE_TYPE || []);
            setServiceCategoryLookup(resp.data.PROD_SUB_TYPE || []);
            setProblemCauseLookup(resp.data.INTXN_CAUSE || []);
            setAppointmentTypes(resp.data.APPOINT_TYPE || []);
            setTaskStatusLookup(resp.data.TASK_PRIORITY || []);
            setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })))
            const customerCountry =
              props?.location?.state?.data?.customerAddress?.[0]?.country || null;
            setLocations(
              customerCountry
                ? resp.data.LOCATION.filter(
                  (x) => x?.mapping?.country === customerCountry
                )
                : resp.data.LOCATION
            );
            setCountries(resp.data.COUNTRY);
            if (
              customerDetails?.contactPreferences &&
              customerDetails?.contactPreferences.length > 0
            ) {
              let contactPreferences = [];
              try {
                contactPreferences = JSON.parse(customerDetails?.contactPreferences)
              } catch (error) { }
              // // console.log("contactPreferences ===> ", contactPreferences);
              selectedOptions.current = resp.data.CONTACT_PREFERENCE.filter((x) =>
                contactPreferences.includes(x.code)
              ).map((option) => ({
                value: option.code,
                label: option.description,
              }));
              setSelectedContactPreference([...selectedOptions.current]);
              // setSelectedContactPreference([]);
            }
          } else {
            toast.error("Error while fetching lookup details");
          }
        }).catch(error => {
          // console.log(error)
        })
        .finally();

      // // console.log('kbRequestId ', kbRequestId)
      if (kbRequestId) {
        handleFrequentInteractionChange(kbRequestId, "frequent");
      }
    });
  }, []);

  useMemo(() => {
    if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
      if (Array.isArray(customerService) && customerService.length > 0) {
        setServiceList(customerService)
      } else if (!Array.isArray(customerService) && customerService) {
        setServiceList(customerService)
        setSelectedService(customerService)
      } else {
        post(`${properties.ACCOUNT_DETAILS_API}/get-service-list?limit=&page=`, { customerUuid })
          .then((response) => {
            if (response.status === 200) {
              const services = response?.data?.filter((e) => e.status !== statusConstantCode.status.SERVICE_TEMP);
              setServiceList(services);
              // // console.log("services------->", services);
              if (services.length > 1) {
                // setOpenServiceModal(true)
                setSelectedService(services[0]);
              } else if (services.length === 1) {
                setOpenServiceModal(false);
                setSelectedService(services[0]);
              } else {
                setOpenServiceModal(false);
              }
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();
      }
    }
  }, [customerUuid, dtWorksProductType])

  useEffect(() => {
    if (kbRequestId) {
      handleFrequentInteractionChange(kbRequestId, "frequent");
    }
  }, [switchStatus])

  useEffect(() => {
    setInteractionData({ ...interactionData, contactPreference: selectedContactPreference });
  }, [selectedContactPreference]);



  useMemo(() => {
    unstable_batchedUpdates(() => {
      if (selectedService && Object.keys(selectedService).length > 0) {
        if (selectedService && Object.keys(selectedService).length > 0 && selectedService?.srvcTypeDesc?.code) {
          get(`${properties.INTERACTION_API}/frequent?st=${selectedService?.srvcTypeDesc?.code}`).then((resp) => {
            if (resp.data) {
              let newArray = removeDuplicatesFromArrayObject(resp.data, 'requestStatement')
              setFrequentInteraction(newArray || [])
            }
            else {
              toast.error("Error while fetching details")
            }
          })
            .finally()

          get(`${properties.INTERACTION_API}/frequent?today=${moment().format('YYYY-MM-DD')}&st=${selectedService?.srvcTypeDesc?.code}`).then((resp) => {
            if (resp.data) {
              let newArray = removeDuplicatesFromArrayObject(resp.data, 'requestStatement')
              setFrequentDayInteraction(newArray || [])
            }
            else {
              toast.error("Error while fetching details")
            }
          })
            .finally()

          get(`${properties.INTERACTION_API}/top-catagory?st=${selectedService?.srvcTypeDesc?.code}`).then((resp) => {
            if (resp.data) {
              const newArray = []
              const uniqueObject = {};
              for (const i in resp.data) {
                const item = resp.data[i]['intxnCategory']?.code;
                if (item) {
                  uniqueObject[item] = resp.data[i];
                }
              }
              for (const i in uniqueObject) {
                newArray.push(uniqueObject[i]);
              }

              setFrequentTenInteraction(newArray || [])
            }
            else {
              toast.error("Error while fetching top 10 category")
            }
          })
            .finally()
        }
      }
    });
  }, [selectedService]);


  const validate = (schema, data, type) => {
    try {
      if (type === 'INTERACTION') {
        setError({});

      } else if (type === 'ADDRESS') {
        setAddressError({});

      }
      schema.validateSync(data, { abortEarly: false });
    } catch (e) {
      e.inner.forEach((err) => {
        if (type === 'INTERACTION') {
          setError((prevState) => {
            return { ...prevState, [err.params.path]: err.message };
          });
        } else if (type === 'ADDRESS') {
          setAddressError((prevState) => {
            return { ...prevState, [err.params.path]: err.message };
          });
        }
      });
      return e;
    }
  };

  const getAgentUserList = (projectDetails) => {
    if (projectDetails) {
      get(`${properties.MASTER_API}/qa-user/lookup?project=${projectDetails}`).then((resp) => {
        if (resp.data) {
          setQaUserList(resp.data)
        }
      }).catch(error => {
        // console.log(error)
      })
        .finally();
    } else {
      console.warn('Please provide Projects')
    }
  }

  const handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const id = target.id;
    if (id === "interactionCategory") {
      // if (withStatement) {
      const intxnType =
        lookupData.current["INTXN_TYPE"] &&
        lookupData.current["INTXN_TYPE"].filter((e) => {
          let isTrue = false;
          if (
            e &&
            e.mapping &&
            e?.mapping?.intxnCategory &&
            Array.isArray(e?.mapping?.intxnCategory) && e.mapping?.intxnCategory.includes(value)
          ) {
            isTrue = true;
          }
          return isTrue;
        });
      unstable_batchedUpdates(() => {
        setIntxnTypeLookup(intxnType);
        setInteractionData({ ...interactionData, [id]: value });
      });
    } else if (id === "interactionType") {
      // if (!withStatement) {
      // console.log('value------>', value)
      // console.log('lookupData.current["PROD_SUB_TYPE"]---->', lookupData.current["PROD_SUB_TYPE"])
      const services = lookupData.current["PROD_SUB_TYPE"].filter((e) => {
        let isTrue = false;
        if (
          e &&
          e.mapping &&
          e?.mapping?.intxnType &&
          Array.isArray(e?.mapping?.intxnType) && e.mapping?.intxnType.includes(value)
          // && Array.isArray(e?.mapping?.intxnCategory) && e.mapping?.intxnCategory?.includes(interactionData?.interactionCategory)
        ) {
          isTrue = true;
        }
        return isTrue;
      });
      unstable_batchedUpdates(() => {
        setServiceCategoryLookup(services);
        setInteractionData({ ...interactionData, [id]: value, serviceType: '' });
      });
    } else if (id === "serviceCategory") {
      const serviceTypes =
        lookupData.current["SERVICE_TYPE"] &&
        lookupData.current["SERVICE_TYPE"].filter((e) => {
          let isTrue = false;
          if (
            e &&
            e.mapping &&
            (
              (e?.mapping?.mapEntity && Array.isArray(e?.mapping?.mapEntity) && e.mapping?.mapEntity.includes(value)) ||
              (e?.mapping?.prodSubType && Array.isArray(e?.mapping?.prodSubType) && e.mapping?.prodSubType.includes(value))
            )
          ) {
            isTrue = true;
          }

          return isTrue;
        });
      unstable_batchedUpdates(() => {
        setServiceTypeLookup(serviceTypes);
        let serviceType
        if (serviceTypes.length === 1) {
          serviceType = serviceTypes?.[0].code
          try {

            getWorkFlow({ serviceCategory: value, serviceType, interactionType: interactionData?.interactionType, interactionCategory: interactionData?.interactionCategory })
          } catch (error) {

          }
          unstable_batchedUpdates(async () => {
            const probCode = await getProblemCode()
            const problemCodes = probCode && probCode.filter((ele) => ele?.serviceType === serviceType && ele?.serviceCategory === value && ele?.intxnType === interactionData?.interactionType && ele?.intxnCategory === interactionData?.interactionCategory)
            const problemCodesData = Array.from(new Set(problemCodes?.map(item => JSON.stringify(item?.problemCodeDesc))))?.map(JSON.parse);
            const pc = problemCodesData.length === 1 ? problemCodes?.[0].problemCode : '';
            setProblemCodeLookupData(problemCodesData)
            setInteractionData({ ...interactionData, [id]: value, serviceType, intxnProblemCode: pc });
          });
        } else {
          setInteractionData({ ...interactionData, [id]: value });
        }
      });
    } else if (id === "serviceType") {
      // if (withStatement) {
      // const serviceCategory = lookupData.current["SERVICE_TYPE"] && lookupData.current["SERVICE_TYPE"].filter((e) => {
      //   let isTrue = false;
      //   if (e && e.code === value) {
      //     isTrue = true;
      //   }
      //   return isTrue;
      // });

      // const serviceCategory =
      //   lookupData.current["PROD_SUB_TYPE"] &&
      //   lookupData.current["PROD_SUB_TYPE"].filter((e) => {
      //     let isTrue = false;
      //     if (
      //       e &&
      //       e.mapping &&
      //       (
      //         (e?.mapping?.mapEntity && Array.isArray(e?.mapping?.mapEntity) && e.mapping?.mapEntity.includes(value)) ||
      //         (e?.mapping?.serviceType && Array.isArray(e?.mapping?.serviceType) && e.mapping?.serviceType.includes(value))
      //       )
      //     ) {
      //       isTrue = true;
      //     }

      //     return isTrue;
      //   });
      // console.log("serviceCategory ==>", interactionData?.serviceCategory, value)
      try {
        getWorkFlow({ serviceCategory: interactionData?.serviceCategory, serviceType: value, interactionType: interactionData?.interactionType, interactionCategory: interactionData?.interactionCategory })
      } catch (error) {

      }
      unstable_batchedUpdates(async () => {
        const probCode = await getProblemCode()
        const problemCodes = probCode && probCode.filter((ele) => ele?.serviceType === value && ele?.serviceCategory === interactionData?.serviceCategory && ele?.intxnType === interactionData?.interactionType && ele?.intxnCategory === interactionData?.interactionCategory)
        const problemCodesData = Array.from(new Set(problemCodes?.map(item => JSON.stringify(item?.problemCodeDesc))))?.map(JSON.parse);
        const pc = problemCodesData.length === 1 ? problemCodes?.[0].problemCode : '';
        setProblemCodeLookupData(problemCodesData)
        setInteractionData({ ...interactionData, [id]: value, intxnProblemCode: pc });
      });


      // } else {
      //   const lookup = lookupData?.current?.PROBLEM_CODE?.filter((ele) => ele?.serviceType === value)
      //   const serviceCategoryTypes = Array.from(new Set(lookup?.map(item => JSON.stringify(item?.serviceCategoryDesc))))?.map(JSON.parse);
      //   const problemCodes = lookupData?.current?.PROBLEM_CODE?.filter((ele) => ele?.serviceType === value && ele?.serviceCategory === interactionData?.serviceCategory && ele?.intxnType === interactionData?.interactionType && ele?.intxnCategory === interactionData?.interactionCategory)
      //   // const problemCodes = lookupData?.current?.PROBLEM_CODE?.filter((ele) => ele?.serviceType === value && ele?.serviceCategory === serviceCategoryTypes?.[0]?.code && ele?.intxnType === interactionData?.interactionType && ele?.intxnCategory === interactionData?.interactionCategory)
      //   const problemCodesData = Array.from(new Set(problemCodes?.map(item => JSON.stringify(item?.problemCodeDesc))))?.map(JSON.parse);
      //   // getWorkFlow({ serviceCategory: serviceCategoryTypes?.[0]?.code, serviceType: value, interactionType: interactionData?.interactionType, interactionCategory: interactionData?.interactionCategory })
      //   getWorkFlow({ serviceCategory: interactionData?.serviceCategory, serviceType: value, interactionType: interactionData?.interactionType, interactionCategory: interactionData?.interactionCategory })
      //   unstable_batchedUpdates(() => {
      //     setInteractionData({ ...interactionData, [id]: value });
      //     // setInteractionData({ ...interactionData, [id]: value, serviceCategory: serviceCategoryTypes?.[0]?.code });
      //     setProblemCodeLookupData(problemCodesData)
      //   })
      // }
    } else if (id === "contactPreference") {
      // Handle multi-select inputs
      selectedOptions.current = value.map((option) => ({
        value: option.value,
        label: option.label,
      }));
      // console.log(selectedOptions.current)
      setInteractionData({ ...interactionData, [id]: selectedOptions.current });
    } else if (id === "project") {
      setInteractionData({ ...interactionData, [id]: value });
      if (isQAFormEnabled?.isEnabled) {
        getAgentUserList(value)
      }
    } else if (id === 'requestStatement') {
      setValue(value);
      setInteractionData({ ...interactionData, [id]: value });
    } else if (id === 'toStatus') {
      let entity = []
      workflowLookUp &&
        workflowLookUp?.entities.map((unit) => {
          for (const property in unit.status) {
            if (unit.status[property].code === target.value) {
              entity.push(unit);
              break;
            }
          }
        })

      unstable_batchedUpdates(() => {
        if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
          entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
          setInteractionData({
            ...interactionData,
            toStatus: target.value,
            toRole: entity?.[0]?.roles?.[0].roleId,
            toDept: entity?.[0]?.entity?.[0]?.unitId
          })

          const l = userList.filter(u => u.mappingPayload?.userDeptRoleMapping?.filter(f => f?.roleId?.includes(entity?.[0]?.roles?.[0].roleId)))
          // console.log(l)
          setUserLookup(l)
        } else {
          setInteractionData({
            ...interactionData,
            toStatus: target.value
          })
        }
        setRoleLookup(entity)
      })
    } else if (id === 'toRole') {
      const { unitId = "" } = target?.value !== "" && JSON.parse(target.options[target.selectedIndex].dataset.entity);
      setInteractionData({ ...interactionData, [target.id]: target.value, toDept: unitId })
      isRoleChangedByUserRef.current = true;

      // console.log('userList ', userList)
      const l = userList.filter(u => u.mappingPayload?.userDeptRoleMapping?.filter(f => f?.roleId?.includes(target.value)))
      setUserLookup(l)
    } else if (id === 'intxnProblemCode') {
      post(`${properties.KNOWLEDGE_API}/get-user-resolution`, { intxnProblemCode: value })
        .then((resp) => {
          if (resp?.data) {
            setUserResolutionList(resp?.data || [])
          } else {
            setUserResolutionList([])
          }
        }).catch(error => {
          // console.log(error)
        })

      setInteractionData({ ...interactionData, [id]: value });

    } else {
      setInteractionData({ ...interactionData, [id]: value });
    }
  }

  const handleKnowledgeBaseInteraction = (value, type, callingFrom) => {
    unstable_batchedUpdates(() => {
      if (type !== "frequent10") {
        if (value) {
          slowGet(
            `${properties.KNOWLEDGE_API}/search?q=${value}&st=${selectedService?.srvcTypeDesc?.code}`
          )
            .then((resp) => {
              if (resp?.data) {
                // if (resp?.data?.length > 0) {
                //   setIsPriorityOpen(true);
                // } else {
                //   setIsPriorityOpen(false);
                // }
                const arr = resp?.data?.map((i) => ({
                  id: i.requestId, value: i.requestStatement, ...i,
                }))
                unstable_batchedUpdates(() => {
                  setKnowledgeBaseInteractionList(resp?.data || []);
                  setIsExpanded(true);//to show the list in search bar
                  setItems(arr);
                })
              }
            })
            .catch((error) => {
              console.error(error);
            })
            .finally();
        } else {
          setKnowledgeBaseInteractionList([]);
        }
      } else {
        let api_url = `${properties.KNOWLEDGE_API}/search?c=${value?.intxnCategory?.code}&st=${selectedService.srvcTypeDesc?.code}`
        if (callingFrom === "InteractionWidget") {
          api_url = `${properties.KNOWLEDGE_API}/search?c=${value?.intxnCategory?.code}`
        }
        get(api_url)
          .then((resp) => {
            if (resp?.data) {
              // if (resp?.data?.length > 0) {
              //   setIsPriorityOpen(true);
              // } else {
              //   setIsPriorityOpen(false);
              // }
              const arr = [];
              for (const i of resp?.data) {
                const obj = {
                  id: i.requestId,
                  value: i.requestStatement,
                  ...i,
                };
                arr.push(obj);
              }
              unstable_batchedUpdates(() => {
                setValue("");
                setslaEdoc()
                setIsExpanded(true);
                setKnowledgeBaseInteractionList(resp?.data || []);
                setItems(arr);
              })
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();
      }
    });
  };

  useEffect(() => {

    if (knowledgeBaseInteractionList?.length && value?.trim() !== "") {
      const knowledgeBase = knowledgeBaseInteractionList.find(
        (x) => x.requestStatement?.toLowerCase()?.includes(value?.toLowerCase())
      );
      if (knowledgeBase) {
        setInteractionDataFunc(knowledgeBase);
      }
    }
  }, [knowledgeBaseInteractionList])

  const setInteractionDataFunc = (knowledgeBase) => {
    setInteractionData({
      ...interactionData,
      interactionResolution: knowledgeBase?.intxnResolutionDesc?.description || "",
      statementId: knowledgeBase?.requestId || "",
      statement: knowledgeBase?.requestStatement || "",
      statementSolution: knowledgeBase?.intxnResolution || "",
      problemCause: knowledgeBase?.intxnCause || "",
      serviceType: knowledgeBase.serviceType || "",
      switchStatus,
      interactionType: knowledgeBase?.intxnType || "",
      interactionCategory: knowledgeBase?.intxnCategory || "",
      serviceCategory: knowledgeBase?.serviceCategory || "",
      priorityCode: knowledgeBase?.priorityCode || ""
    });
  }

  const handleKnowledgeInteractionChange = (e, type) => {
    unstable_batchedUpdates(() => {
      newArray = [];
      setResolutionData([]);
      setIsFormDisabled(false)
      setFormDetails([])
      setValues([])
      setslaEdoc()
      // workflowResponse = []
      // setWorkflowResponse([]);
      const { target } = e;

      const knowledgeBase = knowledgeBaseInteractionList.find(
        (x) => x.requestStatement?.toLowerCase()?.includes(target?.value?.toLowerCase())
      );

      if (knowledgeBase) {
        setInteractionDataFunc(knowledgeBase);
        setError({
          ...error,
          statementId: "",
          statement: "",
          statementSolution: "",
          problemCause: "",
          serviceType: "",
          interactionType: "",
          interactionCategory: "",
          serviceCategory: "",
        });

        setOpenCreateInteraction(true);
      } else {
        setInteractionData({
          ...interactionData,
          statementId: "",
          statement: "",
        });
        setError({
          ...error,
          statementId: "",
          statement: "",
        });
      }
      clearTimeout(timer);
      const newTimer = setTimeout(() => {
        handleKnowledgeBaseInteraction(target.value, type);
      }, 500);
      setTimer(newTimer);
    });
  };

  const handleKnowledgeSelect = (knowledgeBase) => {
    unstable_batchedUpdates(() => {
      // workflowResponse = []
      // setWorkflowResponse([]);
      if (knowledgeBase) {
        handleFrequentInteractionChange(knowledgeBase, "");
        setInteractionData({
          ...interactionData,
          statementId: knowledgeBase?.requestId || "",
          statement: knowledgeBase?.requestStatement || "",
          statementSolution: knowledgeBase?.intxnResolution || "",
          problemCause: knowledgeBase?.intxnCause || "",
          serviceType: knowledgeBase.serviceType || "",
          switchStatus,
          interactionType: knowledgeBase?.intxnType || "",
          interactionCategory: knowledgeBase?.intxnCategory || "",
          serviceCategory: knowledgeBase?.serviceCategory || "",
          contactPreference: customerData?.contactPreferences,
          appointmentRequired: knowledgeBase?.isAppointment === 'Y' ? true : false,
          priorityCode: knowledgeBase?.priorityCode || ""
        });

        // getWorkFlow({ serviceCategory: knowledgeBase?.serviceCategory, serviceType: knowledgeBase?.serviceType, interactionType: knowledgeBase?.intxnType, interactionCategory: knowledgeBase?.intxnCategory })

        setError({
          ...error,
          statementId: "",
          statement: "",
          statementSolution: "",
          problemCause: "",
          serviceType: "",
          interactionType: "",
          interactionCategory: "",
          serviceCategory: "",
        });
        setOpenCreateInteraction(true);
      } else {
        setInteractionData({
          ...interactionData,
          statementId: "",
          statement: "",
        });
        setError({
          ...error,
          statementId: "",
          statement: "",
        });
      }
    });
  };

  const workflowApiCall = (reqBody, data, paylodData) => {
    unstable_batchedUpdates(() => {
      if (data && data?.length > 0) {
        reqBody.data.resolutionData = JSON.stringify(data);
      }
      // // console.log("reqBody ==> ", reqBody)
      slowPost(`${properties.WORKFLOW_API}/resolution`, reqBody)
        .then((resp) => {
          let messageObject = {
            from: "bot",
            msg: resp.data,
          };
          setWorkflowResponse([...workflowResponse, messageObject]);
          newArray.push(messageObject);
          setResolutionData(newArray);
        })
        .catch(error => {
          // console.log(error)
        })
    });
  };

  const flushOlderResponse = () => {
    workflowResponse = [];
    setWorkflowResponse(workflowResponse);
  };



  const handleValidate = useCallback((interactionDetails, value, isWithStatement) => {
    // // console.log('interactionDetails, value, isWithStatement', interactionDetails, value, isWithStatement)
    return new Promise((resolve, reject) => {
      // // console.log(isQAFormEnabled?.isEnabled, !interactionDetails?.agentName)
      interactionDetails["contactPreference"] = interactionDetails["contactPreference"] ? interactionDetails["contactPreference"] : selectedOptions.current;
      interactionDetails['edoc'] = slaEdoc ?? interactionDetails?.edoc ?? ''
      if (!isEmpty(interactionDetails)) {
        let error = validate(interactionDetailsValidationSchema, interactionDetails, 'INTERACTION');
        let addressError = false
        if (enableInteractionAddress) {
          addressError = validate(AddressValidationSchema, addressList[0], 'ADDRESS')
        }

        if (isWithStatement && !interactionDetails?.statement && !interactionDetails?.requestStatement && !value) {
          toast.error("Please Provide the statement");
          reject(false);
        } else if (error) {
          toast.error("Validation errors found. Please check highlighted fields");
          reject(false);
        } else if (addressError) {
          toast.error("Validation errors found. Please check address details");
          reject(false);
        } else if (isWithStatement && !interactionDetails?.statement && value) {
          confirmAlert({
            //   title: 'Confirm',
            message: 'Do you want to add this as New statement',
            buttons: [
              {
                label: 'Yes',
                onClick: () => {
                  const statementBody = {
                    intxnCategory: interactionDetails.interactionCategory,
                    serviceCategory: interactionDetails.serviceCategory,
                    intxnType: interactionDetails.interactionType,
                    serviceType: interactionDetails?.serviceType,
                    requestStatement: value,
                    priorityCode: interactionDetails?.priorityCode || ''
                  }
                  post(properties.KNOWLEDGE_API + "/add-statement", statementBody)
                    .then((response) => {
                      if (response.status === 200) {
                        toast.success(response?.message)
                        resolve({
                          statementId: response?.data?.requestId,
                          statement: value,
                          nextApiCall: "N"
                        })
                      }
                    })
                    .catch((error) => {
                      console.error(error);
                      resolve();
                      return false
                    })
                    .finally();
                }
              },
              {
                label: 'Cancel',
                onClick: () => { resolve(); }
              }
            ],
            closeOnEscape: true,
            closeOnClickOutside: true,
            keyCodeForClose: [8, 32],
            willUnmount: () => { },
            afterClose: () => { },
            onClickOutside: () => { },
            onKeypress: () => { },
            onKeypressEscape: () => { },
            overlayClassName: "overlay-custom-class-name"
          })
        } else {
          resolve();
        }
      }
    })
  }, [interactionDetailsValidationSchema, selectedOptions.current])

  const isStringsArray = arr => arr?.every(i => typeof i === "string")

  const handleSubmit = (e, type) => {
    e.preventDefault();
    // // console.log('interactionData ', interactionData)
    handleValidate(interactionData, value, withStatement).then(resolved => {
      // statement is null, value is null and resolve not empty
      // // console.log('resolved---------->', !interactionData?.statement, value, !isEmpty(resolved), interactionData?.statement, value, isEmpty(resolved))
      if (resolved?.nextApiCall === "N") {
        return
      }

      if (type !== 'skip') {
        if (!helpdeskDetails?.serviceUuid && (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) && isObjectEmpty(selectedService) && serviceList?.length) {
          setOpenServiceModal(true)
          return
        }
      }

      unstable_batchedUpdates(() => {

        let cPref = [];
        // console.log('interactionData ', interactionData)
        if (isStringsArray(interactionData.contactPreference)) {
          cPref = interactionData.contactPreference;
        } else {
          cPref = interactionData.contactPreference.map((option) => option.value);
        }
        let requestBody = {
          customerId: Number(customerData?.customerId) || null,
          statement: interactionData.statement === "" ? interactionData?.requestStatement : interactionData.statement,
          statementId: interactionData.statementId || resolved?.statementId,
          statementSolution: interactionData.statementSolution || resolved?.statement,
          interactionType: interactionData.interactionType,
          serviceType: interactionData.serviceType,
          channel: helpdeskChannel ?? interactionData.channel,
          project: interactionData?.project,
          severity: interactionData?.severity,
          problemCause: interactionData.problemCause,
          priorityCode: interactionData.priorityCode,
          contactPreference: cPref,
          remarks: interactionData.remarks,
          interactionCategory: interactionData.interactionCategory,
          serviceCategory: interactionData.serviceCategory,
          attachments:
            [...currentFiles.map((current) => current.entityId)].length > 0
              ? [...currentFiles.map((current) => current.entityId)]
              : "",
          appointDtlId: interactionData.appointDtlId,
          appointUserId: interactionData.appointUserId,
          appointAddress: interactionData.appointDtlId ? (interactionData?.useCustomerAddress
            ? customerAddress
            : addressData) : null,
          helpdeskId: helpdeskDetails?.helpdeskId || "",
          edoc: interactionData.edoc,
          customerContactNo,
          agentName: interactionData?.agentName ?? '',
          isManagerialAssign: appsConfig?.clientConfig?.isManagerialAssign?.roleId === auth?.currRoleId ? "true" : "false",
          referenceCategory: dtWorksProductType,
          referenceValue: customerNo,
          profileId: Number(customerDetails?.profileId) || null,
          toStatus: interactionData?.toStatus ?? '',
          toRole: interactionData?.toRole ?? '',
          toDept: interactionData?.toDept ?? '',
          currUser: interactionData?.currUser ?? '',
          preFlow: !!interactionData?.toDept,
          workflowUuid: interactionData?.workflowUuid ?? '',
          intxnProblemCode: withStatement ? null : interactionData?.intxnProblemCode,
          serviceId: Number(selectedService?.serviceId) || null,
          accountId: Number(selectedService?.accountId) || null,
          serviceUuid: selectedService?.serviceUuid,
          accountUuid: selectedService?.accountUuid,
          taskList
        };

        if (enableInteractionAddress && addressList && addressList.length > 0 && Object.keys(addressList[0]).length) {
          const addressData = {
            isPrimary: false,
            addressType: addressList[0].addressType,
            address1: addressList[0].address1,
            address2: addressList[0].address2,
            postcode: addressList[0].postcode,
            country: addressList[0].country,
            state: addressList[0].state,
            district: addressList[0].district,
            city: addressList[0].city
          }
          requestBody.interactionAddress = addressData
        }

        requestBody = removeEmptyKey(requestBody);

        // console.log('requestBody ', requestBody)
        // return false
        post(`${properties.INTERACTION_API}/create`, requestBody)
          .then((response) => {
            if (response.status === 200) {
              toast.success(response.message);
              setInteractionData(initIntxnData)
              setSelectedContactPreference([])
              // history(`/my-workspace`);
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();

      });
      // }
    }).catch(rejected => {
      // console.log(rejected);
    });
  };

  const handleClear = () => {
    unstable_batchedUpdates(() => {
      // console.log("setInteractionData called 11");
      setInteractionData(initIntxnData);
      setslaEdoc()
    });
  };

  const handleOnModelClose = () => {
    unstable_batchedUpdates(() => {
      setOpenServiceModal(false);
      setOpenProductModal(false);
    });
  };

  const handleAddProducts = (flag, value) => {
    if (flag) {
      let x = productArr.map((c, i) => {
        if (Number(c?.productId) === Number(value?.productId)) {
          c = { ...c, quantity: 1, isSelected: "Y" };
        }
        return c;
      });
      setProductArr(x);
    } else {
      let x = productArr.map((c, i) => {
        if (Number(c?.productId) === Number(value?.productId)) {
          c = { ...c, quantity: 0, isSelected: "N" };
        }
        return c;
      });
      setProductArr(x);
    }
  };

  const handleSetOrderId = (flag, value) => {
    if (flag) {
      let x = orderId.map((c, i) => {
        if (Number(c?.orderId) === Number(value?.orderId)) {
          c = { ...c, isSelected: "Y" };
        }
        return c;
      });
      setOrderId(x);
    } else {
      let x = orderId.map((c, i) => {
        if (Number(c?.orderId) === Number(value?.orderId)) {
          c = { ...c, isSelected: "N" };
        }
        return c;
      });
      setOrderId(x);
    }
  };

  function isBase64(str) {
    const finalString = str.split('base64,')?.[1] || ''
    const isBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(finalString);
    return isBase64;
  }

  const clickToProceed = (
    ele,
    selectedService,
    resolutionPayload,
    idx,
    description
  ) => {
    // console.log('ele-------------->', ele)
    // console.log('selectedService-------------->', selectedService)
    // console.log('resolutionPayload-------------->', resolutionPayload)
    // console.log('idx-------------->', idx)
    // console.log('description-------------->', description)
    if (description === "YES_NO_REDIRECT_BUTTON") {
      history(`/create-interaction`);
    }
    if (ele === "SELECTED_INTXN") {
      resolutionPayload.data.inputType = "MESSAGE";
      resolutionPayload.data.inputValue = description;
      // // console.log('description---------->', description)
      if (description?.includes("_")) {
        description = description.split("_")[0];
      }
      const messageObject = {
        from: "user",
        msg: { callAgain: false, description },
      };
      let data = [...resolutionData, messageObject];
      newArray.push(messageObject);
      setResolutionData(newArray);
      workflowApiCall(resolutionPayload, data);
      document.getElementById("hide" + idx).innerHTML = "";
    } else if (ele === "SUBMIT_REMARKS") {
      if (!description || description === null || description === "") {
        toast.error("Please type remarks");
      } else {
        resolutionPayload.data.inputType = "MESSAGE";
        resolutionPayload.data.inputValue = description;
        const messageObject = {
          from: "user",
          msg: { callAgain: false, description },
        };
        let data = [...resolutionData, messageObject];
        newArray.push(messageObject);
        setResolutionData(newArray);
        workflowApiCall(resolutionPayload, data);
        document.getElementById("hide" + idx).innerHTML = "";
      }
    } else if (ele === "FORM_SUBMIT") {
      Swal.fire({
        title: 'Confirm',
        text: `Are you sure ?`,
        icon: "info",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: `Yes!`,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          if (selectedService !== 'cancel' && (!description || description === null || description === "")) {
            toast.error("Please Fill the Form");
          } else if (selectedService !== 'cancel' && typeof (description) === 'object' && Object.keys(description)?.length < 2) {
            toast.error("Please Fill the Form");
            return
          } else {

            if (selectedService === 'cancel') {
              resolutionPayload.conversationUid = workflowPaylod.conversationUid
              resolutionPayload.flowId = workflowPaylod.flowId
              resolutionPayload.data = { source: "knowledgeBase" }
            }
            resolutionPayload.data.inputType = "FORMDATA";
            resolutionPayload.data.inputValue = description ?? '';
            resolutionPayload.data.submitType = selectedService ?? ''
            // // console.log('description-------->', description)
            // // console.log('self_submit ------------->',)
            let descriptionValue;

            if (selectedService === 'self_submit') {
              descriptionValue = description['Department'] + ',' + description['role']
              // document.getElementById("hide" + idx).innerHTML = "";
            }
            else if (selectedService === 'selfSubmit') {
              let arr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              description['month'] = Number(description['month'])
              description['year'] = Number(description['year'])

              let m;
              if (description['month'] >= 1 && description['month'] <= 12) {
                m = arr[description['month'] - 1];
              } else {
                m = "Invalid Month";
              }
              descriptionValue = m + '-' + description['year'];

            }
            else if (selectedService === ' Others_submit') {
              descriptionValue = 'Form Details Submitted.'
            } else {
              if (typeof (description) === "object") {
                let keyArray = Object.keys(description)[Object.keys(description).length - 1];
                // // console.log('description---------->', description)
                // // console.log('Object.keys(description).length - 2 ---------->', Object.keys(description).length - 2)
                // // console.log('keyArray ---------->', keyArray)
                // // console.log('typeof (description[keyArray])------->', typeof (description[keyArray]))
                // // console.log('description[keyArray]------->', description[keyArray])

                if (typeof (description[keyArray]) === 'array' || typeof (description[keyArray]) === 'object') {
                  const valuesArray = description[keyArray]?.map((ele) => ele?.value || ele?.calendarShortName)
                  descriptionValue = valuesArray.join(', ')
                } else if (isBase64(description[keyArray]) || description[keyArray].includes(`<form id="dynamicForm">`)) {
                  descriptionValue = 'Form Details Submitted.'
                } else if (description[keyArray].includes(`id="hide`)) {
                  descriptionValue = 'Form Details Submitted.'
                } else {
                  descriptionValue = description[keyArray]
                }
              } else {
                descriptionValue = description
              }
            }
            const messageObject = {
              from: "user",
              msg: { callAgain: false, description: descriptionValue },
            };
            let data = [...resolutionData, messageObject];
            newArray.push(messageObject);
            // setIsFormDisabled(true)
            setResolutionData(newArray);
            workflowApiCall(resolutionPayload, data);
            document.getElementById("hide" + idx).innerHTML = "";
          }
        } else {
          // document.getElementById("hide" + idx).innerHTML = "";
          setIsFormDisabled(false)
        }
      })
    } else {
      if (ele?.name === "NO") {
        Swal.fire({
          title: ele?.popup,
          text: ``,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: `Yes!`,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            const messageObject = {
              from: "user",
              msg: { callAgain: false, description: ele?.name },
            };
            let data = [...resolutionData, messageObject];
            newArray.push(messageObject);
            setResolutionData(newArray);
            resolutionPayload.data.inputType = "MESSAGE";
            resolutionPayload.data.inputValue = ele?.name;
            workflowApiCall(resolutionPayload, data);
            document.getElementById("hide" + idx).innerHTML = "";
          }
        });
      } else {
        Swal.fire({
          title: ele?.popup,
          type: "info",
          //html: '<h1 height="42" width="42">🙂</h1>',
          showCloseButton: true,
          showCancelButton: true,
          focusConfirm: false,
          cancelButtonText: "Cancel",
          confirmButtonText: "Ok",
          confirmButtonAriaLabel: "Thumbs up, great!",
          customClass: {
            cancelButton: 'skel-btn-cancel',
            confirmButton: 'skel-btn-submit mr-2'
          },
          buttonsStyling: false,
          cancelButtonAriaLabel: "Thumbs down",
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) {
            const messageObject = {
              from: "user",
              msg: { callAgain: false, description: ele?.name },
            };
            let data = [...resolutionData, messageObject];
            newArray.push(messageObject);
            setResolutionData(newArray);
            resolutionPayload.data.inputType = "MESSAGE";
            resolutionPayload.data.inputValue = { ...formDetails, description: ele?.name };
            const sType =
              selectedService?.srvcTypeDesc?.description === "Prepaid"
                ? "PT_PREPAID"
                : selectedService?.srvcTypeDesc?.description === "Postpaid"
                  ? "PT_POSTPAID"
                  : "PT_HYBRID";
            if (
              ele?.name === "YES" &&
              (description == "Yes, Process to purchase" ||
                description == "Customer consent")
            ) {
              const list = productArr.filter((x) => x.isSelected === "Y");
              if (list && list?.length === 0) {
                toast.error("Please select Product");
                return;
              }
              const finalList = [];
              for (const prod of list) {
                finalList.push({
                  ...prod,
                  quantity: prod?.quantity,
                  totalNrc: Number(prod?.totalNrc) * Number(prod?.quantity),
                  totalRc: Number(prod?.totalRc) * Number(prod?.quantity),
                });
              }
              let totalRc = 0;
              let totalNrc = 0;
              let servicesData = [];
              finalList.forEach((x) => {
                totalRc = totalRc + Number(x?.totalRc);
                totalNrc = totalNrc + Number(x?.totalNrc);
              });
              servicesData.push({
                totalRc,
                totalNrc,
                total: Number(totalRc) + Number(totalNrc),
                serviceType: [sType],
                serviveUuid: selectedService?.serviceUuid,
              });
              post(`${properties.CUSTOMER_API}/get-customer?limit=1&page=0`, {
                customerUuid: customerData?.customerUuid,
              }).then((resp) => {
                if (resp.data) {
                  if (resp.status === 200) {
                    // workflowApiCall(resolutionPayload, prodData);
                    const { rows } = resp.data;
                    // // console.log('rows[0]-------------->', rows[0])
                    // // console.log('productArr-------------->', productArr)
                    // // console.log('servicesData-------------->', servicesData)
                    history(`/new-customer`, {
                      data: {
                        customerDetails: rows[0],
                        pageIndex: 3,
                        edit: true,
                        servicePopupOpen: true,
                        selectedProductsList: productArr,
                        servicesData,
                      },
                    });
                  }
                }
              }).catch((error) => {
                console.error(error);
              });
            } else if (
              ele?.name === "YES" &&
              description === "Cancel order buttons"
            ) {
              const list = orderId.filter((x) => x.isSelected === "Y");
              if (list && list?.length === 0) {
                toast.error("Please select Order");
                return;
              }

              const messageObject = {
                from: "user",
                msg: { callAgain: false, description: list, type: "Order" },
              };
              let orderData = [...data, messageObject];

              newArray.push(messageObject);

              setResolutionData(newArray);
              const reqBody = {
                inputValue: list,
                conversationUid: workflowPaylod.conversationUid,
              };
              post(`${properties.WORKFLOW_API}/add-conversation`, reqBody)
                .then((resp) => {
                  if (resp.status === 200) {
                    workflowApiCall(resolutionPayload, orderData);
                    document.getElementById("hide" + idx).innerHTML = "";
                  }
                }).catch(error => {
                  // console.log(error)
                })
                .finally();
            } else if (ele?.name === "YES" && description === "BILL_REDIRECT") {
              workflowApiCall(resolutionPayload, data);
              document.getElementById("hide" + idx).innerHTML = "";
            } else if (ele?.name === "YES" && description === "Collect Order") {
              const list = orderId.filter((x) => x.isSelected === "Y");
              if (list && list?.length === 0) {
                toast.error("Please select Order");
                return;
              }
              const messageObject = {
                from: "user",
                msg: { callAgain: false, description: list, type: "Order" },
              };
              let orderData = [...data, messageObject];

              newArray.push(messageObject);

              setResolutionData(newArray);

              resolutionPayload.data.inputType = "MESSAGE";
              resolutionPayload.data.inputValue = "";
              workflowApiCall(resolutionPayload, orderData);
            } else if (ele?.name === "YES" && description === "TAKE_FOLLOWUP") {
              setResolutionPayloadData(resolutionPayload);
              setIsFollowupOpen(true);
            } else {
              workflowApiCall(resolutionPayload, data);
              document.getElementById("hide" + idx).innerHTML = "";
            }
          }
        });
      }
    }
  };

  const handleHelpdeskModal = () => {
    // unstable_batchedUpdates(() => {
    setIsHelpdeskOpen(true);
    // });
  };

  const handleClearResolution = useCallback(() => {
    unstable_batchedUpdates(() => {
      newArray = []
      setResolutionData([])
      setIsFormDisabled(false)
      setSelectedCategory()
      // console.log("idata cleared on handle create resolution")
      setInteractionData({
        interactionResolution: "",
        statement: "",
        statementId: "",
        statementSolution: "",
        interactionType: "",
        interactionCategory: "",
        serviceType: "",
        serviceCategory: "",
        channel: "IVR",
        problemCause: "",
        priorityCode: "",
        contactPreference: [],
        remarks: "",
        switchStatus,
        useCustomerAddress: true,
        markAsInteractionAddress: true,
      })
    })
  }, [])

  useEffect(() => {
    if (!value) {
      unstable_batchedUpdates(() => {
        newArray = []
        setResolutionData([])
        setIsFormDisabled(false)
        // console.log("idata cleared on value change sss")
        setInteractionData({
          interactionResolution: "",
          statement: "",
          statementId: "",
          statementSolution: "",
          interactionType: "",
          interactionCategory: "",
          serviceType: "",
          serviceCategory: "",
          channel: "IVR",
          problemCause: "",
          priorityCode: "",
          contactPreference: "",
          intxnProblemCode: "",
          toRole: "",
          currUser: "",
          remarks: "",
          switchStatus,
          useCustomerAddress: true,
          markAsInteractionAddress: true,
          edoc: props?.location?.state?.data?.helpdeskDetails?.complitionDate ?? "",
          project: props?.location?.state?.data?.helpdeskDetails?.project?.code ?? "",
          severity: props?.location?.state?.data?.helpdeskDetails?.severity?.code ?? ""
        })
      })
    }
  }, [switchStatus, value])

  const handleInteractionModal = (status) => {
    unstable_batchedUpdates(() => {
      setInteractionStatusType(status);
      setPopupType(status)
      setIsInteractionListOpen(!isInteractionListOpen);
      setCurrentPageModal(0);
      setPerPageModal(10);
      setTotalCount(0);
    });
  };

  const getCustomerInteractionDetails = useCallback((status) => {
    try {
      // // console.log('here------->', status)
      if (customerNo && status) {
        get(`${properties.INTERACTION_API}/get-customer-history/${customerNo}?limit=${perPageModal}&page=${currentPageModal}${status ? `&status=${status}` : ""}`)
          .then((response) => {
            if (response?.data) {
              // // console.log('response?.data?.rows------->', response?.data?.rows)
              setInteractionCustomerHistoryDetails(response?.data?.rows);
              setTotalCount(response?.data?.count);
            }
          })
          .catch((error) => {
            console.error(error);
          })
          .finally();
      }
    } catch (error) {
      console.error(error);
    }
  }, [currentPageModal, perPageModal]);

  useEffect(() => {
    getCustomerInteractionDetails(interactionStatusType);
  }, [currentPageModal, getCustomerInteractionDetails, interactionStatusType, perPageModal]);

  const handleOnCloseChannelModal = () => {
    unstable_batchedUpdates(() => {
      setInteractionStatusType('');
      setPopupType('')
      setIsInteractionListOpen(!isInteractionListOpen);
      setCurrentPageModal(0);
      setPerPageModal(10);
      setTotalCount(0);
    });
  };

  const handlePageSelect = (pageNo) => {
    setCurrentPageModal(pageNo);
  };

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
      // console.log(error);
    });
  }

  const handleDeleteTaskRow = (row) => {
    const updatedList = taskList.filter(f => f.taskName !== row.taskName)
    setTaskList(updatedList)
  }

  const handleOnSelectChecked = (e, row) => {
    const { target } = e;
    if (target.checked) {
      const service = serviceList.filter(f => f.serviceNo === row.serviceNo)?.[0]
      setSelectedService(service)
    }
  }

  const handleCellRender = (cell, row) => {
    if (cell.column.Header === "Select") {
      return (
        <div className="custom-control custom-radio">
          <input type="radio"
            id={`selectedService${row?.original?.serviceNo}`}
            name='selectedService'
            className="custom-control-input"
            checked={row?.original?.serviceNo === selectedService?.serviceNo}
            onChange={(e) => {
              handleOnSelectChecked(e, row.original)
              setOpenServiceModal(false);
            }}
          />
          <label className="custom-control-label cursor-pointer" htmlFor={`selectedService${row?.original?.serviceNo}`}></label>
        </div>
      )
    }
    if (cell.column.Header === "Interaction No") {
      return (
        <span classNameName="text-secondary cursor-pointer" onClick={(e) => fetchInteractionDetail(cell.value)}>
          {cell.value}
        </span>
      );
    } else if (cell.column.id === "serviceContactMobile") {
      return (
        <span>
          {customerMobileNo}
        </span>
      );
    } else if (cell.column.id === "serviceContactEmailId") {
      return (
        <span>
          {customerEmailId}
        </span>
      );
    } else if (cell.column.id === "createdAt") {
      return (
        <span>
          {moment(row.original?.createdAt).format("DD-MM-YYYY HH:mm:ss a")}
        </span>
      );
    } else if (cell.column.id === 'taskAction') {
      return (
        <div className="skel-action-btn">
          <div title="Edit" onClick={() => { setShowTaskModal(true); setTaskDetails(row.original); setIsTaskEdit(true); }} className="action-edit"><i className="material-icons">edit</i></div>
          <div title="Delete" onClick={() => handleDeleteTaskRow(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">delete</i></a></div>
        </div>
      )
    } else {
      return <span>{cell.value}</span>;
    }
  };

  const handleOpenMinimalInfo = () => {
    // setOpenMinimalInfo(true);
    const data = {
      data: customerData
    }

    localStorage.setItem('viewConsumer', JSON.stringify(data));

    if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
      localStorage.setItem("customerUuid", customerData.customerUuid)
      localStorage.setItem("customerIds", customerData.customerId)
      localStorage.setItem("customerNo", customerData.customerNo)

      window.open(`${properties.REACT_APP_BASE}/view-customer`, "_blank")
      // history(`/view-customer`, { data })
    } else {
      localStorage.setItem("profileUuid", customerData.profileUuid)
      localStorage.setItem("profileIds", customerData.profileId)
      localStorage.setItem("profileNo", customerData.profileNo)

      window.open(`${properties.REACT_APP_BASE}/view-profile`, "_blank")
      // history(`/view-profile`, { data })
    }

  }

  const handleWithStatement = (e) => {
    const isChecked = e?.target?.value === 'YES';
    unstable_batchedUpdates(() => {
      setIsSmartOpen(isChecked)
      setWithStatement(isChecked);
      setUserResolutionList([])
    })
  }

  const getProblemCode = async () => {
    let problemCodeTypes;
    try {
      const response = await post(`${properties.INTERACTION_API}/lookup`);
      if (response?.status === 200) {
        unstable_batchedUpdates(() => {
          setProblemCodeLookupData(response?.data);
        });
        problemCodeTypes = response?.data;
      }
    } catch (error) {
      console.error(error);
    }
    return problemCodeTypes;
  };


  useEffect(() => {

    // if (withStatement) {
    if (lookupData?.current && !isEmpty(lookupData?.current)) {
      unstable_batchedUpdates(() => {
        setServiceTypeLookup(lookupData?.current?.['SERVICE_TYPE'] ?? []);
        setIntxnCategoryLookup(lookupData?.current?.['INTXN_CATEGORY'] ?? []);
        setServiceCategoryLookup(lookupData?.current?.['PROD_SUB_TYPE'] ?? [])
      })
    }
    // } else {
    // console.log('lookupData?.current?.PROBLEM_CODE----------->', lookupData?.current?.PROBLEM_CODE)
    if (lookupData?.current?.PROBLEM_CODE && Array.isArray(lookupData?.current?.PROBLEM_CODE) && lookupData?.current?.PROBLEM_CODE?.length > 0) {
      // const uniqueIntxnCategoryDesc = Array.from(new Set(lookupData?.current?.PROBLEM_CODE?.map(item => JSON.stringify(item.intxnCategoryDesc)))).map(JSON.parse);
      unstable_batchedUpdates(() => {
        setProblemCodeLookupData(lookupData?.current?.PROBLEM_CODE)
        // setIntxnCategoryLookup(uniqueIntxnCategoryDesc)
      })
      //   } else {
      //     getProblemCode()
      //   }
    }
  }, [withStatement])

  const [workflowLookUp, setWorkflowLookup] = useState([])
  const getWorkFlow = (data) => {
    // console.log("inside getworkflow", data)
    if (data?.serviceCategory
      && data?.serviceType
      && data?.interactionType
      && data?.interactionCategory) {
      const requestBody = {
        serviceType: data?.serviceType,
        serviceCategory: data?.serviceCategory,
        interactionCategory: data?.interactionCategory,
        interactionType: data?.interactionType,
        statementId: data?.statementId
      }
      post(`${properties.WORKFLOW_API}/get-dept-role`, requestBody)
        .then((resp) => {
          if (resp?.data?.workflow?.entities && resp?.data?.workflow?.entities?.length > 0) {
            // let entity = resp?.data?.workflow?.entities.map((unit) => (unit))
            unstable_batchedUpdates(() => {
              let statusArray = resp?.data?.workflow?.entities?.map(node => { return node?.status }).flat()
              let statusLookup = [
                ...new Map(
                  statusArray.map((item) => [item["code"], item])
                ).values(),
              ]
              setWorkflowLookup(resp?.data?.workflow)
              setCurrStatusLookup(statusLookup)
              setInteractionData((preState) => ({
                ...preState,
                ...data,
                serviceType: data?.serviceType,
                serviceCategory: data?.serviceCategory,
                workflowUuid: resp?.data?.workflowUuid ?? '',
                toRole: '',
                toDept: '',
                currUser: ''
              }))
              setRoleLookup([])

              // if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
              //   entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
              //   setInteractionData({
              //     ...interactionData,
              //     workflowUuid: resp?.data?.workflowUuid ?? '',
              //     toRole: entity?.[0]?.roles?.[0].roleId,
              //     toDept: entity?.[0]?.entity?.[0]?.unitId
              //   })
              // } else {
              //   setInteractionData({ ...interactionData, workflowUuid: resp?.data?.workflowUuid ?? '', toRole: '', toDept: '' })
              // }
            })
          }
        }).catch(error => console.error(error))
        .finally()
    } else {
      unstable_batchedUpdates(() => {
        setWorkflowLookup({})
        setCurrStatusLookup([])
        setInteractionData({ ...interactionData, workflowUuid: '', toRole: '', toDept: '', currUser: '' })
        setRoleLookup([])
      })
    }
  }

  const getEdoc = async (data) => {
    let slaDate
    try {
      if (data?.requestId || data?.problemCodeId) {
        const params = data?.requestId ? `?requestId=${data?.requestId}` : data?.problemCodeId ? `?problemCodeMapId=${data?.problemCodeId}` : ''
        slaDate = await get(`${properties.SLA_API}/get-edoc${params}`)
      }
    } catch (error) {

    }

    return slaDate
  }

  const getUsersBasedOnRole = useCallback(() => {
    if ((interactionData?.toRole && interactionData?.toDept)) {
      const data = {
        roleId: interactionData.toRole,
        deptId: interactionData.toDept
      }

      get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
        .then((userResponse) => {
          const { data } = userResponse
          unstable_batchedUpdates(() => {
            const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
            userLookupRef.current = formattedResponse
            setUserLookup(formattedResponse)
            if (isRoleChangedByUserRef.current) {
              if (data?.length === 1) {
                setInteractionData({
                  ...interactionData,
                  currUser: `${data?.[0].userId}`,
                })
              }
            }
          })
        }).catch(error => console.error(error))
        .finally()
    }
  }, [interactionData])

  useEffect(() => {
    if (interactionData?.toRole && !userLookupRef?.current) {
      getUsersBasedOnRole();
    }
  }, [getUsersBasedOnRole, interactionData])

  return (
    <div className="cnt-wrapper">
      <div className="card-skeleton">
        <div className="skel-cr-interaction">
          <div className="form-row">
            <div className="col-lg-3 col-md-12 col-xs-12">
              <div className="cmmn-skeleton mt-2">
                {permission?.components && permission?.components.map((item, k) => (
                  item.componentCode === 'INTXN_WIDGET' && item.accessType === 'allow' && (
                    <div key={k}>
                      <InteractionWidget
                        data={{
                          permission, frequentInteraction, frequentCustomerInteraction, frequentDayInteraction, frequentTenInteraction, appsConfig, email: customerEmailId
                        }}
                        handler={{
                          handleFrequentInteractionChange, handleKnowledgeBaseInteraction, handleClearResolution, setSelectedCategory
                        }}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="col-lg-6 col-md-12 col-xs-12">
              <div className="cmmn-skeleton mt-2">
                {permission?.components && permission?.components.map((item, i) => (item.componentCode === 'REQ_STATEMENT' && item.accessType === 'allow' && (
                  <div key={i}>
                    <RequestStatement
                      data={{ switchStatus, withStatement, appsConfig, isSmartOpen, selectedCategory, isExpanded, value, placeholder, items }}
                      handler={{
                        setValue, flushOlderResponse, handleWithStatement, setServiceMsg, setSwitchStatus, handleClearResolution, setIsExpanded, handleKnowledgeSelect
                        , handleKnowledgeInteractionChange
                      }}
                    />
                    <CreateInteractionForm
                      data={{
                        selectedService, switchStatus, firstTimeResolved, error, intxnTypeLookup, channelLookup, priorityLookup,
                        preferenceLookup, serviceTypeLookup, buttonDisable, serviceCategoryLookup, intxnCategoryLookup, currentFiles,
                        resolutionPayload: workflowPaylod, customerData, multipleServiceData, serviceMsg, appointmentTypes, resolutionData,
                        locations, countries, addressData, addressLookUpRef, addressError, selectedContactPreference, interactionData,
                        isFormDisabled, formDetails, values, lookupData, helpdeskDetails, screenSource, QaUserList, isQAFormEnabled,
                        withStatement, problemCodeLookupData, isSmartOpen, roleLookUp, currStatusLookup, userLookUp, customerAddress,
                        addressList, enableInteractionAddress, slaEdoc, enableTask, userList, taskStatusLookup, taskDetails,
                        taskList, tagsLookup, showTaskModal, isTaskEdit
                      }}
                      handler={{
                        handleInputChange, setInteractionData, setCurrentFiles, handleClear, handleSubmit, workflowApiCall,
                        handleAddProducts, setProductArr, clickToProceed, setOrderId, handleSetOrderId, setWorkflowResponse,
                        handleFrequentInteractionChange, setResolutionData, setAddressData, setAddressLookUpRef, setAddressError,
                        setSelectedContactPreference, setFormDetails, setIsFormDisabled, setValues, setHelpdeskChannel,
                        setAddressList, setEnableInteractionAddress, setEnableTask, setTaskDetails, handleCellRender, setTaskList,
                        setTaskStatusLookup, setShowTaskModal, setIsTaskEdit
                      }}
                    />
                  </div>
                )
                ))}
              </div>
            </div>
            <ConsumerDetailsView
              appsConfig={appsConfig}
              screenSource={screenSource}
              helpdeskDetails={helpdeskDetails}
              handleHelpdeskModal={handleHelpdeskModal}
              customerData={customerData}
              customerUuid={customerUuid}
              customerEmailId={customerEmailId}
              customerMobileNo={customerMobileNo}
              handleOpenMinimalInfo={handleOpenMinimalInfo}
              dtWorksProductType={dtWorksProductType}
              customerNo={customerNo}
              selectedService={selectedService}
              serviceList={serviceList}
              setOpenServiceModal={setOpenServiceModal}
              handleInteractionModal={handleInteractionModal}
              totalInteractionsCount={totalInteractionsCount}
              openInteractionCount={openInteractionCount}
              closedInteractionCount={closedInteractionCount}
              permission={permission}
              userResolutionList={userResolutionList}
            />
          </div>
        </div>
        {/*Interaction */}
      </div>

      <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={openServiceModal} onHide={handleOnModelClose} dialogClassName="cust-lg-modal">
        <Modal.Header>
          <Modal.Title><h5 className="modal-title">Services List</h5></Modal.Title>
          <CloseButton onClick={handleOnModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
          </CloseButton>
        </Modal.Header>
        <Modal.Body>
          <div>
            {serviceList &&
              <DynamicTable listKey={"Interactions"}
                row={serviceList || []}
                rowCount={serviceList.length || 0}
                header={serviceListColumns}
                itemsPerPage={perPageModal}
                isScroll={true}
                backendPaging={false}
                backendCurrentPage={currentPageModal}
                handler={{
                  handleCellRender: handleCellRender,
                  handlePageSelect: handlePageSelect,
                  handleItemPerPage: setPerPageModal,
                  handleCurrentPage: setCurrentPageModal,
                }} />}
            <div className="skel-btn-center-cmmn mt-2 mb-2 w-100">
              <button onClick={(e) => { handleOnModelClose(); handleSubmit(e, 'skip'); }} className="skel-btn-submit">Skip and Proceed</button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {
        isHelpdeskOpen &&
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isHelpdeskOpen} onHide={() => setIsHelpdeskOpen(false)} dialogClassName="cust-lg-modal">
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Helpdesk Details #{helpdeskDetails?.helpdeskNo}</h5></Modal.Title>
            <CloseButton onClick={() => setIsHelpdeskOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <div className="card-body p-0">
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Status</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.status?.description ?? '-'}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Type</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.helpdeskType?.description ?? '-'}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Severity</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.severity?.description ?? "-"}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Project</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.project?.description ?? "-"}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Source</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.helpdeskSource?.description ?? "-"}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Subject</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.helpdeskSubject ?? "-"}
                </div>
              </div>
              <div className="col-12 row pt-2 helpdesk-padding-left-0">
                <div className="col-3 form-label pl-1">Content</div>
                <div className="col-9 form-vtext pl-1">
                  {helpdeskDetails?.helpdeskContent}
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      }
      {
        isInteractionListOpen &&
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isInteractionListOpen} onHide={handleOnCloseChannelModal} dialogClassName="cust-lg-modal">
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Interaction Details for {appsConfig?.clientFacingName?.customer ?? 'Customer'} Number {customerNo}</h5></Modal.Title>
            <CloseButton onClick={handleOnCloseChannelModal} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <div className="">
              <DynamicTable
                listKey={"Interactions"}
                row={interactionCustomerHistoryDetails}
                rowCount={totalCount}
                header={interactionListColumns}
                itemsPerPage={perPageModal}
                isScroll={true}
                backendPaging={["TOTAL", "OPEN", "CLOSED"].includes(popupType)
                  ? true : false}
                backendCurrentPage={currentPageModal}
                handler={{
                  handleCellRender: handleCellRender,
                  handlePageSelect: handlePageSelect,
                  handleItemPerPage: setPerPageModal,
                  handleCurrentPage: setCurrentPageModal,
                }}
              />
            </div>
          </Modal.Body>
        </Modal>
      }
      {
        openMinimalInfo &&
        <Modal isOpen={openMinimalInfo} contentLabel="Customer Minimal Info Modal" style={RegularModalCustomStyles}>
          <div className="modal-center" id="cancelModal" tabIndex="-1" role="dialog" aria-labelledby="cancelModal" aria-hidden="true">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="cancelModal">
                    {appsConfig?.clientFacingName?.customer ?? 'Customer'} Info
                  </h5>
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => setOpenMinimalInfo(false)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="row pt-3">
                    <div className="col-3">
                      <div className="form-group">
                        <label htmlFor="priority" className="col-form-label">
                          {appsConfig?.clientFacingName?.customer ?? 'Customer'} Name
                        </label>
                        <input type="text" className="form-control" value={customerData?.firstName + ' ' + customerData?.lastName} readOnly={true} />
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="form-group">
                        <label htmlFor="priority" className="col-form-label">
                          {appsConfig?.clientFacingName?.customer ?? 'Customer'} Category
                        </label>
                        <input type="text" className="form-control" value={customerData?.customerCatDesc?.description} readOnly={true} />
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="form-group">
                        <label htmlFor="priority" className="col-form-label">
                          {appsConfig?.clientFacingName?.customer ?? 'Customer'} Contact Number
                        </label>
                        <input type="text" className="form-control" value={customerContact.mobilePrefix + ' ' + customerContact.mobileNo} readOnly={true} />
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="form-group">
                        <label htmlFor="priority" className="col-form-label">
                          {appsConfig?.clientFacingName?.customer ?? 'Customer'} Email Id
                        </label>
                        <input type="text" className="form-control" value={customerContact.emailId} readOnly={true} />
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="form-group">
                        <label htmlFor="priority" className="col-form-label">
                          {appsConfig?.clientFacingName?.customer ?? 'Customer'} Contact Preference
                        </label>
                        <Select
                          value={customerData?.contactPreferences?.map((option) => {
                            const matchingPreference = /*notificationLookup*/ preferenceLookup.find((preference) => preference.code === option);
                            return {
                              value: option,
                              label: matchingPreference ? matchingPreference.description : '',
                            };
                          })}
                          options={preferenceLookup.map((preference) => ({
                            value: preference.code,
                            label: preference.description,
                          }))}
                          isMulti={true}
                          menuPortalTarget={document.body}
                          readOnly={true}
                          isDisabled={true}
                        />
                      </div>
                    </div>
                  </div>
                  <AddressDetailsFormView data={{
                    addressData: customerAddress
                  }} />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      }
    </div >
  );
};

export default CreateInteraction;

const serviceListColumns = [
  {
    Header: "Select",
    accessor: "select",
    disableFilters: true,
  },
  {
    Header: "Service Number",
    accessor: "serviceNo",
    disableFilters: true,
  },
  {
    Header: "Product Name",
    accessor: "productDetails.productName",
    disableFilters: true
  },
  {
    Header: "Service Category",
    accessor: "srvcCatDesc.description",
    disableFilters: true
  },
  {
    Header: "Service Type",
    accessor: "srvcTypeDesc.description",
    disableFilters: true
  },
  {
    Header: "Status",
    accessor: "serviceStatus.description",
    disableFilters: true
  },
  {
    Header: "Contact Number",
    accessor: "serviceContactMobile",
    id: "serviceContactMobile",
    disableFilters: true
  },
  {
    Header: "Email",
    accessor: "serviceContactEmailId",
    id: "serviceContactEmailId",
    disableFilters: true
  },
  {
    Header: "Created Date",
    accessor: "createdAt",
    disableFilters: true
  }
]
const interactionListColumns = [
  {
    Header: "Interaction No",
    accessor: "intxnNo",
    disableFilters: true,
  },
  // {
  //   Header: "Remarks",
  //   accessor: "remarks",
  //   disableFilters: true,
  // },
  {
    Header: "Interaction Category",
    accessor: "intxnCategoryDesc.description",
    disableFilters: true
  },
  {
    Header: "Interaction Type",
    accessor: "srType.description",
    disableFilters: true
  },
  {
    Header: "Service Category",
    accessor: "categoryDescription.description",
    disableFilters: true
  },
  {
    Header: "Service Type",
    accessor: "serviceTypeDesc.description",
    disableFilters: true
  },
  {
    Header: "Status",
    accessor: "currStatusDesc.description",
    disableFilters: true
  },
  {
    Header: "Created At",
    accessor: "createdAt",
    disableFilters: true,
  },
];