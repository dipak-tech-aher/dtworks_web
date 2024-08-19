import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "../../../../common/util/history";
import { CreateOrderContext } from "../../../../AppContext";
import { statusConstantCode } from "../../../../AppConstants";

const ReconnectTabPane = (props) => {
    const { data, handler } = useContext(CreateOrderContext)
    const { serviceDetails, totalOutstanding, productDetails, openOrders, productBenefitLookup = [], termsAndCond, orderNo, error, orderData, activeTab } = data
    const { setActiveTab, handleInputChange, setOpenTermsAndCondition } = handler;

    let history = useHistory()

    return (
        <div className="tab-pane">
            {activeTab === 0 &&
                serviceDetails?.serviceStatus.code === statusConstantCode.status.SERVICE_ACTIVE ?
                <>
                    <span className="info_msg">
                        Currently <b>({serviceDetails?.serviceNo})</b> service number is in {serviceDetails?.serviceStatus?.description} status. You cant reconnect the active service.
                    </span>
                </> :
                <>
                    <div className="prd_ter_wrapper" id="prd_serv_penalty_rules11">
                        <div className="prd_unbar_wrapper">
                            <span className="info_msg">
                                Currently <b>({serviceDetails?.serviceNo})</b> service number is in {serviceDetails?.serviceStatus?.description} status. If you are
                                trying to activate the service proceed further.
                            </span>
                        </div>
                    </div>
                    <div className="prd_ter_wrapper" id="prd_serv_penalty1_rules">
                        <div className="prd_ter_rules">
                            <span className="skel-header-title">Following rules should be completed before Unbar/Reconnection</span>
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
                            <hr className="cmmn-hline mt-3" />
                        </div>
                        {totalOutstanding ? <div className="col-md-12 mt-4 ml-0 pl-0">
                            <hr className="cmmn-hline mt-3" />
                            <div className="d-flex justify-content-center mr-0 pt-2">
                                <button type="button" className="skel-btn-submit" id="skel-unbar-btn-proceed">Proceed to Payment</button>
                            </div>
                        </div> : <></>}
                    </div>
                </>
            }
            {activeTab === 1 &&
                <div className="col-md-12 mt-4 ml-0 pl-0">

                    <div className="prd_ter_penalty_screen">
                        <span className="skel-header-title mb-2">Contract Details and Plan Benefits</span>
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
                                                        <span className="wsc-dt-org-price">{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {productDetails?.productChargesList?.[0]?.chargeAmount}</span>

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

                        </div>

                        {/* <div className="col-md-12 mt-4 ml-0 pl-0">
                        <hr className="cmmn-hline mt-3" />
                        <div className="d-flex justify-content-center mr-0 pt-2">
                            <button type="button" className="skel-btn-cancel" id="skel-back-to-termination" data-dismiss="modal">Cancel</button>
                            <button type="button" className="skel-btn-submit" onClick={() => { setFirstResponse(true); }} data-target="#confirmmodaltermination1"
                                data-toggle="modal">Submit</button>
                        </div>
                    </div> */}
                    </div>

                </div>}

            {
                activeTab === 2 && <div className="" id="prd_term_success45">
                    <p className="text-center mb-0">Are you sure you want to Unbar/Reconnection the<br />
                        service number <strong>{serviceDetails.serviceNo}</strong>?
                    </p>
                    {/* <div className="d-flex justify-content-center mr-0 pt-2">
                        <button type="button" className="skel-btn-cancel" data-dismiss="modal" onClick={() => setFirstResponse(!firstResponse)}>Cancel</button>
                        <button type="button" className="skel-btn-submit" id="skel-confirm-popup-btn111" onClick={handleSubmit}>Confirm</button>
                    </div> */}
                </div>
            }


            {
                activeTab === 3 && <div className="" id="prd_unbar_success3">
                    <div className="wsc-log-rht-sect">
                        <p className="wsc-success-register"><i className="mdi mdi-check"></i></p>
                        <div className="wsc-pg-title">
                            <p className="mb-0">Your Unbar/Reconnection request has been submitted successfully!</p>
                            <p className="mb-0 mt-1">Your service number will activate in 2 to 8 hours.</p>
                        </div>
                        <hr className="cmmn-hline" />
                        <p className="mb-0 mt-2">Your Order ID: <a className="txt-lnk" onClick={() => {
                            history.push('/order360', { data: { orderNo } })
                        }}><strong>#{orderNo}</strong></a> for further reference.</p>
                        <div className="wsc-log-footer mt-1 mb-3">
                            {/* <p className="wsc-skel-gry-info">You will be redirect to order page in 10 sec</p> */}
                            {/* <button type="button" className="skel-btn-cancel" data-dismiss="modal" onClick={() => setSecondResponse(!secondResponse)}>Close</button> */}

                        </div>
                    </div>
                </div>
            }

        </div >
    )
}
export default ReconnectTabPane