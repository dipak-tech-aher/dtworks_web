import React, { useEffect, useState, useRef, useContext, Suspense, useCallback } from 'react';
import liveStreamPng from '../../assets/images/livestream.png'
import insightViewPng from '../../assets/images/dashboard-icons.png'
import filterPng from '../../assets/images/filter-btn.png'
import moment from "moment";
import { get, post } from "../../common/util/restUtil";
import { useHistory }from '../../common/util/history'
import { properties } from "../../properties";
import { toast } from "react-toastify";
import { unstable_batchedUpdates } from 'react-dom';
import { AppContext } from "../../AppContext";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import Filter from './filter';
import SuspenseFallbackLoader from "../../common/components/SuspenseFallbackLoader";
import ResMttrWaiting from './res-mttr-waiting';
import CustomerComplaintScore from './customer-complaint-score';
import CustomerComplaintResolutionScore from './customer-complaint-resolution-score';
import BlankExpectedDateCompletionWise from './blankExpectedDateCompletionWise';
import ExpectedDateOfCompletionBreachSLA from './Helpdesk-By-Completion-Date-Breach-SLA/ExpectedDateOfCompletionBreachSLA';
import { useReactToPrint } from 'react-to-print';
import { pageStyle } from '../../common/util/util';
import { getPermissions } from '../../common/util/util';

const ByProject = React.lazy(() => import('./Live-Streaming/ByProjects'));
const ByType = React.lazy(() => import('./Live-Streaming/ByType'));
const BySeverity = React.lazy(() => import('./Live-Streaming/BySeverity'));
const ByStatusLive = React.lazy(() => import('./Live-Streaming/ByStatusLive'));
const AgentWise = React.lazy(() => import('./AgentWise'));
const ProjectWise = React.lazy(() => import('./ProjectWise'));
const HourlyTickets = React.lazy(() => import('./Helpdesk-Hourly/HourlyTicktes'));
const HelpdeskSummary = React.lazy(() => import('./Helpdesk-By-Summary/HelpdeskSummary'));
const SupportTicketsPending = React.lazy(() => import('./Support-Tkts-Pend-With/SupportTicketsPending'));
const ByDepartment = React.lazy(() => import('./Helpdesk-By-Department/ByDepartment'));
const Trend = React.lazy(() => import('./Helpdesk-Trends/Trend'));
const ByStatus = React.lazy(() => import('./Helpdesk-By-Status/ByStatus'));
const Ageing = React.lazy(() => import('./Helpdesk-By-Ageing/Ageing'));
const Severity = React.lazy(() => import('./Helpdesk-By-Severity/Severity'));
const CustomerType = React.lazy(() => import('./Helpdesk-By-Customer/ByCustomerType'));


const HelpdeskDashboard = (props) => {
    let { auth, appConfig } = useContext(AppContext);
    const [showFilter, setShowFilter] = useState(false);
    const [excelFilter, setExcelFilter] = useState({});
    // Share PDF via Email and WA stars here
    // const [isShareVisible, setIsShareVisible] = useState(false);
    // const [isExportVisible, setIsExportVisible] = useState(false);
    // Share PDF via Email and WA ends here
    const [filterIsOpen, setFilterIsOpen] = useState(false);
    const [isRightModalOpen, setIsRightModalOpen] = useState(false);
    const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
    const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const dateRange = useRef()

    const history = useHistory()

    const [searchParams, setSearchParams] = useState({
        fromDate: moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD'),
        toDate: moment().clone().endOf('month').format('YYYY-MM-DD'),
    });

    const [helpdeskSearchParams, setHelpdeskSearchParams] = useState({
        fromDate: startDate,
        toDate: endDate
    });

    const [isChecked, setIsChecked] = useState(false);
    const [isParentRefresh, setIsParentRefresh] = useState(false);
    const [pageRefreshTime, setPageRefreshTime] = useState(1);
    const [stream, setStream] = useState('insightView');// liveStreamView

    const modalStyle = {
        'width': '94%',
        'top': '19%',
        'left': '3%',
        'paddingLeft': '2px'
    }

    useEffect(() => {
        unstable_batchedUpdates(() => {
            if (pageRefreshTime && typeof (pageRefreshTime) === 'number') {
                const intervalId = setInterval(() => {
                    if (isChecked) {

                        // const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
                        setIsParentRefresh(!isParentRefresh)
                    }
                }, Number(pageRefreshTime) * 60 * 1000);
                // return () => clearInterval(intervalId);
            }
        })
    }, [isChecked]);


    const handleAutoRefresh = (event) => {
        if (!pageRefreshTime) {
            toast.error("Refresh Time Is Require!");
            return
        }
        setIsChecked(!isChecked);
        // setIsChecked(event.target.checked);
    }

    const handleSetRefreshTime = (e) => {
        unstable_batchedUpdates(() => {
            setIsChecked(false)
            setPageRefreshTime(parseInt(e.target.value));
        })
    }

     // Share PDF via Email and WA stars here
    // const toggleShareVisibility = () => {
    //     setIsShareVisible(!isShareVisible);
    // }
    // const toggleExportVisibility = () => {
    //     setIsExportVisible(!isExportVisible);
    // }
     // Share PDF via Email and WA ends here

    const handleOpenRightModal = (payload) => {
        // console.log('payload----->', payload);
        // console.log('auth----->', auth?.user?.userId);
        // props.history(`/helpdesk?from=DASHBOARD`, {
        //     data: {
        //         payload,
        //         source: 'QUEUE',
        //         tktWithLoggedIn: (Number(auth?.user?.userId) === Number(payload?.oUserId) || Number(auth?.user?.userId) === Number(payload?.currUser))
        //     }
        // })
        history(`/view-helpdesk`, {
            state: {
                data: payload
            }
        })
    }

    const switchStreaming = (streamType) => {
        setStream(streamType)
    }

    const exportToCSV = () => {
        const fileName = "Helpdesk-report"
        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const fileExtension = ".xlsx";
        if (Object.keys(excelFilter)?.length > 0 || helpdeskSearchParams) {
            //  console.log('exporting here.....', excelFilter);
            post(properties.HELPDESK_API + '/export-excel', { searchParams: { ...excelFilter, ...helpdeskSearchParams } })
                .then((response) => {
                    const responseData = response?.data?.finalResultData
                    const statusData = response?.data?.statusData?.map((ele) => ele?.description);

                    const wb = {
                        Sheets: {},
                        SheetNames: []
                    };
                    const regerenerateOrder = (data) => {
                        const desiredOrder = ["username", ...statusData, "grandTotal"];
                        return data.map(entry => {
                            const reorderedEntry = {};
                            desiredOrder.forEach(key => {
                                reorderedEntry[key] = entry[key] || '';
                            });
                            return reorderedEntry;
                        });
                    }
                    for (const sheetName in responseData) {
                        const data = responseData[sheetName];

                        const reOrderedData = regerenerateOrder(data)

                        const ws = XLSX.utils.json_to_sheet(reOrderedData,
                            {
                                origin: 'A2',
                                skipHeader: false
                            });

                        XLSX.utils.sheet_add_aoa(ws, [[response?.message]], { origin: 'A1' });
                        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }];

                        // Set center alignment
                        ws['A1'].s = { alignment: { horizontal: 'center', vertical: 'center' } };

                        wb.Sheets[sheetName] = ws;
                        wb.SheetNames.push(sheetName);
                    }

                    const excelBuffer = XLSX.write(wb, {
                        bookType: "xlsx",
                        type: "array"
                    });

                    const dataBlob = new Blob([excelBuffer], { type: fileType });

                    FileSaver.saveAs(dataBlob, fileName + fileExtension);

                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            toast.error("Date/Project/User filter is required!");
        }
    };


    const clearFilter = (param, value) => {
        // console.log('helpdeskSearchParams------------>', helpdeskSearchParams)
        // console.log('searchParams------------>', searchParams)
        // console.log('param------------>', param)
        if (["project", "status", "severity"].includes(param)) {
            // helpdeskSearchParams[param] = helpdeskSearchParams[param].filter(x => x.value != value);
            searchParams[param] = searchParams[param].filter(x => x.value != value);
        } else {
            // helpdeskSearchParams[param] = null;
            searchParams[param] = null;
        }

        // setHelpdeskSearchParams({
        //     ...helpdeskSearchParams
        // })

        setSearchParams({
            ...searchParams
        })
    }

    const getSelectedFilters = () => {
        let ageing, project, status, currentUser, severity;
        if (searchParams?.fromDate || searchParams?.toDate) {
            let fromDate = searchParams?.fromDate;
            let toDate = searchParams?.toDate ? searchParams?.toDate : fromDate;
            dateRange.current = fromDate + " - " + toDate;
        }
        if (searchParams?.project?.length) project = searchParams?.project;
        if (searchParams?.status?.length) status = searchParams?.status;
        if (searchParams?.ageing?.value) ageing = searchParams?.ageing;
        if (searchParams?.currentUser?.value) currentUser = searchParams?.currentUser;
        if (searchParams?.severity?.length) severity = searchParams?.severity;

        return (
            <React.Fragment>
                {dateRange && (
                    <li style={{ fontSize: '15px' }}>
                        Date Range:
                        <span className="dash-filter-badge ml-1">{dateRange.current}
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
                {status && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Status: {status.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('status', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {ageing && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Ageing:
                        <span className="dash-filter-badge ml-2">{ageing.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('ageing', ageing.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
                {severity && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Severity: {severity.map((x, i) => (
                            <span className={`dash-filter-badge ml-2`}>{x.label}
                                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('severity', x.value)}><i className="fas fa-times"></i></span>
                            </span>
                        ))}
                    </li>
                )}
                {currentUser && (
                    <li style={{ fontSize: '15px', marginLeft: '5px' }}>
                        Ageing:
                        <span className="dash-filter-badge ml-2">{currentUser.label}
                            <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('currentUser', currentUser.value)}><i className="fas fa-times"></i></span>
                        </span>
                    </li>
                )}
            </React.Fragment>
        )
    }
    const componentRef = useRef()
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        onAfterPrint: () => document.title = 'dtWorks',
        pageStyle: pageStyle
    });


    // Check Permisions starts
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('HELPDEST_DASH');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);

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

    // Check Permision Ends

    return (
        <div className="content" ref={componentRef}>
            <div className="container-fluid pr-1">
                <div className="cnt-wrapper">
                    <div className="card-skeleton">
                        <div className="customer-skel mt-0">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="">
                                        <div className="tab-pane fade show active" id="me" role="tabpanel" aria-labelledby="me-tab">
                                            <div className="skle-swtab-sect">
                                                <div className="db-list mb-0 pl-0">
                                                    {/* <span className="skel-fr-sel-cust">
                                                        <div className="list-dashboard db-list-active skel-self-live">
                                                            {stream === "insightView" && (
                                                                <span className="db-title cursor-pointer" onClick={() => switchStreaming('liveStreamView')}>
                                                                    <img src={liveStreamPng} className="img-fluid pr-1" /> Switch to Live Stream
                                                                </span>
                                                            )}
                                                            {stream === "liveStreamView" && (
                                                                <span className="db-title cursor-pointer" onClick={() => switchStreaming('insightView')}>
                                                                    <img src={insightViewPng} className="img-fluid pr-1" /> Switch to Insight View
                                                                </span>
                                                            )}
                                                        </div>
                                                    </span> */}
                                                    <span className="skel-fr-sel-serv">
                                                        <div className="list-dashboard skel-informative-insights" style={{ display: "none" }}>
                                                            <span className="db-title">Helpdesk Overview</span>
                                                        </div>
                                                    </span>
                                                </div>
                                                <form className="form-inline">
                                                    {/* <button
                                                        type="button"
                                                        className="skel-btn-export"
                                                        onClick={() => handlePrint()}
                                                    >
                                                        Export
                                                    </button> */}
                                                    <span className="ml-1">Auto Refresh</span>
                                                    <div className="switchToggle ml-1">
                                                        <input id="switch1" type="checkbox" checked={isChecked} onChange={handleAutoRefresh} />
                                                        <label htmlFor="switch1">Toggle</label>
                                                    </div>
                                                    <select className="custom-select custom-select-sm ml-1" value={pageRefreshTime} onChange={handleSetRefreshTime} >
                                                        <option value="Set">Set</option>
                                                        <option value={Number(1)}>1 Min</option>
                                                        <option value={Number(5)}>5 Min</option>
                                                        <option value={Number(15)}>15 Min</option>
                                                        <option value={Number(30)}>30 Min</option>
                                                    </select>
                                                     {/* Share PDF via Email and WA stars here */}
                                                    {/* <div className='exportXlWrapper position-relative'>
                                                        <button type="button" class="skel-btn-export" onClick={toggleExportVisibility}>Export PDF<i class="fa fa-file-pdf ml-1" aria-hidden="true"></i></button>
                                                        {isExportVisible && (<div className='shareContainer position-absolute py-2'>
                                                            <div id="exportContainer">
                                                                <form action="">
                                                                    <div className="col-md-12 p-0">
                                                                        <div className="col">
                                                                            <button type="button" class="skel-btn-export ml-0 mb-1 w-100">Export Internal</button>
                                                                            <button type="button" class="skel-btn-export ml-0 mb-1 w-100">Export External</button>
                                                                            <button type="button" class="skel-btn-export ml-0 w-100">Export All</button>
                                                                        </div>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        </div>)}
                                                    </div> */}
                                                    {/*  hare PDF via Email and WA ends here */}
                                                    <span className="skel-fr-sel-cust" onClick={() => setFilterIsOpen(!filterIsOpen)}>
                                                        <div className="list-dashboard db-list-active skel-self cursor-pointer">
                                                            <span className="db-title" onClick={() => setShowFilter(!showFilter)}> Filter{" "} <img src={filterPng} className="img-fluid pl-1" />
                                                            </span>
                                                        </div>
                                                    </span>
                                                    {/* Share PDF via Email and WA stars here */}
                                                    {/* <div className='shareWrapper'>
                                                        <a className="skel-btn-shareskel-btn-share db-list-active list-dashboard skel-self skel-btn-submit" onClick={toggleShareVisibility}>
                                                            <span className='text-white'>Share
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-share ml-2" viewBox="0 0 16 16">
                                                                    <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
                                                                </svg>
                                                            </span> 
                                                        </a>
                                                        {isShareVisible && (<div className='shareContainer position-absolute py-2'>
                                                            <div className="tabbable">
                                                                <ul className="nav nav-tabs" id="shareTab" role="tablist">
                                                                    <li className="nav-item">
                                                                        <a className="nav-link active" id="emailTab" data-toggle="tab" href="#emailContainer" role="tab" aria-controls="emailContainer" aria-selected="true">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope mr-1" viewBox="0 0 16 16">
                                                                                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/>
                                                                            </svg>
                                                                            Email
                                                                        </a>
                                                                    </li>
                                                                    <li className="nav-item"> 
                                                                        <a className="nav-link" id="waTab" data-toggle="tab" href="#waContainer" role="tab" aria-controls="waContainer" aria-selected="false">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp mr-1" viewBox="0 0 16 16">
                                                                                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                                                                            </svg>
                                                                            WhatsApp
                                                                        </a>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                            <div className="tab-pane fade show active py-2" id="emailContainer" role="tabpanel" aria-labelledby="emailTab">
                                                                <form action="">
                                                                    <div className="col-md-12">
                                                                        <div className="col">
                                                                            <div className="form-group">
                                                                                <label className="control-label">Helpdesk Source<span className="text-danger font-20 pl-1 fld-imp mb-2">*</span></label>
                                                                                <div className="d-flex w-100">
                                                                                    <div class="custom-control custom-checkbox mr-2">
                                                                                        <input type="checkbox" class="custom-control-input" id="internalSrcEmail"/>
                                                                                        <label class="custom-control-label" for="internalSrcEmail">Internal</label>
                                                                                    </div>
                                                                                    <div class="custom-control custom-checkbox">
                                                                                        <input type="checkbox" class="custom-control-input" id="externalSrcEmail"/>
                                                                                        <label class="custom-control-label" for="externalSrcEmail">External</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col mt-2">
                                                                            <div className="form-group">
                                                                                <label className="control-label">To<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                                                                <input className="form-control w-100" placeholder="Enter Email ID" type="text"/>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col mt-2">
                                                                            <div className="form-group">
                                                                                <label className="control-label">Cc</label>
                                                                                <input className="form-control w-100" placeholder="Enter Email ID" type="text"/>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col mt-2">
                                                                            <div className="form-group">
                                                                                <label className="control-label">Message (optional)</label>
                                                                                <textarea name="share message" id="" rows={3} className='form-control w-100' placeholder='Anything They Should Know?'></textarea>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-12 pt-2 skel-btn-center-cmmn mt-2">
                                                                        <button type="button" class="skel-btn-cancel" onClick={toggleShareVisibility}>Cancel</button>
                                                                        <button type="button" class="skel-btn-submit">Share</button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <div className="tab-pane fade py-2" id="waContainer" role="tabpanel" aria-labelledby="waTab">
                                                                <form action="">
                                                                    <div className="col-md-12">
                                                                    <div className="col">
                                                                            <div className="form-group">
                                                                                <label className="control-label">Helpdesk Source<span className="text-danger font-20 pl-1 fld-imp mb-2">*</span></label>
                                                                                <div className="d-flex w-100">
                                                                                    <div class="custom-control custom-checkbox mr-2">
                                                                                        <input type="checkbox" class="custom-control-input" id="internalSrcWa"/>
                                                                                        <label class="custom-control-label" for="internalSrcWa">Internal</label>
                                                                                    </div>
                                                                                    <div class="custom-control custom-checkbox">
                                                                                        <input type="checkbox" class="custom-control-input" id="externalSrcWa"/>
                                                                                        <label class="custom-control-label" for="externalSrcWa">External</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col mt-2">
                                                                            <div className="form-group">
                                                                                <label className="control-label">Mobile Number<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                                                                <input className="form-control w-100" placeholder="Enter Mobile Number" type="text"/>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-12 pt-2 skel-btn-center-cmmn mt-2">
                                                                        <button type="button" class="skel-btn-cancel" onClick={toggleShareVisibility}>Cancel</button>
                                                                        <button type="button" class="skel-btn-submit">Share</button>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                        </div>)}
                                                    </div> */}
                                                    {/*  Share PDF via Email and WA ends here */}
                                                    {/* <button className="skel-btn-export" onClick={() => exportToCSV()}>Export Excel</button> */}
                                                </form>

                                            </div>
                                            <Filter
                                                data={{
                                                    showFilter,
                                                    isParentRefresh,
                                                    excelFilter, stream, helpdeskSearchParams
                                                }}
                                                handler={{
                                                    setShowFilter,
                                                    setSearchParams,
                                                    setHelpdeskSearchParams,
                                                    setIsParentRefresh,
                                                    setExcelFilter
                                                }}
                                            />
                                            <div className="skle-swtab-sect mt-0 mb-0">
                                                <ul className="skel-top-inter mt-1 mb-0">
                                                    {/* <div className="d-flex"> */}
                                                    {getSelectedFilters()}
                                                    {/* </div> */}
                                                </ul>
                                            </div>
                                            {stream === "insightView" && (
                                               

                                                <div className="skel-self-data">
                                                    {/* KPI */}
                                                    {/* <div className='row my-2 mx-lg-n1 service-360-tiles'>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton tr m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total<br /> Helpdesk Count</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">100</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton top m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total<br /> Open Helpdesk</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">50</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton oe m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="far fa-calendar-check-o"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total<br /> Closed Helpdesk</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">50                                
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton taa m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total <br />Escalated Helpdesk</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">20                                                                            
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton taa m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total Open<br />Escalated Helpdesk</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">20                                                                            
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='row my-2 mx-lg-n1 service-360-tiles'>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton taa m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Total <br />SLA Breached</p>
                                                                        <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">20                                                                            
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton tr m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Average<br /> Resolution Time</p>
                                                                        <p class="mb-0 font-weight-bold">12h 01m 30s</p>
                                                                        <span class="skel-small-info d-block">per last month </span>
                                                                    </div>
                                                                    
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton top m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Average<br /> Wait Time</p>
                                                                        <p class="mb-0 font-weight-bold">02h 33m 07s</p>
                                                                        <span class="skel-small-info d-block">per last month </span>
                                                                    </div>
                                                                    
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton oe m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="far fa-calendar-check-o"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Net Promoter Score (NPS)</p>
                                                                        <div class="skel-dashboard-lg-value-graph">
                                                                            <span class="timer skel-fnt-md-bold" data-speed="2000" data-to="95"> 0 </span> %
                                                                            <p class="skel-graph-positive mt-1">
                                                                                <img src="/dtworks-base/static/media/positive-up-arrow.295afbf6b4e6cc6541e7d706c8499eea.svg" class="img-fluid mr-1" />
                                                                                <span>0%</span>
                                                                            </p>                                                                            
                                                                        </div>
                                                                        <span class="skel-small-info">per last month </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="col-md px-lg-1">
                                                            <div class="cmmn-skeleton taa m-0 h-100">
                                                                <div class="row align-items-start">
                                                                    <div class="col-md-auto">
                                                                        <div class="icon">
                                                                            <i class="fa fa-dollar"></i>
                                                                        </div>
                                                                    </div>
                                                                    <div class="col-md pl-0">
                                                                        <p class="mb-0">Smart Assistance Resolved</p>
                                                                        <div class="skel-dashboard-lg-value-graph">
                                                                            <span class="timer skel-fnt-md-bold" data-speed="2000" data-to="95"> 0 </span> %
                                                                            <p class="skel-graph-positive mt-1">
                                                                                <img src="/dtworks-base/static/media/positive-up-arrow.295afbf6b4e6cc6541e7d706c8499eea.svg" class="img-fluid mr-1" />
                                                                                <span>0 %</span>
                                                                            </p>
                                                                        </div>
                                                                        <span class="skel-small-info">per last month </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div> */}
                                                    <div className="skel-interaction-dashboard-rht-base mb-4">
                                                        {(checkComponentPermission("AVG_RESOL_TIME") || checkComponentPermission("AVG_WAIT_TIME")) && <div className="row my-2 mx-lg-n1 service-360-tiles">
                                                       
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <div className="col-md-6 col-sm-6">
                                                                    <ResMttrWaiting
                                                                        data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }}
                                                                        handlers={{ handleOpenRightModal, checkComponentPermission }}
                                                                        loader={SuspenseFallbackLoader}
                                                                    />
                                                                </div>
                                                            </Suspense>

                                                            
                                                        </div>}
                                                        {checkComponentPermission("CUST_COMPL_SCORE") || checkComponentPermission("CUST_COMPL_RES_SCORE") && <div className="row mt-3">
                                                            {checkComponentPermission("CUST_COMPL_SCORE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <div className="col-md-6 col-sm-6">
                                                                    <CustomerComplaintScore
                                                                        data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }}
                                                                        loader={SuspenseFallbackLoader}
                                                                    />
                                                                </div>
                                                            </Suspense>}
                                                            {checkComponentPermission("CUST_COMPL_RES_SCORE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <div className="col-md-6">
                                                                    <CustomerComplaintResolutionScore
                                                                        data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }}
                                                                        loader={SuspenseFallbackLoader}
                                                                    />
                                                                </div>
                                                            </Suspense>}
                                                        </div>}
                                                        <div className="row mt-3">
                                                            {checkComponentPermission("HELPDESK_SUMMARY") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <HelpdeskSummary data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("HELPDESK_BY_STATUS") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ByStatus data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("HELPDESK_BY_SEVERITY") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <Severity data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                        
                                                            {checkComponentPermission("HELPDESK_BY_AGEING") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <Ageing data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("HELPDESK_BY_PROJECT") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ProjectWise data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("HELPDESK_BY_USERS") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <AgentWise data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                        
                                                            {checkComponentPermission("HELPDESK_BY_DEPT") && (
                                                                <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                    <ByDepartment data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                                </Suspense>
                                                            )}  

                                                            {/* Hepldesk Created Today */}
                                                            {/* <div className="col-md-6 mt-2">
                                                                <div className="cmmn-skeleton cmmn-skeleton-new">
                                                                    <div className="card-body">
                                                                        <div className="skel-dashboard-title-base">
                                                                            <span className="skel-header-title"> Helpdesk Created Today</span>
                                                                            <div className="skel-dashboards-icons">
                                                                                <span><i className="material-icons">refresh</i></span>
                                                                            </div>
                                                                        </div>
                                                                        <hr className="cmmn-hline" />
                                                                        <div id="cardCollpase5cz" className="mh-min-310">
                                                                            <table className="table table-hover mb-0 table-centered table-nowrap">
                                                                                <tbody><tr><td>
                                                                                    <h5 className="font-size-14 mb-0 skel-font-sm-bold"> User 1 </h5></td>
                                                                                    <td><p className="text-dark mb-0 cursor-pointer txt-underline"> 2 </p></td>
                                                                                </tr>
                                                                                    <tr><td><h5 className="font-size-14 mb-0 skel-font-sm-bold"> User 2 </h5></td>
                                                                                        <td><p className="text-dark mb-0 cursor-pointer txt-underline"> 10 </p></td>
                                                                                    </tr>
                                                                                    <tr><td><h5 className="font-size-14 mb-0 skel-font-sm-bold"> User 3 </h5></td>
                                                                                        <td><p className="text-dark mb-0 cursor-pointer txt-underline"> 2 </p></td></tr>
                                                                                    <tr><td><h5 className="font-size-14 mb-0 skel-font-sm-bold"> User 4 </h5></td>
                                                                                        <td><p className="text-dark mb-0 cursor-pointer txt-underline"> 1 </p></td></tr>
                                                                                    <tr><td><h5 className="font-size-14 mb-0 skel-font-sm-bold"> User 5 </h5></td>
                                                                                        <td><p className="text-dark mb-0 cursor-pointer txt-underline"> 2 </p></td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div> */}
                                                            {checkComponentPermission("HELPDESK_BY_PENDING") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <SupportTicketsPending data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("HELPDESK_BY_CUST") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <CustomerType data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            
                                                            {/* <Trend data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ setIsRightModalOpen }} loader={SuspenseFallbackLoader} /> */}
                                                            {/* <HourlyTickets data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ setIsRightModalOpen }} loader={SuspenseFallbackLoader} /> */}
                                                       
                                                            {checkComponentPermission("BLANK_EXP_DATE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <BlankExpectedDateCompletionWise data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                            {checkComponentPermission("EXP_DATE_COMPL_SLA") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ExpectedDateOfCompletionBreachSLA data={{ searchParams, helpdeskSearchParams, isParentRefresh, modalStyle }} handlers={{ handleOpenRightModal }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {stream === "liveStreamView" && (
                                                <div className="skel-informative-data">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ByProject data={{ searchParams, helpdeskSearchParams }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ByStatusLive data={{ searchParams, helpdeskSearchParams }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>
                                                        </div>
                                                    </div>
                                                    <div className="row mt-3">
                                                        <div className="col-md-6">
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <ByType data={{ searchParams, helpdeskSearchParams }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <Suspense fallback={<SuspenseFallbackLoader />}>
                                                                <BySeverity data={{ searchParams, helpdeskSearchParams }} loader={SuspenseFallbackLoader} />
                                                            </Suspense>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default HelpdeskDashboard;