import React, { useContext, useState, useEffect, useRef } from 'react'
import { toast } from "react-toastify";
import { post, get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import DynamicTable from '../../../common/table/DynamicTable';
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment'

const ApplicationLog = (props) => {

    const initialValues = {
        startDate: "",
        endDate: ""

    }
    const [listSearch, setListSearch] = useState([]);
    const [hideAccount, setHideAccount] = useState(false)
    const hasExternalSearch = useRef(false);
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [logsData, setLogsData] = useState([]);
    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)
    const isTableFirstRender = useRef(true);

    useEffect(() => {
        if (!isFirstRender.current) {
            getdtWorksLogsData();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const getTIBCOLogsData = () => {
        if (searchInputs.startDate === '' || searchInputs.endDate === '') {
            toast.error("Please enter valid dates!");
            return;
        }
        setHideAccount(false)
        
        const requestBody = {
            ...searchInputs
        }
        setListSearch(requestBody);
        post(`${properties.LOGS_API}/tibcoLogs?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const rows = resp.data.rows;
                        console.log('rows.payload')
                        const count = resp.data.count;
                        if (rows.length > 0) {
                            unstable_batchedUpdates(() => {
                                setTotalCount(count)
                                setLogsData(rows);
                            })
                        }
                        else {
                            toast.error("Records Not found");
                            setFilters([]);
                        }
                    } else {
                        setLogsData([]);
                        toast.error("Records Not Found");
                    }
                } else {
                    setLogsData([]);
                    toast.error("Records Not Found");
                }
            }).catch((error) => {
                console.log(error)
            }).finally(() => {
                
                isTableFirstRender.current = false;
            });

    }

    const getdtWorksLogsData = () => { 
        if (searchInputs.startDate === '' || searchInputs.endDate === '') {
            toast.error("Please enter valid dates!");
            return;
        }
        setHideAccount(false)
        
        const requestBody = {
            ...searchInputs
        }
        setListSearch(requestBody);
        get(`${properties.PORTAL_SETTING_API}/dtWorksLogs?limit=${perPage}&page=${currentPage}`)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const rows = resp.data
                        if (rows.length > 0) {
                            unstable_batchedUpdates(() => {
                                setLogsData(rows);
                            })
                        }
                        else {
                            toast.error("Records Not found");
                            setFilters([]);
                        }
                    } else {
                        setLogsData([]);
                        toast.error("Records Not found");
                    }
                }
            })
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
        if (cell.column.Header === "Action") {
            return (
                <div className="btn-group" id='sequenceNox'>
                    <a  download="download"
                        className="btn btn-link btn-lg text-muted" id="sequenceNo" onClick={(e) => download(e, row.original, cell.column.Header)}>
                        <i className="dripicons-download"></i>
                    </a>
                </div >
            )
        }
        return (<span>{cell.value}</span>);
    }

    const download = (event, rowData, header) => {
        const element = document.createElement("a");
        const { log_timestamp, content } = rowData;
        const file = new Blob(['Log Timestamp :: ',log_timestamp,'\n', content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "Log.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    const handleClear = () => {

        setSearchInputs(initialValues)
        setLogsData([])
        setTotalCount(0)
        setFilters([])

    }

    return (
        <>
            <div className="cmmn-skeleton mt-2" cx="">
                <div className="" cx="">
                    <div className="" cx="">
                        {/* <div className="row" cx="">
                            <div className="col-12" cx="">
                                <div className="page-title-box" cx="">
                                    <h4 className="page-title" cx="">Application Log</h4>
                                </div>
                            </div>
                        </div> */}
                        <div className="p-0" cx="">
                            <div className="card-body p-2" cx="">
                                <div className="col-12 row">

                                    <div className="col-md-4" cx="">
                                        <div className="form-group" cx="">
                                            <label className="col-form-label" cx="">Log From Date<span className="text-danger"
                                                cx=""> *</span> </label>
                                            <input id="startDate" name="startDate" type="date" className="form-control"
                                                value={searchInputs.startDate}
                                                onChange={handleInputChange} cx="" />
                                        </div>
                                    </div>

                                    <div className="col-md-4" cx="">
                                        <div className="form-group" cx="">
                                            <label className="col-form-label" cx="">Log To Date <span className="text-danger"
                                                cx=""> *</span></label>
                                            <input type="date" id="endDate" name="endDate" className="form-control"
                                                value={searchInputs.endDate}
                                                onChange={handleInputChange} cx="" />
                                        </div>
                                    </div>

                                    <div className="col-md-4 skel-btn-center-cmmn pt-1" cx="">
                                        <button type="button" className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                                        <button type="button" className="skel-btn-submit" onClick={handleSubmit}><i className="fa fa-search mr-1"></i> Search</button>
                                        
                                    </div>

                                    <div className="col-12 text-center pt-2 pb-2" cx="">
                                        {
                                            logsData && logsData.length > 0 &&
                                            <DynamicTable
                                                filterRequired={false}
                                                listSearch={listSearch}
                                                listKey={"Log List"}
                                                row={logsData}
                                                rowCount={logsData.length}
                                                header={LogTableColumns}
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
                                        }
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
export default ApplicationLog;

const LogTableColumns = [
    {
        Header: "Action",
        accessor: "",
        disableFilters: false

    },
    {
        Header: "Log Name",
        accessor: "fileName",
        disableFilters: false
    },
    {
        Header: "Log Timestamp",
        accessor: "logTime",
        disableFilters: false

    },    
    {
        Header: "Content",
        accessor: "content",
        disableFilters: false

    }
]
