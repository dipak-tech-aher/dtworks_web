import React, { useState, useEffect } from 'react';
import AddressDetailsFormView from '../../../Address/AddressDetailsFormView';
import DetailsCommonTable from './DetailsCommonTable';
import moment from 'moment';
import useDropDownArea from '../../../../common/header/useDropDownArea';
import VoiceImage from '../../../../assets/images/voice.svg'
import DataImage from '../../../../assets/images/data.svg';
import SMSImage from '../../../../assets/images/sms.svg';
import { get, post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';

const DetailsTabPane = (props) => {

    const [display, setDisplay] = useDropDownArea('active-status');
    const [serviceRealTime, setServiceRealTime] = useState({})

    const { manageServiceRef } = props.data;
    console.log('manageServiceRef---------->', manageServiceRef)
    const { checkComponentPermission } = props.handlers;

    const type = manageServiceRef.current?.source ? manageServiceRef.current.source : '';

    useEffect(() => {
        post(`${properties.CUSTOMER_API}/get-service`, { searchInput: manageServiceRef.current.customerDetails?.customerRefNo }).then((response) => {
            get(`${properties.CUSTOMER_API}/service-realtime/${response?.data?.data?.result?.type === 'FIXED LINE' ? manageServiceRef.current.customerDetails?.customerRefNo : manageServiceRef.current.customerDetails?.crmCustomerNo}?service-Type=${response?.data?.data?.result?.type === 'FIXED LINE' ? 'FIXED' : response?.data?.data?.result?.type}`)
                .then((resp) => {
                    setServiceRealTime(resp?.data)
                }).catch((error) => {
                    console.log(error)
                }).finally()
        }).catch((error) => {
            console.log('error------>', error)
        }).finally()


    }, [manageServiceRef])

    const getServiceEmail = () => {
        const primaryEmail = manageServiceRef?.current?.customerDetails?.customerContact?.filter(ele => ele?.isPrimary)?.[0]?.emailId ?? '';

        return (
            <a href={`mailto:${primaryEmail}`}>
                {primaryEmail}
            </a>
        );
    }

    return (
        <div className="card border">
            <section className="triangle col-12 p-0">
                <div className="row col-12">
                    <h5 id="list-item-2" className="pl-2 pt-2 pb-2">Service Details</h5>
                </div>
            </section>
            <div className="container-fluid">
                <div className='wsc-accnt-insight-view wsc-serv-active d-block'>
                    <div className="row mb-2 mt-2">
                        <div className="col-md-4">
                            <div class='row h-100'>
                                <div class='col-md-12'>
                                    <div className="wsc-card-accnt wsc-serv-detail-bg mb-0">
                                        <span>Service No</span>
                                        <span className="wsc-cmmn-fnt-18-md-bold">{manageServiceRef.current.serviceNo}</span>
                                    </div>
                                </div>
                                <div class='col-md-12 mt-2' style={{ height: "73%" }}>
                                    <div className="wsc-card-accnt">
                                        <div className="wsc-accnt-profile">

                                            <div className="wsc-accnt-name-addr">
                                                <span className="wsc-accnt-name wsc-cmmn-fnt-18-md-bold">{manageServiceRef?.current?.customerDetails?.firstName ?? ''} {manageServiceRef?.current?.customerDetails?.lastName ?? ''}</span>
                                                {getServiceEmail()}
                                            </div>
                                        </div>
                                        <hr className="cmmn-hline my-2" />
                                        <div className="wsc-accnt-prev-bill-sect">
                                            <div className="wsc-prev-bill-sect">
                                                <span>Previous Bill</span>
                                                <span className="font-bold">-</span>
                                            </div>
                                            <div className="wsc-prev-bill-sect wsc-overdue-amt">
                                                <span>Overdue</span>
                                                <span className="font-bold">-</span>
                                            </div>
                                            <div className="wsc-prev-bill-sect">
                                                <span>Last Payment made on</span>
                                                <span className="font-bold">-</span>
                                            </div>
                                        </div>
                                        {/* <a href="#" className="wsc-txt-lnk wsc-link-text-right" data-target="#billhistory" data-toggle="modal">View billing &amp; payment history</a> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="wsc-card-accnt">
                                <div className="wsc-accnt-price-sect">
                                    <div className="wsc-price-top-header">
                                        <div className="wsc-accnt-price-details">
                                            <span>Total Amount</span>
                                            <span className="wsc-price-amt-md font-weight-bold">-</span>
                                        </div>
                                        {checkComponentPermission("PAY_NOW") && <div className="wsc-accnt-pay-now-btn">
                                            <button className="skel-btn-submit">
                                                Pay Now
                                            </button>
                                        </div>}
                                    </div>
                                    {/* <a href="#" className="wsc-txt-lnk wsc-link-text-right">Upgrade/Downgrade</a> */}
                                    <hr className="cmmn-hline my-2" />
                                    <div className="wsc-accnt-prev-bill-sect m-h136">
                                        <div className="wsc-subscription-sect">
                                            <span>Subscription</span>
                                            <span className="font-bold txt-black mb-1">{manageServiceRef.current?.contractMonths ?? ''} Months | {manageServiceRef.current.serviceName ?? ''}</span>
                                            <span className="wsc-expiry-date">Expires on {manageServiceRef.current?.expiryDate ? moment(manageServiceRef.current?.expiryDate).format('MMM DD, YYYY') : '-'}</span>
                                        </div>
                                        {/* <ul className="wsc-span-modal-lnk">
                                                <li><span className="wsc-txt-lnk" data-target="#Appointment" data-toggle="modal">Appointments (2)</span></li>
                                                <li><span className="wsc-txt-lnk">View Details</span></li>
                                            </ul> */}
                                    </div>
                                    <hr className="cmmn-hline my-2" />
                                    <div className="wsc-bill-gene-due-date">
                                        <div className="wsc-gene-date mb-2">
                                            {/* <img src="./assets/images/calendar-date.svg" className="img-fluid"/> */}
                                            <div className="wsc-gene-date-info">
                                                <span>Bill generated on</span>
                                                <span className="txt-color-blue font-weight-bold">-</span>
                                            </div>
                                        </div>
                                        <div className="wsc-due-date">
                                            <span>Due Date</span>
                                            <span className="txt-color-blue font-weight-bold">-</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="wsc-card-accnt wsc-card-plan-details">
                                <div className="row row-cols-1">
                                    {/* <div className="col">
                                            <div className="form-group  p-0 m-0">
                                                <label htmlFor="inputName" className="col-form-label p-0">Service No</label>
                                                <p className='m-0'>{manageServiceRef.current.serviceNo}</p>
                                            </div>
                                        </div> */}
                                    <div className="col">
                                        <div className="form-group  p-0 m-0">
                                            <label htmlFor="inputName" className="col-form-label p-0">Service Name</label>
                                            <p>{manageServiceRef.current.serviceName}</p>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service Type</label>
                                            <p>{manageServiceRef.current?.srvcTypeDesc?.description}</p>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service Created on</label>
                                            <p>{manageServiceRef.current?.createdAt ? moment(manageServiceRef.current?.createdAt).format('DD-MM-YYYY') : '-'}</p>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service Status &nbsp;</label>

                                            <div id="active-status" className={`dropdown ${display && "show"}`} >
                                                <span className="badge badge-outline-success font-12 text-uppercase p-1" aria-expanded="false">
                                                    {manageServiceRef.current?.serviceStatus?.description.toLowerCase()}
                                                    <i className="ml-0  font-17 text-primary mdi mdi-arrow-down-drop-circle-outline cursor-pointer d-none" onClick={() => { setDisplay(!display) }} />
                                                </span>

                                                <div className={`dropdown-menu dropdown-menu-right dropdown ${display && "show"}`} >
                                                    <div className="card" style={{ minWidth: "200px" }}>
                                                        <div className="card-body border">
                                                            <form id="bar-unbar-form">
                                                                <div className="d-flex flex-column justify-content-center mt-0">
                                                                    <label className="col-form-label p-0">Change to Inactive</label>
                                                                    <select id="reason" className="form-control">

                                                                        <option>Inactive Reason</option>
                                                                        <option>Reason 1</option>
                                                                        <option>Reason 2</option>
                                                                    </select>
                                                                </div>
                                                                <div className="mt-2 d-flex flex-row justify-content-center">
                                                                    <button type="button" className="btn btn-outline-secondary waves-effect waves-light btn-sm">Cancel</button>
                                                                    <button type=" button" className="btn btn-outline-primary text-primary btn-sm  waves-effect waves-light ml-2">Active</button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service Start Date</label>
                                            <p>{manageServiceRef.current?.activationDate ? moment(manageServiceRef.current?.activationDate).format('DD-MM-YYYY') : '-'}</p>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service End Date</label>
                                            <p>{manageServiceRef.current?.expiryDate ? moment(manageServiceRef.current?.expiryDate).format('DD-MM-YYYY') : '-'}</p>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="form-group">
                                            <label htmlFor="inputState" className="col-form-label p-0">Service Created by</label>
                                            <p>{manageServiceRef.current?.createdByName?.firstName} {manageServiceRef.current?.createdByName?.lastName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-2">
                        <div className="col-md-4">
                            <div className="wsc-data-info-sect">
                                <div className="wsc-benefit-icon-cir wsc-cir-data">
                                    <img src={DataImage} className="img-fluid" />
                                </div>
                                <div className="wsc-benefits-subscription">
                                    <span>Data</span>
                                    <p><span className="wsc-highlht">
                                        {serviceRealTime?.AccumulatedUsage ? Number(serviceRealTime?.AccumulatedUsage / (1024 * 1024 * 1024)).toFixed(1) + " GB" : serviceRealTime?.data?.usage}
                                    </span> left of {serviceRealTime?.usageLimit ? Number(serviceRealTime?.usageLimit / (1024 * 1024 * 1024)).toFixed(1) + " GB" : serviceRealTime?.data?.threshold} </p>
                                    <span className="wsc-sm-data-info">* Renews on </span>
                                </div>
                            </div>
                        </div>
                        {serviceRealTime?.voice?.usage && <div className="col-md-4">
                            <div className="wsc-voice-info-sect">
                                <div className="wsc-benefit-icon-cir wsc-cir-voice">
                                    <img src={VoiceImage} className="img-fluid" />
                                </div>
                                <div className="wsc-benefits-subscription">
                                    <span>Voice</span>
                                    <p><span className="wsc-highlht">{serviceRealTime?.voice?.usage}</span></p>
                                    <span className="wsc-sm-voice-info">{serviceRealTime?.voice?.threshold}</span>
                                </div>
                            </div>
                        </div>}
                        {serviceRealTime?.sms?.usage && <div className="col-md-4">
                            <div className="wsc-sms-info-sect">
                                <div className="wsc-benefit-icon-cir wsc-cir-sms">
                                    <img src={SMSImage} className="img-fluid" />
                                </div>
                                <div className="wsc-benefits-subscription">
                                    <span>SMS</span>
                                    <p><span className="wsc-highlht">{serviceRealTime?.sms?.usage}</span> left of {serviceRealTime?.sms?.threshold}</p>
                                    <span className="wsc-sm-sms-info">* Renews on </span>
                                </div>
                            </div>
                        </div>}
                    </div>
                </div>
                <div>
                    {
                        (
                            <>
                                {
                                    manageServiceRef.current?.productDetails && //manageServiceRef.current?.productDetails.map((plan) => (
                                    <>
                                        <div className="row mb-2">
                                            <div className="col-md-12">
                                                <div className="p-2 bg-light border">
                                                    <h5 className="text-primary">Product</h5>
                                                </div>
                                            </div>
                                        </div>
                                        <DetailsCommonTable tableRow={manageServiceRef.current?.productDetails} type={type} />
                                    </>
                                    //))
                                }
                            </>
                        )
                    }
                </div>
                {console.log('manageServiceRef------------>', manageServiceRef)}
                <AddressDetailsFormView
                    data={{
                        title: "Installation Address",
                        addressData: manageServiceRef.current?.serviceAddress
                    }}
                />
                {/* <div className="row col-12 p-0">
                    <div className="row col-12 p-0 mt-2">
                        <div className="col-12 bg-light border pl-2"><h5 className="text-primary">Service Property</h5> </div>
                    </div>
                    <div className="row col-12">
                        <div className="col-md-3">
                            <div className="form-group  p-0 m-0">
                                <label htmlFor="inputName" className="col-form-label">Service Property 1</label>
                                <p>{manageServiceRef.current?.properties?.property1}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="inputName" className="col-form-label">Service Property 2</label>
                                <p>{manageServiceRef.current?.properties?.property2}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="inputName" className="col-form-label">Service Property 3</label>
                                <p>{manageServiceRef.current?.properties?.property3}</p>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </div>
    )
}

export default DetailsTabPane;