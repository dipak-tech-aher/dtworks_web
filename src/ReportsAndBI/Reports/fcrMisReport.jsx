/* eslint-disable react-hooks/exhaustive-deps */
import { isEmpty } from 'lodash';
import moment from 'moment';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import ReactSelect from 'react-select';
import { toast } from 'react-toastify';
import { object, string } from "yup";
import { AppContext } from '../../AppContext';
import DynamicTable from '../../common/table/DynamicTable';
import { get, post } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { FCRMISColumns, FCRMISHiddenColumns } from "./fcrMisColumns";

const FCRMISReport = () => {

    const { appConfig, auth } = useContext(AppContext)
    const initialValues = {
        project: "",
        interactionType: "",
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
    const hasExternalSearch = useRef(false)

    const [interactionTypeLookup, setInteractionTypeLookup] = useState([])

    const [uid, setUid] = useState()
    const [departmentLookup, setDepartmentLookup] = useState([])
    const departmentRef = useRef()
    const organisationRef = useRef()
    const [ouLookup, setOuLookup] = useState([])
    const [error, setError] = useState({})
    const [isSuperRole, setIsSuperRole] = useState(false)

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
    }, [appConfig?.clientConfig?.report?.isOuFilter, auth?.currDeptId, isSuperRole])

    useEffect(() => {
        try {
            get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=INTXN_TYPE')
                .then((response) => {
                    if (response.data) {
                        let lookupData = response.data;
                        unstable_batchedUpdates(() => {
                            setInteractionTypeLookup(lookupData['INTXN_TYPE']);
                        })

                    }
                }).catch(error => console.log(error))
        } catch (e) {
            console.log('error', e)
        }


    }, [auth.currDeptId])

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
        }else
            return (<span className='text-center'>{cell.value ?? '-'}</span>)
    }

    const getFcrMisReport = useCallback((uid) => {
        if (uid) {
            setListSearch({ uid })
            get(`${properties.REPORTS_API}/get-report/fcr-mis?limit=${perPage}&page=${currentPage}&uuid=${uid}`)
                .then((response) => {
                    if (response?.status === 200 && Array.isArray(response?.data?.rows) && response?.data?.rows.length > 0) {
                        const { count, rows } = response?.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(rows);
                        })
                    } else {
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
        post(`${properties.REPORTS_API}/fcr/mis`, { ...requestBody }).then((response) => {
            if (response?.status === 200 && response?.data?.uid) {
                unstable_batchedUpdates(() => {
                    setUid(response?.data?.uid)
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
            getFcrMisReport(uid);
        }
        else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, uid])

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
            setDepartmentLookup(departmentRef.current);
            setCurrentPage(0)
            setPerPage(10)
            setTotalCount(0)
            setError({})
            setUid()
            isTableFirstRender.current = true
            hasExternalSearch.current = false
        })
    }

    const getRoleDetails = useCallback((id) => {
        if (id) {
            get(`${properties.ROLE_API}/search/${id}`)
                .then((resp) => {
                    if (resp?.data && resp?.data?.length > 0) {
                        const filterSuperRole = resp?.data?.filter((e) => e.roleId === id && e.isSuperRole) || []
                        unstable_batchedUpdates(() => {
                            filterSuperRole && filterSuperRole?.length > 0 ? setIsSuperRole(true) : setIsSuperRole(false)
                        })
                    }
                })
        }
    }, [])

    useEffect(() => {
        getRoleDetails(auth?.currRoleId)
    }, [auth?.currRoleId, getRoleDetails])

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">FCR MIS Report</h4></div>
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
                                                <div className="form-group" disabled={appConfig?.clientConfig?.report?.isOuFilter}>
                                                    <label htmlFor="ouCode" className="control-label">OU</label>
                                                    <ReactSelect
                                                        closeMenuOnSelect={false}
                                                        // isDisabled={appConfig?.clientConfig?.report?.isOuFilter}
                                                        placeholder={<div>ALL</div>}
                                                        options={ouLookup ?? []}
                                                        getOptionLabel={option => `${option.label}`}
                                                        onChange={(e) => { handleMultiInputChange('ouCode', e,'OU') }}
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
                                                        onChange={(e) => { handleMultiInputChange('deptCode', e,'Department') }}
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

                                            <div className="col-lg-3 col-md-4 col-sm-12">
                                                <div className="form-group">
                                                    <label htmlFor="interactionType" className="control-label">Interaction Type</label>
                                                    <select className="form-control" id="interactionType" value={searchInputs.interactionType} onChange={handleInputChange} data-name="Interaction Type">
                                                        <option value="">Select Interaction Type</option>
                                                        {
                                                            interactionTypeLookup && interactionTypeLookup.map((e) => (
                                                                <option key={e.code} value={e.code}>{e.description}</option>
                                                            ))
                                                        }
                                                    </select>
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
                                                listKey={"FCR MIS Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={FCRMISColumns}
                                                hiddenColumns={FCRMISHiddenColumns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                report={true}
                                                reportName={"FCR MIS Report"}
                                                url={`${properties.REPORTS_API}/get-report/fcr-mis?limit=${perPage}&page=${currentPage}&uuid=${uid}`}
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

export default FCRMISReport;