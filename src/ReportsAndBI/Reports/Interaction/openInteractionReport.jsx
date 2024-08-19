/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import { isEmpty } from "lodash";
import moment from "moment";
import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import { object, string } from "yup";
import { AppContext } from "../../../AppContext";
import { hideSpinner, showSpinner } from "../../../common/spinner";
import DynamicTable from "../../../common/table/DynamicTable";
import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import { openInteractionColumns as openInteractionColumnsProp } from "./Columns/openInteractionColumns";
import { getConfig, getPermissions, removeDuplicatesFromArrayObject } from "../../../common/util/util"
import { startCase } from 'lodash'
import { metaConfig } from "../../../AppConstants";

const OpenInteractionReport = (props) => {
    const { appConfig, auth, systemConfig } = useContext(AppContext);
    const initialValues = {
        project: "",
        interactionType: "",
        interactionStatus: "",
        ouCode: [],
        deptCode: appConfig?.clientConfig?.report?.isDepartmentFilter
            ? [{ label: auth?.currDeptDesc, value: auth?.currDept }]
            : [],
        dateFrom: moment().startOf("month").format("YYYY-MM-DD"),
        dateTo: moment().format("YYYY-MM-DD"),
        status: "",
        reference_number: "",
        reference_name: "",
        problemCode: "",
        intxn_statement: "",
    }, SearchCretiriaInitialValue = {
        'From Date': moment().startOf("month").format("YYYY-MM-DD"),
        'To Date': moment().format("YYYY-MM-DD"),
    };
    const [searchInputs, setSearchInputs] = useState(initialValues);
    const [SearchCriteria, setSearchCriteria] = useState(SearchCretiriaInitialValue);
    const [displayForm, setDisplayForm] = useState(true);
    const [listSearch, setListSearch] = useState({ excel: true });
    const [searchData, setSearchData] = useState([]);

    const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(true);

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);

    const [interactionTypeLookup, setInteractionTypeLookup] = useState([]);
    const [statusLookup, setStatusLookup] = useState([]);
    const [intxtStatmentLookup, setIntxtStatmentLookup] = useState([]);

    const [CustomerSearchColumns, setCustomerSearchColumns] = useState([]);
    const [uid, setUid] = useState();
    const [departmentLookup, setDepartmentLookup] = useState([]);
    const departmentRef = useRef();
    const organisationRef = useRef();
    const [ouLookup, setOuLookup] = useState([]);
    const [error, setError] = useState({});
    const [isSuperRole, setIsSuperRole] = useState(false);
    const [problemCodeLookUp, setproblemCodeLookUp] = useState([]);
    const validationSchema = object().shape({
        dateFrom: string().required("From date is required."),
        dateTo: string().required("From date is required."),
    })

    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [reportColumns, setReportColumns] = useState([])
    const [componentName, setComponentName] = useState({})
    const [extraReportColumns, setExtraReportColumns] = useState([])
    const [departmentEnable, setDepartmentEnable] = useState(false);
    const [consumerFromIsEnabled,setConsumerFromIsEnabled] = useState("")
    const dateVariable = '1940-01-01'

    const API_ENDPOINT =
        properties.API_ENDPOINT +
        (process.env.NODE_ENV === "development" ? "" : properties.REACT_APP_BASE);

    useEffect(() => {
        const fetchConfigData = async () => {
            try {
                const consumer_from_config = await getConfig(systemConfig,metaConfig.CONSUMER_FROM_ATTRIBUTE_ENABLED);
                setConsumerFromIsEnabled(consumer_from_config?.configValue);
            } catch (error) {
                console.error('Error fetching specific system config:', error);
            }
        };
        fetchConfigData();
    }, [])

    useEffect(() => {
        try {
            get(`${properties.ORGANIZATION}/search`)
                .then((resp) => {
                    if (resp && resp.data && resp.data.length > 0) {
                        const orgs = resp?.data?.filter((e) => e.unitType === "OU");
                        const departments = resp?.data?.filter((e) => e.unitType === "DEPT");
                        unstable_batchedUpdates(() => {
                            const formatedData = orgs?.map((e) => ({
                                label: e.unitDesc,
                                value: e.unitId,
                            }));
                            const formatedDept = departments?.map((e) => ({
                                label: e.unitDesc,
                                value: e.unitId,
                                unitType: e?.unitType,
                                parentUnit: e?.parentUnit,
                            }));
                            setOuLookup(formatedData);
                            organisationRef.current = formatedData;
                            departmentRef.current = formatedDept;
                            if (appConfig?.clientConfig?.report?.isOuFilter && !isSuperRole) {
                                const currentDetpartment = formatedDept?.filter(
                                    (f) => f?.value === auth?.currDeptId
                                );
                                if (
                                    currentDetpartment &&
                                    Array.isArray(currentDetpartment) &&
                                    currentDetpartment?.length === 1
                                ) {
                                    const currentOU =
                                        formatedData?.filter(
                                            (f) => f?.value === currentDetpartment?.[0]?.parentUnit
                                        ) || [];
                                    const currentDeptLookup =
                                        formatedDept?.filter(
                                            (f) => f?.parentUnit === currentDetpartment?.[0]?.parentUnit
                                        ) || [];
                                    setSearchInputs({ ...searchInputs });
                                    setDepartmentLookup(formatedDept);
                                }
                            } else {
                                setDepartmentLookup(formatedDept);
                            }
                        });
                    }
                })
                .catch((error) => console.error(error))
                .finally();
            // Get Interaction Statement List
            get(`${properties.KNOWLEDGE_API}/get-smartassistance-list`).then((response) => {
                if (response && response.data && response.data.length > 0) {
                    setIntxtStatmentLookup(response.data)
                }
            }).catch((err) => console.log('error', err)).finally();
        } catch (e) {
            console.log('error', e)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        appConfig?.clientConfig?.report?.isOuFilter,
        auth?.currDeptId,
        isSuperRole,
    ]);
    useEffect(() => {
        setCustomerSearchColumns(
            openInteractionColumnsProp?.map((x) => {
                //if (["customerNo", "customerName", "customerServiceStatus"].includes(x.id)) {
                if (
                    appConfig &&
                    appConfig.clientFacingName &&
                    appConfig.clientFacingName["Customer".toLowerCase()]
                ) {
                    x.Header = x.Header?.replace(
                        "Customer",
                        appConfig?.clientFacingName["Customer".toLowerCase()] || "Customer"
                    );
                }
                //  }
                return x;
            })
        );
    }, [appConfig]);

    useEffect(() => {
        try {
            get(
                properties.BUSINESS_ENTITY_API +
                "?searchParam=code_type&valueParam=INTXN_TYPE,INTERACTION_STATUS,CUSTOMER_CATEGORY,PROBLEM_CODE"
            )
                .then((response) => {
                    if (response.data) {
                        let lookupData = response.data;
                        // let ProjectFilterData = lookupData['PROJECT'] && lookupData['PROJECT'].length > 0 && lookupData['PROJECT'].filter((val) => val?.mapping && val?.mapping?.department?.length > 0 && val?.mapping?.department.includes(auth.currDeptId));
                        unstable_batchedUpdates(() => {
                            setInteractionTypeLookup(lookupData["INTXN_TYPE"]);
                            setproblemCodeLookUp(lookupData["PROBLEM_CODE"]);
                            setStatusLookup(lookupData["INTERACTION_STATUS"]);
                        });
                    }
                })
                .catch((error) => console.log(error));
        } catch (e) {
            console.log("error", e);
        }
    }, [auth.currDeptId]);

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo);
    };

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

    };

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     isTableFirstRender.current = true;
    //     unstable_batchedUpdates(() => {
    //         setFilters([])
    //         setCurrentPage((currentPage) => {
    //             if (currentPage === 0) {
    //                 return '0'
    //             }
    //             return 0
    //         });
    //     })
    // }

    const handleCellRender = (cell, row) => {
        if (cell.column.type === "date") {
            return (
                <span>
                    {cell.value
                        ? moment(cell.value).format(cell.column?.format ?? "DD-MM-YYYY")
                        : "-"}
                </span>
            );
        } else if (cell.column.type === "time") {
            return (
                <span>
                    {cell.value
                        ? moment(cell.value).format(cell.column?.format ?? "hh:mm:ss")
                        : "-"}
                </span>
            );
        } else return <span>{cell.value}</span>;
    };

    const getInteraction = useCallback(
        (uid) => {
            if (uid) {
                setListSearch({ uid });
                showSpinner();

                axios
                    .get(
                        `${API_ENDPOINT}${properties.REPORTS_API}/get-report/open-interaction?limit=${perPage}&page=${currentPage}&uuid=${uid}`,
                        {
                            headers: {
                                "x-tenant-id":
                                    process.env.NODE_ENV === "development"
                                        ? properties.REACT_APP_TENANT_ID
                                        : undefined,
                                "x-report-tenant-id":
                                    process.env.NODE_ENV === "development"
                                        ? appConfig.biTenantId
                                        : undefined,
                                Authorization: auth?.accessToken,
                            },
                        }
                    )
                    .then((resp) => {
                        const response = resp?.data;
                        if (
                            response?.status === 200 &&
                            Array.isArray(response?.data?.rows) &&
                            response?.data?.rows.length > 0
                        ) {
                            const { count, rows } = response?.data;
                            unstable_batchedUpdates(() => {
                                setTotalCount(count);
                                setSearchData(rows);
                            });
                        } else {
                            unstable_batchedUpdates(() => {
                                setTotalCount(0);
                                setSearchData([]);
                            });
                            toast.error("Record Not Found");
                        }
                    })
                    .catch((error) => console.error(error))
                    .finally(() => {
                        hideSpinner();
                        isTableFirstRender.current = false;
                    });
            }
        },
        [appConfig.biTenantId, auth?.accessToken, currentPage, perPage]
    );

    const getReportDetails = useCallback(() => {
        const error = validate(validationSchema, searchInputs);
        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false;
        }
        let tempsearchInputs = Object.fromEntries(
            Object.entries(searchInputs).filter(
                ([_, value]) =>
                    value !== undefined &&
                    value !== null &&
                    value !== "" &&
                    value.length !== 0
            )
        );
        // delete tempsearchInputs.ouCode
        const requestBody = {
            searchParams: {
                ...tempsearchInputs,
            },
        };
        setListSearch(requestBody);
        showSpinner();
        axios
            .post(
                `${API_ENDPOINT}${properties.REPORTS_API}/interaction/open`,
                { ...requestBody },
                {
                    headers: {
                        "x-tenant-id":
                            process.env.NODE_ENV === "development"
                                ? properties.REACT_APP_TENANT_ID
                                : undefined,
                        "x-report-tenant-id":
                            process.env.NODE_ENV === "development"
                                ? appConfig.biTenantId
                                : undefined,
                        Authorization: auth?.accessToken,
                    },
                }
            )
            .then((resp) => {
                const response = resp?.data;
                if (response?.status === 200 && response?.data?.uid) {
                    unstable_batchedUpdates(() => {
                        setUid(response?.data?.uid);
                        //    getInteraction(response?.data?.uid)
                    });
                } else {
                    unstable_batchedUpdates(() => {
                        setSearchData([]);
                        setFilters([]);
                    });
                    toast.error("Records Not Found");
                }
            })
            .catch((error) => console.error(error))
            .finally(() => {
                hideSpinner();
                isTableFirstRender.current = false;
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auth?.accessToken, filters, searchInputs]);

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
            console.log(uid);
            getInteraction(uid);
        } else {
            isFirstRender.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, perPage, uid]);

    const handleMultiInputChange = (id, props, name) => {
        if (id === "ouCode") {
            const selectedOuValue = props?.map((e) => e?.value);
            let dept = departmentRef?.current;
            if (selectedOuValue && !isEmpty(selectedOuValue)) {
                dept = departmentRef?.current.filter((d) => {
                    let isTrue = false;
                    if (d.unitType === "DEPT" && selectedOuValue.includes(d.parentUnit)) {
                        return (isTrue = true);
                    }
                    return isTrue;
                });
            }

            unstable_batchedUpdates(() => {
                setDepartmentLookup(dept);
                setSearchInputs({
                    ...searchInputs,
                    [id]: props,
                });
                setSearchCriteria({ ...SearchCriteria, [name]: props });
            });
        } else {
            unstable_batchedUpdates(() => {
                setSearchInputs({
                    ...searchInputs,
                    [id]: props,
                });
                setSearchCriteria({ ...SearchCriteria, [name]: props });
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        isTableFirstRender.current = true;
        unstable_batchedUpdates(() => {
            setUid();
            setCurrentPage(0);
            setPerPage(10);
            setTotalCount(0);
            setFilters([]);
            getReportDetails();
        });
    };

    const hanleOnClear = () => {
        unstable_batchedUpdates(() => {
            //   if (appConfig?.clientConfig?.report?.isOuFilter) {
            //     initialValues.ouCode = searchInputs.ouCode;
            //   }
            setSearchInputs(initialValues);
            setSearchCriteria(SearchCretiriaInitialValue);
            setSearchData([]);
            setDepartmentLookup(departmentRef.current);
            setCurrentPage(0);
            setPerPage(10);
            setTotalCount(0);
            setError({});
            setUid();
            isTableFirstRender.current = true;
            hasExternalSearch.current = false;
        });
    };

    const getRoleDetails = useCallback((id) => {
        if (id) {
            get(`${properties.ROLE_API}/search/${id}`).then((resp) => {
                if (resp?.data && resp?.data?.length > 0) {
                    const filterSuperRole =
                        resp?.data?.filter((e) => e.roleId === id && e.isSuperRole) || [];
                    unstable_batchedUpdates(() => {
                        filterSuperRole && filterSuperRole?.length > 0
                            ? setIsSuperRole(true)
                            : setIsSuperRole(false);
                    });
                }
            });
        }
    }, []);

    useEffect(() => {
        getRoleDetails(auth?.currRoleId);
    }, [auth?.currRoleId, getRoleDetails]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('OPEN_INTXN_RPT');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };
        const getMetaConfig = async () => {
            try {
                const response = await getConfig(systemConfig, metaConfig.PROFILE_DEPARTMENT_ATTRIBUTE_ENABLED);
                setDepartmentEnable(response?.configValue);
            } catch (error) {
                console.error('Error fetching specific system config:', error);
            }
        };
        
        fetchData(); getMetaConfig();
    }, []);

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                let componentName = {}
                permission?.components?.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                    componentName[component.componentCode] = component.componentName
                })
                unstable_batchedUpdates(() => {
                    setComponentPermission(componentPermissions)
                    setComponentName(componentName)
                })
            }
        }
    }, [permission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const ExtraReportColumn = [{
        Header: "Registered No",
        accessor: "registeredNo",
        disableFilters: true,
        permission: 'REGISTRATION_NO'
    }, {
        Header: "Id Value",
        accessor: "idValue",
        disableFilters: true,
        permission: 'ID_VALUE'
    }]
    const profileColumns = [
        {
            Header: "Profile Department",
            accessor: "profileDepartment",
            disableFilters: true,
        }
    ]
    useEffect(() => {
        const finalColumns = []
        if (componentPermission) {
            ExtraReportColumn && ExtraReportColumn?.forEach((ele) => {
                if (ele?.permission && checkComponentPermission(ele?.permission)) {
                    // setExtraReportColumns({ ...extraReportColumns, ...ele, Header: componentName[ele?.permission] })
                    finalColumns.push({ ...ele, Header: componentName[ele?.permission] })
                }
            })
            if(consumerFromIsEnabled == "Y"){
                let columnExist = finalColumns.find(val=>{
                    return val?.id == 'consumerFrom'
                })
                if(columnExist){
                    finalColumns.push({
                        Header: "Profile Category",
                        accessor: "consumerFrom",
                        disableFilters: true,
                        id: "consumerFrom"
                    });
                }
            }
            setExtraReportColumns(finalColumns)
        }
        if (departmentEnable === "Y") openInteractionColumnsProp.splice(5, 0, ...profileColumns);
        let newArray = removeDuplicatesFromArrayObject([...openInteractionColumnsProp, ...finalColumns], "Header");
        setReportColumns(newArray)
    }, [componentPermission]);


    return (
        <div className="cmmn-skeleton mt-2">
            <div className="">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12">
                                    <h4 className="pl-3">Open Interaction Report</h4>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <div className="d-flex justify-content-end">
                                <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>
                                    {displayForm ? "Hide Search" : "Show Search"}
                                </h6>
                            </div>
                            {console.log("report fields ==> ", appConfig?.clientConfig?.report?.createdInteraction?.fields)}
                            {displayForm && (
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "ouCode"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div
                                                        className="form-group"
                                                        disabled={appConfig?.clientConfig?.report?.isOuFilter}
                                                    >
                                                        <label htmlFor="ouCode" className="control-label">
                                                            OU
                                                        </label>
                                                        <ReactSelect
                                                            closeMenuOnSelect={false}
                                                            // isDisabled={appConfig?.clientConfig?.report?.isOuFilter}
                                                            placeholder={<div>ALL</div>}
                                                            options={ouLookup ?? []}
                                                            getOptionLabel={(option) => `${option.label}`}
                                                            onChange={(e) => {
                                                                handleMultiInputChange("ouCode", e, 'OU');
                                                            }}
                                                            value={searchInputs?.ouCode}
                                                            isMulti
                                                            isClearable
                                                            name="OU"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "deptCode"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label htmlFor="deptCode" className="control-label">
                                                            Department
                                                        </label>
                                                        <ReactSelect
                                                            closeMenuOnSelect={false}
                                                            placeholder={<div>ALL</div>}
                                                            isDisabled={
                                                                appConfig?.clientConfig?.report
                                                                    ?.isDepartmentFilter
                                                            }
                                                            options={departmentLookup ?? []}
                                                            getOptionLabel={(option) => `${option.label}`}
                                                            onChange={(e) => {
                                                                handleMultiInputChange("deptCode", e, 'Department');
                                                            }}
                                                            value={searchInputs?.deptCode}
                                                            isMulti
                                                            isClearable
                                                            name="deptCode"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "status"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label htmlFor="status" className="control-label">
                                                            Status
                                                        </label>
                                                        <select
                                                            className="form-control"
                                                            id="status"
                                                            value={searchInputs.status}
                                                            onChange={handleInputChange}
                                                            data-name='Status'
                                                        >
                                                            <option value="">Select Status</option>
                                                            {statusLookup &&
                                                                statusLookup.map((e) => (
                                                                    <option key={e.code} value={e.code}>
                                                                        {e.description}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "interactionType"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label
                                                            htmlFor="interactionType"
                                                            className="control-label"
                                                        >
                                                            Interaction Type
                                                        </label>
                                                        <select
                                                            className="form-control"
                                                            id="interactionType"
                                                            value={searchInputs.interactionType}
                                                            onChange={handleInputChange}
                                                            data-name='Interaction Type'
                                                        >
                                                            <option value="">Select Interaction Type</option>
                                                            {interactionTypeLookup &&
                                                                interactionTypeLookup.map((e) => (
                                                                    <option key={e.code} value={e.code}>
                                                                        {e.description}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "profileNo"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label
                                                            htmlFor="reference_number"
                                                            className="control-label"
                                                        >
                                                            {
                                                                appConfig?.clientFacingName[
                                                                "Customer".toLowerCase()
                                                                ]
                                                            }{" "}
                                                            No
                                                        </label>
                                                        <input
                                                            value={searchInputs?.reference_number}
                                                            onChange={handleInputChange}
                                                            type="text"
                                                            className="form-control"
                                                            id="reference_number"
                                                            data-name={appConfig?.clientFacingName["Customer".toLowerCase()] + "No"}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "profileName"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label
                                                            htmlFor="reference_name"
                                                            className="control-label"
                                                        >
                                                            {
                                                                appConfig?.clientFacingName[
                                                                "Customer".toLowerCase()
                                                                ]
                                                            }{" "}
                                                            Name{" "}
                                                        </label>
                                                        <input
                                                            value={searchInputs?.reference_name}
                                                            onChange={handleInputChange}
                                                            type="text"
                                                            className="form-control"
                                                            id="reference_name"
                                                            data-name={appConfig?.clientFacingName["Customer".toLowerCase()] + "Name"}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "problemCode"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label
                                                            htmlFor="problemCode"
                                                            className="control-label"
                                                        >
                                                            Problem Code
                                                        </label>
                                                        <select
                                                            className="form-control"
                                                            id="problemCode"
                                                            value={searchInputs.problemCode}
                                                            onChange={handleInputChange}
                                                            data-name={" Problem Code"}
                                                        >
                                                            <option value="">Select Problem Code</option>
                                                            {problemCodeLookUp &&
                                                                problemCodeLookUp.map((e) => (
                                                                    <option key={e.code} value={e.description}>
                                                                        {e.description}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "IntxtStatment"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label
                                                            htmlFor="intxn_statement"
                                                            className="control-label"
                                                        >
                                                            Interaction Statement
                                                        </label>
                                                        <select
                                                            className="form-control"
                                                            id="intxn_statement"
                                                            value={searchInputs?.intxn_statement}
                                                            onChange={handleInputChange}
                                                            data-name={"Interaction Statement"}
                                                        >
                                                            <option value="">
                                                                Select interaction statement
                                                            </option>
                                                            {intxtStatmentLookup &&
                                                                intxtStatmentLookup.map((e) => (
                                                                    <option key={e.requestId} value={e.requestStatement}>
                                                                        {e.requestStatement}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        {checkComponentPermission('ID_VALUE') && <div className="col-lg-3 col-md-3 col-sm-12">
                                            <div className="form-group">
                                                <label htmlFor="idValue" className="control-label">{appConfig?.clientFacingName?.['idValue'] ? startCase(appConfig?.clientFacingName?.['idValue']) : 'ID Value'}</label>
                                                <input type="text" className="form-control" id="idValue" value={searchInputs?.idValue ?? ''} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                        }
                                        {checkComponentPermission('REGISTRATION_NO') && <div className="col-lg-3 col-md-3 col-sm-12">
                                            <div className="form-group">
                                                <label htmlFor="registeredNo" className="control-label">{appConfig?.clientFacingName?.['registerNo'] ? startCase(appConfig?.clientFacingName?.['registerNo']) : 'Register No'}</label>
                                                <input type="text" className="form-control" id="registeredNo" value={searchInputs?.registeredNo ?? ''} onChange={handleInputChange} />
                                            </div>
                                        </div>}

                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "dateFrom"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label htmlFor="Date From" className="control-label">
                                                            From Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            min={moment(dateVariable).format('YYYY-MM-DD')}
                                                            value={searchInputs.dateFrom}
                                                            onChange={handleInputChange}
                                                            className="form-control"
                                                            id="dateFrom"
                                                            data-name='From Date'
                                                        />
                                                        <span className="errormsg">
                                                            {error.dateFrom ? error.dateFrom : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes(
                                            "dateTo"
                                        ) && (
                                                <div className="col-lg-3 col-md-4 col-sm-12">
                                                    <div className="form-group">
                                                        <label htmlFor="To From" className="control-label">
                                                            To Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            min={moment(dateVariable).format('YYYY-MM-DD')}
                                                            value={searchInputs.dateTo}
                                                            onChange={handleInputChange}
                                                            className="form-control"
                                                            id="dateTo"
                                                            data-name='To Date'
                                                        />
                                                        <span className="errormsg">
                                                            {error.dateTo ? error.dateTo : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                    </div>
                                    <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                        <button
                                            type="button"
                                            className="skel-btn-cancel"
                                            onClick={hanleOnClear}
                                        >
                                            Clear
                                        </button>
                                        <button type="submit" className="skel-btn-submit">
                                            Search
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        {searchData && searchData.length > 0 && (
                            <>
                                <div className="card">
                                    <div className="card-body" id="datatable">
                                        <div style={{}}>
                                            <DynamicTable
                                                listSearch={listSearch}
                                                SearchCriteria={SearchCriteria}
                                                listKey={"open-interaction"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={reportColumns}
                                                itemsPerPage={perPage}
                                                columnFilter={true}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                exportBtn={exportBtn}
                                                report={true}
                                                reportName={"Open Interaction Report"}
                                                url={`${properties.REPORTS_API}/get-report/open-interaction?limit=${perPage}&page=${currentPage}&uuid=${uid}`}
                                                method={"GET"}
                                                handler={{
                                                    handleCellRender: handleCellRender,
                                                    handlePageSelect: handlePageSelect,
                                                    handleItemPerPage: setPerPage,
                                                    handleCurrentPage: setCurrentPage,
                                                    handleFilters: setFilters,
                                                    handleExportButton: setExportBtn,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        // <div className="container-fluid">
        //     <div className="row mt-1">
        //         <div className="col-lg-12">
        //             <div className="search-result-box m-t-30 card-box">
        //                 <div id="searchBlock" className="modal-body p-2 d-block">
        //                     <div className="d-flex justify-content-end">
        //                         <h6 className="text-primary cursor-pointer" onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Show Search"}</h6>
        //                     </div>
        //                     {
        //                         displayForm && (
        //                             <form onSubmit={handleSubmit}>
        //                                 <div className="row">
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('ouCode') &&
        //                                         <div className="col-3">
        //                                             <div className="form-group" disabled={appConfig?.clientConfig?.report?.isOuFilter}>
        //                                                 <label htmlFor="ouCode" className="control-label">OU</label>
        //                                                 <ReactSelect
        //                                                     closeMenuOnSelect={false}
        //                                                     isDisabled={appConfig?.clientConfig?.report?.isOuFilter}
        //                                                     placeholder={<div>ALL</div>}
        //                                                     options={ouLookup ?? []}
        //                                                     getOptionLabel={option => `${option.label}`}
        //                                                     onChange={(e) => { handleMultiInputChange('ouCode', e) }}
        //                                                     value={searchInputs?.ouCode}
        //                                                     isMulti
        //                                                     isClearable
        //                                                     name="OU"
        //                                                 />
        //                                             </div>
        //                                         </div>
        //                                     }

        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('deptCode') && <div className="col-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="deptCode" className="control-label">Department</label>
        //                                             <ReactSelect
        //                                                 closeMenuOnSelect={false}
        //                                                 placeholder={<div>ALL</div>}
        //                                                 isDisabled={appConfig?.clientConfig?.report?.isDepartmentFilter}
        //                                                 options={departmentLookup ?? []}
        //                                                 getOptionLabel={option => `${option.label}`}
        //                                                 onChange={(e) => { handleMultiInputChange('deptCode', e) }}
        //                                                 value={searchInputs?.deptCode}
        //                                                 isMulti
        //                                                 isClearable
        //                                                 name="deptCode"
        //                                             />
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('district') && <div className="col-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="district" className="control-label">District</label>
        //                                             <ReactSelect
        //                                                 closeMenuOnSelect={false}
        //                                                 value={searchInputs?.district}
        //                                                 placeholder={<div>ALL</div>}
        //                                                 options={mappedDistrictLookup ?? []}
        //                                                 getOptionLabel={option => `${option.label}`}
        //                                                 onChange={(e) => { handleMultiInputChange('district', e) }}
        //                                                 isMulti
        //                                                 isClearable
        //                                                 name="district"
        //                                             />
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('interactionId') && <div className="col-md-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="interactionID" className="control-label">Interaction ID</label>
        //                                             <input value={searchInputs?.interactionId}
        //                                                 onChange={handleInputChange} type="text" className="form-control" id="interactionId"
        //                                             />
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('interactionType') && <div className="col-md-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="interactionType" className="control-label">Interaction Type</label>
        //                                             <select className="form-control" id="interactionType" value={searchInputs.interactionType} onChange={handleInputChange}>
        //                                                 <option value="">Select Interaction Type</option>
        //                                                 {
        //                                                     interactionTypeLookup && interactionTypeLookup.map((e) => (
        //                                                         <option key={e.code} value={e.code}>{e.description}</option>
        //                                                     ))
        //                                                 }
        //                                             </select>
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('project') && <div className="col-md-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="project" className="control-label">Project</label>
        //                                             <select className="form-control" id="project" value={searchInputs?.project} onChange={handleInputChange}>
        //                                                 <option value="">Select Project</option>
        //                                                 {
        //                                                     projectsLookup && projectsLookup.map((e) => (
        //                                                         <option key={e.code} value={e.code}>{e.description}</option>
        //                                                     ))
        //                                                 }
        //                                             </select>
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('dateFrom') && <div className="col-md-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="Date From" className="control-label">From Date</label>
        //                                             <input type="date" value={searchInputs.dateFrom} onChange={handleInputChange} className="form-control" id="dateFrom" />
        //                                             <span className="errormsg">{error.dateFrom ? error.dateFrom : ""}</span>
        //                                         </div>
        //                                     </div>}
        //                                     {appConfig?.clientConfig?.report?.createdInteraction?.fields.includes('dateTo') && <div className="col-md-3">
        //                                         <div className="form-group">
        //                                             <label htmlFor="To From" className="control-label">To Date</label>
        //                                             <input type="date" value={searchInputs.dateTo} onChange={handleInputChange} className="form-control" id="dateTo" />
        //                                             <span className="errormsg">{error.dateTo ? error.dateTo : ""}</span>
        //                                         </div>
        //                                     </div>}
        //                                 </div>
        //                                 <div className="col-md-12 text-center mt-2">
        //                                     <button type="button" className="skel-btn-cancel" onClick={hanleOnClear}>Clear</button>
        //                                     <button type="submit" className="skel-btn-submit">Search</button>
        //                                 </div>
        //                             </form>
        //                         )
        //                     }
        //                 </div>
        //                 {
        //                     searchData && searchData.length > 0 && <>
        //                         <div className="card">
        //                             <div className="card-body" id="datatable">
        //                                 <div style={{}}>
        //                                     <DynamicTable
        //                                         listSearch={listSearch}
        //                                         listKey={"Open Interaction Report"}
        //                                         row={searchData}
        //                                         rowCount={totalCount}
        //                                         header={CustomerSearchColumns}
        //                                         itemsPerPage={perPage}
        //                                         backendPaging={true}
        //                                         backendCurrentPage={currentPage}
        //                                         isTableFirstRender={isTableFirstRender}
        //                                         hasExternalSearch={hasExternalSearch}
        //                                         exportBtn={exportBtn}
        //                                         url={properties.REPORTS_API + '/open-interactions'}
        //                                         method={'POST'}
        //                                         handler={{
        //                                             handleCellRender: handleCellRender,
        //                                             handlePageSelect: handlePageSelect,
        //                                             handleItemPerPage: setPerPage,
        //                                             handleCurrentPage: setCurrentPage,
        //                                             handleFilters: setFilters,
        //                                             handleExportButton: setExportBtn
        //                                         }}
        //                                     />
        //                                 </div>
        //                             </div>
        //                         </div>

        //                     </>
        //                 }
        //             </div>
        //         </div>
        //     </div>
        // </div>
    );
};

export default OpenInteractionReport;
