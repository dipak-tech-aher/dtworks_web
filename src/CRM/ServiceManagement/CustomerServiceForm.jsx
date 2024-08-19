import React, { useEffect, useState } from 'react'
import NoProductImg from '../../assets/images/no-product.png';
import { Card, Button, ListGroup } from 'react-bootstrap';
import ServiceAppointmentModal from './ServiceAppointmentModal';
import contactInfo from "../../assets/images/cnt-info.svg";
import Modal from 'react-modal';
import { makeFirstLetterLowerOrUppercase } from '../../common/util/util';
import ProductList from './ProductList';
import { statusConstantCode } from '../../AppConstants';


const CustomerServiceForm = (props) => {
    const { serviceType, serviceTypeLookup, productType, productTypeLookup, productCategory, productCategoryLookup,
        productSubCategory, productSubCategoryLookup, serviceData, productList, selectedProductList, customerAddress,
        countries, selectedCustomerType, selectedAppointmentList, customerData, customerTypeLookup, existingApplicationProdList,
        productBenefitLookup, appsConfig
    } = props?.data
    const { setServiceData, fetchProductList, handleAddProduct, handleDeleteProduct, handleIncreaseProduct,
        handleDecreaseProduct, handleRemoveServiceType, setSelectedAppointmentList, setServiceType,
        setProductType, setProductCategory, setProductSubCategory, handleManualProductChange, setProductList } = props?.handler

    useEffect(() => {

        // console.log('productList---x----------->', productList)
        // console.log('existingApplicationProdList---x----------->', existingApplicationProdList)

        document.body.scrollTop = document.documentElement.scrollTop = 0;

        if (existingApplicationProdList.length > 0) {
            const prodList = productList.map((product) => {
                const existingProduct = existingApplicationProdList.find(
                    (existingProduct) => {
                        if (existingProduct.bundleId && existingProduct.bundleId != '') {
                            if (existingProduct.bundleId == product.bundleId) {
                                return existingProduct
                            }
                        } else {
                            if (existingProduct.productId == product.productId) {
                                return existingProduct
                            }
                        }

                    }
                );
                if (existingProduct) {

                    if (product.contractFlag == 'Y') {
                        return {
                            ...product,
                            quantity: existingProduct.quantity,
                            isSelected: 'Y',
                            selectedContract: product.selectedContract ? [...new Set([...product.selectedContract, existingProduct.selectedContract || 0])]
                                : [existingProduct.selectedContract || 0],
                            upfrontCharge: existingProduct?.upfrontCharge,
                            advanceCharge: existingProduct?.advanceCharge
                        };
                    }
                    else {
                        return {
                            ...product,
                            quantity: existingProduct.quantity,
                            isSelected: 'Y',
                            upfrontCharge: existingProduct?.upfrontCharge,
                            advanceCharge: existingProduct?.advanceCharge
                        };
                    }

                }

                return product;
            });
            // console.log('prodList ', prodList)
            setProductList(prodList)
        }
    }, [])



    // console.log('serviceData ', serviceData)
    // console.log('productList ', productList)
    return (
        <div className="skel-selected-category">
            <div className="form-row pl-4 skel-available-products">
                <div className="skel-add-product-stype mt-4">
                    {selectedCustomerType && <div className="form-group">
                        <label>Selected {appsConfig && appsConfig.clientFacingName && appsConfig.clientFacingName['Customer'.toLowerCase()] && makeFirstLetterLowerOrUppercase(appsConfig?.clientFacingName['Customer'.toLowerCase()], 'upperCase') || 'customer'} Category</label>
                        <ul className="skel-top-inter">
                            {
                                customerTypeLookup
                                    .filter((e) => e.code === selectedCustomerType)
                                    .map((filteredItem) => (
                                        <li key={filteredItem.code}>
                                            {filteredItem.description}
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>}
                    {productCategory.length > 0 && <div className="form-group">
                        <label>Selected Category</label>
                        <ul className="skel-top-inter">
                            {
                                productCategoryLookup
                                    .filter((e) => productCategory.includes(e.code))
                                    .map((filteredItem) => (
                                        <li key={filteredItem.code}>
                                            {filteredItem.description} <a onClick={() => {
                                                setProductCategory(productCategory.filter(f => f !== filteredItem.code))
                                            }}><i className="material-icons">close</i></a>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>}
                    {productSubCategory.length > 0 && <div className="form-group">
                        <label>Selected Sub Category</label>
                        <ul className="skel-top-inter">
                            {
                                productSubCategoryLookup
                                    .filter((e) => productSubCategory.includes(e.code))
                                    .map((filteredItem) => (
                                        <li key={filteredItem.code}>
                                            {filteredItem.description} <a onClick={() => {
                                                setProductSubCategory(productSubCategory.filter(f => f !== filteredItem.code))
                                            }}><i className="material-icons">close</i></a>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>}
                    {productType.length > 0 && <div className="form-group">
                        <label>Selected Type</label>
                        <ul className="skel-top-inter">
                            {
                                productTypeLookup
                                    .filter((e) => productType.includes(e.code))
                                    .map((filteredItem) => (
                                        <li key={filteredItem.code}>
                                            {filteredItem.description} <a onClick={() => {
                                                setProductType(productType.filter(f => f !== filteredItem.code))
                                            }}><i className="material-icons">close</i></a>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>}
                    {serviceType.length > 0 && <div className="form-group">
                        <label>Selected Service</label>
                        <ul className="skel-top-inter">
                            {
                                serviceTypeLookup
                                    .filter((e) => serviceType.includes(e.code))
                                    .map((filteredItem) => (
                                        <li key={filteredItem.code}>
                                            {filteredItem.description} <a onClick={() => {
                                                setServiceType(serviceType.filter(f => f !== filteredItem.code))
                                            }}><i className="material-icons">close</i></a>
                                        </li>
                                    ))
                            }
                        </ul>
                    </div>}
                    <div className="pl-0 pt-0">
                        <label>Available Products</label>
                    </div>
                    {/* {console.log('productList---------->', productList)} */}
                    <ProductList
                        type={statusConstantCode.orderType.signUp}
                        customerAddress={customerAddress}
                        countries={countries}
                        selectedCustomerType={selectedCustomerType}
                        selectedAppointmentList={selectedAppointmentList}
                        customerData={customerData}
                        setSelectedAppointmentList={setSelectedAppointmentList}
                        productList={productList}
                        handleAddProduct={handleAddProduct}
                        handleManualProductChange={handleManualProductChange}
                        productBenefitLookup={productBenefitLookup}
                        handleIncreaseProduct={handleIncreaseProduct}
                        handleDecreaseProduct={handleDecreaseProduct}
                    />
                </div>
            </div>
        </div>
    )
}

export default CustomerServiceForm;