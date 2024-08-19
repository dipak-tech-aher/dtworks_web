/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { NumberFormatBase } from 'react-number-format';
import { toast } from 'react-toastify';
import { CloseButton, Form, Modal } from 'react-bootstrap';
import DynamicTable from '../common/table/DynamicTable';
import { properties } from '../properties';
import { post, get } from '../common/util/restUtil';
import { ProfileSearchColumns  } from "../CRM/Customer/customerSearchColumns";
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment'
import { useHistory } from '../common/util/history';
import AddEditProfile from './AddEditProfile';
import { metaConfig } from '../AppConstants'
import { getConfig } from '../common/util/util';

const SearchProfile = (props) => {
    const { appsConfig, systemConfig } = props;
    const source = props?.data?.source
    const sourceName = props?.location?.data?.sourceName || ""
    const [isRefresh, setIsRefresh] = useState(false)
    const [consumerFromIsEnabled, setConsumerFromIsEnabled] = useState("")
    const [consumerFromOptions, setConsumerFromOptions] = useState([])
    const initialValues = {
        profileName: "",
        profileNo: "",
        mobileNo: "",
        emailId: ""
    }
   
    /*
    check config to validate the consumer from enabled or not
    if true add column object to ProfileSearchColumns
    else leave the setProfileSearchColumns(ProfileSearchColumnsMaster)
    */
    if (consumerFromIsEnabled == "Y"){
        initialValues.consumerFrom = '';
        let isDataExist = ProfileSearchColumns.find(val=>{
           return  val.id == "consumerFrom"
        })
        if(!isDataExist){
            ProfileSearchColumns.push({
                Header: "Profile Category",
                accessor: "consumerFrom.description",
                disableFilters: true,
                id: 'consumerFrom'
            })
        } 
    }
        

    const [hideAccount, setHideAccount] = useState(false)
    const history = useHistory()

    // const [customerTypeLookup, setCustomerTypeLookup] = useState([])
    const [searchInput, setSearchInput] = useState(initialValues);
    const [displayForm, setDisplayForm] = useState(true);
    const [listSearch, setListSearch] = useState([]);
    const [profileSearchData, setProfileSearchData] = useState([]);
    const [userPermission, setUserPermission] = useState({
        searchCustomer: "write",
        viewCustomer: "write",
        createComplaint: "write",
        createServiceRequest: "write",
        createInquiry: "write",
    })
    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [isEditCustomerDetailsOpen, setIsEditCustomerDetailsOpen] = useState(false);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [consumerDetails, setConsumerDetails] = useState({});

    useEffect(() => {
        if (source === 'CUSTOMER_CREATION') {
            getCustomerData()
        }

    }, [source])

    // useEffect(() => {
    //     
    //     post(properties.BUSINESS_ENTITY_API, ['CUSTOMER_TYPE'])
    //         .then((response) => {
    //             if (response.data) {
    //                 setCustomerTypeLookup(response.data['CUSTOMER_TYPE'])
    //             }
    //         })
    //         .finally()
    // }, [])

    useEffect(() => {
        if (!isFirstRender.current) {
            getCustomerData()
        }
        else {
            isFirstRender.current = false;
        }
    }, [perPage, currentPage, refresh])

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig,metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                // setConsumerFromIsEnabled(consumer_from_config.configValue);
                if (consumer_from_config.configValue == "Y") {
                    get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=CONSUMER_FROM')
                        .then((response) => {
                            const { data } = response;
                            setConsumerFromOptions(data.CONSUMER_FROM)
                        })
                        .catch(error => {
                            console.error(error);
                        })
                        .finally()
                }
                setConsumerFromIsEnabled(consumer_from_config.configValue);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };
        fetchConfigData();
    }, [])

    // useEffect(() => {
    //     if (!isFirstRender.current) {
    //         getCustomerData();
    //     }
    //     else {
    //         isFirstRender.current = false;
    //     }
    // }, [currentPage, perPage])

    const getCustomerData = () => {
        let statuses = []
        if (sourceName === 'existing_application') {
            statuses = ['CS_TEMP', 'CS_PROSPECT']
        } else {
            statuses = ['CS_ACTIVE', 'CS_PEND']
            if (!searchInput.profileName && !searchInput.mobileNo && !searchInput.profileNo && !searchInput.customerRefNo && !searchInput?.emailId) {
                toast.error("Validation errors found. Please provide any one field");
                return false
            }
        }

        const requestBody = {
            // filters: formFilterObject(filters),
            ...searchInput,
            // status: statuses
        }

        setListSearch(requestBody);
        post(`${properties.PROFILE_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(0)
                            setProfileSearchData([]);
                        })

                        if (Number(count) > 0) {
                            unstable_batchedUpdates(() => {
                                setTotalCount(count)
                                setProfileSearchData(rows);
                            })
                        }
                        else {
                            toast.error("Records Not found");
                            setFilters([]);
                        }
                    } else {
                        setProfileSearchData([]);
                        toast.error("Records Not Found");
                    }
                } else {
                    setProfileSearchData([]);
                    toast.error("Records Not Found");
                }
            }).catch((error) => {
                console.error(error)
                // toast.error(error.message)
            })
            .finally(() => {
                isTableFirstRender.current = false;
            });

    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }


    const handleSubmit = (e) => {
        setIsRefresh(!isRefresh)
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

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "profileNo") {
            return (<span className="text-secondary cursor-pointer" id="CUSTOMERID" onClick={(e) => handleOnCellActionsOrLink(row.original)}>{cell.value}</span>)
        }
        else if (cell.column.Header === "Account Id") {
            if (!row?.original?.account[0]?.accountId) {
                setHideAccount(true)
            }
            let accountId = (row?.original?.account[0]?.accountId)
            return (<span>{accountId}</span>);
        }
        else if (cell.column.id === "profileName") {
            let name = (row?.original?.firstName || "") + " " + (row?.original?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (['Updated At', 'Created At'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>);
        }
        else if (['Created By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdByName?.firstName || "") + " " + (row?.original?.createdByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (['Updated By'].includes(cell.column.Header)) {
            let name = (row?.original?.updatedByName?.firstName || "") + " " + (row?.original?.updatedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (cell.column.id === "action") {
            return (
                <div className='mt-1'>
                    <button className="styl-edti-btn" onClick={() => {
                        setConsumerDetails(row.original)
                        setIsEditCustomerDetailsOpen(true)
                    }}>Edit</button>
                </div>
            )

        }
        return (<span>{cell.value}</span>);
    }

    const handleOnCellActionsOrLink = (rowData) => {
        // console.log('rowData?.customerId--------->', rowData);
        localStorage.setItem("profileUuid", rowData?.profileUuid || null);
        localStorage.setItem("profileNo", rowData?.profileNo || null)
        localStorage.setItem("profileIds", rowData?.profileId || null)
        const data = {
            profileData: rowData,
            pageIndex: 1,
            edit: true
        }
        history(`/view-profile`, { state: { data } })


    }


    const [customizedLable, setCustomizedLable] = useState('')
    useEffect(() => {
        // console.log('------xxx---------->', appsConfig?.clientFacingName)
        if (appsConfig?.clientFacingName) {
            for (const key in appsConfig.clientFacingName) {
                // console.log('appsConfig.clientFacingName[key]-------->',key)
                if (key === 'Customer'.toLowerCase()) {
                    // console.log('appsConfig?.clientFacingName[key]------>',appsConfig?.clientFacingName[key])
                    setCustomizedLable(appsConfig?.clientFacingName[key]);
                    break;
                } else {
                    setCustomizedLable('Customer')
                }
            }
        }

        // console.log('------typeof---------->',typeof(appsConfig.clientFacingName['Customer'.toLowerCase()])==="string")
        // if (appsConfig && appsConfig.clientFacingName && typeof(appsConfig.clientFacingName['Customer'.toLowerCase()])==="string") {
        //     console.log('herx------------>',appsConfig?.clientFacingName)
        //     setCustomizedLable(appsConfig?.clientFacingName['Customer'.toLowerCase()] || 'Customer')
        // }
    }, [appsConfig])


    return (
        <>{userPermission?.searchCustomer !== 'deny' &&
            <div className="container-fluid cmmn-skeleton mt-2">
                <div className="row mt-1">
                    <div className="col-lg-12">
                        <div className="search-result-box m-t-30">
                            <div id="searchBlock" className="modal-body p-2 d-block">
                                {profileSearchData.length > 0 && <div className="d-flex justify-content-end">
                                    <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                                </div>}
                                {
                                    displayForm && (
                                        <form>
                                            <div className="row">
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="profileNo" className="control-label">{customizedLable} No</label>
                                                        <input type="text" className="form-control" placeholder={`${customizedLable} No`} autoComplete="off"
                                                            onChange={(e) => { setSearchInput({ ...searchInput, profileNo: e.target.value }); }}
                                                            value={searchInput?.profileNo} onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSubmit(e)
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="profileName" className="control-label">{customizedLable} Name</label>
                                                        <input type="text" className="form-control" placeholder={`${customizedLable} Name`} autoComplete="off"
                                                            onChange={(e) => { setSearchInput({ ...searchInput, profileName: e.target.value }); }} onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSubmit(e)
                                                                }
                                                            }}
                                                            value={searchInput?.profileName}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="cntnumber" className="control-label">Contact No</label>
                                                        <NumberFormatBase className="form-control" placeholder="Contact Number" autoComplete="off"
                                                            onChange={(e) => { setSearchInput({ ...searchInput, mobileNo: e.target.value }); }}
                                                            value={searchInput?.mobileNo} onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSubmit(e)
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="form-group">
                                                        <label htmlFor="emailId" className="control-label">Email ID</label>
                                                        <input type="email" className="form-control" placeholder="Email ID" autoComplete="off"
                                                            onChange={(e) => { setSearchInput({ ...searchInput, emailId: e.target.value }); }}
                                                            value={searchInput?.emailId} onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSubmit(e)
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                {consumerFromIsEnabled == "Y" &&
                                                    <div className="col-md-3">
                                                        <div className="form-group">
                                                            <label htmlFor="consumerFrom" className="control-label">Profile Category</label>
                                                            <select className="form-control" id="consumerFrom" value={searchInput?.consumerFrom ?? ''} onChange={(e) => { setSearchInput({ ...searchInput, consumerFrom: e.target.value }); }}>
                                                                <option value="" key='consumerFrom'>Select</option>
                                                                {consumerFromOptions.map((e) => (
                                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                            <div className="col-md-12 text-center mt-2 skel-customer-search-btn-list">
                                                <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInput(initialValues); setProfileSearchData([]); }}>Clear</button>
                                                {/* <button type="button" className="skel-btn-submit" onClick={() => { setCurrentPage(0); getCustomerData() }}>Search</button> */}
                                                <button type="button" className="skel-btn-submit" onClick={handleSubmit}>Search</button>
                                                {
                                                    sourceName === 'existing_application' &&
                                                    <button type="button" className="skel-btn-submit" onClick={() => { history(`/new-customer`) }}>Skip and proceed <i className="material-icons">arrow_forward</i></button>
                                                }

                                                {/* <button type="button" className="btn btn-secondary waves-effect waves-light" onClick={() => { setSearchInput(initialValues); setProfileSearchData([]); setHideAccount(false) }}>Clear</button> */}
                                            </div>
                                        </form>
                                    )
                                }
                            </div>
                            {
                                profileSearchData.length > 0 ?
                                    <div className="row mt-2">
                                        <div className="col-lg-12">
                                            {
                                                !!profileSearchData.length &&
                                                < div className="">
                                                    <div className="" id="datatable">
                                                        <div style={{}}>
                                                            <DynamicTable
                                                                listSearch={listSearch}
                                                                listKey={"Search Profile"}
                                                                row={profileSearchData}
                                                                rowCount={totalCount}
                                                                header={ProfileSearchColumns}
                                                                itemsPerPage={perPage}
                                                                backendPaging={true}
                                                                backendCurrentPage={currentPage}
                                                                isTableFirstRender={isTableFirstRender}
                                                                hasExternalSearch={hasExternalSearch}
                                                                method={"POST"}
                                                                exportBtn={exportBtn}
                                                                hiddenColumns={[]}
                                                                // hiddenColumns={CustomerSearchHiddenColumns}
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
                                                </div>
                                            }
                                        </div>
                                    </div> : sourceName && sourceName === 'existing_application' ?
                                        <div className='col-md-12 text-center mt-4'>
                                            {/* <span className='skel-widget-warning'>No Record Found!!! Do you want to create new customer? <button type="button" className="skel-btn-submit skel-cust-circle" onClick={handleDecision}>Yes, please proceed <i className="material-icons">arrow_forward</i></button></span>                                          */}
                                        </div> :
                                        <></>
                            }
                        </div>
                    </div >
                </div >
                {
                    <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isEditCustomerDetailsOpen} onHide={() => setIsEditCustomerDetailsOpen(false)} dialogClassName="cust-lg-modal">
                        <Modal.Header>
                            <Modal.Title><h5 className="modal-title">Edit Profile</h5></Modal.Title>
                            <CloseButton onClick={() => setIsEditCustomerDetailsOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                            </CloseButton>
                        </Modal.Header>
                        <Modal.Body>
                            <AddEditProfile data={{
                                consumerDetails,
                                refreshPage: refresh,
                                type: 'EDIT'
                            }}
                                handlers={{
                                    setConsumerDetails,
                                    setIsModalOpen: setIsEditCustomerDetailsOpen,
                                    setRefreshPage: setRefresh
                                }} />
                        </Modal.Body>
                    </Modal>
                }
            </div >}
        </>
    );
}

export default SearchProfile;

