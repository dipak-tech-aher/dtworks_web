import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';

import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { formatISODateDDMMMYY } from "../../common/util/dateUtil";
import { post } from '../../common/util/restUtil';
import { formFilterObject } from '../../common/util/util';
import { TicketStatisticsColumns } from './TicketStatisticsColumns';

const TicketStatisticsReport = (props) => {

    const initialValues = {
        dateFrom: "",
        dateTo: "",
        dateRange: "",
        reportType: "Ticket Statistics"
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


    useEffect(() => {
        if (!isFirstRender.current) {
            getLoginDetails();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const getLoginDetails = () => {
        
        let noOfDays = moment.duration(moment(searchInputs.dateTo, "YYYY-MM-DD").diff(moment(searchInputs.dateFrom, "YYYY-MM-DD"))).asDays() + 1
        const requestBody = {
            ...searchInputs,
            dateRange: noOfDays,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        //setSearchInputs(initialValues)       
        post(`${properties.REPORTS_API}/ticketStatistics?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(rows);
                        })
                        if (count < 1) {
                            toast.error("No Records Found")
                        }
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

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Created On") {
            return (
                <span>{cell.value ? formatISODateDDMMMYY(cell.value) : '-'}</span>
            )
        }
        else
            return (<span>{cell.value}</span>)
    }

    const handleOnCellActionsOrLink = (event, rowData, header) => {

    }

    return (
        <div className="pt-1">
            <div className="cmmn-skeleton mt-2">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">Ticket Statistics Report</h4></div>
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
                                                                <label htmlFor="dateFrom" className="control-label">Date From</label>
                                                                <input type="date" id="dateFrom" className="form-control"
                                                                    value={searchInputs.dateFrom}
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
                                                                <label htmlFor="dateTo" className="control-label">Date To</label>
                                                                <input type="date" id="dateTo" className="form-control"
                                                                    value={searchInputs.dateTo}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                />
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
                    // !!searchData.length &&
                    <div className="row mt-2">
                        <div className="col-lg-12">
                            {
                                (searchData && searchData.length > 0) ?
                                    <div className="card">
                                        <div className="card-body" id="datatable">
                                            <div style={{}}>
                                                <DynamicTable
                                                    listSearch={listSearch}
                                                    listKey={"Ticket Statistics"}
                                                    row={searchData}
                                                    rowCount={totalCount}
                                                    header={TicketStatisticsColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    url={properties.REPORTS_API + '/ticketStatistics'}
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
                                    :
                                    <span className="skel-widget-warning">No Record Available</span>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    );

}

export default TicketStatisticsReport