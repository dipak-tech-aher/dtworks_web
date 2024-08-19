import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const AverageHandlingTime = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [aht, setAht] = useState(0);
    const { apiCall } = props
    const { exportData } = data

    const getChartData = async () => {
        try {
            let requestObj = { ...searchParams, filterType: 'COUNT' }
            setIsLoading(true)
            let avgHandlingData = {}
            const response = await post(`${properties.ORDER_API}/oms-dashboard/average-handling-time`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                avgHandlingData['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'AVG' }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/average-handling-time`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setAht(Number(response1?.data[0]?.oAvg ?? 0))
                avgHandlingData['avgAht'] = Number(response1?.data[0]?.oAvg ?? 0)
            }

            setExportData?.('average-handling', avgHandlingData);

            let { chartData, avgAht } = avgHandlingData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (avgAht) setAht(avgAht);
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
        let { chartData, avgAht } = exportData?.["average-handling"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (avgAht) setAht(avgAht);
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
                    data: chartData?.map((val, i) => val?.oMonthYear)
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        rotate: 30,
                    }
                },
                tooltip: {
                    formatter: function (params) {
                        return `${params?.[0]?.marker}${params?.[0]?.seriesName}<br />
                                ${params?.[0].name}: ${params?.[0]?.data.valueLable}<br />`;
                    },
                    show: true,
                    trigger: 'axis'
                },
                series: [
                    {
                        name: 'AHT',
                        data: chartData?.map((val, i) => {
                            return {
                                value: Number(val?.oRoundoff ?? 0),
                                valueLable: val?.oAht,
                            }
                        }),
                        type: 'line',
                        smooth: false,
                        itemStyle: {
                            color: '#4D5A80'
                        },
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
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

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Average Handling Time (AHT)
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
                                src={AverageArrow}
                                alt=""
                            />
                        </span>
                        <div className="skel-average-data">
                            <span className="skel-avg-title">
                                Average Handling Time (AHT)
                            </span>
                            <span>
                                per month&nbsp;
                                {aht >= 0 ?
                                    <span className="skel-arrow-up">
                                        <strong>{aht}%&nbsp;</strong>
                                        <i className="fa fa-arrow-up" aria-hidden="true" />
                                    </span> :
                                    <span className="skel-arrow-down">
                                        <strong>{aht}%&nbsp;</strong>
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

export default AverageHandlingTime;