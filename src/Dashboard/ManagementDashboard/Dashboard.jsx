import axios from "axios";
import { isEmpty } from "lodash";
import moment from "moment";
import React, { Suspense, useCallback, useContext, useEffect, useRef, useState } from "react";
import Spinner from 'react-bootstrap/Spinner';
import { unstable_batchedUpdates } from "react-dom";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";

import { AppContext, ManagementDashboardContext } from "../../AppContext";
import FilterBtn from "../../assets/images/filter-btn.svg";
import SuspenseFallbackLoader from "../../common/components/SuspenseFallbackLoader";
import { hideSpinner, showSpinner } from "../../common/spinner";
import { get } from "../../common/util/restUtil";
import { getPermissions, pageStyle } from '../../common/util/util';
import { properties } from "../../properties";
import CustomComponentRender from "./Components/CustomComponentRender";
import ExportDashboard from "./ExportDashboard";
import Filter from "./filter";

//Icons
import exportExcelIcon from '../../assets/images/exportexcel.svg';
import solidMagic from '../../assets/images/fa-solid_magic.svg';
import phone from '../../assets/images/iconamoon_ticket-light-1.svg';
import chat from '../../assets/images/iconamoon_ticket-light-2.svg';
import message from '../../assets/images/iconamoon_ticket-light-3.svg';
import note from '../../assets/images/iconamoon_ticket-light-4.svg';
import info from '../../assets/images/iconamoon_ticket-light-5.svg';
import ticket from '../../assets/images/iconamoon_ticket-light-6.svg';
import refresh from '../../assets/images/iconamoon_ticket-light-b.svg';
import time from '../../assets/images/mingcute_time-line.svg';
import openBox from '../../assets/images/open-helpdesk.svg';
import human from '../../assets/images/pajamas_user.svg';
import inProgress from '../../assets/images/ri_progress-3-line.svg';
import blackBox from '../../assets/images/system-uicons_box-1.svg';
import box from '../../assets/images/system-uicons_box.svg';


const Dashboard = () => {
    const { auth } = useContext(AppContext)
    const [masterLookupData, setMasterLookupData] = useState([]);
    const [showFilter, setShowFilter] = useState(false);
    const startDate = moment().clone().startOf('month').format('YYYY-MM-DD');
    const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const [searchParams, setSearchParams] = useState({
        fromDate: startDate,
        toDate: endDate
    })
    const [excelFilter, setExcelFilter] = useState({})
    const [isChecked, setIsChecked] = useState(false)
    const [pageRefreshTime, setPageRefreshTime] = useState(1)
    const [isParentRefresh, setIsParentRefresh] = useState(false)
    const [lastDataRefreshTime, setLastDataRefreshTime] = useState({
    })
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const [activeTab, setActiveTab] = useState({ index: 0, title: 'Overall' })
    const [managmentSkeleton, setManagmentSkeleton] = useState([])
    const [dashboardDetails, setDashboardDetails] = useState({})

    const [pdfManagmentSkeleton, setPdfManagmentSkeleton] = useState([])
    const [loading, setLoading] = useState(false)
    const [pdf, setPdf] = useState(false);
    const componentRef = useRef()
    const pdfRef = useRef()

    const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === "development" ? "" : properties.REACT_APP_BASE)

    const iconMap = {
        phone: phone, chat: chat, message: message, note: note, info: info, ticket: ticket,
        refresh: refresh, time: time, box: box, human: human, solidMagic: solidMagic, openBox: openBox,
        inProgress: inProgress, blackBox: blackBox
    }

    /**
     *  Use the icon from the map or default to 'ticket'
     * @param {string} icon 
     * @returns icon
     */
    const getIcon = (icon) => {
        return iconMap[icon] || ticket
    }

    const contextProvider = {
        data: {
            lastDataRefreshTime,
            showFilter,
            searchParams,
            isParentRefresh,
            masterLookupData,
            managmentSkeleton,
            dashboardDetails
        },
        handlers: {
            setLastDataRefreshTime,
            setShowFilter,
            setSearchParams,
            getIcon
        }
    }

    const handleAutoRefresh = () => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return;
        }
        setIsChecked(!isChecked)
    }

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false)
            setPageRefreshTime(parseInt(e.target.value))
        })
    }

    useEffect(() => {
        get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=PROJECT,TICKET_CHANNEL`)
            .then((response) => {
                const { data } = response
                setMasterLookupData(data)
            })
            .catch((error) => { console.error(error) })

        showSpinner()
        axios.get(`${API_ENDPOINT}${properties.REPORTS_API}/management`, {
            headers: {
                "x-tenant-id":
                    process.env.NODE_ENV === "development"
                        ? properties.REACT_APP_TENANT_ID
                        : undefined,
                "x-report-tenant-id":
                    process.env.NODE_ENV === "development"
                        ? 'b301b1e3-7413-4b87-bd89-2d505eb113e0'
                        : undefined,
                Authorization: auth?.accessToken,
            },
        }).then((response) => {
            if (response.status === 200) {
                setManagmentSkeleton(response.data?.data ?? [])
            }
        }).catch((error) => { console.error(error) })
            .finally(hideSpinner)

    }, [])


    // Getting Dashboard information
    const getDashboardInformation = useCallback(() => {
        showSpinner()

        const requestBody = {
            ...searchParams,
            sourceTab: activeTab?.title ?? ''
        }

        if (isEmpty(requestBody)) {
            toast.error("Please select date range!!");
            return
        }

        axios.post(`${API_ENDPOINT}${properties.REPORTS_API}/management/details`, requestBody, {
            headers: {
                "x-tenant-id":
                    process.env.NODE_ENV === "development"
                        ? properties.REACT_APP_TENANT_ID
                        : undefined,
                "x-report-tenant-id":
                    process.env.NODE_ENV === "development"
                        ? 'b301b1e3-7413-4b87-bd89-2d505eb113e0'
                        : undefined,
                Authorization: auth?.accessToken,
            },
        }).then((response) => {
            if (response.status === 200) {
                setDashboardDetails(response.data?.data ?? {})
            }
        }).catch((error) => { console.error(error) })
            .finally(hideSpinner)
    }, [searchParams, isParentRefresh, activeTab])

    useEffect(() => {
        getDashboardInformation(searchParams)
    }, [searchParams, isParentRefresh, activeTab])

    const clearFilter = (param, value) => {
        if (["project", "channel"].includes(param)) {
            searchParams[param] = searchParams[param].filter(x => x.value != value);
        } else {
            searchParams[param] = null;
        }

        setSearchParams({
            ...searchParams
        })
    }

    useEffect(() => {
        unstable_batchedUpdates(() => {
            if (pageRefreshTime && typeof pageRefreshTime === "number") {
                setInterval(() => {
                    if (isChecked) {
                        setIsParentRefresh(!isParentRefresh);
                        const currentTime = moment().format("DD-MM-YYYY HH:mm:ss");
                        setLastDataRefreshTime({

                        })
                    }
                }, Number(pageRefreshTime) * 60 * 1000)
            }
        })
    }, [isChecked])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('MANAGE_DASH');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission?.components?.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])


    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const getSelectedFilters = () => {
        let channel, dateRange, project
        if (searchParams?.fromDate || searchParams?.toDate) {
            let fromDate = searchParams?.fromDate;
            let toDate = searchParams?.toDate ? searchParams?.toDate : fromDate;
            dateRange = fromDate + " - " + toDate;
        }
        if (searchParams?.project?.length) project = searchParams?.project;
        if (searchParams?.channel?.length) channel = searchParams?.channel;


        return (
            <React.Fragment>
                {dateRange /*&& checkComponentPermission("DATE_RANGE")*/ && (
                    <li style={{ fontSize: '15px' }}>
                        Date Range:
                        <span className="dash-filter-badge ml-1">{dateRange}
                        </span>
                    </li>
                )}
                {project && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Projects: {project.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('project', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {channel && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Channels: {channel.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('channel', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
            </React.Fragment>
        )
    }

    const handleTabChange = ({ index = 0, title = 'Overall' }) => {
        setActiveTab({ index, title })
    }

    let completedRequests = 0;
    const handleRequestCompletion = () => {
        completedRequests += 1;
        if (completedRequests === 2) {
            unstable_batchedUpdates(() => {
                hideSpinner()
                setPdf(true)
                setLoading(false)
            })
        }
    }

    const getPdfmanagementSkeletion = useCallback(() => {
        setLoading(true)
        const headers = {
            "x-tenant-id": process.env.NODE_ENV === "development" ? properties.REACT_APP_TENANT_ID : undefined,
            "x-report-tenant-id": process.env.NODE_ENV === "development" ? 'b301b1e3-7413-4b87-bd89-2d505eb113e0' : undefined,
            Authorization: auth?.accessToken
        };

        showSpinner()
        axios.get(`${API_ENDPOINT}${properties.REPORTS_API}/management?isPdf=true`, { headers })
            .then((response) => {
                if (response.status === 200) {
                    setPdfManagmentSkeleton(response.data?.data ?? [])
                }
            })
            .catch((error) => { console.error(error) })
            .finally(() => { handleRequestCompletion() });

        axios.post(`${API_ENDPOINT}${properties.REPORTS_API}/management/details`, { ...searchParams, sourceTab: 'ALL' }, { headers })
            .then((response) => {
                if (response.status === 200) {
                    pdfRef.current = response.data?.data ?? {};
                }
            }).catch((error) => { console.error(error) })
            .finally(() => { handleRequestCompletion() })

    }, [auth?.accessToken, searchParams, hideSpinner])


    const handlePrintStart = (e) => {
        e.preventDefault()
        getPdfmanagementSkeletion()
    }

    useEffect(() => {
        if (pdf === true) {
            handlePrint()
        }
    }, [pdf])

    const handlePrint = useReactToPrint({
        content: () => componentRef?.current,
        onAfterPrint: () => {
            document.title = 'dtWorks';
            setPdf(false)
        },
        pageStyle: pageStyle
    })

    return (
        <ManagementDashboardContext.Provider value={contextProvider}>
            <div className="content visible-print-export">
                <div className="container-fluid pr-1">
                    <div className="cnt-wrapper">
                        <div className="card-skeleton">
                            <div className="customer-skel mt-0">
                                <div className="row">
                                    <div className="col-md-12">
                                        <div className="tab-content">
                                            <div className="tab-pane fade show active">
                                                <div className="skle-swtab-sect">
                                                    <div className="db-list mb-0 pl-0"></div>
                                                    <form className="form-inline" style={{ justifyContent: 'flex-end' }}>
                                                        {/*checkComponentPermission("AUTO_REFRESH") &&*/ <><span className="ml-1">Auto Refresh</span>
                                                            <div className="switchToggle ml-1">
                                                                <input id="switch1" type="checkbox" checked={isChecked} onChange={handleAutoRefresh} />
                                                                <label htmlFor="switch1">Toggle</label>
                                                            </div>
                                                            <select className="custom-select custom-select-sm ml-1" value={pageRefreshTime} onChange={handleSetRefreshTime}>
                                                                <option value="Set">Set</option>
                                                                <option value={Number(1)}>1 Min</option>
                                                                <option value={Number(5)}>5 Min</option>
                                                                <option value={Number(15)}>15 Min</option>
                                                                <option value={Number(30)}>30 Min</option>
                                                            </select>
                                                        </>}
                                                        { /* checkComponentPermission("EXPORT") &&*/ <button className="skel-btn-export" onClick={handlePrintStart}>{loading ? 'Loading...' : 'Export'}{!loading && <img alt="" src={exportExcelIcon} className="pl-2" />}{loading && <Spinner animation="grow" size="sm" aria-hidden="true" />}</button >}

                                                        {/* checkComponentPermission("FILTER") &&*/ <div className="db-list mb-0 pl-1">
                                                            <a className="skel-fr-sel-cust cursor-pointer"
                                                                onClick={() => setShowFilter(!showFilter)}>
                                                                <div className="list-dashboard db-list-active skel-self">
                                                                    <span className="db-title">
                                                                        Filter
                                                                        <img
                                                                            src={FilterBtn}
                                                                            className="img-fluid pl-1"
                                                                        />
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        </div>}
                                                    </form>
                                                </div>
                                                {/* checkComponentPermission("FILTER") &&*/ <Filter
                                                    data={{
                                                        showFilter,
                                                        searchParams,
                                                        isParentRefresh,
                                                        excelFilter
                                                    }}
                                                    handler={{
                                                        setShowFilter,
                                                        setSearchParams,
                                                        isParentRefresh,
                                                        setExcelFilter,
                                                    }}
                                                />}
                                                <ul class="nav nav-tabs" id="myTab" role="tablist">
                                                    {managmentSkeleton && managmentSkeleton?.map((ele, index) => {
                                                        return (
                                                            <li className="nav-item" role="presentation">
                                                                <a className={`nav-link ${activeTab?.index === index ? 'active ' : ''}`} id={ele?.title} key={ele?.title} data-toggle="tab"
                                                                    data-target={`#${ele?.title}`} type="button" role="tab" aria-controls={ele?.title}
                                                                    aria-selected="true" onClick={() => handleTabChange({ index, title: ele?.title })} >{ele?.title}</a>
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                                <div className="skle-swtab-sect mt-0 mb-0">
                                                    <ul className="skel-top-inter mt-1 mb-0">
                                                        {getSelectedFilters()}
                                                    </ul>
                                                </div>
                                            </div>
                                            <>
                                                <div className="tab-content mt-2">
                                                    {managmentSkeleton && managmentSkeleton?.map((ele, index) => (
                                                        <>{activeTab?.index === index &&
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <CustomComponentRender skeleton={ele} />
                                                            </Suspense>
                                                        }</>
                                                    ))}
                                                </div>
                                            </>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {pdf && <ExportDashboard ref={componentRef} pdf={pdf} data={pdfRef?.current} skeleton={pdfManagmentSkeleton} />}
            </div>
        </ManagementDashboardContext.Provider>
    )
}

export default Dashboard