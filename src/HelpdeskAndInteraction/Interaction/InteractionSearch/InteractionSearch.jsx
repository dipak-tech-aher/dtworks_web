/* eslint-disable react-hooks/exhaustive-deps */
import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import { InteractionSearchColumns as InteractionSearchColumnsProps, InteractionSearchHiddenColumns } from './interactionSearchColumns';
import ResolveStatus from './resolveStatus';
import ServiceRequestPreview from './ServiceRequestPreview';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { NumberFormatBase } from 'react-number-format';
import { formFilterObject, removeEmptyKey, getConfig } from '../../../common/util/util';
import { validateNumber } from '../../../common/util/validateUtil';
import { useHistory } from '../../../common/util/history';
import { AppContext } from '../../../AppContext';
import moment from 'moment';
import { statusConstantCode, metaConfig } from '../../../AppConstants';
import { object, string, boolean } from "yup";

const InteractionSearch = (props) => {
    const history = useHistory()

    const { auth, appConfig, systemConfig } = useContext(AppContext);
    const OTHERS_INTERACTION = "CREATE_INTXN_OTHERS";
    const dtWorksProductType = appConfig?.businessSetup?.[0];
    const [searchInputsErrors, setSearchInputsErrors] = useState({});

    const SearchInteractionValidationSchema = object().shape({
        customerName: string().nullable(true).max(100, 'Please Enter only upto 100 digits for name'),
        status: string().nullable(true),
        subscriptionNumber: string().nullable(true).max(100, 'Please Enter only upto 100 digits for subscription number'),
        contactNumber: string().nullable(true).max(100, 'Please Enter only upto 100 digits for contact number'),
        interactionNumber: string().nullable(true).max(100, 'Please Enter only upto 100 digits for interaction number'),
        interactionType: string().nullable(true),
        serviceType: string().nullable(true),
        unAssignedOnly: boolean().nullable(true),
    }).test('at-least-one-field', null, (values) => {
        const {
            customerName,
            status,
            subscriptionNumber,
            contactNumber,
            interactionNumber,
            interactionType,
            serviceType
        } = values;

        if (
            customerName !== "" ||
            status !== "" ||
            subscriptionNumber !== "" ||
            contactNumber !== "" ||
            interactionNumber !== "" ||
            interactionType !== "" ||
            serviceType !== ""
        ) {
            return true;
        } else {
            return false
        }
    });

    const validate = (schema, data) => {
        try {
            setSearchInputsErrors({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            if (e.path === undefined) {
                return e;
            } else {
                e.inner.forEach((err) => {
                    setSearchInputsErrors((prevState) => {
                        return { ...prevState, [err.path]: err.message };
                    });
                });
                return e;
            }
        }
    };

    const initialValues = {
        customerName: "",
        status: "",
        subscriptionNumber: "",
        // accountNumber: "",
        // accountName: "",
        contactNumber: "",
        // interactionId: "",
        interactionNumber: "",
        interactionType: "",
        serviceType: "",
        unAssignedOnly: false
    }

    const [tableRowData, setTableRowData] = useState([]);
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [isResolveOpen, setIsResolveOpen] = useState(false);
    const [serviceRequestData, setServiceRequestData] = useState({});
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [resolveData, setResolveData] = useState({})
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const requestType = params.get('requestType');
    const status = params.get('status');
    const selfDept = params.get('selfDept');
    const startDate = params.get('fromDate');
    const endDate = params.get('toDate');
    const [isCountSearch, setIsCountSearch] = useState(true);
    const [displayForm, setDisplayForm] = useState(true);

    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [listSearch, setListSearch] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false)

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [entityTypes, setEntityTypes] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [intxnStatuses, setIntxnStatuses] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [consumerFromIsEnabled,setConsumerFromIsEnabled] = useState("")

    useEffect(() => {
        if (search !== "") {
            interactionSearchByTypeAndStatus();
            setIsCountSearch(false);
        } else {
            setIsCountSearch(true);
        }
    }, [search, perPage, currentPage])

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig,metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config.configValue);
            } catch (error) {
                console.error('Error fetching specific system config:', error);
            }
        };
        fetchConfigData();
    }, [])

    const [InteractionSearchColumns, setInteractionSearchColumns] = useState([])

    useEffect(() => {
        get(properties.MASTER_API + '/get-app-config')
            .then((resp) => {
                if (resp?.status === 200) {

                    if (resp?.data?.clientFacingName) {


                        const updatedColumns = InteractionSearchColumnsProps?.map(x => {
                            if (["profileNumber"].includes(x.id)) {
                                if (appConfig && appConfig.clientFacingName && appConfig.clientFacingName.customer) {
                                    x.Header = x.Header?.replace('Profile', appConfig.clientFacingName.customer ?? 'Customer');
                                }
                            }
                            return x;
                        });
                        if(consumerFromIsEnabled == "Y"){
                            const consumerFromColumn = updatedColumns.find(val => val.id === 'consumerFrom');
                            if (!consumerFromColumn) {
                                updatedColumns.push({
                                    Header: "Profile Category",
                                    accessor: "customerDetails.consumerFrom.description",
                                    disableFilters: true,
                                    id: "consumerFrom"
                                });
                            }
                        }
                        setInteractionSearchColumns(updatedColumns);
                    }
                }
            }).catch((error) => { console.log(error) })
            .finally()

    }, [props])

    useEffect(() => {
        if (!isFirstRender.current && !params.has('status')) {
            getInteractionSearchData();
        }
        else {
            isFirstRender.current = false
        }
    }, [currentPage, perPage])

    useEffect(() => {
        getEntityLookup()
    }, [])

    const getInteractionSearchData = (fromCallback = false) => {

        const { customerName, interactionType, contactNumber, interactionNumber, status, subscriptionNumber, serviceType } = searchInputs;
        let searchParams = {
            contactNumber: contactNumber ? Number(contactNumber) : '',
            interactionNumber,
            interactionType,
            status,
            subscriptionNumber,
            serviceType,
            filters: formFilterObject(filters)
        }
        if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
            searchParams.customerName = customerName
        } else {
            searchParams.profileName = customerName
        }
        searchParams = removeEmptyKey(searchParams);

        let requestBody = {
            searchParams: {
                ...searchParams
            }
        }

        setListSearch(requestBody);
        post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${fromCallback ? 0 : Number(currentPage)}`, requestBody)
            .then((response) => {
                if (response.data) {
                    if (Number(response.data.count) > 0) {
                        unstable_batchedUpdates(() => {
                            setTotalCount(response.data.count)
                            setTableRowData(response.data.rows)
                        })
                    }
                    else {
                        setTotalCount(0)
                        setTableRowData([])
                        toast.error("Records not Found")
                    }
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally(() => {
                isTableFirstRender.current = false;
            })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        console.log('target?.id------>', target?.id)
        // if(target?.id==='interactionNumber' && target.value?.length>100){
        //     toast
        //     return
        // }
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.type === 'checkbox' ? target.checked : target.value
        })
    }

    const interactionSearchByTypeAndStatus = () => {
        if (requestType !== undefined && requestType !== null) {

            let requestBody = {
                status: status,
                type: requestType,
                selfDept,
                startDate: startDate.split("-").reverse().join("-"),
                endDate: endDate.split("-").reverse().join("-"),
                roleId: JSON.parse(localStorage.getItem('auth')).currRoleId,
                filters: formFilterObject(filters)
            }
            setListSearch(requestBody);
            post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
                .then((response) => {
                    if (Number(response.data.count) > 0) {
                        unstable_batchedUpdates(() => {
                            setTotalCount(response.data.count)
                            setTableRowData(response.data.rows)
                        })
                    }
                    else {
                        toast.error("No Records Found")
                    }
                }).catch((error) => {
                    console.log(error)
                })
                .finally()
        }
    }

    const handleSubmit = (e) => {
        if (e) {
            setIsSubmitted(false);
            setErrorMsg();
            e.preventDefault();
            if (validate(SearchInteractionValidationSchema, searchInputs)) {
                toast.error("Validation Errors Found")
                return;
            }
            // if ((!searchInputs?.subscriptionNumber && dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) && !searchInputs?.customerName && !searchInputs?.status && !searchInputs?.contactNumber && !searchInputs?.interactionNumber && !searchInputs?.interactionType && !searchInputs?.serviceType) {
            //     setIsSubmitted(true)
            //     toast.error("Please provide atleast one field for search")
            //     return
            // } else if (!searchInputs?.customerName && !searchInputs?.status && !searchInputs?.contactNumber && !searchInputs?.interactionNumber && !searchInputs?.interactionType && dtWorksProductType !== statusConstantCode.type.CUSTOMER_SERVICE && !searchInputs?.serviceType) {
            //     setIsSubmitted(true)
            //     toast.error("Please provide atleast one field for search")
            //     return
            // }

            // if (searchInputs.subscriptionNumber.length !== 0 && dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
            //     if (searchInputs.subscriptionNumber.length < 3) {
            //         toast.error("Please Enter Minimum 3 digits for Subscription ID")
            //         return
            //     }
            // }
            // if (searchInputs?.interactionNumber && searchInputs?.interactionNumber?.length !== 0) {
            //     if (searchInputs.interactionNumber.length < 5) {
            //         setErrorMsg("Please Enter Minimum 5 digits for Interaction Number")
            //         toast.error("Please Enter Minimum 5 digits for Interaction Number")
            //         return
            //     } else if (searchInputs.interactionNumber.length > 100) {
            //         setErrorMsg("Please Enter only upto 100 digits for Interaction Number")
            //         toast.error("Please Enter only upto 100 digits for Interaction Number")
            //         return
            //     }
            // }
            // if (searchInputs?.profileName && searchInputs?.profileName?.length !== 0) {
            //     if (searchInputs.profileName.length > 100) {
            //         setErrorMsg("Please Enter only upto 100 digits for profile name")
            //         toast.error("Please Enter only upto 100 digits for profile name")
            //         return
            //     }
            // }
            // if (searchInputs?.contactNumber && searchInputs.contactNumber.length !== 0) {
            //     if (searchInputs.contactNumber.length < 3) {
            //         toast.error("Please Enter Minimum 3 digits for Contact Number")
            //         return
            //     }
            // }
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
        else {
            getInteractionSearchData(true);
        }
    }

    const handleCellLinkClick = (helpdeskId) => {
        const requestBody = {
            helpdeskId: Number(helpdeskId),
            contain: ['CUSTOMER', 'INTERACTION']
        }
        post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody).then((response) => {
            if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                props.history(`/view-helpdesk`, {
                    state: { data: response?.data?.rows[0] }
                })
            }
        }).catch(error => {
            console.error(error);
        });
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Interaction No") {
            return (<span className="text-secondary" style={{ cursor: "pointer" }} onClick={(e) => redirectToRespectivePages(e, row.original)}>{cell.value}</span>)
        }
        else if (cell.column.Header === "Created Date") {
            return (<span>{moment(cell.value).format('DD MMM YYYY, h:mm:ss')}</span>)
        }
        // else if (cell.column.Header === "Action") {
        //     return (
        //         <ServiceRequestActions
        //             data={{
        //                 row: row.original
        //             }}
        //             handlers={{
        //                 setIsResolveOpen,
        //                 setIsPreviewOpen,
        //                 setResolveData,
        //                 setServiceRequestData
        //             }}
        //         />
        //     )
        // }
        else if (cell.column.Header === "Customer Name" || cell.column.Header === "Account Name" || cell.column.Header === "Assigned" || cell.column.Header === "Created By") {
            return (<span>{cell.value}</span>)
        }
        else if (cell.column.Header === "Helpdesk ID") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(row.original.helpdeskId)}>{cell.value}</span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    // const getHelpdeskData = useCallback((helpdeskId) => {
    //     return new Promise((resolve, reject) => {
    //         if (helpdeskId) {

    //             get(`${properties.HELPDESK_API}/${helpdeskId}`)
    //                 .then((response) => {
    //                     const { status, data } = response;
    //                     if (status === 200) {
    //                         resolve(data);
    //                     }
    //                 })
    //                 .catch(error => {
    //                     console.error(error);
    //                     reject(true);
    //                 })
    //                 .finally()
    //         }
    //         else {
    //             resolve();
    //         }
    //     })
    // }, [])

    // const handleCellLinkClick = (event, rowData) => {
    //     const { intxnId, customerId, intxnType, intxnTypeDesc, serviceId, accountId, woType, woTypeDesc, helpdeskId } = rowData;
    //     if (intxnType === 'REQCOMP' || intxnType === 'REQINQ' || intxnType === 'REQSR') {
    //         const helpdeskResponse = getHelpdeskData(helpdeskId);
    //         helpdeskResponse.then((resolvedHD, rejectedHD) => {
    //             const isValidHD = typeof (resolvedHD) === 'object' ? true : false;
    //             const isAdjustmentOrRefund = ['Adjustment', 'Refund'].includes(woTypeDesc) ? true : ['Fault'].includes(woTypeDesc) && intxnType === 'REQSR' ? true : false;
    //             props.history(`/edit-${intxnTypeDesc.toLowerCase().replace(' ', '-')}`, {
    //                 data: {
    //                     customerId,
    //                     serviceId,
    //                     interactionId: intxnId,
    //                     accountId,
    //                     type: isAdjustmentOrRefund ? 'complaint' : intxnTypeDesc.toLowerCase(),
    //                     woType,
    //                     isAdjustmentOrRefund,
    //                     row: rowData,
    //                     detailedViewItem: isValidHD ? resolvedHD : {},
    //                     fromHelpDesk: isValidHD ? true : false,
    //                     helpDeskView: isValidHD ? 'Incident' : ''
    //                 }
    //             })
    //         })
    //     } else if(intxnType === 'REQWO') {
    //         props.history(`/edit-work-order`, {
    //             data: {
    //                 customerId,
    //                 serviceId,
    //                 interactionId: intxnId,
    //                 accountId,
    //                 type: 'order',
    //                 woType,
    //                 isAdjustmentOrRefund : false,
    //                 row: rowData
    //             }
    //         })
    //     }
    // }

    const redirectToRespectivePages = (e, rows) => {
        const data = {
            intxnNo: rows?.intxnNo,
            customerUid: rows?.customerUid,
            sourceName: 'customer360'
        }
        // if (response?.oCustomerUuid) {
        //     localStorage.setItem("customerUuid", response.oCustomerUuid)
        // }
        history(`/interaction360`, { state: { data } })
    }

    const handleParentModalState = () => {
        setIsPreviewOpen(false);
    }

    const getEntityLookup = useCallback(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INTXN_TYPE,INTERACTION_STATUS,SERVICE_TYPE')
            .then((response) => {
                const { data } = response;
                setEntityTypes(data['INTXN_TYPE']);
                setServiceTypes(data['SERVICE_TYPE']);
                setIntxnStatuses(data['INTERACTION_STATUS']);
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])

    const hasOtherInteractionPermission = () => {
        let permissions = auth?.permissions ?? [];
        let interactionPermissions;

        for (let index = 0; index < permissions.length; index++) {
            if (permissions[index]['moduleName'] === 'Interaction') {
                interactionPermissions = permissions[index]['moduleScreenMap'];
                break;
            }
        }
        return interactionPermissions?.find(x => x.screenCode === OTHERS_INTERACTION)?.accessType === "allow";
    }

    return (
        <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
            {/* <div className="row">
                <div className="col">
                    <div className="page-title-box">
                        <h4 className="page-title">Interactions Search</h4>
                    </div>
                </div>
                {
                    isCountSearch === false &&
                    <div className="col-auto">
                        <button type="button" onClick={() => props.history.goBack()} className="btn btn-labeled btn-primary btn-sm mt-1">Back</button>
                    </div>
                }

            </div> */}


            <div className="row mt-2">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        {isCountSearch && (
                            <div id="searchBlock" className="modal-body p-2 d-block">
                                <div className="d-flex justify-content-end">
                                    <h6 style={{ color: "#142cb1", cursor: "pointer" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                                </div>
                                {
                                    displayForm &&
                                    <form onSubmit={handleSubmit}>
                                        <div className='row'>
                                            <div className='col'> <div className="text-muted font-20 pl-1 fld-imp mt-1 mb-2"><span className="text-danger">*</span> Please provide at least one field
                                            </div></div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="interactionId" className="control-label">Interaction Number <span className='error ml-1'>*</span></label>
                                                    <input
                                                        value={searchInputs.interactionNumber}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        maxLength={100}
                                                        className="form-control"
                                                        id="interactionNumber"
                                                        placeholder="Enter Interaction Number" />
                                                    {/* {isSubmitted && !searchInputs?.status && !searchInputs?.interactionNumber && !searchInputs?.interactionType &&
                                                        <span className="text-danger font-20 pl-1 fld-imp">{"please provide at least one field"}</span>
                                                    }
                                                    {errorMsg &&
                                                        <span className="text-danger font-20 pl-1 fld-imp">{errorMsg}</span>
                                                    } */}
                                                    <span className="errormsg">
                                                        {searchInputsErrors?.interactionNumber ? searchInputsErrors?.interactionNumber : ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="interactionType" className="control-label">Interaction Type <span className='error ml-1'>*</span></label>
                                                    <select id='interactionType' className='form-control' value={searchInputs.interactionType} onChange={handleInputChange} >
                                                        <option value="">Select Interaction Type</option>
                                                        {
                                                            entityTypes?.map((e) => (
                                                                <option key={e.code} value={e.code}>{e.description}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <span className="errormsg">
                                                        {searchInputsErrors?.interactionType ? searchInputsErrors?.interactionType : ""}
                                                    </span>
                                                    {/* {isSubmitted && !searchInputs?.status && !searchInputs?.interactionNumber && !searchInputs?.interactionType &&
                                                        <span className="text-danger font-20 pl-1 fld-imp">please provide at least one field</span>
                                                    } */}
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="status" className="control-label">Status <span className='error ml-1'>*</span></label>
                                                    <select id='status' className='form-control' value={searchInputs?.status} onChange={handleInputChange} style={{ width: "100%" }}>
                                                        <option value="">Select Status</option>
                                                        {
                                                            intxnStatuses?.map((e) => (
                                                                <option key={e.code} value={e.code}>{e.description}</option>
                                                            ))
                                                        }
                                                    </select>
                                                    <span className="errormsg">
                                                        {searchInputsErrors?.status ? searchInputsErrors?.status : ""}
                                                    </span>
                                                    {/* {isSubmitted && !searchInputs?.status && !searchInputs?.interactionNumber && !searchInputs?.interactionType &&
                                                        <span className="text-danger font-20 pl-1 fld-imp">please provide at least one field</span>
                                                    } */}
                                                </div>
                                            </div>
                                            {dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE && <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="status" className="control-label">Subscription Number <span className='error ml-1'>*</span></label>
                                                    <input
                                                        value={searchInputs.subscriptionNumber}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        maxLength={100}
                                                        className="form-control"
                                                        id="subscriptionNumber"
                                                        placeholder="Enter Subscription Number" />
                                                    <span className="errormsg">
                                                        {searchInputsErrors?.subscriptionNumber ? searchInputsErrors?.subscriptionNumber : ""}
                                                    </span>
                                                </div>
                                            </div>}
                                            {/* <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="accountNumber" className="control-label">Account ID</label>
                                                    <NumberFormatBase
                                                        value={searchInputs.accountNumber}
                                                        onKeyPress={(e) => {
                                                            validateNumber(e);
                                                            if (e.key === "Enter") {
                                                                handleSubmit(e)
                                                            };
                                                        }}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        className="form-control"
                                                        id="accountNumber"
                                                        placeholder="Enter Account ID" />
                                                </div>
                                            </div> */}
                                            {/* <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="accountName" className="control-label">Account Name</label>
                                                    <input
                                                        value={searchInputs.accountName}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        className="form-control"
                                                        id="accountName"
                                                        placeholder="Enter Account Name"
                                                    />
                                                </div>
                                            </div> */}
                                            {hasOtherInteractionPermission() && (
                                                <React.Fragment>
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label htmlFor="customerName" className="control-label">{appConfig?.clientFacingName?.customer ?? 'Customer'} Name</label>
                                                            <input
                                                                value={searchInputs.customerName}
                                                                onChange={handleInputChange}
                                                                type="text"
                                                                maxLength={100}
                                                                className="form-control"
                                                                id="customerName"
                                                                placeholder="Enter Name"
                                                            />
                                                            <span className="errormsg">
                                                                {searchInputsErrors?.customerName ? searchInputsErrors?.customerName : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label htmlFor="contactNumber" className="control-label">Contact Number</label>
                                                            <NumberFormatBase
                                                                type="text"
                                                                maxLength={15}
                                                                value={searchInputs.contactNumber}
                                                                onKeyPress={(e) => {
                                                                    validateNumber(e);
                                                                    if (e.key === "Enter") {
                                                                        handleSubmit(e)
                                                                    };
                                                                }}
                                                                onChange={handleInputChange}
                                                                className="form-control"
                                                                id="contactNumber"
                                                                placeholder="Enter Contact Number "
                                                            />
                                                            <span className="errormsg">
                                                                {searchInputsErrors?.contactNumber ? searchInputsErrors?.contactNumber : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label htmlFor="serviceType" className="control-label">Service Type <span className='error ml-1'>*</span></label>
                                                            <select id='serviceType' className='form-control' value={searchInputs.serviceType} onChange={handleInputChange} >
                                                                <option value="">Select Service Type</option>
                                                                {
                                                                    serviceTypes?.map((e) => (
                                                                        <option key={e.code} value={e.code}>{e.description}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                            <span className="errormsg">
                                                                {searchInputsErrors?.serviceType ? searchInputsErrors?.serviceType : ""}
                                                            </span>
                                                            {/* {isSubmitted && !searchInputs?.status && !searchInputs?.interactionNumber && !searchInputs?.interactionType &&
                                                        <span className="text-danger font-20 pl-1 fld-imp">please provide at least one field</span>
                                                    } */}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            )}
                                            {/* <div className="col-md-4 switchery-demo">
                                                <div className="custom-control custom-switch">
                                                    <input onChange={handleInputChange} checked={searchInputs.unAssignedOnly} type="checkbox" className="custom-control-input" id="unAssignedOnly" />
                                                    <label className="custom-control-label" htmlFor="unAssignedOnly">UNASSIGNED only</label>
                                                </div>
                                            </div> */}
                                        </div>
                                        <div className="skel-btn-center-cmmn mt-2">
                                            <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setTableRowData([]) }}>Clear</button>
                                            <button type="submit" className="skel-btn-submit">Search</button>
                                        </div>
                                    </form>
                                }
                            </div>
                        )}
                        {
                            !!tableRowData.length &&
                            <div className="row mt-2">
                                <div className="col-lg-12">
                                    {
                                        !!tableRowData.length &&
                                        <div className="">
                                            <div className="" id="datatable">
                                                <DynamicTable
                                                    listKey={"Interactions Search"}
                                                    listSearch={listSearch}
                                                    row={tableRowData}
                                                    header={dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE
                                                        ? InteractionSearchColumns
                                                        : InteractionSearchColumns?.filter(col => col.id !== "subscriptionId")}
                                                    rowCount={totalCount}
                                                    handleRow={setResolveData}
                                                    itemsPerPage={perPage}
                                                    hiddenColumns={InteractionSearchHiddenColumns}
                                                    backendPaging={false}
                                                    columnFilter={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    handler={{
                                                        handleCellRender: handleCellRender,
                                                        handlePageSelect: handlePageSelect,
                                                        handleItemPerPage: setPerPage,
                                                        handleCurrentPage: setCurrentPage,
                                                        handleFilters: setFilters,
                                                        handleExportButton: setExportBtn
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                        {
                            isResolveOpen ?
                                <ResolveStatus value={resolveData} isOpen={isResolveOpen} setIsOpen={setIsResolveOpen} refreshSearch={handleSubmit} />
                                :
                                <></>
                        }
                        {
                            isPreviewOpen &&
                            <ServiceRequestPreview data={{ serviceRequestData }} stateHandlers={{ handleParentModalState: handleParentModalState }} />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InteractionSearch;