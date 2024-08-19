import React, { useEffect, useRef, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import {NumberFormatBase} from 'react-number-format';
import DynamicTable from '../../../common/table/DynamicTable';
import { AppContext } from '../../../AppContext';
import { formatISODateTime } from '../../../common/util/dateUtil';
import { formFilterObject, USNumberFormat } from '../../../common/util/util';

const SearchWriteOff = () => {

    const initialValues = {
        writeOffId: "",
        invoiceId: '',
        customerName: "",
        customerNumber: "",
        startDate: "",
        endDate: ""

    }

    const { auth } = useContext(AppContext)
    const [userPermission, setUserPermission] = useState({ searchAccount: false, viewAccount: false })
    const [searchParams, setSearchParams] = useState(initialValues)
    const [writeOffList, setWriteOffList] = useState([])
    const [displayForm, setDisplayForm] = useState(true);
    const [exportBtn, setExportBtn] = useState(true)
    const [isNormalSearch, setIsNormalSearch] = useState(true)
    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);

    useEffect(() => {
        if (!isFirstRender.current) {
            getWriteOffSearchData();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])


    const getWriteOffSearchData = () => {
        showSpinner();
        const requestBody = {
            ...searchParams,
            filters: formFilterObject(filters)
        }
        post(`${properties.WRITE_OFF_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (Number(resp?.data?.count) > 0) {
                        const { count, rows } = resp.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setWriteOffList(rows);
                        })
                    }
                    else {
                        toast.error('Record Not Found')
                        setFilters([])
                        if (filters.length == 0) {
                            setWriteOffList([])
                        }
                    }
                }
            }).finally(() => {
                hideSpinner()
                isTableFirstRender.current = false;
            });
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchParams({
            ...searchParams,
            [target.id]: target.value
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Write Off On") {
            return (<span>{formatISODateTime(cell.value)}</span>)
        } else if (cell.column.Header === "Write Off By") {
            return (
                <span>{row?.original?.createdByName?.firstName + ' ' + row?.original?.createdByName?.lastName}</span>
            )
        } else if (["Write Off Amount", 'Invoice Amount'].includes(cell.column.Header)) {
            return (
                <span>{USNumberFormat(cell.value)}</span>
            )
        }
        return (<span>{cell.value}</span>)
    }

    const handleClear = () => {
        setSearchParams(initialValues)
        setWriteOffList([])
        setFilters([])
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

    return (
        <div>{userPermission?.searchAccount !== "deny" &&
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box">
                            <h4 className="page-title">Write Off Search</h4>
                        </div>
                    </div>
                </div>

                <div className="row mt-1">
                    <div className="col-lg-12">
                        <div className="search-result-box m-t-30 card-box">
                            {
                                isNormalSearch && (
                                    <>
                                        <div className="d-flex justify-content-end">
                                            <div id="showHideText" style={{ float: "right" }}>
                                                <h6 className="cursor-pointer" style={{ color: "blue" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                                            </div>
                                        </div>
                                        <div id="searchBlock" className="modal-body p-2 d-block">
                                            {
                                                displayForm && (
                                                    <>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="writeOffId" className="control-label">Write Off ID</label>
                                                                    <NumberFormatBase className="form-control" id="writeOffId" placeholder="Enter Write Off ID"
                                                                        value={searchParams.writeOffId}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="invoiceId" className="control-label">Invoice ID</label>
                                                                    <NumberFormatBase className="form-control" id="invoiceId" placeholder="Enter Invoice ID"
                                                                        value={searchParams.invoiceId}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="customerNumber" className="control-label">Customer Number</label>
                                                                    <NumberFormatBase className="form-control" id="customerNumber" placeholder="Enter Customer Number"
                                                                        value={searchParams.customerNumber}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="customerName" className="control-label">Customer Name</label>
                                                                    <input type="text" className="form-control" id="customerName" placeholder="Enter Customer Name"
                                                                        value={searchParams.customerName}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="startDate" className="control-label">Start Date</label>
                                                                    <input type="date" className="form-control" id="startDate" placeholder="Enter Start Date"
                                                                        value={searchParams.startDate}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label htmlFor="endDate" className="control-label">End Date</label>
                                                                    <input type="date" className="form-control" id="endDate" placeholder="Enter End Date"
                                                                        value={searchParams.endDate}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="pt-1 pb-1">
                                                                    <div className="text-center">
                                                                        <button type="button" className="btn waves-effect waves-light btn-primary mr-2" onClick={handleSubmit}><i className="fa fa-search mr-1"></i> Search</button>
                                                                        <button type="button" className="btn waves-effect waves-light btn-secondary" onClick={handleClear}>Clear</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )
                                            }
                                        </div>
                                    </>
                                )
                            }
                            <div className="col-md-12 card-box m-0" id="datatable">
                                <div className="card">
                                    <div className="ac-search">
                                        {
                                            !!writeOffList.length &&
                                            <div className="card-body" id="datatable">
                                                <DynamicTable
                                                    listKey={"Write Off List"}
                                                    row={writeOffList}
                                                    rowCount={totalCount}
                                                    header={WriteOffSearchColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
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
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }</div>
    )
}

export default SearchWriteOff;


export const WriteOffSearchColumns = [
    {
        Header: "Write Off ID",
        accessor: "writeOffId",
        disableFilters: false,
        id: 'writeOffId'
    },
    {
        Header: "Invoice ID",
        accessor: "invoiceId",
        disableFilters: false,
        id: 'invoiceId'
    },
    {
        Header: "Customer Number",
        accessor: "customerNumber",
        disableFilters: false,
        id: 'customerNumber'
    },
    {
        Header: "Customer Name",
        accessor: "customerName",
        disableFilters: false,
        id: 'customerName'
    },
    {
        Header: "Write Off Amount",
        accessor: "writeOffAmount",
        disableFilters: false,
        id: 'writeOffAmount'
    },
    {
        Header: "Invoice Amount",
        accessor: "invoiceAmount",
        disableFilters: false,
        id: 'invoiceAmount'
    },
    {
        Header: "Write Off By",
        accessor: "createdBy",
        disableFilters: false
    },
    {
        Header: "Write Off On",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Reason",
        accessor: "remarks",
        disableFilters: false
    }
]
