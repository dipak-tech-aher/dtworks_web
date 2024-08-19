import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Order360Context, AppContext } from '../../../../../AppContext';
import { isObject } from 'lodash'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';

export default function OrderKPI(props) {
    const { systemConfig } = useContext(AppContext)
    const { data } = useContext(Order360Context), { orderData, customerDetails } = data;
    const [totalInvoiceValue, setTotalInvoiceValue] = useState(0);
    const [totalPaidInvoiceValue, setTotalPaidInvoiceValue] = useState(0);
    const currency = systemConfig && systemConfig?.find(f=> f.configKey==='CURRENCY')?.configValue;
    const getInvoiceAmount = useCallback(() => {
        if (orderData?.customerDetails?.customerId) {
            post(`${properties.INVOICE_API}/invoice-count`, { orderId: orderData?.orderId }).then((response) => {
                if (response?.data) {
                    const totalPaid = response.data.rows?.[0].totalRevenue
                    const totalOutstanding = response.data.rows?.[0].totalOutstanding
                    setTotalInvoiceValue(totalOutstanding || 0);
                    setTotalPaidInvoiceValue(totalPaid || 0);
                }
            }).catch((error) => {
                console.error(error);
            });
        }

    }, [orderData])
    useEffect(() => {
        if (orderData && isObject(orderData)) {
            getInvoiceAmount()
        }
    }, [orderData])
    // console.log('systemConfig ', systemConfig)
    return (
        <div className="row my-2 mx-lg-n1 service-360-tiles">
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton tr m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Total Billing <br />
                                Contract
                            </p>
                            <p className="mb-0 font-weight-bold">{currency} {props?.data?.totalBillingContractValue ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton toa m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Total RC <br />
                                Amount
                            </p>
                            <p className="mb-0 font-weight-bold">{currency} {props?.data?.totalRCContractValue ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton top m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Total NRC
                                <br /> Amount
                            </p>
                            <p className="mb-0 font-weight-bold">{currency} {props?.data?.totalNRCContractValue ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton taa m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Total Paid <br />
                                Amount
                            </p>
                            <p className="mb-0 font-weight-bold">{currency} {totalPaidInvoiceValue ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton oe m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Total Invoice <br />
                                Amount
                            </p>
                            <p className="mb-0 font-weight-bold">{currency} {totalInvoiceValue ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
