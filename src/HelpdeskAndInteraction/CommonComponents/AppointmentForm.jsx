import FullCalendar from '@fullcalendar/react'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'
import { get, post } from '../../common/util/restUtil'
import { properties } from '../../properties'
import { AppContext } from '../../AppContext'
import ReactSwitch from 'react-switch'
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { toast } from 'react-toastify'
import { statusConstantCode } from '../../AppConstants'

export default function AppointmentForm(props) {
    let { switchStatus, error, state: interactionData, templateData, addressData } = props?.data ?? {};
    let { setState: setInteractionData, handleSubmit, handleClear } = props?.handler ?? {};

    const { appConfig } = useContext(AppContext);
    const [appointmentTypes, setAppointmentTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [countries, setCountries] = useState([]);
    const calendarRef = useRef();
    const [initialView] = useState("dayGridMonth");
    const [weekends] = useState(true);
    const [availableAppointments, setAvailableAppointments] = useState([]);
    const [events, setEvents] = useState([]);
    const [isActiveTab, setIsActiveTab] = useState("");
    const [latitude, setLatitude] = useState();
    const [longitude, setLongitude] = useState();
    // let interactionData = {
    //     appointmentRequired: true
    // }
    // let templateData = {
    //     mappedTemplate: {
    //         templateId: true
    //     }
    // }
    const handleInputChange = (event) => {
        const target = event.target;
        const value = target.type === "checkbox" ? target.checked : target.value;
        const id = target.id;
        setInteractionData({ ...interactionData, [id]: value });
    }
    console.log('Appoinment Compoents')
    useEffect(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=APPOINT_TYPE,LOCATION")
            .then((resp) => {
                if (resp.data) {
                    setAppointmentTypes(resp.data.APPOINT_TYPE || []);
                    // setLocations(
                    //     customerCountry
                    //       ? resp.data.LOCATION.filter(
                    //         (x) => x?.mapping?.country === customerCountry
                    //       )
                    //       : resp.data.LOCATION
                    //   );
                    setLocations(resp.data.LOCATION);
                    setCountries(resp.data.COUNTRY);
                    // setTaskStatusLookup(resp.data.TASK_PRIORITY || []);

                } else {
                    toast.error("Error while fetching lookup details");
                }
            }).catch(error => {
                // console.log(error)
            })
            .finally();
    }, [])
    const memoizedEventsFn = useMemo(() => {
        return events.map((x) => ({
            ...x,
            start: new Date(x.start),
            end: new Date(x.end),
        }));
    }, [events]);

    useEffect(() => {
        if (interactionData.appointmentType) {
            if (interactionData.appointmentType === "CUST_VISIT" && !interactionData.appointmentBranch) {
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
            // const reqBody = {
            //     mapCategory: statusConstantCode.common.HELPDESK,
            //     serviceCategory: 'PST_00000002' ?? helpdeskData?.serviceCategory,
            //     serviceType: 'SVC_TYPE00000015',
            //     customerCategory: 'BUS',
            //     tranType: 'CLARIFICATION' ?? helpdeskData?.helpdeskType,
            //     tranCategory: 'HELPDESK',
            //     tranPriority: 'SEVE00000001' ?? helpdeskData?.severity,
            //   };
            console.log('interactionData',interactionData)
            const requestBody = {
                mapCategory: statusConstantCode.common.HELPDESK,
                serviceCategory: interactionData.serviceCategory,
                // serviceCategory: 'PST_00000002' ?? interactionData.serviceCategory,
                serviceType: interactionData.serviceType ?? '',
                customerCategory: 'BUS',
                tranType: interactionData?.helpdeskType ?? interactionData.interactionType,
                tranCategory: interactionData.interactionCategory ?? 'HELPDESK',
                intxnProblemCode: interactionData.intxnProblemCode,
                tranPriority: interactionData?.severity ?? interactionData.priorityCode,
                appointmentType: interactionData.appointmentType,
                templateId: templateData?.mappedTemplate?.templateId,
                appointmentDate:
                    interactionData.appointmentDate ||
                    moment(new Date()).format("YYYY-MM-DD"),
                location: interactionData.appointmentBranch,
                address: addressData?.[0],
                // address: interactionData?.useCustomerAddress
                //     ? customerData?.customerAddress?.[0]
                //     : addressData,
            };
            console.log(requestBody)
            post(properties.MASTER_API + "/available-appointment", {
                ...requestBody,
            }).then((resp) => {
                console.log('/available-appointment', resp)
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
        // addressData?.postcode,
        // interactionData?.useCustomerAddress,
        // addressData?.district,
    ]);
    const handleDateClick = (e) => {
        setInteractionData({
            ...interactionData,
            appointmentDate: e.dateStr,
            appointDtlId: "",
        });
    };
    const handleSelectSlot = (e) => {
        console.log('e', e)
        setInteractionData({
            ...interactionData,
            appointDtlId: e.appointDtlId,
            appointUserId: e.appointUserId,
        });
    };
    console.log('interactionData', interactionData)
    console.log('availableAppointments', availableAppointments)
    return (
        <>
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
                                        // setInteractionData({
                                        //     ...interactionData,
                                        //     useCustomerAddress: e,
                                        // });
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
                    onClick={(e) => handleSubmit(e)}
                >
                    Submit
                </button>
            </div>
        </>
    )
}
