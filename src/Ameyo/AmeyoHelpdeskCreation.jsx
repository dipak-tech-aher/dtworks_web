import { isEmpty } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CloseButton, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { NumberFormatBase } from 'react-number-format';
import { useNavigate } from "react-router-dom";
import Select from 'react-select';
import ReactSwitch from "react-switch";
import { toast } from 'react-toastify';
import { array, object, string } from 'yup';
import { AppContext } from '../AppContext';
import AddressComponent from '../HelpdeskAndInteraction/Helpdesk/AddressComponent';
import CreateHelpdesk from '../HelpdeskAndInteraction/Helpdesk/CreateHelpdesk';
import HelpdeskHistoryList from '../HelpdeskAndInteraction/Helpdesk/HelpdeskHistoryList';
import DynamicTable from '../common/table/DynamicTable';
import { get, post } from '../common/util/restUtil';
import { removeEmptyKey } from '../common/util/util';
import { properties } from '../properties';
const AddressValidationSchema = object().shape({
    addressType: string().nullable(false).required("Address Type is required"),
    address1: string().nullable(false).required("Address line one is required"),
    address2: string().nullable(false).required("Address line two is required"),
    postcode: string().nullable(false).required("Post code two is required"),
    country: string().nullable(false).required("Country is required"),
    state: string().nullable(false).required("State is required"),
    district: string().nullable(false).required("District is required"),
    city: string().nullable(false).required("City is required"),
});
const AmeyoHelpdeskCreation = (props) => {
    const { auth } = useContext(AppContext)
    const history = useNavigate()
    const [isIVRModalOpen, setIsIVRModalOpen] = useState(true)
    const [anonymous, setAnonymous] = useState(false)
    const [searchInput, setSearchInput] = useState({})
    const [dataError, setDataError] = useState({})

    const [tableRowData, setTableRowData] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)

    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)
    const [filters, setFilters] = useState([])
    const isFirstRender = useRef(true);

    // Create Profile

    const [createProfileInputs, setCreateProfileInputs] = useState()
    const [categoryLookup, setCategoryLookup] = useState([])
    const [mappedExtn, setMappedExtn] = useState([])
    const [phoneNolength, setPhoneNolength] = useState()
    const [phoneNoPrefix, setPhoneNoPrefix] = useState([])
    const [contactPreferenceLookup, setContactPreferenceLookup] = useState()
    const [addressList, setAddressList] = useState([{ "address1": '', "address2": '', "postcode": '', "country": '', "state": '', "city": '', "addressType": '', "district": "" }]);
    const [countryLookup, setCountryLookup] = useState([]);
    const [project, setProjects] = useState([])
    const [selectedProfileNo, setSelectedProfileNo] = useState()
    const [activeTab, setActiveTab] = useState(0)
    const [addressTypeLookup, setAddressTypeLookup] = useState([])

    // IVR
    const [phoneNo, setPhoneNo] = useState();
    const [ivrNo, setivrNo] = useState();

    const [helpdeskTypeLookUp, setHelpdeskTypeLookUp] = useState([])
    const [serviceCategoryLookup, setServiceCategoryLookup] = useState([])
    const [severityLookUp, setSeverityLookUp] = useState([])
    const [projectLookup, setProjectLookup] = useState([])
    const [isAddressRequried, setisAddressRequried] = useState(false)

    const validationSchema = object().shape({
        firstName: string().required("Name is required"),
        lastName: string().required("Name is required"),
        profileCategory: string().required("Name is required"),
        mobilePrefix: string().required("Prefix is required"),
        mobileNo: string().required("Contact is required").min(phoneNolength, ` ${phoneNolength ? `Mobile Number must be ${phoneNolength ?? '0'} digit` : ''}`),
        emailId: string().required("Email Id is required").email("Please Enter Valid Email ID"),
        contactPreference: array().required("Contact Preference is required")
    })

    const removeLeadingZeros = useCallback((payload) => {
        // traverse the entire string
        for (var i = 0; i < payload?.length; i++) {

            // check for the first non-zero character
            if (payload?.charAt(i) !== '0') {
                // return the remaining string
                let res = payload?.substr(i);
                return res;
            }
        }
        // If the entire string is traversed
        // that means it didn't have a single
        // non-zero character, hence return "0"
        return null;
    }, [])



    useEffect(() => {
        const qryString = new URLSearchParams(props?.location?.search);
        let phoneNo = qryString?.get("phoneNo");
        let ivrNo = qryString?.get("ivrNo");

        if (phoneNo) {
            phoneNo = phoneNo?.substring(phoneNo?.length, (phoneNo?.length - 10))
            phoneNo = removeLeadingZeros(phoneNo)
        }
        unstable_batchedUpdates(() => {
            setSearchInput({ ...searchInput, mobileNo: phoneNo })
            setivrNo(ivrNo)
            if (phoneNo) {
                getHelpdeskSearch({ phoneNo })
                setPhoneNo(phoneNo)
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props?.location?.search, removeLeadingZeros]);

    const handleOnTabChange = (index) => {
        setActiveTab(index);
    }

    const handleOnChange = (e) => {
        const { target } = e
        unstable_batchedUpdates(() => {
            setSearchInput({
                ...searchInput,
                [target.id]: target.value
            })
            setDataError({ ...dataError, [target.id]: '' })
        })
    }

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

    const handleOnClear = () => {
        unstable_batchedUpdates(() => {
            setSearchInput({})
            // setAnonymous(false)
            setDataError({})
            setTableRowData([])
            setTotalCount(0)
            setCreateProfileInputs({})
        })
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
            return
        }

        if (searchInput?.emailId) {
            let error = validate(emailVerificationValidationSchema, searchInput);
            if (error) {
                return false
            }
        }

        if (searchInput?.profileNo && searchInput?.profileNo.length < 5) {
            setDataError({ ...dataError, profileNo: 'Please Enter minimum 5 digit Profile No.' })
            return false
        }

        let requestBody = {}
        if (!isEmpty(payload)) {
            requestBody = { ...requestBody, mobileNo: payload?.phoneNo }
        }

        requestBody = { ...requestBody, ...searchInput }
        requestBody = removeEmptyKey(requestBody)
        if (isEmpty(requestBody)) {
            toast.error("Validation errors found. Please provide atleast one field");
            return
        }

        post(`${properties.PROFILE_API}/search?limit=${perPage}&page=${Number(currentPage)}`, requestBody).then((resp) => {
            if (resp?.status === 200) {
                unstable_batchedUpdates(() => {
                    setTableRowData(resp?.data?.rows || [])
                    setTotalCount(resp?.data?.count || 0)
                })
                if (resp?.data?.count === 0) {
                    toast.error(resp?.message)
                }
            }
        }).catch((error) => {
            console.error(error)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput, currentPage, perPage])

    useEffect(() => {
        if (!isFirstRender.current) {
            getHelpdeskSearch();
        }
        else {
            isFirstRender.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage])

    const handleOnSearch = (e) => {
        if (e) {
            e.preventDefault()
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
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "profileNo") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "ProfileName") {
            let name = (row?.original?.firstName ?? "") + " " + (row?.original?.lastName ?? "")
            return (<span>{name}</span>);
        }
        return (<span>{cell.value}</span>)
    }

    const handleCellLinkClick = (e, rowData) => {
        setSelectedProfileNo(rowData?.profileNo)
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    // Create Profile Start Here ****

    const getLookupData = useCallback(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=CUSTOMER_CATEGORY,CONTACT_PREFERENCE,PROJECT,COUNTRY,ADDRESS_TYPE,HELPDESK_TYPE,PROD_SUB_TYPE,SEVERITY')
            .then((response) => {
                const { data } = response;
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

                unstable_batchedUpdates(() => {
                    setCategoryLookup(data['CUSTOMER_CATEGORY']);
                    setAddressTypeLookup(data['ADDRESS_TYPE']);
                    setServiceCategoryLookup(data['PROD_SUB_TYPE'])
                    setHelpdeskTypeLookUp(data['HELPDESK_TYPE'])
                    setSeverityLookUp(data['SEVERITY'])
                    setContactPreferenceLookup(contactPreferenceOptions || []);
                    setProjects(projectOptions || [])
                    // setCreateProfileInputs({
                    //     ...createProfileInputs,
                    //     projectMapping: currProjects
                    // })
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
                    // setSelectedMappingProjects(currProjects)
                })
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [auth?.currDeptId])

    useEffect(() => {
        getLookupData()
    }, [getLookupData])

    const handleOnCreateProfileInputsChange = (e) => {
        const { target } = e
        unstable_batchedUpdates(() => {
            setCreateProfileInputs({
                ...createProfileInputs,
                [target.id]: target.value
            })
            setDataError({ ...dataError, [target.id]: '' })
        })

    }

    const handleOnSubmit = () => {
        let error = validate(validationSchema, createProfileInputs);
        if (error) {
            toast.error("Validation errors found. Please check all fields");
            return false
        }
        // Address Field Validation Checking
        if (isAddressRequried && addressList && addressList.length > 0 && Object.keys(addressList[0]).length > 0) {
            for (let key of Object.keys(addressList[0])) {
                let value = addressList[0][key];
                if (!value && key !== 'address3') {
                    if (validate(AddressValidationSchema, addressList[0])) {
                        toast.error("Validation Errors Found. Please provide address details")
                        return;
                    }
                    break;
                }
            }
        }
        const mappedProjects = []

        if (!isEmpty(createProfileInputs?.projectMapping)) {
            let projectArray = []
            createProfileInputs?.projectMapping.forEach((f) => {
                projectArray.push(f.value)
            })
            mappedProjects.push({
                entity: auth?.currDeptId,
                "project": projectArray
            })
        }


        const requestBody = {
            firstName: createProfileInputs?.firstName,
            lastName: createProfileInputs?.lastName,
            contactPreferences: createProfileInputs?.contactPreference?.map(option => option.value),
            projectMapping: mappedProjects,
            profileCategory: createProfileInputs?.profileCategory,
            contact: {
                isPrimary: true,
                firstName: createProfileInputs?.firstName,
                lastName: createProfileInputs?.lastName,
                contactType: 'CNTMOB',
                emailId: createProfileInputs?.emailId,
                mobilePrefix: createProfileInputs?.mobilePrefix,
                mobileNo: createProfileInputs?.mobileNo
            }

        }
        if (isAddressRequried) {
            requestBody.address = { isPrimary: true, ...addressList?.[0] }
        }

        post(properties.PROFILE_API + '/create', requestBody)
            .then((response) => {
                const { status, message, data } = response;
                if (status === 200) {
                    setSelectedProfileNo(data?.profileNo)
                }
                toast.info(message)
            })
            .catch(error => {
                console.error(error);
            })
            .finally()

    }

    return (
        <div className='container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3'>
            <div className="title-box col-12 p-0">
                <div className="row mt-1" style={{ width: '100%' }}>
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <button data-target="#helpdesk" role="tab" data-toggle="tab" aria-expanded="true"
                                className={`nav-link ${activeTab === 0 ? 'active' : ''} `} onClick={() => handleOnTabChange(0)}>
                                Create Helpdesk
                            </button>
                        </li>
                        <li className="nav-item">
                            <button data-target="#helpdesk" role="tab" data-toggle="tab" aria-expanded="true"
                                className={`nav-link ${activeTab === 1 ? 'active' : ''} `} onClick={() => handleOnTabChange(1)}>
                                Follow Up
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            {activeTab === 0 &&
                <CreateHelpdesk
                    data={{
                        profileNo: selectedProfileNo,
                        ivrNo,
                        phoneNo,
                        serviceCategoryLookup,
                        helpdeskTypeLookUp,
                        severityLookUp,
                        projectLookup
                    }}
                />}
            {activeTab === 1 && <HelpdeskHistoryList data={{ profileNo: selectedProfileNo }} />}
            {/* Modal for register / Un-Register */}
            {!selectedProfileNo && <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isIVRModalOpen} onHide={() => { setIsIVRModalOpen(false); history.goBack() }} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">{anonymous ? 'Create Profile' : 'Search Profile'}</h5></Modal.Title>
                    <CloseButton onClick={() => { setIsIVRModalOpen(false); history.goBack() }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="modal-content">
                        <div className="modal-body px-4">
                            <form className="needs-validation" name="event-form" id="form-event">
                                <div className="">
                                    <div className="row mb-0 toggle-switch pl-0">
                                        <label className={`mr-1 mb-0 ${anonymous ? 'd-none' : ''}`}>Registered</label>
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle" id="anonymous" checked={anonymous}
                                            onChange={(e) => { setAnonymous(!anonymous); handleOnClear() }} />
                                        <label className={`ml-1 mb-0 ${anonymous ? '' : 'd-none'}`}> Unregistered</label>
                                    </div>
                                </div>
                            </form>
                            {!anonymous &&
                                <div>
                                    <div className="row skel-active-new-user-field mt-2">
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="profileNo" className="control-label">Profile ID</label>
                                                <input type="text" className="form-control" autoComplete="off" placeholder="Enter Profile ID" id='profileNo' onChange={handleOnChange} value={searchInput?.profileNo ?? ''} />
                                                <span className="errormsg">{dataError.profileNo ? dataError.profileNo : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="profileName" className="control-label">Profile Name</label>
                                                <input type="text" className="form-control" autoComplete="off" placeholder="Enter Profile Name" id='profileName' onChange={handleOnChange} value={searchInput?.profileName ?? ''} />
                                                <span className="errormsg">{dataError.profileName ? dataError.profileName : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="emailId" className="control-label">Email ID</label>
                                                <input type="email" className="form-control" placeholder="Enter Email ID" autoComplete="off" id='emailId' onChange={handleOnChange} value={searchInput?.emailId ?? ''} />
                                                <span className="errormsg">{dataError.emailId ? dataError.emailId : ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="mobileNo" className="control-label">Contact Number</label>
                                                {/* <input type="number" className="form-control" autoComplete="off" id='mobileNo' onChange={handleOnChange} value={searchInput?.mobileNo ?? ''} /> */}
                                                <NumberFormatBase className={`form-control ${(dataError.mobileNo ? "input-error" : "")} `}
                                                    id="mobileNo"
                                                    placeholder="Enter Contact Number"
                                                    value={searchInput?.mobileNo ?? ''}
                                                    required
                                                    onChange={handleOnChange} />
                                                <span className="errormsg">{dataError.mobileNo ? dataError.mobileNo : ""}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="skel-btn-center-cmmn">
                                        <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleOnSearch} >Search</button>
                                    </div>
                                    {!anonymous ?
                                        tableRowData?.length > 0 ?
                                            <div className="">
                                                <DynamicTable
                                                    row={tableRowData}
                                                    rowCount={totalCount}
                                                    header={ProfileSearchColumns}
                                                    itemsPerPage={perPage}
                                                    // hiddenColumns={tableHiddenColumns}
                                                    backendPaging={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    handler={{
                                                        handleCellRender: handleCellRender,
                                                        handleLinkClick: handleCellLinkClick,
                                                        handlePageSelect,
                                                        handleItemPerPage: setPerPage,
                                                        handleCurrentPage: setCurrentPage,
                                                        handleFilters: setFilters
                                                    }}
                                                />
                                            </div>
                                            : <p className='skel-widget-warning'>No Records Found!!!</p>
                                        : <></>
                                    }
                                </div>}
                            {anonymous &&
                                <fieldset className="scheduler-border">
                                    <div className="">
                                        <div className="row">
                                            <div className="col-lg-3 col-md-3 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="firstName" className="col-form-label">First Name <span>*</span></label>
                                                    <input type="text" className="form-control" id="firstName" value={createProfileInputs?.firstName ?? ''} onChange={handleOnCreateProfileInputsChange} />
                                                    <span className="errormsg">{dataError.firstName ? dataError.firstName : ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-3 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="lastName" className="col-form-label">Last Name <span>*</span></label>
                                                    <input type="text" className="form-control" id="lastName" value={createProfileInputs?.lastName ?? ''} onChange={handleOnCreateProfileInputsChange} />
                                                    <span className="errormsg">{dataError.lastName ? dataError.lastName : ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-3 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="profileCategory" className="col-form-label">Profile Category <span>*</span></label>
                                                    <select className="form-control" id="profileCategory" value={createProfileInputs?.profileCategory ?? ''} onChange={handleOnCreateProfileInputsChange}>
                                                        <option value="" key='selectCat'>Select</option>
                                                        {
                                                            categoryLookup.map((e) => (
                                                                <option value={e.code} key={e.code}>{e.description}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <span className="errormsg">{dataError.profileCategory ? dataError.profileCategory : ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-3 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="emailId" className="col-form-label">Profile Email ID <span>*</span></label>
                                                    <input type="email" className="form-control" id="emailId" value={createProfileInputs?.emailId} onChange={handleOnCreateProfileInputsChange} />
                                                    <span className="errormsg">{dataError.emailId ? dataError.emailId : ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 col-md-6 col-sm-12">
                                                <div className="form-group">
                                                    <div style={{ display: "flex" }}>
                                                        <div style={{ width: "35%" }}>
                                                            <label className="control-label">Prefix <span>*</span></label>
                                                            <Select
                                                                id="mobilePrefix"
                                                                menuPortalTarget={document.body}
                                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                                options={phoneNoPrefix}
                                                                isMulti={false}
                                                                value={[{ label: createProfileInputs?.mobilePrefix, value: createProfileInputs?.mobilePrefix }] || mappedExtn}
                                                                onChange={(e) => {
                                                                    setMappedExtn(e)
                                                                    let phoneNoLen
                                                                    phoneNoPrefix.filter((s) => {
                                                                        if (s.value === e.value) {
                                                                            phoneNoLen = s.phoneNolength
                                                                        }
                                                                    })
                                                                    setPhoneNolength(phoneNoLen)
                                                                    handleOnCreateProfileInputsChange({
                                                                        target: {
                                                                            id: "mobilePrefix",
                                                                            value: e.value,
                                                                        },
                                                                    })
                                                                }}>
                                                            </Select>
                                                            <span className="errormsg">{dataError.mobilePrefix ? dataError.mobilePrefix : ""}</span>
                                                        </div>
                                                        &nbsp;
                                                        <div style={{ width: "75%" }}>
                                                            <label className="control-label">Contact Number&nbsp;<span>*</span></label>
                                                            <NumberFormatBase className={`form-control ${(dataError.reason ? "input-error" : "")} `}
                                                                id="mobileNo"
                                                                placeholder="Enter Contact Number"
                                                                value={createProfileInputs?.mobileNo}
                                                                maxLength={phoneNolength}
                                                                minLength={phoneNolength}
                                                                pattern={phoneNolength && `.{${phoneNolength},}`}
                                                                required
                                                                title={phoneNolength ? `Required ${phoneNolength} digit number` : ''}
                                                                onChange={handleOnCreateProfileInputsChange} />
                                                            <span className="errormsg">{dataError.mobileNo ? dataError.mobileNo : ""}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6 col-md-6 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="contactPreference" className="control-label">Contact preference <span>*</span></label>
                                                    <Select
                                                        value={createProfileInputs?.contactPreference ?? ''}
                                                        options={contactPreferenceLookup}
                                                        menuPortalTarget={document.modal}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        getOptionLabel={option => `${option.label}`}
                                                        isMulti
                                                        onChange={(selectedOption) =>
                                                            handleOnCreateProfileInputsChange({
                                                                target: {
                                                                    id: "contactPreference",
                                                                    value: selectedOption,
                                                                },
                                                            })
                                                        }
                                                    />
                                                    <span className="errormsg">{dataError.contactPreference ? dataError.contactPreference : ""}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <hr className='cmmn-hline mt-2 mb-2' />
                                    <div>
                                        <div className="col-6">
                                            <div className="form-group row">
                                                <div className="custom-control custom-checkbox">
                                                    <input type="checkbox" className="custom-control-input" id="proceedChecks" checked={isAddressRequried} onChange={() => { }} onClick={(e) => setisAddressRequried(e.target.checked)} />
                                                    <label className="custom-control-label" htmlFor="proceedChecks">Is Address Requried</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isAddressRequried && <><span className='skel-app-heading'>Profile Address</span>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <AddressComponent
                                                        index={0}
                                                        countryLookup={countryLookup}
                                                        addressList={addressList}
                                                        setAddressList={setAddressList}
                                                        error={dataError}
                                                        setError={setDataError}
                                                        addressTypeLookup={addressTypeLookup}
                                                    />
                                                </div>
                                            </div>
                                        </div></>}

                                    {/* <section className="triangle">
                                        <h4 id="list-item-1" className="pl-2">Profile Project Mapping</h4>
                                    </section> */}
                                    <hr className='cmmn-hline' />
                                    <span className="skel-app-heading mb-2 mt-2 d-flex">Project Profile Mapping</span>
                                    {
                                        project && <form className="d-flex justify-content-center" >
                                            <div style={{ width: "100%" }}>
                                                <Select
                                                    options={project}
                                                    getOptionLabel={option => `${option.label}`}
                                                    value={createProfileInputs?.projectMapping ?? ''}
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
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                                />
                                            </div>
                                        </form>
                                    }
                                    <div className="skel-btn-center-cmmn">
                                        <button type="button" className="skel-btn-cancel" onClick={handleOnClear}>Clear</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleOnSubmit} >Create</button>
                                    </div>
                                </fieldset>
                            }
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
            }
        </div>
    )
}

export default AmeyoHelpdeskCreation

const ProfileSearchColumns = [
    {
        Header: "Profile ID",
        accessor: "profileNo",
        disableFilters: true,
        id: 'profileNo'
    },
    {
        Header: "Profile Name",
        accessor: "firstName",
        disableFilters: true,
        id: 'ProfileName'
    },
    {
        Header: "Mobile Number",
        accessor: "profileContact[0].mobileNo",
        id: 'mobileNo',
        disableFilters: true,
    },
    {
        Header: "Email",
        accessor: "profileContact[0].emailId",
        disableFilters: true,
        id: 'emailId'
    },
    {
        Header: "Profile Status",
        accessor: "status.description",
        disableFilters: true,
        id: 'profileStatus'
    }
]