import React, { useEffect, useState, useRef, Suspense, useContext, useCallback } from "react";
import LiveStream from "../../assets/images/livestream.svg";
import DashboardIcons from "../../assets/images/dashboard-icons.svg";
import FilterBtn from "../../assets/images/filter-btn.svg";
import { toast } from "react-toastify";
import { unstable_batchedUpdates } from "react-dom";
import { InteractionDashboardContext, AppContext } from "../../AppContext";
import moment from "moment";
import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import Filter from "./filter";
import SuspenseFallbackLoader from "../../common/components/SuspenseFallbackLoader";
import CustomerComplaintScore from "./customer-complaint-score";
import CustomerComplaintResolutionScore from "./customer-complaint-resolution-score";
import { useReactToPrint } from 'react-to-print';
import { pageStyle } from "../../common/util/util";
import ExportDashboard from "./exportDashboard";
import { getPermissions } from '../../common/util/util';
const Overview = React.lazy(() => import("./overview"));
const Priority = React.lazy(() => import("./by-priority"));
const StatementWise = React.lazy(() => import("./statement-wise"));
const AgeingVsFollowups = React.lazy(() => import("./ageing-vs-followups"));
const ResMttrWaiting = React.lazy(() => import("./res-mttr-waiting"));
const CategoryType = React.lazy(() => import("./category-and-type"));
const ProjectWise = React.lazy(() => import("./project-wise"));
const AgentWise = React.lazy(() => import("./agent-wise"));
const DeptVsRole = React.lazy(() => import("./dept-vs-role"));
const CustomerWise = React.lazy(() => import("./customer-wise"));
const LocationWise = React.lazy(() => import("./location-wise"));
const NetCsatChamp = React.lazy(() => import("./net-csat-champ"));
const StatusWise = React.lazy(() => import("./status-wise"));
const TypeWise = React.lazy(() => import("./type-wise"));
const ChannelWise = React.lazy(() => import("./channel-wise"));
const LiveOverview = React.lazy(() => import("./live/overview"));
const LivePriority = React.lazy(() => import("./live/priority"));
const LiveType = React.lazy(() => import("./live/type"));
const LiveStatus = React.lazy(() => import("./live/status"));
const LiveProjectWise = React.lazy(() => import("./live/project-wise-live"));
const LiveCustomerWise = React.lazy(() => import("./live/customer-wise-live"));
const BlankExpectedDateCompletionInteraction = React.lazy(() => import("./BlankExpectedDateCompletionInteraction"));
const ExpectedDateOfCompletionBreachSLA = React.lazy(() => import("./ExpectedDateOfCompletionBreachSLA"));
const CreatedInteractionReport = React.lazy(() => import("./created-interaction-report"));

const InteractionDashboard = () => {
  let { auth, appConfig } = useContext(AppContext);
  const [masterLookupData, setMasterLookupData] = useState([]);
  const [showRealTime, setShowRealTime] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const startDate = moment().subtract(5, 'months').startOf('month').format('YYYY-MM-DD');
  const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');
  const [searchParams, setSearchParams] = useState({
    fromDate: startDate,
    toDate: endDate
  });
  const [excelFilter, setExcelFilter] = useState({});
  const [isChecked, setIsChecked] = useState(false);
  const [pageRefreshTime, setPageRefreshTime] = useState(1);
  const [isParentRefresh, setIsParentRefresh] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [lastDataRefreshTime, setLastDataRefreshTime] = useState({
    AgeingVsFollowups: moment().format("DD-MM-YYYY HH:mm:ss"),
    StatusWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    TypeWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    Priority: moment().format("DD-MM-YYYY HH:mm:ss"),
    CategoryType: moment().format("DD-MM-YYYY HH:mm:ss"),
    ProjectWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    AgentWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    DeptVsRole: moment().format("DD-MM-YYYY HH:mm:ss"),
    CustomerWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    LocationWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    StatementWise: moment().format("DD-MM-YYYY HH:mm:ss"),
    ChannelWise: moment().format("DD-MM-YYYY HH:mm:ss"),
  });

  const contextProvider = {
    data: {
      lastDataRefreshTime,
      showFilter,
      searchParams,
      isParentRefresh,
      masterLookupData,
    },
    handlers: {
      setLastDataRefreshTime,
      setShowFilter,
      setSearchParams,
    },
  };



  const toggleRealTimeView = () => {
    setShowRealTime(!showRealTime);
  };

  const handleAutoRefresh = (event) => {
    // console.log("here live streming");
    if (!pageRefreshTime) {
      toast.error("Refresh Time Is Require!");
      return;
    }
    setIsChecked(!isChecked);
    // setIsChecked(event.target.checked);
  };

  const handleSetRefreshTime = (e) => {
    unstable_batchedUpdates(() => {
      setIsChecked(false);
      setPageRefreshTime(parseInt(e.target.value));
    });
  };

  useEffect(() => {
    get(
      properties.MASTER_API +
      "/lookup?searchParam=code_type&valueParam=PROJECT,INTERACTION_STATUS,PRIORITY,SEVERITY,INTXN_CATEGORY,INTXN_TYPE,PROD_SUB_TYPE,SERVICE_TYPE,TICKET_CHANNEL"
    )
      .then((response) => {
        const { data } = response;
        setMasterLookupData(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const clearFilter = (param, value) => {
    if (["project", "channel", "priority", "status", "intxnCat", "intxnType", "serviceCat"].includes(param)) {
      searchParams[param] = searchParams[param].filter(x => x.value != value);
    } else {
      searchParams[param] = null;
    }

    setSearchParams({
      ...searchParams
    })
  }

  const getSelectedFilters = () => {
    let ageing, channel, dateRange, intxnCat, intxnType, priority, project, serviceCat, serviceType, status, currentUser;
    if (searchParams?.fromDate || searchParams?.toDate) {
      let fromDate = searchParams?.fromDate;
      let toDate = searchParams?.toDate ? searchParams?.toDate : fromDate;
      dateRange = fromDate + " - " + toDate;
    }
    if (searchParams?.project?.length) project = searchParams?.project;
    if (searchParams?.channel?.length) channel = searchParams?.channel;
    if (searchParams?.priority?.value) priority = searchParams?.priority;
    if (searchParams?.status?.length) status = searchParams?.status;
    if (searchParams?.intxnCat?.length) intxnCat = searchParams?.intxnCat;
    if (searchParams?.intxnType?.length) intxnType = searchParams?.intxnType;
    if (searchParams?.serviceCat?.length) serviceCat = searchParams?.serviceCat;
    if (searchParams?.serviceType?.length) serviceType = searchParams?.serviceType;
    if (searchParams?.ageing?.value) ageing = searchParams?.ageing;
    if (searchParams?.currentUser?.value) currentUser = searchParams?.currentUser;

    return (
      <React.Fragment>
        {dateRange && checkComponentPermission("DATE_RANGE") && (
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
        {priority && (
          <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            Priority: {priority.map((x, i) => (
              <span className={`dash-filter-badge ml-2`}>{x.label}
                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('priority', x.value)}><i className="fas fa-times"></i></span>
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
        {intxnCat && (
          <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            Interaction Category: {intxnCat.map((x, i) => (
              <span className={`dash-filter-badge ml-2`}>{x.label}
                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('intxnCat', x.value)}><i className="fas fa-times"></i></span>
              </span>
            ))}
          </li>
        )}
        {intxnType && (
          <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            Interaction Type: {intxnType.map((x, i) => (
              <span className={`dash-filter-badge ml-2}`}>{x.label}
                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('intxnType', x.value)}><i className="fas fa-times"></i></span>
              </span>
            ))}
          </li>
        )}
        {serviceCat && (
          <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            Service Category: {serviceCat.map((x, i) => (
              <span className={`dash-filter-badge ml-2`}>{x.label}
                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('serviceCat', x.value)}><i className="fas fa-times"></i></span>
              </span>
            ))}
          </li>
        )}
        {serviceType && (
          <li style={{ fontSize: '15px', marginLeft: '5px' }}>
            Service Type: {serviceType.map((x, i) => (
              <span className={`dash-filter-badge ml-2`}>{x.label}
                <span className="dash-filter-badge-clear cursor-pointer ml-1 mr-1" onClick={() => clearFilter('serviceType', x.value)}><i className="fas fa-times"></i></span>
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

  useEffect(() => {
    unstable_batchedUpdates(() => {
      if (pageRefreshTime && typeof pageRefreshTime === "number") {
        const intervalId = setInterval(() => {
          if (isChecked) {
            // const currentTime = moment().format('DD-MM-YYYY HH:mm:ss')
            setIsParentRefresh(!isParentRefresh);
            const currentTime = moment().format("DD-MM-YYYY HH:mm:ss");
            setLastDataRefreshTime({
              assignedToMe: currentTime,
              assignedInteraction: currentTime,
              assignedOrder: currentTime,
              assignedAppointment: currentTime,
              assignedToTeamInteraction: currentTime,
              assignedToTeamOrder: currentTime,
              assignedToTeamAppointment: currentTime,
              performanceActivity: currentTime,
              interactionHistory: currentTime,
              orderHistory: currentTime,
              appoinmentHistory: currentTime,
              performanceActivityTeam: currentTime,
              interactionHistoryTeam: currentTime,
              orderHistoryTeam: currentTime,
              appoinmentHistoryTeam: currentTime,
              TopPerformanceInteraction: currentTime,
              TopPerformanceInteractionTeam: currentTime,
              TopPerformanceOrder: currentTime,
              TopPerformanceOrderTeam: currentTime,
              TopFivePerformer: currentTime,
              TopFivePerformerTeam: currentTime,
              TopPerformanceChat: currentTime,
              TopPerformanceChatTeam: currentTime,
              requestAssignedToMe: currentTime,
              requestAssignedToTeam: currentTime,
            });
          }
        }, Number(pageRefreshTime) * 60 * 1000);
        // console.log("Component refreshed!-------->", pageRefreshTime);
        // return () => clearInterval(intervalId);
      }
    });
  }, [isChecked]);

  const exportToCSV = () => {
    const fileName = "Interaction-report";
    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const fileExtension = ".xlsx";
    if (Object.keys(excelFilter)?.length > 0) {
      // console.log("exporting here.....", excelFilter);
      post(properties.INTERACTION_API + "/export-excel", {
        searchParams: excelFilter,
      })
        .then((response) => {
          const responseData = response?.data?.finalResultData;
          const statusData = response?.data?.statusData?.map(
            (ele) => ele?.description
          );

          const wb = {
            Sheets: {},
            SheetNames: [],
          };
          const regerenerateOrder = (data) => {
            const desiredOrder = ["username", ...statusData, "grandTotal"];
            return data?.map((entry) => {
              const reorderedEntry = {};
              desiredOrder?.forEach((key) => {
                reorderedEntry[key] = entry[key] || "";
              });
              return reorderedEntry;
            });
          };
          for (const sheetName in responseData) {
            const data = responseData[sheetName];

            const reOrderedData = regerenerateOrder(data);

            const ws = XLSX.utils.json_to_sheet(reOrderedData, {
              origin: "A2",
              skipHeader: false,
            });

            XLSX.utils.sheet_add_aoa(ws, [[response?.message]], {
              origin: "A1",
            });
            ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 15 } }];

            // Set center alignment
            ws["A1"].s = {
              alignment: { horizontal: "center", vertical: "center" },
            };

            wb.Sheets[sheetName] = ws;
            wb.SheetNames.push(sheetName);
          }

          const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
          });

          const dataBlob = new Blob([excelBuffer], { type: fileType });

          FileSaver.saveAs(dataBlob, fileName + fileExtension);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      toast.error("Date/Project/User filter is required!");
    }
  };
  const componentRef = useRef()
  const pdfRef = useRef()
  const handlePrintStart = () => {
    setPdf(true)
    setTimeout(() => {
      handlePrint()
    }, 1000);
  };
  const handlePrint = useReactToPrint({
    content: () => componentRef?.current,
    onAfterPrint: () => {
      document.title = 'dtWorks';
      setPdf(false)
    },
    pageStyle: pageStyle
  })


  const setExportData = useCallback((name, value) => {
    pdfRef.current = { [name]: value, ...pdfRef.current }
  }, [pdfRef.current])


  // Check Permisions starts
  const [permission, setPermission] = useState({})
  const [componentPermission, setComponentPermission] = useState({})
  useEffect(() => {
    const fetchData = async () => {
      try {
        const permissions = await getPermissions('INTXN_DASH');
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
    <InteractionDashboardContext.Provider value={contextProvider}>
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

                          <div className="d-flex">
                            {/* {getSelectedFilters()} */}
                          </div>

                          {/* <div className="db-list mb-0 pl-0">
                            <div
                              className="list-dashboard db-list-active cursor-pointer"
                              onClick={toggleRealTimeView}
                            >
                              <span className="db-title">
                                {!showRealTime ? (
                                  <React.Fragment>
                                    <img
                                      src={LiveStream}
                                      className="img-fluid pr-1"
                                    />
                                    Switch to Live Stream
                                  </React.Fragment>
                                ) : (
                                  <React.Fragment>
                                    <img
                                      src={DashboardIcons}
                                      className="img-fluid pr-1"
                                    />
                                    Switch to Insight View
                                  </React.Fragment>
                                )}
                              </span>
                            </div>
                          </div> */}
                          <form className="form-inline" style={{ justifyContent: 'flex-end' }}>
                          
                              {checkComponentPermission("AUTO_REFRESH") && <><span className="ml-1">Auto Refresh</span>
                              <div className="switchToggle ml-1">
                                <input
                                  id="switch1"
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={handleAutoRefresh}
                                />
                                <label htmlFor="switch1">Toggle</label>
                              </div>
                              <select
                                className="custom-select custom-select-sm ml-1"
                                value={pageRefreshTime}
                                onChange={handleSetRefreshTime}
                              >
                                <option value="Set">Set</option>
                                <option value={Number(1)}>1 Min</option>
                                <option value={Number(5)}>5 Min</option>
                                <option value={Number(15)}>15 Min</option>
                                <option value={Number(30)}>30 Min</option>
                              </select>
                            </>}
                            {checkComponentPermission("EXPORT") && <button type="button" className="skel-btn-export" onClick={() => handlePrintStart()}>Export PDF 
                          <i className="fa fa-file-pdf ml-1" aria-hidden="true"></i></button>}
                            {checkComponentPermission("FILTER") && <div className="db-list mb-0 pl-1">
                              <a
                                className="skel-fr-sel-cust cursor-pointer"
                                onClick={() => setShowFilter(!showFilter)}
                              >
                                <div className="list-dashboard db-list-active skel-self skel-btn-submit">
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

                          {/* <button
                            className="skel-btn-export"
                            onClick={() => exportToCSV()}
                          >
                            Export Excel
                          </button> */}
                        </div>
                        {checkComponentPermission("FILTER") && <Filter
                          data={{
                            showFilter,
                            searchParams,
                            isParentRefresh,
                            excelFilter,
                            showRealTime,
                          }}
                          handler={{
                            setShowFilter,
                            setSearchParams,
                            isParentRefresh,
                            setExcelFilter,
                          }}
                        />}
                        <div className="skle-swtab-sect mt-0 mb-0">
                          <ul className="skel-top-inter mt-1 mb-0">
                            {/* <div className="d-flex"> */}
                            {getSelectedFilters()}
                            {/* </div> */}
                          </ul>
                        </div>
                        {!showRealTime ? (
                          <React.Fragment>
                            {/* <div class="page-header">&nbsp;</div>
                            <div class="page-footer">&nbsp;</div> */}
                            <div className="skel-self-data">

                              <div className="skel-interaction-dashboard-rht-base page-break">
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
                                                  <p class="mb-0">Total<br /> Interaction Count</p>
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
                                                  <p class="mb-0">Total<br /> Open Interaction</p>
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
                                                  <p class="mb-0">Total<br /> Closed Interaction</p>
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
                                                  <p class="mb-0">Total <br />SLA Breached</p>
                                                  <p class="mb-0 font-weight-bold text-dark mb-0 cursor-pointer txt-underline">20                                                                            
                                                  </p>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                </div>

                                <div className='row my-2 mx-lg-n1 service-360-tiles'>
                                    <div class="col-md px-lg-1">
                                        <div class="cmmn-skeleton tr m-0 h-100">
                                            <div class="row align-items-start">
                                                <div class="col-md-auto">
                                                    <div class="icon">
                                                        <i class="fa fa-dollar"></i>
                                                    </div>
                                                </div>
                                                <div class="col-md pl-0">
                                                    <p class="mb-0">Avgerage<br /> Resolution Time</p>
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
                                {(
                                  checkComponentPermission("AVG_RESOL_TIME")
                                  || checkComponentPermission("AVG_WAIT_TIME")
                                  || checkComponentPermission("NPS")
                                  || checkComponentPermission("SMART_RESOLVED")
                                ) && <div className="row">
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <ResMttrWaiting
                                          data={{ searchParams, isParentRefresh }}
                                          loader={SuspenseFallbackLoader}
                                          handler={{ checkComponentPermission }}
                                        />
                                      </div>
                                    </Suspense>
                                    <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <NetCsatChamp
                                          data={{ searchParams, isParentRefresh }}
                                          handler={{ checkComponentPermission }}
                                        />
                                      </div>
                                    </Suspense>
                                  </div>}
                                {(checkComponentPermission("CUST_COMPL_SCORE") || checkComponentPermission("CUST_COMPL_RES_SCORE")) &&
                                  <div className="row">
                                    {checkComponentPermission("CUST_COMPL_SCORE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <CustomerComplaintScore
                                          data={{ searchParams, isParentRefresh }}
                                          loader={SuspenseFallbackLoader}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("CUST_COMPL_RES_SCORE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <CustomerComplaintResolutionScore
                                          data={{ searchParams, isParentRefresh }}
                                          loader={SuspenseFallbackLoader}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>
                                }

                                {(checkComponentPermission("OVERVIEW") ||
                                  checkComponentPermission("INTXN_BY_AGEING")) && <div className="row mt-3">
                                    {checkComponentPermission("OVERVIEW") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <Overview
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          setExportData={setExportData}
                                          // setExportData={componentRef?.current?.setExportData}
                                          loader={SuspenseFallbackLoader}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_AGEING") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <AgeingVsFollowups
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        // setExportData={componentRef?.current?.setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}

                                {(checkComponentPermission("INTXN_BY_STAUS") ||
                                  checkComponentPermission("INTXN_BY_TYPE") ||
                                  checkComponentPermission("INTXN_BY_PRIORITY")) && <div className="row mt-3">
                                    {checkComponentPermission("INTXN_BY_STAUS") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <StatusWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_TYPE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <TypeWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_PRIORITY") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <Priority
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}

                                {(
                                  checkComponentPermission("TOP_INTXN_CATGRY") ||
                                  checkComponentPermission("TOP_INTXN_TYPE") ||
                                  checkComponentPermission("TOP_SRVC_CATEGORY")
                                ) && <div className="row mt-3 page-break">
                                    {checkComponentPermission("TOP_INTXN_CATGRY") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <CategoryType
                                          data={{
                                            height: "350px",
                                            mode: "interaction",
                                            level: "category",
                                            searchParams,
                                            isParentRefresh,
                                            color: "#5470c6",
                                            apiCall: true
                                          }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("TOP_INTXN_TYPE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <CategoryType
                                          data={{
                                            height: "350px",
                                            mode: "interaction",
                                            level: "type",
                                            searchParams,
                                            isParentRefresh,
                                            color: "#26a0fc",
                                            apiCall: true
                                          }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("TOP_SRVC_CATEGORY") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <CategoryType
                                          data={{
                                            height: "350px",
                                            mode: "service",
                                            level: "category",
                                            searchParams,
                                            isParentRefresh,
                                            color: "#5470c6",
                                            apiCall: true
                                          }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}

                                {(
                                  checkComponentPermission("TOP_SRVC_TYPE") ||
                                  checkComponentPermission("INTXN_BY_PROJECT") ||
                                  checkComponentPermission("INTXN_BY_USERS")
                                ) && <div className="row mt-3">
                                    {checkComponentPermission("TOP_SRVC_TYPE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <CategoryType
                                          data={{
                                            height: "240px",
                                            mode: "service",
                                            level: "type",
                                            searchParams,
                                            isParentRefresh,
                                            color: "#26a0fc",
                                            apiCall: true
                                          }}
                                          setExportData={setExportData}
                                          loader={SuspenseFallbackLoader}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_PROJECT") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <ProjectWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_USERS") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-4">
                                        <AgentWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}

                                {(checkComponentPermission("INTXN_BY_DEPT_ROLE") ||
                                  checkComponentPermission("INTXN_BY_TEAM")) && <div className="row mt-3">
                                    {checkComponentPermission("INTXN_BY_DEPT_ROLE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <DeptVsRole
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_TEAM") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <CustomerWise
                                          data={{
                                            searchParams,
                                            isParentRefresh,
                                            apiCall: true
                                          }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}

                                {(checkComponentPermission("INTXN_BY_STATE") ||
                                  checkComponentPermission("INTXN_BY_CHANNEL")) && <div className="row mt-3 page-break">
                                    {checkComponentPermission("INTXN_BY_STATE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-7 col-sm-7">
                                        <StatementWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("INTXN_BY_CHANNEL") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-5 col-sm-5">
                                        <ChannelWise
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}
                                {
                                  (checkComponentPermission("BLANK_EXP_DATE") || checkComponentPermission("EXP_DATE_COMPL_SLA")) && <div className="row mt-3">
                                    {checkComponentPermission("BLANK_EXP_DATE") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <BlankExpectedDateCompletionInteraction
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                    {checkComponentPermission("EXP_DATE_COMPL_SLA") && <Suspense fallback={<SuspenseFallbackLoader />}>
                                      <div className="col-md-6 col-sm-6">
                                        <ExpectedDateOfCompletionBreachSLA
                                          data={{ searchParams, isParentRefresh, apiCall: true }}
                                          loader={SuspenseFallbackLoader}
                                          setExportData={setExportData}
                                        />
                                      </div>
                                    </Suspense>}
                                  </div>}
                                {/* <div className="row mt-3">
                                  <Suspense fallback={<SuspenseFallbackLoader />}>
                                    <div className="col-md-6">
                                      <CreatedInteractionReport data={{ searchParams, isParentRefresh }}loader={SuspenseFallbackLoader} />
                                    </div>
                                  </Suspense>
                                </div> */}
                              </div>
                            </div>
                          </React.Fragment>
                        ) : (
                          <div className="skel-informative-data">
                            <div className="row">
                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LiveOverview
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>
                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LiveType
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>
                            </div>
                            <div className="row mt-3">
                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LiveStatus
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>

                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LivePriority
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>
                            </div>
                            <div className="row mt-3">
                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LiveProjectWise
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>
                              <Suspense fallback={<SuspenseFallbackLoader />}>
                                <div className="col-md-6">
                                  <LiveCustomerWise
                                    data={{ searchParams, isParentRefresh }}
                                    loader={SuspenseFallbackLoader}
                                  />
                                </div>
                              </Suspense>
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
        <ExportDashboard ref={componentRef} pdf={pdf} data={pdfRef?.current} />
      </div>
    </InteractionDashboardContext.Provider>
  );
};

export default InteractionDashboard;
