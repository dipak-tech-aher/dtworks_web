import * as echarts from 'echarts'
import React, { useEffect, useRef } from 'react'

const Pie = (props) => {

    const chartRef = useRef(null);
    const { interactionLookUp = {} } = props?.data ?? {}

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const option = {
            title: {
                text: '',
                subtext: '',
                left: 'center'
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                show: false
            },
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: [
                        {
                            value: interactionLookUp?.total ?? 0,
                            name: 'Total',
                            itemStyle: {
                                color: '#5470C6'
                            }
                        },
                        {
                            value: interactionLookUp?.open ?? 0,
                            name: 'Open',
                            itemStyle: {
                                color: '#9FE080'
                            }
                        },
                        {
                            value: interactionLookUp?.closed ?? 0,
                            name: 'Closed',
                            itemStyle: {
                                color: '#F24949'
                            }
                        }
                    ],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
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
    }, [interactionLookUp?.closed, interactionLookUp?.open, interactionLookUp?.total, props.data.chartData]);
    return (<div style={{ height: '100%' }}>
        <div ref={chartRef} id="chart-container" style={{ position: "relative", height: "280px", overflow: "hidden" }} ></div>
    </div>)

}

export default Pie;