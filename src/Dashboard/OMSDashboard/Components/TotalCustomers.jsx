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

const TotalCustomers = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData, handleOpenRightModal } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [averageCustomers, setAverageCustomers] = useState(0);
    const [totalCustomersCount, setTotalCustomersCount] = useState(0);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [columnData, setColumnData] = useState([])
    const [exportBtn, setExportBtn] = useState(false);
    const { apiCall } = props
    const { exportData } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let totalCust = {}
            let requestObj = { ...searchParams, filterType: 'COUNT' }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/total-customers`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                totalCust['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'TOTAL_COUNT' }
            const tCountData = await slowPost(`${properties.ORDER_API}/oms-dashboard/total-customers`, { searchParams: requestObj })
            if (tCountData?.data?.length) {
                // setTotalCustomersCount(Number(tCountData?.data[0]?.oTotalCustomer))
                totalCust['tCount'] = Number(tCountData?.data[0]?.oTotalCustomer ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'AVG' }
            const tAvgData = await post(`${properties.ORDER_API}/oms-dashboard/total-customers`, { searchParams: requestObj })
            if (tAvgData?.data?.length) {
                // setAverageCustomers(Number(tAvgData?.data[0]?.oAvergeOrder ?? 0))
                totalCust['tAvg'] = Number(tAvgData?.data[0]?.oAverageOrder ?? 0)
            }
            
            setExportData?.('total-customers', totalCust);

            let { chartData, tCount, tAvg } = totalCust;
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (tCount) setTotalCustomersCount(tCount);
                if (tAvg) setAverageCustomers(tAvg);
            })
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const graphData = async () => {
        let requestObj = { ...searchParams, filterType: 'COUNT' }
        try {
            const response = await post(`${properties.ORDER_API}/oms-dashboard/total-customers`, { searchParams: requestObj })
            if (response?.data?.length) {
                setChartData(response?.data ?? []);
            }
        } catch (error) {
            console.log(error)
            setChartData([])
        }
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (apiCall && fromDate && toDate) {
            getChartData();
        }
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    useEffect(() => {
        let { chartData, tCount, tAvg } = exportData?.["total-customers"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (tCount) setTotalCustomersCount(tCount);
            if (tAvg) setAverageCustomers(tAvg);
        })
    }, [exportData])

    useEffect(() => {
        const chartDom = chartRef?.current;

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
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },
                legend: {
                    // data: ['Total Revenue', 'Total Orders'],
                    data: ['Customer'],
                    bottom: 10
                },
                xAxis: [
                    {
                        type: 'category',
                        data: chartData?.map((val) => val?.oAverageOrder),
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: '',
                        min: 0,
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        type: 'value',
                        name: '',
                        min: 0,
                        max: 25,
                        interval: 0
                    }
                ],
                series: [
                    {
                        name: 'Customer',
                        type: 'bar',
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        data: chartData?.map((val) => val?.oTotalCustomer),
                        itemStyle: {
                            color: '#5470C6'
                        },
                        label: {
                            show: true,
                            ellipsis: '...'
                        }
                    },
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
        let requestObj = { ...searchParams, filterType: 'DETAIL' }
        slowPost(properties.ORDER_API + '/oms-dashboard/total-customers', { searchParams: requestObj })
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
        graphData();
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
            {
                isLoading ? (
                    <Loader />
                ) : (
                    <div className="cmmn-skeleton h-100">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title">
                                Total Customers
                            </span>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="row mt-2">
                            <div className="col-12">
                                <div className="text-center">
                                    <span className="text-center text-truncate d-block mb-0 mt-2">
                                        Total Customers
                                    </span>
                                    <h4
                                        className="font-bold cursor-pointer"
                                        data-target="#detailsmodal"
                                        data-toggle="modal"
                                        onClick={() => showDetails()}
                                    >
                                        {totalCustomersCount}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        <div className="skel-graph-sect mt-2 skel-avg-graph-height">
                            <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                        </div>

                        <hr className="cmmn-hline" />
                        <div className="skel-graph-average-sect">
                            <div className="skel-average">
                                <span className="skel-average-circle">
                                    <img
                                        src={AverageArrow}
                                        alt=""
                                    />
                                </span>
                                <div className="skel-average-data">
                                    <span className="skel-avg-title">
                                        Average Customers
                                    </span>
                                    <span>
                                        per month&nbsp;
                                        {averageCustomers >= 0 ?
                                            <span className="skel-arrow-up">
                                                <strong>{averageCustomers}%&nbsp;</strong>
                                                <i className="fa fa-arrow-up" aria-hidden="true" />
                                            </span> :
                                            <span className="skel-arrow-down">
                                                <strong>{averageCustomers}%&nbsp;</strong>
                                                <i className="fa fa-arrow-down" aria-hidden="true" />
                                            </span>
                                        }
                                    </span>
                                </div>
                            </div>
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
                                    listKey={"total-customers"}
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
        </div>
    )
}

export default TotalCustomers;