import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from 'react-toastify';
import { get, put, post } from '../../../../common/util/restUtil';
import { properties } from "../../../../properties";
import moment from "moment";
import { statusConstantCode } from "../../../../AppConstants";
import { CloseButton, Modal } from "react-bootstrap";
import { useHistory } from "../../../../common/util/history";
import { CreateOrderContext } from "../../../../AppContext";

const SuspendTabPane = (props) => {
    const { data, handler } = useContext(CreateOrderContext)
    const { serviceDetails, totalOutstanding, productDetails, productBenefitLookup = [], activeTab, orderData, error, termsAndCond, openTermsAndCondition, orderNo, openOrders } = data
    const { setActiveTab, handleInputChange, setOpenTermsAndCondition } = handler;

    let history = useHistory()

    const handlePayment = () => { }


    return (
        <div className="tab-pane">
            {activeTab === 0 &&
                <div className="prd_ter_wrapper" id="prd_serv_penalty_rules1">
                    <div className="prd_ter_rules">
                        <span className="skel-header-title">Following rules should be completed before Suspend [TOS/Bar]</span>
                        <ul>
                            <li><span className={totalOutstanding ? "close_ic" : "tick_ic"}><i className={`mdi ${totalOutstanding ? "mdi-block-helper" : "mdi-check"}`} aria-hidden="true"></i></span>
                                No outstanding payment pending.</li>
                            <li><span className={serviceDetails?.customerDetails?.status?.code === statusConstantCode.status.CUST_ACTIVE ? "tick_ic" : "close_ic"}>
                                <i className={`mdi ${serviceDetails?.customerDetails?.status?.code === statusConstantCode.status.CUST_ACTIVE ? "mdi-check" : "mdi-block-helper"}`} aria-hidden="true"></i></span>
                                Customer must be in Active Status.</li>
                            <li><span className={serviceDetails?.serviceStatus?.code === statusConstantCode.status.SERVICE_ACTIVE ? "tick_ic" : "close_ic"}>
                                <i className={`mdi ${serviceDetails?.serviceStatus?.code === statusConstantCode.status.SERVICE_ACTIVE ? "mdi-check" : "mdi-block-helper"}`} aria-hidden="true"></i></span>
                                Service must be in Active Status.</li>
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
            }


            {activeTab === 1 &&
                <div className="prd_ter_reason" id="prd_penalty_reason1">
                    <span className="skel-progress-steps">
                        Steps 2/3
                    </span>
                    <div className="row">
                        <div className="col-md-3">
                            <div className="form-group">
                                <label for="Interactiontype" className="control-label">From</label>
                                <input className={`form-control ${error?.fromDate && "error"}`} id="fromDate" type="date" name="fromDate" onChange={handleInputChange} value={orderData?.fromDate} />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label for="Interactiontype" className="control-label">To</label>
                                <input className={`form-control ${error?.toDate && "error"}`} id="toDate" type="date" name="toDate" onChange={handleInputChange} value={orderData?.toDate} />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group"><label for="reason" className="control-label">Reason for
                                Suspend</label><select id="reason" className={`form-control ${error?.reason && "error-border"}`} onChange={handleInputChange} >
                                    <option value="">Select</option>
                                    <option value="breach">Customer Requested</option>
                                    <option value="outofstation">Lost SIM card/Phone</option>
                                    <option value="contract">Out of Station</option>
                                    <option value="poor">Poor Performance</option>
                                    <option value="contract">Contract Completion</option>
                                    <option value="others">Others</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="prd_ter_penalty_screen">
                        <span className="skel-header-title mb-0">Contract Details and Plan Benefits</span>
                        <div className="wsc-choosen-plan">
                            <table className="prd_serv-table">
                                <thead>
                                    <tr>
                                        <td>&nbsp;</td>
                                        <td align="center">
                                            <div className="wsc-skel-tbl-plan">
                                                <span className="wsc-skel-chosen-active-plan-label">Current Plan</span>
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
                                        <td align="center">{serviceDetails?.contractMonths} Month(s)</td>
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
                                <div className="row">
                                    <div className="col-md-5">
                                        <div className="prd_serv_msg_info">
                                            *Note: If you are suspending the contract there are penalty charges applicable for
                                            the active contract. For more information read our <a className="text-line" onClick={() => { setOpenTermsAndCondition(true) }}>Terms and
                                                Conditions</a>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-12 col-xs-12 skel-cr-rht-sect-form">
                                        <div className="skel-sel-products">
                                            {/* <h4>Total</h4> */}
                                            <div className="">
                                                <div className="sect-bottom-prod">
                                                    {termsAndCond?.paymentImpact && (
                                                        <table>
                                                            <tbody>
                                                                <tr>
                                                                    <td colSpan={2} className="text-center"><strong>Payment Information</strong></td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="txt-right">Penalty</td>
                                                                    <td>{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="txt-right" style={{ fontSize: "18px", fontWeight: "600" }}>Total</td>
                                                                    <td style={{ fontSize: "18px", fontWeight: "600" }}>{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(totalOutstanding + (Number(termsAndCond?.chargeDtl?.chargeAmount) || 0)).toFixed(2)}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {termsAndCond?.benefitsImpact && (
                                <React.Fragment>
                                    <div className="col-md-12">
                                        <label htmlFor="remarks" className="control-label">Future Benefits will be as follow:</label>
                                        <div id="datatable_4">
                                            {/* .filter(f => c === Number(f?.contract))? */}
                                            <table role="table" className="table table-responsive table-striped dt-responsive nowrap w-100 skel-cust-table-dyn" style={{ textAlign: 'center', marginLeft: '0px' }}>
                                                <thead>
                                                    <tr role="row">
                                                        <th colSpan="1" role="columnheader">
                                                            <div className="skel-dyn-header-label">
                                                                <span>Benefit</span>
                                                                <span className="skel-table-filter-dynamic"></span>
                                                            </div>
                                                        </th>
                                                        <th colSpan="1" role="columnheader">
                                                            <div className="skel-dyn-header-label">
                                                                <span>Value</span>
                                                                <span className="skel-table-filter-dynamic"></span>
                                                            </div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody role="rowgroup">
                                                    {serviceDetails.actualProductBenefit?.length > 0 ? serviceDetails?.actualProductBenefit?.map((m) => (
                                                        m.benefits?.map((v, k) => (
                                                            <tr role="row" key={k} className="">
                                                                <td><span>{productBenefitLookup.find(b => b.code === v.name)?.description}</span></td>
                                                                <td><span>{v.value}</span></td>
                                                            </tr>
                                                        ))
                                                    )) : (
                                                        <tr role="row" className="">
                                                            <td colSpan={2} style={{ textAlign: 'center' }}>No benefits found</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </React.Fragment>
                            )}
                        </div>
                        {
                            openTermsAndCondition && <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="remarks" className="control-label">
                                        Terms and Conditions{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                    </label>
                                    <span readOnly={true} className="form-control" style={{ height: "100%", maxHeight: "150px", overflowY: "scroll", display: "table" }} dangerouslySetInnerHTML={{ __html: termsAndCond?.termsContent }}></span>
                                </div>
                            </div>
                        }

                        {/* <div className="col-md-12 mt-4 ml-0 pl-0">
                        <hr className="cmmn-hline mt-3" />
                        <div className="d-flex justify-content-center mr-0 pt-2">
                            <button type="button" className="skel-btn-cancel" id="skel-back-to-termination" data-dismiss="modal">Cancel</button>
                            <button type="button" className="skel-btn-submit" onClick={() => { setActiveTab(2) }} data-target="#confirmmodaltermination1"
                                data-toggle="modal">Submit</button>
                        </div>
                    </div> */}
                    </div>
                </div>}



            {activeTab === 2 && <div className="" id="prd_term_success4">
                <span className="skel-progress-steps">
                    Steps 3/3
                </span>
                <p className="text-center mb-0">Are you sure you want to Suspend [TOS/Bar] for <strong>{serviceDetails.serviceNo}</strong> <br />from <strong>{orderData?.fromDate} to {orderData?.toDate}</strong>?
                </p>
                {/* <div className="d-flex justify-content-center mr-0 pt-2">
                    <button type="button" className="skel-btn-cancel" data-dismiss="modal" onClick={() => setActiveTab(1)}>Cancel</button>
                    <button type="button" className="skel-btn-submit" id="skel-confirm-popup-btn11" onClick={handleSubmit}>Confirm</button>
                </div> */}
            </div>}

            {activeTab === 3 && <div className="wsc-plan-success" id="prd_term_success1">
                <div className="wsc-log-rht-sect">
                    <p className="wsc-success-register"><i className="mdi mdi-check"></i></p>
                    <div className="wsc-pg-title">
                        <p className="mb-0">Your Suspend [TOS/Bar] request has been submitted successfully!</p>
                    </div>
                    <hr className="cmmn-hline" />
                    <p className="mb-0 mt-2">Your Order ID: <a className="txt-lnk" onClick={() => {
                        history('/order360', { state: { data: { orderNo } } })
                    }}><strong>#{orderNo}</strong></a> for further reference.</p>
                    <div className="wsc-log-footer mt-1 mb-3">
                        {/* <p className="wsc-skel-gry-info">You will be redirect to order page in 10 sec</p> */}
                        <button type="button" className="skel-btn-cancel" data-dismiss="modal" onClick={() => setActiveTab(0)}>Close</button>

                    </div>
                </div>
            </div>}

        </div>
    )
}
export default SuspendTabPane