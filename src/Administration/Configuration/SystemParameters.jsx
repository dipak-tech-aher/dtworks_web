import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import store from '../../assets/images/store.svg';
import { get, post, put } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { parsePhoneNumber } from "awesome-phonenumber";
import { object, string, boolean, array } from 'yup';
import { toast } from 'react-toastify';
import { unstable_batchedUpdates } from 'react-dom';
import Select from 'react-select';
import { useDeepCompareEffect } from '../../common/util/util';
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
    const [codeTypes, setCodeTypes] = useState([]);
    const [lookUpDatas, setLookUpDatas] = useState({});
    const getConfigValue = (configKey) => masterConfigDetails.find(x => x.configKey === configKey)?.configValue;

    useDeepCompareEffect(() => {
        const getBusinessEntityData = async () => {
            try {
                const response = await get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=${codeTypes.toString()}`)
                if (response?.data) {
                    Object.entries(response.data).forEach(([key, value]) => {
                        response.data[key] = value.map(item => ({
                            label: item.description,
                            value: item.code
                        }));
                    });
                    setLookUpDatas(response.data)
                }
            } catch (e) {
                console.log(e)
            }
        }
        if (codeTypes?.length) {
            getBusinessEntityData()

        }
    }, [codeTypes]);
    useEffect(() => {
        get(properties.MASTER_API + '/config-details').then((resp) => {
            let tempCodeTypes = [];
            if (resp.data && resp.data.length > 0) {
                tempCodeTypes = resp.data
                    .filter(item => item.metaData?.options === 'external')
                    .flatMap(item => item.metaData?.fields?.map(field => field.code) || []);
            }
            unstable_batchedUpdates(() => {
                let formatedResponse = resp.data?.map((item) => {
                    if (item.metaData?.type === "group") {
                        let value = item?.configValue ? JSON.parse(item?.configValue) : {}
                        return { ...item, configValue: value }
                    }
                    return item
                })
                setMasterConfigDetails(formatedResponse ?? []);
                if (tempCodeTypes?.length) {
                    setCodeTypes(tempCodeTypes?.filter(val => val))
                }
            })

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
                let schemaStructure = type === "checkbox" ? boolean() : type === "multi-select" ? array().min(1, 'Please select  one item') : type === "group" ? object() : string();

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

    const setFormData = (e, parentId) => {
        let { id, type, value, checked } = e.target;
        if (parentId) {
            const { fields = [] } = masterConfigDetails.find(x => x.configKey == parentId)?.metaData;
            let { valueField, valueType } = fields.find(x => x.type == id) ?? {}
            const formattedValue = valueType === 'string' ? value.map(val => val.value) : value;
            setData(prevData => ({ ...prevData, [id]: value, [parentId]: { ...prevData[parentId], [valueField]: formattedValue } }));
        } else {
            let formData = { ...data, [id]: type === "checkbox" ? checked : value };
            setData(formData);
        }
    }
    const handleLogoChange = async (e) => {

        if (!e?.target?.files || e?.target?.files?.length === 0) {
            toast.error("Please select the file to upload");
            return false;
        }

        var extension = e?.target?.files?.[0]?.name?.substr(e?.target?.files[0]?.name?.lastIndexOf('.'));
        if (!(extension?.toLowerCase() === ".jpg") &&
            !(extension?.toLowerCase() === ".jpeg") &&
            !(extension?.toLowerCase() === ".png")
        ) {
            toast.error(e.target.files?.[0]?.name + ' is invalid file format, Please try again with jpg/jpeg/png');
            return false;
        }

        validateImage(e).then(() => {
        }).catch(error => {
            console.log(error)
            toast.warn(error?.message)
        })

        if (e.target.files[0]?.size > 1000000) {
            toast.error("File too Big, please select a file less than 1mb");
            return false;
        }

        const image = await convertBase64(e);
        setData({
            ...data,
            [e?.target?.id]: image
        })
    }
    const convertBase64 = (e) => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.readAsDataURL(e.target.files[0]);

            fileReader.onload = () => {
                resolve(fileReader.result);
                return fileReader.result
            };

            fileReader.onerror = (error) => {
                reject(error);
            };
        });
    };
    const validateImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = function (event) {
                const image = new Image();
                image.onload = function () {
                    const width = this.width;
                    const height = this.height;

                    if (width === 150 && height === 150) {
                        resolve();
                    } else {
                        reject(new Error('Invalid image dimensions. Please upload an image with dimensions 150x150.'));
                    }
                };
            };
        });
    }
    const handleMultiSelect = (value, id, parentId) => {
        console.log(id, parentId)
        if (parentId) {
            const { fields = [] } = masterConfigDetails.find(x => x.configKey == parentId)?.metaData;
            let { valueField, valueType } = fields.find(x => x.type == id) ?? {}
            const formattedValue = valueType === 'string' ? value.map(val => val.value) : value;
            setData(prevData => ({ ...prevData, [id]: value, [parentId]: { ...prevData[parentId], [valueField]: formattedValue } }));
        } else {
            setData(prevData => ({ ...prevData, [id]: value }));
        }
    }
    const generateFormField = (id, metaObj, parentId) => {
        const { type, label, props = {}, code, fields = [], value } = masterConfigDetails.find(x => x.configKey == id)?.metaData ?? metaObj ?? {};
        let isRequiredField = props.isRequired === true || typeof props.isRequired === 'object' && data[props.isRequired?.when?.key] === props.isRequired?.when?.value;
        return (
            <div className={props.className} key={id}>
                <div className="form-group">
                    {props.showLabel !== false && (
                        <label htmlFor={id} className="control-label">{label} {isRequiredField && <span className="text-danger font-20 pl-1 fld-imp">*</span>}</label>
                    )}
                    {["password", "text", "email", "number"].includes(type) ? (
                        <input type={type} id={id} disabled={props.disabled} autoComplete="new-password" className="form-control" value={data[id] ?? value ?? ''} onChange={(e) => setFormData(e, parentId)} />
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
                    ) : type === "fileupload" ? (
                        <div className="skel-config-data">
                            <div className="skel-config-btn">
                                <button className="skel-btn-submit skel-custom-submit-btn">
                                    <label htmlFor={id} style={{ margin: "auto", padding: "2px", color: "white", textJustify: "auto", textAlign: "center", cursor: "pointer" }}>Upload Logo</label>
                                </button>
                                <input type="file" accept="image/*" name="image-upload" id={id} style={{ display: "none" }} onChange={handleLogoChange} />
                            </div>
                            {data[id] && <div className="text-center sys-parm-img">
                                <img alt=" " className="" id="img" src={data[id]} width="150px" height="150px" style={{ objectFit: "cover" }}>
                                </img>
                            </div>}

                        </div>
                    ) : type === "multi-select" ? (
                        <Select
                            closeMenuOnSelect={false}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            value={data[id] ?? value ?? []}
                            options={lookUpDatas[code]}
                            getOptionLabel={option => `${option.label}`}
                            onChange={(e) => handleMultiSelect(e, id, parentId)}
                            isMulti
                            isClearable
                            name={id}
                        />
                    ) : type === "group" ? (
                        <>
                            <div className="skel-config-data">
                                {fields?.map((field) => {
                                    const parentValue = data[id] ?? {};
                                    return generateFormField(field?.type, { ...field, value: parentValue[field?.valueField] }, id)
                                })}
                            </div>
                        </>
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
        let requestObj = {}
        Object.keys(data).forEach((key) => {
            requestObj[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])
        })
        post(properties.MASTER_API + '/config-details', requestObj).then((resp) => {
            toast[resp.status === 200 ? 'success' : 'error'](resp.message);
            history(`/configuration-settings`)
        }).catch(error => {
            toast.error(error?.response?.message);
        });
    }
    // console.log('masterConfigDetails', masterConfigDetails)
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
