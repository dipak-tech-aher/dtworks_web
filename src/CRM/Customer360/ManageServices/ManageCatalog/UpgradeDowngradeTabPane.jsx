import React, { useContext, useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { properties } from '../../../../properties';
import { get, post, put } from '../../../../common/util/restUtil';
import moment from 'moment'
import { useRef } from 'react';
import { statusConstantCode } from '../../../../AppConstants';
import ProductList from '../../../ServiceManagement/ProductList';
import HtmlToPlainText from '../../../../common/HtmlToPlainText';
import { CreateOrderContext } from '../../../../AppContext';
import { useHistory } from '../../../../common/util/history';

const UpgradeDowngradeTabPane = (props) => {
    const history = useHistory()

    const { data, handler } = useContext(CreateOrderContext)

    const { serviceDetails, orderType, productBenefitLookup = [], productDetails, customerDetails,
        countries, selectedAppointmentList, productList, stats, termsAndCond, selectedProducts,
        activeTab, orderNo, agreementDetail, openOrders, totalOutstanding, productCategory, originalProductList } = data
    const { handleAddProduct, setSelectedAppointmentList, setOriginalProductList,
        handleIncreaseProduct, handleDecreaseProduct, setProductList, handleManualProductChange,
        setSelectedProducts, setAgreementDetail, getRCChargeAmount, getNRCChargeAmount, setProductCategory } = handler;

    const [newProductContractStartDate, setNewProductContractStartDate] = useState("")
    const [newProductContractEndDate, setNewProductContractEndDate] = useState("")

    const [customerTerm, setCustomerTerm] = useState(false)

    const selectedContract = selectedProducts?.[0]?.selectedContract?.[0];
    const selectedProductBenefits = selectedProducts?.[0]?.productBenefit?.find(pb => pb.contract == selectedContract);

    const agreementText =
        'This free Sample Terms of Use Template is available for download and includes these sections: Introduction Definitions Acknowledgment User Accounts Content Copyright Policy Intellectual Property User Feedback Links to Other Websites Termination Limitation of Liability "AS IS" and "AS AVAILABLE" Disclaimer Governing Law Disputes Resolution Severability and Waiver Changes Contact Information';

    const [agreement, setAgreement] = useState(agreementText)

    const [showAllBenefits, setShowAllBenefits] = useState(false);

    const toggleBenefitsView = () => {
        setShowAllBenefits(prevState => !prevState);
    };

    const benefitsToShow = showAllBenefits
        ? serviceDetails?.actualProductBenefit
        : serviceDetails?.actualProductBenefit?.slice(0, 1);

    useEffect(() => {
        if (selectedProducts.length) {
            const currentDate = moment().format('YYYY-MM-DD')
            setNewProductContractStartDate(currentDate)
            const calculateEndDate = moment().add(selectedContract, 'months').format('YYYY-MM-DD');
            setNewProductContractEndDate(calculateEndDate)
        }
    }, [selectedProducts])

    useEffect(() => {
        const termList = []
        selectedProducts.forEach((m) => {
            m?.termsList?.length > 0 && m?.termsList?.forEach((t) => {
                if (t) {
                    termList.push(t);
                }
            });
        });
        const reqBody = {
            termsList: termList
        }
        post(properties.PRODUCT_API + '/get-terms', reqBody).then((resp) => {
            if (resp.status === 200) {
                let termText = ''
                for (const prod of selectedProducts) {
                    if (prod.termsList) {
                        for (const term of prod.termsList) {
                            for (const termData of resp.data) {
                                if (termData.termId == term && termData.entityType == 'OT_SU') {
                                    termText += prod.productName + '\n' + termData.termsContent + '\n\n'
                                }
                            }
                        }
                    }
                }
                if (termText == '') {
                    termText = agreementText
                }
                setAgreement(termText)

            }
        }).catch((error) => {
            console.log(error)
        })
    }, [])

    useEffect(() => {
        setSelectedProducts([]);
        setAgreementDetail({});
    }, [orderType])

    const isDayNoExceeded = (agreeDtl) => {
        let selectedServiceActivatedOn = serviceDetails?.activationDate;
        var startDate = moment(selectedServiceActivatedOn, "YYYY-MM-DD");
        var endDate = moment();
        var dayDiff = endDate.diff(startDate, 'days');
        return (dayDiff < agreeDtl.noOfDays);
    }

    useEffect(() => {
        if ([statusConstantCode.orderType.upgrade, statusConstantCode.orderType.downgrade].includes(orderType) && selectedProducts?.length > 0) {
            let serviceType = selectedProducts[0].serviceType;
            setAgreementDetail({});
            get(properties.MASTER_API + `/template/get-terms-conditions?entityType=${orderType}&serviceType=${serviceType}`).then((response) => {
                if (response?.data?.length) {
                    let agreeDtl = response?.data[0];
                    setAgreementDetail(agreeDtl);
                    if (isDayNoExceeded(agreeDtl)) {
                        toast.error("You can Upgrade/Downgrade only after " + agreeDtl.noOfDays + " days from the date of activation"); return;
                    }
                }
            }).catch((error) => {
                console.error("error", error)
            }).finally()
        }
    }, [selectedProducts])

    const hasExternalSearch = useRef(false);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const isTableFirstRender = useRef(true);

    const [existingContracts, setExistingContracts] = useState([]);
    const [futureContracts, setFutureContracts] = useState([]);

    const combineBenefits = (actualBenefits, selectedBenefits) => {
        const unifiedBenefits = {};

        // Collect all unique benefit names
        actualBenefits && actualBenefits.length > 0 && actualBenefits?.forEach(benefit => {
            unifiedBenefits[benefit.name] = { existing: benefit.value, new: '-' };
        });

        selectedBenefits && selectedBenefits?.benefits?.length > 0 && selectedBenefits?.benefits.forEach(benefit => {
            if (unifiedBenefits[benefit.name]) {
                unifiedBenefits[benefit.name].new = benefit.value;
            } else {
                unifiedBenefits[benefit.name] = { existing: '-', new: benefit.value };
            }
        });

        return unifiedBenefits;
    };

    const actualProductBenefits = serviceDetails?.actualProductBenefit || [];

    const combinedBenefits = combineBenefits(actualProductBenefits, selectedProductBenefits);

    const [selectedCategory, setSelectedCategory] = useState('all');

    const handleCategoryChange = (event) => {
        const category = event.target.value;
        setSelectedCategory(category);
        if (category === 'all') {
            setProductList(originalProductList);
        } else {
            setProductList(originalProductList.filter(product => product.productSubType === category));
        }
    };

    useEffect(() => {
        if (customerTerm === true) {
            get(`${properties.CONTRACT_API}/get-contracts-by-service?serviceUuid=${serviceDetails?.serviceUuid}`).then((resp) => {
                if (Number(resp?.data?.count) > 0) {
                    const { rows, count } = resp.data;
                    setTotalCount(count);
                    setExistingContracts([...rows]);
                    setFutureContracts([{
                        actualStartDate: moment().format("YYYY-MM-DD"),
                        actualEndDate: moment().add(selectedProducts[0]['contractInMonths'] ?? 0, 'months').format("YYYY-MM-DD"),
                        rcAmount: Number(selectedProducts[0]['Rc'] ?? 0).toFixed(2),
                        otcAmount: (Number(selectedProducts[0]['Nrc'] ?? 0) + Number(agreementDetail?.chargeDtl?.chargeAmount ?? 0)).toFixed(2),
                    }]);
                }
            }).catch((error) => {
                console.log("error", error)
            }).finally()
        }
    }, [customerTerm, currentPage, perPage])

    useEffect(() => {
        const filteredProduct = productList.filter(f => f.isSelected === 'Y')
        setSelectedProducts(filteredProduct)
    }, [productList])

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setSelectedProducts([]);
        })

        get(`${properties.PRODUCT_API}/${orderType === statusConstantCode.orderType.upgrade ? 'upgrade' : 'downgrade'}/list/${serviceDetails?.serviceUuid}`)
            .then((response) => {
                if (response?.data) {
                    unstable_batchedUpdates(() => {
                        let finalList = []
                        response?.data?.productList.filter((card) => {
                            response?.data?.currentProduct.forEach((ele) => {
                                card?.productChargesList.forEach(e => {
                                    ele?.productChargesList?.forEach(l => {
                                        if (orderType === statusConstantCode.orderType.upgrade) {
                                            if (e?.chargeDetails?.chargeCat === 'CC_RC' && l?.chargeDetails?.chargeCat === 'CC_RC' && Number(e?.chargeAmount) >= Number(l?.chargeAmount)) {
                                                finalList.push(card)
                                            }
                                        } else {
                                            if (e?.chargeDetails?.chargeCat === 'CC_RC' && l?.chargeDetails?.chargeCat === 'CC_RC' && Number(e?.chargeAmount) <= Number(l?.chargeAmount)) {
                                                finalList.push(card)
                                            }
                                        }
                                    })
                                })
                            })
                        })
                        finalList = [...new Map(finalList.map(item => [item['productId'], item])).values()];
                        console.log('finalList ', finalList)
                        const prodSubType = [
                            ...new Map(
                                finalList
                                    .filter(f => f.productSubTypeDesc) // Ensure productSubTypeDesc exists
                                    .map(p => [p.productSubTypeDesc.code, p.productSubTypeDesc]) // Map code to productSubTypeDesc
                            ).values() // Get unique values
                        ];
                        console.log('prodSubType-------->', prodSubType);

                        setProductCategory(prodSubType)


                        finalList.map((x) => {
                            let Rc = 0
                            let Nrc = 0
                            let totalRc = 0
                            let totalNrc = 0
                            let currency = '$'
                            if (x?.productChargesList && x?.productChargesList.length > 0) {
                                x?.productChargesList.forEach((y) => {
                                    if (y?.chargeDetails?.chargeCat === 'CC_RC' && (!y.objectReferenceId || y.objectReferenceId == null)) {
                                        Rc = Number(y?.chargeAmount || 0)
                                        totalRc = totalRc + Number(y?.chargeAmount || 0)
                                    } else if (y?.chargeDetails?.chargeCat === 'CC_NRC' && (!y.objectReferenceId || y.objectReferenceId == null)) {
                                        totalNrc = totalNrc + Number(y?.chargeAmount || 0)
                                        Nrc = Number(y?.chargeAmount || 0)
                                    }
                                    currency = y?.chargeDetails?.currencyDesc?.description || '$'
                                })
                            }
                            x.Rc = Rc
                            x.Nrc = Nrc
                            x.totalRc = totalRc
                            x.totalNrc = totalNrc
                            x.quantity = 0
                            x.isSelected = 'N'
                            x.currency = currency
                        })
                        // console.log('finalList ', finalList)
                        setProductList(finalList)
                        setOriginalProductList(finalList)
                    })
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()

    }, [])

    return (
        <div className="cmmn-skeleton mt-2">
            {!customerTerm ? <>
                {
                    activeTab === 0 &&
                    <>
                        <div className="prd_serv_current_active_plan w-100 mb-2">
                            <span className="prd_current_active">
                                Current Plan
                            </span>
                            <div className="row">
                                <div className="col-md-7">
                                    <div className="prd_serv_lft_sect">
                                        <p className="mb-1">
                                            <strong>
                                                {productDetails?.productName}
                                            </strong>
                                        </p>
                                        <div className="wsc-dt-price-sect">
                                            <span className="wsc-dt-org-price">
                                                {productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {productDetails?.productChargesList?.[0]?.chargeAmount}
                                            </span>
                                        </div>
                                        <hr className="cmmn-hline mt-2  " />
                                        {benefitsToShow?.length > 0 ? (
                                            benefitsToShow.map((val, key) => (
                                                <tr key={key}>
                                                    <td>{val?.name?.description}</td>:
                                                    <td align="center">{val.value}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <> NA </>
                                        )}

                                        {serviceDetails?.actualProductBenefit?.length > 1 && (
                                            <span className="txt-lnk mt-1 d-flex" onClick={toggleBenefitsView}>
                                                {showAllBenefits ? 'Hide More Benefits' : 'View More Benefits'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="prd_serv_rht_sect">
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <p>
                                                            <strong>
                                                                Contract Duration
                                                            </strong>
                                                            <br />
                                                            {serviceDetails?.contractMonths} Months
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <p>
                                                            <strong>Qty</strong>
                                                            <br />1
                                                        </p>
                                                    </td>
                                                </tr>
                                                {console.log(productDetails)}
                                                <tr>
                                                    <td>
                                                        <table className="w-100">
                                                            <tr>
                                                                <td>
                                                                    <p>
                                                                        <strong>RC</strong>
                                                                        <br />
                                                                        {productDetails?.chargeType === 'CC_RC' ? productDetails?.productChargesList?.[0]?.chargeAmount : 0}
                                                                    </p>
                                                                </td>

                                                                <td>
                                                                    <p>
                                                                        <strong>NRC</strong>
                                                                        <br />
                                                                        {productDetails?.chargeType === 'CC_NRC' ? productDetails?.productChargesList?.[0]?.chargeAmount : 0}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="prd_ter_rules">
                            <span className="skel-header-title">
                                Following rules should be
                                completed/satisified before Upgrade/Downgrade.
                            </span>
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
                        </div>

                        <span className="skel-header-title">
                            Select Product
                        </span>
                        <div class="skel-sel-serv-type">
                            <input
                                type="radio"
                                name="productSubCategory"
                                id="all"
                                value="all"
                                checked={selectedCategory === 'all'}
                                onChange={handleCategoryChange}
                            />
                            <label htmlFor="all">All</label>
                            {productCategory.map((val, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        name="productSubCategory"
                                        id={"productSubCategory" + i}
                                        value={val.code}
                                        checked={selectedCategory === val.code}
                                        onChange={handleCategoryChange}
                                    />
                                    <label htmlFor={"productSubCategory" + i}>{val.description}</label>
                                </React.Fragment>
                            ))}
                        </div>
                        <ProductList
                            type={orderType}
                            customerAddress={customerDetails?.customerAddress}
                            countries={countries}
                            selectedCustomerType={customerDetails?.customerCategory}
                            selectedAppointmentList={selectedAppointmentList}
                            customerDetails={customerDetails}
                            setSelectedAppointmentList={setSelectedAppointmentList}
                            productList={productList}
                            handleAddProduct={handleAddProduct}
                            handleManualProductChange={handleManualProductChange}
                            productBenefitLookup={productBenefitLookup}
                            handleIncreaseProduct={handleIncreaseProduct}
                            handleDecreaseProduct={handleDecreaseProduct}
                        />
                    </>
                }
                {
                    activeTab === 1 &&
                    <>
                        <span className="skel-progress-steps">
                            Steps 2/3
                        </span>
                        <div className="wsc-choosen-plan">
                            <span className="prd-shrt-info">
                                *Note: If you are downgrading additional{" "}
                                <strong>$50</strong> charges will be
                                applicable.
                            </span>
                            <table className="prd_serv-table">
                                <thead>
                                    <tr>
                                        <td>
                                            <span className="skel-header-title mb-0">
                                                Plan Benefits
                                            </span>
                                        </td>
                                        <td align="center">
                                            <div className="wsc-skel-tbl-plan">
                                                <span className="wsc-skel-chosen-active-plan-label">
                                                    Current Plan
                                                </span>
                                                <div className="wsc-dt-v1-prdt-detail-sect p-0">
                                                    <span className="wsc-dt-prdt-name">
                                                        {productDetails?.productName}
                                                    </span>
                                                    <div className="wsc-dt-price-sect">
                                                        <span className="wsc-dt-org-price">
                                                            {productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {getRCChargeAmount(productDetails)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td align="center">
                                            <div className="wsc-skel-tbl-plan">
                                                <span className="wsc-skel-chosen-plan-label">
                                                    Chosen Plan
                                                </span>
                                                <div className="wsc-dt-v1-prdt-detail-sect p-0">
                                                    <span className="wsc-dt-prdt-name">
                                                        {selectedProducts?.[0]?.productName}
                                                    </span>
                                                    <div className="wsc-dt-price-sect">
                                                        <span className="wsc-dt-org-price">
                                                            {selectedProducts?.[0]?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {getRCChargeAmount(selectedProducts)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <td>Subscription</td>
                                        <td align="center">
                                            {serviceDetails?.contractMonths || '-'} Month Contract
                                        </td>
                                        <td align="center">
                                            {selectedContract || '-'} Month Contract
                                        </td>
                                    </tr>
                                    {Object.keys(combinedBenefits).length > 0 ? (
                                        Object.entries(combinedBenefits).map(([name, values], index) => (
                                            <tr key={`benefit-${index}`}>
                                                <td>{productBenefitLookup.find(b => b.code === name)?.description}</td>
                                                <td align="center">{values.existing}</td>
                                                <td align="center">{values.new}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3">No Benefits Found</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td>Promo Code</td>
                                        <td align="center">{serviceDetails?.promoCode && Object.keys(serviceDetails?.promoCode).length > 0 ? 'Applied' : 'Not Applied'}</td>
                                        <td align="center">{selectedProducts?.promoCode && Object.keys(selectedProducts?.promoCode).length > 0 ? 'Applied' : 'Not Applied'}</td>
                                    </tr>
                                    <tr>
                                        <td>Contract Starts On</td>
                                        <td align="center">{serviceDetails?.serviceContract?.actualStartDate}</td>
                                        <td align="center">{newProductContractStartDate}</td>
                                    </tr>
                                    <tr>
                                        <td>Contract Ends On</td>
                                        <td align="center">{serviceDetails?.serviceContract?.actualEndDate}</td>
                                        <td align="center">{newProductContractEndDate}</td>
                                    </tr>
                                    <tr>
                                        <td>Non-Recurring Charges*</td>
                                        <td align="center">{getNRCChargeAmount(productDetails)}</td>
                                        <td align="center">{getNRCChargeAmount(selectedProducts)}</td>
                                    </tr>
                                    <tr className="prd_serv_sub_total_amount">
                                        <td>
                                            <b>Sub Total</b>
                                        </td>
                                        <td align="center">
                                            <b>{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(productDetails)) + Number(getNRCChargeAmount(productDetails))}</b>
                                        </td>
                                        <td align="center">
                                            <b>{selectedProducts?.[0]?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(selectedProducts)) + Number(getNRCChargeAmount(selectedProducts))}</b>
                                        </td>
                                    </tr>
                                </tbody>

                            </table>

                            <div className="prd_contract_details">
                                <span className="skel-header-title mb-0">
                                    New Contract Details
                                </span>
                                <table>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div>
                                                    <span>
                                                        Current Acutal Contract
                                                    </span>
                                                    <br />
                                                    {serviceDetails?.serviceContract?.actualStartDate} to {serviceDetails?.serviceContract?.actualEndDate}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <span>
                                                        Contract will close on upon
                                                        activating new plan
                                                        <br />
                                                    </span>
                                                    {moment(newProductContractEndDate).subtract(1, 'day').format('YYYY-MM-DD')}
                                                </div>
                                            </td>
                                            <td>
                                                <div>
                                                    <span>
                                                        New Contract will starts on
                                                        upon activation
                                                        <br />
                                                    </span>
                                                    {newProductContractStartDate} to {newProductContractEndDate}

                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="prd_serv_total_amount">
                                <div className="">
                                    <div className="">
                                        <div className="prd_serv_msg_info">
                                            *Note: If you are downgrading the
                                            plan following impact will reflect
                                            in new plan based on Terms and
                                            Conditions.
                                        </div>
                                    </div>
                                    <div className="w-100 mt-2">
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td align="right">Amount</td>
                                                    <td align="right">{selectedProducts?.[0]?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(selectedProducts)) + Number(getNRCChargeAmount(selectedProducts))}</td>
                                                </tr>
                                                <tr className="prd_serv_penalty_amount">
                                                    <td align="right">
                                                        Penalty Charge
                                                    </td>
                                                    <td align="right">{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</td>
                                                </tr>
                                                <tr className="prd_serv_penalty_amount">
                                                    <td align="right">
                                                        Promocode Penalty
                                                    </td>
                                                    <td align="right">{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</td>
                                                </tr>

                                                <tr className="prd_serv_sub_total_amount">
                                                    <td align="right">
                                                        <b>Total Amount</b>
                                                    </td>
                                                    <td align="right">
                                                        <b>{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(selectedProducts)) + Number(getNRCChargeAmount(selectedProducts)) + (Number(termsAndCond?.chargeDtl?.chargeAmount) || 0)}</b>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                }

                {
                    activeTab === 2 &&
                    <>
                        <span className="skel-progress-steps">
                            Steps 3/3
                        </span>
                        <div className="prd_serv_current_active_plan w-100 mb-2">
                            <span className="prd_current_active">
                                Selected Plan
                            </span>
                            <div className="row">
                                <div className="col-md-7">
                                    <div className="prd_serv_lft_sect">
                                        <p className="mb-1">
                                            <strong>
                                                {selectedProducts?.[0]?.productName}
                                            </strong>
                                        </p>
                                        <div className="wsc-dt-price-sect">
                                            <span className="wsc-dt-org-price">
                                                {selectedProducts?.[0]?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {getRCChargeAmount(selectedProducts)}
                                            </span>
                                        </div>
                                        <hr className="cmmn-hline mt-2  " />
                                        <div className="skel-serv-benefits">
                                            {selectedProductBenefits?.benefits.length > 0 ? (
                                                selectedProductBenefits.benefits.map((val, key) => (
                                                    <div key={key}>
                                                        <p className="mb-0 ">{productBenefitLookup.find(b => b.code === val.name)?.description}</p>
                                                        <p className="mb-0 font-weight-bold">
                                                            {val.value}
                                                        </p>

                                                    </div>
                                                )))
                                                : (
                                                    <> NA </>
                                                )}
                                        </div>

                                        {/* <span
                                                className="txt-lnk mt-1 d-flex"
                                                onClick={() =>
                                                    setShowBenefitsModal(true)
                                                }
                                            >
                                                View More Benefits
                                            </span> */}
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="prd_serv_rht_sect">
                                        <table className="w-100">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <p>
                                                            <strong>
                                                                Contract Duration
                                                            </strong>
                                                            <br />
                                                            {selectedContract} Months
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <p>
                                                            <strong>Qty</strong>
                                                            <br />1
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <table className="w-100">
                                                            <tr>
                                                                <td>
                                                                    <p>
                                                                        <strong>RC</strong>
                                                                        <br />
                                                                        {getRCChargeAmount(selectedProducts) || 0}
                                                                    </p>
                                                                </td>

                                                                <td>
                                                                    <p>
                                                                        <strong>NRC</strong>
                                                                        <br />
                                                                        {getNRCChargeAmount(selectedProducts) || 0}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* <div className="row mt-2 mb-2">
                            <div className="col-md-6">
                                <label className="control-label">
                                    Enter Promo Code
                                </label>
                                <input
                                    orderType="text"
                                    name="promoCode"
                                    id="promoCode"
                                    className="form-control"
                                    value=""
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="control-label">
                                    &nbsp;
                                </label>
                                <button
                                    orderType="button"
                                    className="skel-btn-submit mt-0 ml-0"
                                >
                                    Apply
                                </button>
                            </div>
                        </div> */}
                        <div className="w-100 mt-2 wsc-choosen-plan">
                            <table className="w-100">
                                <tbody>
                                    <tr>
                                        <td align="right">Amount</td>
                                        <td align="right">{selectedProducts?.[0]?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(selectedProducts)) + Number(getNRCChargeAmount(selectedProducts))}</td>
                                    </tr>
                                    <tr className="prd_serv_penalty_amount">
                                        <td align="right">
                                            Penalty Charge
                                        </td>
                                        <td align="right">{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</td>
                                    </tr>
                                    {/* <tr className="prd_serv_penalty_amount">
                                        <td align="right">
                                            Promocode Penalty
                                        </td>
                                        <td align="right">{termsAndCond?.chargeDtl?.currencyDesc?.description} {Number(termsAndCond?.chargeDtl?.chargeAmount || 0).toFixed(2)}</td>
                                    </tr> */}

                                    <tr className="prd_serv_sub_total_amount">
                                        <td align="right">
                                            <b>Total Amount</b>
                                        </td>
                                        <td align="right">
                                            <b>{productDetails?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {Number(getRCChargeAmount(selectedProducts)) + Number(getNRCChargeAmount(selectedProducts)) + (Number(termsAndCond?.chargeDtl?.chargeAmount) || 0)}</b>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div
                            className="wsc-skel-alert-popup"
                            style={{ display: "block" }}
                        >
                            <div className="col-md-12 mt-2 ml-0 pl-0">
                                <div className="form-group">
                                    <label
                                        for="remarks"
                                        className="control-label"
                                    >
                                        Terms and Conditions{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <span
                                        readonly=""
                                        className="form-control"
                                        style={{
                                            height: "100%",
                                            maxHeight: "150px",
                                            overflowY: "scroll",
                                            display: "table",
                                        }}
                                    >
                                        <HtmlToPlainText htmlContent={agreement} />
                                    </span>
                                </div>
                                {/* <div className="custom-control custom-checkbox">
                                            <input
                                              orderType="checkbox"
                                              className="custom-control-input"
                                              id="customCheck2"
                                            />
                                            <label
                                              className="custom-control-label"
                                              for="customCheck2"
                                            >
                                              I agree Terms and Conditions
                                            </label>
                                          </div> */}
                                {/* <div className="form-group pl-1 mt-3">
                                            <label
                                              for="sign"
                                              className="control-label"
                                            >
                                              E-signature
                                            </label>
    
                                            <canvas
                                              id="sign-canvas"
                                              width="400"
                                              height="100"
                                            ></canvas>
                                            <p>
                                              <button
                                                className="btn waves-effect waves-light btn-secondary"
                                                id="sign-clearBtn"
                                              >
                                                Clear Signature
                                              </button>
                                            </p>
                                            <span className="errormsg"></span>
                                          </div> */}
                                <hr className="cmmn-hline mt-3 mb-3" />
                            </div>
                        </div>
                    </>
                }

                {
                    activeTab === 3 &&
                    <>
                        <div className="wsc-log-rht-sect">
                            <p className="wsc-success-register">
                                <i className="mdi mdi-check"></i>
                            </p>
                            <div className="wsc-pg-title">
                                <p className="mb-0">
                                    Your Upgrade/Downgrade request has been
                                    submitted successfully!
                                </p>
                            </div>
                            <hr className="cmmn-hline" />
                            <p className="mb-0 mt-2">
                                Your Order ID:
                                <a className="txt-lnk" onClick={() => {
                                    history('/order360', { state: { data: { orderNo } } })
                                }}>
                                    <strong>#{orderNo}</strong>
                                </a>{" "}
                                is used for further
                                reference/communication.
                            </p>
                            <div className="wsc-log-footer mt-1 mb-3">
                                <p className="wsc-skel-gry-info">
                                    You will be redirect to create order
                                    page in 10 sec
                                </p>
                                <p className="txt-lnk cursor-pointer">Download PDF</p>
                            </div>
                        </div>
                    </>
                }
            </>
                :
                <></>
            }
        </div >
    )
}

export default UpgradeDowngradeTabPane;