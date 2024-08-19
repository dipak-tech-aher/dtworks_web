/* eslint-disable react-hooks/exhaustive-deps */
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import ReactSelect from 'react-select';
import { toast } from 'react-toastify';
import { object, string } from "yup";
import { AppContext } from '../../../AppContext';
import DynamicTable from '../../../common/table/DynamicTable';
import { get, post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { AbandonedColumns } from "./AbandonedColumns";

const AbandonedCallRport = () => {

    const {  auth } = useContext(AppContext)
    const initialValues = {
        dateFrom: moment().startOf('month').format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        queue: '',
        campaign: '',

    },SearchCretiriaInitialValue = {
        'From Date': moment().startOf("month").format("YYYY-MM-DD"),
        'To Date': moment().format("YYYY-MM-DD"),
    };
    const [searchInputs, setSearchInputs] = useState(initialValues)
    const [displayForm, setDisplayForm] = useState(true)
    const [listSearch, setListSearch] = useState({ excel: true })
    const [searchData, setSearchData] = useState([])
    const [SearchCriteria, setSearchCriteria] = useState(SearchCretiriaInitialValue);
    const isFirstRender = useRef(true)
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    const [filters, setFilters] = useState([])
    const [exportBtn, setExportBtn] = useState(true)

    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false)
    const [uid, setUid] = useState()
    const [campaigns, setCampaigns] = useState([])
    const [queues, setQueues] = useState([])
    const [error, setError] = useState({})

    const validationSchema = object().shape({
        dateFrom: string().required("From date is required."),
        dateTo: string().required("From date is required.")
    })
    const dateVariable = '1940-01-01'
    useEffect(() => {
        get(`${properties.REPORTS_API}/get/campaigns`)
            .then((resp) => {
                if (resp && resp.data && resp.data.length > 0) {
                    unstable_batchedUpdates(() => {
                        const formatedCampaigns = resp?.data?.filter((val) => val.campaign_name)?.map((e) => ({ label: e.campaign_name, value: e.campaign_name }))
                        setCampaigns(formatedCampaigns)
                    })
                }
            }).catch(error => console.error(error))
            .finally()
        get(`${properties.REPORTS_API}/get/queues`)
            .then((resp) => {
                if (resp && resp.data && resp.data.length > 0) {
                    unstable_batchedUpdates(() => {
                        const formatedCampaigns = resp?.data?.filter((val) => val.queue_name)?.map((e) => ({ label: e.queue_name, value: e.queue_name }))
                        setQueues(formatedCampaigns)
                    })
                }
            }).catch(error => console.error(error))
            .finally()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            let value = e.target.value;
            if (['select', 'select-one'].includes(e.target.type)) {
                let index = target.selectedIndex;
                value = target[index].text;
            }
            let dataAttributeName = target?.attributes?.getNamedItem('data-name')?.value ?? ''
            if (dataAttributeName) {
                setSearchCriteria({ ...SearchCriteria, [dataAttributeName]: value });
            }
            setSearchInputs({
                ...searchInputs,
                [target.id]: target.value,
            });
            setError({ ...error, [target.id]: "" });
        })
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.type === "date") {
            return (
                <span>{cell.value ? moment(cell.value).format(cell.column?.format ?? 'DD-MM-YYYY') : '-'}</span>
            )
        } else if (cell.column.type === "time") {
            return (
                <span>{cell.value ? moment(cell.value).format(cell.column?.format ?? 'hh:mm:ss') : '-'}</span>
            )
        } else
            return (<span>{cell.value}</span>)
    }

    const getAbandonedCallReport = useCallback((uid) => {
        if (uid) {
            setListSearch({ uid })
            get(`${properties.REPORTS_API}/get-report/abandoned-call?limit=${perPage}&page=${currentPage}&uuid=${uid}`)
                .then((resp) => {
                    if (resp?.status === 200 && Array.isArray(resp?.data?.rows) && resp?.data?.rows.length > 0) {
                        const { count, rows } = resp?.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(rows);
                        })
                    } else {
                        toast.error('Record Not Found')
                    }

                }).catch(error => console.error(error))
        }
    }, [auth?.accessToken, currentPage, perPage])


    const getReportDetails = useCallback(() => {
        try {
            const error = validate(validationSchema, searchInputs);
            if (error) {
                toast.error("Validation errors found. Please check highlighted fields");
                return false;
            }
            let tempsearchInputs = Object.fromEntries(
                Object.entries(searchInputs).filter(([_, value]) => value !== undefined && value !== null && value !== "" && value.length !== 0)
            );
            // delete tempsearchInputs.ouCode
            const requestBody = {
                searchParams: {
                    ...tempsearchInputs,
                },
            }
            setListSearch(requestBody);
            post(`${properties.REPORTS_API}/abandoned-call`, { ...requestBody }).then((resp) => {
                if (resp?.status === 200 && resp?.data?.uid) {
                    unstable_batchedUpdates(() => {
                        setUid(resp?.data?.uid)
                    })
                } else {
                    unstable_batchedUpdates(() => {
                        setSearchData([])
                        setFilters([]);
                    })
                    toast.error("Records Not Found")
                }
            }).catch(error => console.error(error))
        } catch (e) {
            console.log('error', e)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.accessToken, filters, searchInputs])

    const validate = (schema, form) => {
        try {
            schema.validateSync(form, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    useEffect(() => {
        if (!isFirstRender.current) {
            getAbandonedCallReport(uid);
        }
        else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, uid])

    const handleMultiInputChange = (id, props,name) => {

        unstable_batchedUpdates(() => {
            setSearchInputs({
                ...searchInputs,
                [id]: props
            })
            setSearchCriteria({ ...SearchCriteria, [name]: props });
        })

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        isTableFirstRender.current = true;
        unstable_batchedUpdates(() => {
            setUid()
            setCurrentPage(0)
            setPerPage(10)
            setTotalCount(0)
            setFilters([])
            getReportDetails()
        })
    }

    const hanleOnClear = () => {
        unstable_batchedUpdates(() => {
            setSearchInputs(initialValues);
            setSearchCriteria(SearchCretiriaInitialValue);
            setSearchData([]);
            setCurrentPage(0)
            setPerPage(10)
            setTotalCount(0)
            setError({})
            setUid()
            isTableFirstRender.current = true
            hasExternalSearch.current = false
        })
    }


    return (
        <div className="cmmn-skeleton mt-2">
            <div className="">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">Abandoned Call Report</h4></div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <div className="d-flex justify-content-end">
                                <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                            </div>
                            {
                                displayForm && (
                                    <form onSubmit={handleSubmit}>
                                        <div className="row">

                                            <div className="col-lg-3 col-md-4 col-sm-12">
                                                <div className="form-group" >
                                                    <label htmlFor="campaign" className="control-label">Campaign Name</label>
                                                    <ReactSelect
                                                        // closeMenuOnSelect={false}
                                                        placeholder={<div>ALL</div>}
                                                        options={campaigns ?? []}
                                                        getOptionLabel={option => `${option.label}`}
                                                        onChange={(e) => { handleMultiInputChange('campaign', e,'Campaign Name') }}
                                                        value={searchInputs?.campaign}
                                                        // isMulti
                                                        // isClearable
                                                        name="campaign"
                                                    />
                                                </div>
                                            </div>


                                            <div className="col-lg-3 col-md-4 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="queue" className="control-label">Queue Name</label>
                                                    <ReactSelect
                                                        // closeMenuOnSelect={false}
                                                        placeholder={<div>ALL</div>}
                                                        options={queues ?? []}
                                                        getOptionLabel={option => `${option.label}`}
                                                        onChange={(e) => { handleMultiInputChange('queue', e,'Queue Name') }}
                                                        value={searchInputs?.queue}
                                                        // isMulti
                                                        // isClearable
                                                        name="queue"
                                                    />
                                                </div>
                                            </div>

                                            <div className="col-lg-3 col-md-4 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="Date From" className="control-label">From Date</label>
                                                    <input type="date" value={searchInputs.dateFrom} onChange={handleInputChange} className="form-control" id="dateFrom" data-name="From Date"  min={moment(dateVariable).format('YYYY-MM-DD')}/>
                                                    <span className="errormsg">{error.dateFrom ? error.dateFrom : ""}</span>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="To From" className="control-label">To Date</label>
                                                    <input type="date" value={searchInputs.dateTo} onChange={handleInputChange} className="form-control" id="dateTo" data-name="To Date"  min={moment(dateVariable).format('YYYY-MM-DD')}/>
                                                    <span className="errormsg">{error.dateTo ? error.dateTo : ""}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                            <button type="button" className="skel-btn-cancel" onClick={hanleOnClear}>Clear</button>
                                            <button type="submit" className="skel-btn-submit">Search</button>
                                        </div>
                                    </form>
                                )
                            }
                        </div>
                        {
                            searchData && searchData.length > 0 && <>
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <div style={{}}>
                                            <DynamicTable
                                                listSearch={listSearch}
                                                SearchCriteria={SearchCriteria}
                                                listKey={"Abandoned Call Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={AbandonedColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                report={true}
                                                reportName={"Abandoned Call Report"}
                                                url={`${properties.REPORTS_API}/get-report/abandoned-call?limit=${perPage}&page=${currentPage}&uuid=${uid}`}
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

    );
}

export default AbandonedCallRport;