import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import chroma from "chroma-js";

const Chart = (props) => {
    const chartRef = useRef(null);
    let { ChartData } = props.data
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        console.log(ChartData)
        const option = {
            title: {
                show: ChartData?.length === 0,
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
                boundaryGap: false,
                data: (ChartData && ChartData.length > 0) ? ChartData[0].xAxis : [],
                show:(ChartData && ChartData.length > 0) ? true : false
            },
            yAxis: {
                type: 'value'
            },
            tooltip: {
                trigger: 'axis'
            },
            series: [
                {
                    data: (ChartData && ChartData.length > 0) ? ChartData[0].yAxis : [],
                    label: {
                        show: true,
                        position: 'top'
                      },
                    type: 'line',
                    smooth: true,
                    color: '#1C64F2',
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 1,
                                color: 'rgba(28,100,242,0)'
                            },
                            {
                                offset: 0,
                                color: 'rgba(28,100,241,0.4)'
                            }
                        ])
                    }
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
    }, [ChartData]);

    return <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>;
};

export default Chart;