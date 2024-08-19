import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import store from '../../assets/images/store.svg';
import { get, post, put } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { parsePhoneNumber } from "awesome-phonenumber";
import { object, string, boolean } from 'yup';
import { toast } from 'react-toastify';

const countryFlags = require("../../assets/files/country_flags.json");

const fieldInfoCss = {
    fontSize: '12px',
    color: '#343a40',
    fontWeight: '100'
}

const SystemParameters = (props) => {
    const history = useNavigate();

    const [masterConfigDetails, setMasterConfigDetails] = useState([]);
    const [fields, setFields] = useState({});
    const [data, setData] = useState({});
    const [error, setError] = useState({});
    const [validationSchema, setValidationSchema] = useState();

    const getConfigValue = (configKey) => masterConfigDetails.find(x => x.configKey === configKey)?.configValue;

    useEffect(() => {
        get(properties.MASTER_API + '/config-details').then((resp) => {
            setMasterConfigDetails(resp.data ?? []);
        }).catch(error => {
            console.error(error);
        });
    }, [])

    useEffect(() => {
        if (masterConfigDetails?.length) {
            masterConfigDetails.forEach(value => fields[value.configKey] = value.metaData);
            const initData = Object.keys(fields).reduce((ac, a) => ({ ...ac, [a]: getConfigValue(a) }), {});
            setData({ ...initData });
            setFields({ ...fields });
            setValidationSchema(object().shape(Object.keys(fields).reduce((ac, a) => {
                let type = fields[a]?.type;
                let label = fields[a]?.label;
                let isRequired = fields[a]?.props?.isRequired;
                let length = fields[a]?.props?.length;
                let valueType = fields[a]?.props?.valueType;
                let schemaStructure = type === "checkbox" ? boolean() : string();

                if (type === "email") schemaStructure = schemaStructure.email();

                if (length) schemaStructure = schemaStructure.max(length);

                if (valueType === "phoneNumber") {
                    schemaStructure = schemaStructure.test(a, "Phone number is not valid", (str, context) => {
                        let countryCode = countryFlags.find(e => e.name == data.country)?.code;
                        const pn = parsePhoneNumber(str, { regionCode: countryCode });
                        return pn.valid;
                    })
                }

                if (isRequired === true) schemaStructure = schemaStructure.required();

                if (typeof isRequired === 'object' && isRequired?.when?.key) {
                    schemaStructure = schemaStructure.when(isRequired?.when?.key, {
                        is: isRequired?.when?.value,
                        then: schema => schema.required(),
                        otherwise: schema => schema.optional()
                    })
                }

                schemaStructure = schemaStructure.label(label);

                return { ...ac, [a]: schemaStructure };
            }, {})))
        }
    }, [masterConfigDetails])

    const validate = (schema, data) => {
        try {
            setError({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const setFormData = (e) => {
        let { id, type, value, checked } = e.target;
        let formData = { ...data, [id]: type === "checkbox" ? checked : value };
        setData(formData);
    }

    const generateFormField = (id) => {
        const { type, label, props = {} } = masterConfigDetails.find(x => x.configKey == id)?.metaData;
        let isRequiredField = props.isRequired === true || typeof props.isRequired === 'object' && data[props.isRequired?.when?.key] === props.isRequired?.when?.value;
        return (
            <div className={props.className} key={id}>
                <div className="form-group">
                    {props.showLabel !== false && (
                        <label htmlFor={id} className="control-label">{label} {isRequiredField && <span className="text-danger font-20 pl-1 fld-imp">*</span>}</label>
                    )}
                    {["password", "text", "email", "number"].includes(type) ? (
                        <input type={type} id={id} disabled={props.disabled} autoComplete="new-password" className="form-control" value={data[id]} onChange={setFormData} />
                    ) : type === "textarea" ? (
                        <textarea type={type} disabled={props.disabled} rows={props.rows} ref={props.ref} id={id} className="form-control" value={data[id]} onChange={setFormData} />
                    ) : type === "select" ? (
                        <select className="form-control" disabled={props.disabled} id={id} value={data[id]} onChange={setFormData}>
                            <option>Select {label}</option>
                            {props?.options?.map((e, k) => (
                                <option key={k} value={e.code}>{e.description}</option>
                            ))}
                        </select>
                    ) : type === "checkbox" ? (
                        <div className="custom-control custom-checkbox">
                            <input type="checkbox" disabled={props.disabled} id={id} value={data[id]} checked={data[id]} onChange={setFormData} className="custom-control-input" />
                            <label className="custom-control-label" htmlFor={id}>{label}</label>
                        </div>
                    ) : null}
                    {props?.fieldInfo && (<label className="control-label" style={fieldInfoCss}>{props?.fieldInfo}</label>)}
                    <span className="errormsg">{error[id] ? error[id] : ""}</span>
                </div>
            </div>
        )
    }

    const handleSubmit = () => {
        const isValid = validate(validationSchema, data);
        
        if (isValid) return;

        post(properties.MASTER_API + '/config-details', data).then((resp) => {
            toast[resp.status === 200 ? 'success' : 'error'](resp.message);
        }).catch(error => {
            toast.error(error?.response?.message);
        });
    }

    return (
        <div className="cnt-wrapper">
            <div className="card-skeleton">
                <div className="customer-skel">
                    <div className="cmmn-skeleton">
                        <div className="row">
                            <div className="skel-configuration-settings">
                                <div className="col-md-8">
                                    <div className="skel-config-top-sect">
                                        <h2>System Parameter Settings</h2>
                                        <p>Follow the setup wizard that will guide you through the remaining steps to complete the configuration setup.</p>
                                        <span className="skel-step-styl mt-1">est. 5 minutes <span className="material-icons skel-config-active-tick">check_circle</span></span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <img src={store} alt="" className="img-fluid" />
                                </div>
                            </div>
                        </div>
                        <div className='row'>
                            <div className="skel-config-info-layout">
                                <div className='col-md-12 mb-3'>
                                    <div className="tabbable">
                                        {masterConfigDetails?.length ? masterConfigDetails.map((configDetails, index) => (
                                            <div className="row mb-4" key={index}>
                                                <div className="skel-config-info-layout skel-system-para-settings">
                                                    {generateFormField(configDetails.configKey)}
                                                </div>
                                            </div>
                                        )) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="skel-sys-btn">
                            <button className="skel-btn-submit text-center skel-custom-submit-btn" onClick={handleSubmit}>Save Configuration</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SystemParameters