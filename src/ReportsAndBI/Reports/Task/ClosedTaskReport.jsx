import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify';
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { post, get } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment';
import ReactSelect from 'react-select';
import openTaskColumns from './Columns/OpenTaskColumns';

const ClosedTaskReport = () => {
    const initialValues = {
        currEntity: '',
        currRole: '',
        currUser: '',
        taskPriority: '',
        stakeholder: '',
        taskName: '',
        missionName: '',
        taskStatus: '',
        dateFrom: moment().startOf('month').format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD')
    }
    const isFirstRender = useRef(true);
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [displayForm, setDisplayForm] = useState(true);
    const [searchData, setSearchData] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true)
    const [uuid, setUuid] = useState('')

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);

    const [TaskStatusLookup, setTaskStatusLookup] = useState([])
    const [taskPriorityLookup, settaskPriorityLookup] = useState([])
    const [leadList, setLeadList] = useState([]);
    const [tagsLookup, setTagsLookup] = useState([]);
    useEffect(() => {
        get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=PRIORITY,LEAD_TASK_STATUS,TAGS')
            .then((response) => {
                if (response.data) {
                    let lookupData = response.data;
                    setTaskStatusLookup(lookupData['LEAD_TASK_STATUS'])
                    setTagsLookup(response?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })));
                    settaskPriorityLookup(lookupData['PRIORITY'])
                }
            }).catch(error => console.log(error))
        post(`${properties.LEAD_API}/search`, { withOutAssociations: true }).then((resp) => {
            if (resp.status === 200) {
                setLeadList(resp.data.rows.map(x => ({ label: x.leadName, value: x.leadUuid })));
            }
        }).catch((error) => {
            console.log(error)
        });
    }, [])

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
        let tempsearchInputs = Object.fromEntries(
            Object.entries(searchInputs).filter(([_, value]) => value !== undefined && value !== null && value !== "")
        );
        let requestBody = {
            'searchParams': {
                ...tempsearchInputs,
            }
        }
        post(`${properties.REPORTS_API}/tasks/closed`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    setUuid(resp?.data?.uid)
                }
            }).catch(error => console.log(error)).finally(() => {
                isTableFirstRender.current = false;
            });
    }

    useEffect(() => {
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
    }, [uuid])
    useEffect(() => {
        if (!isFirstRender.current && uuid) {
            getTaskDetails();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage])

    const getTaskDetails = () => {
        get(`${properties.REPORTS_API}/get-task/closed?limit=${perPage}&page=${currentPage}&uuid=${uuid}`)
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

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Created At") {
            return (
                <span>{cell.value ? moment(cell.value, 'DD-MM-YYYY').format('DD MMM YYYY') : '-'}</span>
            )
        }
        else
            return (<span>{cell.value ?? '-'}</span>)
    }
    return (
        <div className="cmmn-skeleton mt-2">
            <div className="">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <div className="d-flex justify-content-end">
                                <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                            </div>
                            {
                                displayForm && (
                                    <form>
                                        <div className="row">
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="taskName" className="control-label">Task Name</label>
                                                    <input value={searchInputs.taskName}
                                                        onChange={handleInputChange} type="text" className="form-control" id="taskName"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="stakeholder" className="control-label">
                                                        Stakeholder Name
                                                    </label>
                                                    <div className="">
                                                        <ReactSelect
                                                            id='stakeholder'
                                                            placeholder="Select Stakeholder"
                                                            menuPortalTarget={document.body}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                            options={leadList}
                                                            onChange={(selected) => {
                                                                setSearchInputs({ ...searchInputs, stakeholder: selected.label });
                                                            }}
                                                            value={leadList.filter(x => x.label == searchInputs.stakeholder)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="missionName" className="control-label">Mission Name</label>
                                                    <input value={searchInputs.missionName}
                                                        onChange={handleInputChange} type="text" className="form-control" id="missionName"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="taskPriority" className="control-label">Priority</label>
                                                    <select
                                                        className="form-control"
                                                        id="taskPriority"
                                                        required=""
                                                        onChange={handleInputChange}
                                                        value={searchInputs.taskPriority}
                                                    >
                                                        <option>Select Priority</option>
                                                        {taskPriorityLookup.map((item) => (
                                                            <option key={item.code} value={item.code}>
                                                                {item.description}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            {/* <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="taskStatus" className="control-label">Status</label>
                                                    <select className="form-control"
                                                        id="taskStatus"
                                                        required=""
                                                        onChange={handleInputChange}
                                                        value={searchInputs.taskStatus}
                                                    >
                                                        <option>Select Status</option>
                                                        {TaskStatusLookup.map((item) => (
                                                            <option key={item.code} value={item.code}>
                                                                {item.description}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div> */}
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="taskTags" className="control-label">
                                                        Tags
                                                    </label>
                                                    <ReactSelect
                                                        id='taskTags'
                                                        placeholder="Choose Tags"
                                                        menuPortalTarget={document.body}
                                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        // isMulti
                                                        options={tagsLookup}
                                                        onChange={(selected) => {
                                                            // console.log(selected);
                                                            // let taskTags = selected.map(x => x.value)
                                                            searchInputs['taskTags'] = selected.value;
                                                            setSearchInputs({ ...searchInputs });
                                                        }}
                                                        value={tagsLookup.filter(e => searchInputs?.taskTags?.includes(e.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="Date From" className="control-label">From Date</label>
                                                    <input type="date" value={searchInputs.dateFrom} onChange={handleInputChange} className="form-control" id="dateFrom"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label htmlFor="To From" className="control-label">To Date</label>
                                                    <input type="date" value={searchInputs.dateTo} onChange={handleInputChange} className="form-control" id="dateTo"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                            <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setSearchData([]) }}>Clear</button>
                                            <button type="button" className="skel-btn-submit" onClick={handleSubmit}>Search</button>

                                        </div>
                                    </form>
                                )
                            }
                        </div>
                        {
                            searchData && Array.isArray(searchData) && searchData?.length > 0 && <>
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <div style={{}}>
                                            <DynamicTable
                                                listKey={"Created Task Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={openTaskColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                url={`${properties.REPORTS_API}/get-task/closed?limit=${perPage}&page=${currentPage}&uuid=${uuid}`}
                                                method={'GET'}
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

                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ClosedTaskReport