import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { isEmpty } from 'lodash'

const ChartComponent = (props) => {
    const chartRef = useRef(null);
    const chartData = props?.data?.chartData || []
    const appointmentData = props?.data?.appointmentData || []
    // console.log('appointmentData-------->', appointmentData)
    useEffect(() => {
        const chartDom = chartRef.current;
        const chartInstance = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const statusCounts = appointmentData?.reduce((acc, appointment) => {
            const statusDesc = appointment?.oStatusDesc;
            acc[statusDesc] = (acc[statusDesc] || 0) + 1;
            return acc;
        }, {});

        const option = {
            title: {
                show: Object.keys(statusCounts)?.length === 0,
                textStyle: {
                    color: "grey",
                    fontSize: 20
                },
                text: "No data available",
                left: "center",
                top: "center"
            },
            // toolbox: {
            //     show: true,
            //     feature: {
            //         saveAsImage: { show: true },
            //         magicType: { show: true, type: ['bar'] }, // assuming you want a bar chart
            //     }
            // },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            label: {
                show: true
            },
            xAxis: [
                {
                    type: 'category',
                    data: Object.keys(statusCounts),
                    axisLabel: {
                        interval: 0,
                        width: "90",
                        overflow: "break",
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: 'Status Count',
                    type: 'bar', // or 'line' depending on your chart type
                    data: Object.values(statusCounts)
                }
            ]
        };


        const optionEx = {
            title: {
                show: (chartData?.[0]?.xAxisData?.length === 0 || !chartData?.[0]?.xAxisData) ? true : false,
                textStyle: {
                    color: "grey",
                    fontSize: 20
                },
                text: "No data available",
                left: "center",
                top: "center"
            },
            // toolbox: {
            //     show: true,
            //     feature: {
            //         saveAsImage: { show: true },
            //         magicType: { show: true, type: ['line', 'bar'] },
            //     }
            // },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: chartData?.[0]?.legend || []
            },
            xAxis: [
                {
                    type: 'category',
                    show: chartData?.[0]?.xAxisData?.length === 0 ? false : true,
                    axisTick: { show: true },
                    data: chartData.length > 0 ? chartData?.[0]?.xAxisData : [],
                    axisLabel: {
                        interval: 0,
                        width: "90",
                        overflow: "break",
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: chartData.length > 0 ? chartData?.[0]?.seriesData : []
        };

        if (option && typeof option === 'object') {
            chartInstance.setOption(option);
        }

        window.addEventListener('resize', chartInstance.resize);

        return () => {
            window.removeEventListener('resize', chartInstance.resize);
            chartInstance.dispose();
        };
    }, [props.data.chartData]);

    return <div ref={chartRef} style={{ width: '100%', height: '400px' }} />;
};

export default ChartComponent;