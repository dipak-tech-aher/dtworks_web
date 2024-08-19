import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Gauge = (props) => {
    const { chartData } = props?.data
    const { width, height } = props?.chartStyle
    // const { fetchAndUpdateSalesData } = props?.handler
    const chartRef = useRef(null)
    const myChart = useRef(null)

    // console.log('chartData', chartData)
    useEffect(() => {
        myChart.current = echarts.init(chartRef.current, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const option = {
            width,
            height,
            tooltip: {
              formatter: '{a} <br/>{b} : {c}%'
            },
            series: [
              {
                name: 'Pressure',
                type: 'gauge',
                detail: {
                  formatter: '{value}'
                },
                data: [
                  {
                    value: Number(chartData?.oNps) ?? 0,
                    name: 'SCORE'
                  }
                ]
              }
            ]
        }

        if (option && typeof option === 'object') {
            myChart.current.setOption(option);
        }

        const cleanup = () => {
            myChart.current.dispose();
        }

        // window.addEventListener('resize', myChart.resize);

        // return () => {
        //     window.removeEventListener('resize', myChart.resize);
        //     myChart.dispose();
        // };
        return cleanup

    }, [chartData])

    return <div ref={chartRef} style={{ width, height }}></div>;


}
export default Gauge;