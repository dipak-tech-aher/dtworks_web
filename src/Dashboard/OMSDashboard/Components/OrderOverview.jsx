import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post, slowPost } from '../../../common/util/restUtil';
import DynamicTable from "../../../common/table/DynamicTable";
import { TotalCustomersColumns } from './Coulmns';
import { Modal } from 'react-bootstrap';
import moment from 'moment';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const OrderOverview = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData, handleOpenRightModal } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [orderOverviewCountList, setOrderOverviewCountList] = useState({});
    let { oTotalOrder = 0, oOpenOrder = 0, oClosedOrder = 0, oCancelledOrder = 0 } = orderOverviewCountList;
    const [oAvergeOrder, setOAvergeOrder] = useState(0)
    const [filteredSeverityData, setFilteredSeverityData] = useState([]);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [columnData, setColumnData] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const { apiCall } = props
    const { exportData } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let orderData = {}
            let requestObj = { ...searchParams, filterType: 'TOTAL_COUNT' }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/order-overview`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                orderData['chartData'] = response?.data
            }

            requestObj = { ...searchParams, filterType: 'COUNT' }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/order-overview`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setOrderOverviewCountList(response1?.data[0])
                orderData['OverviewCountList'] = response1?.data[0]
            }

            requestObj = { ...searchParams, filterType: 'AVG' }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/order-overview`, { searchParams: requestObj })
            if (response2?.data?.length) {
                // setOrderOverviewCountList(response2?.data[0])
                orderData['avgValue'] = response2?.data[0]?.oAverageOrder
            }

            setExportData('order-overview', orderData)

            let { chartData, OverviewCountList, avgValue } = orderData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (OverviewCountList) setOrderOverviewCountList(OverviewCountList);
                if (avgValue) setOAvergeOrder(avgValue);
            })
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (fromDate && toDate) getChartData();
        if (apiCall) getChartData();
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    const showDetails = () => {
        setIsLoading(true)
        let requestObj = { ...searchParams, filterType: 'DETAIL' }
        slowPost(properties.ORDER_API + '/oms-dashboard/order-overview', { searchParams: requestObj })
            .then((response) => {
                setColumnData(response?.data);
                setShow(true)
            })
            .catch(error => {
                console.error(error);
            }).finally(() => setIsLoading(false));
    }

    const handleClose = () => {
        setShow(false);
        setColumnData([]);
        getChartData()
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "updatedAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "oCustomerNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    useEffect(() => {
        let { chartData, OverviewCountList } = exportData?.["order-overview"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (OverviewCountList) setOrderOverviewCountList(OverviewCountList);
        })
    }, [exportData])

    useEffect(() => {
        const chartDom = chartRef.current;
        if (chartDom) {
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

            const option = {
                title: {
                    show: chartData?.length > 0 ? false : true,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No data available",
                    left: "center",
                    top: "center"
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        label: {
                            backgroundColor: '#283b56'
                        }
                    },
                    formatter: function (params) {
                        if (params.length === 0) return 'No data';
                        const { name, data } = params[0];
                        return `
                            <div>
                                <strong>Month:</strong> ${name}<br/>
                                <span style="color: #283b56;">&#8226;</span> <strong>Total Orders:</strong> ${data?.oTotalOrder || 'N/A'}<br/>
                                <span style="color: #283b56;">&#8226;</span> <strong>Open Orders:</strong> ${data?.oOpenOrder || 'N/A'}<br/>
                                <span style="color: #283b56;">&#8226;</span> <strong>Closed Orders:</strong> ${data?.oClosedOrder || 'N/A'}<br/>
                                <span style="color: #283b56;">&#8226;</span> <strong>Cancelled Orders:</strong> ${data?.oCancelledOrder || 'N/A'}
                             </div>
                            `;
                    }
                },
                xAxis: {
                    type: 'category',
                    data: chartData?.map(val => val?.oMonth),
                    axisLabel: { interval: 0, rotate: 0 }
                },
                yAxis: {
                    type: 'value',
                    name: 'Total Orders',
                    nameTextStyle: {
                        color: '#7C7C7C',
                        fontSize: 12,
                    },
                    nameLocation: 'middle',
                    nameGap: 30,
                    axisLabel: {
                        margin: 10
                    }
                },
                series: [
                    {
                        name: 'Total Orders',
                        data: chartData?.map(val => ({
                            value: val?.oTotalOrder,
                            oTotalOrder: val?.oTotalOrder,
                            oClosedOrder: val?.oClosedOrder,
                            oOpenOrder: val?.oOpenOrder,
                            oCancelledOrder: val?.oCancelledOrder
                        })),
                        type: 'line',
                        smooth: true,
                        lineStyle: {
                            width: 3,
                            color: '#26A0FC'
                        },
                        symbolSize: 8,
                        symbol: 'circle',
                        color: '#26A0FC'
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
    }, [chartData]);

    return (
        <div className="col-md-9 mb-2 px-lg-1">
            <div className="cmmn-skeleton mt-0 h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Order Overview
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="row mt-3">
                    <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4">
                        <div className="skel-oms-ord-data">
                            <div className="skel-oms-sect-cnt">
                                <span className="skel-sm-heading text-grey">
                                    Total Orders
                                </span>
                                <h4
                                    className="font-bold cursor-pointer mt-0"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={() => showDetails()}
                                >
                                    {oTotalOrder}
                                </h4>
                            </div>
                            <div className="skel-oms-sect-cnt">
                                <span className="skel-sm-heading text-grey">
                                    Open Order
                                </span>
                                <h4
                                    className="font-bold cursor-pointer mt-0"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={() => showDetails()}
                                >
                                    {oOpenOrder}
                                </h4>
                            </div>
                            <div className="skel-oms-sect-cnt">
                                <span className="skel-sm-heading text-grey">
                                    Closed Order
                                </span>
                                <h4
                                    className="font-bold cursor-pointer mt-0"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={() => showDetails()}
                                >
                                    {oClosedOrder}
                                </h4>
                            </div>
                            <div className="skel-oms-sect-cnt">
                                <span className="skel-sm-heading text-grey">
                                    Cancelled Order
                                </span>
                                <h4
                                    className="font-bold cursor-pointer mt-0"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={() => showDetails()}
                                >
                                    {oCancelledOrder}
                                </h4>
                            </div>
                            <hr className="cmmn-hline" />
                            <div className="skel-graph-average-sect">
                                <div className="row">
                                    <div className="col">
                                        <div className="skel-average">
                                            <span className="skel-average-circle">
                                                <img
                                                    src={AverageArrow}
                                                    alt=""
                                                />
                                            </span>
                                            <div className="skel-average-data">
                                                <span className="skel-avg-title">
                                                    Average Order
                                                </span>
                                                <span>
                                                    per month&nbsp;
                                                    {oAvergeOrder >= 0 ?
                                                        <span className="skel-arrow-up">
                                                            <strong>{oAvergeOrder}%&nbsp;</strong>
                                                            <i className="fa fa-arrow-up" aria-hidden="true" />
                                                        </span> :
                                                        <span className="skel-arrow-down">
                                                            <strong>{oAvergeOrder}%&nbsp;</strong>
                                                            <i className="fa fa-arrow-down" aria-hidden="true" />
                                                        </span>
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8">
                        {isLoading ? (
                            <Loader style={{ width: '100%', height: '360px' }} />
                        ) : (
                            <div ref={chartRef} style={{ width: '100%', height: '360px' }}></div>
                        )}
                    </div>
                    <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                        <Modal.Header>
                            <b>Total Customers</b>
                            <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                                <span aria-hidden="true">×</span>
                            </button>
                        </Modal.Header>
                        <Modal.Body>
                            <DynamicTable
                                listKey={"order-overview"}
                                row={columnData}
                                rowCount={columnData?.length}
                                header={TotalCustomersColumns}
                                columnFilter={true}
                                fixedHeader={true}
                                itemsPerPage={perPage}
                                exportBtn={exportBtn}
                                isScroll={true}
                                isTableFirstRender={tableRef}
                                backendCurrentPage={currentPage}
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handlePageSelect: handlePageSelect,
                                    handleItemPerPage: setPerPage,
                                    handleCurrentPage: setCurrentPage,
                                    handleFilters: setFilters,
                                    handleExportButton: setExportBtn,
                                }}
                            />
                        </Modal.Body>
                    </Modal>
                </div>
            </div>
        </div>
    )
}

export default OrderOverview;