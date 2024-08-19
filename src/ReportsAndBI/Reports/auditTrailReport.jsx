/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify';

import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { post } from '../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { formFilterObject } from '../../common/util/util';
import AuditTrailColumns from './auditTrailColumns';

const LoginReport = () => {

    const initialValues = {
        userID: "",
        userName: "",
        fromDateTime: "",
        toDateTime: ""
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
            search();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const search = () => {
        
  
        const requestBody = {
            "searchType": "ADV_SEARCH",
            ...searchInputs,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
     
        post(`${properties.REPORTS_API}/auditTrailSearch?limit=${perPage}&page=${currentPage}`, searchInputs)
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
            }).finally(() => {
                
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
        return (<span>{cell.value}</span>);
    }


    return (
        <div className="card pt-1">
            <div className="container-fluid">
                <div className="form-row pb-2">
                    <div className="col-12">
                    <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4  className="pl-3">Audit Trail Report</h4></div>                      
                            </div>
                        </section>
                    </div>
                </div>
                <div className="border p-2">
                    <div className="col-12 p-2">
                        <div className="bg-light border pr-0 p-0 row"><div className="col"><h5 className="text-primary pl-2 pt-1">Search</h5></div>
                            <div className="col pt-1">
                                <div className="d-flex justify-content-end">
                                    <h6 className="cursor-pointer" style={{ color: "#142cb1", float: "right"}} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
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
                                                    <div className="col-3">
                                                        <div className="form-group">
                                                            <label htmlFor="serviceNumber" className="control-label">User ID</label>
                                                            <input
                                                                maxLength={15}
                                                                value={searchInputs.userID}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        handleSubmit(e)
                                                                    };
                                                                }}
                                                                onChange={handleInputChange}
                                                                type="text"
                                                                className="form-control"
                                                                id="userID"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-3">
                                                        <div className="form-group">
                                                            <label htmlFor="customerNumber" className="control-label">User Name</label>
                                                            <input
                                                                value={searchInputs.userName}
                                                                onKeyPress={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        handleSubmit(e)
                                                                    };
                                                                }}
                                                                onChange={handleInputChange}
                                                                type="text"
                                                                className="form-control"
                                                                id="userName"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-3">
                                                        <div className="form-group">
                                                            <label htmlFor="customerName" className="control-label">From Date and Time</label>            
                                                            <input type="datetime-local" id="fromDateTime" className="form-control" 
                                                                value={searchInputs.fromDateTime} 
                                                                onKeyPress={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        handleSubmit(e)
                                                                    };
                                                                }}
                                                                onChange={handleInputChange}                                                                               
                                                                />
                                                        </div>
                                                    </div>
                                                    <div className="col-3">
                                                        <div className="form-group">
                                                            <label htmlFor="accountNumber" className="control-label">To Date and Time</label>                                                                  
                                                            <input type="datetime-local" id="toDateTime" className="form-control" 
                                                                value={searchInputs.toDateTime}
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
                                                    <div className="col-md-12 text-center mt-2">
                                                        <button type="submit" className="btn btn-primary waves-effect waves- mr-2" >Search</button>
                                                        <button type="button" className="btn btn-secondary waves-effect waves-light" onClick={() => { setSearchInputs(initialValues); setSearchData([]); }}>Clear</button>
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
                                                listKey={"Audit Trail Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={AuditTrailColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                url={properties.REPORTS_API + '/auditTrailSearch'}
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

export default LoginReport;