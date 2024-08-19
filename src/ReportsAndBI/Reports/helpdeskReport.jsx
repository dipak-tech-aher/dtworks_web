/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../common/spinner';
import DynamicTable from '../../common/table/DynamicTable';
import { properties } from '../../properties';
import { post, get } from '../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { formFilterObject, getPermissions, getConfig } from '../../common/util/util';
import Columns from './helpdeskreportcolumns';
import { AppContext } from '../../AppContext';
import moment from 'moment';
import * as XLSX from "xlsx";
import * as FileSaver from "file-saver";
import { statusConstantCode, metaConfig } from '../../AppConstants'
import { startCase } from 'lodash'

const HelpDeskReport = (props) => {
    const { appsConfig } = props
    const initialValues = {
        helpdeskID: "",
        source: "",
        project: "",
        userName: "",
        userEmail: "",
        assignedUser: "",
        assignedDate: "",
        status: "",
        dateFrom: moment().startOf("month").format("YYYY-MM-DD"),
        dateTo: moment().format("YYYY-MM-DD"),
        reportType: "Helpdesk Report",
        completionDate: "",
        userID: "",
        contactNumber: "",
    }
    const dateVariable = '1940-01-01'
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
    const { auth, systemConfig } = useContext(AppContext)
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [statusLookup, setStatusLookup] = useState([]);
    const [projectLookup, setProjectLookup] = useState([]);
    const [helpdeskSource, setHelpdeskSource] = useState([])
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [reportColumns, setReportColumns] = useState([])
    const [componentName, setComponentName] = useState({})
    const [extraReportColumns, setExtraReportColumns] = useState([])
    const [departmentEnable, setDepartmentEnable] = useState(false);
    const [consumerFromIsEnabled, setConsumerFromIsEnabled] = useState("")

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    useEffect(() => {

        if (!isFirstRender.current) {
            getLoginDetails();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPage, perPage]);

    useEffect(() => {
        // get(properties.CUSTOMER_API + '/get-user-wise-projectlist').then((response) => {
        //     const { data } = response;
        //     setProjectLookup(data ?? []);
        // }).catch(error => {
        //     console.error(error);
        // });

        // let statusArr = ['NEW', 'WIP', 'CLOSED', 'ESCALATED', 'PEND-TESTING', 'PEND-DEPLOYMENT']
        get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=HELPDESK_STATUS,HELPDESK_SOURCE,PROJECT')
            .then((resp) => {
                if (resp.data) {
                    // let helpdeskReportStatus = resp.data.HELPDESK_STATUS.filter((f) => statusArr.includes(f.code))
                    setStatusLookup(resp.data.HELPDESK_STATUS)
                    let projectss = resp.data.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId))

                    setProjectLookup(projectss ?? []);

                    setHelpdeskSource(resp.data.HELPDESK_SOURCE)
                }
            }).finally();
    }, []);

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

    const getLoginDetails = () => {
        if (searchInputs?.userEmail) {
            const email = validateEmail(searchInputs?.userEmail)
            if (!email) {
                toast.warn('Please provide the vaild email')
                return false
            }
        }
        let isAllProjects = auth?.user?.project?.project.includes("ALL")
        showSpinner();
        const requestBody = {
            "searchType": "ADV_SEARCH",
            ...searchInputs,
            projects: searchInputs.project === "ALL" ? [] : searchInputs.project ? [searchInputs.project] : isAllProjects ? [] : auth?.user?.project?.project,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        //setSearchInputs(initialValues)
        post(`${properties.REPORTS_API}/helpdesk-report?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        const Rows = rows.map(items => ({
                            ...items,
                            UserName: items.UserName?.replace(' null', '')?.trim()
                        }))
                        unstable_batchedUpdates(() => {
                            setTotalCount(count)
                            setSearchData(Rows);
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
                hideSpinner()
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

    const exportToCSV = () => {
        const fileName = `dtWorks_Helpdesk_Report_${moment(new Date()).format('DD MMM YYYY')}`
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
        const fileExtension = ".xlsx";
        let tableData = [];
        let isAllProjects = auth?.user?.project?.project.includes("ALL")

        showSpinner();
        const requestBody = {
            "searchType": "ADV_SEARCH",
            ...searchInputs,
            projects: searchInputs.project ? [searchInputs.project] : isAllProjects ? [] : searchInputs.project === "ALL" ? [] : auth?.user?.project?.project,
            // projects: searchInputs.project === "ALL" ? [] : searchInputs.project ? [searchInputs.project] : isAllProjects ? [] : auth?.user?.project?.project,
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        //setSearchInputs(initialValues)
        post(`${properties.REPORTS_API}/helpdesk-report?excel=true`, requestBody)
            .then((resp) => {
                if (resp.data) {
                    if (resp.status === 200) {
                        const { count, rows } = resp.data;
                        // let obj = []
                        // for (const i of rows) {
                        //     const record = {
                        //         HelpdeskId: i.HelpdeskId,
                        //         Status: i.StatusDesc,
                        //         profileNo: i.profileNo,
                        //         profileName: i.profileName ?? '',
                        //         helpdeskStatement: i.helpdeskStatement ?? '',
                        //         helpdeskType: i.helpdeskType ?? '',
                        //         UserSource: i.UserSource,
                        //         UserEmail: i.UserEmail,
                        //         UserName: i.UserName,
                        //         UserTitle: i.UserTitle,
                        //         Project: i.Project,
                        //         CreatedDepartment: i.CreatedDepartment,
                        //         AssignedUserDesc: i.AssignedUserDesc,
                        //         AssignedDate: i.AssignedDate,
                        //         CreatedUserDesc: i.CreatedUserDesc,
                        //         CreatedDate: i.CreatedDate,
                        //         HelpdeskEmail: i.HelpdeskEmail,
                        //         HelpdeskSubject: i.HelpdeskSubject,
                        //         HelpdeskDescription: i.HelpdeskDescription,
                        //         closedOn: i.closedOn,
                        //         currentStatus: i.currentStatus,
                        //         CreatedAt: i.CreatedAt,
                        //         CompletionDate: i.CompletionDate,
                        //         ClosedDate: i.ClosedDate,
                        //         StatusCode: i.Status
                        //     }

                        //     if (extraReportColumns && extraReportColumns?.length > 0) {
                        //         extraReportColumns?.forEach((items) => {
                        //             if (items) {
                        //                 record[items.accessor] = i[items.accessor]
                        //             }
                        //         })
                        //     }

                        //     obj.push(record)
                        // }]
                        rows.forEach((element,i) => {
                            let Difference_In_Days_helpdesk
                            if (element.Status === statusConstantCode?.status?.HELPDESK_CLOSED) {
                                let Difference_In_Time = new Date(element?.ClosedDate).getTime() - new Date(element?.CreatedAt).getTime();
                                Difference_In_Days_helpdesk = Math.floor(Math.abs(Difference_In_Time / (1000 * 3600 * 24)));
                            } else {
                                // console.log("Element =>", element?.CreatedDate);
                                let Difference_In_Time = new Date().getTime() - new Date(element?.CreatedAt).getTime();
                                Difference_In_Days_helpdesk = Math.floor(Math.abs(Difference_In_Time / (1000 * 3600 * 24)));
                            }
                            let objConstruct = {}
                            let truncatedDescription = element?.HelpdeskDescription;
                            objConstruct["S.NO"]=i+1
                            // Check if the length exceeds 32767 characters
                            if (truncatedDescription?.length > 32767) {
                                truncatedDescription = truncatedDescription?.substring(0, 32767);
                            }
                            reportColumns.map((col)=>{
                                objConstruct[col.Header]=element[col.accessor]
                            })
                            objConstruct["Helpdesk Description"] = truncatedDescription
                            objConstruct["Helpdesk Ageing"]= Difference_In_Days_helpdesk >= 0 ? Difference_In_Days_helpdesk : "";
                            // objConstruct = {
                            //     "Helpdesk ID": element?.HelpdeskId,
                            //     "Status": element?.Status,
                            //     "User Source": element?.UserSource,
                            //     "User Email": element?.UserEmail,
                            //     "User Name": element?.UserName,
                            //     "Email Subject": element?.HelpdeskSubject,
                            //     "Project": element?.Project,
                            //     "Created Department": element?.CreatedDepartment,
                            //     "Assigned User": element?.AssignedUserDesc,
                            //     "Assigned Date": element?.AssignedDate ? moment(element?.AssignedDate).format('DD-MM-YYYY') : '-',
                            //     "Created User": element?.CreatedUserDesc,
                            //     "Created Date": moment(element?.CreatedDate).format('DD-MMM-YYYY HH:MM A'),
                            //     "Helpdesk Email": element?.HelpdeskEmail,
                            //     "Helpdesk Description": truncatedDescription,
                            //     "Helpdesk Ageing": Difference_In_Days_helpdesk >= 0 ? Difference_In_Days_helpdesk : "",
                            //     "Completion Date": element?.CompletionDate
                            // }

                            if (extraReportColumns && extraReportColumns?.length > 0) {
                                extraReportColumns?.forEach((items) => {
                                    if (items) {
                                        objConstruct[items.Header] = element[items.accessor]
                                    }
                                })
                            }
                            tableData.push(objConstruct);
                        })
                        
                        if (tableData.length !== 0) {
                            const ws = XLSX.utils.json_to_sheet(tableData,
                                {
                                    origin: 'A2',
                                    skipHeader: false
                                });
                            const wb = {
                                Sheets: { data: ws },
                                SheetNames: ["data"]
                            };

                            const excelBuffer = XLSX.write(wb, {
                                bookType: "xlsx",
                                type: "array"
                            });
                            const data = new Blob(
                                [excelBuffer], { type: fileType }
                            );
                            FileSaver.saveAs(data, fileName + fileExtension);
                        }

                    }
                }
            }).finally(() => {
                hideSpinner()

            });


    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (projectLookup?.length === 0) {
            return toast.error('No Projects Mapped To You!!!')
        }
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
        // console.log("Row =>", row);
        if (cell.column.id === "CreatedDate" || cell.column.id ==="CompletionDate") {
            return (
                <span>{cell.value ? moment(cell.value).format('DD-MMM-YYYY HH:MM A') === "Invalid date" ? cell.value : moment(cell.value).format('DD-MMM-YYYY HH:MM A') : '-'}</span>
            )
        } else if (cell.column.id === "AssignedDate") {
            return (
                <span>{cell.value ? moment(cell.value).format('DD-MMM-YYYY HH:MM A') === "Invalid date" ? cell.value : moment(cell.value).format('DD-MMM-YYYY HH:MM A') : '-'}</span>
                // <span>{cell.value ? moment(cell.value).format('DD-MM-YYYY HH:mm A') : '-'}</span>
            )
        } else if (cell.column.Header === "Helpdesk Ageing") {
            let Difference_In_Time
            let Difference_In_Days
            if (row?.original && row?.original?.Status === statusConstantCode?.status?.HELPDESK_CLOSED) {
                Difference_In_Time = new Date(row?.original?.ClosedDate).getTime() - new Date(row?.original?.CreatedDate).getTime();
                Difference_In_Days = Math.floor(Math.abs(Difference_In_Time / (1000 * 3600 * 24)));
            } else {
                let inputDate = new Date(row?.original?.CreatedDate).getTime();
                if (isNaN(inputDate)) {
                    inputDate = moment(row?.original?.CreatedDate, "DD-MMM-YYYY HH:mm A");
                }
                Difference_In_Time = new Date().getTime() - new Date(inputDate).getTime();
                // console.log("Value-=-=", Difference_In_Time / (1000 * 3600 * 24));
                Difference_In_Days = Math.floor(Math.abs(Difference_In_Time / (1000 * 3600 * 24)));
            }
            return (
                <span>{isNaN(Difference_In_Days) ? '' : Difference_In_Days}</span>
            )
        }
        else
            return (<span>{cell.value ?? '-'}</span>)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('HELPDEST_RPT');
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
    }];
    const profileColumns = [
        {
            Header: "Profile Department",
            accessor: "profileDepartment",
            disableFilters: true,
        }
    ]

    useEffect(() => {
        if (componentPermission) {
            const finalColumns = []
            ExtraReportColumn && ExtraReportColumn?.forEach((ele) => {
                if (ele?.permission && checkComponentPermission(ele?.permission)) {
                    // setExtraReportColumns({ ...extraReportColumns, ...ele, Header: componentName[ele?.permission] })
                    finalColumns.push({ ...ele, Header: componentName[ele?.permission] })
                }
            })
            setExtraReportColumns(finalColumns)
            let consumerColumnsExist = false;
            const formatedColumns = Columns.map((val) => {
                if (val.Header.includes('Profile')) {
                    return { ...val, Header: val.Header.replace('Profile', appsConfig?.clientFacingName?.customer) }
                }
                if(val?.id == 'consumerFrom'){
                    consumerColumnsExist = true;
                }
                return val
            })
            if (departmentEnable === 'Y') formatedColumns.splice(5, 0, ...profileColumns);

            if(consumerFromIsEnabled == "Y" && !consumerColumnsExist){
                formatedColumns.push({
                    Header: "Profile Category",
                    accessor: "consumerFrom",
                    disableFilters: true,
                    id: "consumerFrom"
                });
            }
            setReportColumns([...formatedColumns, ...finalColumns])
        }
    }, [componentPermission, appsConfig,departmentEnable]);
    return (
        <div className="pt-1">
            <div className="cmmn-skeleton mt-2">
                <div className="form-row pb-2">
                    <div className="col-12">
                        <section className="triangle">
                            <div className="col-12 row">
                                <div className="col-12"><h4 className="pl-3">Helpdesk Report</h4></div>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="">
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
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="helpdeskID" className="control-label">Helpdesk ID</label>
                                                                <input
                                                                    placeholder='Enter Helpdesk ID'
                                                                    value={searchInputs.helpdeskID}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="helpdeskID"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="source" className="control-label">Source</label>
                                                                <select className="form-control" id="source" value={searchInputs.source} onChange={handleInputChange}>
                                                                    <option value="">Select Source</option>
                                                                    {
                                                                        helpdeskSource && helpdeskSource.map((e,i) => (
                                                                            <option key={i} value={e.code}>{e.description}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="project" className="control-label">Project</label>
                                                                <select className="form-control" id="project" value={searchInputs.project} onChange={handleInputChange}>
                                                                    <option value="">Select Project</option>
                                                                    {
                                                                        projectLookup && projectLookup.map((e,i) => (
                                                                            <option key={i} value={e.code}>{e.description}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="userName" className="control-label">{appsConfig?.clientFacingName?.customer ??' '} Name</label>
                                                                <input className="form-control"
                                                                    id='userName'
                                                                    placeholder={`Enter ${appsConfig?.clientFacingName?.customer ?? ''} Name`}
                                                                    maxLength={100}
                                                                    type='text'
                                                                    value={searchInputs.userName}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="userEmail" className="control-label">{appsConfig?.clientFacingName?.customer ??' '} Email</label>
                                                                <input className="form-control"
                                                                    id='userEmail'
                                                                    placeholder={`Enter ${appsConfig?.clientFacingName?.customer ?? ''} Email`}
                                                                    type='email'
                                                                    value={searchInputs.userEmail}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="userID" className="control-label">{appsConfig?.clientFacingName?.customer ??' '} ID</label>
                                                                <input className="form-control"
                                                                    id='userID'
                                                                    placeholder={`Enter ${appsConfig?.clientFacingName?.customer ?? ''} Id`}
                                                                    type='text'
                                                                    value={searchInputs.userID}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="contactNumber" className="control-label">{appsConfig?.clientFacingName?.customer ??' '} Contact Number</label>
                                                                <input className="form-control"
                                                                    id='contactNumber'
                                                                    placeholder={`Enter ${appsConfig?.clientFacingName?.customer ?? ''} Contact Number`}
                                                                    type='number'
                                                                    value={searchInputs.contactNumber}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>

                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="assignedUser" className="control-label">Assigned User</label>
                                                                <input className="form-control"
                                                                    id='assignedUser'
                                                                    maxLength={100}
                                                                    type='text'
                                                                    placeholder='Enter Assigned User'
                                                                    value={searchInputs.assignedUser}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="assignedDate" className="control-label">Assigned Date</label>
                                                                <input className="form-control"
                                                                    id='assignedDate'
                                                                    type="date"
                                                                    max={moment().format('YYYY-MM-DD')}
                                                                    placeholder='Enter Assigned User'
                                                                    value={searchInputs.assignedDate}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange} />
                                                            </div>
                                                        </div>
                                                        {/* <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="ageing" className="control-label">Ageing</label>
                                                                <input
                                                                    placeholder='Enter Helpdesk Ageing'
                                                                    value={searchInputs.ageing}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    onChange={handleInputChange}
                                                                    type="text"
                                                                    className="form-control"
                                                                    id="helpdeskID"
                                                                />
                                                            </div>
                                                        </div> */}
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="status" className="control-label">Status</label>
                                                                <select className="form-control" id="status" value={searchInputs.status} onChange={handleInputChange}>
                                                                    <option value="">Select Status</option>
                                                                    {
                                                                        statusLookup && statusLookup.map((e,i) => (
                                                                            <option key={i} value={e.code}>{e.description}</option>
                                                                        ))
                                                                    }
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="dateFrom" className="control-label">Date From</label>
                                                                <input type="date" id="dateFrom" className="form-control"
                                                                    value={searchInputs.dateFrom}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    min={moment(dateVariable).format('YYYY-MM-DD')}
                                                                    // max={moment().format('YYYY-MM-DD')}
                                                                    onChange={handleInputChange}
                                                                // className="form-control"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-3">
                                                            <div className="form-group">
                                                                <label htmlFor="dateTo" className="control-label">Date To</label>
                                                                <input type="date" id="dateTo" className="form-control"
                                                                    value={searchInputs.dateTo}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            handleSubmit(e)
                                                                        };
                                                                    }}
                                                                    max={moment().format('YYYY-MM-DD')}
                                                                    onChange={handleInputChange}
                                                                // className="form-control"
                                                                />
                                                            </div>
                                                        </div>
                                                        {checkComponentPermission('ID_VALUE') && <div className="col-lg-3 col-md-3 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="idValue" className="control-label">{appsConfig?.clientFacingName?.['idValue'] ? startCase(appsConfig?.clientFacingName?.['idValue']) : 'ID Value'}</label>
                                                                <input type="text" className="form-control" id="idValue" value={searchInputs?.idValue ?? ''} onChange={handleInputChange} />
                                                            </div>
                                                        </div>}
                                                        {checkComponentPermission('REGISTRATION_NO') && <div className="col-lg-3 col-md-3 col-sm-12">
                                                            <div className="form-group">
                                                                <label htmlFor="registeredNo" className="control-label">{appsConfig?.clientFacingName?.['registerNo'] ? startCase(appsConfig?.clientFacingName?.['registerNo']) : 'Register No'}</label>
                                                                <input type="text" className="form-control" id="registeredNo" value={searchInputs?.registeredNo ?? ''} onChange={handleInputChange} />
                                                            </div>
                                                        </div>}
                                                    </div>
                                                    <div className="col-md-12 skel-btn-center-cmmn mt-2">
                                                        <button type="button" className="skel-btn-cancel" onClick={() => { setSearchInputs(initialValues); setSearchData([]); }}>Clear</button>
                                                        <button type="submit" className="skel-btn-submit">Search</button>
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
                                            <div className="row">
                                                <div className="col-12 text-right pt-0">
                                                    <button className="btn btn-primary  waves-effect waves-light m-1"
                                                        onClick={exportToCSV}>Export to Excel
                                                    </button>
                                                </div>
                                            </div>
                                            <DynamicTable
                                                // listSearch={listSearch}
                                                // listKey={"Helpdesk Report"}
                                                row={searchData}
                                                rowCount={totalCount}
                                                header={reportColumns ?? Columns}
                                                itemsPerPage={perPage}
                                                backendPaging={true}
                                                backendCurrentPage={currentPage}
                                                isTableFirstRender={isTableFirstRender}
                                                hasExternalSearch={hasExternalSearch}
                                                // exportBtn={exportBtn}
                                                // url={properties.REPORTS_API + '/helpdesk-report'}
                                                // method={'POST'}
                                                handler={{
                                                    handleCellRender: handleCellRender,
                                                    handlePageSelect: handlePageSelect,
                                                    handleItemPerPage: setPerPage,
                                                    handleCurrentPage: setCurrentPage,
                                                    handleFilters: setFilters,
                                                    // handleExportButton: setExportBtn
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

export default HelpDeskReport;