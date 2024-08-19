/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify';
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { USNumberFormat } from '../../../common/util/util';
import { formatISODateDDMMMYY } from "../../../common/util/dateUtil";
import { validateNumber } from '../../../common/util/validateUtil';

const ARAgeingReport = () => {
    const initialValues = {
        customerNo: '',
        customerName: '',
        soNumber: '',
        invoiceNumber: '',
        invoiceDate: '',
        year: '',
        month: ''
    }
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [displayForm, setDisplayForm] = useState(true);
    const [listSearch, setListSearch] = useState([]);
    const [searchData, setSearchData] = useState([]);
    const [entityId, setEntityId] = useState('');

    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)
    const [onsubmit, setOnsubmit] = useState(false)

    const [years, setYears] = useState([]);
    const [monthLookup, setMonthLookup] = useState([]);
    const [months, setMonths] = useState([]);

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);


    const [isARAgeingSearch, setIsARAgeingSearch] = useState('AR-AGEING')

    const handleSearchChange = (type) => {
        setIsARAgeingSearch(type)
        setSearchInputs(initialValues);
        setSearchData([]);
        setFilters([])
    }
    useEffect(() => {
        get(properties.REPORTS_API + '/snap-year-month')
            .then((response) => {
                if (response?.data) {
                    let lookupData = response?.data;
                    setYears(lookupData?.years)
                    setMonthLookup(lookupData?.data)
                }
            })
    }, [])

    useEffect(() => {
        if (!isFirstRender.current) {
            if (isARAgeingSearch === 'AR-AGEING-SNAP') {
                if (searchInputs.month === '') {
                    toast.error('Please Provide the Invoice Month')
                    return
                }
                if (searchInputs.year === '') {
                    toast.error('Please Provide the Invoice Year')
                    return
                }
            }
            getArAgeingReport();

        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const getArAgeingReport = () => {
        const requestBody = {
            ...searchInputs,
            //filters: formFilterObject(filters),
            isARAgeingSearch
        }
        if (onsubmit) {
            requestBody.entityId = entityId
        }

        post(`${properties.REPORTS_API}/ar-ageing?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        if (Number(count) > 0) {
                            unstable_batchedUpdates(() => {
                                setTotalCount(count)
                                let sortedRows = rows?.map(x => ({ ...x, invoiceId: Number(x.invoiceId) }))?.sort(({ invoiceId: a }, { invoiceId: b }) => b - a)
                                setSearchData(sortedRows);
                                requestBody.entityId = rows[0].iuid
                                setEntityId(rows[0].iuid)
                            })
                        }
                        else {
                            if (filters.length === 0) {
                                setSearchData([])
                            }
                            toast.error("Records Not found");
                            setFilters([]);
                            // setSearchData([])
                        }
                    } else {
                        setSearchData([])
                        toast.error("Records Not Found")
                    }
                } else {
                    setSearchData([])
                    toast.error("Records Not Found")
                }
            }).finally(() => {
                isTableFirstRender.current = false;
            });
        setListSearch(requestBody);
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
        console.log('e.target', target.id)
        if (target.id === 'year') {
            setMonths(false);
            if (monthLookup && target.id !== 'month') {
                const obj = monthLookup.filter((x) => x.year === Number(target.value))
                setMonths(obj)
            }
        }

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        isTableFirstRender.current = true;
        setOnsubmit(true)
        setEntityId('')

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
        if (['Invoice Date', 'Invoice Start Date', 'Invoice End Date', 'Invoice Due Date', 'Receipt Date', 'Receipt Created Date'].includes(cell.column.Header)) {
            return (<span>{cell.value ? formatISODateDDMMMYY(cell.value) : '-'}</span>)
        } else if (["Invoice Amount", "Invoice O/S Amount", 'Current', '1–30 Days', '31–60 Days', '61–90 Days', '91–180 Days',
            '181–360 Days', '361+ Days'].includes(cell.column.Header)) {
            return (<span>{cell.value ? USNumberFormat(cell.value) : '-'}</span>)
        } else {
            return (<span>{cell.value}</span>)
        }
    }

    return (
        <div className="cmmn-skeleton mt-2">
            
            <div className="pt-1">
                <div className="">
                    <div className="col-12 p-2">
                        <div className="row">
                            <div className="text-center cus-srch clearfix">
                                <button type="button" className={`search-btn1 btn waves-effect waves-light btn-primary ${isARAgeingSearch === 'AR-AGEING' && 'active'}`} onClick={() => { handleSearchChange('AR-AGEING') }}> Current</button>
                                <button type="button" className={`search-btn1 btn1 waves-effect waves-light btn-primary ${isARAgeingSearch === 'AR-AGEING-SNAP' && 'active'}`} onClick={() => { handleSearchChange('AR-AGEING-SNAP') }}> Closed Period</button>
                            </div>
                        </div>
                        <div className="col pt-1">
                            <div className="d-flex justify-content-end">
                                <h6 className="cursor-pointer" style={{ color: "#163c81", float: "right" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
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
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="customerNo" className="control-label">Customer Number</label>
                                                                <input
                                                                    placeholder='Please Enter Customer Number'
                                                                    value={searchInputs.customerNo}
                                                                    onKeyPress={(e) => {
                                                                        validateNumber(e);
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
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="customerNumber" className="control-label">Customer Name</label>
                                                                <input
                                                                    placeholder='Please Enter Customer Name'
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
                                                        {/* <div className="col-md-3">
                                                            <div className="form-group">
                                                                <label htmlFor="soNumber" className="control-label">Sales Order Number</label>
                                                                <input type="text" className="form-control" id="soNumber" placeholder="Please Enter Sales Order Number"
                                                                    value={searchInputs.soNumber}
                                                                    onChange={handleInputChange}
                                                                />
                                                            </div>
                                                        </div> */}

                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="invoiceNumber" className="control-label">Invoice Number</label>
                                                                <input
                                                                    placeholder="Please Enter Invoice Number"
                                                                    value={searchInputs.invoiceNumber}
                                                                    onKeyPress={(e) => {
                                                                        validateNumber(e);
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
                                                        {
                                                            isARAgeingSearch === 'AR-AGEING' &&
                                                            <div className="col-md-3">
                                                                <div className="form-group">
                                                                    <label htmlFor="invoiceDate" className="control-label">Invoice Date</label>
                                                                    <input type="date" className="form-control" id="invoiceDate" placeholder=""
                                                                        value={searchInputs.invoiceDate}
                                                                        onChange={handleInputChange}
                                                                    />
                                                                </div>
                                                            </div>
                                                        }
                                                        {
                                                            isARAgeingSearch === 'AR-AGEING-SNAP' &&
                                                            <div className="col-md-3">
                                                                <div className="form-group">
                                                                    <label htmlFor="year" className="control-label">Invoice Year<span>*</span></label>
                                                                    <select value={searchInputs.year} id="year" className="form-control"
                                                                        onChange={handleInputChange}>
                                                                        <option value="">Select Invoice Year</option>
                                                                        {
                                                                            years && years.map((c) => {
                                                                                return (<option key={c} value={c}>{c}</option>)
                                                                            })
                                                                        }
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        }
                                                        {
                                                            isARAgeingSearch === 'AR-AGEING-SNAP' &&
                                                            <div className="col-md-3">
                                                                <div className="form-group">
                                                                    <label htmlFor="month" className="control-label">Invoice Month<span>*</span></label>
                                                                    <select value={searchInputs.month} id="month" className="form-control"
                                                                        onChange={handleInputChange}>
                                                                        <option value="">Select Invoice Month</option>
                                                                        {
                                                                            months && months.map((c) => {
                                                                                return (<option key={c.month} value={c.month}>{c.monthname}</option>)
                                                                            })
                                                                        }
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                    <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                                        <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setSearchData([]); setEntityId(''); }}>Clear</button> &nbsp;
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
                                                listKey={isARAgeingSearch !== 'AR-AGEING-SNAP' ? "AR Ageing Header Report" : "AR Ageing Snap Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={Columns}
                                                hiddenColumns={isARAgeingSearch !== 'AR-AGEING-SNAP' ? hiddenColumns : ''}
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
                }
            </div>
        </div>
    );
}

export default ARAgeingReport;


export const Columns = [
    {
        Header: "Invoice Number",
        accessor: "invoiceId",
        disableFilters: true,
        id: "invoiceId"
    },
    {
        Header: "ERP Invoice Ref No",
        accessor: "invNo",
        disableFilters: true,
        id: "invNo"
    },
    {
        Header: "Receipt ID",
        accessor: "receiptId",
        disableFilters: true,
        id: "receiptId"
    },
    {
        Header: "Receipt Date",
        accessor: "receiptDate",
        disableFilters: true,
        id: "receiptDate"
    },
    {
        Header: "Receipt Created Date",
        accessor: "receiptCreatedDate",
        disableFilters: true,
        id: "receiptCreatedDate"
    },
    // {
    //     Header: "Order Number",
    //     accessor: "orderNo",
    //     disableFilters: true,
    //     id: "soNumber"
    // },
    {
        Header: "Sales Order Number",
        accessor: "orderNo",
        disableFilters: true,
        id: "orderNo"
    },
    {
        Header: "Customer Number",
        accessor: "customerNo",
        disableFilters: true,
        id: "customerNo"
    },
    {
        Header: "Customer Name",
        accessor: "customerName",
        disableFilters: true,
        id: "customerName"
    },
    {
        Header: "Related Party Information",
        accessor: "relatedPartyInfo",
        disableFilters: true,
        id: "relatedPartyInfo"
    },
    {
        Header: "Invoice Start Date",
        accessor: "invStartDate",
        disableFilters: true,
        id: "invStartDate"
    },
    {
        Header: "Invoice End Date",
        accessor: "invEndDate",
        disableFilters: true,
        id: "invEndDate"
    },
    {
        Header: "Invoice Date",
        accessor: "invDate",
        disableFilters: true,
        id: "invDate"
    },
    {
        Header: "Invoice Due Date",
        accessor: "dueDate",
        disableFilters: true,
        id: "dueDate"
    },
    {
        Header: "Currency",
        accessor: "currency",
        disableFilters: true,
        id: "currency"
    },
    {
        Header: "Invoice Amount",
        accessor: "invAmt",
        disableFilters: true,
        id: "invAmt"
    },
    {
        Header: "Invoice O/S Amount",
        accessor: "invOsAmt",
        disableFilters: true,
        id: "invOsAmt"
    },
    {
        Header: "Status",
        accessor: "invoiceStatus",
        disableFilters: true,
        id: "invoiceStatus"
    },
    {
        Header: "Due Aging",
        accessor: "dueAging",
        disableFilters: true,
        id: "dueAging"
    },
    {
        Header: "Current",
        accessor: "currentAmt",
        disableFilters: true,
        id: "currentAmt"
    },
    {
        Header: "1–30 Days",
        accessor: "days130",
        disableFilters: true,
        id: 'days130'
    },
    {
        Header: "31–60 Days",
        accessor: "days3160",
        disableFilters: true,
        id: 'days3160'
    },
    {
        Header: "61–90 Days",
        accessor: "days6190",
        disableFilters: true,
        id: "days6190"
    },

    {
        Header: "91–180 Days",
        accessor: "days91180",
        disableFilters: true,
        id: "days91180"
    },

    {
        Header: "181–360 Days",
        accessor: "days181360",
        disableFilters: true,
        id: "days181360"
    },
    {
        Header: "361+ Days",
        accessor: "daysMorethan360",
        disableFilters: true,
        id: "daysMorethan360"
    },
    {
        Header: "Opportunity Name",
        accessor: "opportunityName",
        disableFilters: true,
        id: "opportunityName"
    },
    {
        Header: "Closed Month",
        accessor: "arAgeingSnapMonthNm",
        disableFilters: true,
        id: "arAgeingSnapMonthNm"
    },
    {
        Header: "Closed Year",
        accessor: "arAgeingSnapYear",
        disableFilters: true,
        id: "arAgeingSnapYear"
    }

]

const hiddenColumns = ['arAgeingSnapMonthNm', 'arAgeingSnapYear']

