import React, { useCallback, useEffect, useRef, useState } from 'react'
import { get, post, slowGet, slowPost } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import ResolutionCorner from "../../CommonComponents/ResolutionCorner";
import LeftSidePanel from './LeftSidePanel';
import RequestStatement from './RequestStatement';
import { useComboboxControls } from 'react-datalist-input';
import { unstable_batchedUpdates } from 'react-dom';
import CreateHelpdeskForm from './CreateHelpdeskForm';
import { toast } from 'react-toastify';
import { array, object, string } from 'yup';
import { useNavigate } from 'react-router-dom';
import RightSidePanel from './RigthSidePanel/Index';
import HelpdeskTab from './HelpdeskTab';
import { isEmpty } from 'lodash'
import InteractionTab from './InteractionTab';
import Resolutionimg from "../../../assets/images/resolution-img.svg";
import Swal from 'sweetalert2';
import { statusConstantCode } from '../../../AppConstants';
import moment from 'moment'
import AppointmentForm from '../../CommonComponents/AppointmentForm';
let clone = require("clone")

export default function CreateHelpdeskNew(props) {
  const { appsConfig } = props
  const { consumerNo = '', ivrNo, phoneNo, serviceCategoryLookup, helpdeskTypeLookUp, severityLookUp, projectLookup, serviceTypeLookup,
    parentLookUp, dtWorksProductType, refresh, type, helpdeskStatus,
    rowData
    //helpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
  } = props?.data;
  // console.log('rowData------------>', rowData)
  // console.log({ consumerNo })
  const { setServiceCategoryLookup, setServiceTypeLookup, setSeverityLookUp, setRefresh,
    setHelpdeskTypeLookUp, checkComponentPermission
    //,setHelpdeskCategoryLookup /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
  } = props?.handler;
  const lookupData = useRef({});
  const initialValues = {
    helpdeskSubject: null,
    //helpdeskCategory: null, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
    helpdeskType: null,
    content: null,
    helpdeskSource: ivrNo ? 'CALL_CENTER' : 'WEB_APP',
    mailId: null,
    contactId: null,
    userCategory: null,
    userCategoryValue: null,
    userName: null,
    project: null,
    severity: null,
    serviceCategory: null,
    helpdeskProblemCode: "",
    attachments: [],
    complitionDate: null,
    markAsHelpdeskAddress: true
  };
  const [helpdeskData, setHelpdeskData] = useState(initialValues)
  const [tabType, setTabType] = useState('CreateHelpdesk')
  const [consumerDetails, setConsumerDetails] = useState({})
  const [addressList, setAddressList] = useState([{
    addressType: '',
    address1: '',
    address2: '',
    postcode: '',
    country: '',
    state: '',
    district: '',
    city: ''
  }]);
  const [values, setValues] = useState([]);
  let [workflowResponse, setWorkflowResponse] = useState([]);
  const [switchStatus, setSwitchStatus] = useState(false);
  const [escalate, setEscalate] = useState(false);
  let [serviceMsg, setServiceMsg] = useState();
  const [withStatement, setWithStatement] = useState(true);
  const [items, setItems] = useState([]);
  const [problemCodeLookupData, setProblemCodeLookupData] = useState([]);
  const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
    isExpanded: true,
  });
  const [currentFiles, setCurrentFiles] = useState([])
  const [isSmartOpen, setIsSmartOpen] = useState(true);
  const [error, setError] = useState({});
  const [addressError, setAddressError] = useState({});
  const flushOlderResponse = () => {
    setResolutionData([])
    workflowResponse = [];
    setWorkflowResponse(workflowResponse);
  };
  const [actionCount, setActionCount] = useState(1);
  const [formDetails, setFormDetails] = useState({})
  const [isFormDisabled, setIsFormDisabled] = useState(false)
  const [resolutionPayloadData, setResolutionPayloadData] = useState();
  const [isFollowupOpen, setIsFollowupOpen] = useState(false);
  const [enableHelpdeskAddress, setEnableHelpdeskAddress] = useState(false)
  const [slaEdoc, setslaEdoc] = useState({ complitionDate: '', responseDate: '', responseType: '' })
  const [enableTask, setEnableTask] = useState(false);
  const [taskDetails, setTaskDetails] = useState({})
  const [taskStatusLookup, setTaskStatusLookup] = useState([])
  const [taskList, setTaskList] = useState([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [templateData, setTemplateData] = useState([]);
  const history = useNavigate()
  // console.log('escalate ', escalate)
  const validationSchema = object().shape({
    content: string().required("Remark is required"),
    serviceCategory: string().required("Service category is required"),
    helpdeskType: string().required("Helpdesk type is required"),
    severity: string().required("Severity is required"),
    helpdeskProblemCode: !withStatement ? string().required("Problem Code is required") : string().nullable(true),
    serviceType: !withStatement ? string().required("Service type is required") : string().nullable(true),
    complitionDate: escalate ? string().required("Completion Date is required") : string().nullable(true),
    helpdeskStatus: !escalate ? string().required("Status is required") : string().nullable(true),
    // helpdeskSubject: string().required("Helpdesk Statement is required")
  })
  const AddressValidationSchema = object().shape({
    addressType: string().nullable(false).required("Address Type is required"),
    address1: string().nullable(false).required("Address line one is required"),
    address2: string().nullable(false).required("Address line two is required"),
    postcode: string().nullable(false).required("Post code two is required"),
    country: string().nullable(false).required("Country is required"),
    state: string().nullable(false).required("State is required"),
    district: string().nullable(false).required("District is required"),
    city: string().nullable(false).required("City is required"),
  });
  const [completedTyping, setCompletedTyping] = useState(false)
  const [displayResponse, setDisplayResponse] = useState()
  const [displayMultipleResponse, setDisplayMultipleResponse] = useState()
  let [selectedService, setSelectedService] = useState({});
  let [resolutionData, setResolutionData] = useState([]);
  let [multipleServiceData, setMultipleServiceData] = useState([]);
  const [buttonDisable, setButtonDisable] = useState(false);
  const formRef = useRef(null);
  let newArray = clone(resolutionData);
  const [productArr, setProductArr] = useState([]);
  const [workflowPaylod, setWorkflowPaylod] = useState({
    flowId: "",
    conversationUid: "",
    data: {
      source: "SmartAssistance",
    },
  });
  const [orderId, setOrderId] = useState([]);
  const [helpdeskCount, setHelpdeskCount] = useState({
    total: 0,
    open: 0,
    closed: 0
  })
  const [interactionCount, setInteractionCount] = useState({
    totalInteractionCount: 0,
    openInteraction: 0,
    closedInteraction: 0
  })


  const resetAllFormValues = () => {
    handleClear();
  }

  const getStatement = useCallback(() => {
    slowGet(`${properties.HELPDESK_API}/get-helpdesk-statements`).then((resp) => {
      if (resp?.data?.rows) {
        const arr = resp?.data?.rows?.map((i) => ({
          id: i.helpdeskStatementId, value: i.helpdeskStatement, ...i,
        }))
        unstable_batchedUpdates(() => {
          setItems(arr);
        })
      }
    }).catch((error) => {
      console.error(error);
    });
  }, [])

  useEffect(() => {
    getStatement()
  }, [getStatement]);

  useEffect(() => {
    if (!serviceMsg) {
      return;
    }
    setCompletedTyping(false);
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayResponse(serviceMsg.slice(0, i));
      i++;
      if (i > serviceMsg.length) {
        clearInterval(intervalId);
        setCompletedTyping(true);
      }
    }, 20);
    return () => clearInterval(intervalId);
  }, [serviceMsg]);

  useEffect(() => {
    if (!multipleServiceData?.message) {
      return;
    }
    setCompletedTyping(false);
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayMultipleResponse(multipleServiceData?.message.slice(0, i));
      i++;
      if (i > multipleServiceData?.message.length) {
        clearInterval(intervalId);
        setCompletedTyping(true);
      }
    }, 20);
    return () => clearInterval(intervalId);
  }, [multipleServiceData?.message]);

  const getKnowledgeBase = async (payload) => {
    let consumerId, consumerUuid;
    if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
      consumerId = consumerDetails?.customerId
      consumerUuid = consumerDetails?.customerUuid
    } else {
      consumerId = consumerDetails?.profileId
      consumerUuid = consumerDetails?.profileUuid
    }
    const reqBody = {
      requestId: payload?.requestId,
      consumerUuid: consumerUuid || "",
      consumerId: consumerId || "",
      accountUuid: rowData?.accountUuid,
      serviceUuid: rowData?.serviceUuid,
      serviceType: rowData?.srvcTypeDesc?.code,
      // accountUuid: selectedService?.accountUuid || interaction?.accountUuid,
      // serviceUuid: selectedService?.serviceUuid || interaction?.serviceUuid,
      actionCount: actionCount,
      // helpdeskId: helpdeskDetails?.helpdeskId || "",
      from: statusConstantCode.entityCategory.HELPDESK
    };
    post(`${properties.KNOWLEDGE_API}/get-smartassistance-list`, reqBody).then((resp) => {

      if (resp?.data?.helpdeskStatementId) {
        const intelligenceResponse = resp?.data?.intelligenceResponse;
        if (resp?.data?.resolutionAction?.data?.length > 1) {
          setMultipleServiceData(resp);
        } else {
          // console.log({ switchStatus })
          // console.log(resp);
          if (switchStatus) {
            if (!resp?.data?.conversationUid && !resp?.data?.flwId) {
              // console.log(resp?.message)
              setServiceMsg(resp?.message);
            } else {
              if (resp?.data?.resolutionAction?.data && resp?.data?.resolutionAction?.data?.length === 1) {
                // setSelectedService(resp?.data?.resolutionAction?.data[0]);
              }
              setWorkflowPaylod({
                flowId: resp?.data?.flwId,
                conversationUid: resp?.data?.conversationUid,
                data: {
                  source: "SmartAssistance",
                },
              });
              workflowApiCall({
                flowId: resp?.data?.flwId,
                conversationUid: resp?.data?.conversationUid,
                data: {
                  source: "SmartAssistance",
                  reqBody
                },
              });
            }
          }
          setValue(resp.data.helpdeskStatement);

          console.log("payload", payload);

          let payloadData = {
            ...payload,
            statementId: payload?.helpdeskStatementId ?? resp.data.helpdeskStatementId,
            helpdeskSubject: payload?.helpdeskStatement ?? resp.data.helpdeskStatement,
            serviceCategory: payload?.serviceCategory ?? resp.data.serviceCategory,
            // helpdeskCategory: payload?.helpdeskCategory ?? resp.data.helpdeskCategory, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
            helpdeskType: payload?.helpdeskType ?? resp.data.helpdeskType,
            project: payload?.project ?? null,
            severity: payload?.severity ?? null,
            complitionDate: null,
            responseDate: null,
            appointmentRequired: resp?.data?.isAppointment === 'Y' ? true : false,
          }
          setHelpdeskData({ ...payloadData });

          // if (resp?.data?.userResolution && !isEmpty(resp?.data?.userResolution)) {
          //   setUserResolutionList(resp?.data?.userResolution)
          // }

          // const setData = {
          //   interactionResolution: resp.data.intxnResolutionDesc?.description || "",
          //   statementId: resp.data.helpdeskStatementId || "",
          //   statement: resp.data.helpdeskStatement || "",
          //   statementSolution: resp.data.intxnResolution || "",
          //   problemCause: resp.data.intxnCause || "",
          //   serviceType: resp.data.serviceType || "",
          //   switchStatus,
          //   interactionType: resp.data.intxnType || "",
          //   interactionCategory: resp.data.intxnCategory || "",
          //   serviceCategory: resp.data.serviceCategory || "",
          //   contactPreference: customerData?.contactPreferences,
          //   intelligenceResponse: intelligenceResponse,
          //   appointmentRequired: resp?.data?.isAppointment === 'Y' ? true : false,
          //   priorityCode: resp?.data?.priorityCode,
          //   project: interaction?.project || interactionData?.project || "",
          //   severity: interaction?.severity || interactionData?.severity || "",
          //   edoc: interaction?.edoc || interactionData?.edoc || ""
          // }
          // console.log(3)
          // setInteractionData({
          //   ...interactionData,
          //   ...setData
          // });
          // setError({
          //   ...error,
          //   statementId: "",
          //   statement: "",
          //   statementSolution: "",
          //   problemCause: "",
          //   serviceType: "",
          //   interactionType: "",
          //   interactionCategory: "",
          //   serviceCategory: "",
          // });
          // getWorkFlow(setData)
        }
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  const handleKnowledgeSelect = async (item) => {
    console.log('item----------->', item)
    resolutionData = [];
    selectedService = {};
    setResolutionData([]);
    newArray = []
    setServiceMsg();
    setIsFormDisabled(false)
    setFormDetails([])
    setValues([])
    // setslaEdoc({ complitionDate: '', responseDate: '', responseType: '' })
    let customerName = `${consumerDetails?.firstName ?? ''} ${consumerDetails?.lastName ?? ''}`?.trim();
    let contact = consumerDetails?.profileContact?.find(x => x.isPrimary);

    let payload = {
      ...helpdeskData,
      statementId: item?.helpdeskStatementId,
      helpdeskSubject: item?.helpdeskStatement ?? '',
      serviceCategory: item?.serviceCategory ?? '',
      // helpdeskCategory: item?.helpdeskCategory ?? '', /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
      helpdeskType: item?.helpdeskType ?? '',
      mailId: contact?.emailId,
      phoneNo: contact?.mobileNo,
      contactId: contact?.contactId ?? null,
      userCategory: contact?.contactCategory?.code ?? null,
      userCategoryValue: contact?.contactCategoryValue ?? null,
      userName: customerName,
      project: item?.project ?? null,
      severity: item?.severity ?? null,
      requestCode: item?.mappingPayload?.request_code?.[0] ?? ''
      // priority: item.priority ?? null,
    }

    // console.log("payload--------->", payload);

    setHelpdeskData({ ...payload });
    setError({ ...error, project: "", severity: "", helpdeskType: "", helpdeskSubject: '' })
    // if (item.triggerType == "A") {
    setServiceMsg("");
    setDisplayResponse("");
    await getKnowledgeBase({ ...payload, requestId: payload?.statementId ?? null });
    // }
  }
  const handleWithStatement = (e) => {
    const isChecked = e?.target?.value === 'YES';
    unstable_batchedUpdates(() => {
      setIsSmartOpen(isChecked)
      setWithStatement(isChecked);
    })
  }
  const handleClear = () => {
    unstable_batchedUpdates(() => {
      setHelpdeskData(initialValues)
      setEscalate(false)
      setCurrentFiles([])
      setValue('')
      setslaEdoc({ complitionDate: '', responseDate: '', responseType: '' })
      setEnableHelpdeskAddress(false)
      setTaskList([])
    })
  }
  const validate = (schema, data, type) => {
    try {
      if (type === 'HELPDESK') {
        setError({});

      } else if (type === 'ADDRESS') {
        setAddressError({});

      }
      schema.validateSync(data, { abortEarly: false });
    } catch (e) {
      e.inner.forEach((err) => {
        if (type === 'HELPDESK') {
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
  }
  const handleSubmit = () => {
    helpdeskData.complitionDate = (slaEdoc.complitionDate ? slaEdoc.complitionDate : helpdeskData?.complitionDate) ?? null
    helpdeskData.responseDate = (slaEdoc.responseDate ? slaEdoc.responseDate : helpdeskData?.complitionDate) ?? null

    delete helpdeskData.requestCode
    // helpdeskData?.requestCode && delete helpdeskData.requestCode
    if (!consumerNo) {
      toast.warn('No Profile Details selected for Create Helpdesk')
      return false
    }
    let error = validate(validationSchema, helpdeskData, 'HELPDESK');
    if (error) {
      toast.error("Validation errors found. Please check all fields");
      return false
    }

    if (enableHelpdeskAddress) {
      const addErr = validate(AddressValidationSchema, addressList[0], 'ADDRESS')

      if (addErr) {
        toast.error("Validation Errors Found. Please provide address details")
        return;
      }
    }

    let contact

    if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
      contact = consumerDetails?.customerContact?.find(x => x.isPrimary);
      // consumerNo = consumerDetails?.customerNo 
    } else {
      contact = consumerDetails?.profileContact?.find(x => x.isPrimary);
      // consumerNo = consumerDetails?.profileNo     
    }

    let customerName = `${consumerDetails?.firstName ?? ''} ${consumerDetails?.lastName ?? ''}`?.trim();


    const requestBody = {
      ...helpdeskData,
      helpdeskSource: ivrNo ? 'CALL_CENTER' : 'WEB_APP',
      mailId: contact?.emailId,
      phoneNo: contact?.mobileNo ? contact?.mobileNo : phoneNo || null,
      contactId: contact?.contactId ?? null,
      userCategory: contact?.contactCategory?.code ?? null,
      userCategoryValue: (contact?.contactCategoryValue ? contact?.contactCategoryValue : consumerNo) || null,
      userName: customerName,
      helpdeskSubject: helpdeskData?.helpdeskSubject,
      ivrNo: ivrNo ?? null,
      attachments: [...currentFiles.map((current) => current.entityId)].length > 0
        ? [...currentFiles.map((current) => current.entityId)]
        : [],
      accountUuid: rowData?.accountUuid,
      serviceUuid: rowData?.serviceUuid,
    }

    if (enableHelpdeskAddress && addressList && addressList.length > 0 && Object.keys(addressList[0]).length) {
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
      requestBody.helpdeskAddress = addressData
    }


    if (requestBody?.serviceCategory) {
      delete requestBody?.serviceCategoryDesc
      delete requestBody?.serviceCategory
    }
    if (requestBody?.helpdeskProblemCode) {
      requestBody.helpdeskSubject = problemCodeLookupData.filter((val) => val.code === requestBody?.helpdeskProblemCode)?.[0]?.description
    }
    if (escalate && !switchStatus) {
      requestBody.escalate = escalate
      requestBody.profileId = Number(consumerDetails?.profileId)
      requestBody.complitionDate = helpdeskData.complitionDate
      delete requestBody?.helpdeskStatus
    }
    delete requestBody?.markAsHelpdeskAddress
    requestBody?.requestId && delete requestBody?.requestId
    if (taskList.length > 0) {
      requestBody.taskList = taskList.map((val) => {
        if (val.attachments && val.attachments.length > 0) {
          val.attachments = val.attachments.map((val) => val.entityId)
        }
        return val
      })
    }
    delete requestBody?.appointmentRequired
    delete requestBody?.appointmentType
    delete requestBody?.appointmentBranch
    delete requestBody?.appointmentDate
    
    console.log('requestBody', requestBody)
    // return false
    post(`${properties.HELPDESK_API}/create`, requestBody).then((response) => {
      const { message, data } = response;
      if (data?.helpdeskNo) {
        handleClear()
        setRefresh(!refresh)
        toast.success(message);
        // if (!ivrNo) {
        //   history.goBack();
        // }
      } else {
        toast.error(message);
      }
    }).catch(error => {
      console.error(error);
    });
  }
  const handleOnChange = (e) => {
    const { target } = e;
    let id = target.id, value = target.value
    unstable_batchedUpdates(() => {
      if (target.id === 'serviceCategory') {
        setHelpdeskData({
          ...helpdeskData,
          [target.id]: target.value,
          serviceCategoryDesc: JSON.parse(target?.options[target.selectedIndex]?.dataset?.entity)?.description ?? ''
        })
      }
      else if (target.id === 'serviceType') {
        if (withStatement) {

          const serviceCategory = parentLookUp.current["SERVICE_TYPE"] && parentLookUp.current["SERVICE_TYPE"].filter((e) => {
            let isTrue = false;
            if (e && e.code === value) {
              isTrue = true;
            }
            return isTrue;
          });
          unstable_batchedUpdates(() => {
            setHelpdeskData({ ...helpdeskData, [id]: value, serviceCategory: serviceCategory?.[0].mapping?.prodSubType?.[0] });
          });
        } else {
          const lookup = lookupData?.current?.PROBLEM_CODE?.filter((ele) => ele?.serviceType === value)
          const serviceCategoryTypes = Array.from(new Set(lookup?.map(item => JSON.stringify(item?.serviceCategoryDesc))))?.map(JSON.parse);
          const problemCodes = lookupData?.current?.PROBLEM_CODE?.filter((ele) => ele?.serviceType === value && ele?.serviceCategory === serviceCategoryTypes?.[0]?.code)
          const problemCodesData = Array.from(new Set(problemCodes?.map(item => JSON.stringify(item?.problemCodeDesc))))?.map(JSON.parse);
          // getWorkFlow({ serviceCategory: serviceCategoryTypes?.[0]?.code, serviceType: value, intxnType: interactionData?.interactionType, intxnCategory: interactionData?.interactionCategory })
          unstable_batchedUpdates(() => {
            setHelpdeskData({ ...helpdeskData, [id]: value, serviceCategory: serviceCategoryTypes?.[0]?.code });
            setProblemCodeLookupData(problemCodesData)
          })
        }
      } else {
        setHelpdeskData({
          ...helpdeskData,
          [target.id]: target.value
        })
      }
      setError({ ...error, [target.id]: '' })
    })
  }
  const handleFrequentHelpdeskChange = (item) => {
    try {
      resolutionData = [];
      selectedService = {};
      setResolutionData([]);
      newArray = []
      if (!item.helpdeskSubject || !withStatement) return;
      post(`${properties.HELPDESK_API}/get-helpdesk-statements`, {
        helpdeskStatement: item.helpdeskSubject
      }).then((resp) => {
        let { data } = resp;
        if (data && data?.rows?.length > 0) {
          unstable_batchedUpdates(() => {
            handleKnowledgeSelect(data?.rows?.[0])
            setValue(item.helpdeskSubject)
          })
        } else {
          unstable_batchedUpdates(() => {
            handleKnowledgeSelect(initialValues)
            setValue('')
          })
        }
      }).catch((error) => {
        console.error(error);
      });
    } catch (e) {
      console.log('error', e)
    }
  }
  const handleStatementOnChange = (e) => {
    // try {
    //   console.log(e.target,items)
    //   let { target } = e
    //   const statement = items.find(
    //     (x) => x.value?.toLowerCase()?.includes(target?.value?.toLowerCase())
    //   );
    //   console.log('statement', statement)
    // } catch (e) {
    //   console.log('error', e)
    // }
  }
  const getProblemCode = useCallback(() => {
    post(`${properties.HELPDESK_API}/lookup`)
      .then((response) => {
        if (response?.status === 200) {
          const uniqueIntxnCategoryDesc = Array.from(new Set(response?.data?.map(item => JSON.stringify(item.serviceTypeDesc)))).map(JSON.parse);
          unstable_batchedUpdates(() => {
            lookupData.current.PROBLEM_CODE = response?.data
            setServiceTypeLookup(uniqueIntxnCategoryDesc)
          })
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }, [setServiceTypeLookup])

  useEffect(() => {

    if (withStatement) {
      if (lookupData?.current && !isEmpty(lookupData?.current)) {
        unstable_batchedUpdates(() => {
          setServiceCategoryLookup(lookupData?.current?.['PROD_SUB_TYPE'] ?? [])
        })
      }
    } else {
      if (lookupData?.current?.PROBLEM_CODE && Array.isArray(lookupData?.current?.PROBLEM_CODE) && lookupData?.current?.PROBLEM_CODE?.length > 0) {
        const uniqueIntxnCategoryDesc = Array.from(new Set(lookupData?.current?.PROBLEM_CODE?.map(item => JSON.stringify(item.serviceTypeDesc)))).map(JSON.parse);
        unstable_batchedUpdates(() => {
          setServiceTypeLookup(uniqueIntxnCategoryDesc)
        })
      } else {
        getProblemCode()
      }
    }
  }, [getProblemCode, setServiceCategoryLookup, setServiceTypeLookup, withStatement])

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
          if (!description || description === null || description === "") {
            toast.error("Please Fill the Form");
          } else if (typeof (description) === 'object' && Object.keys(description)?.length < 2) {
            toast.error("Please Fill the Form");
            return
          } else {
            resolutionPayload.data.inputType = "FORMDATA";
            resolutionPayload.data.inputValue = description;
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
                customerUuid: consumerDetails?.customerUuid,
              }).then((resp) => {
                if (resp.data) {
                  if (resp.status === 200) {
                    // workflowApiCall(resolutionPayload, prodData);
                    const { rows } = resp.data;
                    // // console.log('rows[0]-------------->', rows[0])
                    // // console.log('productArr-------------->', productArr)
                    // // console.log('servicesData-------------->', servicesData)
                    history(`/new-customer`, {
                      state: {
                        data: {
                          customerDetails: rows[0],
                          pageIndex: 3,
                          edit: true,
                          servicePopupOpen: true,
                          selectedProductsList: productArr,
                          servicesData,
                        }
                      }
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

  const handleClearResolution = useCallback(() => {

    unstable_batchedUpdates(() => {
      newArray = []
      setResolutionData([])
      setIsFormDisabled(false)
      setHelpdeskData(initialValues)
    })
  }, [])

  const getEdoc = useCallback((data) => {
    if (data?.helpdeskType && data?.helpdeskSource && data?.severity) {
      const params = `?helpdeskType=${data?.helpdeskType}&channel=${data?.helpdeskSource}&severity=${data?.severity}`
      return get(`${properties.SLA_API}/get-edoc${params}`).then((resp) => {
        if (resp?.status === 200 && !isEmpty(resp?.data)) {
          const { oResolutionDate, oResponseDate, oResponseType } = resp.data;
          const formattedEdoc = { complitionDate: oResolutionDate ? oResolutionDate : null, responseDate: oResponseDate ? oResponseDate : null, responseType: oResponseType }
          setslaEdoc({ ...formattedEdoc })
          return formattedEdoc;
        } else {
          setslaEdoc({ complitionDate: '', responseDate: '', responseType: '' })
          return { complitionDate: '', responseDate: '', responseType: '' }
        }
      }).catch(error => {
        console.error(error);
        return {};
      });
    }
    return;
  }, []);

  useEffect(() => {
    // console.log('helpdeskData', helpdeskData.helpdeskType, helpdeskData?.helpdeskSource, helpdeskData?.severity)
    if (helpdeskData?.helpdeskType && helpdeskData?.helpdeskSource && helpdeskData?.severity) {
      getEdoc({ helpdeskType: helpdeskData?.helpdeskType ?? '', helpdeskSource: helpdeskData?.helpdeskSource ?? '', severity: helpdeskData?.severity ?? '' })
        .then((response) => {
          setHelpdeskData({ ...helpdeskData, complitionDate: response?.complitionDate ?? null, responseDate: response?.responseDate ?? null });
        })
        .catch(error => console.error(error));

      // Get Appointment Template 
      const reqBody = {
        mapCategory: statusConstantCode.common.HELPDESK,
        serviceCategory: 'PST_00000002' ?? helpdeskData?.serviceCategory,
        serviceType: 'SVC_TYPE00000015',
        customerCategory: 'BUS',
        tranType: 'CLARIFICATION' ?? helpdeskData?.helpdeskType,
        tranCategory: 'HELPDESK',
        tranPriority: 'SEVE00000001' ?? helpdeskData?.severity,
      };
      console.log("reqBody", reqBody, consumerDetails, helpdeskData)
      post(properties.MASTER_API + "/interaction-template", {
        ...reqBody,
      }).then((resp) => {
        console.log('resp', resp)
        if (resp?.status === 200) {
          setTemplateData(resp.data);
          setHelpdeskData({
            ...helpdeskData,
            rosterId:
              resp?.data?.mappedTemplate?.appointmentHdr?.[0]?.rosterId || null,
          });
        }
      }).catch(error => console.log(error));
    }
    
  }, [helpdeskData?.helpdeskType, helpdeskData?.helpdeskSource, helpdeskData?.severity, getEdoc]);

  return (
    <div className="cnt-wrapper">
      <div className="form-row">
        <div className="col-lg-3 col-md-12 col-xs-12">
          {/* Right Side */}
          <LeftSidePanel appsConfig={appsConfig} data={{ consumerNo, consumerDetails, dtWorksProductType, refresh, type, helpdeskCount, interactionCount, rowData }} handler={{ setConsumerDetails, setRefresh, setHelpdeskCount, setInteractionCount }} />
        </div>
        <div className="col-lg-9 col-md-12 col-xs-12">
          <div className="" id="list-wrapper">
            <div className="wrapper1">
              <ul
                className="nav nav-tabs"
                id="list"
                role="tablist"
              >

                <li className="nav-item pl-0">
                  <a className={`nav-link  ${tabType === "CreateHelpdesk" ? "active" : ""}`}
                    id='create-helpdesk'
                    data-toggle="tab"
                    href="#create-helpdesk"
                    role="tab"
                    aria-controls="create-helpdesk"
                    aria-selected="true"
                    onClick={(evnt) => {
                      setTabType("CreateHelpdesk");
                    }}
                  >
                    Create Helpdesk
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link  ${tabType === "Helpdesk" ? "active" : ""}`}
                    id='helpdesk'
                    data-toggle="tab"
                    href="#helpdesk"
                    role="tab"
                    aria-controls="helpdesk"
                    aria-selected="true"
                    onClick={(evnt) => {
                      setTabType("Helpdesk");
                    }}
                  >
                    Helpdesk <span className='badge badge-primary border-0 px-2 py-1 text-12'>{helpdeskCount?.total ?? 0}</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a className={`nav-link  ${tabType === "Interaction" ? "active" : ""}`}
                    id='Interaction'
                    data-toggle="tab"
                    href="#Interaction"
                    role="tab"
                    aria-controls="Interaction"
                    aria-selected="true"
                    onClick={(evnt) => {
                      setTabType("Interaction");
                    }}
                  >
                    Interaction <span className='badge badge-warning border-0 px-2 py-1 text-12'>{interactionCount?.totalInteractionCount ?? 0}</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="tab-content">
            <div
              className={`tab-pane fade ${tabType === "CreateHelpdesk" ? "show active" : ""
                }`}
              id="create-helpdesk"
              role="tabpanel"
              aria-labelledby="create-helpdesk"
            >
              <div className="card-skeleton">
                <div className="skel-cr-interaction">
                  <div className="form-row">
                    <div className="col-lg-8 col-md-12 col-xs-12">
                      <div className="cmmn-skeleton mt-1">
                        {checkComponentPermission('REQ_STATEMENT') && <RequestStatement
                          data={{ switchStatus, value, withStatement, isExpanded, items, isSmartOpen }}
                          handler={{ setValues, setValue, flushOlderResponse, setSwitchStatus, setServiceMsg, setIsExpanded, setIsSmartOpen, handleWithStatement, handleOnChange, handleKnowledgeSelect, handleClear, handleStatementOnChange, resetAllFormValues, handleClearResolution, checkComponentPermission }}
                        />}
                        {!switchStatus && <CreateHelpdeskForm
                          data={{
                            helpdeskData,
                            consumerDetails,
                            error,
                            readOnly: !!!consumerNo,
                            smartAssistance: isSmartOpen,
                            currentFiles,
                            ivrNo,
                            serviceCategoryLookup,
                            // helpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                            helpdeskTypeLookUp,
                            severityLookUp,
                            projectLookup,
                            serviceTypeLookup,
                            withStatement,
                            problemCodeLookupData,
                            switchStatus,
                            escalate,
                            helpdeskStatus,
                            addressList,
                            enableHelpdeskAddress,
                            dtWorksProductType,
                            addressError,
                            slaEdoc,
                            enableTask,
                            taskStatusLookup,
                            taskDetails,
                            taskList,
                            showTaskModal,
                            refresh
                          }}
                          lookups={{}}
                          stateHandler={{
                            setHelpdeskData,
                            handleClear,
                            handleSubmit,
                            setError,
                            setCurrentFiles,
                            handleOnChange,
                            setServiceCategoryLookup,
                            // setHelpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                            setServiceTypeLookup,
                            setHelpdeskTypeLookUp,
                            setSeverityLookUp,
                            setEscalate,
                            checkComponentPermission,
                            setAddressList,
                            setEnableHelpdeskAddress,
                            setAddressError,
                            setEnableTask,
                            setTaskDetails,
                            setTaskList,
                            setTaskStatusLookup,
                            setShowTaskModal
                          }}
                        />}
                        {switchStatus && <>
                          <div className="st-solutions">
                            {!serviceMsg && resolutionData?.length !== 0 && <span className="skel-res-corner-title">Resolution Corner</span>}
                            {!serviceMsg && resolutionData?.length === 0 && multipleServiceData?.length === 0 && <div className="skel-no-resolution-corner">
                              <h4 className="skel-no-resolution">
                                Your Smart Assistance is ready to solve your solutions.
                                <span>Try searching one of your problem statement to see the resolutions!</span>
                              </h4>
                              <img src={Resolutionimg} className="img-fluid" alt="" />
                            </div>}

                            {serviceMsg && <span> {displayResponse}</span>}
                            {multipleServiceData &&
                              multipleServiceData?.data?.resolutionAction?.data?.length >
                              1 && (
                                <div>
                                  <span>{displayMultipleResponse} </span>
                                  {multipleServiceData && completedTyping && multipleServiceData?.data?.resolutionAction?.data?.length > 1 &&
                                    multipleServiceData?.data?.resolutionAction?.data?.map(
                                      (value, i) => {
                                        return (
                                          <div className="skel-res-radio-list" key={i}>
                                            <label>
                                              <input
                                                type="radio"
                                                name={value.serviceUuid}
                                                value={value}
                                              // onChange={(e) => {
                                              //   handleFrequentInteractionChange(
                                              //     value,
                                              //     "frequent"
                                              //   );
                                              // }}
                                              />
                                              <span>{value?.serviceNo} - {value?.serviceName}</span>
                                            </label>
                                          </div>
                                        );
                                      }
                                    )}
                                </div>
                              )}
                            {/* {console.log('consumerDetails------->', consumerDetails)} */}
                            {resolutionData &&
                              resolutionData.length > 0 &&
                              resolutionData.map((val, idx) => (
                                <div key={idx}>
                                  <ResolutionCorner
                                    data={{
                                      val,
                                      idx,
                                      consumerData: consumerDetails,
                                      resolutionPayload: workflowPaylod,
                                      selectedService,
                                      buttonDisable,
                                      resolutionData,
                                      formRef,
                                      formDetails,
                                      isFormDisabled,
                                      values,
                                      lookupData
                                    }}
                                    handler={{
                                      setResolutionData,
                                      setProductArr,
                                      handleSetOrderId,
                                      setOrderId,
                                      clickToProceed,
                                      workflowApiCall,
                                      setWorkflowResponse,
                                      setFormDetails,
                                      setIsFormDisabled,
                                      setValues,
                                      setValue,
                                      flushOlderResponse,
                                      setServiceMsg,
                                      setSwitchStatus
                                    }}
                                  />
                                </div>
                              ))}
                          </div>
                        </>}
                        {helpdeskData?.appointmentRequired && <AppointmentForm data={{ error, state: helpdeskData, templateData, addressData: addressList }} handler={{ setState: setHelpdeskData, handleSubmit, handleClear }} />}
                      </div>
                    </div>
                    <div className="col-lg-4 col-md-12 col-xs-12">
                      <div className="cmmn-skeleton mt-1">
                        <RightSidePanel
                          data={{
                            consumerNo,
                            refresh
                          }}
                          handler={{
                            handleFrequentHelpdeskChange
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`tab-pane fade ${tabType === "Helpdesk" ? "show active" : ""
                }`}
              id="helpdesk"
              role="tabpanel"
              aria-labelledby="helpdesk"
            >
              {tabType === 'Helpdesk' && <HelpdeskTab consumerNo={consumerNo} />}
            </div>
            <div
              className={`tab-pane fade ${tabType === "Interaction" ? "show active" : ""
                }`}
              id="Interaction"
              role="tabpanel"
              aria-labelledby="Interaction"
            >
              {tabType === 'Interaction' && <InteractionTab consumerNo={consumerNo} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
