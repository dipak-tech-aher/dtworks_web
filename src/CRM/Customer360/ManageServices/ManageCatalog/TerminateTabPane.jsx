import { act, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { string, object } from "yup";
import { toast } from 'react-toastify';
import { get, put, post } from '../../../../common/util/restUtil';
import { properties } from "../../../../properties";
import moment from "moment";
import { CreateOrderContext } from "../../../../AppContext";
import { statusConstantCode } from "../../../../AppConstants";
import { useHistory } from "../../../../common/util/history";

const TerminateTabPane = (props) => {
    const { data, handler } = useContext(CreateOrderContext)
    const { serviceDetails, productDetails, productBenefitLookup = [], totalOutstanding, activeTab, orderData, openOrders, error, orderReason, termsAndCond, openTermsAndCondition, orderNo } = data
    const { setActiveTab, handleInputChange, setOpenTermsAndCondition, setOrderReason, handlePayment } = handler;
    let history = useHistory()
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=SERVICE_TERMINATION_REASON')
            .then((response) => {
                if (response.data) {
                    setOrderReason(response.data.SERVICE_TERMINATION_REASON);
                }
            })
            .catch(error => {
                console.error(error);
            }).finally()
    }, [])

    return (
        <div className="tab-pane">
            {activeTab === 0 && <>
                <span className="skel-progress-steps">
                    Steps 1/2
                </span>
                <div className="prd_ter_wrapper" id="prd_serv_penalty_rules1">

                    <div className="prd_ter_rules">
                        <span className="skel-header-title">Following rules should be
                            completed/satisified before Termination.</span>
                        <ul>
                            <li>
                                <span className={totalOutstanding ? "close_ic" : "tick_ic"}><i className={`mdi ${totalOutstanding ? "mdi-block-helper" : "mdi-check"}`} aria-hidden="true"></i></span>
                                No outstanding.
                            </li>
                            <li>
                                <span className={openOrders ? "close_ic" : "tick_ic"}><i className={`mdi ${openOrders ? "mdi-block-helper" : "mdi-check"}`} aria-hidden="true"></i></span>
                                No open Order.
                            </li>
                        </ul>
                    </div>
                    {totalOutstanding ? <div className="col-md-12 mt-4 ml-0 pl-0">
                        <hr className="cmmn-hline mt-3" />
                        <div className="d-flex justify-content-center mr-0 pt-2">
                            <button type="button" className="skel-btn-submit" onClick={handlePayment}>Proceed to Payment</button>
                        </div>
                    </div> : <></>
                    }
                    {/* <div className="col-md-12 mt-4 ml-0 pl-0">
                    <hr className="cmmn-hline mt-3" />
                    <div className="d-flex justify-content-center mr-0 pt-2">
                        <button type="button" className="skel-btn-submit" onClick={() => { setActiveTab(activeTab+1) }}>Proceed to Suspend</button>
                    </div>
                </div> */}
                </div>
            </>
            }
            {
                activeTab === 1 && <>
                    <span className="skel-progress-steps">
                        Steps 2/3
                    </span>

                    <div
                        className="prd_ter_reason"
                        id="prd_penalty_reason1"
                    //   style={{ display: "none" }}
                    >
                        <div className="row">
                            <div className="col-md-6 pl-0">
                                <div className="form-group">
                                    <label
                                        for="Interactiontype"
                                        className="control-label"
                                    >
                                        Termination Date
                                    </label>
                                    <input
                                        className="form-control"
                                        min={moment().format("YYYY-MM-DD")}
                                        id="fromDate"
                                        type="date"
                                        name="fromDate"
                                        onChange={handleInputChange}
                                        value={orderData?.fromDate}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 pl-0">
                                <div className="form-group">
                                    <label
                                        for="idType"
                                        className="control-label"
                                    >
                                        Reason for Termination
                                    </label>
                                    <select
                                        id="idType"
                                        className="form-control "
                                    >
                                        <option value="">Select</option>
                                        <option value="breach">
                                            Customer Requested
                                        </option>
                                        <option value="outofstation">
                                            Lost SIM card/Phone
                                        </option>
                                        <option value="contract">
                                            Out of Station
                                        </option>
                                        <option value="poor">
                                            Poor Performance
                                        </option>
                                        <option value="contract">
                                            Contract Completion
                                        </option>
                                        <option value="others">
                                            Others
                                        </option>
                                    </select>
                                    <span className="errormsg"></span>
                                </div>
                            </div>
                        </div>

                        <div className="prd_ter_penalty_screen">
                            <span className="skel-header-title mb-0">
                                Contract Details and Plan Benefits
                            </span>
                            <div className="wsc-choosen-plan">
                                <table className="prd_serv-table">
                                    <thead>
                                        <tr>
                                            <td>&nbsp;</td>
                                            <td align="center">
                                                <div className="wsc-skel-tbl-plan">
                                                    <span className="wsc-skel-chosen-active-plan-label">
                                                        Current Plan
                                                    </span>
                                                    <div className="wsc-dt-v1-prdt-detail-sect p-0">
                                                        <span className="wsc-dt-prdt-name">
                                                            {productDetails?.productName}
                                                        </span>
                                                        <div className="wsc-dt-price-sect">
                                                            <span className="wsc-dt-org-price">
                                                                {productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {productDetails?.productChargesList?.[0]?.chargeAmount}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        <tr>
                                            <td>Subscription</td>
                                            <td align="center">
                                                {serviceDetails?.contractMonths} Months(s)
                                            </td>
                                        </tr>
                                        {serviceDetails?.actualProductBenefit?.length > 0 ? (
                                            serviceDetails.actualProductBenefit.map((val, key) => (
                                                <tr>

                                                    <td key={key}>{val?.name?.description}</td>
                                                    <td align="center" key={key}>{val.value}</td>

                                                </tr>
                                            )))
                                            : (
                                                <> NA </>
                                            )}
                                        <tr>
                                            <td>Promo Code</td>
                                            <td align="center">{serviceDetails?.promoCode && Object.keys(serviceDetails?.promoCode).length > 0 ? 'Applied' : 'Not Applied'}</td>
                                        </tr>
                                        <tr>
                                            <td>Contract Starts On</td>
                                            <td align="center">{serviceDetails?.serviceContract?.actualStartDate}</td>
                                        </tr>
                                        <tr>
                                            <td>Contract Ends On</td>
                                            <td align="center">{serviceDetails?.serviceContract?.actualEndDate}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="prd_serv_total_amount mt-3">
                                    <div className="">
                                        <div className="">
                                            <div className="prd_serv_msg_info">
                                                *Note: If you are terminating
                                                the contract there are penalty
                                                charges applicable for the
                                                active contract. For more
                                                information read our
                                                <a className="text-line" onClick={() => { setOpenTermsAndCondition(true) }}>
                                                    Terms and Conditions
                                                </a>
                                            </div>
                                        </div>
                                        <div className="w-100 mt-2">
                                            <table className="w-100">
                                                <tbody>
                                                    <tr>
                                                        <td align="right">
                                                            Deposit Amount
                                                        </td>
                                                        <td align="right">
                                                            {termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                    <tr className="prd_serv_penalty_amount">
                                                        <td align="right">
                                                            Contract Penalty Charge
                                                        </td>
                                                        <td align="right">
                                                            {termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                    <tr className="prd_serv_penalty_amount">
                                                        <td align="right">
                                                            Promo Code Penalty
                                                        </td>
                                                        <td align="right">
                                                            {termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}
                                                        </td>
                                                    </tr>

                                                    <tr className="prd_serv_sub_total_amount">
                                                        <td align="right">
                                                            <b>Penalty Amount</b>
                                                        </td>
                                                        <td align="right">
                                                            <b>{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</b>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            }
            {
                activeTab === 2 && <>
                    <div
                        className="mt-3 mb-3"
                        //   style={{ display: "none" }}
                        id="prd_term_success4"
                    >
                        <p className="text-center mb-0">
                            Are you sure you want to Terminate the
                            Service?
                        </p>
                    </div>
                </>
            }
            {
                activeTab === 3 && <>
                    <div className="wsc-log-rht-sect">
                        <p className="wsc-success-register">
                            <i className="mdi mdi-check"></i>
                        </p>
                        <div className="wsc-pg-title">
                            <p className="mb-0">
                                Your termination request has been
                                submitted successfully!
                            </p>
                        </div>
                        <hr className="cmmn-hline" />
                        <p className="mb-0 mt-2">
                            Your Order ID:
                            <a onClick={() => {
                                 history('/order360', { state: {data: { orderNo } } })
                            }} className="txt-lnk"><strong>#{orderNo}</strong>
                            </a> is used for further rerence/communication.
                        </p>
                        <div className="wsc-log-footer mt-1 mb-3">
                            {/* <p className="wsc-skel-gry-info">
                            You will be redirect to create order
                            page in 10 sec
                        </p> */}
                        </div>
                    </div>
                </>
            }
        </div>


    )
}
export default TerminateTabPane