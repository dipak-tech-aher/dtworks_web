import { isEmpty } from "lodash"
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom"
import { toast } from 'react-toastify'
import { statusConstantCode } from '../../../../../AppConstants'
import { getColorClass, getFullName } from '../../../../../common/util/commonUtils'
import { DefaultDateFormate } from '../../../../../common/util/dateUtil'
import { post } from '../../../../../common/util/restUtil'
import { properties } from "../../../../../properties"

const HelpdeskInformation = (props) => {
    let history = useNavigate()

    const { interactionDetails, lookupData } = props?.data
    const { helpdeskNo = undefined } = interactionDetails
    const [helpdeskDetails, setHelpdeskDetails] = useState({})

    const getHelpdeskDetails = useCallback(() => {
        if (helpdeskNo) {
            post(`${properties.HELPDESK_API}/search?limit=10&page=0`, { helpdeskNo })
                .then((response) => {
                    if (response && response?.status === 200 && response?.data?.rows && response?.data?.rows.length > 0) {
                        setHelpdeskDetails(response?.data?.rows?.[0])
                    }
                }).catch(error => {
                    console.error(error);
                }).finally()
        }
    }, [helpdeskNo])


    useEffect(() => {
        getHelpdeskDetails()
    }, [getHelpdeskDetails])

    const handleOnClickRedirect = (type, payload) => {
        let url = type === statusConstantCode.entityCategory.HELPDESK ? '/view-helpdesk'
            : ''
        if (!url) { toast.error('No URL is defined'); return false }
        history(`${url}`, { state: {data: { ...payload } }})
    }

    return (
        <div>
            {!isEmpty(helpdeskDetails) ? <div className="view-int-details-key skel-tbl-details">
                <table className="table-responsive dt-responsive nowrap w-50">
                    <tr>
                        <td><span className="font-weight-bold">Helpdesk ID</span></td>
                        <td width="5%">:</td>
                        <td><span className='cursor-pointer' style={{ color: 'rgb(6 88 242)' }} onClick={() => handleOnClickRedirect(statusConstantCode?.entityCategory?.HELPDESK, { helpdeskId: interactionDetails?.helpdeskId })}>{helpdeskDetails?.helpdeskNo ?? '-'}</span></td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Helpdesk Type</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.helpdeskType?.description ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Project</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.project?.description ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Severity</span></td>
                        <td width="5%">:</td>
                        <td><span className={`sev-critical ${getColorClass(lookupData?.current?.SEVERITY, helpdeskDetails?.severity?.code) ?? 'skel-h-status'}`}>{helpdeskDetails?.severity?.description ?? '-'}</span></td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Contact Preference</span></td>
                        <td width="5%">:</td>
                        <td>{(helpdeskDetails?.contactPreference && helpdeskDetails?.contactPreference?.map((m) => m?.description).join(",")) ?? "-"}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Completion Date</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.complitionDate ? DefaultDateFormate(helpdeskDetails?.complitionDate, 'DD-MM-YYYY HH:MI:SS A') : '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Created At</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.createdAt ? DefaultDateFormate(helpdeskDetails?.createdAt, 'DD-MM-YYYY HH:MI:SS A') : '-'}</td>
                    </tr>
                </table>
                <table className="table-responsive dt-responsive nowrap w-50 ml-4">
                    <tr>
                        <td><span className="font-weight-bold">From Email</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.mailId ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">CC Email</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n") || '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Status</span></td>
                        <td width="5%">:</td>
                        <td><span className={`sev-critical ${getColorClass(lookupData?.current?.HELPDESK_STATUS, helpdeskDetails?.status?.code) ?? 'skel-d-status'}`}>{helpdeskDetails?.status?.description ?? '-'}</span></td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Current Department</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.currDeptInfo?.unitDesc ?? ''}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Current Role</span></td>
                        <td width="5%">:</td>
                        <td>{helpdeskDetails?.currRoleInfo?.roleDesc ?? ''}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Current User</span></td>
                        <td width="5%">:</td>
                        <td>{getFullName(helpdeskDetails?.currUserInfo) ?? ''}</td>
                    </tr>
                </table></div> :
                <div className="col-12 msg-txt pl-2 pr-2 pb-0">
                    <p className="skel-widget-warning">No Helpdesk ID is attached to this interaction.</p>
                </div>}
        </div>
    )

}

export default HelpdeskInformation;