import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Order360Context } from '../../../../../AppContext';
import _ from 'lodash'
import Actions from './Actions';
import OrderKPI from './OrderKPI';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from '../../../../../properties';
import { get, post } from '../../../../../common/util/restUtil';
import History from './History';
import Interactions from '../../../../Customer360/InteractionTabs/Interactions';
import WorkOrders from '../../../../Customer360/InteractionTabs/WorkOrders';
import Fulfilment from './TabItems/Fulfillment';
import LogicalInfromation from './TabItems/LogicalInfromation';
import SearchInvoice from '../../../../../InvoiceAndBilling/Invoice/SearchInvoice';
import Helpdesk from '../../../../Customer360/InteractionTabs/Helpdesk';
import Contract from './TabItems/Contract';
import { useNavigate } from 'react-router-dom';
import { statusConstantCode } from '../../../../../AppConstants';
import TechnicalDetailsTab from './TabItems/TechDetailsTab';
import { getPermissions } from '../../../../../common/util/util';


export default function Order360InformativeView() {
    let { data } = useContext(Order360Context), { orderData = {}, customerDetails = {}, orderNo } = data;
    const history = useNavigate()
    const orderProductDetails = orderData?.orderProductDetails
    const [tabType, setTabType] = useState("Fulfilment");
    const [InteractionCount, setInteractionCount] = useState({})
    const [HelpdeskCount, setHelpdeskCount] = useState({})
    const [pagePermissions, setPagePermissions] = useState([])
    const [componentPermission, setComponentPermission] = useState({})

    const [totalBillingContractValue, setTotalBillingContractValue] = useState(0);
    const [totalRCContractValue, setTotalRCContractValue] = useState(0);
    const [totalNRCContractValue, setTotalNRCContractValue] = useState(0);
    const [orderCount, setOrderCount] = useState(0)
    const [contractCount, setcontractCount] = useState(0)
    const [invoiceCount, setinvoiceCount] = useState(0)
    const getInvoiceAmount = useCallback(() => {
        try {
            if (orderData?.customerDetails?.customerUuid) {
                post(`${properties.CONTRACT_API}/search`, {orderId: orderData?.orderId}).then((response) => {
                    if (response?.data && response?.data) {
                        let contractValue = 0;
                        let RCcontractValue = 0;
                        let NRCcontractValue = 0;
                        for (const contract of response?.data.rows) {
                            const duration = contract.contractDetail?.find(c=> c.chargeType === 'CC_RC')?.durationMonth || 1;
                            let productQuantity = contract.contractDetail?.find(c=> c.chargeType === 'CC_RC')?.quantity || 1
                            RCcontractValue = Number(contract.rcAmount).toFixed(2) * Number(duration)
                            NRCcontractValue = Number(contract.otcAmount).toFixed(2)
                            contractValue = (Number(RCcontractValue || 0)+Number(NRCcontractValue || 0))*Number(productQuantity)
                        }

                       


                        unstable_batchedUpdates(() => {
                            //     // setScheduleContract(response?.data);
                            setTotalBillingContractValue(contractValue);
                            setTotalRCContractValue(RCcontractValue);
                            setTotalNRCContractValue(NRCcontractValue);
                            //     // setSliderDetails(response?.data?.rows?.[0]?.billing?.[0])
                        })
                    }
                }).catch((error) => {
                    console.error(error);
                });
            }
        } catch (e) {
            console.log('error', e)
        }


    }, [orderData])
    const getOrderCount = useCallback(() => {
        if (orderData?.customerDetails?.customerUuid) {
            get(`${properties.ORDER_API}/counts?customerUuid=${orderData?.customerDetails?.customerUuid}`)
                .then((resp) => {
                    if (resp?.status === 200) {
                        setOrderCount(resp?.data?.count)
                    }
                }).catch((error) => console.error(error))
        }
    }, [orderData?.customerDetails?.customerUuid])
    const getContractCount = useCallback(() => {
        if (orderData?.customerDetails?.customerId) {
            post(`${properties.CONTRACT_API}/customer/count`, { searchParams: { orderId: orderData?.orderId } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setcontractCount(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [orderData?.customerDetails?.customerUuid])
    const getInvoiceCount = useCallback(() => {
        if (orderData?.customerDetails?.customerId) {
            post(`${properties.INVOICE_API}/customer/count`, { searchParams: { orderId: orderData?.orderId } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setinvoiceCount(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [orderData?.customerDetails?.customerUuid])
    useEffect(() => {
        const pemissions = async () => {
            try {
                const permissions = await getPermissions('ORDER_360')
                // console.log(permissions)
                setPagePermissions(permissions)
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        }
        pemissions();
        getInvoiceAmount();
        getOrderCount();
        getContractCount();
        getInvoiceCount()
    }, [orderData]);

    useEffect(() => {
        if (pagePermissions && Array.isArray(pagePermissions?.components) && pagePermissions?.components?.length > 0) {
            if (pagePermissions?.accessType === 'allow') {
                let componentPermissions = {}
                pagePermissions.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [pagePermissions])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const getCustomerData = (customerNo) => {
        get(`${properties.CUSTOMER_API}/search?q=${customerNo.trim()}`)
            .then((resp) => {
                if (resp.status === 200) {

                    const data = {
                        ...resp?.data[0],
                        sourceName: 'order60'
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
        <div className="skel-self-data">
            <OrderKPI data={{ totalBillingContractValue, totalRCContractValue, totalNRCContractValue }} />
            <div className="cmmn-skeleton mt-2">
                <Actions />
                <hr className="cmmn-hline mt-2" />
                <div className="view-int-details-key skel-tbl-details">
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Order ID</span>
                                </td>
                                <td width="5%">:</td>
                                <td>
                                    <b>{orderNo}</b>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Category</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.orderCategory?.description ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Family</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.orderFamily?.description ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Type</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.orderType?.description ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Source</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.orderSource?.description ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Channel</span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.orderChannel?.description ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">Priority</span>
                                </td>
                                <td width="5%">:</td>
                                <td>
                                    <span className="skel-h-status">{orderData?.orderPriority?.description ?? '-'}</span>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">
                                        Current Deparment / Role
                                    </span>
                                </td>
                                <td width="5%">:</td>
                                <td>{orderData?.currEntity?.unitDesc ?? '-'}/{orderData?.currRole?.roleName ?? '-'} </td>
                            </tr>
                            <tr>
                                <td>
                                    <span className="font-weight-bold">
                                        Current User
                                    </span>
                                </td>
                                <td width="5%">:</td>
                                <td> {orderData?.currUser?.firstName || "-"}&nbsp;{orderData?.currUser?.lastName || ""}</td>
                            </tr>
                        </tbody>
                    </table>
                    <table className='ml-4'>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>{customerDetails?.firstName || customerDetails?.lastName}</strong>
                                </td>
                            </tr>
                            <tr><td>
                                <span className="txt-underline cursor-pointer" onClick={() => getCustomerData(customerDetails?.customerNo)}>
                                    {customerDetails?.customerNo}
                                </span>
                            </td>
                            </tr>
                            <tr><td>
                                {_.get(customerDetails, 'customerAddress.[0].address1', '') ? _.get(customerDetails, 'customerAddress.[0].address1', '') + ',' : ''} {_.get(customerDetails, 'customerAddress.[0].address2', '')}
                                <br />
                                {_.get(customerDetails, 'customerAddress.[0].address3', '')}, {_.get(customerDetails, 'customerAddress.[0].postcode', '')}
                                <br />

                                P: {_.get(customerDetails, 'customerContact.[0].mobileNo', 'NA')}
                                <br />
                                {_.get(customerDetails, 'customerContact.[0].emailId', 'NA')}
                            </td>
                            </tr>
                            <tr>
                                <td>
                                    <hr className="cmmn-hline" />
                                    <div className="row">
                                        {/*Helpdesk and Interaction History */}
                                        <History data={{ consumerNo: customerDetails?.customerNo, page: 'Interaction', InteractionCount }} handler={{ setInteractionCount, setHelpdeskCount }} />
                                        <History data={{ consumerNo: customerDetails?.customerNo, page: 'Helpdesk', HelpdeskCount }} handler={{ setInteractionCount, setHelpdeskCount }} />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div >
            <div className="cmmn-skeleton mt-2">
                <div className="tabbable">
                    <ul className="nav nav-tabs" id="myTab1" role="tablist">
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Fulfilment" ? "active" : ""}`}
                                id="fulfilment-tab"
                                data-toggle="tab"
                                href="#fulfilmenttab"
                                role="tab"
                                aria-controls="fulfilmenttab"
                                aria-selected="false"
                                onClick={() => { setTabType("Fulfilment") }}
                            >
                                Fulfilment <span className="count">{orderProductDetails?.length}</span>
                            </a>
                        </li>
                        {checkComponentPermission('CI_TECH_DETAILS') && <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "TechnicalDet" ? "active" : ""}`}
                                id="technicalDet-tab"
                                data-toggle="tab"
                                href="#technicalDettab"
                                role="tab"
                                aria-controls="technicalDettab"
                                aria-selected="false"
                                onClick={() => { setTabType("TechnicalDet") }}
                            >
                                CI/Product Details <span className="count">{orderProductDetails?.length}</span>
                            </a>
                        </li>}
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Helpdesk" ? "active" : ""}`}
                                id="helpdesk-tab"
                                data-toggle="tab"
                                href="#helpdesktab"
                                role="tab"
                                aria-controls="helpdesktab"
                                aria-selected="false"
                                onClick={() => { setTabType("Helpdesk") }}

                            >
                                Helpdesk <span className="count">{HelpdeskCount?.total ?? 0}</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Interaction" ? "active" : ""}`}
                                id="interaction-tab"
                                data-toggle="tab"
                                href="#interaction"
                                role="tab"
                                aria-controls="interactiontab"
                                aria-selected="false"
                                onClick={() => { setTabType("Interaction") }}
                            >
                                Interaction <span className="count">{InteractionCount?.totalInteractionCount ?? 0}</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Order" ? "active" : ""}`}
                                id="order-tab"
                                data-toggle="tab"
                                href="#ordertab"
                                role="tab"
                                aria-controls="ordertab"
                                aria-selected="false"
                                onClick={() => { setTabType("Order") }}
                            >
                                Order <span className="count">{orderCount}</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Contract" ? "active" : ""}`}
                                id="contract-tab"
                                data-toggle="tab"
                                href="#contract"
                                role="tab"
                                aria-controls="contract"
                                aria-selected="false"
                                onClick={() => { setTabType("Contract") }}
                            >
                                Contract <span className="count">{contractCount ?? 0}</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "Invoice" ? "active" : ""}`}
                                id="invoice-tab"
                                data-toggle="tab"
                                href="#invoicetab"
                                role="tab"
                                aria-controls="invoicetab"
                                aria-selected="false"
                                onClick={() => { setTabType("Invoice") }}
                            >
                                Invoice <span className="count">{invoiceCount}</span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                className={`nav-link  ${tabType === "LogicalInformation" ? "active" : ""}`}
                                id="logicalinfo"
                                data-toggle="tab"
                                href="#logicaltab"
                                role="tab"
                                aria-controls="logicalinfo"
                                aria-selected="false"
                                onClick={() => { setTabType("LogicalInformation") }}
                            >
                                Logical Information{" "}
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="tab-content mt-2">
                    <div
                        className={`tab-pane fade ${tabType === "Fulfilment" ? "show active" : ""}`}
                        id="fulfilmenttab"
                        role="tabpanel"
                        aria-labelledby="fulfilmenttab"
                    >
                        {tabType === "Fulfilment" && <Fulfilment />}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "TechnicalDet" ? "show active" : ""}`}
                        id="technicalDettab"
                        role="tabpanel"
                        aria-labelledby="technicalDettab"
                    >
                        {tabType === "TechnicalDet" && <TechnicalDetailsTab />}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "Helpdesk" ? "show active" : ""}`}
                        id="helpdesktab"
                        role="tabpanel"
                        aria-labelledby="helpdesktab"
                    >
                        {tabType === "Helpdesk" && <Helpdesk source={'Order360'} data={{ customerDetails: { customerNo: customerDetails?.customerNo }, }} />}

                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "Interaction" ? "show active" : ""}`}
                        id="interaction"
                        role="tabpanel"
                        aria-labelledby="interactiontab"
                    >
                        {tabType === "Interaction" && <Interactions source={'Order360'} data={{ customerDetails: customerDetails }} />}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "Order" ? "show active" : ""}`}
                        id="ordertab"
                        role="tabpanel"
                        aria-labelledby="ordertab"
                    >
                        {tabType === "Order" && customerDetails && (<WorkOrders source={'Order360'} data={{ customerDetails }} />)}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "Contract" ? "show active" : ""}`}
                        id="contract"
                        role="tabpanel"
                        aria-labelledby="contract"
                    >
                        {tabType === "Contract" && <Contract />}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "Invoice" ? "show active" : ""}`}
                        id="invoicetab"
                        role="tabpanel"
                        aria-labelledby="invoicetab"
                    >
                        {tabType === "Invoice" ? (
                            <SearchInvoice
                                data={{
                                    data: {
                                        customerUuid: customerDetails?.customerUuid,
                                        customerDetails,
                                        startDate: null,
                                        endDate: null,
                                        billingStatus: statusConstantCode?.status?.PENDING,
                                        billingStatusCondition: 'notIn',
                                        orderId: orderData?.orderId
                                    },
                                    hideForm: true,
                                    tabType,
                                    initiallyLoad: true,
                                    // refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                                    from: "Order360",
                                }}
                            />
                        ) : (
                            <span className="msg-txt pt-1">
                                No Invoice Available
                            </span>
                        )}
                    </div>
                    <div
                        className={`tab-pane fade ${tabType === "LogicalInformation" ? "show active" : ""}`}
                        id="logicaltab"
                        role="tabpanel"
                        aria-labelledby="logicalinfo"
                    >
                        <LogicalInfromation />
                    </div>
                </div>
            </div>
        </div >
    )
}
