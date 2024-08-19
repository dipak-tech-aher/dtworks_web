import React, { useEffect, useState, useCallback, useContext } from 'react';
import ProfilePicture from '../../assets/images/profile.png';
import CalendarComponent from '../../common/CalendarComponent';
import { get } from "../../common/util/restUtil";
import { properties } from '../../properties';
import CustomerHistory from './CustomerHistory';
import EditCustomerModal from './EditCustomerModal';
import { getPermissions } from '../../common/util/util';
import { statusConstantCode } from '../../AppConstants';
import { AppContext } from "../../AppContext";
import PayNow from '../../InvoiceAndBilling/Accounting/AccountDetailsView/PayNow';

const CustomerDetailsFormViewMin = ((props) => {
    const { customerData, accountCount, serviceCount, interactionCount, hideAccSerInt, source, customizedLable, invoiceCounts } = props?.data
    // console.log('source ', source)
    const { setCustomerDetails, handlePrintClick, pageRefresh } = props?.handler
    const [isEditCustomerDetailsOpen, setIsEditCustomerDetailsOpen] = useState(false);
    const [isCustomerDetailsHistoryOpen, setIsCustomerDetailsHistoryOpen] = useState(false);
    const [show, setShow] = useState(false);
    const [events, setEvents] = useState([]);
    const [isPayNowOpen, setIsPayNowOpen] = useState(false)
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const { auth, appsConfig } = useContext(AppContext);
    const dtWorksProductType = appsConfig?.businessSetup?.[0]

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions(dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? 'VIEW_CUSTOMER' : 'VIEW_PROFILE');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission?.components?.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])


    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    useEffect(() => {
        if (typeof customerData === 'object' && customerData !== null && customerData.customerUuid) {
            // console.log(customerData, 'for calendar');
            get(`${properties.INTELLIGENCE_API}/get-events?customerUuid=${customerData.customerUuid}&for=calendar`)
                .then((resp) => {
                    if (resp.data && resp.data.length > 0) {
                        setEvents([...resp.data]);
                    } else {
                        setEvents([]);
                    }
                }).catch(error => console.log(error))
        }
    }, [customerData])

    const handleOnCustomerEdit = () => {
        setIsEditCustomerDetailsOpen(true);
    }

    const handleOnCustomerHistory = () => {
        setIsCustomerDetailsHistoryOpen(true);
    }

    return (
        <>
            <div className="profile-info-rht">
                <div className="cust-profile-top skel-view-customer-profile-top">
                    <div className="profile-top-head">
                        <div className='skel-cust-profile-image'>
                            <img src={customerData?.customerPhoto || ProfilePicture} alt="" className="img-fluid profile-img" />
                        </div>
                        <div className='skel-cust-pr-name'>
                            <span className="profile-name">{customerData?.firstName || customerData?.lastName}</span>
                            <p>{customizedLable} Number: {customerData?.customerNo}</p>
                        </div>
                    </div>
                    <div className="customer-buttons-top">
                        {<span className="icons-md-icon" onClick={() => setShow(true)}><i className="fa fa-calendar"></i></span>}
                        {!['CUSTOMER'].includes(source) && <button className="styl-btn-history" data-target="#customerhistoryModal" data-toggle="modal" onClick={handleOnCustomerHistory}>History</button>}
                        <button className="styl-edti-btn" data-target="#editbusinessModal" data-toggle="modal" onClick={handleOnCustomerEdit}>Edit</button>
                        {['CUSTOMER'].includes(source) && <button className="styl-edti-btn" onClick={handlePrintClick}><i className="fas fa-print mr-1"></i> Print</button>}
                        {checkComponentPermission("PAYNOW") && <button className="styl-edti-btn" data-target="#editbusinessModal" data-toggle="modal" onClick={() => { setIsPayNowOpen(true) }}>Pay Now</button>}
                    </div>
                </div>
                <div className="cust-profile-bottom">
                    <div className="profile-qcnt">
                        <a mailto="">{customerData?.customerContact && customerData?.customerContact[0]?.emailId || 'NA'}</a>
                        <p>{customerData?.customerContact && customerData?.customerContact[0]?.mobileNo || 'NA'}</p>
                        <div className="">
                            <span>DOB: {(customerData?.birthDate) || 'NA'}</span>&nbsp;&nbsp;&nbsp;
                            <span>ID Value: {(customerData?.idValue) || 'NA'}</span>
                        </div>
                        <div className="bussiness-info">
                            <span className="bussiness-type">Category: {(customerData?.customerCatDesc?.description) || (customerData?.customerCategory?.description) || 'NA'}</span>
                            <span className="profile-status">Status: {(customerData?.statusDesc?.description) || (customerData?.status?.description) || 'NA'}</span>
                        </div>
                    </div>
                    {!hideAccSerInt && (
                        <React.Fragment>
                            <div className="cust-open-accounts">
                                <span>Total Account(s) - {accountCount || 0}</span>
                                <hr className="cmmn-hline" />
                                <span>Total Service(s) - {serviceCount || 0}</span>
                            </div>
                            <div className="cust-open-tickets">
                                <span>Open Interactions(s) - {interactionCount || 0}</span>
                            </div>
                        </React.Fragment>
                    )}
                </div>
            </div>

            {
                isEditCustomerDetailsOpen &&
                <EditCustomerModal
                    data={{

                        isEditCustomerDetailsOpen,
                        customerDetails: props?.data?.customerData,
                        //isOpen: true
                    }}
                    handlers={{
                        setIsEditCustomerDetailsOpen,
                        pageRefresh,
                        setCustomerDetails
                    }}
                />
            }
            {
                isCustomerDetailsHistoryOpen &&
                <CustomerHistory
                    data={{
                        isOpen: isCustomerDetailsHistoryOpen,
                        customerData: props?.data?.customerData
                    }}
                    handler={{
                        setIsOpen: setIsCustomerDetailsHistoryOpen
                    }}
                />
            }

            <CalendarComponent
                data={{
                    show,
                    events
                }}
                handlers={{
                    setShow
                }}
            />
            {
                isPayNowOpen &&

                <PayNow
                    data={{
                        isOpen: isPayNowOpen,
                        accountData: [props?.data?.customerData],
                        customerData: customerData,
                        invoiceCounts
                    }}
                    handler={{
                        setIsOpen: setIsPayNowOpen,
                        pageRefresh: pageRefresh
                    }}
                />

            }
        </>
    )
})
export default CustomerDetailsFormViewMin;