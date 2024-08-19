import React, { useContext, useEffect, useState } from 'react'
import { CreateOrderContext } from '../../../AppContext';
import AddressComponent from '../../../HelpdeskAndInteraction/Helpdesk/AddressComponent';
import { toast } from 'react-toastify';
import { get } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import moment from 'moment'
import Select from "react-select";


const CreateOrderForm = (props) => {
    const { data, handler } = useContext(CreateOrderContext)
    const { serviceDetails, orderData, customerDetails, productDetails,
        selectedProducts, addressList, addressError, slaEdoc, error, refresh
    } = data
    const { setOrderData, setAddressError, setAddressList, handleInputChange } = handler

    const customerAddress = customerDetails?.customerAddress?.[0]

    const [paymentModeLookup, setPaymentModeLookup] = useState([])
    const [orderModeLookup, setOrderModeLookup] = useState([])
    const [deliveryModeLookup, setDeliveryModeLookup] = useState([])
    const [priorityModeLookup, setPriorityModeLookup] = useState([])
    const [contactPreferenceLookup, setContactPreferenceLookup] = useState([])
    const [orderChannelLookup, setOrderChannelLookup] = useState([])
    let [selectedContactPreference, setSelectedContactPreference] = useState([]);
    
    useEffect(() => {
        setOrderData({
            ...orderData,
            paymentMode: 'PM_CASH',
            orderChannel: 'WEB',
            orderMode: 'ONLINE',
            deliveryMode: 'BDMEM',
            priority: '',
            contactPreference: customerDetails?.contactPreferences || [],
            expectedResDate: ''
        })
    }, [])

    useEffect(() => {
        if (refresh) {
            get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=PAYMENT_METHOD,ORDER_MODE,BILL_DELIVERY_METHOD,PRIORITY,CONTACT_PREFERENCE,TICKET_CHANNEL`).then((resp) => {
                setPaymentModeLookup(resp.data?.PAYMENT_METHOD)
                setOrderModeLookup(resp.data?.ORDER_MODE)
                setDeliveryModeLookup(resp.data?.BILL_DELIVERY_METHOD)
                setPriorityModeLookup(resp.data?.PRIORITY)
                setOrderChannelLookup(resp.data?.TICKET_CHANNEL)

                const preferenceOptions = resp.data?.CONTACT_PREFERENCE.map((preference) => {
                    return {
                        value: preference.code,
                        label: preference.description,
                    };
                });
                setContactPreferenceLookup(preferenceOptions)
            })
        }
    }, [refresh])

    const handleSetCustomerAddress = () => {

        if (customerAddress) {
            setAddressList([{
                ...customerAddress,
                addressType: customerAddress?.addressType?.code || 'ADDRESIDENTIAL',
            }])
        } else {
            toast.info('Address not available. Please add new address')
            setOrderData({ ...orderData, markAsServiceAddress: false })
        }
    }
    return (
        <>
            <div className="row mt-3">
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="status"
                            className="control-label"
                        >
                            Service ID
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="serviceId"
                            placeholder="Category 1"
                            value={serviceDetails?.serviceId}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="status"
                            className="control-label"
                        >
                            Service Number
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="serviceNo"
                            placeholder="Category 1"
                            value={serviceDetails?.serviceNo}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="status"
                            className="control-label"
                        >
                            Service Category
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="serviceCategory"
                            placeholder="Category 1"
                            value={serviceDetails?.srvcCatDesc?.description}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="customerName"
                            className="control-label"
                        >
                            Service Type
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="serviceType"
                            placeholder=""
                            value={serviceDetails?.srvcTypeDesc?.description}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>

                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="customerName"
                            className="control-label"
                        >
                            Order Source
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="ordersource"
                            placeholder=""
                            value={orderData?.orderSource}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="orderType"
                            className="control-label"
                        >
                            Order Family
                        </label>
                        <input
                            type="text"
                            id="orderfamily"
                            className="form-control"
                            value={selectedProducts?.provisioningTypeDesc?.description}
                            disabled="disabled"
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="invfrequency"
                            className="control-label"
                        >
                            Invoice Frequency
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <input
                            type="text"
                            id="invfrequency"
                            className="form-control"
                            value={selectedProducts?.productChargesList?.find(f => f.chargeType === 'CC_RC')?.frequencyDesc}
                            disabled="disabled"
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="invtype"
                            className="control-label"
                        >
                            Invoice Type{" "}
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <input
                            type="text"
                            id="invtype"
                            className="form-control"
                            value={selectedProducts?.advanceCharge === 'Y' ? 'Advance Charge' : 'Post'}
                            disabled="disabled"
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="paymentMode"
                            className="control-label"
                        >
                            Payment Mode{" "}
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <select
                            id="paymentMode"
                            className={`form-control ${error?.paymentMode ? "error-border" : ""}`}
                            onChange={handleInputChange}
                            value={orderData?.paymentMode}
                        >
                            <option value="">
                                Select Payment Mode
                            </option>
                            {
                                paymentModeLookup && paymentModeLookup.map((p, i) => (
                                    <option value={p.code} key={i}>{p.description}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="orderChannel"
                            className="control-label"
                        >
                            Order Channel
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <select
                            id="orderChannel"
                            className={`form-control ${error?.orderChannel ? "error-border" : ""}`}
                            onChange={handleInputChange}
                            value={orderData?.orderChannel}
                        >
                            <option value="">
                                Select Order Channel
                            </option>
                            {
                                orderChannelLookup && orderChannelLookup.map((p, i) => (
                                    <option value={p.code} key={i}>{p.description}</option>
                                ))
                            }
                        </select>
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="orderMode"
                            className="control-label"
                        >
                            Order Mode Type
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <select
                            id="orderMode"
                            className={`form-control ${error?.orderMode ? "error-border" : ""}`}
                            onChange={handleInputChange}
                            value={orderData?.orderMode}
                        >
                            <option value="">
                                Select Order Mode
                            </option>
                            {
                                orderModeLookup && orderModeLookup.map((p, i) => (
                                    <option value={p.code} key={i}>{p.description}</option>
                                ))
                            }
                        </select>
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="deliveryMode"
                            className="control-label"
                        >
                            Order Delivery Mode
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <select
                            id="deliveryMode"
                            className={`form-control ${error?.deliveryMode ? "error-border" : ""}`}
                            onChange={handleInputChange}
                            value={orderData?.deliveryMode}
                        >
                            <option value="">
                                Select Order Delivery Mode
                            </option>
                            {
                                deliveryModeLookup && deliveryModeLookup.map((p, i) => (
                                    <option value={p.code} key={i}>{p.description}</option>
                                ))
                            }
                        </select>
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="priority"
                            className="control-label"
                        >
                            Order Priority
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <select
                            id="priority"
                            className={`form-control ${error?.priority ? "error-border" : ""}`}
                            onChange={handleInputChange}
                            value={orderData?.priority}
                        >
                            <option value="">
                                Select Order Priority
                            </option>
                            {
                                priorityModeLookup && priorityModeLookup.map((p, i) => (
                                    <option value={p.code} key={i}>{p.description}</option>
                                ))
                            }
                        </select>
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="expectedResDate"
                            className="control-label"
                        >
                            EDOC
                            <span className="error ml-1">
                                *
                            </span>
                        </label>
                        <input type="date"
                            min={moment().format('YYYY-MM-DD')}
                            disabled={!!slaEdoc}
                            value={slaEdoc ?? orderData.expectedResDate}
                            id="expectedResDate"
                            className={`form-control ${error?.expectedResDate ? "error" : ""}`}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="row">
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="cntperson"
                            className="control-label"
                        >
                            Contact Person
                        </label>
                        <input
                            maxlength="15"
                            className="form-control"
                            id="contactperson"
                            placeholder="Enter Contact Person"
                            type="text"
                            value={customerDetails?.firstName + " " + customerDetails?.lastName}
                            inputmode=""
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="status"
                            className="control-label"
                        >
                            Contact Email
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="contactemail"
                            placeholder="Enter Contact Email"
                            value={customerDetails?.customerContact?.[0]?.emailId}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label
                            forHtml="status"
                            className="control-label"
                        >
                            Contact Phone Number
                        </label>
                        <input
                            type="text"
                            maxlength="100"
                            className="form-control"
                            id="contactphone"
                            placeholder="Enter Phone Number"
                            value={customerDetails?.customerContact?.[0]?.mobileNo}
                            disabled="disabled"
                        />
                        <span className="errormsg"></span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label
                            htmlFor="contactPreference"
                            className="control-label"
                        >
                            Contact Preference{" "}
                            <span className="text-danger font-20 pl-1 fld-imp">
                                *
                            </span>
                        </label>
                        <Select
                            id="contactPreference"
                            value={selectedContactPreference}
                            options={contactPreferenceLookup}
                            isMulti
                            onChange={(selectedOption) => {
                                handleInputChange({
                                    target: {
                                        id: "contactPreference",
                                        value: selectedOption,
                                    },
                                });
                                setSelectedContactPreference(selectedOption);
                            }}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 99999 }) }}
                        />
                        <span className="errormsg">
                            {error?.contactPreference ? error?.contactPreference : ""}
                        </span>
                    </div>
                </div>
            </div>
            <div className="row">
                <div className="custom-control custom-checkbox mt-3 mb-3 ml-2">
                    <input type="checkbox" className='custom-control-input'
                        onChange={(e) => {
                            setOrderData({ ...orderData, markAsServiceAddress: e.target.checked })
                            handleSetCustomerAddress()
                        }}
                        id="markAsServiceAddress"
                        checked={orderData?.markAsServiceAddress}
                    />
                    <label
                        for="markAsServiceAddress"
                        className="custom-control-label"
                    >
                        Service address same as customer address
                    </label>
                </div>
                <div className="">
                    <AddressComponent index={0}
                        readOnly={orderData?.markAsServiceAddress}
                        addressList={addressList}
                        setAddressList={setAddressList}
                        error={addressError}
                        setError={setAddressError}
                    />
                </div>
            </div>
        </>
    )
}

export default CreateOrderForm;