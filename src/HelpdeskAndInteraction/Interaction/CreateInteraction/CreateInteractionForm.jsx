import React, { useEffect, useState, useRef, useMemo, useContext, useCallback } from "react";
import FileUpload from "../../../common/uploadAttachment/fileUpload";
import Swal from "sweetalert2";
import ResolutionCorner from "../../CommonComponents/ResolutionCorner";
import CalendarComponent from "../../../common/CalendarComponent";
import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import Select from "react-select";
import moment from "moment";
import ReactSwitch from "react-switch";
import CustomerAddressForm from "../../../CRM/Address/CustomerAddressForm";
import { toast } from "react-toastify";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import AddressMap from "../../../CRM/Address/AddressMap";
import CursorSVG from '../../CommonComponents/CursorSVG'
import { unstable_batchedUpdates } from "react-dom";
import { statusConstantCode } from "../../../AppConstants";
import { AppContext } from "../../../AppContext";
import Resolutionimg from "../../../assets/images/resolution-img.svg";
// import Scanimg from "../../../assets/images/main-qimg-833c55a3dd50cfa33fd7795809828a4e-lq2.jpeg";
// import Uploadimg from "../../../assets/images/upload.svg";
import HelpdeskDetails from "../../Helpdesk/HelpdeskDetails";
import AddressComponent from "../../Helpdesk/AddressComponent";
import { isEmpty } from "lodash";
import DynamicTable from "../../../common/table/DynamicTable";
import AddEditTask from "../../CommonComponents/AddEditTask";
import { CloseButton, Modal } from "react-bootstrap";


const CreateInteractionForm = (props) => {
  const { appConfig, auth } = useContext(AppContext);
  const {
    selectedService,
    switchStatus,
    firstTimeResolved,
    error,
    intxnTypeLookup,
    channelLookup,
    priorityLookup,
    preferenceLookup,
    serviceTypeLookup,
    buttonDisable,
    serviceCategoryLookup,
    intxnCategoryLookup,
    currentFiles,
    resolutionPayload,
    customerData,
    multipleServiceData,
    serviceMsg,
    appointmentTypes,
    resolutionData,
    locations,
    countries,
    addressData,
    addressLookUpRef,
    addressError,
    selectedContactPreference,
    interactionData,
    isFormDisabled,
    formDetails,
    values,
    lookupData,
    helpdeskDetails,
    screenSource,
    QaUserList,
    isQAFormEnabled,
    withStatement,
    problemCodeLookupData,
    isSmartOpen,
    roleLookUp,
    currStatusLookup,
    userLookUp,
    customerAddress,
    addressList,
    enableInteractionAddress,
    slaEdoc,
    enableTask,
    userList,
    taskStatusLookup,
    taskDetails,
    taskList,
    tagsLookup,
    showTaskModal,
    isTaskEdit
  } = props.data;

  const preferenceOptions = preferenceLookup.map((preference) => {
    return {
      value: preference.code,
      label: preference.description,
    };
  });

  const {
    handleInputChange,
    // setAutoCreateInteraction,
    setInteractionData,
    setCurrentFiles,
    handleClear,
    handleSubmit,
    workflowApiCall,
    handleAddProducts,
    setProductArr,
    clickToProceed,
    setOrderId,
    handleSetOrderId,
    setWorkflowResponse,
    handleFrequentInteractionChange,
    setResolutionData,
    setAddressData,
    setAddressLookUpRef,
    setAddressError,
    setSelectedContactPreference,
    setFormDetails,
    setIsFormDisabled,
    setValues,
    setHelpdeskChannel,
    setAddressList,
    setEnableInteractionAddress,
    setEnableTask,
    setTaskDetails,
    handleCellRender,
    setTaskList,
    setTaskStatusLookup,
    setShowTaskModal,
    setIsTaskEdit
  } = props.handler;

  const [events, setEvents] = useState([]);
  const calendarRef = useRef();
  const [severities, setSeverities] = useState([])
  const [weekends] = useState(true);
  const [initialView] = useState("dayGridMonth");
  const [templateData, setTemplateData] = useState([]);
  // const [interactionData, setInteractionData] = useState([]);
  const [availableAppointments, setAvailableAppointments] = useState([]);

  // const [viewUploadDetails, setViewUploadDetails] = useState(1);
  // const [viewUploadDetails1, setViewUploadDetails1] = useState(2);

  const intelligenceResponse = interactionData?.intelligenceResponse;
  const [projectLookup, setProjectLookup] = useState([]);

  const formRef = useRef(null);
  const sigPad = useRef({});
  let toastId = useRef(null);
  const helpdeskChannelValue = useRef();

  useEffect(() => {
    if (Array.isArray(channelLookup) && channelLookup.length > 0) {
      const channelLookupDesc = channelLookup.map(e => e.description.toLowerCase())
      // console.log("Channel lookup desc =>", channelLookupDesc);
      if (channelLookupDesc.includes(helpdeskDetails?.helpdeskSource?.description.toLowerCase())) {
        let index = channelLookupDesc.indexOf(helpdeskDetails?.helpdeskSource?.description.toLowerCase())
        helpdeskChannelValue.current = channelLookup[index].code;
        setHelpdeskChannel(channelLookup[index].code)
      }
    }

    if (Array.isArray(customerData?.contactPreferences) && customerData?.contactPreferences.length > 0) {
      setSelectedContactPreference(customerData?.contactPreferences?.map((option) => {
        const matchingPreference = preferenceLookup.find((preference) => preference.code === option);
        return {
          value: option,
          label: matchingPreference ? matchingPreference.description : '',
        };
      }))
      // setSelectedContactPreference(helpdeskContactPreferenceValue)
    }

  }, [customerData, channelLookup])

  useEffect(() => {
    get(properties.BUSINESS_ENTITY_API + `?searchParam=code_type&valueParam=${statusConstantCode.businessEntity.PROJECT},${statusConstantCode.businessEntity.SEVERITY}`)
      .then((resp) => {
        if (resp?.data) {
          let projectss = resp.data.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId));
          let currProjects = []
          if (customerData?.projectMapping?.length > 0) {
            let currentDeptProject = customerData?.projectMapping?.filter((f) => f?.entity === auth?.currDeptId)
            currProjects = projectss?.filter((f) => currentDeptProject?.[0]?.project.includes(f?.code))
          }
          // const cond = projectss?.filter((ele) => ele?.code === helpdeskDetails?.project?.code);
          // if (cond?.length <= 0) {
          //   projectss = projectss?.map((ele) => {
          //     return { ...ele, code: helpdeskDetails?.project?.code, description: helpdeskDetails?.project?.description }
          //   })
          // }


          unstable_batchedUpdates(() => {
            setProjectLookup(currProjects?.length > 0 ? currProjects : projectss);
            setSeverities(resp.data?.SEVERITY)
          })
        }
      }).finally();
  }, [helpdeskDetails, channelLookup])

  const memoizedEventsFn = useMemo(() => {
    return events.map((x) => ({
      ...x,
      start: new Date(x.start),
      end: new Date(x.end),
    }));
  }, [events]);

  const [isActiveTab, setIsActiveTab] = useState("");
  const [latitude, setLatitude] = useState();
  const [longitude, setLongitude] = useState();
  const [addressString, setAddressString] = useState("");

  const fetchCountryList = (input, data = undefined, pageIndex = undefined) => {
    get(properties.ADDRESS_LOOKUP_API + "?country=" + input)
      .then((resp) => {
        if (resp && resp.data) {
          setAddressLookUpRef(resp.data);
          if (data) {
            const addressData = resp.data.find(
              (x) => x.postCode === data?.postcode
            );
            setAddressData({
              ...addressData,
              latitude: data?.latitude,
              longitude: data?.longitude,
              address1: data?.address1 || "",
              address2: data?.address2 || "",
              address3: data?.address3 || "",
              postcode: addressData?.postCode || "",
              state: addressData?.state || "",
              district: addressData?.district || "",
              city: addressData?.city || "",
              country: addressData?.country || "",
              countryCode: data?.countryCode || "",
            });
          }
        }
      })
      .catch(error => console.log(error)).finally();
  };

  // useEffect(() => {
  //   if (Array.isArray(intelligenceResponse?.data)) {
  //     setAutoCreateInteraction(false);
  //   } else if (intelligenceResponse?.data) {
  //     setAutoCreateInteraction(true);
  //   }
  // }, [intelligenceResponse?.data]);

  useEffect(() => {

    if (typeof customerData === "object" && customerData !== null) {
      if (
        interactionData.priorityCode &&
        interactionData.serviceCategory &&
        interactionData.serviceType &&
        interactionData.interactionType &&
        // interactionData.intxnProblemCode &&
        interactionData.priorityCode
      ) {
        const reqBody = {
          mapCategory: statusConstantCode.common.INTERACTION,
          serviceCategory: interactionData?.serviceCategory,
          serviceType: interactionData?.serviceType,
          customerCategory: customerData?.customerCategory,
          tranType: interactionData?.interactionType,
          tranCategory: interactionData?.interactionCategory,
          tranPriority: interactionData?.priorityCode,
        };
        console.log("reqBody", reqBody)
        post(properties.MASTER_API + "/interaction-template", {
          ...reqBody,
        }).then((resp) => {
          if (resp?.status === 200) {
            setTemplateData(resp.data);
            setInteractionData({
              ...interactionData,
              rosterId:
                resp?.data?.mappedTemplate?.appointmentHdr?.[0]?.rosterId || null,
            });
          }
        }).catch(error => console.log(error));
      }
    }
  }, [
    customerData,
    interactionData.priorityCode,
    interactionData.serviceCategory,
    interactionData.serviceType,
    interactionData.interactionType,
    interactionData.interactionCategory,
    interactionData.priorityCode,
  ]);

  const AddTask = (taskDet) => {
    if (Object.keys(taskDet).length > 0) {
      const uniqueList = !isEmpty(taskList) ? taskList?.filter(f => f.taskName !== taskDet.taskName) : []
      setTaskList([
        ...uniqueList,
        taskDet
      ]);
    }
  }

  useEffect(() => {
    if (firstTimeResolved) {
      Swal.fire({
        text: "Glad your query has been resolved.!",
        icon: "success",
        width: 600,
        showCancelButton: false,
        confirmButtonColor: "#4C5A81",
        confirmButtonText: "Okay",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          setInteractionData(null);
        }
      }).catch(error => console.log(error));
    }
  }, [firstTimeResolved]);

  const handleDateClick = (e) => {
    setInteractionData({
      ...interactionData,
      appointmentDate: e.dateStr,
      appointDtlId: "",
    });
  };

  useEffect(() => {
    if (interactionData.appointmentType) {
      if (
        interactionData.appointmentType === "CUST_VISIT" &&
        !interactionData.appointmentBranch
      ) {
        toast.error("Please Select Branch");
        return;
      }
      if (
        interactionData.appointmentType === "BUS_VISIT" &&
        !interactionData?.useCustomerAddress &&
        !addressData?.postcode &&
        !addressData?.district
      ) {
        toast.error("Please Provide Address Details");
        return;
      }
      const requestBody = {
        mapCategory: statusConstantCode.common.INTERACTION,
        serviceCategory: interactionData.serviceCategory,
        serviceType: interactionData.serviceType,
        customerCategory: customerData?.customerCategory,
        tranType: interactionData.interactionType,
        tranCategory: interactionData.interactionCategory,
        intxnProblemCode: interactionData.intxnProblemCode,
        tranPriority: interactionData.priorityCode,
        appointmentType: interactionData.appointmentType,
        templateId: templateData?.mappedTemplate?.templateId,
        appointmentDate:
          interactionData.appointmentDate ||
          moment(new Date()).format("YYYY-MM-DD"),
        location: interactionData.appointmentBranch,
        address: interactionData?.useCustomerAddress
          ? customerData?.customerAddress?.[0]
          : addressData,
      };
      post(properties.MASTER_API + "/available-appointment", {
        ...requestBody,
      }).then((resp) => {
        if (resp.status === 200) {
          setEvents(resp.data.events || []);
          setAvailableAppointments(resp.data.currentAppointments || []);
        }
      }).catch(error => console.log(error));
    }
  }, [
    interactionData.appointmentType,
    interactionData.appointmentDate,
    interactionData.appointmentBranch,
    addressData?.postcode,
    interactionData?.useCustomerAddress,
    addressData?.district,
  ]);

  useEffect(() => {
    const success = (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setLatitude(latitude);
      setLongitude(longitude);
      const geolocationUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      fetch(geolocationUrl)
        .then((res) => res.json())
        .then((data) => {
          setIsActiveTab("MAP");
        }).catch(error => console.log(error));
    };
    const error = () => {
      toast.error("Unable to fetch location");
    };
    navigator.geolocation.getCurrentPosition(success, error);
  }, []);

  const handleSelectSlot = (e) => {
    setInteractionData({
      ...interactionData,
      appointDtlId: e.appointDtlId,
      appointUserId: e.appointUserId,
    });
  };
  const [completedTyping, setCompletedTyping] = useState(false)
  const [displayResponse, setDisplayResponse] = useState()
  const [displayMultipleResponse, setDisplayMultipleResponse] = useState()

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

  useEffect(() => {
    if (enableInteractionAddress && customerAddress && interactionData.markAsInteractionAddress) {
      setAddressList([{
        ...customerAddress,
        addressType: customerAddress?.addressType?.code,
      }])
    } else if (enableInteractionAddress && !customerAddress) {
      if (toastId?.current) {
        toast.update(toastId?.current, {
          render: `Address not available. Please add new address`,
        });
        toastId.current = null
      } else {
        toastId.current = toast.info('Address not available. Please add new address');
      }
      setInteractionData({ ...interactionData, markAsInteractionAddress: false })
    }
  }, [interactionData.markAsInteractionAddress, enableInteractionAddress])


  return (
    <>
      <div className="">
        {!switchStatus ? (
          <>
            <div className="cmmn-skeleton skel-br-tp-r0">
              <div className="row">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="interactionCategory" className="control-label">Interaction Category{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">*</span>
                    </label>
                    <div className="custselect">
                      {/* {console.log('intxnCategoryLookup------->',intxnCategoryLookup)} */}
                      <select
                        value={interactionData.interactionCategory}
                        disabled={!switchStatus && isSmartOpen && withStatement}
                        id="interactionCategory"
                        className={`form-control ${error.interactionCategory && "error-border"
                          }`}
                        onChange={handleInputChange}
                      >
                        <option key="interactionCategory" value="">
                          Select Interaction Category
                        </option>
                        {intxnCategoryLookup &&
                          intxnCategoryLookup.map((e) => (
                            <option key={e.code} value={e.code}>
                              {e.description}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="errormsg">
                      {error.interactionCategory
                        ? error.interactionCategory
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="interactionType" className="control-label">
                      Interaction Type{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <div className="custselect">
                      <select
                        value={interactionData.interactionType}
                        // disabled={switchStatus}
                        disabled={!switchStatus && isSmartOpen && withStatement}
                        id="interactionType"
                        className={`form-control ${error.interactionType && "error-border"
                          }`}
                        onChange={handleInputChange}
                      >
                        <option key="interactionType" value="">
                          Select Interaction Type
                        </option>
                        {intxnTypeLookup &&
                          intxnTypeLookup.map((e) => (
                            <option key={e.code} value={e.code}>
                              {e.description}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="errormsg">
                      {error.interactionType ? error.interactionType : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="serviceCategory" className="control-label">
                      Service Category{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select
                      value={interactionData.serviceCategory}
                      id="serviceCategory"
                      disabled={!switchStatus && isSmartOpen && withStatement}
                      className={`form-control ${error.serviceCategory && "error-border"
                        }`}
                      onChange={handleInputChange}
                    >
                      <option key="serviceCategory" value="">
                        Select Service Category
                      </option>
                      {serviceCategoryLookup &&
                        serviceCategoryLookup.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.description}
                          </option>
                        ))}
                    </select>
                    <span className="errormsg">
                      {error.serviceCategory ? error.serviceCategory : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="serviceType" className="control-label">
                      Service Type{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select
                      value={interactionData.serviceType}
                      id="serviceType"
                      disabled={!switchStatus && isSmartOpen && withStatement}
                      className={`form-control ${error.serviceType && "error-border"
                        }`}
                      onChange={handleInputChange}
                    >
                      <option key="serviceType" value="">
                        Select Service Type
                      </option>
                      {serviceTypeLookup && serviceTypeLookup.length > 0 &&
                        serviceTypeLookup.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.description}
                          </option>
                        ))}
                    </select>
                    <span className="errormsg">
                      {error.serviceType ? error.serviceType : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="channel" className="control-label">
                      Channel{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select
                      value={helpdeskChannelValue.current ?? interactionData.channel}
                      id="channel"
                      className={`form-control ${error.channel && "error-border"
                        }`}
                      onChange={handleInputChange}
                    >
                      <option key="channel" value="">
                        Select Channel
                      </option>
                      {channelLookup &&
                        channelLookup.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.description}
                          </option>
                        ))}
                    </select>
                    <span className="errormsg">
                      {error.channel ? error.channel : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="priorityCode" className="control-label">
                      Priority{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select
                      value={interactionData.priorityCode}
                      disabled={!switchStatus && isSmartOpen && withStatement}
                      id="priorityCode"
                      className={`form-control ${error.priorityCode && "error-border"
                        }`}
                      onChange={handleInputChange}
                    >
                      <option key="priorityCode" value="">
                        Select Priority
                      </option>
                      {priorityLookup &&
                        priorityLookup.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.description}
                          </option>
                        ))}
                    </select>
                    <span className="errormsg">
                      {error.priorityCode ? error.priorityCode : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label
                      htmlFor="contactPreference"
                      className="control-label"
                    >
                      Contact Preference{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <Select
                      id="contactPreference"
                      value={selectedContactPreference}
                      options={preferenceOptions}
                      isMulti
                      onChange={(selectedOption) => {
                        handleInputChange({
                          target: {
                            id: "contactPreference",
                            value: selectedOption,
                          },
                        });
                        setSelectedContactPreference(selectedOption);
                      }}
                      menuPortalTarget={document.body}
                    // styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                    />
                    <span className="errormsg">
                      {error.contactPreference ? error.contactPreference : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="priorityCode" className="control-label">
                      Expected Completion Date <span className="text-danger font-20 pl-1 fld-imp">*</span>{" "}
                    </label>
                    <input type="date"
                      min={moment().format('YYYY-MM-DD')}
                      disabled={!!slaEdoc}
                      value={helpdeskDetails?.complitionDate ?? slaEdoc ?? interactionData.edoc} id="edoc"
                      className={`form-control ${error.edoc && "error-border"
                        }`}
                      onChange={(e) => {
                        if (enableTask) {
                          toast.error("Cannot perform this action due to Enabled Task action. Kindly disable and provide new tasks based on new EDOC")
                        } else {
                          handleInputChange(e)
                        }
                      }} />
                  </div>
                  <span className="errormsg">
                    {error.edoc ? error.edoc : ""}
                  </span>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="project" className="control-label">
                      Project
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select disabled={screenSource === statusConstantCode.entityCategory.HELPDESK &&
                      helpdeskDetails && helpdeskDetails?.project ? true : false} className="form-control" id="project" value={helpdeskDetails?.project?.code ?? interactionData?.project} onChange={handleInputChange}>
                      <option value="">Select Project</option>
                      {
                        projectLookup && projectLookup.map((e) => {
                          return <option key={e.code} value={e.code}>{e.description}</option>
                        }

                        )
                      }
                    </select>
                  </div>
                  <span className="errormsg">
                    {error?.project
                      ? error?.project
                      : ""}
                  </span>
                </div>

                {isQAFormEnabled?.isEnabled && <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="agentName" className="control-label">
                      Agent Name
                      <span className="text-danger font-20 pl-1 fld-imp">*</span>
                    </label>
                    <select className="form-control" id="agentName" value={interactionData?.agentName} onChange={handleInputChange}>
                      <option value="">Select Agent Name</option>
                      {
                        QaUserList && QaUserList.map((e) => {
                          return <option key={e.agentName} value={e.agentName}>{e.agentName}</option>
                        })
                      }
                    </select>
                  </div>
                  {/* <span className="errormsg">
                    {error?.project
                      ? error?.project
                      : ""}
                  </span> */}
                </div>}
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="severity" className="control-label">
                      Severity
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    {/* {console.log("from helpdesk", helpdeskDetails, interactionData)} */}
                    <select disabled={screenSource === statusConstantCode.entityCategory.HELPDESK &&
                      helpdeskDetails && helpdeskDetails?.severity ? true : false} className="form-control" id="severity" value={interactionData?.severity} onChange={handleInputChange}>
                      <option value="">Select Severity</option>
                      {
                        severities && severities.map((e) => (
                          <option key={e.code} value={e.code}>{e.description}</option>
                        ))
                      }
                    </select>
                  </div>
                  <span className="errormsg">
                    {error?.severity
                      ? error?.severity
                      : ""}
                  </span>
                </div>
                {!withStatement && <div className="col-md-6">
                  <div className="form-group">
                    <label
                      htmlFor="intxnProblemCode"
                      className="control-label"
                    >
                      {appConfig?.clientFacingName?.problemCode ?? "Problem Code"} {" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <div className="custselect">
                      {/* {console.log('problemCodeLookupData--------->',problemCodeLookupData)} */}
                      <select
                        value={interactionData?.intxnProblemCode}
                        disabled={switchStatus}
                        id="intxnProblemCode"
                        className={`form-control ${error.intxnProblemCode && "error-border"
                          }`}
                        onChange={handleInputChange}
                      >
                        <option key="intxnProblemCode" value="">
                          Select {appConfig?.clientFacingName?.problemCode ?? "Problem Code"}
                        </option>
                        {problemCodeLookupData &&
                          problemCodeLookupData?.map((e) => (
                            <option key={e.code} value={e.code}>
                              {e.description}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="errormsg">
                      {error.intxnProblemCode
                        ? error.intxnProblemCode
                        : ""}
                    </span>
                  </div>
                </div>}
                {/* {!withStatement && <div className="col-md-6">
                  <div className="form-group">
                    <label
                      htmlFor="problemCause"
                      className="control-label"
                    >
                      Problem Cause{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <div className="custselect">
                      <select
                        value={interactionData?.problemCause}
                        disabled={switchStatus}
                        id="problemCause"
                        className={`form-control ${error.problemCause && "error-border"
                          }`}
                        onChange={handleInputChange}
                      >
                        <option key="problemCause" value="">
                          Select Problem Cause
                        </option>
                        {problemCaseLookup &&
                          problemCaseLookup?.map((e) => (
                            <option key={e.code} value={e.code}>
                              {e.description}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="errormsg">
                      {error.problemCause
                        ? error.problemCause
                        : ""}
                    </span>
                  </div>
                </div>} */}
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="toStatus" className="control-label">
                      Status{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <div className="custselect">
                      <select value={interactionData?.toStatus} id="toStatus" className={`form-control ${error.toStatus && "error-border"}`} onChange={handleInputChange}>
                        <option key="toStatus" value="">
                          Select Status
                        </option>
                        {currStatusLookup &&
                          currStatusLookup.map((currStatus, index) => (
                            <option key={index} value={currStatus?.code}>
                              {currStatus?.description}
                            </option>
                          ))}
                      </select>
                    </div>
                    <span className="errormsg">
                      {error.toStatus ? error.toStatus : ""}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="toRole" className="control-label">
                      Department/Role
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select className={`form-control ${error.toRole && "error-border"}`} id="toRole" value={interactionData?.toRole} onChange={handleInputChange}>
                      <option value="">Select Role</option>
                      {roleLookUp &&
                        roleLookUp.map((dept, key) => (
                          <optgroup key={key} label={dept?.entity?.[0]?.unitDesc}>
                            {!!dept.roles.length &&
                              dept.roles.map((data, childKey) => (
                                <option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity[0])}>{data.roleDesc}</option>
                              ))}
                          </optgroup>
                        ))}
                    </select>
                  </div>
                  <span className="errormsg">
                    {error?.toRole ? error?.toRole : ""}
                  </span>
                </div>
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="currUser" className="control-label">
                      Assign to User
                    </label>
                    <select className={`form-control ${error.currUser && "error-border"}`} id="currUser" value={interactionData?.currUser} onChange={handleInputChange}>
                      <option value="">Select User</option>
                      {userLookUp && userLookUp.map((user, key) => (
                        <option key={key} value={user?.userId}>{user?.firstName} {user?.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <span className="errormsg">
                    {error?.currUser ? error?.currUser : ""}
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="remarks" className="control-label">
                      Interaction Solution
                    </label>
                    <span>{interactionData?.interactionResolution}</span>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="skel-form-heading-bar mt-2">
                  <span className="messages-page__title">
                    Capture Interaction Address ?
                    <ReactSwitch
                      onColor="#4C5A81"
                      offColor="#6c757d"
                      activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                      height={20}
                      width={48}
                      className="inter-toggle skel-inter-toggle ml-2"
                      id="smartSwitch"
                      checked={enableInteractionAddress}
                      onChange={() => {
                        setEnableInteractionAddress(!enableInteractionAddress)
                      }}
                    />
                  </span>
                </div>
                {enableInteractionAddress && <div className="col-md-12">
                  {customerAddress && Object.keys(customerAddress ?? {})?.length && (
                    <label htmlFor="interactionAddress" className="control-label">
                      <input type="checkbox"
                        onChange={(e) => {
                          setInteractionData({ ...interactionData, markAsInteractionAddress: e.target.checked })
                        }}
                        id="markAsInteractionAddress"
                        checked={interactionData?.markAsInteractionAddress}
                      /> Use existing address
                    </label>
                  )}
                  <div className="">
                    <AddressComponent index={0}
                      readOnly={interactionData?.markAsInteractionAddress}
                      addressList={addressList}
                      setAddressList={setAddressList}
                      error={addressError}
                      setError={setAddressError}
                    />
                  </div>
                  <span className="errormsg">
                    {error.interactionAddress ? error.interactionAddress : ""}
                  </span>
                </div>}
              </div>
              <div className="row">
                <div className="skel-form-heading-bar mt-2">
                  <span className="messages-page__title">
                    Would you like to create task ?
                    <ReactSwitch
                      onColor="#4C5A81"
                      offColor="#6c757d"
                      activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                      height={20}
                      width={48}
                      className="inter-toggle skel-inter-toggle ml-2"
                      id="enableTask"
                      checked={enableTask}
                      onChange={() => {
                        if (!interactionData.edoc) {
                          toast.error('Cannot perform this action due to missing Expected date of completion')
                        } else {
                          setEnableTask(!enableTask)
                        }
                      }}
                    />
                  </span>
                </div>
                {enableTask && <div className="col-md-12">
                  <div>
                    <button className="skel-btn-submit" onClick={() => { setShowTaskModal(true); setIsTaskEdit(false) }}>Add New Task</button>
                  </div>
                  <div className="">
                    <DynamicTable
                      row={taskList}
                      header={taskListColumns}
                      itemsPerPage={10}
                      backendPaging={false}
                      handler={{
                        handleCellRender: handleCellRender,
                      }}
                    />
                  </div>
                </div>}
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <label htmlFor="remarks" className="control-label">
                      Remarks{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <textarea
                      value={interactionData.remarks}
                      className={`form-control ${error.remarks && "error-border"
                        }`}
                      id="remarks"
                      name="remarks"
                      rows="4"
                      maxLength="2500"
                      onChange={handleInputChange}
                    />
                    <span>Maximum 2500 characters</span>
                    <span className="errormsg">
                      {error.remarks && error.remarks}
                    </span>
                  </div>
                </div>
                <div className="col-md-12">
                  <FileUpload
                    data={{
                      currentFiles,
                      entityType: "INTERACTION",
                      shouldGetExistingFiles: false,
                      permission: false,
                    }}
                    handlers={{
                      setCurrentFiles,
                    }}
                  />
                </div>
              </div>

              {/* Attachment Category */}

              {/* {viewUploadDetails === 1 && (
                <>
                  <hr className="cmmn-hline mt-2 mb-2" />
                <span className="skel-header-title">Category wise Attachements</span>

              
                <div className="row">
                  <div class="col-md-6 pl-0">
                    <label for="customerTitle" className="col-form-label">Passport Front Page<span>*</span></label>
                    
                    <div class="form-group">
                        <input type="file" id="frontPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                    </div>
                    <span className="img-attachment skel-img-icon-pos">passportfront.png <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                  </div>
                  <div className="col-md-6 pl-0">
                    <label for="customerTitle" className="col-form-label">Passport Back Page</label>
                    <div className="form-group">
                        <input type="file" id="backPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                    </div>
                    <span className="img-attachment skel-img-icon-pos">passportback.png <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                  </div>
                  </div>
                </>
              )}

              {viewUploadDetails === 2 && (
                <>
                  <hr className="cmmn-hline mt-2 mb-2" />
              <div className="d-flex justify-content-spacebetween">
                <div className="skel-upload-header">
                  <span className="skel-header-title mb-0">Upload Passport</span>
                  <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                </div>
                <div className="cursor-pointer">
                  <img src={Uploadimg} alt="" class="img-fluid mr-1" width="25" height="25" onClick={() => {setViewUploadDetails(1); }}/>
                </div>
              </div>
                <div className="row">
                  <div class="col-md-6 pl-0">
                    <span className="skel-capture-img"><img src={Scanimg} className="img-fluid" /></span>
                  </div>
                  <div className="col-md-6 pl-0">
                    <span className="skel-capture-img"><img src={Scanimg} className="img-fluid" /></span>
                  </div>
                </div>
                <div className="skel-btn-center-cmmn mt-2 mb-2">                
                  <button className="skel-btn-submit-outline">Recapture</button>
                  </div>
                </>
              )}              
              
              {viewUploadDetails1 === 2 && (
                <>
                  <hr className="cmmn-hline mt-2 mb-2" />
                 
                <div className="row">
                  <div class="col-md-6 pl-0">
                    <label for="customerTitle" className="col-form-label">ID Card Front Page<span>*</span></label>
                    <div class="form-group">
                        <input type="file" id="frontPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                    </div>
                    <span className="img-attachment skel-img-icon-pos">IDcardfront.jpg <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                  </div>
                  <div className="col-md-6 pl-0">
                    <label for="customerTitle" className="col-form-label">ID Card Back Page</label>
                    <div className="form-group">
                        <input type="file" id="backPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                    </div>
                    <span className="img-attachment skel-img-icon-pos">IDcardback.jpg <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                  </div>
                  </div>
                  </>
              )} */}
            </div>




            <div
              className={`${interactionData?.appointmentRequired && templateData
                ?.mappedTemplate?.templateId
                ? "skel-form-heading-bar mt-2"
                : "d-none"
                }`}
            >
              <span className="messages-page__title">Appointment Settings</span>
            </div>
            <div
              className={`${interactionData?.appointmentRequired && templateData
                ?.mappedTemplate?.templateId
                ? "cmmn-skeleton skel-br-tp-r0"
                : "d-none"
                }`}
            >
              <div className="form-row px-0 py-0">
                <div className="col-md-6">
                  <div className="form-group">
                    <label htmlFor="appointmentType" className="control-label">
                      Appointment Type{" "}
                      <span className="text-danger font-20 pl-1 fld-imp">
                        *
                      </span>
                    </label>
                    <select
                      value={interactionData.appointmentType}
                      id="appointmentType"
                      disabled={switchStatus}
                      className={`form-control ${error.appointmentType && "error-border"
                        }`}
                      onChange={handleInputChange}
                    >
                      <option key="appointmentType" value="">
                        Select Appointment Type
                      </option>
                      {appointmentTypes &&
                        appointmentTypes.map((e) => (
                          <option key={e.code} value={e.code}>
                            {e.description}
                          </option>
                        ))}
                    </select>
                    <span className="errormsg">
                      {error.appointmentType ? error.appointmentType : ""}
                    </span>
                  </div>
                </div>
                {interactionData.appointmentType === "BUS_VISIT" && (
                  <div className="col-md-6 mt-3">
                    <span className="messages-page__title">
                      Use Same as {appConfig?.clientFacingName?.customer ?? 'Customer'} Address
                      <ReactSwitch
                        onColor="#4C5A81"
                        offColor="#6c757d"
                        activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                        height={20}
                        width={48}
                        className="inter-toggle skel-inter-toggle ml-2"
                        id="useCustomerAddress"
                        checked={interactionData?.useCustomerAddress}
                        onChange={(e) => {
                          setInteractionData({
                            ...interactionData,
                            useCustomerAddress: e,
                          });
                        }}
                      />
                    </span>
                  </div>
                )}
                {interactionData.appointmentType === "CUST_VISIT" && (
                  <div className="col-md-6">
                    <div className="form-group">
                      <label
                        htmlFor="appointmentBranch"
                        className="control-label"
                      >
                        Branch{" "}
                        <span className="text-danger font-20 pl-1 fld-imp">
                          *
                        </span>
                      </label>
                      <select
                        value={interactionData.appointmentBranch}
                        id="appointmentBranch"
                        disabled={switchStatus}
                        className={`form-control ${error.appointmentBranch && "error-border"
                          }`}
                        onChange={handleInputChange}
                      >
                        <option key="appointmentBranch" value="">
                          Select Branch
                        </option>
                        {locations &&
                          locations.map((e) => (
                            <option key={e.code} value={e.code}>
                              {e.description}
                            </option>
                          ))}
                      </select>
                      <span className="errormsg">
                        {error.appointmentBranch ? error.appointmentBranch : ""}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-0 py-0 p-1">
                {countries &&
                  !interactionData?.useCustomerAddress &&
                  interactionData.appointmentType === "BUS_VISIT" && (
                    <>
                      <div className="row col-md-12 pl-0 pb-2">
                        <div className="tabbable-responsive pl-1">
                          <div className="tabbable">
                            <ul
                              className="nav nav-tabs"
                              id="myTab"
                              role="tablist"
                            >
                              <li className="nav-item">
                                <a
                                  className={
                                    isActiveTab === "MAP"
                                      ? "nav-link active"
                                      : "nav-link"
                                  }
                                  id="work-flow-history"
                                  data-toggle="tab"
                                  href="#cpwd"
                                  role="tab"
                                  aria-controls="work-flow-history"
                                  aria-selected="false"
                                  onClick={() => {
                                    setIsActiveTab("MAP");
                                  }}
                                >
                                  Address Map
                                </a>
                              </li>
                              <li className="nav-item">
                                <a
                                  className={
                                    isActiveTab === "FORM"
                                      ? "nav-link active"
                                      : "nav-link"
                                  }
                                  id="lead-details"
                                  data-toggle="tab"
                                  href="#mprofile"
                                  role="tab"
                                  aria-controls="lead-details"
                                  aria-selected="true"
                                  onClick={() => {
                                    setIsActiveTab("FORM");
                                  }}
                                >
                                  Address Form
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      {isActiveTab === "FORM" && (
                        <CustomerAddressForm
                          data={{
                            addressData,
                            addressString: "",
                          }}
                          countries={countries}
                          lookups={{
                            addressElements: addressLookUpRef,
                          }}
                          error={addressError}
                          setError={setAddressError}
                          handler={{
                            setAddressData,
                            setAddressLookUpRef,
                          }}
                        />
                      )}
                      {isActiveTab === "MAP" && (
                        <AddressMap
                          data={{
                            addressData: addressData,
                            latitude,
                            longitude,
                            countries,
                          }}
                          lookups={{
                            addressElements: addressLookUpRef,
                          }}
                          error={addressError}
                          setError={setAddressError}
                          handler={{
                            setAddressData: setAddressData,
                            setAddressLookUpRef,
                            setAddressString,
                            fetchCountryList,
                          }}
                        />
                      )}
                    </>
                  )}
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    listPlugin,
                    interactionPlugin,
                  ]}
                  initialView={initialView}
                  headerToolbar={{
                    start: "prev,next today",
                    center: "title",
                    end: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                  }}
                  // nowIndicator
                  // expandRows= {true}
                  // allDaySlot={false}
                  // dayMaxEvents
                  // dayMaxEventRows
                  initialDate={
                    interactionData?.appointmentDate ||
                    moment(new Date()).format("YYYY-MM-DD")
                  }
                  validRange={{
                    start: moment(new Date()).format("YYYY-MM-DD"),
                  }}
                  dateClick={handleDateClick}
                  //eventClick={handleDateClick}
                  weekends={weekends}
                  events={memoizedEventsFn}
                // eventMouseEnter={
                //     (arg) => {
                //         alert(arg.event.title);
                //     }
                // }
                />
                <hr className="cmmn-hline mt-2" />
                {availableAppointments.length > 0 ? (
                  <div className="slots">
                    <ul>
                      {availableAppointments.map((x) => (
                        <li
                          style={{
                            backgroundColor:
                              interactionData?.appointDtlId === x.appointDtlId
                                ? "grey"
                                : x.backgroundColor,
                          }}
                          onClick={() => handleSelectSlot(x)}
                        >
                          {x?.slotName}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div className="skel-pg-bot-sect-btn">
              {/* <button type="button" className="skel-btn-cancel" onClick={() => props.history.goBack()}>Clear</button> */}
              <button
                type="button"
                className="skel-btn-cancel"
                onClick={(e) => handleClear(e)}
              >
                Clear
              </button>
              <button
                type="button"
                className="skel-btn-submit"
                onClick={(e) => handleSubmit(e, 'check')}
              >
                Submit
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="st-solutions">
              {!serviceMsg && resolutionData?.length !== 0 && <span className="skel-res-corner-title">Resolution Corner</span>}
              {!serviceMsg && resolutionData?.length === 0 && multipleServiceData?.length === 0 && <div className="skel-no-resolution-corner">
                <h4 className="skel-no-resolution">
                  Your Smart Assistance is ready to solve your solutions.
                  <span>Try searching one of your problem statement to see the resolutions!</span>
                </h4>
                <img src={Resolutionimg} className="img-fluid" />
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
                                  onChange={(e) => {
                                    handleFrequentInteractionChange(
                                      value,
                                      "frequent"
                                    );
                                  }}
                                />
                                <span>{value?.serviceNo} - {value?.serviceName}</span>
                              </label>
                            </div>
                          );
                        }
                      )}
                  </div>
                )}
              {resolutionData &&
                resolutionData.length > 0 &&
                resolutionData.map((val, idx) => (
                  <div key={idx}>
                    <ResolutionCorner
                      data={{
                        val,
                        idx,
                        customerData,
                        resolutionPayload,
                        selectedService,
                        buttonDisable,
                        resolutionData,
                        formRef,
                        formDetails,
                        sigPad,
                        isFormDisabled,
                        values,
                        lookupData
                      }}
                      handler={{
                        setResolutionData,
                        handleAddProducts,
                        setProductArr,
                        clickToProceed,
                        workflowApiCall,
                        handleSetOrderId,
                        setOrderId,
                        setWorkflowResponse,
                        setFormDetails,
                        setIsFormDisabled,
                        setValues
                      }}
                    />
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
      {
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" dialogClassName="cust-lg-modal" centered show={showTaskModal} onHide={() => { setShowTaskModal(false); setTaskDetails({}) }}>
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Add/Edit Task</h5></Modal.Title>
            <CloseButton onClick={() => { setShowTaskModal(false); setTaskDetails({}) }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <AddEditTask data={
              {
                error, interactionData, isEdit: isTaskEdit, taskDetails, taskList, priorityLookup, taskStatusLookup, userList, tagsLookup
              }
            }
              handler={
                {
                  handleInputChange,
                  setTaskDetails,
                  setTaskList,
                  setTaskStatusLookup,
                  setShowTaskModal,
                  AddTask
                }
              }
            />
          </Modal.Body>
        </Modal>
      }
    </>
  );
};

export default CreateInteractionForm;

const taskListColumns = [
  {
    Header: "Action",
    accessor: "taskAction",
    disableFilters: true,
    id: "taskAction"
  },
  {
    Header: "Task Name",
    accessor: "taskName",
    disableFilters: true
  },
  {
    Header: "Description",
    accessor: "taskDescription",
    disableFilters: true
  }
]