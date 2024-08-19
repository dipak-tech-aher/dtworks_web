import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
    let { ChartData } = props
    const chartRef = useRef(null)

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
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
                data: ChartData && ChartData.length > 0 ? ChartData[0].Xaxis : [],
                show: ChartData && ChartData.length > 0 ? true : false,
            },
            yAxis: {
                type: 'value'
            },
            tooltip: {
                trigger: 'axis'
            },
            series: [
                {
                    data: ChartData && ChartData.length > 0 ? ChartData[0].Yaxis : [],
                    type: 'bar',
                    label: {
                        show: true,
                        position: 'inside'
                    }
                }
            ]
        };
        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }
        myChart.on('click', (params) => {
            props?.handlers?.OnClick?.(params)
        });
        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [ChartData]);

    return <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>;
};

export default Chart;