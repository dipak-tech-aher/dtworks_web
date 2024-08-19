import React from 'react'
import { useState } from "react";
import { toast } from "react-toastify";
import { string, object } from "yup";
import { useTranslation } from "react-i18next";
import { Element } from 'react-scroll'
import { get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

import { validateNumber } from "../../../common/util/validateUtil";
import { useNavigate } from "react-router-dom";
const kioskNumberValidationSchema = object().shape({
    kioskRefNo: string().required("Channel Reference Number is required.")
})

export default function KioskSearch() {
    const history = useNavigate();

    const [kioskreferenceNo, setkioskReferenceNo] = useState({
        kioskRefNo: ""
    })
    const [kioskRefNoError, setKioskRefNoError] = useState({});
    const { t } = useTranslation();

    const [isStatusClosed, setIsStatusClosed] = useState({
        status: false,
        message: ""
    })

    const validate = (section, schema, data) => {
        try {
            if (section === 'KIOSKNUMBER') {
                setKioskRefNoError({})
            }
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                if (section === 'KIOSKNUMBER') {
                    setKioskRefNoError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
            });
            return e;
        }
    };

    const validKioskNo = () => {
        const error = validate('KIOSKNUMBER', kioskNumberValidationSchema, kioskreferenceNo);
        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false;
        }
        return true
    }
    const handleKioskSearch = (e) => {
        e.preventDefault();
        setIsStatusClosed({ status: false, message: "" })
        if (validKioskNo()) {
            getKioskNumberValidation(kioskreferenceNo.kioskRefNo)
        }
    }

    const getKioskNumberValidation = (referenceNo) => {
        let apiData
        let type = ''
        let formUrl

        get(properties.KIOSK_REF_API + `/${referenceNo}`)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        apiData = resp.data;
                        if (apiData.status === 'CLOSED' && apiData.hasOwnProperty('serviceRequestId')) {
                            setIsStatusClosed({
                                status: true,
                                message: `${resp.message} ${apiData.serviceRequestId}`
                            })
                        }
                        else {
                            // console.log('apiData.customerId : ', apiData)
                            if (apiData.customerId !== '' &&
                                apiData.customerId !== null
                                && apiData.customerId !== undefined) {
                                type = 'Existing'
                                //localStorage.setItem("accountNo", "30000044")
                                localStorage.setItem("customerId", apiData.customerId)
                                localStorage.setItem("accountId", apiData.accountId)
                                localStorage.setItem("serviceId", apiData.connectionId)
                                localStorage.removeItem("service")
                                localStorage.removeItem("account")
                                formUrl = `/customer360`
                            }
                            else {
                                type = 'New'
                                formUrl = `/create-inquiry-new-customer`
                            }
                            history(formUrl, {
                                state: {
                                    data: {
                                        sourceName: 'fromKiosk',
                                        referenceNo: referenceNo,
                                        customerType: type,
                                        apiData: apiData
                                    }
                                }
                            })
                        }
                    } else {
                        toast.error("Failed to call Kiosk - " + resp.status);

                    }
                } else {
                    toast.error("Uexpected error ocurred " + resp.statusCode);
                }
            }).catch(error => console.log(error)).finally();
    }



    return (
        <div>
            <Element name="customersection" className="element" >
                <fieldset className="scheduler-border1">
                    <legend className="scheduler-border scheduler-box"> {/*{t("kiosk_search")}*/}Channel Reference Number Search</legend>
                    <div className="col-md-12" >
                        <div className="app-search-box dropdown">
                            <div className="input-group">
                                <input type="search"
                                    className={`form-control ${(kioskRefNoError.kioskRefNo ? "input-error" : "")}`}
                                    value={kioskreferenceNo.kioskRefNo}
                                    //disabled={(switchToExistingCustomer.isExsitingCustomer) ? '' : 'disabled'}
                                    placeholder="Channel Reference Number"
                                    id="service-no-search"
                                    onKeyPress={(e) => {
                                        validateNumber(e);
                                        if (e.key === "Enter") {
                                            handleKioskSearch(e)
                                        };
                                    }}
                                    onChange={e => {
                                        setIsStatusClosed({ status: false, message: "" })
                                        setkioskReferenceNo({ ...kioskreferenceNo, kioskRefNo: e.target.value })
                                    }}
                                />
                                <span className="errormsg">{kioskRefNoError.kioskRefNo ? kioskRefNoError.kioskRefNo : ""}</span>
                                <span className="errormsg">{(isStatusClosed.status) ? isStatusClosed.message : ""}</span>

                            </div>
                        </div>
                    </div>
                    <br></br>
                    <div className="d-flex justify-content-center">
                        <button className="btn btn-primary btn-md  waves-effect waves-light ml-2 float-right" onClick={handleKioskSearch}>Search</button>
                    </div>
                </fieldset>
            </Element >
        </div >
    )
}
