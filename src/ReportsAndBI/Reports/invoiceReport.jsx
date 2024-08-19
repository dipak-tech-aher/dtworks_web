/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify';

import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { post } from '../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { formFilterObject } from '../../common/util/util';
import InvoiceColumns from './invoiceColumns';
import { formatISODateDDMMMYY } from "../../common/util/dateUtil";

const InvoiceReport = () => {

    const initialValues = {
        customerNo: "",
        customerName: "",
        customerType: "",
        billRefNumber: "",
        invoiceNumber: "",
        invoiceDate: "",
        invoiceStatus: "",
    }
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [displayForm, setDisplayForm] = useState(true);
    const [listSearch, setListSearch] = useState([]);
    const [searchData, setSearchData] = useState([]);

    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [customerTypeLookup, setCustomerTypeLookup] = useState([]);
    const [invoiceStatusLookup, setInvoiceStatusLookup] = useState([]);

    useEffect(() => {
        post(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=CUSTOMER_TYPE,INVOICE_STATUS').then((response) => {
            if (response.data) {
                let lookupData = response.data;
                setCustomerTypeLookup(lookupData['CUSTOMER_TYPE']);
                setInvoiceStatusLookup(lookupData['INVOICE_STATUS'])
            }
        }).catch(error => console.log(error))
    }, [])

    useEffect(() => {
        if (!isFirstRender.current) {
            getLoginDetails();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const getLoginDetails = () => {
        
        const requestBody = {
            "searchType": "ADV_SEARCH",
            ...searchInputs,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        post(`${properties.REPORTS_API}/invoice-search?limit=${perPage}&page=${currentPage}`, searchInputs)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(rows);
                        })
                    } else {
                        setSearchData([])
                        toast.error("Records Not Found")
                    }
                } else {
                    setSearchData([])
                    toast.error("Records Not Found")
                }
            }).catch(error => console.log(error)).finally(() => {
                
                isTableFirstRender.current = false;
            });
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchInputs({
            ...searchInputs,
            [target.id]: target.value
        })
    }

    const handleSubmit = (e) => {
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

    const handleCellRender = (cell) => {
        if (cell.column.Header === "Invoice Date"
            || cell.column.Header === "Invoice Start Date" || cell.column.Header === "Invoice End Date") {
            return (
                <span>{cell.value ? formatISODateDDMMMYY(cell.value) : '-'}</span>
            )
        }
        else
            return (<span>{cell.value}</span>)
    }

    return (
        <div className="pt-1">
            <div className="cmmn-skeleton mt-2">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">Invoice Report</h4></div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="p-2">
                    <div className="col-12 p-2">
                        <div className="pr-0 p-0 row">
                            <div className="col pt-1">
                                <div className="d-flex justify-content-end">
                                    <h6 className="cursor-pointer" style={{ color: "#142cb1", float: "right" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                                </div>
                            </div>
                        </div>
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            {
                                displayForm && (
                                    <form onSubmit={handleSubmit}>
                                        <div className="search-result-box p-0">
                                            <div className="autoheight p-1">
                                                <section>
                                                    <div className="form-row pb-2 col-12">
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="customerNo" className="control-label">Customer No</label>
                                                                <input
                                                                    value={searchInputs.customerNo}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="customerNo"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="customerNumber" className="control-label">Customer Name</label>
                                                                <input
                                                                    value={searchInputs.customerName}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="customerName"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="customerType" className="control-label">Customer Type</label>
                                                                <select className="form-control" id="customerType" value={searchInputs.customerType} onChange={handleInputChange}>
                                                                    <option value="">Select Customer Type</option>
                                                                    {
                                                                        customerTypeLookup && customerTypeLookup.map((e) => (
                                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="billRefNumber" className="control-label">Billable Referance Number</label>
                                                                <input
                                                                    value={searchInputs.billRefNumber}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="billRefNumber"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="invoiceNumber" className="control-label">Invoice Number</label>
                                                                <input
                                                                    value={searchInputs.invoiceNumber}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="invoiceNumber"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="invoiceDate" className="control-label">Invoice Date</label>
                                                                <input type="date" id="invoiceDate" className="form-control"
                                                                    value={searchInputs.invoiceDate}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="invoiceStatus" className="control-label">Invoice Status</label>
                                                                <select className="form-control" id="invoiceStatus" value={searchInputs.invoiceStatus} onChange={handleInputChange}>
                                                                    <option value="">Select Invoice Status</option>
                                                                    {
                                                                        invoiceStatusLookup && invoiceStatusLookup.map((e) => (
                                                                            <option key={e.description} value={e.description}>{e.description}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>

                                                    </div>
                                                    <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                                        <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setSearchData([]); }}>Clear</button>
                                                        <button type="submit" className="skel-btn-submit" >Search</button>
                                                        
                                                    </div>
                                                </section>
                                            </div>
                                        </div>
                                    </form>
                                )
                            }
                        </div>
                    </div>
                </div>
                {
                    !!searchData.length &&
                    <div className="row mt-2">
                        <div className="col-lg-12">
                            {
                                !!searchData.length &&
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <div style={{}}>
                                            <DynamicTable
                                                listSearch={listSearch}
                                                listKey={"Invoice Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={InvoiceColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                url={properties.REPORTS_API + '/invoiceSearch'}
                                                method={'POST'}
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
                    </div>
                }
            </div>
        </div>
    );
}

export default InvoiceReport;