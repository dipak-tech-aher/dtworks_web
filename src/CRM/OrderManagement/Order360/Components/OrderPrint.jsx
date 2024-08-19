import React, { useEffect, useMemo, useState } from "react";
import moment from 'moment'
import AddressDetailsFormViewMin from "../../../Address/AddressDetailsFormViewMin";
import { get, post } from "../../../../common/util/restUtil";
import { properties } from "../../../../properties";
import logo from "../../../../assets/images/dtWorks_logo.png"
import parse from 'html-react-parser';



const OrderContractAgreementPrint = React.forwardRef((props, ref) => {
    const data = props?.data;
    const masterDataLookup = props?.handler?.masterDataLookup
    const [orderDetails, setOrderDetails] = useState({});
    const [customerDetails, setCustomerDetails] = useState({});
    const [orderProductDetails, setOrderProductDetails] = useState([]);
    const [contractDetails, setContractDetails] = useState([]);
    const [scheduledContract, setScheduledContract] = useState([]);
    const [totalAmount, setTotalAmount] = useState({
        RC: 0,
        NRC: 0
    });
    const [termsAndConditions, setTermsAndConditions] = useState()

    console.log(data)

    useEffect(() => {
        if (props?.source === 'ORDER_360' && data) {
            setOrderDetails(data)
            setOrderProductDetails(data?.orderProductDetails);
            setCustomerDetails(data?.customerDetails)
        } else if (props?.source === 'CONTRACT_360' && data) {
            setCustomerDetails(data?.customer)
            setContractDetails([data])
            setTotalAmount({ RC: data?.rcAmount, NRC: data?.otcAmount })

        }
    }, [props?.source, data]);

    console.log('orderProductDetails ', orderProductDetails)
    useEffect(() => {
        const fetchData = async () => {
            if (data?.orderId) {
                try {
                    const contractResp = await post(`${properties.CONTRACT_API}/search?limit=&page=`, { orderId: data.orderId });
                    if (Number(contractResp?.data?.count) > 0) {
                        const { rows } = contractResp.data;
                        const amt = rows?.reduce((acc, curr) => {
                            acc.RC += Number(curr?.rcAmount);
                            acc.NRC += Number(curr?.otcAmount);
                            return acc;
                        }, { RC: 0, NRC: 0 });
                        console.log('rows ', rows)
                        setTotalAmount(amt);
                        setContractDetails(rows);

                        const productIds = rows.flatMap(row => row.contractDetail.map(detail => detail.productId));
                        const productResp = await post(`${properties.PRODUCT_API}/get-product-details`, { productIds });

                        setTermsAndConditions(productResp.data.rows[0]?.termDtl);

                        const scontracts = [];
                        for (const contract of rows) {
                            const historyResp = await post(`${properties.CONTRACT_API}/history?limit=&page=`, { contractId: contract.contractId });
                            scontracts.push(...historyResp.data.rows);
                        }
                        setScheduledContract(scontracts);
                    }
                } catch (error) {
                    console.error(error);
                }
            } else if (data?.soId) {
                try {
                    const orderResp = await post(`${properties.ORDER_API}/search?limit=&page=`, { searchParams: { orderId: data.soId } });
                    if (Number(orderResp?.data?.count) > 0) {
                        console.log('orderResp', orderResp)
                        setOrderDetails(orderResp?.data?.row?.[0])
                        setOrderProductDetails(orderResp?.data?.row?.[0].orderProductDetails)
                        const productIds = data.contractDetail?.map(detail => detail.productId);
                        const productResp = await post(`${properties.PRODUCT_API}/get-product-details`, { productIds });
                        setTermsAndConditions(productResp.data.rows[0]?.termDtl);

                        const historyResp = await post(`${properties.CONTRACT_API}/history?limit=&page=`, { contractId: data.contractId });
                        setScheduledContract(historyResp.data.rows);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        };

        fetchData();
    }, [data]);

    const styles = {
        block: {
            backgroundColor: 'rgb(246, 246, 246)',
            border: '1px solid rgb(217, 217, 217)',
            marginTop: '10px',
            padding: '10px 20px',
            marginBottom: '10px',
            borderRadius: '6px'
        },
        header: {
            color: 'rgb(0, 0, 0)',
            fontWeight: 600
        }
    };
    return (
        <div className="" ref={ref}>
            <div className="contr-header-details page-header">
                <div style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
                    <table width="100%" className="skel-tbl-header-sect">
                        <tbody>
                            <tr className="flex-algn-cnt">
                                <td>
                                    <div className="print-logo">
                                        <img src={logo} alt="" width="250px" height="auto" className="img-fluid" />
                                    </div>
                                </td>
                                <td className="">
                                    <div style={{ display: 'flex', alignContent: 'center', flexFlow: 'column' }}>
                                        <span className="pdf-title-report pl-0 pb-0">Contract Agreement</span>
                                        <p className="mb-0">Date: {moment().format('DD MMMM YYYY')}</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <hr className="cmmn-hline mt-2 mb-3" />
                    <table width="100%" className="skel-tbl-header-sect">
                        <tbody>
                            <tr>
                                <td className="table-border pr-2" colSpan="2">
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', textAlign: 'left' }}>
                                        <table width="100%">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{customerDetails?.firstName} {customerDetails?.lastName}</strong>
                                                                            <br />
                                                                            {customerDetails?.customerNo}
                                                                            <br />
                                                                            {customerDetails?.customerContact?.[0].emailId}
                                                                            <br />
                                                                            {customerDetails?.customerContact?.[0].mobileNo}
                                                                            <br />
                                                                            <AddressDetailsFormViewMin data={{ addressDetails: customerDetails?.customerAddress?.[0] }} />
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                                <td className="table-border pr-2" colSpan="2">
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
                                        <table width="100%">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div>
                                                                            <strong>Service Provider</strong>
                                                                            <br />
                                                                            {orderDetails?.serviceProviderEmail}
                                                                            <br />
                                                                            {orderDetails?.serviceProviderPhone}
                                                                            <br />
                                                                            {orderDetails?.serviceProviderAddress}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="page cntrt-content">
                <table className="pdf-cust-info">
                    <thead>
                        <tr>
                            <td>
                                <div className="page-header-space"></div>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div className="pdf-a4-cnt">
                                    <div id="block">
                                        <table width="100%">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table className="w-100 skel-tbl-cmmn-brd mt-4">
                                                            <thead>
                                                                <tr>
                                                                    <th>Service no.</th>
                                                                    <th>Product Name</th>
                                                                    <th>Product Benefits</th>
                                                                    <th>Contract</th>
                                                                    <th>Quantity</th>
                                                                    <th>RC</th>
                                                                    <th>NRC</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {orderProductDetails?.map((service, index) => (
                                                                    <tr key={index}>
                                                                        <td>{service?.serviceDetails?.serviceNo}</td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                <strong>{service?.productDetails?.productName}</strong>
                                                                                <span>Product Type: {service?.productDetails?.productType?.description}</span>
                                                                                <span>Product Category: {service?.productDetails?.productCategory?.description}</span>
                                                                                <span>Service Type: {service?.productDetails?.serviceType?.description}</span>
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                {
                                                                                    service?.serviceDetails?.actualProductBenefit?.benefits?.map((val, key) => (
                                                                                        <span key={key}>{masterDataLookup.PRODUCT_BENEFIT.find(f => f.code === val?.name)?.description}: {val?.value}</span>
                                                                                    ))
                                                                                }
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                <span>{service?.serviceDetails?.actualProductBenefit?.contract} Months</span>
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                <span>{service?.serviceDetails?.quantity}</span>
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                <span>${Number(service.rcAmount).toFixed(2) || 0}</span>
                                                                            </p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name">
                                                                                <span>${Number(service.nrcAmount).toFixed(2) || 0}</span>
                                                                            </p>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr>
                                                                    <td colSpan="5" align="right" className="txt-rht">
                                                                        <p className="skel-print-prdt-name" style={{ fontSize: '16px' }}>
                                                                            <strong>Total Amount</strong>
                                                                        </p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="skel-print-prdt-name" style={{ fontSize: '16px' }}>
                                                                            <strong>${totalAmount.RC}</strong>
                                                                        </p>
                                                                    </td>
                                                                    <td>
                                                                        <p className="skel-print-prdt-name" style={{ fontSize: '16px' }}>
                                                                            <strong>${totalAmount.NRC}</strong>
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <span className="skel-header-title mt-3">Contract Period</span>
                                        <table width="100%" className="">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table className="w-100 skel-tbl-cmmn-brd mt-1">
                                                            <thead>
                                                                <tr>
                                                                    <th>Planned Start Date</th>
                                                                    <th>Planned End Date</th>
                                                                    <th>Actual Start Date</th>
                                                                    <th>Actual End Date</th>
                                                                    <th>Duration</th>
                                                                    <th>Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {contractDetails && contractDetails.map((val, key) => (
                                                                    val.contractDetail.map((c, i) => (
                                                                        <tr key={i}>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.plannedStartDate}</span>
                                                                                </p>
                                                                            </td>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.plannedEndDate}</span>
                                                                                </p>
                                                                            </td>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.actualStartDate}</span>
                                                                                </p>
                                                                            </td>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.actualEndDate}</span>
                                                                                </p>
                                                                            </td>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.durationMonth}</span>
                                                                                </p>
                                                                            </td>
                                                                            <td>
                                                                                <p className="skel-print-prdt-name">
                                                                                    <span>{c.currencyDesc} {(Number(c.chargeAmt)).toFixed(2)}</span>
                                                                                </p>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <span className="skel-header-title mt-3">Scheduled Details</span>
                                        <table width="100%" className="">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table className="w-100 skel-tbl-cmmn-brd mt-1">
                                                            <thead>
                                                                <tr>
                                                                    <th>Scheduled Billings</th>
                                                                    <th>Start Date</th>
                                                                    <th>End Date</th>
                                                                    <th>Due Date</th>
                                                                    <th>Status</th>
                                                                    <th>Amount</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {scheduledContract && scheduledContract.map((billing, index) => (
                                                                    <tr key={index}>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{billing.noOfBillings}</span></p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{billing.actualStartDate}</span></p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{billing.actualEndDate}</span></p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{billing.dueDate}</span></p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{billing.statusDesc?.description}</span></p>
                                                                        </td>
                                                                        <td>
                                                                            <p className="skel-print-prdt-name"><span>{(Number(billing.totalCharge).toFixed(2))}</span></p>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {
                                        termsAndConditions && termsAndConditions.map((val, i) => (
                                            <div key={i}>
                                                {val?.contractImpact && <div className="mt-3" id="block"
                                                    style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Contract Impact</h4>
                                                    <p>{parse(String(val?.contractTermsContent || '<p>-</p>').trim())}</p>
                                                </div>}
                                                {val?.paymentImpact && <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Payment Impact</h4>
                                                    <p>{parse(String(val?.paymentTermsContent || '<p>-</p>').trim())}</p>
                                                </div>}
                                                {val?.billingImpact && <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Billing Impact</h4>
                                                    <p>{parse(String(val?.billingTermsContent || '<p>-</p>').trim())}</p>
                                                </div>}
                                                {val?.benefitsImpact && <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Benefits Impact</h4>
                                                    <p>{parse(String(val?.benefitsTermsContent || '<p>-</p>').trim())}</p>
                                                </div>}
                                                <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Uptime Guarantee</h4>
                                                    <p>{parse(String(val?.uptimeTermsContent || '<p>-</p>').trim())}</p>
                                                </div>
                                                <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Renewal Terms</h4>
                                                    <p>{parse(String(val?.renewalTermsContent || '<p>-</p>').trim())}</p>
                                                </div>
                                                <div id="block" style={styles.block}>
                                                    <h4 className="skel-header-title" style={styles.header}>Terms and Conditions</h4>
                                                    <p>{parse(String(val?.termsContent || '<p>-</p>').trim())}</p>
                                                </div>
                                            </div>
                                        ))


                                    }

                                    <div className="form-group mt-4">
                                        <span className="skel-header-title mt-2 mb-4">Signature</span>
                                        {/* <img src={data?.sign} alt="" className="img-fluid" /> */}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
})
export default OrderContractAgreementPrint;