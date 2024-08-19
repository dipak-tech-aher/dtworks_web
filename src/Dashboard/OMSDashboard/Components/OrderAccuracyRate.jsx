import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';

const OrderAccuracyRate = () => {
    const { data, Loader } = useContext(OMSDashboardContext);
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [avgOrderAccuracyRate, setAvgOrderAccuracyRate] = useState(0);

    const getChartData = () => {
        try {
            let requestObj = { ...searchParams }
            setIsLoading(true)
            post(`${properties.ORDER_API}/oms-dashboard/order-accuracy`, { searchParams: requestObj })
                .then((response) => {
                    if (response?.data?.length) setChartData(response?.data ?? []); else setChartData([]);
                }).catch(error => {
                    console.log(error)
                    setChartData([])
                }).finally(() => {
                    loaderClose()
                })
        } catch (e) {
            console.log('error', e)
        }
    }
    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (fromDate && toDate) getChartData();
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    useEffect(() => {
        const chartDom = chartRef.current;
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
            /*toolbox: {
              feature: {
                dataView: { show: true, readOnly: false },
                magicType: { show: true, type: ['line', 'bar'] },
                restore: { show: true },
                saveAsImage: { show: true }
              }
            },*/
            legend: {
                data: ['Acurrate Rate', 'Total Order'],
                bottom: 10
            },
            xAxis: [
                {
                    type: 'category',
                    // data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June'],
                    data: [],
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
                    max: 100,
                    interval: 20,
                    axisLabel: {
                        formatter: '{value}%'
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
                    name: 'Acurrate Rate',
                    type: 'bar',
                    tooltip: {
                        valueFormatter: function (value) {
                            return value + '%';
                        }
                    },
                    // data: [45, 52, 73, 75, 60, 85],
                    data: [],
                    itemStyle: {
                        color: '#B33EDC'
                    }
                },
                {
                    name: 'Total Order',
                    type: 'line',
                    yAxisIndex: 1,
                    tooltip: {
                        valueFormatter: function (value) {
                            return value;
                        }
                    },
                    // data: [13, 15, 23, 21, 18, 25],
                    data: [],
                    itemStyle: {
                        color: '#A017D0'
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
    }, [chartData]);

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Order Accuracy Rate
                    </span>
                </div>
                <hr className="cmmn-hline" />
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className="skel-graph-sect mt-2 skel-avg-graph-height">
                        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                    </div>
                )}
                <hr className="cmmn-hline" />
                <div className="skel-graph-average-sect">
                    <div className="skel-average">
                        <span className="skel-average-circle">
                            <img
                                src="./assets/images/average-arrow.svg"
                                alt=""
                            />
                        </span>
                        <div className="skel-average-data">
                            <span className="skel-avg-title">
                                Average Order Accuracy Rate
                            </span>
                            <span>
                                per month&nbsp;
                                <span className="skel-arrow-up">
                                    <strong>{avgOrderAccuracyRate}% </strong>
                                    <i
                                        className="fa fa-arrow-up"
                                        aria-hidden="true"
                                    />
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OrderAccuracyRate;