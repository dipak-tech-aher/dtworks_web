import { useCallback, useEffect, useState } from "react"
import { properties } from "../../../../../properties"
import { isEmpty } from 'lodash'
import moment from 'moment'
import { get } from "../../../../../common/util/restUtil"
import { getFullName } from "../../../../../common/util/commonUtils"

const AppointmentInformation = (props) => {
    const { informationHelpdeskDetails = {} } = props?.data
    const { customerDetails = {} } = informationHelpdeskDetails
    const [appointmentDetails, setAppointmentDetails] = useState([])
    const getAppointmentInformation = useCallback(() => {
        if (informationHelpdeskDetails?.intxnNo || informationHelpdeskDetails?.helpdeskNo ) {
            get(`${properties.APPOINTMENT_API}/${informationHelpdeskDetails?.helpdeskNo?'helpdesk':'interaction'}/${informationHelpdeskDetails?.intxnNo ?? informationHelpdeskDetails?.helpdeskNo}`)
                .then((response) => {
                    if (response?.status === 200) {
                        setAppointmentDetails(response?.data || [])
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally()
        }
    }, [informationHelpdeskDetails?.intxnNo,informationHelpdeskDetails?.helpdeskNo])

    useEffect(() => {
        getAppointmentInformation()
    }, [getAppointmentInformation])

    return (
        <div className="skel-upcoming-apts-sect">
            {!isEmpty(appointmentDetails) ? (
                <>
                    {appointmentDetails?.rows?.length > 0 && appointmentDetails?.rows?.map((ele) => (
                        < div className="skel-appt-det">
                            <div className={`skel-appt-date ${moment(ele?.appointDate).format("DD MMM YYYY") === moment().format("DD MMM YYYY")
                                ? 'skel-appt-date'
                                : 'skel-fut-date'}`}>
                                {ele?.appointDate ? moment(ele?.appointDate).format("DD MMM") : ''}{" "}
                                <span>{" "} {ele?.appointDate ? moment(ele?.appointDate).format("YYYY") : '-'}
                                </span>
                            </div>
                            <div className="skel-appt-bk-det">
                                <span>{getFullName(customerDetails) ?? ''}</span>
                                <span>{(customerDetails?.customerContact?.[0]?.mobileNo ?? '-')}</span>
                                <span className="skel-cr-date">
                                    {ele?.appointStartTime
                                        ? moment("1970-01-01 " + ele?.appointStartTime).format("hh:mm a")
                                        : "-"}
                                    -
                                    {ele?.appointEndTime
                                        ? moment("1970-01-01 " + ele?.appointEndTime).format("hh:mm a")
                                        : ""}
                                </span>
                                <div className="skel-appt-type-bk">
                                    <ul>
                                        <li className="skel-ty-clr">{ele?.status?.description}</li>
                                        <li className="skel-ch-clr">{ele?.appointMode?.description}</li>
                                        <li>
                                            {["AUDIO_CONF", "VIDEO_CONF"].includes(ele?.appointMode?.code) ?
                                                (<a href={ele?.appointModeValue} target="_blank" rel="noreferrer" className="cursor-pointer">Click here</a>)
                                                : (<span>{ele?.appointModeValue}</span>)}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>))}
                    {/* {!isEmpty(appointmentDetails?.insight) && (
                        <div className="skel-widget-warning">
                            {appointmentDetails?.insight?.message}
                        </div>
                    )} */}
                </>
            ) : ( 
            <div className="col-12 msg-txt pl-2 pr-2 pb-0">
                <p className="skel-widget-warning">No Appointment Found</p>
            </div>)}
        </div>
    )

}

export default AppointmentInformation;