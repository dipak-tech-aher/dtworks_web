import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const LiveBar = (props) => {
    const { chartData } = props?.data
    const { width, height } = props?.chartStyle
    // const { fetchAndUpdateSalesGrowth } = props?.handler
    const chartRef = useRef(null)
    const myChart = useRef(null)
    // console.log('chartData????????????????? ', chartData)
    useEffect(() => {
        myChart.current = echarts.init(chartRef.current, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const option = {
            title: {
                show: chartData?.length === 0 ? true : false,
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
                show:  true,
                data: chartData?.map(x => x.name),
                axisLabel: {
                    color: 'black',
                    fontSize: 12,
                }

            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    data: chartData?.map(x => x.value),
                    type: 'bar',
                    barWidth: 30,
                    showBackground: true,
                    backgroundStyle: {
                        color: 'rgba(180, 180, 180, 0.2)'
                    }
                }
            ]
        }

        if (option && typeof option === 'object') {
            myChart.current.setOption(option);
        }

        const cleanup = () => {
            // clearInterval(dataUpdateInterval);
            myChart.current.dispose();
        }

        // const dataUpdateInterval = setInterval(() => {
        //     fetchAndUpdateSalesGrowth(myChart.current);
        // }, 3000); // 30 seconds

        // window.addEventListener('resize', myChart.resize);

        // return () => {
        //     window.removeEventListener('resize', myChart.resize);
        //     myChart.dispose();
        // };
        return cleanup

    }, [chartData])

    return <div ref={chartRef} style={{ width, height }}></div>;
}

export default LiveBar;