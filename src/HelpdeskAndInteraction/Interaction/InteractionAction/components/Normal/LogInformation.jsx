import { useCallback, useEffect, useState } from "react";
import { get } from "../../../../../common/util/restUtil";
import { properties } from "../../../../../properties";
import { DefaultDateFormate } from "../../../../../common/util/dateUtil";
import moment from "moment";

const LogInformation = (props) => {

    const { interactionDetails = {} } = props?.data
    const [logDetails, setLogDetails] = useState([])

    const getLogInformation = useCallback(() => {
        if (interactionDetails?.intxnNo) {
            get(`${properties.INTERACTION_API}/log/${interactionDetails?.intxnNo}`)
                .then((response) => {
                    if (response?.status === 200) {
                        setLogDetails(response?.data)
                    }
                })
        }
    }, [interactionDetails?.intxnNo])

    useEffect(() => {
        getLogInformation()
    }, [getLogInformation])

    return (
        <div>
            {logDetails?.rows?.length > 0 ?
                <ul className="list-unstyled">
                    {logDetails?.rows?.map((ele) => (
                        <li className="media media-loginfo">
                            <div className="profile mr-2">{ele?.actionBy ? ele?.actionBy.substring(0, 2)?.toUpperCase() : 'DT'}</div>
                            <div className="media-body">
                                <p className="mb-0"><strong>{ele?.actionBy ?? 'DT'}</strong> {ele?.value ?? ''}<span className="color-light text-12 pl-1">{ele?.actionAt ? moment(ele?.actionAt).fromNow() : ''}</span></p>
                                <p className="text-12 color-light">{ele?.actionAt ? DefaultDateFormate(ele?.actionAt, 'DD-MM-YYYY HH:mm:ss A') : ''}</p>
                            </div>
                        </li>
                    ))}
                </ul>
                : <p className="skel-widget-warning">No Log Details Available!!!</p>
            }
        </div>
    )
}

export default LogInformation;