import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';

import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { NumberFormatBase } from 'react-number-format';
import { formFilterObject, removeEmptyKey, getConfig } from '../../../common/util/util';
import { validateNumber } from '../../../common/util/validateUtil';
import { HelpdeskSearchColumns as HelpdeskCoulumnsProps } from './HelpdeskSearchColumnLits';
import HelpdeskCancelModal from '../HelpdeskCancelModal';
import { statusConstantCode, metaConfig } from '../../../AppConstants';
import { isEmpty } from 'lodash'
import { AppContext } from '../../../AppContext';
import { object, string, boolean } from "yup";
// import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const HelpdeskSearch = (props) => {
    // const history = useHistory();
    const navigate = useNavigate();
    console.log("props.....................>", props);
    const { appConfig, systemConfig } = useContext(AppContext);
    const [HelpdeskSearchColumns, setHelpdeskSearchColumns] = useState([])
    const [searchInputsErrors, setSearchInputsErrors] = useState({});
    const [consumerFromIsEnabled,setConsumerFromIsEnabled] = useState("")

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

    useEffect(() => {
        const updatedColumns = HelpdeskCoulumnsProps?.map(x => {
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
        setHelpdeskSearchColumns(updatedColumns);
    }, [props])


    const SearchHelpdeskValidationSchema = object().shape({
        helpdeskId: string().nullable(true).max(100, 'Please Enter only upto 100 digits for helpdesk id'),
        helpdeskNo: string().nullable(true).max(100, 'Please Enter only upto 100 digits for helpdesk no'),
        source: string().nullable(true),
        sourceReference: string().nullable(true),
        profileNo: string().nullable(true).max(100, 'Please Enter only upto 100 digits for profile no'),
        fullName: string().nullable(true).max(100, 'Please Enter only upto 100 digits for fullname'),
        customerType: string().nullable(true),
        contactNumber: string().nullable(true).max(100, 'Please Enter only upto 100 digits for contact number'),
        email: string().nullable(true).max(100, 'Please Enter only upto 100 digits for email'),
    }).test('at-least-one-field', null, (values) => {
        const {
            helpdeskId,
            helpdeskNo,
            source,
            sourceReference,
            profileNo,
            fullName,
            customerType,
            contactNumber,
            email
        } = values;
        if (
            helpdeskId !== "" ||
            helpdeskNo !== "" ||
            source !== "" ||
            sourceReference !== "" ||
            profileNo !== "" ||
            fullName !== "" ||
            customerType !== "" ||
            contactNumber !== "" ||
            email !== ""
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
        helpdeskId: "",
        helpdeskNo: "",
        source: "",
        sourceReference: "",
        profileNo: "",
        fullName: "",
        customerType: "",
        contactNumber: "",
        email: ""
    };

    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [entityTypes, setEntityTypes] = useState({
        source: [],
        customerType: []
    });
    const [tableRowData, setTableRowData] = useState([]);
    const [displayForm, setDisplayForm] = useState(true);

    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [listSearch, setListSearch] = useState([]);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    const [helpdeskDetails, setHelpdeskDetails] = useState();
    const [refresh, setRefresh] = useState(false)

    useEffect(() => {
        if (!isFirstRender.current) {
            getInteractionSearchData();
        }
        else {
            isFirstRender.current = false
            getEntityLookup();
        }
    }, [currentPage, perPage, refresh])

    const getEntityLookup = useCallback(() => {

        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=CUSTOMER_CATEGORY,HELPDESK_SOURCE')
            .then((response) => {
                const { data } = response;
                setEntityTypes({
                    source: data['HELPDESK_SOURCE'],
                    customerType: data['CUSTOMER_CATEGORY']
                });
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const getInteractionSearchData = (fromCallback = false) => {

        const requestBody = {
            contain: ['CUSTOMER']
        }

        const requestBodyFiltered = removeEmptyKey(searchInputs)
        if (validate(SearchHelpdeskValidationSchema, requestBodyFiltered)) {
            toast.error("Validation Errors Found")
            return;
        }
        if (isEmpty(requestBodyFiltered)) {
            toast.error('Please provide atleast one field for search')
            return false
        }

        if (searchInputs?.helpdeskId) {
            // if (searchInputs?.helpdeskId?.length > 100) {
            //     toast.error('Please Enter only upto 100 digits for helpdesk id')
            //     return false
            // }
            requestBody.helpdeskId = Number(searchInputs?.helpdeskId)
        }

        if (searchInputs?.helpdeskNo) {
            // if (searchInputs?.helpdeskNo && searchInputs?.helpdeskNo?.length < 5) {
            //     toast.error('Please provide atleast 5 digits for helpdesk Id')
            //     return false
            // } else if (searchInputs?.helpdeskNo?.length > 100) {
            //     toast.error('Please Enter only upto 100 digits for helpdesk Id')
            //     return false
            // }
            requestBody.helpdeskNo = searchInputs?.helpdeskNo
        }
        if (searchInputs?.source) {
            requestBody.helpdeskSource = searchInputs?.source
        }
        if (searchInputs?.profileNo) {
            // if (searchInputs?.profileNo?.length > 100) {
            //     toast.error('Please Enter only upto 100 digits for profile number')
            //     return false
            // }
            requestBody.profileNo = searchInputs?.profileNo
        }
        if (searchInputs?.fullName) {
            // if (searchInputs?.fullName?.length > 100) {
            //     toast.error('Please Enter only upto 100 digits for full name')
            //     return false
            // }
            requestBody.profileName = searchInputs?.fullName
        }
        if (searchInputs?.contactNumber) {
            requestBody.phoneNo = searchInputs?.contactNumber
        }
        if (searchInputs?.email) {
            // if (!validateEmail(searchInputs?.email)) {
            //     toast.error('Please provide valid email')
            //     return
            // }
            requestBody.mailId = searchInputs?.email
        }

        setListSearch(requestBody);
        post(`${properties.HELPDESK_API}/search?limit=${perPage}&page=${fromCallback ? 0 : Number(currentPage)}`, requestBody)
            .then((response) => {
                if (response.data) {
                    if (Number(response.data.count) > 0) {
                        unstable_batchedUpdates(() => {
                            setTotalCount(response.data.count)
                            setTableRowData(response.data.rows)
                        })
                    }
                    else {
                        toast.error("Records not Found")
                        setTableRowData([])
                        setTotalCount(0)
                    }
                }
            }).catch((error) => {
                // toast.error(error?.message)
            })
            .finally(() => {
                isTableFirstRender.current = false;
            })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleOnKeyPress = (e) => {
        const { key } = e;
        validateNumber(e);
        if (key === "Enter") {
            handleSubmit(e)
        };
    }

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.type === 'checkbox' ? target.checked : target.value
        })
    }

    const handleSubmit = (e) => {
        if (e) {
            e.preventDefault();
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

    const handleCancelHelpdesk = (e) => {
        unstable_batchedUpdates(() => {
            setIsCancelOpen(true)
            setHelpdeskDetails(e)
        })

    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk ID") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.Header === "Profile ID") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => goToProfile(e, row.original)}>{cell.value}</span>)
        }

        // else if (cell.column.id === "fullName") {
        //     return (
        //         <span>{(cell?.row?.original?.customerDetails?.firstName || "") + " " + (cell?.row?.original?.customerDetails?.lastName || "")}</span>
        //     )
        // }
        else if (cell.column.Header === "Action") {
            return (
                <button type="button" onClick={() => handleCancelHelpdesk(row.original?.helpdeskId)} disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(row.original?.status?.code)}
               /*     disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL].includes(row.original?.status.code)}*/ className={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(row.original?.status.code) ? "skel-btn-submit skel-btn-disable" : "skel-btn-submit"} data-toggle="modal" data-target="#search-modal-editservice">
                    Cancel</button >
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const getHelpdeskData = useCallback((helpdeskId) => {
        return new Promise((resolve, reject) => {

            get(`${properties.HELPDESK_API}/${helpdeskId}`)
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200) {
                        resolve(data);
                    }
                })
                .catch(error => {
                    console.error(error);
                    reject(true);
                })
                .finally()
        })
    }, [])

    const getInteractionDataById = useCallback((interactionId) => {

        return new Promise((resolve, reject) => {
            if (interactionId) {
                const requestBody = {
                    searchType: "ADV_SEARCH",
                    interactionId,
                    filters: []
                }
                post(`${properties.INTERACTION_API}/search?limit=${10}&page=${0}`, requestBody)
                    .then((response) => {
                        if (response.data) {
                            if (Number(response.data.count) > 0) {
                                const { rows } = response.data;
                                const { intxnId, customerId, intxnType, intxnTypeDesc, serviceId, accountId, woType, woTypeDesc } = rows[0];
                                if (intxnType === 'REQCOMP' || intxnType === 'REQINQ' || intxnType === 'REQSR') {
                                    const isAdjustmentOrRefund = ['Adjustment', 'Refund'].includes(woTypeDesc) ? true : ['Fault'].includes(woTypeDesc) && intxnType === 'REQSR' ? true : false;
                                    let data = {
                                        customerId,
                                        serviceId,
                                        interactionId: intxnId,
                                        accountId,
                                        type: isAdjustmentOrRefund ? 'complaint' : intxnTypeDesc.toLowerCase(),
                                        woType,
                                        isAdjustmentOrRefund,
                                        row: rows[0]
                                    }
                                    resolve(data);
                                }
                            }
                            else {
                                reject(undefined);
                                toast.error("Records not Found")
                            }
                        }
                    }).catch(error => {
                        console.error(error);
                    })
                    .finally(() => {

                    })
            }
            else {

                resolve({ noInteraction: true })
            }
        })
    }, [])

    // const handleCellLinkClick = (event, rowData) => {
    //     const { helpdeskId, interactionDetails } = rowData;
    //     const helpdeskResponse = getHelpdeskData(helpdeskId);
    //     helpdeskResponse.then((resolvedHD, rejectedHD) => {
    //         if (resolvedHD) {
    //             const interactionResponse = getInteractionDataById(interactionDetails[0]?.intxnId);
    //             interactionResponse.then((resolvedIntxn, rejectedIntxn) => {
    //                 if (resolvedIntxn) {
    //                     props.history(`/edit-${resolvedIntxn?.type?.toLowerCase()?.replace(' ', '-') || 'complaint'}`, {
    //                         data: {
    //                             ...resolvedIntxn,
    //                             detailedViewItem: resolvedHD,
    //                             fromHelpDesk: true,
    //                             helpDeskView: 'Search'
    //                         }
    //                     })
    //                 }
    //             })
    //         }
    //     })
    // }

    const handleCellLinkClick = (event, rowData) => {
        // props.history(`/view-helpdesk`, {
        //     state: { data: rowData }
        // })
        // history.push('/view-helpdesk', { data: rowData });
        navigate('/view-helpdesk', { state: { data: rowData } });
    }


    const goToProfile = (event, rowData) => {
        // history.push('/view-profile', { data: rowData });
        navigate('/view-profile', { state: { data: rowData } });
        // props.history(`/view-profile`, {
        //     state: { data: rowData }
        // })
    }

    return (
        <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
            {/* <div className="row">
                <div className="col">
                    <div className="page-title-box">
                        <h4 className="page-title">Helpdesk Search</h4>
                    </div>
                </div>
            </div> */}
            <div className="row mt-1">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <div className="d-flex justify-content-end">
                                <h6 className='cursor-pointer' onClick={() => { setDisplayForm(!displayForm) }}>
                                    {displayForm ? "Hide Search" : "Show Search"}
                                </h6>
                            </div>
                            {displayForm &&
                                <form onSubmit={handleSubmit}>
                                    <div className='row'>
                                        <div className='col'> <div className="text-muted font-20 pl-1 fld-imp mt-1 mb-2"><span className="text-danger">*</span> Please provide at least one field
                                        </div></div>
                                    </div>
                                    <div className="row">
                                        {/* <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskId" className="control-label">Helpdesk ID</label>
                                                <NumberFormatBase
                                                    value={searchInputs.helpdeskId}
                                                    onKeyPress={(e) => handleOnKeyPress(e)}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="helpdeskId"
                                                    placeholder="Enter Helpdesk ID" />
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskNo" className="control-label">Helpdesk ID</label>
                                                <input
                                                    value={searchInputs?.helpdeskNo}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    maxLength={100}
                                                    className="form-control"
                                                    id="helpdeskNo"
                                                    placeholder="Enter Helpdesk ID"
                                                />

                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="source" className="control-label">Source</label>
                                                <select id='source' className='form-control' value={searchInputs.source} onChange={handleInputChange} >
                                                    <option value="">Select Source</option>
                                                    {
                                                        entityTypes?.source?.map((e) => (
                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3 d-none">
                                            <div className="form-group">
                                                <label htmlFor="sourceReference" className="control-label">Source Reference</label>
                                                <input
                                                    value={searchInputs.sourceReference}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    maxLength={100}
                                                    className="form-control"
                                                    id="sourceReference"
                                                    placeholder="Enter Name"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="profileNo" className="control-label">{appConfig?.clientFacingName?.customer ?? 'Customer'} Id</label>
                                                {/* <input
                                                        value={searchInputs.profileNo}
                                                        onKeyPress={(e) => handleOnKeyPress(e)}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        className="form-control"
                                                        id="profileNo"
                                                        placeholder="Enter Profile ID" /> */}
                                                <input
                                                    value={searchInputs.profileNo}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    min={13}
                                                    maxLength={100}
                                                    className="form-control"
                                                    id="profileNo"
                                                    placeholder={`Enter ${appConfig?.clientFacingName?.customer ?? 'Customer'} ID`}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="fullName" className="control-label">{appConfig?.clientFacingName?.customer ?? 'Customer'} Name</label>
                                                <input
                                                    value={searchInputs.fullName}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    maxLength={100}
                                                    className="form-control"
                                                    id="fullName"
                                                    placeholder="Enter Full Name"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-3 d-none">
                                            <div className="form-group">
                                                <label htmlFor="customerType" className="control-label">Customer Type</label>
                                                <select className='form-control' id='customerType' value={searchInputs.customerType} onChange={handleInputChange} >
                                                    <option value="">Select Source</option>
                                                    {
                                                        entityTypes?.customerType?.map((e) => (
                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="contactNumber" className="control-label">Contact Number</label>
                                                <NumberFormatBase
                                                    type="text"
                                                    value={searchInputs.contactNumber}
                                                    maxLength={100}
                                                    onKeyPress={(e) => handleOnKeyPress(e)}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    id="contactNumber"
                                                    placeholder="Enter Contact Number "
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="email" className="control-label">Email</label>
                                                <input
                                                    value={searchInputs.email}
                                                    onChange={handleInputChange}
                                                    maxLength={100}
                                                    type="text"
                                                    className="form-control"
                                                    id="email"
                                                    placeholder="Enter Email"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='skel-btn-center-cmmn mt-2'>

                                        <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setTableRowData([]) }}>Clear</button>
                                        <button type="submit" className="skel-btn-submit">Search</button>

                                    </div>
                                </form>
                            }
                        </div>
                        {
                            <div className="row mt-2">
                                <div className="col-lg-12">
                                    {
                                        !!tableRowData.length &&
                                        <div className="">
                                            <div className="" id="datatable">
                                                <DynamicTable
                                                    listKey={"Helpdesk Search"}
                                                    listSearch={listSearch}
                                                    row={tableRowData}
                                                    header={HelpdeskSearchColumns}
                                                    rowCount={totalCount}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    columnFilter={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    exportIcon={true}
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
                            // :
                            // <></>
                        }
                    </div>
                </div>
            </div>
            <div>
                <HelpdeskCancelModal
                    data={{
                        helpDeskId: helpdeskDetails,
                        isCancelOpen,
                        refresh
                    }}

                    handler={{
                        setIsCancelOpen,
                        setRefresh
                    }}
                />
            </div>
        </div>
    )
}

export default HelpdeskSearch;