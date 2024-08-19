import React, { useContext, useState } from 'react';
import { Link, Element } from 'react-scroll';
import ComplaintOrServiceRequestDetailsForm from '../HelpdeskAndInteraction/Helpdesk/ComplaintOrServiceRequestDetailsForm';
import { AppContext } from '../AppContext';
import { statusConstantCode } from '../AppConstants';
import { post } from '../common/util/restUtil';
import { properties } from '../properties';
import { useHistory }from '../common/util/history';
import { toast } from 'react-toastify';

const CreateComplaintOrServiceRequest = (props) => {
    const history = useHistory()
    const { auth } = useContext(AppContext);
    const { customerData, phoneNo, ivrNo, lookupData } = props?.data;

    const { CUSTOMER_TYPE: customerTypes } = lookupData.current;

    const type = props?.location?.state && props?.location?.state?.type;

    const initHPDData = {
        helpdeskSubject: null,
        helpdeskType: null,
        content: null,
        helpdeskSource: statusConstantCode.businessEntity.HPD_SOURCE.IVR,
        mailId: null,
        contactId: null,
        userCategory: null,
        userCategoryValue: null,
        userName: null,
        project: null,
        severity: null
    };

    const [helpdeskData, setHelpdeskData] = useState(initHPDData)

    const isStringsArray = arr => arr?.every(i => typeof i === "string")

    const handleClear = () => {
        setHelpdeskData({
            ...helpdeskData,
            helpdeskSubject: null,
            helpdeskType: null,
            content: null,
            project: null,
            severity: null
        });
    }

    const setCustomerData = (key, value) => {
        setHelpdeskData({
            ...helpdeskData,
            customerDetails: {
                [key]: value
            }
        })
    }

    const handleSubmit = () => {
        // console.log("on submit", helpdeskData);
        helpdeskData.phoneNo = Number(helpdeskData.phoneNo ?? phoneNo);
        helpdeskData.ivrNo = Number(helpdeskData.ivrNo ?? ivrNo);
        post(`${properties.HELPDESK_API}/create`, helpdeskData).then((response) => {
            const { message, data } = response;
            if (data?.helpdeskNo) {
                toast.success(message);
                history(`/helpdesk`)
            } else {
                toast.error(message);
            }
        }).catch(error => {
            console.log(error);
        });
    }

    return (
        <div className="container-fluid">
            <div className="row mt-1">
                <div className="col-lg-12">
                    <div className="card-box">
                        <div className="testFlex">
                            <div className="col-md-2 sticky">
                                <nav className="navbar navbar-default navbar-fixed-top">
                                    <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                                        <ul className="nav navbar-nav">
                                            <li><Link activeclassName="active" className="test1" to="customerSection" spy={true} offset={-165} smooth={true} duration={100}>Customer Details</Link></li>
                                            <li><Link activeclassName="active" className="test2" to="complaintSection" spy={true} offset={-130} smooth={true} duration={100}>{type} Details</Link></li>
                                            <li><Link activeclassName="active" className="test5" to="attachmentsSection" spy={true} offset={-120} smooth={true} duration={100}>Attachments</Link></li>
                                        </ul>
                                    </div>
                                </nav>
                            </div>
                            <div className="new-customer col-md-10">
                                <div data-spy="scroll" data-target="#scroll-list" data-offset="0" className="scrollspy-div">
                                    <Element name="customerSection" className="element new-customer">
                                        <div className="row">
                                            <div className="col-12 p-0">
                                                <section className="triangle"><h4 id="list-item-0" className="pl-2" style={{ alignContent: 'left' }}>Customer Details</h4></section>
                                            </div>
                                        </div>

                                        <div className="block-section">
                                            <fieldset className="scheduler-border">
                                                <div id="customer-details">
                                                    <div className="row">
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="inputId" className="col-form-label">Customer Number</label>
                                                                <input className='form-control' disabled value={customerData.customerNo ?? "AUTO GENERATED"} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="inputId" className="col-form-label">Customer Name</label>
                                                                <input className='form-control' disabled={customerData.firstName} value={customerData.firstName} onChange={(e) => {
                                                                    setCustomerData("userName", e.target.value);
                                                                }} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="inputState" className="col-form-label">Customer Type</label>
                                                                <select className='form-control' disabled={customerData.customerCatDesc?.code} onChange={(e) => {
                                                                    setCustomerData("userName", e.target.value);
                                                                }} >
                                                                    <option>Select Customer Type</option>
                                                                    {customerTypes?.map(({ code, description }) => (
                                                                        <option key={code} selected={code == customerData.customerCatDesc?.code} value={code}>{description}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="inputState" className="col-form-label">Email ID</label>
                                                                <input className='form-control' disabled={customerData.customerContact?.[0]?.emailId} value={customerData.customerContact?.[0]?.emailId} onChange={(e) => {
                                                                    
                                                                }} />
                                                            </div>
                                                        </div>
                                                        <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="inputState" className="col-form-label">Contact Number</label>
                                                                <input className='form-control' disabled={customerData.customerContact?.[0]?.mobileNo} value={customerData.customerContact?.[0]?.mobileNo} onChange={(e) => {
                                                                    
                                                                }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </fieldset>
                                        </div>
                                    </Element>

                                    <Element name="complaintSection" className="element">
                                        <div className="row">
                                            <div className="col-12 p-0">
                                                <section className="triangle"><h4 id="list-item-0" className="pl-2" style={{ alignContent: 'left' }}>{type} Details</h4></section>
                                            </div>
                                        </div>
                                        <ComplaintOrServiceRequestDetailsForm
                                            data={{
                                                helpdeskData,
                                                customerData
                                            }}
                                            lookups={{}}
                                            stateHandler={{
                                                setHelpdeskData,
                                                handleClear
                                            }}
                                        />
                                    </Element>
                                </div>
                                <div className="skel-pg-bot-sect-btn">
                                    <button type="button" className="skel-btn-cancel" onClick={handleClear}>
                                        Clear
                                    </button>
                                    <button type="button" className="skel-btn-submit" onClick={handleSubmit}>
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CreateComplaintOrServiceRequest;