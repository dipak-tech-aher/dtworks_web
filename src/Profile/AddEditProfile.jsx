import React, { useEffect, useState, useCallback, useContext } from 'react';
import { post, get, put } from '../common/util/restUtil';
import { properties } from '../properties';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { object, string, array } from "yup";
import { NumberFormatBase } from 'react-number-format';
import Select from "react-select";
import { AppContext } from '../AppContext';
import { isObjectEmpty } from '../common/util/validateUtil';
import AddressComponent from '../HelpdeskAndInteraction/Helpdesk/AddressComponent';
import { RegularModalCustomStyles, getPermissions, getConfig } from '../common/util/util';
import { DatePicker } from 'rsuite';
import moment from 'moment';
import { startCase } from 'lodash'
import { isAfter } from 'date-fns';
import SelectCountry from '../common/components/countryList';
import { isArray } from 'lodash'
import { metaConfig } from '../AppConstants'


const AddEditProfile = (props) => {
    const { auth, appConfig, systemConfig } = useContext(AppContext)
    const { type, consumerDetails, refreshPage } = props?.data
    const { setConsumerDetails = () => { }, setIsModalOpen = () => { }, pageRefresh = () => { }, setConsumerNo = () => { }, setRefreshPage = () => { } } = props?.handlers
    // console.log(type, consumerDetails)
    const isExisting = type === 'CREATE' ? false : true
    const [createProfileInputsErrors, setCreateProfileInputsErrors] = useState({});
    // const [error, setError] = useState({});
    const [genderOptions, setGenderOptions] = useState([])
    const [consumerFromOptions, setConsumerFromOptions] = useState([])
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [consumerFromIsEnabled, setConsumerFromIsEnabled] = useState("")
    const [anonymous, setAnonymous] = useState(false)

    const addrInitVal = {
        address1: consumerDetails?.profileAddress?.[0]?.address1 || '',
        address2: consumerDetails?.profileAddress?.[0]?.address2 || '',
        address3: consumerDetails?.profileAddress?.[0]?.address3 || '',
        postcode: consumerDetails?.profileAddress?.[0]?.postcode || '',
        country: consumerDetails?.profileAddress?.[0]?.country || '',
        state: consumerDetails?.profileAddress?.[0]?.state || '',
        city: consumerDetails?.profileAddress?.[0]?.city || '',
        addressType: consumerDetails?.profileAddress?.[0]?.addressType?.code || '',
        district: consumerDetails?.profileAddress?.[0]?.district || ''
    }

    const [countryLookup, setCountryLookup] = useState([]);
    const [project, setProjects] = useState([])
    const contactpref = isArray(consumerDetails?.contactPreferencesDesc) ? consumerDetails?.contactPreferencesDesc?.map(m => { return { value: m.code, label: m.description } }) : consumerDetails?.contactPreference ? consumerDetails?.contactPreference : []
    const initialValues = {
        profileNo: consumerDetails?.profileNo,
        firstName: consumerDetails?.firstName || "",
        lastName: consumerDetails?.lastName || "",
        category: consumerDetails?.profileCategory ? consumerDetails?.profileCategory : (consumerDetails?.customerCatDesc?.code || consumerDetails?.profileCatDesc?.code),
        mobileNo: consumerDetails?.profileContact?.[0].mobileNo ? consumerDetails?.profileContact?.[0].mobileNo : consumerDetails?.mobileNo || "",
        emailId: consumerDetails?.profileContact?.[0].emailId ? consumerDetails?.profileContact?.[0].emailId : consumerDetails?.emailId || "",
        contactPreference: contactpref || [],
        idType: consumerDetails?.idType || "",
        idValue: consumerDetails?.idValue || "",
        searchProfile: "",
        useExistingProfile: isExisting,
        extn: consumerDetails?.profileContact?.[0].mobilePrefix ? consumerDetails?.profileContact?.[0].mobilePrefix : consumerDetails?.mobilePrefix || [],
        projectMapping: [],
        registeredNo: consumerDetails?.registeredNo ?? '',
        gender: consumerDetails?.gender?.code ?? '',
        birthDate: consumerDetails?.birthDate ?? null,
        department: consumerDetails?.department?.code ?? null
    }

    if (consumerFromIsEnabled == "Y")
        initialValues.consumerFrom = consumerDetails?.consumerFrom?.code ?? '';

    // console.log('initialValues ', initialValues)
    let CreateProfileValidationSchema = object().shape({
        mobileNo: string().nullable(false).required("Contact number is required"),
        firstName: string().nullable(false).required("Name is required"),
        emailId: string().nullable(false).required("Email is required").email("Email is not in correct format"),
        category: string().nullable(false).required("Category is required"),
        extn: string().nullable(false).required("Prefix is required"),
        contactPreference: array().min(1, "Contact Preference is required")
    });   

    const AddressValidationSchema = object().shape({
        addressType: string().nullable(false).required("Address Type is required"),
        address1: string().nullable(false).required("Address line one is required"),
        address2: string().nullable(false).required("Address line two is required"),
        postcode: string().nullable(false).required("Post code is required"),
        country: string().nullable(false).required("Country is required"),
        state: string().nullable(false).required("State is required"),
        district: string().nullable(false).required("District is required"),
        city: string().nullable(false).required("City is required"),
    });

    const [source, setSource] = useState('PARENT');
    const [readOnly, setReadOnly] = useState(false);//at the time of ncrtc we made as false
    const [createProfileInputs, setCreateProfileInputs] = useState(initialValues);
    const [addressList, setAddressList] = useState([addrInitVal]);
    const [categoryLookup, setCategoryLookup] = useState([]);
    const [contactPreferenceLookup, setContactPreferenceLookup] = useState([]);
    const [idTypeLookup, setIdTypeLookup] = useState([]);
    const [mappedExtn, setMappedExtn] = useState([])
    const [phoneNolength, setPhoneNolength] = useState()
    const [phoneNoPrefix, setPhoneNoPrefix] = useState([])
    const [addressTypeLookup, setAddressTypeLookup] = useState([])
    const [countries, setCountries] = useState([])
    const [isAddressRequired, setIsAddressRequired] = useState(consumerDetails?.profileAddress?.length > 0 ? true : false)
    const [departmentLookup, setDepartmentLookup] = useState([]);
    const [departmentEnable, setDepartmentEnable] = useState(false);
    const getLookupData = useCallback(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=COUNTRY,CUSTOMER_CATEGORY,CONTACT_PREFERENCE,CUSTOMER_ID_TYPE,PROJECT,COUNTRY,ADDRESS_TYPE,GENDER,CONSUMER_FROM')
            .then((response) => {
                const { data } = response;
                const contactPreferenceOptions = data?.CONTACT_PREFERENCE.map((preference) => {
                    return {
                        value: preference.code,
                        label: preference.description
                    }
                })

                let projectOptions = data?.PROJECT?.filter((f) => f.mapping?.department?.includes(auth?.currDeptId)).map((p) => ({ 'label': p.description, 'value': p.code }))

                unstable_batchedUpdates(() => {
                    setCountries(data['COUNTRY'])
                    setCategoryLookup(data['CUSTOMER_CATEGORY']);
                    setContactPreferenceLookup(contactPreferenceOptions || []);
                    setIdTypeLookup(data['CUSTOMER_ID_TYPE']);
                    setProjects(projectOptions || [])
                    setAddressTypeLookup(data['ADDRESS_TYPE']);
                    setGenderOptions(data.GENDER)
                    setConsumerFromOptions(data.CONSUMER_FROM)

                    const prefix = data?.COUNTRY.map((e) => {
                        return {
                            value: e.mapping.countryCode,
                            label: "(" + e.mapping.countryCode + ") " + e.description,
                            phoneNolength: e.mapping.phoneNolength
                        }
                    })
                    setPhoneNoPrefix(prefix)
                    const prefix1 = data?.COUNTRY.map((e) => {
                        return {
                            code: e.description,
                            description: "(" + e.mapping.countryCode + ") " + e.description,
                        }
                    })
                    setCountryLookup(prefix1);
                })
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])

    useEffect(() => {
        getLookupData();
    }, [getLookupData])

    const validate = (schema, data, address) => {
        try {
            setCreateProfileInputsErrors({});
            // if (address) setError({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            // Address Component Validation
            // if (address) {
            //     e.inner.forEach((err) => {
            //         setError((prevState) => {
            //             return { ...prevState, [err.params.path]: err.message };
            //         });
            //     });
            //     // End 
            // } else {
                e.inner.forEach((err) => {
                    setCreateProfileInputsErrors((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                });
            // }

            return e;
        }
    };

    useEffect(() => {
        const existingProjects = consumerDetails?.projectMapping?.flatMap(m =>
            m?.project?.flatMap(f =>
                project.filter(p => {
                    return p.value === f
                })
            )
        )

        if (project?.length === 1) {
            setCreateProfileInputs({
                ...createProfileInputs, projectMapping: [{
                    value: project?.[0]?.value,
                    label: project?.[0]?.label,
                }]
            })
        } else {
            setCreateProfileInputs({
                ...createProfileInputs,
                projectMapping: existingProjects
            })
        }
    }, [project])

    const getRandomId = () => Math.floor(100000 + Math.random() * 900000);

    const handleOnCreateProfileInputsChange = (e) => {
        const { target } = e
        if (target.id === 'anonymous') {
            setCreateProfileInputs({
                ...createProfileInputs,
                firstName: target.value ? 'Anonymous' : null,
                lastName: target.value ? 'User' : null,
                emailId: target.value ? `anonymousUser${getRandomId()}@dtworks.com` : null,
                contactPreference: target.value ? [{ "value": "CNT_PREF_EMAIL", "label": "Email" }] : null,
                category: target.value ? 'REG' : null,
                [target.id]: target.value
            })
        }
        else if (target.id === "contactPreference" || target.id === "projectMapping") {
            // Handle multi-select inputs
            const selectedOptions = target?.value.map((option) => ({
                value: option?.value,
                label: option?.label,
            }));
            setCreateProfileInputs({ ...createProfileInputs, [target.id]: selectedOptions });
        } else {
            setCreateProfileInputs({
                ...createProfileInputs,
                [target.id]: target?.value
            })
        }

    }

    const createCustomer = () => {
        const mappedProjects = []

        if (!isObjectEmpty(createProfileInputs?.projectMapping)) {
            let projectArray = []
            createProfileInputs?.projectMapping.forEach((f) => {
                projectArray.push(f.value)
            })
            mappedProjects.push({
                entity: auth?.currDeptId,
                "project": projectArray
            })
        }

        let requestBody = {
            firstName: createProfileInputs?.firstName,
            lastName: createProfileInputs?.lastName,
            // idType: createProfileInputs?.idType || null,
            idType: createProfileInputs?.idType?.code || null,
            // idValue: createProfileInputs?.idValue || null,
            contactPreferences: createProfileInputs?.contactPreference?.map(option => option.value),
            projectMapping: mappedProjects,
            profileCategory: createProfileInputs?.category,
            idValue: `${createProfileInputs?.idValue ?? ''}`,
            registeredNo: createProfileInputs?.registeredNo ?? '',
            gender: createProfileInputs?.gender ?? '',
            department: createProfileInputs?.department ?? '',
            birthDate: createProfileInputs?.birthDate ?? null,
            contact: {
                isPrimary: true,
                firstName: createProfileInputs?.firstName,
                lastName: createProfileInputs?.lastName || '',
                contactType: 'CNTMOB',
                emailId: createProfileInputs?.emailId,
                mobilePrefix: createProfileInputs?.extn,
                mobileNo: createProfileInputs?.mobileNo
            },
            consumerFrom: createProfileInputs?.consumerFrom ?? '',
        }
        requestBody = {
            ...Object.fromEntries(
                Object.entries(requestBody).filter(([_, value]) => value !== undefined && value !== null && value !== "" && value.length !== 0)
            ),
        }
        if (isAddressRequired && addressList && addressList.length > 0 && Object.keys(addressList[0]).length) {
            for (let key of Object.keys(addressList[0])) {
                let value = addressList[0][key]
                if (value) {
                    requestBody.address = { ...requestBody.address, isPrimary: true, [key]: value }
                }
            }
        }
        if (isExisting) {
            requestBody.profileNo = consumerDetails?.profileNo
            requestBody.contact.contactNo = consumerDetails?.profileContact?.[0]?.contactNo
            requestBody.contact.contactType = consumerDetails?.profileContact?.[0]?.contactType?.code ? consumerDetails?.profileContact?.[0]?.contactType?.code : consumerDetails?.profileContact?.[0]?.contactType

            if (consumerDetails?.profileAddress?.[0]?.addressNo && requestBody.address) {
                requestBody.address.addressNo = consumerDetails?.profileAddress?.[0]?.addressNo
            }
            put(properties.PROFILE_API + '/update', requestBody)
                .then((response) => {
                    const { status, message } = response;
                    if (status === 200) {
                        handleOnCancel();
                        toast.success(message);
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally()
        } else {
            post(properties.PROFILE_API + '/create', requestBody)
                .then((response) => {
                    const { status, message, data: { profileNo } } = response;
                    if (status === 200) {
                        handleOnCancel();
                        setConsumerDetails({
                            ...consumerDetails,
                            ...response.data
                        })
                        setConsumerNo(profileNo)
                        toast.success(`${message} #${profileNo}`);
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally()
        }

    }

    const handleOnSubmit = () => {
        const validateInputs = { ...createProfileInputs, ...(isAddressRequired && addressList?.[0]) };
        if (consumerFromIsEnabled === "Y") {
            CreateProfileValidationSchema = CreateProfileValidationSchema.shape({
                consumerFrom: string().required("Consumer from is required")
            });
        }
    
        if (departmentEnable === "Y") {
            CreateProfileValidationSchema = CreateProfileValidationSchema.shape({
                department: string().required("Department is required")
            });
        }

        if (isAddressRequired) {
            CreateProfileValidationSchema = CreateProfileValidationSchema.concat(AddressValidationSchema);
        }

        if (validate(CreateProfileValidationSchema, validateInputs)) {
            toast.error("Validation Errors Found")
            return;
        }

        if (createProfileInputs?.contactPreference.length === 0) {
            toast.error("Contact Preference is required");
            return false
        }

        // if (isAddressRequired && addressList && addressList.length > 0 && Object.keys(addressList[0]).length) {
        //     for (let key of Object.keys(addressList[0])) {
        //         let value = addressList[0][key];
        //         if (!value && key !== 'address3') {
        //             if (validate(AddressValidationSchema, addressList[0], true)) {
        //                 toast.error("Validation Errors Found. Please provide address details")
        //                 return;
        //             }
        //             break;
        //         }
        //     }
        // }
        createCustomer()
    }

    const handleOnClear = () => {
        let newInitialValues = {
            ...initialValues,
            emailId: createProfileInputs.emailId
        }
        unstable_batchedUpdates(() => {
            setReadOnly(false);
            setCreateProfileInputs(newInitialValues);
        })
    }

    const handleOnCancel = () => {
        unstable_batchedUpdates(() => {
            setIsModalOpen(false)
            setCreateProfileInputs(initialValues);
            // pageRefresh(true)
            setRefreshPage(!refreshPage)
            setAddressList([{ "address1": '', "address2": '', "address3": '', "postcode": '', "country": '', "state": '', "city": '', "addressType": '', "district": "" }]);
        })
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('CREATE_PROFILE');
                // // console.log('permissions', permissions);
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };
        const getDepartments = async () => {
            try {
                get(`${properties.ORGANIZATION}/search`)
                    .then((resp) => {
                        if (resp && resp.data && resp.data.length > 0) {
                            const departments = resp?.data?.filter((e) => e.unitType === "DEPT");
                            unstable_batchedUpdates(() => {
                                setDepartmentLookup(departments);

                            });
                        }
                    })
                    .catch((error) => console.error(error))
                    .finally();
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };
        const getMetaConfig = async () => {
            try {
                const response = await getConfig(systemConfig, metaConfig?.PROFILE_DEPARTMENT_ATTRIBUTE_ENABLED);
                setDepartmentEnable(response?.configValue);
            } catch (e) {
                console.log('error', e)
            }
        }
        fetchData(); getDepartments(); getMetaConfig();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig, metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config?.configValue);
            } catch (error) {
                console.error('Error fetching specific system config:', error);
            }
        };
        fetchConfigData();
    }, [])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const handleOnChangeCountry = (e) => {
        setCreateProfileInputs({
            ...createProfileInputs,
            extn: e.mapping.countryCode,
            mobileNo: ""
        })
        setCreateProfileInputsErrors({ ...createProfileInputsErrors, extn: "" })
        setPhoneNolength(e.mapping.phoneNolength)
    }


    return (
        <div>
            <fieldset>
                <div className="row col-md-12">
                    {/* {!isExisting && checkComponentPermission('ANONYMOUS_PROF') && <div>
                        <div className="col-lg-12 col-md-12 col-sm-12">
                            <div className="form-group row">
                                <div className="custom-control custom-checkbox">
                                    <input
                                        type="checkbox"
                                        style={{ zIndex: 99 }}
                                        className="custom-control-input"
                                        id="anonymous"
                                        value={!!createProfileInputs?.anonymous}
                                        checked={!!createProfileInputs?.anonymous}
                                        onChange={(e) => {
                                            handleOnCreateProfileInputsChange({ target: { id: 'anonymous', value: e.target.checked } })
                                        }}
                                    />
                                    <label className="custom-control-label" htmlFor="anonymous">Anonymous</label>
                                </div>
                            </div>
                        </div>
                    </div>} */}
                    <div className="row col-12">
                        {createProfileInputs?.profileNo && <div className={readOnly ? "col-lg-2 col-md-2 col-sm-12" : "col-lg-3 col-md-3 col-sm-12"}>
                            <div className="form-group">
                                <label htmlFor="profileNo" className="control-label">Profile Id</label>
                                <input readOnly={true} type="text" className="form-control" id="profileNo" value={createProfileInputs?.profileNo ?? ""} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                        </div>}
                        <div className={(isExisting && readOnly) ? "col-lg-2 col-md-2 col-sm-12" : "col-lg-3 col-md-3 col-sm-12"}>
                            <div className="form-group">
                                <label htmlFor="firstName" className="control-label">First Name&nbsp;<span>*</span></label>
                                <input readOnly={readOnly} type="text" className={`form-control ${(createProfileInputsErrors.firstName ? "input-error" : "")} `} id="firstName" value={createProfileInputs?.firstName ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                            <span className="errormsg">
                                {createProfileInputsErrors.firstName ? createProfileInputsErrors.firstName : ""}
                            </span>
                        </div>
                        <div className={(isExisting && readOnly) ? "col-lg-2 col-md-2 col-sm-12" : "col-lg-3 col-md-3 col-sm-12"}>
                            <div className="form-group">
                                <label htmlFor="lastName" className="control-label">Last Name&nbsp;</label>
                                <input readOnly={readOnly} type="text" className="form-control" id="lastName" value={createProfileInputs?.lastName ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                            <span className="errormsg">
                                {createProfileInputsErrors.lastName ? createProfileInputsErrors.lastName : ""}
                            </span>
                        </div>
                        {checkComponentPermission('GENDER') && <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="Gender" className="control-label">Gender <span>*</span></label>
                                <select className="form-control" id="gender" value={createProfileInputs?.gender ?? ''} onChange={handleOnCreateProfileInputsChange}>
                                    <option value="" key='gender'>Select</option>
                                    {genderOptions.map((e) => (
                                        <option value={e.code} key={e.code}>{e.description}</option>
                                    ))}
                                </select>
                                <span className="errormsg">{createProfileInputsErrors?.gender ?? ""}</span>
                            </div>
                        </div>}
                        {checkComponentPermission('DATEOFBIRTH') && (
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="form-group">
                                    <label htmlFor="Gender" className="control-label">
                                        {appConfig?.clientFacingName?.['Dob']?.name ? startCase(appConfig?.clientFacingName?.['Dob']?.name) : 'Date of Birth'}
                                    </label>
                                    <DatePicker
                                        placement='autoVerticalStart'
                                        format={appConfig?.clientFacingName?.Dob?.format ?? 'yyyy-MM-dd'}
                                        placeholder="Select date"
                                        caretAs={"BsCalendar2MonthFill"}
                                        shouldDisableDate={date => moment(date).isAfter(moment().subtract(18, 'years'), 'day')}
                                        showMeridian
                                        value={createProfileInputs.birthDate ? new Date(createProfileInputs.birthDate) : null}
                                        onChange={(dateTime) => {
                                            dateTime = dateTime ? moment(dateTime).format('YYYY-MM-DD') : null;
                                            handleOnCreateProfileInputsChange({ target: { id: 'birthDate', value: dateTime } })
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className={(isExisting && readOnly) ? "col-lg-2 col-md-2 col-sm-12" : "col-lg-3 col-md-3 col-sm-12"}>
                            <div className="form-group">
                                <label htmlFor="category" className="control-label">Category&nbsp;<span>*</span></label>
                                <select disabled={readOnly} className={`form-control ${(createProfileInputsErrors.category ? "input-error" : "")} `} id="category" value={createProfileInputs?.category ?? ''} onChange={handleOnCreateProfileInputsChange}>
                                    <option value="" key='selectCat'>Select</option>
                                    {
                                        categoryLookup.map((e) => (
                                            <option value={e.code} key={e.code}>{e.description}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <span className="errormsg">
                                {createProfileInputsErrors.category ? createProfileInputsErrors.category : ""}
                            </span>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <div style={{ display: "flex" }}>
                                    <div style={{ width: "50%" }}>
                                        <label className="control-label">Prefix&nbsp;<span>*</span></label>
                                        <SelectCountry
                                            value={createProfileInputs?.extn}
                                            onChange={handleOnChangeCountry}
                                            error={createProfileInputsErrors.extn}
                                        />
                                    </div>
                                    &nbsp;
                                    <div style={{ width: "70%" }}>
                                        <label className="control-label">Contact Number&nbsp;<span>*</span></label>
                                        <NumberFormatBase
                                            className={`form-control ${(createProfileInputsErrors.mobileNo ? "input-error" : "")} `}
                                            id="mobileNo"
                                            placeholder="Enter Contact Number"
                                            value={createProfileInputs?.mobileNo}
                                            maxLength={phoneNolength}
                                            minLength={phoneNolength}
                                            pattern={phoneNolength && `.{${phoneNolength},}`}
                                            // required
                                            title={phoneNolength ? `Required ${phoneNolength} digit number` : ''}
                                            onChange={handleOnCreateProfileInputsChange} />
                                        <span className="errormsg">
                                            {createProfileInputsErrors.mobileNo ? createProfileInputsErrors.mobileNo : ""}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="emailId" className="control-label">Email ID&nbsp;<span>*</span></label>
                                <input type="email" className={`form-control ${(createProfileInputsErrors.emailId ? "input-error" : "")} `} id="emailId" value={createProfileInputs?.emailId ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                            <span className="errormsg">
                                {createProfileInputsErrors.emailId ? createProfileInputsErrors.emailId : ""}
                            </span>
                        </div>
                        <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="contactPreference" className="control-label">Contact preference&nbsp;<span>*</span></label>
                                <Select
                                    className={`${(createProfileInputsErrors.contactPreference ? "error-border" : "")} `}
                                    value={createProfileInputs.contactPreference}
                                    options={contactPreferenceLookup}
                                    menuPortalTarget={document.modal}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    getOptionLabel={option => `${option.label}`}
                                    isMulti
                                    // className={`${createProfileInputsErrors.contactPreference && "error-border"}`}
                                    onChange={(selectedOption) =>
                                        handleOnCreateProfileInputsChange({
                                            target: {
                                                id: "contactPreference",
                                                value: selectedOption,
                                            },
                                        })
                                    }
                                    closeMenuOnSelect={false}
                                />
                                <span className="errormsg">{createProfileInputsErrors?.contactPreference ? createProfileInputsErrors?.contactPreference : ""}</span>
                            </div>
                            {/* <div className="form-group col-md-3">
                                        <label htmlFor="idType" className="col-form-label">ID Type</label>
                                        <select id="idType" disabled={readOnly} className="form-control" value={createProfileInputs.idType} onChange={handleOnCreateProfileInputsChange} >
                                            <option value="" key='selectIdType'>Select</option>
                                            {
                                                idTypeLookup.map((e) => (
                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="idValue" className="col-form-label">ID Value</label>
                                            <input type="text" disabled={readOnly} id="idValue" className="form-control" value={createProfileInputs.idValue} onChange={handleOnCreateProfileInputsChange} />
                                        </div>
                                    </div> */}
                        </div>
                        {/* {checkComponentPermission('ID_PREFIX') && <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="idPrefix" className="control-label">{appsConfig?.clientFacingName?.['idPrefix'] ? startCase(appsConfig?.clientFacingName?.['idPrefix']) : 'ID Prefix'}</label>
                                <input type="text" className="form-control" id="idPrefix" value={createProfileInputs?.idPrefix ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                        </div>} */}
                        {checkComponentPermission('ID_VALUE') && <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="idValue" className="control-label">{appConfig?.clientFacingName?.['idValue'] ? startCase(appConfig?.clientFacingName?.['idValue']) : 'ID Value'}</label>
                                <input type="text" className="form-control" id="idValue" value={createProfileInputs?.idValue ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                        </div>}
                        {checkComponentPermission('REGISTRATION_NO') && <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label htmlFor="registeredNo" className="control-label">{appConfig?.clientFacingName?.['registerNo'] ? startCase(appConfig?.clientFacingName?.['registerNo']) : 'Register No'}</label>
                                <input type="text" className="form-control" id="registeredNo" value={createProfileInputs?.registeredNo ?? ''} onChange={handleOnCreateProfileInputsChange} />
                            </div>
                        </div>}
                        {departmentEnable === 'Y' && <div className="col-lg-3 col-md-3 col-sm-12">
                            <div className="form-group">
                                <label className="control-label">Department <span>*</span></label>
                                <select className="form-control" id="department" value={createProfileInputs?.department ?? ''} onChange={handleOnCreateProfileInputsChange}>
                                    <option value="" key='department'>Select</option>
                                    {departmentLookup.map((e) => (
                                        <option value={e.unitId} key={e.unitId}>{e.unitDesc}</option>
                                    ))}
                                </select>
                                <span className="errormsg">{createProfileInputsErrors?.department ?? ""}</span>
                            </div>
                        </div>}
                        {consumerFromIsEnabled == "Y" &&
                            <div className="col-lg-3 col-md-3 col-sm-12">
                                <div className="form-group">
                                    <label htmlFor="consumerFrom" className="control-label">Consumer From <span>*</span></label>
                                    <select className="form-control" id="consumerFrom" value={createProfileInputs?.consumerFrom ?? ''} onChange={handleOnCreateProfileInputsChange}>
                                        <option value="" key='consumerFrom'>Select</option>
                                        {consumerFromOptions.length > 0 && consumerFromOptions.map((e) => (
                                            <option value={e.code} key={e.code}>{e.description}</option>
                                        ))}
                                    </select>
                                    <span className="errormsg">{createProfileInputsErrors?.consumerFrom ?? ""}</span>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                <div>
                    <div className="col-lg-6 col-md-6 col-sm-12">
                        <div className="form-group row">
                            <div className="custom-control custom-checkbox">
                                <input
                                    type="checkbox"
                                    style={{ zIndex: 99 }}
                                    className="custom-control-input"
                                    id="proceedChecks"
                                    checked={isAddressRequired}
                                    onChange={(e) => {
                                        setIsAddressRequired(e.target.checked);
                                    }}
                                />
                                <label className="custom-control-label" htmlFor="proceedChecks">Is Address Requried</label>
                            </div>
                        </div>
                    </div>
                </div>
                {isAddressRequired && <><section className="triangle">
                    <h4 id="list-item-1" className="pl-2">Address</h4>
                </section>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="form-group">
                                <AddressComponent
                                    index={0}
                                    countryLookup={countryLookup}
                                    addressList={addressList}
                                    setAddressList={setAddressList}
                                    error={createProfileInputsErrors}
                                    setError={setCreateProfileInputsErrors}
                                    addressTypeLookup={addressTypeLookup}
                                    countries={countries}
                                    setCountries={setCountries}
                                />
                            </div>
                        </div>
                    </div></>}
                {checkComponentPermission('PROJECT_MAPPING') && <>
                    <div className=" pt-2" >
                        <section className="triangle"><h4 id="list-item-1" className="pl-2">Profile Project Mapping</h4></section>
                    </div >
                    <br></br>
                    {
                        project && <form className="d-flex justify-content-center" >
                            <div style={{ width: "100%" }}>
                                <Select
                                    // closeMenuOnSelect={false}
                                    //  defaultValue={selectedMappingProjects ? selectedMappingProjects : null}
                                    options={project}
                                    getOptionLabel={option => `${option.label}`}
                                    // formatOptionLabel={option => `${option.label} - ${option.value}`} 
                                    value={createProfileInputs.projectMapping}
                                    onChange={(selectedOption) =>
                                        handleOnCreateProfileInputsChange({
                                            target: {
                                                id: "projectMapping",
                                                value: selectedOption,
                                            },
                                        })
                                    }
                                    isMulti
                                    isClearable
                                    name="project"
                                    menuPortalTarget={document.Modal}
                                    className='skel-select-drpdown'
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                />
                            </div>

                        </form>
                    }
                </>}
            </fieldset>
            <div className="row justify-content-center">
                <button className={`skel-btn-cancel ${source !== 'API' ? 'd-none' : ''}`} type="button" onClick={handleOnClear}>Clear</button>
                <button className="skel-btn-submit" type="button" data-dismiss="modal" onClick={handleOnSubmit}>
                    {
                        readOnly ? 'Update' : 'Submit'
                    }
                </button>

                {/* <button className="btn btn-secondary btn-sm" type="button" data-dismiss="modal" onClick={handleOnCancel}>Close</button> */}
            </div>
        </div>
    )
}

export default AddEditProfile;
