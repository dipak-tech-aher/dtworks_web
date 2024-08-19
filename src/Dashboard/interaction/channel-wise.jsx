import React, { useState, useEffect, useRef, memo } from 'react';
import * as echarts from 'echarts';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import LastRefreshTime from './LastRefreshTime';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { useHistory } from '../../common/util/history';
import { unstable_batchedUpdates } from 'react-dom';

const ChannelWise = memo((props) => {
    const history = useHistory()
    const { data, handlers } = props;
    const { searchParams, isParentRefresh, apiCall = false, exportData } = data
    const [isRefresh, setIsRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [chartDataList, setChartDataList] = useState([]);
    const [total, setTotal] = useState(0);
    const chartRef = useRef(null);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    const [columns, setColums] = useState([
        {
            Header: "Interaction No",
            accessor: "oIntxnNo",
            disableFilters: true,
            id: "oIntxnNo"
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
            accessor: "oStatusDesc",
            disableFilters: true,
        },
        {
            Header: "Channel",
            accessor: "oChannel",
            disableFilters: true,
        },
        {
            Header: "Current User",
            accessor: "oCurrUser",
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                slowPost(properties.INTERACTION_API + "/channel-wise", { ...searchParams, category: "CHANNEL" }).then((resp) => {
                    if (resp?.status == 200) {
                        setChartData(resp?.data?.rows);
                        const totalCount = resp?.data?.rows?.reduce((total, obj) => total + Number(obj?.oIntxnCnt), 0);
                        setTotal(totalCount)
                        let dataObject = {}
                        dataObject['total'] = totalCount
                        dataObject['chartData'] = resp?.data?.rows
                        props?.setExportData?.(`channelWiseData`, dataObject)
                    }
                }).catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        if (apiCall) fetchData(); setLoading(false);
    }, [searchParams, isRefresh, isParentRefresh]);

    useEffect(() => {
        let { total, chartData, } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (total) setTotal(total);
            if (chartData) setChartData(chartData);
        })
    }, [exportData])

    const getDetailsList = (value, month) => {
        setLoading(true)
        slowPost(properties.INTERACTION_API + "/channel-wise-list", { ...searchParams, channel: [{ code: '', value }], category: "CHANNEL" }).then((resp) => {
            if (resp?.status == 200) {
                const data = resp?.data?.rows.sort((a, b) => {
                    return b.oIntxnId - a.oIntxnId;
                });
                setChartDataList(data?.filter((ele) => ele?.oDays === month));
                setModalOpen(true)
            }
        }).catch((error) => console.log(error))
            .finally(() => {
                setIsRefresh(!isRefresh)
                setLoading(false)
            });
    }

    const fetchInteractionDetail = (intxnNo) => {
        setLoading(true);

        slowGet(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'customer360'
                }
                if (response.customerUuid) {
                    localStorage.setItem("customerUuid", response.customerUuid)
                    localStorage.setItem("customerIds", response.customerId)
                }
                history(`/interaction360`, { state: { data } })
            } else {
                //
            }
        }).catch(error => {
            console.log(error);
        }).finally(() => setLoading(false));
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oIntxnNo") {
            return (<span onClick={() => fetchInteractionDetail(cell.value)} style={{ cursor: 'pointer', color: 'rgb(80, 154, 222)' }}>{cell.value}</span>);
        }
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    useEffect(() => {
        if (!loading && chartRef.current) {
            const xAxisData = [...new Set(chartData.map(item => ({ value: item?.oIntxnCnt, metaData: item })))];

            const channels = [...new Set(chartData.map(item => item.oCategoryValue))];

            const option = {
                title: {
                    show: !chartData?.length > 0 ? true : false,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No data available",
                    left: "center",
                    top: "center"
                },
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c}'
                },
                legend: {
                    // data: channels.map(x => ({ name: x })),
                    width: "75%",
                    left: "0",
                    top: "5%"
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true,
                    top: "30%"
                },
                xAxis: {
                    type: 'category',
                    data: channels
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        type: 'bar',
                        label: {
                            show: true
                        },
                        emphasis: {
                            focus: 'series'
                        },
                        data: xAxisData

                    }
                ]
            };

            const chartDom = chartRef.current;
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

            if (option && typeof option === 'object') {
                myChart.setOption(option);
            }

            myChart.on('click', (params) => {
                // console.log(params);
                getDetailsList(params?.data?.metaData?.oCategoryCode, params?.data?.metaData?.oMonthYear);
            })

            window.addEventListener('resize', myChart.resize);

            return () => {
                window.removeEventListener('resize', myChart.resize);
                myChart.dispose();
            };
        }
    }, [chartData]);

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="row h-100">
                    <div className="col-12 px-2">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Top 5 Interactions by Channel ({total}) </span>
                            <div className="skel-dashboards-icons">
                                <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                                    <i className="material-icons">refresh</i>
                                </a>
                                {/* <a href="#">
                                <i className="material-icons">filter_alt</i>
                            </a> */}
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-perf-sect">
                            <div className="skel-perf-graph mt-0">
                                <div ref={chartRef} style={{ height: '400px' }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 px-2 align-self-end">
                        <hr className="cmmn-hline" />
                        <div className="skel-refresh-info">
                            <LastRefreshTime data={{ isRefresh, componentName: 'ChannelWise' }} />
                        </div>
                    </div>
                </div>

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => setModalOpen(!modalOpen)} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by Status</h5></Modal.Title>
                        <CloseButton onClick={() => setModalOpen(!modalOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={chartDataList ?? []}
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
                            <button type="button" className="skel-btn-cancel" onClick={() => setModalOpen(!modalOpen)}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </div>
        )}
        </>
    );
});

export default ChannelWise;