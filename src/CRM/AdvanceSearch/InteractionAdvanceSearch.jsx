/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { NumberFormatBase } from 'react-number-format';
import { toast } from 'react-toastify';

import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { get, post } from '../../common/util/restUtil';
import { InteractionAdvanceSearchColumns } from './CustomerAdvanceSearchColumns';
import { unstable_batchedUpdates } from 'react-dom';
import { validateNumber, isAlphaNumericValue } from '../../common/util/validateUtil';
import { formFilterObject } from '../../common/util/util';
import { AppContext } from '../../AppContext';
import { Link, useNavigate } from "react-router-dom";
const InteractionAdvanceSearch = (props) => {

    const initialValues = {
        customerName: "",
        customerNo: "",
        interactionNumber: ""
    }
    const [isCustomerOrSalesOrderSearch, setIsCustomerOrSalesOrderSearch] = useState('CUSTOMER')
    const [searchInputs, setSearchInputs] = useState();
    const [initialLoad, setInitialLoad] = useState(true);
    const [displayForm, setDisplayForm] = useState(true);
    const [listSearch, setListSearch] = useState([]);
    const [customerSearchData, setCustomerSearchData] = useState([]);
    const [userPermission, setUserPermission] = useState({
        searchCustomer: "",
        viewCustomer: "",
        createComplaint: '',
        createServiceRequest: '',
        createInquiry: "",
    })
    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false)

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const history = useNavigate();
    const { auth } = useContext(AppContext)

    useEffect(() => {
        if (!isFirstRender.current) {
            getInteractionData();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    useEffect(() => {
        let rolePermission = []

        auth && auth.permissions && auth.permissions.filter(function (e) {
            let property = Object.keys(e)
            if (property[0] === "Customer") {
                let value = Object.values(e)
                rolePermission = { ...rolePermission, customer: Object.values(value[0]) }
            } else if (property[0] === "Complaint") {
                let value = Object.values(e)
                rolePermission = { ...rolePermission, complaint: Object.values(value[0]) }
            }
            else if (property[0] === "Inquiry") {
                let value = Object.values(e)
                rolePermission = { ...rolePermission, inquiry: Object.values(value[0]) }
            }
            else if (property[0] === "Service-Request") {
                let value = Object.values(e)
                rolePermission = { ...rolePermission, serviceRequest: Object.values(value[0]) }
            }
        })

        let searchCust, viewCust, addComplaint, addInquiry, addServiceRequest
        rolePermission?.customer.map((screen) => {
            if (screen.screenName === "Customer Search ") {
                searchCust = screen.accessType
            } else if (screen.screenName === "View Customer") {
                viewCust = screen.accessType
            }
        })
        rolePermission?.complaint.map((screen) => {
            if (screen.screenName === "Add Complaint") {
                addComplaint = screen.accessType
            }
        })
        rolePermission?.inquiry.map((screen) => {
            if (screen.screenName === "Add Inquiry") {
                addInquiry = screen.accessType
            }
        })
        rolePermission?.serviceRequest.map((screen) => {
            if (screen.screenName === "Create Service Request") {
                addServiceRequest = screen.accessType
            }
        })

        setUserPermission({
            searchCustomer: searchCust,
            viewCustomer: viewCust,
            createComplaint: addComplaint,
            createServiceRequest: addServiceRequest,
            createInquiry: addInquiry,
        })



        if (userPermission.viewCustomer === 'deny') {
            history(`/`)
        }
    }, [auth])

    const getInteractionData = () => {
        if (isSearchInputsEmpty()) {
            return toast.error("Please enter one of the field to search", {
                toastId: "custom-id-yes"
            })
        }

        const requestBody = {
            ...searchInputs,
        }
        setListSearch(requestBody);
        post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: requestBody })
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        // console.log(rows);
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setCustomerSearchData(rows);
                        })
                    }
                }
                setInitialLoad(false);
            }).catch((error) => {
                console.log(error)
            }).finally(() => {

                isTableFirstRender.current = false;
            });
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        if (e.target.id === "idType") {
            setSearchInputs({
                ...searchInputs,
                [target.id]: target.value,
                idValue: ""
            })
            return;
        }
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.value
        })
    }

    const isSearchInputsEmpty = () => {
        if (
            typeof searchInputs === 'object' &&
            !Array.isArray(searchInputs) &&
            searchInputs !== null
        ) {
            let nothingIsEmpty = false;
            for (const [key, value] of Object.entries(searchInputs)) {
                if (value && value?.trim() !== "") nothingIsEmpty = true;
            }

            if (!nothingIsEmpty) {
                return true;
            }

            return false;
        } else {
            return true;
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSearchInputsEmpty()) {
            return toast.error("Please enter one of the field to search", {
                toastId: "custom-id-yes"
            })
        }

        isFirstRender.current = true;
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
        if (cell.column.Header === "Interaction Number") {
            return (<span className="text-secondary cursor-pointer" id="CUSTOMERID" onClick={(e) => handleOnCellActionsOrLink(e, row.original, cell.column.Header)}>{cell.value}</span>)
        }
        else if (cell.column.Header === "Action") {
            return (
                <div className="btn-group">
                    <button disabled={userPermission.createComplaint !== 'write'} type="button" id="Complaint"
                        className="btn btn-sm btn-primary p-1"
                        onClick={(e) => handleOnCellActionsOrLink(e, row.original, cell.column.Header)}>
                        <i className="mdi mdi-pencil ml-0 mr-2 font-10 vertical-middle" />
                        Create Incident
                    </button>
                    <button type="button" className="btn btn-sm btn-primary p-1 dropdown-toggle" data-toggle="dropdown" aria-haspopup="false" aria-expanded="false">
                        <i className="mdi mdi-chevron-down"></i>
                    </button>
                    <div className="dropdown-menu dropdown-menu-right">
                        <button
                            disabled={userPermission?.createInquiry !== "write"}
                            id="Inquiry"
                            className="dropdown-item text-primary"
                            onClick={(e) => handleOnCellActionsOrLink(e, row.original, cell.column.Header)}>
                            <i className="mdi mdi-account-question  ml-0 mr-2 font-10 vertical-middle" />
                            Create Lead
                        </button>
                        <button disabled={userPermission?.createServiceRequest !== "write"}
                            id="Service Request"
                            className="dropdown-item text-primary"
                            onClick={(e) => handleOnCellActionsOrLink(e, row.original, cell.column.Header)}>
                            <i className="mdi mdi-nut  ml-0 mr-2 font-10 vertical-middle" />
                            Create Request
                        </button>
                    </div>
                </div >
            )
        } else if (cell.column.Header === "Customer Name") {
            return (<span>{(row?.original?.customerDetails?.firstName || "") + " " + (row?.original?.customerDetails?.lastName || "")}</span>);
        }
        return (<span>{cell.value}</span>);
    }

    const fetchInteractionDetail = (intxnNo) => {
        get(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'customer360'
                }
                if (response.customerUuid) {
                    localStorage.setItem("customerUuid", response.customerUuid)
                    localStorage.setItem("customerIds", response.customerId)
                }
                history(`/interaction360`, { state: {data} })
            } else {
                //
            }
        }).catch(error => {
            console.log(error);
        });
    }

    const handleOnCellActionsOrLink = (event, rowData, header) => {
        fetchInteractionDetail(rowData?.intxnNo)
    }

    const handleSearchChange = (type) => {
        setIsCustomerOrSalesOrderSearch(type)
        setSearchInputs(initialValues);
        setCustomerSearchData([]);
        setFilters([])
    }

    return (
        <>{userPermission?.searchCustomer !== 'deny' &&
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box">
                            <h4 className="page-title">Customer Advance Search</h4>
                        </div>
                    </div>
                </div>
                <div className="row mt-1">
                    <div className="col-lg-12">
                        <div className="search-result-box m-t-30 card-box">
                            <div id="searchBlock" className="modal-body p-2 d-block">
                                <div className="d-flex justify-content-end">
                                    <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                                </div>
                                {
                                    displayForm && (
                                        <form onSubmit={handleSubmit}>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="customerNo" className="control-label">Customer Number</label>
                                                        <input
                                                            value={searchInputs?.customerNo}
                                                            onChange={handleInputChange}
                                                            onKeyPress={(e) => {
                                                                isAlphaNumericValue(e);
                                                                if (e.key === "Enter") {
                                                                    handleSubmit(e)
                                                                };
                                                            }}
                                                            type="text"
                                                            className="form-control"
                                                            id="customerNo"
                                                            placeholder="Enter Customer Number"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="customerName" className="control-label">Customer Name</label>
                                                        <input
                                                            value={searchInputs?.customerName}
                                                            onChange={handleInputChange}
                                                            type="text"
                                                            className="form-control"
                                                            id="customerName"
                                                            placeholder="Enter Customer Name"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="interactionNumber" className="control-label">Interaction Number</label>
                                                        <input
                                                            value={searchInputs?.interactionNumber}
                                                            onChange={handleInputChange}
                                                            onKeyPress={(e) => {
                                                                isAlphaNumericValue(e);
                                                                if (e.key === "Enter") {
                                                                    handleSubmit(e)
                                                                };
                                                            }}
                                                            type="text"
                                                            className="form-control"
                                                            id="interactionNumber"
                                                            placeholder="Enter Interaction Number"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-12 text-center mt-2">
                                                <button type="submit" className="btn btn-primary waves-effect waves- mr-2" onClick={getInteractionData}>Search</button>
                                                <button type="button" className="btn btn-secondary waves-effect waves- mr-2" onClick={() => { setSearchInputs(initialValues); setCustomerSearchData([]); }}>Clear</button>
                                            </div>
                                            {/* <div className="modal-footer d-flex justify-content-center">
                                                <button type="submit" className="btn btn-primary">Search</button>
                                                <button type="button" className="btn btn-secondary" onClick={() => { setSearchInputs(initialValues); setCustomerSearchData([]); }}>Clear</button>
                                            </div> */}
                                        </form>
                                    )
                                }
                            </div>
                            <div className="row mt-2">
                                <div className="col-lg-12">
                                    {
                                        customerSearchData?.length > 0 ?
                                            <div className="card">
                                                <div className="card-body" id="datatable">
                                                    <div style={{}}>
                                                        <DynamicTable
                                                            listSearch={listSearch}
                                                            listKey={"Interaction Advance Search"}
                                                            row={customerSearchData}
                                                            rowCount={totalCount}
                                                            header={InteractionAdvanceSearchColumns}
                                                            itemsPerPage={perPage}
                                                            backendPaging={true}
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
                                            </div>
                                            : (!initialLoad && <div className='text-center'>
                                                <p> No Records to Display</p>
                                            </div>)
                                    }
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </div >}
        </>
    );
}

export default InteractionAdvanceSearch;