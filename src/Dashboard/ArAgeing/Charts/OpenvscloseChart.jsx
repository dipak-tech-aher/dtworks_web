import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { convertToIntlCurrency } from '../../../common/util/util';

const OpenvscloseChart = (props) => {

    const chartRef = useRef(null);
    const chartData = props?.data?.chartData, defaultCurrency = props?.data?.defaultCurrency || '';
    useEffect(() => {
        if (chartData?.length > 0) {
            const allDates = [...chartData?.map(item => item?.oOpenMonthYear), ...chartData?.map(item => item?.oClosedMonthYear)];
            const setArrary = [...new Set(allDates)];
            const xAxisLabels = setArrary?.filter(item => item !== null);

            const openInvoiceData = xAxisLabels?.map(date => {
                const matchingData = chartData?.find(item => item?.oOpenMonthYear === date);
                return matchingData?.oMonthlyOpenInvAmount ? Number(matchingData?.oMonthlyOpenInvAmount)?.toFixed(2) : 0;
            });
            const closedInvoiceData = xAxisLabels?.map(date => {
                const matchingData = chartData?.find(item => item?.oClosedMonthYear === date);
                return matchingData ? Number(matchingData?.oMonthlyClosedInvAmount)?.toFixed(2) : 0;
            });
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
                grid: {
                    left: '20%',
                    right: '3%'
                },
                legend: {
                    data: ['Invoice Amount', 'Outstanding Amount'],
                    top: '8%'
                },
                xAxis: [
                    {
                        type: 'category',
                        data: xAxisLabels,
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: '',
                        axisLabel: {
                            formatter: '$ {value}'
                        }
                    },
                    {
                        type: 'value',
                        name: '',
                        axisLabel: {
                            formatter: ''
                        }
                    }
                ],
                series: [
                    {
                        name: 'Invoice Amount',
                        type: 'bar',
                        itemStyle: {
                            color: '#ffc107'
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            //color: '#fff',
                            rotate: 90,
                            formatter: function (row) {
                                if (row.data === 0 || row.data === "0.00") {
                                    return 0
                                }
                                return convertToIntlCurrency(row?.data ?? 0)
                            }
                        },
                        tooltip: {
                            valueFormatter: function (value) {
                                return `${defaultCurrency} ` + (value != 0 ? (convertToIntlCurrency(value)) : 0);
                            }
                        },
                        data: openInvoiceData
                    },
                    {
                        name: 'Outstanding Amount',
                        type: 'bar',
                        itemStyle: {
                            color: '#7D0849'
                        },
                        label: {
                            show: true,
                            position: 'inside',
                            //color: '#fff',
                            rotate: 90,
                            formatter: function (row) {
                                if (row.data === 0 || row.data === "0.00") {
                                    return 0
                                }
                                return convertToIntlCurrency(row?.data ?? 0)
                            }
                        },
                        tooltip: {
                            valueFormatter: function (value) {
                                return `${defaultCurrency} ` + (value != 0 ? (convertToIntlCurrency(value)) : 0);
                            }
                        },
                        data: closedInvoiceData
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
    }, [props.data.chartData, defaultCurrency]);

    return <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>;

};

export default OpenvscloseChart;