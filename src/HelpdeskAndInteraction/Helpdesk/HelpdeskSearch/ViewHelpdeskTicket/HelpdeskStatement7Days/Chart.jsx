import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
    const chartRef = useRef(null);
    let { ChartData } = props.data;
    const chartEnable = () => {
        let show = false
        ChartData && Object.keys(ChartData).forEach(item => {
            if (ChartData[item]) show = true;
        })
        return show
    }
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            title: {
                show: !chartEnable(),
                textStyle: {
                    color: "grey",
                    fontSize: 20
                },
                text: "No data available",
                left: "center",
                top: "center"
            },
            tooltip: {
                trigger: 'item'
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                show: false
            },
            series: (chartEnable()) ? [
                {
                    name: '',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: [
                        {
                            value: ChartData?.total ?? 0,
                            name: 'Total',
                            itemStyle: {
                                color: '#5470C6'
                            }
                        },
                        {
                            value: ChartData?.open ?? 0,
                            name: 'Open',
                            itemStyle: {
                                color: '#9FE080'
                            }
                        },
                        {
                            value: ChartData?.closed ?? 0,
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
            ] : []
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