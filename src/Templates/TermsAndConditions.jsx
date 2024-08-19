import React from "react";
import ReactQuill from "react-quill";

const TermsAndConditions = ({ editorRef, setTemplateData, templateData }) => {

    return (<>
        {templateData.contractImpact && <>
            <span className="skel-header-title mt-2">Contract Impact</span>
            <div className="w-100 mt-2">
                <div className="card mb-1 w-100">
                    {/* <div className="card-header" id="headingOne">
                        <h5 className="m-0"><a className="text-white" aria-expanded="true">Terms</a></h5>
                    </div> */}
                    <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                        <div className="card-body border">
                            <div className="w-100">

                                <ReactQuill ref={editorRef} value={templateData.contractTermsContent} onChange={(e)=>{setTemplateData({...templateData, contractTermsContent: e})}} />

                            </div>
                        </div>
                    </div>
                </div>
            </div></>}
        {templateData.paymentImpact && <>
            {/* <span className="skel-header-title mx-2 mt-2 mb-0">Payment Impact</span> */}
            <div className="w-100 m-2">
                <div className="card mb-1 w-100">
                    <div className="card-header" id="headingOne">
                        <h5 className="m-0"><a className="text-white" aria-expanded="true">Payment Impact</a></h5>
                    </div>
                    {/* <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                        <div className="card-body border">
                            <div className="w-100">

                                <ReactQuill ref={editorRef} value={templateData.paymentTermsContent} onChange={(e)=>{setTemplateData({...templateData, paymentTermsContent: e})}} />

                            </div>
                        </div>
                    </div> */}
                    {/*-------- Payment Impact structure stars here --------*/}
                    <div className="col-md-12">
                        <div className="row mt-3">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Invoice Submission Deadline(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter invoice submission deadline" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Payment Due Date(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter payment due date" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Early Payment Discounts(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter early payment discount" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Late Payment Penalties(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter late payment penalty" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Partial Payments<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="partialPayments" id="partialPayments" className="custom-control-input" />
                                        <label className="custom-control-label" for="partialPayments">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Disputed Invoices(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter disputed invoices" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Advance Payments(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter advance payments" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label" for="milestonePaymentmilestonePayment">Milestone-Based Payments<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="milestonePayment" id="milestonePayment" className="custom-control-input" />
                                        <label className="custom-control-label" for="milestonePayment">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Credit Terms(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter credit terms" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Retention Fee(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter retention fee" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Automatic Renewal(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter automatic renewal" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Volume Discounts<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="volumeDiscount" id="volumeDiscount" className="custom-control-input" />
                                        <label className="custom-control-label" for="volumeDiscount">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Payment Verification<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="paymentVerification" id="paymentVerification" className="custom-control-input" />
                                        <label className="custom-control-label" for="paymentVerification">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Payment Methods<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="row col-md-12">
                                        <div className="custom-control custom-checkbox mr-2">
                                            <input type="checkbox" name="creditCard" id="creditCard" className="custom-control-input" />
                                            <label className="custom-control-label" for="creditCard">Credit Card</label>
                                        </div>
                                        <div className="custom-control custom-checkbox">
                                            <input type="checkbox" name="bankTransfer" id="bankTransfer" className="custom-control-input" />
                                            <label className="custom-control-label" for="bankTransfer">Bank Transfer</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/*-------- Payment Impact structure ends here --------*/}
                </div>
            </div></>}
        {templateData.billingImpact && <>
            <div className="w-100 m-2">
                <div className="card mb-1 w-100">
                    <div className="card-header" id="headingOne">
                        <h5 className="m-0"><a className="text-white" aria-expanded="true">Billing Impact</a></h5>
                    </div>
                    {/* <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                        <div className="card-body border">
                            <div className="w-100">

                                <ReactQuill ref={editorRef} value={templateData.billingTermsContent} onChange={(e)=>{setTemplateData({...templateData, termsContent: e})}} />

                            </div>
                        </div>
                    </div> */}
                    {/*-------- Billing Impact structure stars here --------*/}
                    <div className="col-md-12">
                        <div className="row mt-3">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Early Payment Incentives(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter early payment incentives" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Late Payment Penalties(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter late payment penalties" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Invoice Dispute Resolution(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter invoice dispute resolution" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Retention Billing(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter retention billing" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Prepayment for Large Orders(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter prepayment for large orders" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Automatic Renewal Billing<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="autoRenewalBilling" id="autoRenewalBilling" className="custom-control-input" />
                                        <label className="custom-control-label" for="autoRenewalBilling">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Customer Billing Information Updates(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter customer billing information updates" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Billing for Partial Deliveries<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="partialDeliveryBills" id="partialDeliveryBills" className="custom-control-input" />
                                        <label className="custom-control-label" for="partialDeliveryBills">Yes</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/*-------- Billing Impact structure ends here --------*/}
                </div>
            </div></>}
        {templateData.benefitsImpact && <>
            <div className="w-100 m-2">
                <div className="card mb-1 w-100">
                    <div className="card-header" id="headingOne">
                        <h5 className="m-0"><a className="text-white" aria-expanded="true">Benefits Impact</a></h5>
                    </div>
                    {/* <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                        <div className="card-body border">
                            <div className="w-100">

                                <ReactQuill ref={editorRef} value={templateData.benefitsTermsContent} onChange={(e)=>{setTemplateData({...templateData, termsContent: e})}} />

                            </div>
                        </div>
                    </div> */}
                    {/*-------- Benefits Impact structure stars here --------*/}
                    <div className="col-md-12">
                        <div className="row mt-3">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Product Warranty<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control">
                                        <option>Select</option>
                                        <option>6 Months</option>
                                        <option>1 Year</option>
                                        <option>2 Years</option>
                                        <option>3 Years</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Product Free Upgrade<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control">
                                        <option>Select</option>
                                        <option>6 Months</option>
                                        <option>1 Year</option>
                                        <option>2 Years</option>
                                        <option>3 Years</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Trial Period(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter trial period" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">24X7 Customer Support<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="customerSupport" id="customerSupport" className="custom-control-input" />
                                        <label className="custom-control-label" for="customerSupport">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Usage Limits<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control">
                                        <option>Select</option>
                                        <option>500MB</option>
                                        <option>1 GB</option>
                                        <option>2 GB</option>
                                        <option>Unlimited</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Data Backup<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="dataBackup" id="dataBackup" className="custom-control-input" />
                                        <label className="custom-control-label" for="dataBackup">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Discounts and Incentives(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter discounts & incentives" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Service Credits<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" name="serviceCredits" id="serviceCredits" className="custom-control-input" />
                                        <label className="custom-control-label" for="serviceCredits">Yes</label>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Subscription Flexibility Notice(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter subscription flexibility Notice" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Renewal Terms(days)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter renewal terms" type="Number" />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Partial Refund Policy(%)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter partial refund policy" type="Number" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/*-------- Benefits Impact structure ends here --------*/}
                </div>
            </div></>}

        {templateData.serviceImpact && <>
            <div className="w-100 m-2">
                <div className="card mb-1 w-100">
                    <div className="card-header" id="headingOne">
                        <h5 className="m-0"><a className="text-white" aria-expanded="true">Service Impact</a></h5>
                    </div>{/* 
                    <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                        <div className="card-body border">
                            <div className="w-100">

                                <ReactQuill ref={editorRef} value={templateData.serviceTermsContent} onChange={(e)=>{setBenefitsTermsContent(e)}} />

                            </div>
                        </div>
                    </div> */}

                    {/*--------- Service Impact structure stars here --------*/}
                    <div className="col-md-12">
                        <div className="row mt-3">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="control-label">Guaranteed Response Times(hours)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="row col-md-12">
                                        <div className="custom-control custom-checkbox mr-2 pl-0">
                                            <label className="custom-label">Critical Issue</label>
                                            <input className="form-control" placeholder="Critical" type="Number" />
                                        </div>
                                        <div className="custom-control custom-checkbox mr-2 pl-0">
                                            <label className="custom-label">Major Issue</label>
                                            <input className="form-control" placeholder="Major" type="Number" />
                                        </div>
                                        <div className="custom-control custom-checkbox mr-2 pl-0">
                                            <label className="custom-label" >Minor Issue</label>
                                            <input className="form-control" placeholder="Minor" type="Number" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label className="control-label">Support Availability<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="row col-md-12">
                                        <div className="custom-control custom-checkbox pl-0 col-md-6">
                                            <label className="custom-label">From</label>
                                            <input className="form-control" placeholder="From" type="time" />
                                        </div>
                                        <div className="custom-control custom-checkbox pl-0 col-md-6">
                                            <label className="custom-label">To</label>
                                            <input className="form-control" placeholder="To" type="time" />
                                        </div>
                                        <div className="custom-control custom-checkbox mt-1">
                                            <input type="checkbox" name="premiumCustomer" id="premiumCustomer" className="custom-control-input" />
                                            <label className="custom-control-label" for="premiumCustomer">Is Premium Customer</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Maintenance Windows(hours)<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <input className="form-control" placeholder="Enter maintenance windows" type="Number" />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/*-------- Service Impact structure stars here --------*/}
                </div>
            </div></>}
        <span className="skel-header-title mt-2">Uptime Guarantee</span>
        <div className="w-100 mt-2">
            <div className="card mb-1 w-100">
                <div className="card-header" id="headingOne">
                    <h5 className="m-0"><a className="text-white" aria-expanded="true">Terms</a></h5>
                </div>
                <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                    <div className="card-body border">
                        <div className="w-100">

                            <ReactQuill ref={editorRef} value={templateData.uptimeTermsContent} onChange={(e) => { setTemplateData({ ...templateData, uptimeTermsContent: e }) }} />

                        </div>
                    </div>
                </div>
            </div>
        </div>
        <span className="skel-header-title mt-2">Renewal Terms</span>
        <div className="w-100 mt-2">
            <div className="card mb-1 w-100">
                <div className="card-header" id="headingOne">
                    <h5 className="m-0"><a className="text-white" aria-expanded="true">Terms</a></h5>
                </div>
                <div id="collapseOne" className="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
                    <div className="card-body border">
                        <div className="w-100">

                            <ReactQuill ref={editorRef} value={templateData.renewalTermsContent} onChange={(e) => { setTemplateData({ ...templateData, renewalTermsContent: e }) }} />

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
    )
}

export default TermsAndConditions;