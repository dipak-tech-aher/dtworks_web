import React, { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';

const LineChart = (props) => {
    const chartRef = useRef(null);

    const option = useMemo(() => ({
        title: {
            show: props?.seriesData?.length === 0,
            textStyle: {
                color: "grey",
                fontSize: 20
            },
            text: "No data available",
            left: "center",
            top: "center"
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: [
            {
                show: props?.seriesData?.length > 0,
                type: 'category',
                data: props?.xAxis ?? [],
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                nameGap: 45
            }
        ],
        series: props?.seriesData ?? [],
        label: {
            show: true,
            position: 'top'
        },
    }), [props.seriesData, props.xAxis]);

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        const resizeHandler = () => myChart.resize();
        window.addEventListener('resize', resizeHandler);
        
        return () => {
            window.removeEventListener('resize', resizeHandler);
            myChart.dispose();
        };
    }, [option]);

    return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;
}

export default LineChart;
