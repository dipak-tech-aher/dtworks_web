import { useState } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { Element } from 'react-scroll';
import moment from "moment";

const HelpdeskDetails = (props) => {

    const { helpdeskNo = '' } = props?.data
    const [helpdeskDetails, setHelpdeskDetails] = useState({})

    const getHelpdeskDetails = useCallback((payload) => {
        if (payload?.helpdeskNo) {
            const requestBody = {
                helpdeskNo: payload?.helpdeskNo
            }

            post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
                .then((response) => {
                    if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                        // console.log('response :::::::::::::', response)
                        setHelpdeskDetails(response?.data?.rows?.[0])
                    }
                })
                .catch(error => {
                    console.log(error);
                })
                .finally()
        }
    }, [])

    useEffect(() => {
        getHelpdeskDetails({ helpdeskNo })
    }, [getHelpdeskDetails, helpdeskNo])

    return (
        <div className="col-12 row pt-2 m-0 helpdesk-padding-left-0 skel-interaction-detail-section">
            <Element>
                <table>
                    <tr>
                        <td width="100%" className='form-label'>Status</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.status?.description ?? ' -'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Type</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.helpdeskType?.description ?? ' -'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Severity</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.severity?.description ?? ' -'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Project</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.project?.description ?? ' -'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Source</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.helpdeskSource?.description ?? ' -'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Completion date</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.complitionDate ? moment(helpdeskDetails?.complitionDate).format('DD-MM-YYYY') : '-'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label'>Pending with</td>
                        <td width="5%">:</td>
                        <td width="25%">{helpdeskDetails?.pendingWith?.description ?? '-'}</td>
                    </tr>
                    <tr>
                        <td width="100%" className='form-label' colSpan={3}>Email Content</td>
                        {/* <td width="100%" className='form-label w-100' colSpan={3}>Email Content</td> */}
                    </tr>
                    {/* <tr>
                            <td>{helpdeskDetails?.helpdeskContent ?? ''}</td>
                        </tr> */}
                </table>
                <div>
                    <span>{helpdeskDetails?.helpdeskContent ?? '-'}</span>
                </div>
            </Element>
        </div>
    )
}

export default HelpdeskDetails;