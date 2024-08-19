import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import moment from 'moment';
import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { formatISODateDDMMMYY } from "../../common/util/dateUtil";
import { post, get } from '../../common/util/restUtil';
import { FollowupColumns, FollowupFrequencyColumns } from './followupColumns';
import FollowupInteractionDtl from './FollowupInteractionDtl';
import { AppContext } from '../../AppContext';
import ReactSelect from 'react-select';
import { object, string } from "yup";
import { isEmpty } from 'lodash';
const FollowupReport = (props) => {
    const { appConfig, auth } = useContext(AppContext)
    const initialValues = {
        project: "",
        // interactionType: "",
        ouCode: [],
        deptCode: appConfig?.clientConfig?.report?.isDepartmentFilter ? [{ label: auth?.currDeptDesc, value: auth?.currDept }] : [],
        dateFrom: moment().startOf('month').format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),

    }, SearchCretiriaInitialValue = {
        'From Date': moment().startOf("month").format("YYYY-MM-DD"),
        'To Date': moment().format("YYYY-MM-DD"),
    };
    const [searchInputs, setSearchInputs] = useState(initialValues)
    const [SearchCriteria, setSearchCriteria] = useState(SearchCretiriaInitialValue);
    const [displayForm, setDisplayForm] = useState(true)
    const [listSearch, setListSearch] = useState({ excel: true })
    const [searchData, setSearchData] = useState([])

    const isFirstRender = useRef(true)
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10)
    const [currentPage, setCurrentPage] = useState(0)
    const [filters, setFilters] = useState([])
    const [exportBtn, setExportBtn] = useState(true)
    const isTableFirstRender = useRef(true)
    const hasExternalSearch = useRef(false);
    const departmentRef = useRef()
    const organisationRef = useRef()
    const [uid, setUid] = useState()
    const [error, setError] = useState({})
    const [ouLookup, setOuLookup] = useState([])
    // const [interactionTypeLookup, setInteractionTypeLookup] = useState([])
    const [departmentLookup, setDepartmentLookup] = useState([])
    const [getInteractionDetails, setGetInteractionDetails] = useState(initialValues)

    const [detailsData, setDetailsData] = useState([])
    const [detailsUid, setDetailsUid] = useState()
    const [detailstotalCount, setDetailsTotalCount] = useState(0)
    const [detailsPerPage, setDetailsPerPage] = useState(10)
    const [detailsCurrentPage, setDetailsCurrentPage] = useState(0)
    const [detailsFilters, setDetailsFilters] = useState([])
    const [detailsExportBtn, setDetailsexportBtn] = useState(true)
    const validationSchema = object().shape({
        dateFrom: string().required("From date is required."),
        dateTo: string().required("From date is required.")
    })
    const dateVariable = '1940-01-01';
    useEffect(() => {
        get(`${properties.ORGANIZATION}/search`)
            .then((resp) => {
                if (resp && resp.data && resp.data.length > 0) {
                    const orgs = resp?.data?.filter(e => e.unitType === 'OU')
                    const departments = resp?.data?.filter(e => e.unitType === 'DEPT')

                    unstable_batchedUpdates(() => {
                        const formatedData = orgs?.map((e) => ({ label: e.unitDesc, value: e.unitId }))
                        const formatedDept = departments?.map((e) => ({ label: e.unitDesc, value: e.unitId, unitType: e?.unitType, parentUnit: e?.parentUnit }))
                        setOuLookup(formatedData)
                        organisationRef.current = formatedData
                        departmentRef.current = formatedDept
                    })
                }
            }).catch(error => console.error(error))
            .finally()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appConfig?.clientConfig?.report?.isOuFilter, auth?.currDeptId])

    // useEffect(() => {
    //     try {
    //         get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=INTXN_TYPE')
    //             .then((response) => {
    //                 if (response.data) {
    //                     let lookupData = response.data;
    //                     unstable_batchedUpdates(() => {
    //                         setInteractionTypeLookup(lookupData['INTXN_TYPE']);
    //                     })

    //                 }
    //             }).catch(error => console.log(error))
    //     } catch (e) {
    //         console.log('error', e)
    //     }


    // }, [auth.currDeptId])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const handleDetailsPageSelect = (pageNo) => {
        setDetailsCurrentPage(pageNo)
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
        if (cell.column.Header === "Created On") {
            return (
                <span>{cell.value ? formatISODateDDMMMYY(cell.value) : '-'}</span>
            )
        }
        else if (cell.column.Header === "Followup Frequency") {
            return (
                <span className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => handleOnEdit(row)}>{cell.value}</span>
            )
        }
        else
            return (<span>{cell.value}</span>)
    }

    const handleOnEdit = (row) => {
        setGetInteractionDetails(
            {
                ...getInteractionDetails,
                frequency: row.original.follow_up_frequency
            }
        )
    }

    const getFollowUpReport = useCallback((uid) => {
        if (uid) {
            setListSearch({ uid })
            get(`${properties.REPORTS_API}/get-report/followup?limit=${perPage}&page=${currentPage}&uuid=${uid}`)
                .then((response) => {
                    if (response?.status === 200 && Array.isArray(response?.data?.rows) && response?.data?.rows.length > 0) {
                        const { count, rows } = response?.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(rows);
                        })
                    } else {
                        unstable_batchedUpdates(() => {
                            setTotalCount(0)
                            setSearchData([]);
                        })
                        toast.error('Record Not Found')
                    }

                }).catch(error => console.error(error))
        }
    }, [appConfig.biTenantId, auth?.accessToken, currentPage, perPage])

    const getFollowUpFrequencyReport = useCallback((uid) => {
        if (uid) {
            setListSearch({ uid })
            get(`${properties.REPORTS_API}/get-report/followup-frequency?limit=${detailsPerPage}&page=${detailsCurrentPage}&uuid=${uid}`)
                .then((response) => {
                    if (response?.status === 200 && Array.isArray(response?.data?.rows) && response?.data?.rows.length > 0) {
                        const { count, rows } = response?.data;
                        unstable_batchedUpdates(() => {
                            setDetailsTotalCount(count)
                            setDetailsData(rows);
                        })
                    } else {
                        unstable_batchedUpdates(() => {
                            setDetailsTotalCount(0)
                            setDetailsData([]);
                        })
                        toast.error('Record Not Found')
                    }

                }).catch(error => console.error(error))
        }
    }, [appConfig.biTenantId, auth?.accessToken, detailsCurrentPage, detailsPerPage, detailsUid])


    const getReportDetails = useCallback(() => {
        const error = validate(validationSchema, searchInputs);
        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false;
        }
        let tempsearchInputs = Object.fromEntries(
            Object.entries(searchInputs).filter(([_, value]) => value !== undefined && value !== null && value !== "" && value.length !== 0)
        );
        const requestBody = {
            searchParams: {
                ...tempsearchInputs,
            },
        }
        setListSearch(requestBody);
        post(`${properties.REPORTS_API}/followup`, { ...requestBody }).then((resp) => {
            const response = resp?.data
            if (response?.uid) {
                unstable_batchedUpdates(() => {
                    setUid(response?.uid)
                })
            } else {
                unstable_batchedUpdates(() => {
                    setSearchData([])
                    setFilters([]);
                })
                toast.error("Records Not Found")
            }
        }).catch(error => console.error(error))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.accessToken, filters, searchInputs])
    const getFollowUpFrequency = useCallback(() => {
        const error = validate(validationSchema, searchInputs);
        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false;
        }
        let tempsearchInputs = Object.fromEntries(
            Object.entries(searchInputs).filter(([_, value]) => value !== undefined && value !== null && value !== "" && value.length !== 0)
        );
        const requestBody = {
            searchParams: {
                ...tempsearchInputs,
            },
        }
        setListSearch(requestBody);
        post(`${properties.REPORTS_API}/followup/frequency`, { ...requestBody }).then((resp) => {
            const response = resp?.data
            if (response?.uid) {
                unstable_batchedUpdates(() => {
                    setDetailsUid(response?.uid)
                })
            } else {
                unstable_batchedUpdates(() => {
                    setSearchData([])
                    setFilters([]);
                })
                toast.error("Records Not Found")
            }
        }).catch(error => console.error(error))
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
            getFollowUpReport(uid);
        }
        else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, uid])
    useEffect(() => {
        if (!isFirstRender.current) {
            getFollowUpFrequencyReport(detailsUid);
        }
        else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, detailsUid])


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
            getFollowUpFrequency()
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
            setDetailsData([]);
            setDetailsCurrentPage(0)
            setDetailsPerPage(10)
            setDetailsTotalCount(0)
            setDetailsUid()
            isTableFirstRender.current = true
            hasExternalSearch.current = false
        })
    }
    const handleMultiInputChange = (id, props, name) => {
        if (id === "ouCode") {
            const selectedOuValue = props?.map((e) => e?.value)
            let dept = departmentRef?.current
            if (selectedOuValue && !isEmpty(selectedOuValue)) {
                dept = departmentRef?.current.filter((d) => {
                    let isTrue = false
                    if (d.unitType === "DEPT" && selectedOuValue.includes(d.parentUnit)) {
                        return isTrue = true
                    }
                    return isTrue
                })
            }

            unstable_batchedUpdates(() => {
                setDepartmentLookup(dept)
                setSearchInputs({
                    ...searchInputs,
                    [id]: props
                })
                setSearchCriteria({ ...SearchCriteria, [name]: props });
            })
        } else {
            unstable_batchedUpdates(() => {
                setSearchInputs({
                    ...searchInputs,
                    [id]: props
                })
                setSearchCriteria({ ...SearchCriteria, [name]: props });
            })
        }
    }

    return (

        <div className="pt-1">
            <div className="cmmn-skeleton mt-2">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">FollowUp Report</h4></div>
                            </div>
                        </section>
                    </div>
                </div>
                <div id="searchBlock" className="modal-body p-2 d-block">
                    <div className="d-flex justify-content-end">
                        <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
                    </div>
                    {
                        displayForm && (
                            <form onSubmit={handleSubmit}>

                                <div className="row">

                                    {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('ouCode') &&
                                        <div className="col-lg-3 col-md-4 col-sm-12">
                                            <div className="form-group" disabled={appConfig?.clientConfig?.report?.isOuFilter}>
                                                <label htmlFor="ouCode" className="control-label">OU</label>
                                                <ReactSelect
                                                    closeMenuOnSelect={false}
                                                    // isDisabled={appConfig?.clientConfig?.report?.isOuFilter}
                                                    placeholder={<div>ALL</div>}
                                                    options={ouLookup ?? []}
                                                    getOptionLabel={option => `${option.label}`}
                                                    onChange={(e) => { handleMultiInputChange('ouCode', e, 'OU') }}
                                                    value={searchInputs?.ouCode}
                                                    isMulti
                                                    isClearable
                                                    name="OU"
                                                />
                                            </div>
                                        </div>
                                    }


                                    <div className="col-lg-3 col-md-4 col-sm-12">
                                        <div className="form-group">
                                            <label htmlFor="deptCode" className="control-label">Department</label>
                                            <ReactSelect
                                                closeMenuOnSelect={false}
                                                placeholder={<div>ALL</div>}
                                                isDisabled={appConfig?.clientConfig?.report?.isDepartmentFilter}
                                                options={departmentLookup ?? []}
                                                getOptionLabel={option => `${option.label}`}
                                                onChange={(e) => { handleMultiInputChange('deptCode', e, 'Department') }}
                                                value={searchInputs?.deptCode}
                                                isMulti
                                                isClearable
                                                name="deptCode"
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
                                            <input type="date" value={searchInputs.dateTo} onChange={handleInputChange} className="form-control" id="dateTo" data-name="To Date" min={moment(dateVariable).format('YYYY-MM-DD')}/>
                                            <span className="errormsg">{error.dateTo ? error.dateTo : ""}</span>
                                        </div>
                                    </div>
                                    {/* <div className="col-lg-3 col-md-4 col-sm-12">
                                        <div className="form-group">
                                            <label htmlFor="interactionType" className="control-label">Interaction Type</label>
                                            <select className="form-control" id="interactionType" value={searchInputs.interactionType} onChange={handleInputChange}>
                                                <option value="">Select Interaction Type</option>
                                                {
                                                    interactionTypeLookup && interactionTypeLookup.map((e) => (
                                                        <option key={e.code} value={e.code}>{e.description}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div> */}

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
                    !!detailsData.length &&
                    <div className="row mt-2">
                        <div className="col-lg-12">
                            {
                                !!detailsData.length &&
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <h4 className="title bold" style={{ textAlign: 'center' }}>FollowUp Frequency</h4>
                                        <div style={{}}>
                                            <DynamicTable
                                                listSearch={listSearch}
                                                SearchCriteria={SearchCriteria}
                                                listKey={"Follow-Up Frequency Report"}
                                                row={detailsData}
                                                rowCount={detailstotalCount}
                                                header={FollowupFrequencyColumns}
                                                itemsPerPage={detailsPerPage}
                                                backendPaging={true}
                                                report={true}
                                                backendCurrentPage={detailsCurrentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={detailsExportBtn}
                                                reportName={"Follow-Up Frequency Report"}
                                                url={`${properties.REPORTS_API}/get-report/followup-frequency?limit=${detailsPerPage}&page=${detailsCurrentPage}&uuid=${detailsUid}`}
                                                method={'GET'}
                                                handler={{
                                                    handleCellRender: handleCellRender,
                                                    handlePageSelect: handleDetailsPageSelect,
                                                    handleItemPerPage: setDetailsPerPage,
                                                    handleCurrentPage: setDetailsCurrentPage,
                                                    handleFilters: setFilters,
                                                    handleExportButton: setDetailsexportBtn
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                }
                {
                    !!searchData.length &&
                    <div className="row mt-2">
                        <div className="col-lg-12">
                            {
                                !!searchData.length &&
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <h4 className="title bold" style={{ textAlign: 'center' }}>FollowUp Interaction</h4>
                                        <div style={{}}>
                                            <DynamicTable
                                                listSearch={listSearch}
                                                SearchCriteria={SearchCriteria}
                                                listKey={"FollowUp Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={FollowupColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                reportName={"Follow-Up Report"}
                                                report={true}
                                                url={`${properties.REPORTS_API}/get-report/followup?limit=${perPage}&page=${currentPage}&uuid=${uid}`}
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
                            }
                        </div>
                    </div>
                }
                {/* {
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
                                                    listKey={"FollowUp Report"}
                                                    row={searchData}
                                                    rowCount={totalCount}
                                                    header={FollowupColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    url={properties.REPORTS_API + '/get-report/followup'}
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
                                        {getInteractionDetails.frequency !== "" && getInteractionDetails.frequency !== undefined && <>
                                            <div className="form-row m-2">
                                                <div className="col-12 pl-2 bg-light border">
                                                    <h5 className="text-primary">Interaction Details</h5>
                                                </div>
                                            </div>
                                            <FollowupInteractionDtl
                                                data={{
                                                    getInteractionDetails
                                                }}
                                            ></FollowupInteractionDtl>
                                        </>}
                                    </div>
                                    :
                                    <span ></span>
                            }
                        </div>
                    </div>
                } */}
            </div>
        </div>
    )
}

export default FollowupReport;