import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';

import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { formatISODateDDMMMYY } from "../../common/util/dateUtil";
import { get, post } from '../../common/util/restUtil';
import { FollowupCountColumns } from './followupCountColumns';
import { AppContext } from '../../AppContext';
import ReactSelect from 'react-select';
import { object, string } from "yup";
import { isEmpty } from 'lodash';
import moment from 'moment';

const validationSchema = object().shape({
    dateFrom: string().required("From date is required."),
    dateTo: string().required("From date is required.")
})
const FollowupCountReport = () => {
    const { appConfig, auth } = useContext(AppContext)
    const initialValues = {
        project: "",
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
                        setDepartmentLookup(formatedDept)
                    })
                }
            }).catch(error => console.error(error))
            .finally()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appConfig?.clientConfig?.report?.isOuFilter, auth?.currDeptId])

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
        if (cell.column.Header === "Created On") {
            return (
                <span>{cell.value ? formatISODateDDMMMYY(cell.value) : '-'}</span>
            )
        }
        else
            return (<span>{cell.value}</span>)
    }

    const getFollowUpCountReport = useCallback((uid) => {
        if (uid) {
            setListSearch({ uid })
            get(`${properties.REPORTS_API}/get-report/followup-count?limit=${perPage}&page=${currentPage}&uuid=${uid}`)
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
        post(`${properties.REPORTS_API}/followup/count`, { ...requestBody }).then((resp) => {
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
            getFollowUpCountReport(uid);
        }
        else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, uid])


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
    const handleMultiInputChange = (id, props,name) => {
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
                                <div className="col-12"><h4 className="pl-3">FollowUp Count Report</h4></div>
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
                                            <div className="row">


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
                                                        <input type="date" value={searchInputs.dateFrom} onChange={handleInputChange} className="form-control" id="dateFrom" data-name="From Date" min={moment(dateVariable).format('YYYY-MM-DD')}/>
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
                                                    SearchCriteria={SearchCriteria}
                                                    listKey={"FollowUp Count Report"}
                                                    row={searchData}
                                                    rowCount={totalCount}
                                                    header={FollowupCountColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={true}
                                                    report={true}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    url={`${properties.REPORTS_API}/get-report/followup-count?limit=${perPage}&page=${currentPage}&uuid=${uid}`}
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
                                    :
                                    <span className=""></span>
                            }
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}

export default FollowupCountReport;