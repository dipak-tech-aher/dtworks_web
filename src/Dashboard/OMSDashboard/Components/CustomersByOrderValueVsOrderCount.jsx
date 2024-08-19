import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { OMSDashboardContext } from '../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const CustomersByOrderValueVsOrderCount = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [graphType, setGraphType] = useState('Order_value');
    const [totalOrder, setTotalOrder] = useState(0);
    const [lastMonthOrder, setLastMonthOrder] = useState(0);
    const [currentMonthOrder, setCurrentMonthOrder] = useState(0);
    const [averageOrder, setAverageOrder] = useState(0);
    const { apiCall } = props
    const { exportData, defaultCurrency } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let topCustomerData = {}
            let requestObj = { ...searchParams, filterType: 'TOP_10_CUSTOMERS', vCategory2: graphType }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/top-customers`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                topCustomerData['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'Total_order_value', vCategory2: graphType }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/top-customers`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setTotalOrder(Number(response1?.data[0]?.oCustomer ?? 0));
                topCustomerData['tOrder'] = Number(response1?.data[0]?.oCustomer ?? 0)
            }

            let filterType;
            if (graphType === 'Order_value') {
                filterType = 'Max_Last_month';
            } else filterType = 'Max_Pre_mnt_ordercount';
            requestObj = { ...searchParams, filterType: filterType, vCategory2: graphType }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/top-customers`, { searchParams: requestObj })
            if (response2?.data?.length) {
                // setLastMonthOrder(Number(response2?.data[0]?.oAvg ?? 0));
                topCustomerData['lastMonth'] = Number(response2?.data[0]?.oAvg ?? 0)
            }

            if (graphType === 'Order_value') {
                filterType = 'Max_Current_month';
            } else filterType = 'Max_Curr_mnt_ordercount';
            requestObj = { ...searchParams, filterType: filterType, vCategory2: graphType }
            const response3 = await post(`${properties.ORDER_API}/oms-dashboard/top-customers`, { searchParams: requestObj })
            if (response3?.data?.length) {
                // setCurrentMonthOrder(Number(response3?.data[0]?.oAvg ?? 0));
                topCustomerData['currentMonth'] = Number(response3?.data[0]?.oAvg ?? 0)
            }

            if (graphType === 'Order_value') {
                filterType = 'AVG_value';
            } else filterType = 'AVG_count';
            requestObj = { ...searchParams, filterType: filterType, vCategory2: graphType }
            const response4 = await post(`${properties.ORDER_API}/oms-dashboard/top-customers`, { searchParams: requestObj })
            if (response4?.data?.length) {
                // setAverageOrder(Number(response4?.data[0]?.oAvg ?? 0));
                topCustomerData['avgOrder'] = Number(response4?.data[0]?.oAvg ?? 0)
            }

            setExportData?.('customer-order', topCustomerData);

            let { chartData, tOrder, lastMonth, currentMonth, avgOrder } = topCustomerData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (tOrder) setTotalOrder(tOrder);
                if (lastMonth) setLastMonthOrder(lastMonth);
                if (currentMonth) setCurrentMonthOrder(currentMonth);
                if (avgOrder) setAverageOrder(avgOrder);
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
    }, [fromDate, toDate, isPageRefresh, category, type, status, department, graphType])

    useEffect(() => {
        let { chartData, tOrder, lastMonth, currentMonth, avgOrder } = exportData?.["customer-order"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (tOrder) setTotalOrder(tOrder);
            if (lastMonth) setLastMonthOrder(lastMonth);
            if (currentMonth) setCurrentMonthOrder(currentMonth);
            if (avgOrder) setAverageOrder(avgOrder);
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
                dataset: [
                    {
                        // dimensions: ['name', 'age', 'profession', 'score', 'date'],
                        dimensions: ['name', 'score'],
                        source: chartData?.map((val, i) => {
                            return ([
                                val?.oCustomer,
                                val?.oTotal
                            ])
                        }) ?? []
                    },
                    {
                        transform: {
                            type: 'sort',
                            config: { dimension: 'score', order: 'desc' }
                        }
                    }
                ],
                xAxis: {
                    type: 'category',
                    axisLabel: { interval: 0, rotate: 30 }

                },
                yAxis: [{
                    type: "value",
                    nameTextStyle: {
                        fontSize: 8,
                        overflow: "truncate",
                        ellipsis: '...'
                    },
                    axisLabel: {
                        formatter: function (value) {
                            if (graphType === 'Order_value' || graphType === 'Order_count') {
                                return `${defaultCurrency[0]?.mapping?.Symbol}` + value;
                            } else return value;
                        }
                    }
                }],
                series: {
                    type: 'bar',
                    encode: { x: 'name', y: 'score' },
                    datasetIndex: 1,
                    itemStyle: {
                        color: '#4D5A80'
                    },
                    label: {
                        show: true,
                        ellipsis: '...'
                    }
                }
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
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Top 10 Customers by Order Value vs Order Count
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className=" w-100 skel-btn-center-cmmn skel-tab-btn-toggle mt-2 mb-2">
                    <div className="btn-group btn-group-tab btn-group-sm" role="group" aria-label="">
                        <button type="button" onClick={() => setGraphType('Order_value')} className={`btn btn-light ${graphType === 'Order_value' ? 'active' : ''}`} id="ordervalue">
                            Order Value
                        </button>
                        <button type="button" onClick={() => setGraphType('Order_count')} className={`btn btn-light ${graphType === 'Order_count' ? 'active' : ''}`} id="ordercount">
                            Order Count
                        </button>
                    </div>
                </div>
                <div id="ordervalue-sect">
                    <div className="row">
                        <div className="col">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2">
                                    Total Order {graphType === "Order_value" ? `Value` : `Count`}
                                </span>
                                {graphType === "Order_value" ?
                                    <h4 className="font-bold">{defaultCurrency[0]?.mapping?.Symbol}{totalOrder}</h4> :
                                    <h4 className="font-bold">{totalOrder}</h4>
                                }
                            </div>
                        </div>
                        <div className="col">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2">
                                    Last Month
                                </span>
                                {graphType === "Order_value" ?
                                    <h4 className="font-bold ">{defaultCurrency[0]?.mapping?.Symbol}{lastMonthOrder}</h4> :
                                    <h4 className="font-bold ">{lastMonthOrder}</h4>
                                }
                            </div>
                        </div>
                        <div className="col">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2">
                                    Current Month
                                </span>
                                {graphType === "Order_value" ?
                                    <h4 className="font-bold ">{defaultCurrency[0]?.mapping?.Symbol}{currentMonthOrder}</h4> :
                                    <h4 className="font-bold ">{currentMonthOrder}</h4>
                                }
                            </div>
                        </div>
                    </div>
                    {isLoading ? (
                        <Loader />
                    ) : (
                        <div className="skel-graph-sect mt-2 skel-avg-graph-height">
                            <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div>
                        </div>
                    )}
                    <hr className="cmmn-hline" />
                    <div className="skel-graph-average-sect">
                        <div className="skel-average">
                            <span className="skel-average-circle">
                                <img src={AverageArrow} alt="" />
                            </span>
                            <div className="skel-average-data">
                                <span className="skel-avg-title">
                                    Average Order {graphType === "Order_value" ? `Value` : `Count`} by Customers
                                </span>
                                <span>
                                    per month&nbsp;
                                    {averageOrder >= 0 ?
                                        <span className="skel-arrow-up">
                                            <strong>{averageOrder}%&nbsp;</strong>
                                            <i className="fa fa-arrow-up" aria-hidden="true" />
                                        </span> :
                                        <span className="skel-arrow-down">
                                            <strong>{averageOrder}%&nbsp;</strong>
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
    )
}

export default CustomersByOrderValueVsOrderCount;