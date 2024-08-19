import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Order360Context } from '../../../../../AppContext';
import _ from 'lodash'
import { Tab, Tabs } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from '../../../../../properties';
import { get, post } from '../../../../../common/util/restUtil';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ReceivedVsFulfilled from './received-vs-fulfilled';
import CreatedVsCancelled from './created-vs-cancelled';
import ClosureVsBillingStart from './closure-vs-billingstart';
import OrderVsBilled from './order-vs-billed';
import OrderJourney from './OrderJourney';
import { toast } from 'react-toastify';

export default function Order360InsightView() {
    const { data } = useContext(Order360Context);
    console.log("order details => ", data)
    const { orderData, customerDetails } = data;

    const [currentView, setCurrentView] = useState('current_order');
    const [selectedProductId, setSelectedProductId] = useState(orderData?.orderProductDetails?.[0]?.productDetails?.productId);
    const [totalBillingContractValue, setTotalBillingContractValue] = useState(0);
    const [totalInvoiceValue, setTotalInvoiceValue] = useState(0);
    const [amount, setAmount] = useState({});
    const [customerCount, setCustomerCount] = useState(0);
    const [scheduleContract, setScheduleContract] = useState([]);
    const [selectedContract, setSelectedContract] = useState({});
    const [showOrderWorkflow, setShowOrderWorkflow] = useState(false);
    const [orderWorkflow, setOrderWorkflow] = useState({});

    useEffect(() => {
        console.log(currentView, selectedProductId)
        const orderProductDetails = orderData?.orderProductDetails?.find(x => x.serviceDetails?.productId == selectedProductId);
        const serviceUuid = orderProductDetails?.serviceDetails?.serviceUuid;
        post(`${properties.CONTRACT_API}/get-scheduled-contracts`, { view: currentView, serviceUuid: serviceUuid, productId: selectedProductId }).then((response) => {
            if (response?.data && response?.data?.rows?.length) {
                let contractValue = 0;
                for (const contract of response?.data.rows) {
                    contractValue += Number(contract.rcAmount) + Number(contract.otcAmount);
                }
                unstable_batchedUpdates(() => {
                    setTotalBillingContractValue(contractValue);
                })
            } else {
                setTotalBillingContractValue(0);
            }
        }).catch((error) => {
            console.error(error);
        });

        post(`${properties.INVOICE_API}/productWiseInvoice/`, { view: currentView, serviceUuid: serviceUuid, productId: selectedProductId }).then((response) => {
            if (response?.data?.invoiceAmount) {
                setTotalInvoiceValue(response?.data?.invoiceAmount);
            } else {
                setTotalInvoiceValue(0);
            }
        }).catch((error) => {
            console.error(error);
        });

        let rcAmount = 0, nrcAmount = 0, totalAmount = 0;
        if (currentView === 'current_order') {
            rcAmount = Number(orderProductDetails?.rcAmount ?? 0);
            nrcAmount = Number(orderProductDetails?.nrcAmount ?? 0);
            totalAmount = rcAmount + nrcAmount;
            setAmount({ rcAmount, nrcAmount, totalAmount });

            get(`${properties.CONTRACT_API}/get-scheduled-contracts?customerUuid=${customerDetails?.customerUuid}&orderUuid=${orderProductDetails?.orderUuid}&productId=${selectedProductId}`).then((response) => {
                if (response?.data?.rows?.length) {
                    unstable_batchedUpdates(()=>{
                        setScheduleContract(response?.data?.rows);
                        setSelectedContract(response?.data?.rows[0]);
                    })
                } else {
                    setScheduleContract([]);
                }
            }).catch((error) => {
                console.error(error);
            });

            post(`${properties.ORDER_API}/flow/${orderData?.orderNo}`).then((resp) => {
                if (resp.data) {
                    setOrderWorkflow({ ...resp.data, source: "ORDER" });
                }
            }).catch((error) => console.error(error));
        } else if (currentView === 'product_overview') {
            post(`${properties.ORDER_API}/getProductWiseOrderAmount`, { productId: selectedProductId }).then((response) => {
                if (response?.data?.length) {
                    for (const order of response?.data) {
                        rcAmount += Number(order?.rcAmount ?? 0);
                        nrcAmount += Number(order?.nrcAmount ?? 0);
                        totalAmount = rcAmount + nrcAmount;
                    }
                    setAmount({ rcAmount, nrcAmount, totalAmount });
                } else {
                    setAmount({ rcAmount, nrcAmount, totalAmount });
                }
            }).catch((error) => {
                console.error(error);
            });

            post(`${properties.ORDER_API}/customerCountByProduct`, { productId: selectedProductId }).then((response) => {
                if (response?.data?.count) {
                    setCustomerCount(response?.data?.count);
                } else {
                    setCustomerCount(0);
                }
            }).catch((error) => {
                console.error(error);
            });
        }
    }, [currentView, selectedProductId])

    const selectContract = (e) => {
        setSelectedContract(scheduleContract.find(x => x.contractStartDate == e.target.id));
    }

    const generateContractList = (val, idx) => {
        const classNames = {
            CONTR_ST_CLOSED: 'cntr-done',
            CONTR_ST_OPEN: 'cntr-currnt'
        }
        return (
            <li className={classNames[val.status] ?? ''} id={val.contractStartDate} onClick={selectContract} key={idx}>{val.contractStartDate}</li>
        )
    }

    function arrayBufferToString(buffer) {
        var arr = new Uint8Array(buffer);
        var str = String.fromCharCode.apply(String, arr);
        if (/[\u0080-\uffff]/.test(str)) {
            throw new Error("this string seems to contain (still encoded) multibytes");
        }
        return str;
    }

    const downloadFile = (serviceDetails, base64String) => {
        var link = document.createElement("a");
        var serviceUuid = `service_agreement_download_${serviceDetails?.serviceUuid}`;
        link.id = serviceUuid
        link.href = base64String;
        link.download = `${serviceDetails?.serviceName}.png`;
        link.click();
    }

    const downloadAgreement = (serviceDetails) => {
        try {
            const bufferArray = serviceDetails?.serviceAgreement?.data;
            console.log(bufferArray);
            const base64String = arrayBufferToString(bufferArray);
            console.log(base64String);
            downloadFile(serviceDetails, base64String);
        } catch (error) {
            console.log(error);
            toast.error("Error in downloading service agreement")
        }
    }

    return (
        <div className="skel-informative-data mt-2 mb-2">
            <span className="skel-header-title d-flex flex-direction-row" style={{ width: '100%' }}>
                Product Details
                <span className='skel-ord-ins-toggle'>
                    <ToggleButtonGroup type="radio" name="options" defaultValue={'current_order'} onChange={setCurrentView}>
                        <ToggleButton id="current_order" value={'current_order'} className={currentView == 'current_order' ? '' : 'skel-toggl-disabled'}>Current Order</ToggleButton>
                        <ToggleButton id="product_overview" value={'product_overview'} className={currentView == 'product_overview' ? '' : 'skel-toggl-disabled'}>Product Overview</ToggleButton>
                    </ToggleButtonGroup>
                </span>
            </span>
            <div className="row mx-lg-n1">
                <div className="col-md-12 mb-2 px-lg-1">
                    <div className="cmmn-skeleton h-100">
                        <Tabs defaultActiveKey={selectedProductId} className="mb-3" onSelect={setSelectedProductId}>
                            {orderData?.orderProductDetails?.map(orderProductDetails => {
                                const serviceDetails = orderProductDetails?.serviceDetails;
                                const productDetails = orderProductDetails?.productDetails;
                                const customerDetails = orderProductDetails?.customerDetails;
                                const customerContactDetails = customerDetails?.customerContact?.[0];
                                const { address1 = '', address2 = '', address3 = '', city = '', country = '', postcode = '' } = serviceDetails?.addressDetails ?? {};
                                const serviceContactDetails = serviceDetails?.contactDetails;
                                const phoneNo = serviceContactDetails ? serviceContactDetails?.mobileNo : customerContactDetails?.mobileNo;
                                const address = `${address1}, ${address2 ?? ''}, ${address3 ?? ''}`;
                                return (
                                    <Tab className="tab-content mt-2" eventKey={serviceDetails?.productId} title={serviceDetails?.serviceName} key={productDetails?.productId}>
                                        <div className="skel-ord-prd-insht-view">
                                            <div className="skel-prd-sect-info">
                                                <div className="skel-prd-img-prd-nm">
                                                    <img src={productDetails?.productImage} alt="" className="img-fluid" />
                                                    <div className="skel-prdt-details-sect">
                                                        <div className="skel-prd-title-info">
                                                            <span className="skel-header-title txt-ellips-lg">{serviceDetails?.serviceName} </span>
                                                            {currentView == 'current_order' ? (
                                                                <span className="skel-gry-info">{orderProductDetails?.orderNo}</span>
                                                            ) : (
                                                                <span className="skel-gry-info">Total Customers: <strong>{customerCount}</strong></span>
                                                            )}

                                                        </div>
                                                        <div className="bussiness-info">
                                                            <span className="bussiness-type">{productDetails?.productCategory?.description ?? 'N/A'}</span>
                                                            <span className="profile-status">{productDetails?.productSubCategory?.description ?? 'N/A'}</span>
                                                        </div>
                                                        {currentView == 'current_order' && (
                                                            <span className="skel-gry-info cursor-pointer" onClick={() => downloadAgreement(serviceDetails)}>View Agreement</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="skel-prdt-pckg-info">
                                                    <ul>
                                                        <li>{productDetails?.productType?.description}</li>
                                                        <li>{productDetails?.serviceType?.description}</li>
                                                        <li>QTY: {serviceDetails?.quantity ?? 0}</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <div className="skel-header-title"> Service Address Details </div>
                                                    <div className="skel-srv-add-details">
                                                        <iframe width={150} height={100} src={`https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${address + ',' + city + ', ' + country + ', ' + postcode}&t=&z=14&ie=UTF8&iwloc=B&output=embed&isableDefaultUI=${true}`}></iframe>
                                                        <div className="ml-2"> {customerDetails?.firstName ?? ''} {customerDetails?.lastName ?? ''} <br /> {address} <br /> {city ?? ''},&nbsp;{country ?? ''},&nbsp;
                                                            {postcode ?? ''} <br /> P: {phoneNo} <br />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row mx-lg-n1 service-360-tiles mt-4">
                                            <div className="col-md px-lg-1">
                                                <div className="cmmn-skeleton tr m-0">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-auto">
                                                            <div className="icon">
                                                                <i className="fa fa-dollar-sign" />
                                                            </div>
                                                        </div>
                                                        <div className="col-md pl-0">
                                                            <p className="mb-0"> Total Billing <br /> Contract </p>
                                                            <p className="mb-0 font-weight-bold">{customerDetails?.currency?.mappingPayload?.symbol || '$'}{totalBillingContractValue ?? 0}</p>
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
                                                            <p className="mb-0"> Total RC <br /> Amount </p>
                                                            <p className="mb-0 font-weight-bold">{customerDetails?.currency?.mappingPayload?.symbol || '$'}{amount?.rcAmount ?? 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md px-lg-1">
                                                <div className="cmmn-skeleton top m-0">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-auto">
                                                            <div className="icon">
                                                                <i className="fa fa-dollar-sign" />
                                                            </div>
                                                        </div>
                                                        <div className="col-md pl-0">
                                                            <p className="mb-0"> Total NRC <br /> Amount </p>
                                                            <p className="mb-0 font-weight-bold">{customerDetails?.currency?.mappingPayload?.symbol || '$'}{amount?.nrcAmount ?? 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md px-lg-1">
                                                <div className="cmmn-skeleton taa m-0">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-auto">
                                                            <div className="icon">
                                                                <i className="fa fa-dollar-sign" />
                                                            </div>
                                                        </div>
                                                        <div className="col-md pl-0">
                                                            <p className="mb-0"> Total Paid <br /> Amount </p>
                                                            <p className="mb-0 font-weight-bold">{customerDetails?.currency?.mappingPayload?.symbol || '$'}{amount?.totalAmount ?? 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md px-lg-1">
                                                <div className="cmmn-skeleton oe m-0">
                                                    <div className="row align-items-center">
                                                        <div className="col-md-auto">
                                                            <div className="icon">
                                                                <i className="fa fa-dollar-sign" />
                                                            </div>
                                                        </div>
                                                        <div className="col-md pl-0">
                                                            <p className="mb-0"> Total Invoice <br /> Amount </p>
                                                            <p className="mb-0 font-weight-bold">{customerDetails?.currency?.mappingPayload?.symbol || '$'}{totalInvoiceValue ?? 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="cmmn-hline mt-3" />
                                        {currentView === 'current_order' && (
                                            <div className="skel-order-insights-sect">
                                                <span className="skel-header-title">Order Insights</span>
                                                <div className="row">
                                                    <div className="col-8">
                                                        <ul>
                                                            {scheduleContract?.map(generateContractList)}
                                                        </ul>
                                                    </div>
                                                    <div className="col-4">
                                                        <div style={{ width: "100%", overflowY: "auto", whiteSpace: "nowrap" }}>
                                                            <table role="table" className="table cmmn-skel-tbl-lyt table-responsive table-striped dt-responsive nowrap w-100 skel-cust-table-dyn" style={{ marginLeft: 0 }}>
                                                                <thead className="sticky-header">
                                                                    <tr role="row">
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>Billing Status</span>
                                                                        </th>
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>Start Date</span>
                                                                        </th>
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>End Date</span>
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody role="rowgroup">
                                                                    <tr role="row" className="" style={{ whiteSpace: "pre-wrap" }}>
                                                                        <td className="">
                                                                            <span>{selectedContract?.statusDesc?.description ?? '-'}</span>
                                                                        </td>
                                                                        <td className="">
                                                                            <span>{selectedContract?.contractStartDate ?? '-'}</span>
                                                                        </td>
                                                                        <td className="">
                                                                            <span>{selectedContract?.contractEndDate ?? '-'}</span>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div style={{ width: "100%", overflowY: "auto", whiteSpace: "nowrap" }}>
                                                            <table role="table"
                                                                className="cmmn-skel-tbl-lyt table table-responsive table-striped dt-responsive nowrap w-100 skel-cust-table-dyn"
                                                                style={{ marginLeft: 0 }}>
                                                                <thead className="sticky-header">
                                                                    <tr role="row">
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>RC Amount</span>
                                                                        </th>
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>OTC Amount</span>
                                                                        </th>
                                                                        <th colSpan={1} role="columnheader">
                                                                            <span>Total Amount</span>
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody role="rowgroup">
                                                                    <tr role="row" className="" style={{ whiteSpace: "pre-wrap" }}>
                                                                        <td className="">
                                                                            <span>{!isNaN(selectedContract?.rcAmount) ? '$' + parseFloat(selectedContract?.rcAmount) : '-'}</span>
                                                                        </td>
                                                                        <td className="">
                                                                            <span>{!isNaN(selectedContract?.otcAmount) ? '$' + parseFloat(selectedContract?.otcAmount) : '-'}</span>
                                                                        </td>
                                                                        <td className="">
                                                                            <span>
                                                                                <b>{!isNaN(selectedContract?.rcAmount) && !isNaN(selectedContract?.otcAmount) ? ('$' + (parseFloat(selectedContract?.rcAmount) + parseFloat(selectedContract?.otcAmount))) : '-'}</b>
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                                <hr className="cmmn-hline mt-3" />
                                                <div id="searchBlock" style={{ display: showOrderWorkflow ? '' : 'none' }}>
                                                    <span className="skel-header-title">Order Workflow Details</span>
                                                    <div className="skel-workflow-sect">
                                                        <img src="./assets/images/workflow-sample.jpg" alt="" className="img-fluid" />
                                                        <OrderJourney data={orderWorkflow} provision={productDetails?.provisioningType?.description || ''} height="100%" width="100%" type="small" />
                                                    </div>
                                                </div>
                                                <a className="cursor-pointer mt-2 d-flex" onClick={() => setShowOrderWorkflow(!showOrderWorkflow)}>
                                                    <div style={{ float: "left" }} className="txt-underline">
                                                        {showOrderWorkflow ? 'Hide' : 'View'} Order Worflow Details
                                                    </div>
                                                </a>
                                            </div>
                                        )}
                                    </Tab>
                                )
                            })}
                        </Tabs>
                    </div>
                </div>
                {currentView === 'product_overview' && (
                    <React.Fragment>
                        <div className="col-md-6 mb-2 px-lg-1">
                            <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                    <span className="skel-header-title"> Order Received vs Order Fulfill date </span>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-graph-sect mt-2">
                                    <ReceivedVsFulfilled data={{ selectedProductId }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-2 px-lg-1">
                            <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                    <span className="skel-header-title"> Order Created vs Order Cancelled </span>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-graph-sect mt-2">
                                    <CreatedVsCancelled data={{ selectedProductId }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-2 px-lg-1">
                            <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                    <span className="skel-header-title"> Order Closure vs Billing Start date </span>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-graph-sect mt-2">
                                    <ClosureVsBillingStart data={{ selectedProductId }} />
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6 mb-2 px-lg-1">
                            <div className="cmmn-skeleton h-100">
                                <div className="skel-dashboard-title-base">
                                    <span className="skel-header-title">Order Value vs Billed Value</span>
                                </div>
                                <hr className="cmmn-hline" />
                                <div className="skel-graph-sect mt-2">
                                    <OrderVsBilled data={{ selectedProductId }} />
                                </div>
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </div>
    )
}