import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import PositiveUpArrow from "../../assets/images/positive-up-arrow.svg";
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { groupBy } from '../../common/util/util';
import { useHistory }from '../../common/util/history';
import { showLoader, hideLoader } from '../../common/lazyLoader';
import { toast } from 'react-toastify';
import { unstable_batchedUpdates } from 'react-dom';
// import { hideSpinner, showSpinner } from 'common/spinner';

const Overview = (props) => {
    console.log('overview renders---')
    const history = useHistory()
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data
    const [isRefresh, setIsRefresh] = useState(false);
    const [statusData, setStatusData] = useState([]);
    const [statusListData, setStatusListData] = useState([]);
    const chartRef = useRef(null);
    const [tableData, setTableData] = useState([]);
    const [helpdeskToInteraction, setHelpdeskToInteraction] = useState([]);
    const [helpdeskToInteractionDetails, setHelpdeskToInteractionDetails] = useState([]);
    const [wipTabs, setWipTabs] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isWipTblOpen, setIsWipTblOpen] = useState(false);
    const [isHelpdeskToInteractionOpen, setIsHelpdeskToInteractionOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState();

    const [columns] = useState([
        {
            Header: "Interaction No",
            accessor: "oIntxnNo",
            disableFilters: true,
            id: "oIntxnNo"
        },
        {
            Header: "Helpdesk Id",
            accessor: "oHelpdeskNo",
            disableFilters: true,
            id: "oHelpdeskNo"
        },
        {
            Header: "Interaction Category",
            accessor: "oInteractionCategory",
            disableFilters: true,
        },
        {
            Header: "Interaction Type",
            accessor: "oInteractionType",
            disableFilters: true,
        },
        {
            Header: "Service Category",
            accessor: "oServiceCategory",
            disableFilters: true,
        },
        {
            Header: "Service Type",
            accessor: "oServiceType",
            disableFilters: true,
        },
        {
            Header: "Priority",
            accessor: "oPriority",
            disableFilters: true,
        },
        {
            Header: "Project",
            accessor: "oProject",
            disableFilters: true,
        },
        {
            Header: "Status",
            accessor: "oStatus",
            disableFilters: true,
        },
        {
            Header: "Channel",
            accessor: "oChannel",
            disableFilters: true,
        },
        {
            Header: "Current User",
            accessor: "oCurrUserDesc",
            id: "oCurrUser",
            disableFilters: true,
        },
        {
            Header: "Created User",
            accessor: "oCreatedUser",
            disableFilters: true,
        },
        {
            Header: "Created At",
            accessor: "oCreatedAt",
            disableFilters: true,
            id: "oCreatedAt"
        }
    ]);

    const fetchInteractionDetail = (intxnNo) => {
        setLoading(true)
        slowGet(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'interactionDashboard'
                }
                history(`/interaction360`, { state: {data} })
            } else {
                //
            }
        }).catch(error => {
            // console.log(error);
        }).finally(() => setLoading(false));
    }

    const fetchHelpdeskDetail = (value) => {
        setLoading(true)
        slowGet(`${properties.HELPDESK_API}/search?q=${value}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'interactionDashboard'
                }
                history(`/view-helpdesk`, { state: {data} })
            } else {
                //
            }
        }).catch(error => {
            // console.log(error);
        }).finally(() => setLoading(false));
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oIntxnNo") {
            return (<span onClick={() => fetchInteractionDetail(cell.value)} style={{ cursor: 'pointer', color: 'rgb(80, 154, 222)' }}>{cell.value}</span>);
        }
        if (cell.column.id === "oHelpdeskNo") {
            return (<span onClick={() => fetchHelpdeskDetail(cell.value)} style={{ cursor: 'pointer', color: 'rgb(80, 154, 222)' }}>{cell.value}</span>);
        }
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        } else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    const getUniqueRecords = (rows, uniqueKey) => [...new Map(rows.map(item => [item[uniqueKey], item])).values()];

    const getStatusWiseData = (status) => {
        setSelectedStatus(status)
        const filteredStatusData = statusListData?.filter((ele) => !["NEW", "CANCELLED", "CLOSED"].includes(ele?.oStatusCode))
        let records = getUniqueRecords(filteredStatusData?.filter((ele) => ele?.oStatusCode === status), 'oIntxnNo');
        records.sort((a, b) => {
            return a.oIntxnId - b.oIntxnId;
        });
        setTableData(records)
    }

    const countStatusClicked = (items, status) => {
        let records = getUniqueRecords(items, 'oIntxnNo');
        records.sort((a, b) => {
            return a.oIntxnId - b.oIntxnId;
        });
        setTableData(records);

        if (status == "WIP") {
            const tabs = items?.map((ele) => {
                return { code: ele?.oStatusCode, description: ele?.oStatus }
            });
            let wips = Array.from(new Set(tabs.map(JSON.stringify))).map(JSON.parse);
            setWipTabs(wips);
            setSelectedStatus(wips?.[0]?.code);
            setIsWipTblOpen({ ...isWipTblOpen, view: true });
        } else {
            setIsOpen({ ...isOpen, view: true })
        }
    }

    const showHelpdeskTointeractionDetails = () => {
        let items = statusListData?.filter(x => x.oHelpdeskId != null && !["CANCELLED", "CLOSED"].includes(x.oStatusCode));
        setHelpdeskToInteractionDetails(items);
        setIsHelpdeskToInteractionOpen({ ...isHelpdeskToInteractionOpen, view: true })
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let overview = {}
                const statusDataResp = await slowPost(properties.INTERACTION_API + "/by-status/count", { searchParams });
                if (statusDataResp?.status === 200) {
                    overview['statusData'] = statusDataResp?.data?.rows ?? []
                    setStatusData(statusDataResp?.data?.rows ?? []);
                }

                const statusListDataResp = await slowPost(properties.INTERACTION_API + "/by-status/list", { searchParams });
                if (statusListDataResp?.status === 200) {
                    let items = statusListDataResp?.data?.rows?.filter(x => x.oHelpdeskId != null && !["CANCELLED", "CLOSED"].includes(x.oStatusCode));
                    overview['helpdeskToInteraction'] = items ?? []
                    overview['statusListData'] = statusListDataResp?.data?.rows ?? []
                    setHelpdeskToInteraction(items ?? []);
                    setStatusListData(statusListDataResp?.data?.rows ?? []);
                }
                props?.setExportData?.('overview', overview)
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        if (apiCall) fetchData(); setLoading(false);

    }, [isRefresh, searchParams, isParentRefresh]);
    
    useEffect(() => {
        let { helpdeskToInteraction, statusData, statusListData } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (helpdeskToInteraction) setHelpdeskToInteraction(helpdeskToInteraction);
            if (statusData) setStatusListData(statusListData);
            if (statusListData) setStatusData(statusData);
        })
    }, [exportData])

    useEffect(() => {
        if (!loading && chartRef.current) {
            const chartDom = chartRef.current;
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

            const groupedData = groupBy(statusListData.map(x => ({ ...x, oCreatedAt: moment(x.oCreatedAt).format("DD MMM") })), "oCreatedAt");
            const xAxisLabels = Object.keys(groupedData);
            xAxisLabels.sort(function (a, b) {
                return new Date(`${a}`) - new Date(`${b}`);
            });
            // console.log("xAxisLabels ==> ", xAxisLabels);

            const xAxisData = [];
            for (let index = 0; index < xAxisLabels.length; index++) {
                const item = groupedData[xAxisLabels[index]];
                xAxisData.push({
                    value: Number(item?.length ?? 0),
                    meta: {
                        createdAt: xAxisLabels[index],
                        statusData: [Object.fromEntries(Object.entries(groupedData[xAxisLabels[index]].reduce((acc, { oStatus }) => (acc[oStatus] = (acc[oStatus] || 0) + 1, acc), {})))]
                    }
                })
            }

            const option = {
                title: {
                    show: statusData.length === 0,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No interactions found",
                    left: "center",
                    top: "center"
                },
                tooltip: {
                    trigger: "axis",
                    formatter: function (params) {
                        if (params[0]?.data?.meta?.statusData) {
                            const statusCounts = params[0].data.meta.statusData[0];
                            const total = Object.values(statusCounts).reduce((acc, val) => acc + val, 0);
                            const statusEntries = Object.entries(statusCounts).map(([key, value]) => `${key}: ${value}`);
                            let htmlContent = "";
                            statusEntries.forEach((element) => {
                                htmlContent += `<li><i className="fas fa-male text-info mx-2"></i>${element}</li>`
                            })
                            return `
                            <div className="container">
                            <div className="row">
                                <div className="col-12 col-md-6">
                                <ul className="list-group">
                                <li><i className="fas fa-male text-info mx-2"></i>Total Interation: ${total}</li>
                                <hr/>
                                    ` + htmlContent + `
                                </ul>
                                </div>
                            </div>
                            </div>
                            `;
                        }
                        return "";
                    }
                },
                xAxis: {
                    type: 'category',
                    data: xAxisLabels
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        data: xAxisData,
                        type: 'line',
                        smooth: true,
                        color: '#1C64F2',
                        areaStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                {
                                    offset: 1,
                                    color: 'rgba(28,100,242,0)'
                                },
                                {
                                    offset: 0,
                                    color: 'rgba(28,100,241,0.4)'
                                }
                            ])
                        }
                    }
                ]
            };
            if (option && typeof option === 'object') {
                myChart.setOption(option);
            }

            window.addEventListener('resize', myChart.resize);

            return () => {
                window.removeEventListener('resize', myChart.resize);
                myChart.dispose();
            };
        }
    }, [statusListData]);

    const colorClasses = {
        status: {
            WIP: "#FF9E45",
            CANCELLED: "rgb(0, 143, 251)",
            CLOSED: "#D85454",
            PEND: "rgb(119, 93, 208)",
            REASSIGNED: "rgb(0, 227, 150)",
            REJECT: "rgba(254, 176, 25, 0.85)",
            NEW: "#509ADE",
            ASSIGNED: "rgba(119, 93, 100, 0.85)",
            APPROVED: "rgba(119, 200, 208, 0.85)"
        },
        priority: {
            PRTYLOW: "#509ADE",
            PRTYHGH: "#D85454",
            PRTYMED: "#FF9E45"
        }
    }

    const getStatusCard = (status, label) => {
        let items = [];
        if (status == "TOTAL") {
            items = statusListData;
        } else if (status == "NEW") {
            items = statusListData.filter(x => ["NEW"].includes(x.oStatusCode));
        } else if (status == "WIP") {
            items = statusListData.filter(x => !["NEW", "CANCELLED", "CLOSED"].includes(x.oStatusCode));
        } else if (status == "CLOSED") {
            items = statusListData.filter(x => ["CANCELLED", "CLOSED"].includes(x.oStatusCode));
        }

        return (
            <div className={`skel-kpi-box sk-int-total-cr`} style={{ backgroundColor: colorClasses['status'][status] }}>
                <span>{label}</span>
                <span className="font-bold cursor-pointer txt-anchor-link m-1" onClick={() => countStatusClicked(items, status)}>
                    {items?.length ?? 0}
                </span>
            </div>
        )
    }

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new" id='overview'>
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title"> Overview </span>
                    <div className="skel-dashboards-icons">
                        <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                            <i className="material-icons" >refresh</i>
                        </a>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-kpi-metrics-overview mt-4">
                    <div className="row">
                        <div className="col-md-3 col-sm-6 col-xs-12">
                            {getStatusCard("TOTAL", "Total Interaction")}
                        </div>
                        <div className="col-md-3 col-sm-6 col-xs-12">
                            {getStatusCard("NEW", "Open Interaction")}
                        </div>
                        <div className="col-md-3 col-sm-6 col-xs-12">
                            {getStatusCard("WIP", "Work in progress")}
                        </div>
                        <div className="col-md-3 col-sm-6 col-xs-12">
                            {getStatusCard("CLOSED", "Closed Interaction")}
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col-md-6">
                            <div className="skel-avg-info">
                                Helpdesk to Interaction:&nbsp;<span className="font-bold pr-0 txt-anchor-link" onClick={() => showHelpdeskTointeractionDetails()}> {helpdeskToInteraction?.length ?? 0} </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="skel-graph-sect">
                    <div width="100%">
                        <div ref={chartRef} style={{ height: '346px' }}></div>
                    </div>
                </div>

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen.view} onHide={() => setIsOpen({ ...isOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by Status</h5></Modal.Title>
                        <CloseButton onClick={() => setIsOpen({ ...isOpen, view: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={tableData ?? []}
                                itemsPerPage={10}
                                header={columns}
                                columnFilter={true}
                                handler={{
                                    handleCellRender: handleCellRender,
                                }}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ display: 'block' }}>
                        <div className="skel-btn-center-cmmn">
                            <button type="button" className="skel-btn-cancel" onClick={() => setIsOpen({ ...isOpen, view: false })}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isHelpdeskToInteractionOpen.view} onHide={() => setIsHelpdeskToInteractionOpen({ ...isHelpdeskToInteractionOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Helpdesk To Interaction</h5></Modal.Title>
                        <CloseButton onClick={() => setIsHelpdeskToInteractionOpen({ ...isHelpdeskToInteractionOpen, view: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={helpdeskToInteractionDetails ?? []}
                                itemsPerPage={10}
                                header={columns}
                                columnFilter={true}
                                handler={{
                                    handleCellRender: handleCellRender,
                                }}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ display: 'block' }}>
                        <div className="skel-btn-center-cmmn">
                            <button type="button" className="skel-btn-cancel" onClick={() => setIsHelpdeskToInteractionOpen({ ...isHelpdeskToInteractionOpen, view: false })}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isWipTblOpen.view} onHide={() => setIsWipTblOpen({ ...isWipTblOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by Status</h5></Modal.Title>
                        <CloseButton onClick={() => setIsWipTblOpen({ ...isWipTblOpen, view: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <div className="tabbable" style={{ overflowX: "auto" }}>
                                <ul className="nav nav-tabs mb-2" id="myTab" role="tablist" >
                                    {wipTabs?.length > 0 && wipTabs?.map((ele) => (
                                        <li className="nav-item" key={ele.code}>
                                            <a
                                                className={`nav-link ${ele?.code === wipTabs?.[0]?.code && 'active'}`}
                                                id="me-tab"
                                                data-toggle="tab"
                                                role="tab"
                                                aria-controls="me"
                                                aria-selected="true"
                                                onClick={() => getStatusWiseData(ele.code)}
                                            >
                                                {ele.description}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <DynamicTable
                                row={tableData?.filter(x => x.oStatusCode == selectedStatus) ?? []}
                                itemsPerPage={10}
                                header={columns}
                                columnFilter={true}
                                handler={{
                                    handleCellRender: handleCellRender,
                                }}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ display: 'block' }}>
                        <div className="skel-btn-center-cmmn">
                            <button type="button" className="skel-btn-cancel" onClick={() => setIsWipTblOpen({ ...isWipTblOpen, view: false })}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </div>
        )}
        </>
    );
};

export default Overview;