import React, { useContext, useState, useEffect } from 'react'
import { Contract360Context } from '../../../../../AppContext';

export default function ProductServiceDetails() {
    const { data: { contractData } } = useContext(Contract360Context);
    let contractDetail = contractData?.contractDetail ?? [], serviceDetails = contractData?.serviceDetails
    const [tab, setTab] = useState('tab0');
    const addressDetails = serviceDetails?.serviceAddress?.[0];
    const [mapSrc, setMapSrc] = useState('');
    useEffect(() => {
        if (addressDetails) {
            const address = `${addressDetails?.address1}${addressDetails?.address2}${addressDetails?.address3}${addressDetails?.city},${addressDetails?.district},${addressDetails?.state},${addressDetails?.country},${addressDetails?.postcode}`;
            const src = `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=B&output=embed`;
            setMapSrc(src)

        }
    }, [addressDetails])
    return (
        <div className="skel-informative-data1 mt-2 mb-2 row">
            <div className="row mx-lg-n1 col-md-12">
                <div className="col-md-12 mb-2 px-lg-1">
                    <div className="cmmn-skeleton h-100">
                        <span className="skel-header-title py-1 px-2 rounded w-100">
                            Product &amp; Service Details
                            {/* <span className="skel-badge badge-blue">
                3
                            </span> */}
                        </span>
                        <hr className="cmmn-hline" />
                        <div className="tabbable">
                            <ul className="nav nav-tabs" id="myTab2" role="tablist">
                                {contractDetail?.map((product, i) => {
                                    return (
                                        <a
                                            key={i}
                                            className="nav-link active text-ellips tab-prdt"
                                            id={`tab${i}`}
                                            data-toggle="tab"
                                            role="tab"
                                            aria-controls="prdt1"
                                            aria-selected="true"
                                            onClick={() => setTab(`tab${i}`)}
                                        >
                                            {product?.prodDetails?.productName}
                                        </a>
                                    )
                                })}
                            </ul>
                        </div>
                        <div className="tab-content mt-2">
                            {contractDetail?.map((product, i) => {
                                let productName = product?.prodDetails?.productName;
                                const customerDetails = contractData?.customer;
                                const customerContactDetails = customerDetails?.customerContact?.[0];
                                const serviceContactDetails = serviceDetails?.contactDetails;
                                const phoneNo = serviceContactDetails ? serviceContactDetails?.mobileNo : customerContactDetails?.mobileNo;
                                const phonePrefix = serviceContactDetails ? serviceContactDetails?.mobilePrefix : customerContactDetails?.mobilePrefix;
                                return (
                                    <div
                                        key={i}
                                        className={`tab-pane fade ${tab === `tab${i}` ? 'active show' : ''}`}
                                        id={`tab${i}`}
                                        role="tabpanel"
                                        aria-labelledby={`tab${i}`}
                                    >
                                        <div className="skel-ord-prd-insht-view">
                                            <div className="skel-prd-sect-info">
                                                <div className="skel-prd-img-prd-nm">
                                                    <img
                                                        src={product?.prodDetails?.productImage}
                                                        alt=""
                                                        className="img-fluid"
                                                    />
                                                    <div className="skel-prdt-details-sect">
                                                        <div className="skel-prd-title-info">
                                                            <span className="skel-header-title txt-ellips-lg">
                                                                {productName}
                                                            </span>
                                                            <span className="skel-gry-info">
                                                                {serviceDetails?.serviceNo}
                                                            </span>
                                                        </div>
                                                        <div className="bussiness-info">
                                                            <span className="bussiness-type">{product?.prodDetails?.productCategoryDescription?.description}</span>
                                                            <span className="profile-status">
                                                                {product?.prodDetails?.productSubCategoryDescription?.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="skel-prdt-pckg-info">
                                                    <ul>
                                                        <li>{product?.prodDetails?.productTypeDescription?.description}</li>
                                                        <li>{product?.prodDetails?.serviceTypeDescription?.description}</li>
                                                        <li>QTY: {product?.quantity ?? 0}</li>
                                                    </ul>
                                                </div>
                                                <div>
                                                    <div className="skel-header-title">
                                                        Service Address Details
                                                    </div>
                                                    <div className="skel-srv-add-details">
                                                        <iframe width={300} height={80} src={mapSrc}></iframe>
                                                        <div className="ml-2">
                                                            {/* {serviceAddress} */}

                                                            {customerDetails?.firstName ?? ''} {customerDetails?.lastName ?? ''}
                                                            <br />
                                                            {addressDetails?.address1}, {addressDetails?.address2}
                                                            <br />
                                                            {addressDetails?.city},{addressDetails?.district},{addressDetails?.country}, {addressDetails?.postcode}
                                                            <br />
                                                            P: ({phonePrefix}) {phoneNo}
                                                            <br />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
