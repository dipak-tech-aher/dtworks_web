import React, { useContext, useEffect, useState } from "react";
import { CreateOrderContext } from "../../../../AppContext";
import ProductList from "../../../ServiceManagement/ProductList";
import SignaturePad from "react-signature-canvas";
import { useHistory } from "../../../../common/util/history";

export default function SignUpTab({ viewOtherDetails, setShowBenefitsModal, setViewOtherDetails, setShowPrintModal }) {
    const history = useHistory()
    const { data, handler } = useContext(CreateOrderContext)

    const { serviceDetails, orderType, productBenefitLookup = [], productDetails, customerDetails,
        countries, selectedAppointmentList, productList, stats, termsAndCond, selectedProducts,
        activeTab, orderNo, agreementDetail, sigPad, productCategory, orderData, originalProductList } = data
    const { handleAddProduct, setSelectedAppointmentList,
        handleIncreaseProduct, handleDecreaseProduct, setProductList, handleManualProductChange,
        setSelectedProducts, setAgreementDetail, getNRCChargeAmount, getRCChargeAmount, clearSignature
    } = handler;

    useEffect(() => {
        const filteredProduct = productList.filter(f => f.isSelected === 'Y')
        setSelectedProducts(filteredProduct)
    }, [productList])

    // console.log('selectedProducts ===============', selectedProducts)
    function getSelectedProductBenefits(product) {
        const selectedContract = product?.selectedContract?.[0];

        const selectedProductBenefits = product?.productBenefit?.find(pb => pb.contract == selectedContract);

        return selectedProductBenefits

    }

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

    return (
        <div className="cmmn-skeleton mt-2">
            {(
                activeTab === 0 && <>
                    <span className="skel-progress-steps">
                        Steps 1/3
                    </span>

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
                    <ProductList type={orderType}
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
            )}

            {activeTab === 1 &&
                <>
                    <span className="skel-progress-steps">
                        Steps 2/3
                    </span>
                    <div className="prd_serv_current_active_plan w-100 mb-2">
                        <span className="prd_current_active">
                            Chosen Plan
                        </span>
                        {selectedProducts.map((product, key) => (<div key={key} className="row">
                            <div className="col-md-7">
                                <div className="prd_serv_lft_sect">
                                    <p className="mb-1">
                                        <strong>
                                            {product?.productName}
                                        </strong>
                                    </p>
                                    <div className="wsc-dt-price-sect">
                                        <span className="wsc-dt-org-price">
                                            {product?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {getRCChargeAmount(product)}
                                        </span>
                                    </div>
                                    <hr className="cmmn-hline mt-2  " />
                                    <div className="skel-serv-benefits">
                                        {getSelectedProductBenefits(product)?.benefits.length > 0 ? (
                                            getSelectedProductBenefits(product).benefits.map((val, key) => (
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
                                                        {product?.contractMonths} Months
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p>
                                                        <strong>Qty</strong>
                                                        <br />{product?.quantity}
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
                                                                    {getRCChargeAmount(product)}
                                                                </p>
                                                            </td>

                                                            <td>
                                                                <p>
                                                                    <strong>NRC</strong>
                                                                    <br />
                                                                    {getNRCChargeAmount(product)}
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
                        </div>))}
                    </div>
                    <div className="row">
                        {/* <div className="col-md-4">
                <div className="form-group">
                  <label
                    for="status"
                    className="control-label"
                  >
                    Service Number
                  </label>
                  <input
                    type="text"
                    maxlength="100"
                    className="form-control"
                    id="servicenumber"
                    placeholder="Category 1"
                    value="123456789"
                    disabled="disabled"
                  />
                  <span className="errormsg"></span>
                </div>
              </div> */}
                    </div>
                </>
            }
            {(
                activeTab === 2 && <>
                    <span className="skel-progress-steps">
                        Steps 3/3
                    </span>
                    <div className="prd_serv_current_active_plan w-100 mb-2">
                        <span className="prd_current_active">
                            Chosen Plan
                        </span>
                        {selectedProducts.map((product, key) => (<div key={key} className="row">
                            <div className="col-md-7">
                                <div className="prd_serv_lft_sect">
                                    <p className="mb-1">
                                        <strong>
                                            {product?.productName}
                                        </strong>
                                    </p>
                                    <div className="wsc-dt-price-sect">
                                        <span className="wsc-dt-org-price">
                                            {product?.productChargesList?.[0]?.chargeDetails?.currencyDesc?.description} {getRCChargeAmount(product)}
                                        </span>
                                    </div>
                                    <hr className="cmmn-hline mt-2  " />
                                    <div className="skel-serv-benefits">
                                        {getSelectedProductBenefits(product)?.benefits.length > 0 ? (
                                            getSelectedProductBenefits(product).benefits.map((val, key) => (
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
                                                        {serviceDetails?.contractMonths} Months
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <p>
                                                        <strong>Qty</strong>
                                                        <br />{product.quantity}
                                                    </p>
                                                </td>
                                            </tr>
                                            {/* {console.log(productDetails)} */}
                                            <tr>
                                                <td>
                                                    <table className="w-100">
                                                        <tr>
                                                            <td>
                                                                <p>
                                                                    <strong>RC</strong>
                                                                    <br />
                                                                    {getRCChargeAmount(product)}
                                                                </p>
                                                            </td>

                                                            <td>
                                                                <p>
                                                                    <strong>NRC</strong>
                                                                    <br />
                                                                    {getNRCChargeAmount(product)}
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
                        </div>))}
                    </div>
                    <div className="row mt-2 mb-2">
                        <div className="col-md-6">
                            <label className="control-label">
                                Enter Promo Code
                            </label>
                            <input
                                type="text"
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
                                type="button"
                                className="skel-btn-submit mt-0 ml-0"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                    <div className="sect-bottom-prod">
                        <table className="w-100">
                            <tr>
                                <td>Total RC</td>
                                <td>:</td>
                                <td>{selectedProducts.reduce((total, charge) => (
                                    total + Number(getRCChargeAmount(charge)*charge.quantity)
                                ), 0)}</td>
                            </tr>
                            <tr>
                                <td>Total NRC</td>
                                <td>:</td>
                                <td>{selectedProducts.reduce((total, charge) => (
                                    total + Number(getNRCChargeAmount(charge)*charge.quantity)
                                ), 0)}</td>
                            </tr>
                            <tr>
                                <td>Discount</td>
                                <td>:</td>
                                <td>$0.00</td>
                            </tr>
                            <tr>
                                <td
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                    }}
                                >
                                    Grand Total
                                </td>
                                <td>:</td>
                                <td
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                    }}
                                >
                                    {console.log('selectedProducts ', selectedProducts)}
                                    {selectedProducts.reduce((total, charge) => (
                                        total + (Number(getRCChargeAmount(charge)*charge.quantity) + Number(getNRCChargeAmount(charge)*charge.quantity))
                                    ), 0)}
                                </td>
                            </tr>
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
                                    <h4>General Terms</h4>
                                    <p>
                                        These Mobile Prepaid Connection
                                        Terms and Conditions ("Terms")
                                        govern the use of the prepaid mobile
                                        connection and services provided by
                                        [Telecom Company Name] ("Company")
                                        to the customer ("Customer"). By
                                        purchasing and using the prepaid
                                        mobile connection, the Customer
                                        agrees to abide by these Terms.
                                        Please read these Terms carefully
                                        before using the service.
                                    </p>
                                    <h5>Definitions</h5>

                                    <p>
                                        1.1. "Prepaid Mobile Connection"
                                        refers to the mobile
                                        telecommunications service provided
                                        by the Company that requires the
                                        Customer to make advance payments
                                        for usage. 1.2. "Customer" refers to
                                        an individual or entity that
                                        purchases and uses the prepaid
                                        mobile connection provided by the
                                        Company.
                                    </p>
                                </span>
                            </div>
                            <div className="custom-control custom-checkbox">
                                <input
                                    type="checkbox"
                                    className="custom-control-input"
                                    id="customCheck2"
                                />
                                <label
                                    className="custom-control-label"
                                    for="customCheck2"
                                >
                                    I agree Terms and Conditions
                                </label>
                            </div>
                            <div className="form-group pl-1 mt-3">
                                <label
                                    for="sign"
                                    className="control-label"
                                >
                                    E-signature
                                </label>

                                <SignaturePad
                                    ref={sigPad}
                                    canvasProps={{
                                        width: 400,
                                        height: 100,
                                        className: "sign-canvas",
                                    }}
                                />
                                <p>
                                    <button
                                        className="btn waves-effect waves-light btn-secondary"
                                        onClick={clearSignature}
                                        id="sign-clearBtn"
                                    >
                                        Clear Signature
                                    </button>
                                </p>
                                <span className="errormsg"></span>
                            </div>
                            <hr className="cmmn-hline mt-3 mb-3" />
                        </div>
                    </div>
                </>
            )}
            {(
                activeTab === 3 && <>
                    <div className="wsc-log-rht-sect">
                        <p className="wsc-success-register">
                            <i className="mdi mdi-check"></i>
                        </p>
                        <div className="wsc-pg-title">
                            <p className="mb-0">
                                Your Order request has been submitted
                                successfully!
                            </p>
                        </div>
                        <hr className="cmmn-hline" />
                        <p className="mb-0 mt-2">
                            Your Order ID:
                            <a className="txt-lnk" onClick={() => {
                                history('/order360', { state: {data: { orderNo } } })
                            }}>
                                <strong>#{orderNo}</strong>
                            </a>{" "}
                            is used for further
                            reference/communication.
                        </p>
                        <div className="wsc-log-footer mt-1 mb-3">
                            {/* <p className="wsc-skel-gry-info">
                                You will be redirect to create order
                                page in 10 sec
                            </p> */}
                            <p className="txt-lnk cursor-pointer">Download PDF</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}