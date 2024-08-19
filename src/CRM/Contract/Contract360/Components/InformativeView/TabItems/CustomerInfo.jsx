import React, { useContext } from 'react'
import { Contract360Context } from '../../../../../../AppContext'
import { useNavigate } from 'react-router-dom';
import { get } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';

export default function CustomerInfo() {
    const { data: { customerDetails } } = useContext(Contract360Context), { emailId, mobileNo, mobilePrefix } = customerDetails?.customerContact?.[0] ?? {};
    const history = useNavigate()
    const getCustomerData = (customerNo) => {
        get(`${properties.CUSTOMER_API}/search?q=${customerNo.trim()}`)
            .then((resp) => {
                if (resp.status === 200) {

                    const data = {
                        ...resp?.data[0],
                        sourceName: 'contract360'
                    }
                    if (resp?.data[0]?.customerUuid) {
                        localStorage.setItem("customerUuid", resp.data[0].customerUuid)
                    }
                    history(`/view-customer`, { state: { data } })
                }
            }).catch(error => {
                console.log(error)
            }).finally();
    }
    return (
        <table className="table-responsive dt-responsive nowrap w-50">
            <tbody>
                <tr>
                    <td>
                        <span className="font-weight-bold">
                            Customer ID
                        </span>
                    </td>
                    <td width="5%">:</td>
                    <td>
                        <span className="txt-underline cursor-pointer" onClick={() => getCustomerData(customerDetails?.customerNo)}>
                            {customerDetails?.customerNo ?? '-'}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td>
                        <span className="font-weight-bold">
                            Full Name
                        </span>
                    </td>
                    <td width="5%">:</td>
                    <td>{customerDetails?.firstName ?? '-'} {customerDetails?.lastName}</td>
                </tr>
                <tr>
                    <td>
                        <span className="font-weight-bold">
                            Contact Number
                        </span>
                    </td>
                    <td width="5%">:</td>
                    <td>{mobilePrefix} {mobileNo ?? '-'}</td>
                </tr>
                <tr>
                    <td>
                        <span className="font-weight-bold">Email</span>
                    </td>
                    <td width="5%">:</td>
                    <td>{emailId ?? '-'}</td>
                </tr>
                <tr>
                    <td>
                        <span className="font-weight-bold">Status</span>
                    </td>
                    <td width="5%">:</td>
                    <td>
                        <span className="status-active">{customerDetails?.statusDesc?.description ?? '-'}</span>
                    </td>
                </tr>
            </tbody>
        </table>
    )
}
