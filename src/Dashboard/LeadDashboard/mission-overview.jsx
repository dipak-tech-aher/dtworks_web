import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { get, post } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { toast } from 'react-toastify';

const MissionOverview = (props) => {
    const { searchParams, isParentRefresh } = props?.data
    console.log("search params in overview", searchParams)
    const [isRefresh, setIsRefresh] = useState(false);
    const [statusData, setStatusData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [masterLookupData, setMasterLookupData] = useState([]);
    const [dataList, setDataList] = useState([]);
    const chartRef = useRef(null);
    const [totalCount, setTotalCount] = useState(0);
    const [totalMissionCount, setTotalMissionCount] = useState(0);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [category, setCategory] = useState();

    const columns = [
        {
            Header: "Mission name",
            accessor: "oMissionName",
            disableFilters: true,
            id: "oMissionName"
        },
        {
            Header: "Mission Category",
            accessor: "oMissionCategory",
            disableFilters: true,
            id: "oMissionCategory"
        },
        {
            Header: "Task name",
            accessor: "oTaskName",
            disableFilters: true,
            id: "oTaskName"
        },
        {
            Header: "Task Description",
            accessor: "oTaskDescription",
            disableFilters: true,
            id: "oTaskDescription"
        },
        {
            Header: "Status",
            accessor: "oStatusDesc",
            disableFilters: true,
            id: "oStatusDesc"
        },
        {
            Header: "Priority",
            accessor: "oPriorityDesc",
            disableFilters: true,
            id: "oPriorityDesc"
        },
        {
            Header: "Assigned user",
            accessor: "oAssignedUser",
            disableFilters: true,
            id: "oAssignedUser"
        },
        {
            Header: "Created user",
            accessor: "oCreatedUser",
            disableFilters: true,
            id: "oCreatedUser"
        },
        {
            Header: "Created at",
            accessor: "oCreatedAt",
            disableFilters: true,
            id: "oCreatedAt"
        }
    ];

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        } else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY HH:mm:ss") : '-'}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    useEffect(() => {
        get(properties.MASTER_API + `/lookup?searchParam=code_type&valueParam=LEAD_TASK_STATUS`)
            .then((response) => {
                const { data } = response;
                setMasterLookupData(data['LEAD_TASK_STATUS'] ?? [])
            })
            .catch(error => {
                console.error(error);
            });
    }, [])

    useEffect(() => {
        let reqBody = { ...searchParams, type: "COUNT" };
        post(properties.LEAD_API + "/missions-by-status", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setTotalMissionCount(data?.[0]?.oTotalCnt)
                const responseObj = data.map((element) => {
                    let obj = {
                        name: element?.oStatusDesc,
                        code: element?.oStatus,
                        value: Number(element?.oCnt ?? 0),
                        oStatus: element.oStatus
                    }
                    return obj
                });
                setStatusData(responseObj)
            }
        }).catch((error) => console.log(error));

    }, [isRefresh, searchParams, masterLookupData])

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        console.log(statusData)
        const resultData = statusData.sort((a, b) => {
            return a?.mapping?.sortOrder - b?.mapping?.sortOrder;
        });
        const option = {
            title: {
                show: resultData.length === 0,
                textStyle: {
                    color: "grey",
                    fontSize: 20
                },
                text: "No Tasks found",
                left: "center",
                top: "center"
            },
            tooltip: {
                trigger: "axis"
            },
            xAxis: {
                type: 'category',
                data: resultData.map(x => x.name)
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: resultData.map(x => x.value),
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
    }, [statusData]);

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
        }
    }

    const getStatusCard = (status, label) => {
        return (
            <div className={`skel-kpi-box sk-int-total-cr`} style={{ backgroundColor: colorClasses['status'][status] }}>
                <span>{label}</span>
                <span className="font-bold cursor-pointer txt-underline" onClick={() => countClicked(status)}>
                    {statusData.find(f => f.code == status)?.value ?? 0}
                </span>
            </div>
        )
    }

    const getTotalInteractionCard = () => {
        return (
            <div>
                <span>Total Mission Tasks</span>
                <span className="font-bold cursor-pointer txt-underline" onClick={() => countClicked("ALL")}>
                    {statusData.length ? statusData.map(o => o.value).reduce((a, c) => { return a + c }) : 0}
                </span>
            </div>
        )
    }

    const getList = (code) => {
        setCategory(code);
        let status = [{ value: code }];
        if (code == "ALL") status = null;
        // if (code == "ALL") status = masterLookupData.map(x => ({ value: x.code }));
        let reqBody = { ...searchParams, type: "LIST", status, limit: perPage, page: currentPage };
        post(properties.LEAD_API + "/missions-by-status", { searchParams: reqBody }).then((response) => {
            if (response?.status == 200) {
                const { data } = response;
                setDataList([...data]);
                if (code == "ALL") {
                    setTotalCount(totalMissionCount);
                } else {
                    const total = statusData?.find((ele) => ele?.code === code)?.value;
                    setTotalCount(total);
                }

            } else {
                toast.error("Something went wrong");
            }
        }).catch((error) => toast.error("Something went wrong"));
    }

    const countClicked = (code) => {
        getList(code);
        setModalOpen(true);
    }

    useEffect(() => {
        getList(category);
    }, [currentPage, perPage, filters])


    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }


    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Mission Task Overview </span>
                <div className="skel-dashboards-icons">
                    <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                        <i className="material-icons" >refresh</i>
                    </a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-kpi-metrics-overview mt-4">
                <div className="skel-auto">
                    <div className="skel-auto-fill">
                        <div className="skel-kpi-box sk-int-total-int">
                            {getTotalInteractionCard("TOTAL", "Total Tasks")}
                        </div>
                    </div>
                    <div className="skel-auto-fill">
                        {getStatusCard("TS_OPEN", "Open Tasks")}
                    </div>
                    <div className="skel-auto-fill">
                        {getStatusCard("TS_WIP", "Work in progress")}
                    </div>
                    <div className="skel-auto-fill">
                        {getStatusCard("TS_HOLD", "Hold Tasks")}
                    </div>
                    <div className="skel-auto-fill">
                        {getStatusCard("TS_CLOSED", "Closed Tasks")}
                    </div>
                </div>
            </div>
            <div className="skel-graph-sect">
                <div width="100%">
                    <div ref={chartRef} style={{ height: '346px' }}></div>
                </div>
            </div>
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => setModalOpen(!modalOpen)} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Tasks List</h5></Modal.Title>
                    <CloseButton onClick={() => setModalOpen(!modalOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="col-lg-12 col-md-12 col-xs-12">
                        <DynamicTable
                            // row={dataList ?? []}
                            // itemsPerPage={10}
                            // header={columns}
                            // columnFilter={true}
                            // handler={{
                            //     handleCellRender: handleCellRender,
                            // }}
                            row={dataList ?? []}
                            rowCount={totalCount}
                            itemsPerPage={perPage}
                            header={columns}
                            backendPaging={true}
                            isScroll={true}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            backendCurrentPage={currentPage}
                            columnFilter={true}
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleFilters: setFilters
                            }}
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={() => setModalOpen(!modalOpen)}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default MissionOverview;