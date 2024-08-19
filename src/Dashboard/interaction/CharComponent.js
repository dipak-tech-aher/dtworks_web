import { useEffect, memo, useRef } from "react";
import * as echarts from 'echarts';

export const ChartComponent = memo(({ chartData, countClicked,loading }) => {
    const chartRef = useRef(null);

    useEffect(() => {
        if (!loading && chartRef.current) {
            const chartDom = chartRef.current;
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

            const option = {
                // animation: false, // Disable animation
                title: {
                    show: !Object.keys(chartData ?? {})?.length,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No interactions found",
                    left: "center",
                    top: "center"
                },
                xAxis: {
                    type: 'category',
                    data: ['0 to 3', '3 to 5', '> 5']
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        data: [
                            {
                                value: chartData?.oIntxn3DayCnt ?? 0,
                                itemStyle: {
                                    color: '#d85454'
                                },
                                category: '0_3DAYS',
                                key: chartData.key
                            },
                            {
                                value: chartData?.oIntxn5DayCnt ?? 0,
                                itemStyle: {
                                    color: '#ff9e45'
                                },
                                category: '3_5DAYS',
                                key: chartData.key
                            },
                            {
                                value: chartData?.oIntxnMoreThan5DayCnt ?? 0,
                                itemStyle: {
                                    color: '#509ade'
                                },
                                category: 'MORE_5DAYS',
                                key: chartData.key
                            }
                        ],
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
                countClicked(params?.data?.key, params?.data?.category)
            });

            window.addEventListener('resize', myChart.resize);

            return () => {
                window.removeEventListener('resize', myChart.resize);
                myChart.dispose();
            };
        }
    }, [chartData]);

    return (
        <div ref={chartRef} style={{ height: '346px' }}></div>
    )
})