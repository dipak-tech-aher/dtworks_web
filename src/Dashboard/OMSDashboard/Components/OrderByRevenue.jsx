import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { OMSDashboardContext } from '../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const OrderByRevenue = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [totalRevenue, setTotalRevenue] = useState(0)
    const [lastMonth, setLastMonth] = useState(0)
    const [currentMonth, setCurrentMonth] = useState(0)
    const [averageRevenue, setAverageRevenue] = useState(0)
    const { apiCall } = props
    const { exportData, defaultCurrency } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let orderRevenueData = {}
            let requestObj = { ...searchParams, filterType: 'TOP_10_CUSTOMERS' }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                orderRevenueData['chartData'] = response?.data ?? []
            }


            requestObj = { ...searchParams, filterType: 'Total_revenue_value' }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setTotalRevenue(Number(response1?.data[0]?.oTotal) ?? 0)
                orderRevenueData['tRevenue'] = Number(response1?.data[0]?.oTotal) ?? 0
            }

            requestObj = { ...searchParams, filterType: 'Max_Last_month' }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response2?.data?.length) {
                // setLastMonth(Number(response2?.data[0]?.oTotal))
                orderRevenueData['lastMonth'] = Number(response2?.data[0]?.oTotal) ?? 0
            }

            requestObj = { ...searchParams, filterType: 'Max_Current_month' }
            const response3 = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response3?.data?.length) {
                // setCurrentMonth(Number(response3?.data[0]?.oTotal) ?? 0)
                orderRevenueData['currentMonth'] = Number(response3?.data[0]?.oTotal) ?? 0
            }

            requestObj = { ...searchParams, filterType: 'AVG' }
            const response4 = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response4?.data?.length) {
                // setAverageRevenue(Number(response4?.data[0]?.oAvg) ?? 0)
                orderRevenueData['avgRevenue'] = Number(response3?.data[0]?.oTotal) ?? 0
            }

            setExportData?.('order-revenue', orderRevenueData);

            let { chartData, tRevenue, lastMonth, currentMonth, avgRevenue } = orderRevenueData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (tRevenue) setTotalRevenue(tRevenue);
                if (lastMonth) setLastMonth(lastMonth);
                if (currentMonth) setCurrentMonth(currentMonth);
                if (avgRevenue) setAverageRevenue(avgRevenue);
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

    useEffect(() => {
        let { chartData, tRevenue, lastMonth, currentMonth, avgRevenue } = exportData?.["order-revenue"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (tRevenue) setTotalRevenue(tRevenue);
            if (lastMonth) setLastMonth(lastMonth);
            if (currentMonth) setCurrentMonth(currentMonth);
            if (avgRevenue) setAverageRevenue(avgRevenue);
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
                        dimensions: ['name', 'revenue'],
                        source: chartData?.map((val, i) => {
                            return [val?.oRevenue, Number(val?.oTotal)]
                        }) ?? []
                    },
                    {
                        transform: {
                            type: 'sort',
                            config: { dimension: 'revenue', order: 'desc' }
                        }
                    }
                ],
                xAxis: {
                    type: 'category',
                    // axisLabel: { interval: 0, rotate: 30 }
                    axisLabel: {
                        rotate: 30,
                        rich: {
                            ellipsis: {
                                width: 50, // Define width before truncation
                                overflow: 'truncate',
                                fontSize: 12
                            }
                        },
                        formatter: function (value) {
                            const maxLength = 10; //charater limit 
                            return value.length > maxLength ? `{ellipsis|${value.slice(0, maxLength) + '...'}}` : value;
                        }
                    }
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
                            if (defaultCurrency[0]?.mapping?.Symbol) {
                                return `${defaultCurrency[0]?.mapping?.Symbol}` + value;
                            } else return value;
                        }
                    }
                }],
                series: {
                    type: 'bar',
                    encode: { x: 'name', y: 'revenue' },
                    datasetIndex: 1,
                    itemStyle: {
                        color: '#D37D2E'
                    },
                    label: {
                        show: true,
                        color: '#FFFFFF',
                        rotate: 30,
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
                        Top 10 Order by Revenue
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="row">
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                Total Revenue
                            </span>
                            <h4 className="font-bold">{defaultCurrency[0]?.mapping?.Symbol}{totalRevenue}</h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                Last Month
                            </span>
                            <h4 className="font-bold">{defaultCurrency[0]?.mapping?.Symbol}{lastMonth}</h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                Current Month
                            </span>
                            <h4 className="font-bold">{defaultCurrency[0]?.mapping?.Symbol}{currentMonth}</h4>
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
                            <img
                                src={AverageArrow}
                                alt=""
                            />
                        </span>
                        <div className="skel-average-data">
                            <span className="skel-avg-title">
                                Average Order by Revenue
                            </span>
                            <span>
                                per month{" "}
                                {averageRevenue >= 0 ?
                                    <span className="skel-arrow-up">
                                        <strong>{averageRevenue}%&nbsp;</strong>
                                        <i className="fa fa-arrow-up" aria-hidden="true" />
                                    </span> :
                                    <span className="skel-arrow-down">
                                        <strong>{averageRevenue}%&nbsp;</strong>
                                        <i className="fa fa-arrow-down" aria-hidden="true" />
                                    </span>
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderByRevenue;