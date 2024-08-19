import { useEffect, useRef, useState } from "react";
import { Element } from 'react-scroll';
import ReactSwitch from 'react-switch';
import { toast } from "react-toastify";
import { object, string } from "yup";
import { hideSpinner, showSpinner } from "../common/spinner";
import AddressPreview from "../customer/addressPreview";
import { properties } from "../properties";
import { ameyoGet, ameyoPost, ameyoPut } from "../util/restUtil";
import AddressFormForInq from '../customer/AddressFormForInq';
import { unstable_batchedUpdates } from "react-dom";
// const addressValidationSchema = object().shape({
//     district: string().required("district is required"),
//     state: string().required("state is required"),
//     postCode: string().required("postCode is required"),
//     //country: string().required("country is required"),
// });

const customerDetailsValidationSchema = object().shape({
    customerName: string().required('Customer Name is required'),
    //   customerType: string().required("Customer Type is required"),
    //   email: string().required("Email is required"),
    contactNo: string().required("Contact Number is required")
})

// const InquiryCustomerDetailsValidationSchema = object().shape({
//     contactNo: string().required("Contact Number is required"),
//     customerName: string().required("Customer name is required")
// })

const CitizenDetailsForm = (props) => {

    const { setMode, setCustomerData, getCustomerDetails } = props?.handler
    const { mode, customerData, type } = props?.data
    //  const phone = props.location.state && props.location.state.phone
    // const { countries, districtLookup, kampongLookup, postCodeLookup, mukimLookup } = props?.lookups
    const [customerDetailsError, setCustomerDetailsError] = useState({
    })
    const [installationError, setInstallationError] = useState({})
    const accessToken = localStorage.getItem("accessToken")
    //const [installationAddressError, setInstallationAddressError] = useState({})
    const [addressLookUpRef, setAddressLookUpRef] = useState(null)
    const [installationAddress, setInstallationAddress] = useState({
        sameAsCustomerAddress: false,
        flatHouseUnitNo: '',
        block: '',
        building: '',
        street: '',
        road: '',
        district: '',
        state: '',
        village: '',
        cityTowm: '',
        country: 'Brunei Darussalam',
        postCode: ''
    });
    const [districtLookup, setDistrictLookup] = useState([])
    const [kampongLookup, setKampongLookup] = useState([])
    const [postCodeLookup, setPostCodeLookup] = useState([])
    const [mukimLookup, setMukimLookup] = useState([])
    const addressLookup = useRef({})
    // const addressElements = props?.lookups?.addressElements
    const [countries, setCountries] = useState([])
    const options = [
        { value: 'BUSINESS', label: 'Business' },
        { value: 'RESIDENTIAL', label: 'Residential' },
        { value: 'GOVERNMENT', label: 'Government' },
    ]

    useEffect(() => {
        let district = []
        let kampong = []
        let postCode = []
        let mukim = []
        showSpinner();
        ameyoPost(properties.BUSINESS_ENTITY_API, ["COUNTRY"], accessToken).then((response) => {
            if (response.data) {
                showSpinner();
                ameyoGet(properties.ADDRESS_LOOKUP_API, '', accessToken).then((resp) => {
                    if (resp && resp.data) {
                        addressLookup.current = resp.data
                        setAddressLookUpRef(resp.data)
                        for (let e of addressLookup.current) {
                            if (!district.includes(e.district)) {
                                district.push(e.district)
                            }
                            if (!kampong.includes(e.kampong)) {
                                kampong.push(e.kampong)
                                let obj = { label: e.kampong, value: e.kampong }
                                kampong.push(obj)
                            }
                            if (!mukim.includes(e.subDistrict)) {
                                mukim.push(e.subDistrict)
                            }
                            if (!postCode.includes(e.postCode)) {
                                postCode.push(e.postCode)
                            }
                        }
                        unstable_batchedUpdates(() => {
                            setDistrictLookup(district);
                            setKampongLookup(kampong);
                            setPostCodeLookup(postCode);
                            setMukimLookup(mukim)
                            setCountries(response.data.COUNTRY)
                        })
                        // for (const a of district) {
                        //     v_district.push({ code: a, description: a })
                        // }
                        // for (const a of kampong) {
                        //     v_kampong.push({ code: a, description: a })
                        // }
                        // for (const a of postCode) {
                        //     v_postCode.push({ code: a, description: a })
                        // }
                    }

                }).catch().finally(hideSpinner)
            }
        }).catch().finally(hideSpinner)
    }, [])

    const handleOnChangeEdit = () => {
        if (mode.mode === 'view') {
            setMode({ ...mode, mode: "show" })
            // setCustomerAddress({
            //     ...customerAddress,
            //     flatHouseUnitNo: customerData?.address?.hno,
            //     building: customerData?.address?.building,
            //     street: customerData?.address?.street,
            //     road: customerData?.address?.road,
            //     district: customerData?.address?.district,
            //     state: customerData?.address?.state,
            //     cityTown: customerData?.address?.cityTown,
            //     postCode: customerData?.address?.postCode
            // })
        }
        else {
            setMode({ ...mode, mode: "view" })
        }
    }

    const handleCancel = () => {
        setMode({
            ...mode,
            mode: "view"
        })
    }

    const validate = (section, schema, data, holdPrevErrors = false) => {
        try {
            if (section === 'DETAILS') {
                holdPrevErrors === false && setCustomerDetailsError({})
            }
            if (section === 'ADDRESS') {
                holdPrevErrors === false && setInstallationError({})
            }
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                if (section === 'DETAILS') {
                    setCustomerDetailsError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
                if (section === 'ADDRESS') {
                    setInstallationError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
            });
            return e;
        }
    }

    // const ValidateAddressDetails = () => {
    //     let error = validate('ADDRESS', addressValidationSchema, customerAddress);
    //     if (error) {
    //         return true;
    //     }
    //     return false;
    // }

    // const validateCustomerDetailsInquiry = () => {
    //     let error = validate('DETAILS', InquiryCustomerDetailsValidationSchema, customerData);
    //     if (error) {
    //         toast.error("Validation errors found. Please check highlighted fields");
    //         return false;
    //     }
    //     return true;
    // }

    const addressValidationSchema = object().shape({
        flatHouseUnitNo: string().required("FlatHouseUnitNo is required"),
        street: string().required("Street is required"),
        mukim: string().required("Mukim is required"),
        district: string().required("District is required"),
        state: string().required("State is required"),
        postCode: string().required("Post Code is required"),
        country: string().required("Country is required")
    })
    const handleSubmit = () => {

        const error = validate('DETAILS', customerDetailsValidationSchema, customerData, true);
        const addressError = validate('ADDRESS', addressValidationSchema, installationAddress)
        // console.log('addressError', addressError)
        if (error || addressError) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false
        }
        if (mode.isExistingCitizen === 'N') {
            createCustomer()
        }
        else if (mode.isExistingCitizen === 'Y') {
            updateCustomer()
        }
        else {
            toast.warn("Please select Interaction Type");
        }
    }

    const createCustomer = () => {
        const requestBody = {
            "foreName": customerData.customerName,
            "contactNbr": customerData.contactNo,
            email: customerData?.emailcheck === 'Y' ? 'NA' : customerData.email,
            customerType: customerData.customerType,
            address: {
                "flatHouseUnitNo": installationAddress?.flatHouseUnitNo,
                "building": installationAddress?.building,
                "street": installationAddress?.street,
                "district": installationAddress?.district,
                "state": installationAddress?.state,
                "cityTown": installationAddress?.mukim,
                "postCode": installationAddress?.postCode,
                country: installationAddress?.country,
            }
        }

        showSpinner()
        ameyoPost(properties.AMEYO_API, { ...requestBody }, accessToken)
            .then((response) => {
                if (response.status === 200) {
                    toast.success('Citizen Details Created Sucessfully')
                    getCustomerDetails(customerData?.contactNo)

                }
            }).finally(hideSpinner)
    }

    const updateCustomer = () => {
        let contact
        if (customerData.contactNo.length > 7 && customerData.contactNo.length === 10) {
            let contact = customerData.contactNo.substring(3, 10)
            // console.log("phone", phone)
        }
        const requestBody = {
            customerId: customerData?.customerId,
            contactId: customerData?.contactId,
            // addressId: customerData.address?.addressId,
            foreName: customerData.customerName,
            contactNbr: contact || customerData.contactNo,
            email: customerData?.emailcheck === 'Y' ? 'NA' : customerData.email,
            customerType: customerData.customerType,
            address: {
                "flatHouseUnitNo": installationAddress?.flatHouseUnitNo,
                "building": installationAddress?.building,
                "street": installationAddress?.street,
                "district": installationAddress?.district,
                "state": installationAddress?.state,
                "cityTown": installationAddress?.mukim,
                "postCode": installationAddress?.postCode,
                country: installationAddress?.country,
            }
        }

        showSpinner()
        ameyoPut(properties.AMEYO_API + '/update/customer', { ...requestBody }, accessToken)
            .then((response) => {
                if (response.status === 200) {
                    toast.success('Citizen Details Created Sucessfully')
                    getCustomerDetails(customerData?.contactNo)
                }
            }).finally(hideSpinner)

    }

    return (
        <>
            <div className="col-md-12  p-0">
                <div data-spy="scroll" data-target="#scroll-list" data-offset="0" className="scrollspy-div">
                    <Element name="customerSection" className="element new-customer">
                        <div className="row">
                            <section className="triangle col-12 pb-2">
                                <div className="row col-12">
                                    <div className="col-9">
                                        <h4 id="list-item-0" className="pl-2 " style={{ alignContent: 'right' }}>Citizen Details</h4>
                                    </div>
                                    <div className="col-3 text-left">
                                        <div className="row ml-0 mt-2">
                                            <div className="ml-0 row col-12 label-align">
                                                <label htmlFor="editDetails" className="mt-0 pt-0  px-2 ml-2 col-form-label">Edit Details </label>
                                                <ReactSwitch
                                                    onColor="#f58521"
                                                    offColor="#6c757d"
                                                    activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                                    height={20}
                                                    width={48}
                                                    checked={mode.mode === 'show' ? true : false}
                                                    //   className={`${(error?.sameAsCustomerAddress ? "input-error" : "")}`} 
                                                    id="editDetails"
                                                    onChange={handleOnChangeEdit}
                                                // onChange={e => {
                                                //     setMode({ ...mode, mode: e === true ? 'show' : 'view' });
                                                // }}
                                                />
                                            </div>
                                            {/* <span className="errormsg">{error?.sameAsCustomerAddress ? error?.sameAsCustomerAddress : ""}</span> */}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        <div className="block-section">
                            <fieldset className="scheduler-border">
                                <div id="customer-details">
                                    <div className="row">
                                        {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="inputId" className="col-form-label">Citizen Number</label>
                                                <p>{customerData && customerData.customerId}</p>
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="inputId" className="col-form-label">Citizen Name<span>*</span></label>
                                                <input type="text" disabled={mode.mode === 'view' ? 'disabled' : ""} value={customerData?.customerName} className={`form-control ${customerDetailsError.customerName && "error-border"}`} id="customerName" placeholder="Citizen Name"
                                                    onChange={(e) => {
                                                        setCustomerData({ ...customerData, customerName: e.target.value })
                                                        setCustomerDetailsError({ ...customerDetailsError, customerName: "" })
                                                    }}
                                                />
                                                <span className="errormsg">{customerDetailsError.customerName ? customerDetailsError.customerName : ""}</span>

                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="inputState" className="col-form-label">Citizen Type</label>
                                                <select id="customerType" disabled={mode.mode === 'view' ? 'disabled' : ""} value={customerData?.customerType} className={`form-control ${customerDetailsError.customerType && "error-border"}`}
                                                    onChange={(e) => {
                                                        setCustomerData({ ...customerData, customerType: e.target.value })
                                                        setCustomerDetailsError({ ...customerDetailsError, customerType: "" })
                                                    }
                                                    }>
                                                    <option value="">Choose Citizen Type</option>
                                                    {
                                                        options.map((e) => (
                                                            <option key={e.value} value={e.value}>{e.label}</option>
                                                        ))
                                                    }
                                                </select>
                                                <span className="errormsg">{customerDetailsError.customerType ? customerDetailsError.customerType : ""}</span>

                                            </div>
                                        </div>
                                        {/* </div>
                                    <div className="row"> */}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="inputState" className="col-form-label">Contact Number<span>*</span></label>
                                                <input type="text" maxLength={12} disabled={mode.mode === 'view' ? 'disabled' : ""} value={customerData?.contactNo} className={`form-control ${customerDetailsError.contactNo && "error-border"}`}
                                                    id="contactNo" placeholder="Contact Number"
                                                    onChange={(e) => {
                                                        setCustomerData({ ...customerData, contactNo: e.target.value })
                                                        setCustomerDetailsError({ ...customerDetailsError, contactNo: "" })
                                                    }
                                                    }
                                                />
                                                <span className="errormsg">{customerDetailsError.contactNo ? customerDetailsError.contactNo : ""}</span>
                                            </div>
                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="form-group pl-2">
                                                <label htmlFor="emailcheck" className="col-form-label">No Email Address</label>
                                                <input type="checkbox" className="control-input" id="emailcheck" checked={customerData?.emailcheck === "Y" ? true : false}
                                                    onChange={(e) => {
                                                        if (e.target.checked === true) {
                                                            setCustomerData({ ...customerData, emailcheck: 'Y', email: '' })
                                                        }
                                                        else if (e.target.checked === false) {
                                                            setCustomerData({ ...customerData, emailcheck: 'N' })
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="form-group" >
                                                <label htmlFor="inputState" className="col-form-label">Email ID</label>
                                                <input type="text" disabled={mode.mode === 'view' ? 'disabled' : customerData.emailcheck === 'Y' ? "disabled" : ""} value={customerData?.email} className='form-control' id="email" placeholder="Email"
                                                    onChange={(e) => {
                                                        setCustomerData({ ...customerData, email: e.target.value })
                                                        setCustomerDetailsError({ ...customerDetailsError, email: "" })
                                                    }
                                                    }
                                                />
                                                <span className="errormsg">{customerDetailsError.email ? customerDetailsError.email : ""}</span>

                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <label htmlFor="inputState" className="col-form-label">No Email Address</label>
                                            <input type="checkbox" className="control-input" disabled={mode.mode === 'view' ? 'disabled' : ''} id="emailcheck" checked={customerData?.emailcheck === "Y" ? true : false}
                                                onChange={(e) => {
                                                    if (e.target.checked === true) {
                                                        setCustomerData({ ...customerData, emailcheck: 'Y', email: '' })
                                                    }
                                                    else if (e.target.checked === false) {
                                                        setCustomerData({ ...customerData, emailcheck: 'N' })
                                                    }
                                                }}
                                            />

                                        </div>

                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </Element>
                    {type === 'Inquiry' && mode.isExistingCitizen === 'N' && mode.mode !== 'view' &&
                        <AddressFormForInq
                            addressData={installationAddress}
                            countries={countries}
                            locations={[]}
                            lookups={{
                                districtLookup: districtLookup,
                                kampongLookup: kampongLookup,
                                postCodeLookup: postCodeLookup,
                                addressElements: addressLookUpRef,
                                mukimLookup: mukimLookup,
                            }}
                            title={"inquiry_address"}
                            error={installationError}
                            setError={setInstallationError}
                            setDetailsValidate={() => { }}
                            detailsValidate={{}}
                            lookupsHandler={{
                                setAddressData: setInstallationAddress,
                                setKampongLookup, setPostCodeLookup, setMukimLookup
                            }}

                        />}

                    {type === 'Inquiry' && mode.isExistingCitizen === 'Y' && <AddressPreview
                        data={{
                            title: "customer_address",
                            addressData: customerData?.address
                        }}
                    />}
                    {/* }
                    </div>  */}
                    <div>
                        {mode.mode === 'show' && <div id="page-buttons" className="d-flex justify-content-center mt-3" >
                            <button type="submit" id="submit" className="btn btn-primary waves-effect waves-light mr-2" onClick={handleSubmit}>Save</button>
                            <button type="button" id="cancel" className="btn btn-secondary waves-effect waves-light ml-2" onClick={handleCancel}>Cancel</button>
                        </div>}
                        {/* <button type="button" onClick={handleOnChangeEdit}
                            className={`btn btn-labeled btn-primary btn-sm mt-1`}>
                            <i className="fas fa-edit"></i><span className="btn-label"></span>
                            {mode.mode === 'show' ? 'Save details' : 'Edit details'}
                        </button>
                        <button type="button" onClick={handleCancel}
                            className={`btn btn-labeled btn-primary btn-sm mt-1`}>
                            <i className="fas fa-edit"></i><span className="btn-label"></span>
                            Cancel
                        </button> */}
                    </div>
                </div>
            </div>
        </>
    )
}
export default CitizenDetailsForm