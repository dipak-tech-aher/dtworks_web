import React, { useContext, useEffect, useRef, useState } from 'react';
import ImgReminder from "../../../assets/images/reminder-img.svg";
import moment from 'moment'
import SearchInvoice from '../../../InvoiceAndBilling/Invoice/SearchInvoice';
import Customer from '../../../HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/ViewHelpdeskTicket/tabPanel/Customer';
import SearchContract from '../../../InvoiceAndBilling/Contract/SearchContract';
import Helpdesk from "../../Customer360/InteractionTabs/Helpdesk";
import Interactions from "../../Customer360/InteractionTabs/Interactions";
import WorkOrders from '../../Customer360/InteractionTabs/WorkOrders';
import { Service360Context } from '../../../AppContext';
import UpgradeDowngradeTabPane from '../../Customer360/ManageServices/ManageCatalog/UpgradeDowngradeTabPane'
import TerminateTabPane from '../../Customer360/ManageServices/ManageCatalog/TerminateTabPane';
import { CloseButton, Modal } from 'react-bootstrap';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { useHistory } from "../../../common/util/history";
import PopupModal from '../../../common/popUpModal';
import PopupListModal from '../../../common/components/PopupListModal';
import { Dropdown } from 'react-bootstrap';
import { statusConstantCode } from '../../../AppConstants';
import SuspendTabPane from '../../Customer360/ManageServices/ManageCatalog/SuspendTabPane';
import ReconnectTabPane from '../../Customer360/ManageServices/ManageCatalog/ReconnectTabPane';
import { toast } from 'react-toastify';
import OrderManagement from '../../Customer360/ManageServices/ManageCatalog/OrderManagement';

const Service360Informative = (props) => {

    const { data, handlers } = useContext(Service360Context);
    const { stats, subscriptionDetails, activeAppointments, apptPopup } = data
    const { pageRefresh, setApptPopup } = handlers
    const history = useHistory()
    const manageServiceRef = useRef();
    const serviceUuid = subscriptionDetails?.serviceUuid
    const customerDetails = subscriptionDetails?.customerDetails
    const accountDetails = subscriptionDetails?.accountDetails
    const productDetails = subscriptionDetails?.productDetails?.[0]
    const contactDetails = subscriptionDetails?.customerDetails?.customerContact?.[0]
    const addressDetails = subscriptionDetails?.serviceAddress?.[0]
    const [tabType, setTabType] = useState("CUSTOMER");
    const [productBenefitLookup, setProductBenefitLookup] = useState([])
    const [dueDateRenewal, setDueDateRenewal] = useState()
    const [latestBillDate, setLatestBillDate] = useState()
    const [orderType, setOrderType] = useState()
    const [orderCategory, setOrderCategory] = useState()
    const [serviceAddress, setServiceAddress] = useState()
    const [orderTypeLookup, setOrderTypeLookup] = useState([])
    const [appointmentListPerPage, setAppointmentListPerPage] = useState(10)
    const [appointmentListCurrentPage, setAppointmentListCurrentPage] = useState(0)
    const [mapSrc, setMapSrc] = useState('');
    const [orderData, setOrderData] = useState({})
    const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);
    const [pageRefreshHandlers, setPageRefreshHandlers] = useState({
        attachmentRefresh: true,
        customerRefresh: true,
        accountEditRefresh: true,
        serviceRefresh: true,
        contractInvoicePaymentRefresh: true,
    });
    const handleContractInvoicePaymentRefresh = () => {
        setPageRefreshHandlers({
            ...pageRefreshHandlers,
            contractInvoicePaymentRefresh:
                !pageRefreshHandlers.contractInvoicePaymentRefresh,
        });
    };

    const handleTypeSelect = (type) => {
        setTabType(type);
    };

    useEffect(() => {
        if (subscriptionDetails?.expiryDate) {
            const days = moment(subscriptionDetails?.expiryDate).diff(new Date(), 'days')
            setDueDateRenewal(days)
        }
    }, [subscriptionDetails?.expiryDate])

    useEffect(() => {
        manageServiceRef.current = subscriptionDetails
        if (stats?.latestBillDate && stats?.latestBillDate !== '-') {
            setLatestBillDate(moment(new Date()).diff(stats?.latestBillDate, 'days'))
        }
        if (addressDetails) {
            const address = `${addressDetails?.address1}${addressDetails?.address2}${addressDetails?.address3}${addressDetails?.city},${addressDetails?.district},${addressDetails?.state},${addressDetails?.country},${addressDetails?.postcode}`
            setServiceAddress(address)
            // console.log(address)
            const src = `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;
            setMapSrc(src)

        }
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT,ORDER_TYPE')
            .then((response) => {
                if (response.data) {
                    // businessMasterRef.current = response.data
                    unstable_batchedUpdates(() => {
                        setProductBenefitLookup(response.data.PRODUCT_BENEFIT)
                        setOrderTypeLookup(response.data.ORDER_TYPE)
                    })
                }
            }).catch((error) => console.error(error))
    }, [])
    const handlePageSelect = (pageNo) => {
        setAppointmentListCurrentPage(pageNo)
    }
    const handleOrderCreation = async (item) => {
        // console.log('subscriptionDetails ', subscriptionDetails)
        setOrderType(item.code)
        if (statusConstantCode.orderType.reconnect === item.code && (subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_TOS)) {
            toast.error(`The service is not in TOS state`);
            return;
        }
        if (statusConstantCode.orderType.terminate === item.code && ![statusConstantCode.status.SERVICE_TOS, statusConstantCode.status.SERVICE_ACTIVE].includes(subscriptionDetails?.serviceStatus.code)) {
            toast.error(`The service is not in Active/TOS state.`);
            return;
        }
        if (statusConstantCode.orderType.suspension === item.code && subscriptionDetails?.serviceStatus.code !== statusConstantCode.status.SERVICE_ACTIVE) {
            toast.error(`The service is not in Active state.`);
            return;
        }
        const openOrders = await post(`${properties.ORDER_API}/search?limit=1&page=0`, { searchParams: { serviceUuid: subscriptionDetails.serviceUuid, orderType: item.code } })
        if (openOrders?.data && openOrders?.data?.row?.length > 0) {
            const isOpen = openOrders?.data?.row.filter(f => f.orderStatus.code !== statusConstantCode.status.ORDER_CLOSED)
            if (isOpen.length > 0) {
                toast.error(`There is an existing open order ${isOpen?.[0].orderNo} with the same Order type. Kindly close the order before creating new one.`);
                return;
            }
        }

        setIsManageServicesOpen(!isManageServicesOpen)
    }

    return (
        <>
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
                                <p className="mb-0 skel-tiles-label">Total Revenue</p>
                                <p className="mb-0 font-weight-bold">{stats.totalRevenue || 0}</p>
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
                                <p className="mb-0 skel-tiles-label">Total Outstanding Amount</p>
                                <p className="mb-0 font-weight-bold">{stats.totalOutstanding || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md px-lg-1">
                    <div className="cmmn-skeleton taa m-0">
                        <div className="row align-items-center">
                            <div className="col-md-auto">
                                <div className="icon">
                                    <i className="far fa-calendar-alt" />
                                </div>
                            </div>
                            <div className="col-md pl-0">
                                <p className="mb-0 skel-tiles-label">Total Active Appointments</p>
                                <p className="mb-0 font-weight-bold txt-underline" data-target="#appointmentmodal" data-toggle="modal" onClick={() => { setApptPopup(true) }}>{stats.totalActiveAppoints}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md px-lg-1">
                    <div className="cmmn-skeleton oe m-0">
                        <div className="row align-items-center">
                            <div className="col-md-auto">
                                <div className="icon">
                                    <i className="far fa-star" />
                                </div>
                            </div>
                            <div className="col-md pl-0">
                                <p className="mb-0 skel-tiles-label">Overall Experience</p>
                                <p className="mb-0 font-weight-bold">Good</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="skel-self-data">
                <div className="cmmn-skeleton mt-2">
                    <div className="skel-flex-card-wrap">
                        <div className="skel-btns ml-auto">

                            <div className='skel-more-actions'>
                                <div variant="btn-group" className="dropdown">
                                    <button className="skel-btn-submit dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="false">More Actions <i className='mdi mdi-menu-down font-16'></i></button>
                                    <div className="dropdown-menu dropdown-menu-right w-auto">
                                        {orderTypeLookup?.length > 0 && (orderTypeLookup?.map((item, index) => (

                                            <button style={item.style} className={'skel-btn-submit-outline mt-1'} key={index} id={item?.code} onClick={() => handleOrderCreation(item)}>
                                                {item?.description}
                                            </button>

                                        )))}
                                    </div>
                                </div>
                            </div>
                            {/* {
                            orderTypeLookup && orderTypeLookup.map((val, key) => (
                                <button className="skel-btn-submit" onClick={()=>{
                                    setIsManageServicesOpen({
                                        ...isManageServicesOpen,
                                        [val.code]: true
                                    })
                                }}>{val.description}</button>
                            ))
                        } */}
                            <div className="skel-more-actions">
                                <div variant="btn-group" className="dropdown">
                                    <button className="skel-btn-submit dropdown-toggle" type="button" data-toggle="dropdown" aria-expanded="false"> Create <i className="mdi mdi-menu-down font-16" />
                                    </button>
                                    <div className="dropdown-menu dropdown-menu-right w-auto">
                                        {/* <a id="" className="dropdown-item" role="button" tabIndex={0} href="#"> Order </a> */}
                                        <a id="" className="dropdown-item" role="button" onClick={() => history(`/create-helpdesk`,
                                            {
                                                state: {
                                                    data: {
                                                        ...customerDetails,
                                                        accountDetails,
                                                        accountUuid: accountDetails.accountUuid,
                                                        serviceUuid
                                                    }
                                                }
                                            })}> Helpdesk </a>
                                        <a id="" className="dropdown-item" role="button" onClick={() => history(`/create-interaction`,
                                            {
                                                state: {
                                                    data: {
                                                        ...customerDetails,
                                                        customerAccounts: [{
                                                            ...accountDetails, accountService: [
                                                                {
                                                                    ...subscriptionDetails
                                                                }
                                                            ]
                                                        }]
                                                    }
                                                }
                                            })}> Interaction </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr className="cmmn-hline mt-2" />
                    <div className="row justify-content-center pb-0 mt-3 mb-2">
                        <div className="col-md">
                            <div className="">
                                <div className="cmmn-skeleton m-0">
                                    <div className="row align-items-stretch">
                                        <div className="col-md-4 align-self-center border-right">
                                            <p className="mb-0 font-weight-bold skel-txt-ellips">{productDetails?.productName}</p>
                                            <p className="mb-0 font-weight-bold font-18">{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {productDetails?.productChargesList?.[0]?.chargeAmount}</p>
                                            <div class="skel-serv-benefits">
                                                <div>
                                                    <p className="mb-0 font-14">
                                                        <span className="font-weight-bold">
                                                            {subscriptionDetails?.serviceLimit?.length > 0 ? (
                                                                <div className="table-responsive">
                                                                    <table className="table table-bordered table-sm">
                                                                        <thead className="thead-light">
                                                                            <tr>
                                                                                {subscriptionDetails.serviceLimit.map((val, key) => (
                                                                                    <th key={key}>{val.name?.description}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                {subscriptionDetails.serviceLimit.map((val, key) => (
                                                                                    <td key={key}>{val.value}</td>
                                                                                ))}
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <>NA</>
                                                            )}
                                                        </span>
                                                        <span className="color-light"> left of
                                                            {subscriptionDetails?.actualProductBenefit?.length > 0 ? (
                                                                <div className="table-responsive mt-2">
                                                                    <table className="table table-bordered table-sm">
                                                                        <thead className="thead-light">
                                                                            <tr>
                                                                                {subscriptionDetails.actualProductBenefit.map((val, key) => (
                                                                                    <th key={key}>{val.name?.description}</th>
                                                                                ))}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            <tr>
                                                                                {subscriptionDetails.actualProductBenefit.map((val, key) => (
                                                                                    <td key={key}>{val.value}</td>
                                                                                ))}
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : (
                                                                <> NA </>
                                                            )}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {/* <div className="col-md align-self-center border-right border-left">
                                            <p className="mb-0 font-14">Service Limit</p>
                                            
                                        </div> */}

                                        <div className="col-md-4 align-self-center border-right">
                                            <div className="row align-items-center">
                                                <div className="col-md-auto">
                                                    <img src={ImgReminder} className="" width={146} />
                                                </div>
                                                <div className="col-md align-self-center pl-0">
                                                    <p className="mb-0">Due Date for Renewal</p>
                                                    <p className="mb-0 font-weight-bold">{subscriptionDetails?.expiryDate || '-'}</p>
                                                    <p className="text-danger text-12 mb-0"> {dueDateRenewal ? (dueDateRenewal >= 0 ? `${dueDateRenewal} more days to expire` : 'already expired') : 'NA'} </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-2 align-self-center border-right">
                                            <p className="mb-0">Bill Due Date</p>
                                            <p className="mb-0 font-weight-bold">{stats?.latestBillDate}</p>
                                            <p className="text-danger text-12 mb-0"> {latestBillDate ? 'Overdue ' + latestBillDate + ' days' : 'NA'}</p>
                                        </div>
                                        <div className="col-md-2 align-self-center">
                                            <p className="mb-0">Outstanding Amount</p>
                                            <p className="mb-0 font-weight-bold">{stats?.totalOutstanding}</p>
                                            {/* <a href="#" className="txt-underline text-12 mb-0"> Pay Now </a> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="view-int-details-key skel-tbl-details">
                        <table>
                            <tbody>
                                {/* <tr>
                                <td>
                                    <span className="font-weight-bold">Service ID</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{subscriptionDetails?.serviceNo}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Service Limit</span>
                                </td>
                                <td width="5%">:</td>
                                <td>
                                    <table border={1}>
                                        <thead>
                                            <tr>
                                                {subscriptionDetails?.actualProductBenefit?.benefits?.map((val, key) => (
                                                    <th>{val.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {subscriptionDetails?.actualProductBenefit?.benefits?.map((val, key) => (
                                                    <td>{val.value}</td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Service Balance</span>
                                </td>
                                <td width="5%">:</td>
                                <td>
                                    <table border={1}>
                                        <thead>
                                            <tr>
                                                {subscriptionDetails?.serviceUsage?.benefits?.map((val, key) => (
                                                    <th>{val.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                {subscriptionDetails?.serviceUsage?.benefits?.map((val, key) => (
                                                    <td>{val.value}</td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr> */}
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Contact Number</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{contactDetails?.mobileNo}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Email ID</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{contactDetails?.emailId}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Service Category</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{subscriptionDetails?.srvcCatDesc?.description}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Service Type</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{subscriptionDetails?.srvcTypeDesc?.description}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Status</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <span className={`status-${subscriptionDetails?.serviceStatus?.description.toLowerCase()} ml-1`}>{subscriptionDetails?.serviceStatus?.description}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Provisioning Type</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{subscriptionDetails?.serviceProvisioningType?.description}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='ml-4'>
                            <tbody>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Payment Method</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <div className="skel-line-height-auto">{subscriptionDetails?.paymentMethod}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Start Date</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{subscriptionDetails?.activationDate}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">End Date</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{subscriptionDetails?.expiryDate}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold"> Service Address Details </span>
                                    </td>
                                    <td width="5%">&nbsp;</td>
                                    <td>&nbsp;</td>
                                </tr>
                                <tr>
                                    <td>
                                        <div style={{ width: "100%" }}>
                                            <iframe width="100%" height={180} src={mapSrc}></iframe>
                                        </div>
                                    </td>
                                    <td width="5%">&nbsp;</td>
                                    <td> {serviceAddress}
                                        {/* <a href="#" className="txt-underline text-12"> View large map </a> */}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="cmmn-skeleton mt-2">
                    <div className="tabbable">
                        <ul className="nav nav-tabs" id="myTab1" role="tablist">
                            <li className="nav-item">
                                <a className={`nav-link  ${tabType === "CUSTOMER" ? "active" : ""
                                    }`}
                                    id="cust-tab" data-toggle="tab"
                                    href="#customerinformation"
                                    role="tab"
                                    aria-controls="custtab"
                                    aria-selected="true"
                                    onClick={() => handleTypeSelect("CUSTOMER")}
                                >
                                    Customer Information
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "monthlyBilled" ? "active" : ""
                                        }`}
                                    id="BC-tab"
                                    data-toggle="tab"
                                    href="#BC"
                                    role="tab"
                                    aria-controls="BC"
                                    aria-selected="true"
                                    onClick={() => handleTypeSelect("monthlyBilled")}
                                >
                                    Billed Contract
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "unbilled" ? "active" : ""
                                        }`}
                                    id="UBC-tab"
                                    data-toggle="tab"
                                    href="#UBC"
                                    role="tab"
                                    aria-controls="UBC"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("unbilled")}
                                >
                                    UnBilled Contract
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "history" ? "active" : ""
                                        }`}
                                    id="CH-tab"
                                    data-toggle="tab"
                                    href="#CH"
                                    role="tab"
                                    aria-controls="CH"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("history")}
                                >
                                    Billing Scheduled
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "Invoice" ? "active" : ""
                                        }`}
                                    id="invoice-tab"
                                    data-toggle="tab"
                                    href="#invoice"
                                    role="tab"
                                    aria-controls="invoice"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("Invoice")}
                                >
                                    Invoice
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "helpdesk" ? "active" : ""
                                        }`}
                                    id="helpdesk-tab"
                                    data-toggle="tab"
                                    href="#helpdesk"
                                    role="tab"
                                    aria-controls="helpdesk"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("helpdesk")}
                                >
                                    Help Desk
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "interaction" ? "active" : ""
                                        }`}
                                    id="interaction-tab"
                                    data-toggle="tab"
                                    href="#interaction"
                                    role="tab"
                                    aria-controls="interaction"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("interaction")}
                                >
                                    Interaction
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "order" ? "active" : ""
                                        }`}
                                    id="order-tab"
                                    data-toggle="tab"
                                    href="#order"
                                    role="tab"
                                    aria-controls="order"
                                    aria-selected="false"
                                    onClick={(evnt) => handleTypeSelect("order")}
                                >
                                    Order
                                </a>
                            </li>
                            {/* <li className="nav-item">
                            <a className="nav-link" id="log-tab" data-toggle="tab" href="#logs" role="tab" aria-controls="logstab" aria-selected="false"> History </a>
                        </li> */}
                        </ul>
                    </div>
                    <div className="tab-content mt-2">
                        <div
                            className={`tab-pane fade ${tabType === 'CUSTOMER' ? 'active show' : ''}`}
                            id="customerinformation"
                            role="tabpanel"
                            aria-labelledby="custtab"
                        >
                            <Customer data={{ detailedViewItem: { customerDetails } }} />
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "monthlyBilled" ? "show active" : ""
                                }`}
                            id="BC"
                            role="tabpanel"
                            aria-labelledby="BC-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                {tabType === "monthlyBilled" && (
                                    <SearchContract
                                        data={{
                                            data: {
                                                //   billRefNo: selectedAccount?.accountNo,
                                                serviceUuid,
                                            },
                                            hideForm: true,
                                            contractType: tabType,
                                            // contractType: "billed",
                                            refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                                            from: "Customer360",
                                        }}
                                        handler={{
                                            pageRefresh: handleContractInvoicePaymentRefresh,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "unbilled" ? "show active" : ""
                                }`}
                            id="UBC"
                            role="tabpanel"
                            aria-labelledby="UBC-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                {tabType === "unbilled" && (
                                    <SearchContract
                                        data={{
                                            data: {
                                                //   billRefNo: selectedAccount?.accountNo,
                                                serviceUuid,
                                            },
                                            hideForm: true,
                                            contractType: tabType,
                                            // contractType: "unbilled",
                                            refresh:
                                                pageRefreshHandlers.contractInvoicePaymentRefresh,
                                            from: "Customer360",
                                        }}
                                        handler={{
                                            pageRefresh: handleContractInvoicePaymentRefresh,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "history" ? "show active" : ""
                                }`}
                            id="CH"
                            role="tabpanel"
                            aria-labelledby="CH-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                {tabType === "history" && (
                                    <SearchContract
                                        data={{
                                            data: {
                                                //     billRefNo: selectedAccount?.accountNo,
                                                serviceUuid,
                                            },
                                            hideForm: true,
                                            contractType: tabType,
                                            // contractType: "history",
                                            refresh:
                                                pageRefreshHandlers.contractInvoicePaymentRefresh,
                                            from: "Customer360",
                                        }}
                                        handler={{
                                            pageRefresh: handleContractInvoicePaymentRefresh,
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "Invoice" ? "show active" : ""
                                }`}
                            id="invoice"
                            role="tabpanel"
                            aria-labelledby="Invoice-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                <SearchInvoice
                                    data={{
                                        data: {
                                            serviceUuid,
                                            customerDetails,
                                            startDate: null,
                                            endDate: null,
                                            billingStatus: statusConstantCode?.status?.PENDING,
                                            billingStatusCondition: 'notIn',
                                        },
                                        hideForm: true,
                                        tabType,
                                        refresh:
                                            pageRefreshHandlers.contractInvoicePaymentRefresh,
                                        from: "Customer360",
                                    }}
                                />
                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "helpdesk" ? "show active" : ""
                                }`}
                            id="helpdesk"
                            role="tabpanel"
                            aria-labelledby="helpdesk-tab"
                        >
                            <div className="cmmn-container-base no-brd">

                                <Helpdesk
                                    data={{
                                        customerDetails: null,
                                        subscriptionDetails: subscriptionDetails,
                                    }}
                                />

                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === 'interaction' ? 'active show' : ''}`}
                            id="interaction"
                            role="tabpanel"
                            aria-labelledby="interaction-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                <Interactions data={{
                                    customerDetails: null,
                                    subscriptionDetails: subscriptionDetails,
                                }} />
                            </div>
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "order" ? "show active" : ""
                                }`}
                            id="order"
                            role="tabpanel"
                            aria-labelledby="order-tab"
                        >
                            <div className="cmmn-container-base no-brd">
                                {tabType === "order" && <WorkOrders
                                    data={{
                                        customerDetails: null,
                                        subscriptionDetails: subscriptionDetails,
                                    }}
                                />}
                            </div>
                        </div>
                    </div>
                </div>
                <PopupListModal
                    data={{
                        isTableFirstRender: false,
                        hasExternalSearch: false,
                        list: activeAppointments,
                        headerColumn: AppointmentColumns,
                        entityType: 'Active Appointment',
                        count: stats.totalActiveAppoints,
                        fixedHeader: true,
                        itemsPerPage: appointmentListPerPage,
                        isScroll: true,
                        backendCurrentPage: appointmentListCurrentPage,
                        backendPaging: false,
                        isPopupOpen: apptPopup
                    }}
                    handlers={{
                        handlePageSelect: handlePageSelect,
                        setPerPage: setAppointmentListPerPage,
                        setCurrentPage: setAppointmentListCurrentPage,
                        setIsPopupOpen: setApptPopup
                    }} />
                <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >

                    <Modal.Header>
                        <Modal.Title>
                            <h4 className="modal-title">Service Details - {subscriptionDetails.serviceName}</h4>
                        </Modal.Title>
                        <CloseButton onClick={() => setIsManageServicesOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>

                        <OrderManagement data={
                            {
                               
                                orderType,
                                customerDetails,
                                stats,
                                productDetails: subscriptionDetails?.productDetails?.[0],
                                subscriptionDetails,
                                screenSource: "CREATE_ORDER",
                                orderData
                            }
                        }
                            handler={{
                                setOrderData
                            }}
                        />

                        {/* <UpgradeDowngradeTabPane
                            data={{
                                manageServiceRef,
                                upgradeDowngradeType: "UPGRADE",
                                selectedAccount: accountDetails,
                                serviceBadge: '',
                                productBenefitLookup
                            }}
                            handlers={{
                                setIsManageServicesOpen,
                                pageRefresh
                            }}
                        /> */}

                    </Modal.Body>
                </Modal>
                {/* <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen.OT_DWNG} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >

                    <Modal.Header>
                        <Modal.Title>
                            <h4 className="modal-title">Service Details - {subscriptionDetails.serviceName}</h4>
                        </Modal.Title>
                        <CloseButton onClick={() => setIsManageServicesOpen({ OT_DWNG: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>

                        <UpgradeDowngradeTabPane
                            data={{
                                manageServiceRef,
                                upgradeDowngradeType: "DOWNGRADE",
                                selectedAccount: accountDetails,
                                serviceBadge: '',
                                productBenefitLookup
                            }}
                            handlers={{
                                setIsManageServicesOpen,
                                pageRefresh
                            }}
                        />

                    </Modal.Body>
                </Modal>
                <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen.OT_SO} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >

                    <Modal.Header>
                        <Modal.Title>
                            <h4 className="modal-title">Service Details - {subscriptionDetails.serviceName}</h4>
                        </Modal.Title>
                        <CloseButton onClick={() => setIsManageServicesOpen({ OT_SO: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <TerminateTabPane
                            data={{
                                manageServiceRef,
                                selectedAccount: accountDetails,
                                serviceBadge: '',
                                interactionTerminationData: null
                            }}
                            handlers={{
                                setIsManageServicesOpen,
                                pageRefresh
                            }}
                        />
                    </Modal.Body>
                </Modal>
                <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen.OT_SSP} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >

                    <Modal.Header>
                        <Modal.Title>
                            <h4 className="modal-title">Service Details - {subscriptionDetails.serviceName}</h4>
                        </Modal.Title>
                        <CloseButton onClick={() => setIsManageServicesOpen({ OT_SSP: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <SuspendTabPane
                            data={{
                                manageServiceRef,
                                type: 'OT_SSP',
                                stats,
                                selectedAccount: accountDetails,
                                productDetails,
                                serviceBadge: '',
                                interactionTerminationData: null
                            }}
                            handlers={{
                                setIsManageServicesOpen,
                                pageRefresh
                            }}
                        />

                    </Modal.Body>
                </Modal>
                <Modal size="xl" aria-labelledby="contained-modal-title-vcenter" fullscreen show={isManageServicesOpen.OT_REC} onHide={() => setIsManageServicesOpen(false)} dialogClassName='cust-lg-modal'  >

                    <Modal.Header>
                        <Modal.Title>
                            <h4 className="modal-title">Service Details - {subscriptionDetails.serviceName}</h4>
                        </Modal.Title>
                        <CloseButton onClick={() => setIsManageServicesOpen({ OT_REC: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <ReconnectTabPane
                            data={{
                                manageServiceRef,
                                stats,
                                type: 'OT_REC',
                                selectedAccount: accountDetails,
                                productDetails,
                                serviceBadge: '',
                                interactionTerminationData: null
                            }}
                            handlers={{
                                setIsManageServicesOpen,
                                pageRefresh
                            }}
                        />

                    </Modal.Body>
                </Modal> */}
            </div >
        </>
    )
}

export default Service360Informative;

export const AppointmentColumns = [
    {
        Header: "Appointment ID",
        accessor: "appointId",
        disableFilters: true,
        id: "appointId",
    },
    {
        Header: "Appointment Date",
        accessor: "appointDate",
        disableFilters: true,
        id: "appointmentDate",
    },
    {
        Header: "Time",
        accessor: "appointStartTime",
        disableFilters: true,
        id: "appointStartTime",
    },
    {
        Header: "Appointment Type",
        accessor: "appointMode.description",
        disableFilters: true,
        id: "appoinmentModeDesc",
    },
    {
        Header: "Entity Type",
        accessor: "tranCategoryType",
        disableFilters: true,
        id: "tranCategoryType",
    },
    {
        Header: "Entity No",
        accessor: "tranCategoryNo",
        disableFilters: true,
        id: "tranCategoryNo",
    },

];