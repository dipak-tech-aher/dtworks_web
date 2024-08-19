import React, { useEffect, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { toast } from 'react-toastify'
import { hideSpinner, showSpinner } from '../../../common/spinner'
import { properties } from '../../../properties'
import { get, post } from '../../../common/util/restUtil'
import { formFilterObject, USNumberFormat } from '../../../common/util/util'
import moment from 'moment'
import DynamicTable from '../../../common/table/DynamicTable'
import { useHistory } from '../../../common/util/history'

const SearchReceipt = () => {
    const history = useHistory()
    const initialValues = {
        receiptId: "",
        receiptNumber: "",
        bankName: "",
        receiptStatus: "",
        crmCustomerNo: "",
        customerName: "",
        receiptCreatedAt: ""
    }
    const [searchParams, setSearchParams] = useState(initialValues)
    const [receiptStatusList, setReceiptStatusList] = useState([])
    const [receiptList, setReceiptList] = useState([])
    const [displayForm, setDisplayForm] = useState(true);
    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)
    const [listSearch, setListSearch] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [receiptBankLookup, setReceiptBankLookup] = useState([])
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=RECEIPT_STATUS,RECEIPT_BANK')
            .then((response) => {
                if (response.data) {
                    setReceiptBankLookup(response.data["RECEIPT_BANK"])
                    setReceiptStatusList(response.data["RECEIPT_STATUS"].filter((x) => !['RS_APPLIED', 'RS_UNAPPLIED', 'RS_PARTIALLY_APPLIED', 'RS_REVERSED'].includes(x.code)))
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])

    useEffect(() => {
        if (!isFirstRender.current) {
            getReceiptList();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const handleInputChange = (e) => {
        const target = e.target;
        setSearchParams({
            ...searchParams,
            [target.id]: target.value
        })
        if (target.id === 'receiptStatus') {
            setReceiptList([])
            setTotalCount(0)
        }
    }

    const getReceiptList = () => {
        if (searchParams.receiptStatus === '') {
            toast.error('Please Provide the Receipt Status')
            return
        }
        showSpinner();
        const requestBody = {
            ...searchParams,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        post(`${properties.RECEIPT_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        const { count, rows } = resp?.data;
                        if (Number(count) > 0) {
                            unstable_batchedUpdates(() => {
                                setTotalCount(count)
                                setReceiptList(rows);
                            })
                        }
                        else {
                            if (filters.length > 0) {
                                setFilters([]);
                                toast.error("Records Not found");
                            }
                            else {
                                setReceiptList([]);
                                toast.error("Records Not found");
                            }

                        }
                    }
                    else {
                        setReceiptList([]);
                        toast.error("Records Not Found");
                    }
                }
                else {
                    setReceiptList([]);
                    toast.error("Records Not Found");
                }
            }).finally(() => {
                hideSpinner();
                isTableFirstRender.current = false;
            });
    }

    const handleSubmit = (e) => {
        // e.preventDefault();
        isFirstRender.current = false;
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

    const handleClear = () => {
        setSearchParams(initialValues)
        setReceiptList([])
    }

    const handleReceiptEdit = (data) => {
        history(`/edit-receipt`, { state: { data: { mode: 'edit', editData: data } } })
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Receipt Number") {
            return (<span className="text-secondary cursor-pointer" id="CUSTOMERID" onClick={(e) => handleReceiptEdit(row.original)}>{cell.value}</span>)
        }
        else if (["Receipt Amount", "Unapplied Amount", "Receipt Unidentified Amount"].includes(cell.column.Header)) {
            return (<span>{USNumberFormat(cell.value)}</span>)
        }
        else if (['Created By', 'Receipt Created By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdByName?.firstName || "") + " " + (row?.original?.createdByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (['Updated By'].includes(cell.column.Header)) {
            let name = (row?.original?.updatedByName?.firstName || "") + " " + (row?.original?.updatedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Receipt Created At"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        else if (["Receipt Date"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        // else if (['Action'].includes(cell.column.Header)) {
        //     return (
        //         <button type="button" className="btn btn-labeled btn-primary btn-sm" onClick={() => handleReceiptEdit(row.original)}>Edit/View</button>
        //     )
        // }
        return (<span>{cell.value}</span>);
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <>
            <div className="row">
                <div className="col-md-12 row p-0">
                    <div className="col-md-8">
                        <div className="page-title-box">
                            <h4 className="page-title">Receipts</h4>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="pt-1 pb-1">
                            <div className="text-right">
                                <button type="button" className="btn btn-outline-primary waves-effect waves-light mb-2" onClick={() => { history(`/add-receipt`, { state: { data: { mode: 'add' } } }) }}>Add Receipt</button>
                            </div>
                        </div>
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
                                displayForm &&
                                <div>
                                    <div className="row">
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="receiptId" className="control-label">Receipt Number</label>
                                                <input
                                                    value={searchParams?.receiptId}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="receiptId"
                                                    placeholder="Enter Receipt Number"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="receiptNumber" className="control-label">Receipt Reference Number</label>
                                                <input
                                                    value={searchParams?.receiptNumber}
                                                    onChange={handleInputChange}
                                                    type="text"
                                                    className="form-control"
                                                    id="receiptNumber"
                                                    placeholder="Enter Reference Receipt Number"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="bankName" className="control-label">Bank Name</label>
                                                <select value={searchParams.bankName} id="bankName" className="form-control"
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select Bank Name</option>
                                                    {
                                                        receiptBankLookup && receiptBankLookup.map((c, index) => {
                                                            return (<option key={index} value={c.code}>{c.description}</option>)
                                                        })
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="receiptStatus" className="control-label">Receipt Status</label>
                                                <select value={searchParams.receiptStatus} id="receiptStatus" className="form-control"
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Select Receipt Status</option>
                                                    {
                                                        receiptStatusList && receiptStatusList.map((c, index) => {
                                                            return (<option key={index} value={c.code}>{c.description}</option>)
                                                        })
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="receiptCreatedAt" className="control-label">Receipt Date</label>
                                                <input
                                                    value={searchParams?.receiptCreatedAt}
                                                    onChange={handleInputChange}
                                                    type="date"
                                                    className="form-control"
                                                    id="receiptCreatedAt"
                                                />
                                            </div>
                                        </div>
                                        {
                                            searchParams.receiptStatus === 'RS_IDENTIFIED' &&
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="crmCustomerNo" className="control-label">Customer Number</label>
                                                    <input
                                                        value={searchParams?.crmCustomerNo}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        className="form-control"
                                                        id="crmCustomerNo"
                                                        placeholder="Enter Customer Number"
                                                    />
                                                </div>
                                            </div>
                                        }
                                        {
                                            searchParams.receiptStatus === 'RS_IDENTIFIED' &&
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="customerName" className="control-label">Customer Name</label>
                                                    <input
                                                        value={searchParams?.customerName}
                                                        onChange={handleInputChange}
                                                        type="text"
                                                        className="form-control"
                                                        id="customerName"
                                                        placeholder="Enter Customer Name"
                                                    />
                                                </div>
                                            </div>
                                        }
                                    </div>
                                    <div className="skel-btn-center-cmmn mt-2">
                                    <button type="button" className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                                        <button type="submit" className="skel-btn-submit" onClick={handleSubmit}>Search</button>
                                        
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div className="row mt-1">
                <div className="col-lg-12">
                    <div className="m-t-30 card-box">
                        <div className="tab-content p-0">
                            <div className="tab-pane  show active" id="naturecode">
                                <div className="row mt-2" id="datatable">
                                    <div className="col-lg-12 p-0">
                                        <div className="card-body">
                                            {
                                                receiptList.length > 0 &&
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div>
                                                            <DynamicTable
                                                                listSearch={listSearch}
                                                                listKey={`Receipt ${searchParams.receiptStatus === 'RS_IDENTIFIED' ? 'Identified' : 'Unidentified'} List`}
                                                                row={receiptList}
                                                                rowCount={totalCount}
                                                                header={searchParams.receiptStatus === 'RS_IDENTIFIED' ? ReceiptIdentifedListColumns : ReceiptUnidentifedListColumns}
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
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </div >
            </div >
        </>
    )
}

export default SearchReceipt

const ReceiptIdentifedListColumns = [
    // {
    //     Header: "Action",
    //     accessor: "edit",
    //     disableFilters: true
    // },
    // {
    //     Header: "Receipt Number",
    //     accessor: "receiptId",
    //     disableFilters: false
    // },
    {
        Header: "Receipt Number",
        accessor: "receiptNumber",
        disableFilters: false
    },
    {
        Header: "Customer Number",
        accessor: "customer.crmCustomerNo",
        disableFilters: false,
        id: "crmCustomerNo"
    },
    {
        Header: "Customer Name",
        accessor: "customer.firstName",
        disableFilters: false,
        id: "customerName"
    },
    {
        Header: "Receipt Amount",
        accessor: "amount",
        disableFilters: false
    },
    // {
    //     Header: "Receipt Balance Amount",
    //     accessor: "balanceAmount",
    //     disableFilters: true
    // },
    {
        Header: "Unapplied Amount",
        accessor: "balanceAmount",
        disableFilters: false
    },
    {
        Header: "Currency",
        accessor: "currencyDesc.description",
        disableFilters: false,
        id: "currency"
    },
    {
        Header: "Payment Mode",
        accessor: "paymentModeDesc.description",
        disableFilters: false,
        id: "paymentMode"
    },
    {
        Header: "Bank",
        accessor: "bankNameDesc.description",
        disableFilters: false
    },
    {
        Header: "Status",
        accessor: "statusDesc.description",
        id: "receiptStatus",
        disableFilters: true
    },
    {
        Header: "Receipt Date",
        accessor: "receiptCreatedAt",
        disableFilters: true
    },
    {
        Header: "Receipt Created At",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Receipt Created By",
        accessor: "createdBy",
        disableFilters: false
    },
    {
        Header: "Remarks",
        accessor: "remarks",
        disableFilters: false
    },

]

const ReceiptUnidentifedListColumns = [
    // {
    //     Header: "Action",
    //     accessor: "edit",
    //     disableFilters: true
    // },
    {
        Header: "Receipt Number",
        accessor: "receiptId",
        disableFilters: false
    },
    {
        Header: "Receipt Reference Number",
        accessor: "receiptNumber",
        disableFilters: false
    },
    {
        Header: "Receipt Amount",
        accessor: "amount",
        disableFilters: false
    },
    {
        Header: "Receipt Unidentified Amount",
        accessor: "balanceAmount",
        disableFilters: false
    },
    {
        Header: "Currency",
        accessor: "currencyDesc.description",
        disableFilters: false,
        id: "currency"
    },
    {
        Header: "Payment Mode",
        accessor: "paymentModeDesc.description",
        disableFilters: false,
        id: "paymentMode"
    },
    {
        Header: "Bank",
        accessor: "bankNameDesc.description",
        disableFilters: false
    },
    {
        Header: "Receipt Date",
        accessor: "receiptCreatedAt",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "statusDesc.description",
        id: "receiptStatus",
        disableFilters: true
    },
    {
        Header: "Receipt Created At",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Receipt Created By",
        accessor: "createdBy",
        disableFilters: false,
        id: "receiptCreatedBy"
    },
    {
        Header: "Remarks",
        accessor: "remarks",
        disableFilters: false
    }
]