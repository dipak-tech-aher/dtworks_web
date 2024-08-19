import { isEmpty } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { array, object, string } from 'yup';
import { AppContext } from '../../AppContext';
import { get, post, put } from '../../common/util/restUtil';
import { get as getObj } from 'lodash'
import { getPermissions, removeEmptyKey } from '../../common/util/util';
import { properties } from '../../properties';
import CreateHelpdeskNew from './CreateHelpdeskNew';
import { statusConstantCode } from '../../AppConstants';
import { useLocation } from 'react-router-dom';

const CreateHelpdeskContainer = (props) => {
    const isFromAmeyo = props?.location?.pathname?.includes("ameyo/create-helpdesk")
    // console.log({ isFromAmeyo })
    // const location = useLocation()
    // console.log(props)
    const consumerDetails = props?.location?.state?.data;
    // console.log('consumerDetails ', consumerDetails)
    const { appsConfig } = props
    const dtWorksProductType = appsConfig?.businessSetup?.[0]
    let customerNo, subscriptionNumber

    if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
        if (consumerDetails) {
            if (consumerDetails.customerDetails) {
                customerNo = consumerDetails?.customerDetails?.customerNo
            } else {
                customerNo = consumerDetails?.customerNo

            }
        }
    } else {
        customerNo = consumerDetails?.profileNo;
    }
    const [selectedConsumerNo, setSelectedConsumerNo] = useState(customerNo)
    const { auth } = useContext(AppContext)
    const [anonymous, setAnonymous] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [edit, setEdit] = useState(false)
    const [searchInput, setSearchInput] = useState({})
    const [dataError, setDataError] = useState({})

    const [tableRowData, setTableRowData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)

    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)
    const parentLookUp = useRef()
    const [filters, setFilters] = useState([])
    const [type, setType] = useState(consumerDetails?.type ?? 'CREATE')
    // Create Profile

    const [createConsumerInputs, setCreateConsumerInputs] = useState()
    const [categoryLookup, setCategoryLookup] = useState([])
    const [phoneNo, setPhoneNo] = useState()
    const [phoneNoPrefix, setPhoneNoPrefix] = useState([])
    const [contactPreferenceLookup, setContactPreferenceLookup] = useState()
    const [countryLookup, setCountryLookup] = useState([]);
    const [project, setProjects] = useState([])
    const [forSelf, setForSelf] = useState(false)
    const [alignment, setAlignment] = useState('Others');
    const [addressTypeLookup, setAddressTypeLookup] = useState([])
    const isFirstRender = useRef(true);
    const [helpdeskTypeLookUp, setHelpdeskTypeLookUp] = useState([])
    const [serviceCategoryLookup, setServiceCategoryLookup] = useState([])
    // const [helpdeskCategoryLookup, setHelpdeskCategoryLookup] = useState([])  /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
    const [severityLookUp, setSeverityLookUp] = useState([])
    const [serviceTypeLookup, setServiceTypeLookup] = useState([])
    const [projectLookup, setProjectLookup] = useState([])
    const [isAddressRequried, setisAddressRequried] = useState(false)
    const [helpdeskStatus, setHelpdeskStatus] = useState([])
    const [genderOptions, setGenderOptions] = useState([])
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [ivrNo, setIvrNo] = useState(null)

    const removeLeadingZeros = useCallback((payload) => {
        for (var i = 0; i < payload?.length; i++) {
            if (payload?.charAt(i) !== '0') {
                let res = payload?.substr(i);
                return res;
            }
        }
        return null;
    }, [])

    useEffect(() => {
        // console.log('refreshing.............')
        const qryString = new URLSearchParams(props?.location?.search);
        let phoneNumber = qryString?.get("phoneNo")
        if (phoneNumber) {
            phoneNumber = phoneNumber?.substring(phoneNumber?.length, (phoneNumber?.length - 10))
            phoneNumber = removeLeadingZeros(phoneNumber)
            setPhoneNo(phoneNumber)
            setIvrNo(qryString?.get("ivrNo") ?? null)
        }
        unstable_batchedUpdates(() => {
            setSearchInput({ ...searchInput, mobileNo: phoneNumber })
            if (phoneNumber) {
                getHelpdeskSearch({ phoneNumber })
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.location?.search, removeLeadingZeros, refresh]);

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=CUSTOMER_CATEGORY,CONTACT_PREFERENCE,PROJECT,COUNTRY,ADDRESS_TYPE,HELPDESK_TYPE,PROD_SUB_TYPE,SEVERITY,SERVICE_TYPE,GENDER,HELPDESK_STATUS')
            .then((response) => {
                const { data } = response;
                parentLookUp.current = data
                const contactPreferenceOptions = data?.CONTACT_PREFERENCE.map((preference) => {
                    return {
                        value: preference.code,
                        label: preference.description
                    }
                })

                let projectOptions = data?.PROJECT?.filter((f) => f.mapping?.department?.includes(auth?.currDeptId)).map((p) => ({ 'label': p.description, 'value': p.code }))
                // let currProjects = []
                // if (detailedViewItem?.customerDetails?.projectMapping?.length > 0) {
                //     let currentDeptProject = detailedViewItem?.customerDetails?.projectMapping?.filter((f) => f?.entity === auth?.currDeptId)
                //     currProjects = projectOptions?.filter((f) => currentDeptProject?.[0]?.project.includes(f?.value))
                // }

                const prefix = data?.COUNTRY.map((e) => {
                    return {
                        value: e.mapping.countryCode,
                        label: "(" + e.mapping.countryCode + ") " + e.description,
                        phoneNolength: e.mapping.phoneNolength
                    }
                })

                const prefix1 = data?.COUNTRY.map((e) => {
                    return {
                        code: e.description,
                        description: "(" + e.mapping.countryCode + ") " + e.description,
                    }
                })
                const helpdeskStatusList = data?.HELPDESK_STATUS && data?.HELPDESK_STATUS.filter((e) => {
                    if (e?.mapping?.isStatusEnabled?.[0]?.toUpperCase()?.includes("TRUE")) {
                        return true
                    }
                    // if (e?.mapping?.isStatusEnabled) {
                    //     return true
                    // }
                    return false
                })

                unstable_batchedUpdates(() => {
                    setCategoryLookup(data['CUSTOMER_CATEGORY']);
                    setContactPreferenceLookup(contactPreferenceOptions || []);
                    setAddressTypeLookup(data['ADDRESS_TYPE']);
                    setProjects(projectOptions || [])
                    setServiceCategoryLookup(data['PROD_SUB_TYPE'])
                    // setHelpdeskCategoryLookup(data['INTXN_CATEGORY']) /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                    setHelpdeskTypeLookUp(data['HELPDESK_TYPE'])
                    setServiceTypeLookup(data['SERVICE_TYPE'])
                    setSeverityLookUp(data['SEVERITY'])
                    setGenderOptions(data.GENDER)

                    setPhoneNoPrefix(prefix)
                    setCountryLookup(prefix1);
                    setHelpdeskStatus(helpdeskStatusList)

                    if (projectOptions && projectOptions?.length === 1) {
                        setCreateConsumerInputs({
                            ...createConsumerInputs, projectMapping: [{
                                value: projectOptions?.[0]?.value,
                                label: projectOptions?.[0]?.label,
                            }]
                        })
                    }
                    // setCreateConsumerInputs({
                    //     ...createConsumerInputs,
                    //     projectMapping: currProjects
                    // })


                    // setSelectedMappingProjects(currProjects)
                })
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])


    const validate = (schema, data) => {
        try {
            setDataError({})
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setDataError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    }


    const emailVerificationValidationSchema = object().shape({
        emailId: string().email("Please Enter Valid Email ID").matches(
            /^[A-Za-z0-9._]+@[A-Za-z0-9.-]+$/,
            "Enter Valid Email ID"
        )
    });

    const getHelpdeskSearch = useCallback((payload = {}) => {
        if (isEmpty(searchInput) && isEmpty(payload)) {
            toast.error("Validation errors found. Please provide atleast one field");
            return false
        }

        if (searchInput?.emailId) {
            let error = validate(emailVerificationValidationSchema, searchInput);
            if (error) {
                toast.error("Validation errors found. Please provide valid Email");
                return false
            }
        }
        // if (searchInput?.consumerNo && searchInput?.consumerNo.length < 5) {
        //     setDataError({ ...dataError, consumerNo: 'Please Enter minimum 5 digit' })
        //     return false
        // }

        let requestBody = {
            emailId: searchInput?.emailId,
            mobileNo: searchInput?.mobileNo
        }
        let reqURL = ''

        if (!isEmpty(payload)) {
            requestBody = { ...requestBody, mobileNo: payload?.phoneNumber }
        }
        if (dtWorksProductType) {
            if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
                reqURL = `${properties.CUSTOMER_API}/get-customer`
                requestBody = {
                    ...requestBody,
                    customerNo: searchInput?.consumerNo,
                    customerName: searchInput?.consumerName
                }
            } else {
                reqURL = `${properties.PROFILE_API}/search`
                requestBody = {
                    ...requestBody,
                    profileNo: searchInput?.consumerNo,
                    profileName: searchInput?.consumerName
                }
            }
            requestBody = removeEmptyKey(requestBody)
            if (isEmpty(requestBody)) {
                toast.error("Validation errors found. Please provide atleast one field");
                return
            }
            post(`${reqURL}?limit=${perPage}&page=${Number(currentPage)}`, requestBody).then((resp) => {
                if (resp?.status === 200) {
                    unstable_batchedUpdates(() => {
                        if (isFromAmeyo) {
                            // if (resp?.data?.rows?.length == 1) {
                            //     handleCellLinkClick(resp?.data?.rows[0]?.customerNo || resp?.data?.rows[0]?.profileNo)
                            // } else {
                            //     setTableRowData(resp?.data?.rows || [])
                            //     setTotalCount(resp?.data?.count || 0)
                            // }
                            handleCellLinkClick(resp?.data?.rows[0]?.customerNo || resp?.data?.rows[0]?.profileNo);

                        } else {
                            setTableRowData(resp?.data?.rows || [])
                            setTotalCount(resp?.data?.count || 0)
                        }
                    })
                    if (resp?.data?.count === 0 || !resp.data) {
                        toast.error(resp?.message)
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, currentPage, perPage, dtWorksProductType])

    const handleOnSearch = (e) => {
        if (isEmpty(searchInput)) {
            toast.error("Validation errors found. Please provide atleast one field");
            return
        }
        e?.preventDefault()
        isTableFirstRender.current = true;
        unstable_batchedUpdates(() => {
            setFilters([])
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }

    useEffect(() => {
        if (!isFirstRender.current) {
            getHelpdeskSearch();
        }
        else {
            isFirstRender.current = false
        }
    }, [currentPage, perPage, dtWorksProductType])

    const handleCellLinkClick = (value) => {
        if (value) {
            setType('EDIT')
        }
        setSelectedConsumerNo(value)
    }


    useEffect(() => {
        if (forSelf) {
            post(`${properties.PROFILE_API}/search`, { emailId: auth?.user?.email }).then((resp) => {
                if (resp?.data?.count > 0) {
                    handleCellLinkClick("", resp?.data?.rows?.[0]);
                } else {
                    toast.info('No Records Found!!. Please create one to continue.')
                    setAnonymous(true)
                    setCreateConsumerInputs({
                        ...createConsumerInputs,
                        firstName: auth?.user?.firstName,
                        lastName: auth?.user?.lastName,
                        emailId: auth?.user?.email
                    })
                }
            }).catch((error) => {
                console.error(error);
            }).finally(() => setForSelf(false));
        }
    }, [auth?.user?.email, auth?.user?.firstName, auth?.user?.lastName, createConsumerInputs, forSelf])

    useEffect(() => {
        const fetchData = async () => {
            try {
                let permissions = []
                const profilePermissions = await getPermissions(dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? 'CREATE_CUSTOMER' : 'CREATE_PROFILE');
                const helpdeskPermission = await getPermissions('HELPDESK_CREATE')
                permissions = [{ ...profilePermissions }, { ...helpdeskPermission }]

                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);

    // console.log('refresh ',refresh)

    const setComponentPermissions = (permissionPayload) => {
        if (permissionPayload && Array.isArray(permissionPayload?.components) && permissionPayload?.components?.length > 0) {
            if (permissionPayload?.accessType === 'allow') {
                let componentPermissions = {}
                permissionPayload.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission((prevComponent) => ({ ...prevComponent, ...componentPermissions }))
            }
        }
    }

    useEffect(() => {
        if (permission && Array.isArray(permission) && permission.length > 0) {
            permission && permission?.forEach((items) => setComponentPermissions(items))
        } else {
            setComponentPermissions(permission)
        }
    }, [permission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    // // Ramesh made change for Web Live to create Helpdesk creation
    // useEffect(() => {
    //     if (props?.location?.state?.data?.ConsumerNo) {
    //         // setSelectedConsumerNo(props?.location?.state?.data?.ConsumerNo)
    //     }
    // }, [props.location])

    return (
        <div className='mt-3 mb-3'>
            {
                isFromAmeyo &&
                <div className="row mb-2">
                    <div className="col-md-3">
                        <div className="form-row">
                            <div className="col-md pr-0">
                                <div className="form-group mb-0">
                                    <input type='text' placeholder="Enter contact number..." onChange={(e) => { setSearchInput({ ...searchInput, mobileNo: e.target.value }) }} className="form-control" />
                                </div>
                            </div>
                            <div className="col-auto pr-0">
                                <button type="button" className="m-0 ml-1 skel-btn-submit" onClick={handleOnSearch} >Search</button>
                            </div>
                        </div>
                    </div>
                </div>
            }
            {(selectedConsumerNo || (!selectedConsumerNo && isFromAmeyo))
                &&
                <CreateHelpdeskNew
                    appsConfig={appsConfig}
                    data={{
                        consumerNo: selectedConsumerNo,
                        phoneNo,
                        serviceCategoryLookup,
                        // helpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                        helpdeskTypeLookUp,
                        severityLookUp,
                        projectLookup,
                        serviceTypeLookup,
                        parentLookUp,
                        dtWorksProductType,
                        refresh,
                        helpdeskStatus,
                        type,
                        ivrNo,
                        rowData: consumerDetails
                    }}
                    handler={{
                        setCategoryLookup,
                        setContactPreferenceLookup,
                        setAddressTypeLookup,
                        setProjects,
                        setServiceCategoryLookup,
                        // setHelpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                        setHelpdeskTypeLookUp,
                        setSeverityLookUp,
                        setServiceTypeLookup,
                        setPhoneNoPrefix,
                        setCountryLookup,
                        setRefresh,
                        checkComponentPermission
                    }}
                />}
        </div>
    )

}

export default CreateHelpdeskContainer;

// const ProfileSearchColumns = [
//     {
//         Header: "Action",
//         accessor: "consumerNo",
//         disableFilters: true,
//         id: 'Action'
//     },
//     {
//         Header: "Profile ID",
//         accessor: "consumerNo",
//         disableFilters: true,
//         id: 'consumerNo'
//     },
//     {
//         Header: "Profile Name",
//         accessor: "firstName",
//         disableFilters: true,
//         id: 'Name'
//     },
//     {
//         Header: "Mobile Number",
//         accessor: "profileContact[0].mobileNo",
//         id: 'mobileNo',
//         disableFilters: true,
//     },
//     {
//         Header: "Email",
//         accessor: "profileContact[0].emailId",
//         disableFilters: true,
//         id: 'emailId'
//     },
//     {
//         Header: "Profile Status",
//         accessor: "status.description",
//         disableFilters: true,
//         id: 'profileStatus'
//     }
// ]