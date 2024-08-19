import React, { useState, useContext, useEffect, useRef, useMemo, useCallback } from 'react'
import Helpdesk from '../../../../Customer360/InteractionTabs/Helpdesk';
import Interactions from '../../../../Customer360/InteractionTabs/Interactions';
import CustomerInfo from './TabItems/CustomerInfo';
import { Contract360Context } from '../../../../../AppContext';
import ContractKPI from './ContractKPI';
import SearchContract from '../../../../../InvoiceAndBilling/Contract/SearchContract';
import Payment from '../../../../Customer360/InteractionTabs/Payment';
import ProductServiceDetails from './ProductServiceDetails';
import { get, post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { useReactToPrint } from 'react-to-print';
import Modal from 'react-modal';
import OrderContractAgreementPrint from '../../../../OrderManagement/Order360/Components/OrderPrint';
import { getPermissions } from '../../../../../common/util/util';
import WorkOrders from '../../../../Customer360/InteractionTabs/WorkOrders';
Modal.setAppElement('#root')
export default function ContractInformativeView() {
    const [tabType, setTabType] = useState("CustomerInfo");
    const { data: { customerDetails, contractData } } = useContext(Contract360Context);
    const [HelpdeskCount, setHelpdeskCount] = useState(0);
    const [InteractionCount, setInteractionCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0)
    const [contractCount, setcontractCount] = useState(0)
    const [unbilledContractCount, setUnbilledContractCount] = useState(0)
    const [invoiceCount, setinvoiceCount] = useState(0)
    const [PaymentScheduledcount, setPaymentScheduledcount] = useState(0)

    const [pagePermissions, setPagePermissions] = useState([])
    const [componentPermission, setComponentPermission] = useState({})

    const serviceUuid = contractData?.serviceUuid ?? ''
    const getHelpdeskCount = () => {
        try {
            post(`${properties.HELPDESK_API}/count`, { serviceUuid: serviceUuid }).then((response) => {
                if (response?.data) setHelpdeskCount(response?.data)
            }).catch(e => {
                console.log('error', e)
            })
        } catch (e) {
            console.log('error', e)
        }
    }
    const getInteactionCount = () => {
        try {
            post(`${properties.INTERACTION_API}/count`, { serviceUuid: serviceUuid }).then((response) => {
                if (response?.data) setInteractionCount(response?.data)
            }).catch(e => {
                console.log('error', e)
            })
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (serviceUuid) {
            getHelpdeskCount();
            getInteactionCount();
        }
    }, [serviceUuid])

    const [masterDataLookup, setMasterDataLookup] = useState({});

    useMemo(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT")
            .then((resp) => {
                if (resp.data) {
                    setMasterDataLookup({ ...resp.data })
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, []);

    const [generatePdf, setGeneratePdf] = useState(false);
    const [showTermsandCondition, setShowTermsandCondition] = useState(false);
    const componentRef = useRef()

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: () => {
            setGeneratePdf(false);
        },
    });

    const handleGeneratePdf = () => {
        setGeneratePdf(true);
        setTimeout(() => {
            handlePrint();
            // setGeneratePdf(false)
        }, 5000);
    };

    const handleTermsAndCondition=()=>{
        setShowTermsandCondition(true)
    }

    const getOrderCount = useCallback(() => {
        if (contractData?.customer?.customerUuid) {
            get(`${properties.ORDER_API}/counts?customerUuid=${contractData?.customer?.customerUuid}`)
                .then((resp) => {
                    if (resp?.status === 200) {
                        setOrderCount(resp?.data?.count)
                    }
                }).catch((error) => console.error(error))
        }
    }, [contractData?.customer?.customerUuid])

    const getContractCount = useCallback(() => {
        if (contractData?.customer?.customerId) {
            post(`${properties.CONTRACT_API}/billed?limit=&page=`, { contractId: contractData?.contractId })
                .then((resp) => {
                    if (Number(resp?.data?.count) > 0) {
                        const { rows, count } = resp.data;
                        setcontractCount(count)
                    }
                }).catch((error) => console.error(error))

            post(`${properties.CONTRACT_API}/unbilled?limit=&page=`, { contractId: contractData?.contractId })
                .then((resp) => {
                    if (Number(resp?.data?.count) > 0) {
                        const { rows, count } = resp.data;
                        setUnbilledContractCount(count)
                    }
                })
        }
    }, [contractData?.customer?.customerUuid])

    const getInvoiceCount = useCallback(() => {
        if (contractData?.customer?.customerId) {
            post(`${properties.INVOICE_API}/customer/count`, { searchParams: { contractId: contractData?.contractId } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setinvoiceCount(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [contractData?.customer?.customerUuid])

    const getPaymentScheduledCount = useCallback(() => {
        if (contractData?.contractId) {
            post(`${properties.CONTRACT_API}/360/paymentScheduledcount`, { searchParams: { "contractId": contractData?.contractId, "status": "SCHEDULED" } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setPaymentScheduledcount(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [contractData?.contractId])

    useEffect(() => {
        const pemissions = async () => {
            try {
                const permissions = await getPermissions('CONTRACT_360')
                // console.log(permissions)
                setPagePermissions(permissions)
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        }
        pemissions();
        // getInvoiceAmount();
        getOrderCount();
        getContractCount();
        getInvoiceCount()
        getPaymentScheduledCount()
    }, [contractData]);

    return (
        <>
            <div className="skel-self-data">
                <ContractKPI />
                <div className="cmmn-skeleton mt-2">
                    <div className="view-int-details-key skel-tbl-details justify-content-between">
                        <table>
                            <thead>
                                <tr>
                                    <td colSpan={3} className="py-1 px-2 rounded">
                                        <span className="font-weight-bold">
                                            Contract Details
                                        </span>
                                        <hr className="cmmn-hline" />
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Effective Date
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <div className="skel-line-height-auto">
                                            {contractData?.actualStartDate}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">Expiry Date</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {contractData?.actualEndDate}</td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Payment Terms
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{contractData?.contractDetail?.[0]?.durationMonth ?? '-'} {contractData?.contractDetail?.[0]?.frequencyDesc?.description ?? ''}</td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Payment Method
                                        </span>
                                    </td>
                                    <td width="5%">&nbsp;</td>
                                    <td>Card</td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Terms &amp; Conditions
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <a
                                            target="_blank"
                                            className="txt-underline"
                                            onClick={handleTermsAndCondition}
                                        >
                                            View T&amp;C
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Download Contract
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <a onClick={handleGeneratePdf}
                                            target="_blank"
                                            className="txt-underline"
                                        >
                                            <i className="fa fa-file-pdf mr-2" />
                                            Download PDF
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Amendment History
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <a
                                            className="txt-underline amend-history"
                                            data-target="#amend-history"
                                            data-toggle="modal"
                                        >
                                            View History
                                        </a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='ml-4'>
                            <thead>
                                <tr>
                                    <td colSpan={3} className=" py-1 px-2 rounded">
                                        <span className="font-weight-bold">
                                            Service Provider Details
                                        </span>
                                        <hr className="cmmn-hline" />
                                    </td>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">
                                            Business Name
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">Phone Number</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td className="pl-2">
                                        <span className="font-weight-bold">Email ID</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td className="pl-2" colSpan={3}>
                                        <span className="font-weight-bold">Address</span>
                                    </td>
                                </tr>
                                {/*  <tr>
                                    <td className="pl-2">
                                        <div className="w-100">
                                            <iframe
                                                width={300}
                                                className="mt-2"
                                                height={100}
                                                frameBorder={0}
                                                scrolling="no"
                                                marginHeight={0}
                                                marginWidth={0}
                                                src="https://maps.google.com/maps?width=100%25&height=600&hl=en&q=1%20Grafton%20Street,%20Dublin,%20Ireland+(My%20Business%20Name)&t=&z=14&ie=UTF8&iwloc=B&output=embed"
                                            ></iframe>
                                        </div>
                                    </td>
                                    <td width="5%">&nbsp;</td>
                                    {/* <td>
                                        795 Green Ave, Suite 600
                                        <br />
                                        Brunei, 194107
                                    </td> 
                                </tr> */}
                            </tbody>
                        </table>
                    </div>
                </div>
                <ProductServiceDetails />

                <div className="cmmn-skeleton mt-2">
                    <div className="tabbable">
                        <ul className="nav nav-tabs" id="myTab1" role="tablist">
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "CustomerInfo" ? "active" : ""}`}
                                    id="CustomerInfo-tab"
                                    data-toggle="tab"
                                    href="#CustomerInfotab"
                                    role="tab"
                                    aria-controls="CustomerInfotab"
                                    aria-selected="false"
                                    onClick={() => { setTabType("CustomerInfo") }}
                                >
                                    Customer Information
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
                                    className={`nav-link  ${tabType === "BilledContract" ? "active" : ""}`}
                                    id="BilledContract-tab"
                                    data-toggle="tab"
                                    href="#BilledContract"
                                    role="tab"
                                    aria-controls="BilledContract"
                                    aria-selected="false"
                                    onClick={() => { setTabType("BilledContract") }}
                                >
                                    Billed Contract <span className="count">{contractCount}</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "UnbilledContract" ? "active" : ""}`}
                                    id="UnbilledContract-tab"
                                    data-toggle="tab"
                                    href="#UnbilledContract"
                                    role="tab"
                                    aria-controls="UnbilledContract"
                                    aria-selected="false"
                                    onClick={() => { setTabType("UnbilledContract") }}
                                >
                                    Unbilled Contract <span className="count">{unbilledContractCount}</span>
                                </a>
                            </li>
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
                                    Helpdesk <span className="count">{HelpdeskCount}</span>
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
                                    Interaction <span className="count">{InteractionCount}</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "payment" ? "active" : ""}`}
                                    id="payment-tab"
                                    data-toggle="tab"
                                    href="#payment"
                                    role="tab"
                                    aria-controls="paymenttab"
                                    aria-selected="false"
                                    onClick={() => { setTabType("payment") }}
                                >
                                    Payment Scheduled <span className="count">{PaymentScheduledcount}</span>
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link  ${tabType === "logs" ? "active" : ""}`}
                                    id="logicalinfo"
                                    data-toggle="tab"
                                    href="#logicaltab"
                                    role="tab"
                                    aria-controls="logicalinfo"
                                    aria-selected="false"
                                    onClick={() => { setTabType("logs") }}
                                >
                                    Logs{" "}
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="tab-content mt-2">
                        <div
                            className={`tab-pane fade ${tabType === "CustomerInfo" ? "show active" : ""}`}
                            id="CustomerInfotab"
                            role="tabpanel"
                            aria-labelledby="CustomerInfotab"
                        >
                            {tabType === "CustomerInfo" && <CustomerInfo />}
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "Order" ? "show active" : ""}`}
                            id="ordertab"
                            role="tabpanel"
                            aria-labelledby="ordertab"
                        >
                            {tabType === "Order" && <WorkOrders source={'Order360'} data={{ customerDetails }} />}
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "UnbilledContract" ? "show active" : ""}`}
                            id="UnbilledContract"
                            role="tabpanel"
                            aria-labelledby="UnbilledContract"
                        >
                            {tabType === "UnbilledContract" && <SearchContract
                                data={{
                                    data: {
                                        contractId: contractData?.contractId,
                                    },
                                    hideForm: true,
                                    contractType: 'unbilled',
                                    //   refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                                    from: "contract360",
                                }}
                                handler={{
                                    //   pageRefresh: handleContractInvoicePaymentRefresh,
                                }}
                            />}
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "BilledContract" ? "show active" : ""}`}
                            id="BilledContract"
                            role="tabpanel"
                            aria-labelledby="BilledContract"
                        >
                            {tabType === "BilledContract" && <SearchContract
                                data={{
                                    data: {
                                        contractId: contractData?.contractId
                                    },
                                    hideForm: true,
                                    contractType: 'monthlyBilled',
                                    //   refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                                    from: "contract360",
                                }}
                                handler={{
                                    //   pageRefresh: handleContractInvoicePaymentRefresh,
                                }}
                            />}
                        </div>

                        <div
                            className={`tab-pane fade ${tabType === "Helpdesk" ? "show active" : ""}`}
                            id="helpdesktab"
                            role="tabpanel"
                            aria-labelledby="helpdesktab"
                        >
                            {tabType === "Helpdesk" && <Helpdesk
                                source={'Contract360'}
                                data={{ subscriptionDetails: { serviceUuid: serviceUuid }, }}
                            />}

                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "Interaction" ? "show active" : ""}`}
                            id="interaction"
                            role="tabpanel"
                            aria-labelledby="interactiontab"
                        >
                            {tabType === "Interaction" && <Interactions
                                source={'Order360'}
                                data={{ subscriptionDetails: { serviceUuid: serviceUuid }, }}
                            />}
                        </div>


                        <div
                            className={`tab-pane fade ${tabType === "payment" ? "show active" : ""}`}
                            id="payment"
                            role="tabpanel"
                            aria-labelledby="payment"
                        >
                            {tabType === "payment" && <Payment data={{
                                selectedAccount: {
                                    status: "SCHEDULED",
                                    contractId: contractData?.contractId,
                                }
                            }} />}
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "Invoice" ? "show active" : ""}`}
                            id="invoicetab"
                            role="tabpanel"
                            aria-labelledby="invoicetab"
                        >
                            {/* {tabType === "Invoice" && customerDetails && customerDetails?.customerAccounts?.length ? (
                            <SearchInvoice
                                data={{
                                    data: {
                                        customerUuid: customerDetails?.customerUuid,
                                        customerDetails,
                                        startDate: null,
                                        endDate: null,
                                        billingStatus: statusConstantCode?.status?.PENDING,
                                        billingStatusCondition: 'notIn',
                                    },
                                    hideForm: true,
                                    tabType,
                                    // refresh: pageRefreshHandlers.contractInvoicePaymentRefresh,
                                    from: "Order360",
                                }}
                            />
                        ) : (
                            <span className="msg-txt pt-1">
                                No Invoice Available
                            </span>
                        )} */}
                        </div>
                        <div
                            className={`tab-pane fade ${tabType === "LogicalInformation" ? "show active" : ""}`}
                            id="logicaltab"
                            role="tabpanel"
                            aria-labelledby="logicalinfo"
                        >
                            {/* <LogicalInfromation /> */}
                        </div>
                    </div>
                </div>
            </div>
            {generatePdf && (
                <Modal isOpen={generatePdf}>
                    <OrderContractAgreementPrint
                        data={contractData}
                        ref={componentRef}
                        source={"CONTRACT_360"}
                        handler={{
                            handlePreviewCancel: false,
                            handlePrint: false,
                            masterDataLookup
                        }}
                    />
                </Modal>
            )}
        </>
    )
}
