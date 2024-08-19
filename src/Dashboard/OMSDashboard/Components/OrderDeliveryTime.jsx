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

const OrderDeliveryTime = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData, handleOpenRightModal } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [graphType, setGraphType] = useState('OF_BOTH')
    const [totalCount, setTotalCount] = useState(0);
    const [totalDeliveryTime, setTotalDeliveryTime] = useState(0);
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
            let orderDeliveryData = {}
            let requestObj = { ...searchParams, filterType: 'COUNT', vCategory2: graphType }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/order-delivery`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                orderDeliveryData['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'TOTAL_COUNT', vCategory2: graphType }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/order-delivery`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setTotalCount(Number(response1?.data[0]?.oTotalCount) ?? 0);
                orderDeliveryData['totalCount'] = Number(response1?.data[0]?.oTotalCount) ?? 0
            }

            requestObj = { ...searchParams, filterType: 'd', vCategory2: graphType }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/order-delivery`, { searchParams: requestObj })
            if (response2?.data?.length) {
                // setTotalDeliveryTime(Number(response2?.data[0]?.oTotalDeliveryTime))
                orderDeliveryData['totalTime'] = Number(response2?.data[0]?.oTotalDeliveryTime)
            }

            setExportData?.('order-delivery', orderDeliveryData);

            let { chartData, totalCount, totalTime } = orderDeliveryData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (totalCount) setTotalCount(totalCount);
                if (totalTime) setTotalDeliveryTime(totalTime);
                if (chartData) setChartData(chartData);
            })
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (apiCall && fromDate && toDate) {
            getChartData();
        }
        // if (apiCall) getChartData();
    }, [fromDate, toDate, isPageRefresh, category, type, status, department, graphType])

    useEffect(() => {
        let { chartData, totalCount, totalTime } = exportData?.["order-delivery"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (totalCount) setTotalCount(totalCount);
            if (totalTime) setTotalDeliveryTime(totalTime);
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
                xAxis: {
                    type: 'category',
                    data: chartData?.map((val) => val?.oTotalDeliveryTime),
                },
                yAxis: {
                    type: 'value',
                    interval: 5,
                    min: 0,
                    // max: 50,
                    name: 'Days',
                    nameRotate: 90,
                    nameGap: 30,
                    nameTextStyle: { color: '#7C7C7C', },

                    nameLocation: 'middle'
                },
                series: [
                    {
                        data: chartData?.map((val) => val?.oTotalCount),
                        type: 'line',
                        smooth: true,
                        areaStyle: {
                            opacity: 0.4,
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                {
                                    offset: 0.1,
                                    color: 'rgb(46, 71, 249, 70%)'
                                },
                                {
                                    offset: 0.7,
                                    color: 'rgb(217, 217, 217, 40%)'
                                }
                            ])
                        },
                        itemStyle: {
                            color: '#2E47F9'
                        },
                        symbolSize: 12,
                        symbol: 'circle'
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

    const showDetails = () => {
        setIsLoading(true)
        let requestObj = { ...searchParams, filterType: 'DETAIL', vCategory2: graphType }
        slowPost(properties.ORDER_API + '/oms-dashboard/order-delivery', { searchParams: requestObj })
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
        getChartData();
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "oCustomerNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        if (cell.column.id === "updatedAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Order Delivery Time
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="tabbable mt-2">
                    <ul className="nav nav-tabs" id="myTab1" role="tablist">
                        <li className="nav-item">
                            <a onClick={() => setGraphType('OF_BOTH')} className={`nav-link ${graphType === 'OF_BOTH' ? 'active' : ''}`} id="all-tab" data-toggle="tab" href="#allgraph" role="tab" aria-controls="alltab" aria-selected="true">
                                All
                            </a>
                        </li>
                        <li className="nav-item">
                            <a onClick={() => setGraphType('OF_PHYCL')} className={`nav-link ${graphType === 'OF_PHYCL' ? 'active' : ''}`} id="physical-tab" data-toggle="tab" href="#physicalgraph" role="tab" aria-controls="physicaltab" aria-selected="true">
                                Physical
                            </a>
                        </li>
                        <li className="nav-item">
                            <a onClick={() => setGraphType('OF_LGC')} className={`nav-link ${graphType === 'OF_LGC' ? 'active' : ''}`} id="logical-tab" data-toggle="tab" href="#logicalgraph" role="tab" aria-controls="logicaltab" aria-selected="true">
                                Logical
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="row">
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                Total Count
                            </span>
                            <h4 className="font-bold cursor-pointer txt-underline" data-target="#detailsmodal" data-toggle="modal"
                                onClick={() => showDetails()}
                            >
                                {totalCount}
                            </h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                Total Delivery Time
                            </span>
                            <h4 className="font-bold">{totalDeliveryTime} days</h4>
                        </div>
                    </div>
                </div>
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className="skel-graph-sect mt-2">
                        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                    </div>
                )}
            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <b>Total Count</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"order-delivery"}
                        row={columnData}
                        exportBtn={exportBtn}
                        rowCount={columnData?.length}
                        header={TotalCustomersColumns}
                        columnFilter={true}
                        fixedHeader={true}
                        itemsPerPage={perPage}
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
    )
}

export default OrderDeliveryTime;