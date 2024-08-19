import * as echarts from 'echarts'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom';

const StackedBar = (props) => {

    const chartRef = useRef(null);
    const { interactionLookUp } = props?.data ?? {}
    const [xAxisData, setXAxisData] = useState([])
    const [yAxisData, setYAxisData] = useState([])

    // let xAxisData = []
    // let yAxisData = []
    const formatSeriesData = useCallback(() => {
        if (interactionLookUp && interactionLookUp.length > 0) {
            const formattedData = interactionLookUp.map(({ channel, open, closed }) => ({
                x: channel,
                open: open ? open.count || 0 : 0,
                closed: closed ? closed.count || 0 : 0
            }));

            const xAxis = [];
            const openSeries = [];
            const closedSeries = [];

            formattedData.forEach(data => {
                xAxis.push(data.x);
                openSeries.push(data.open);
                closedSeries.push(data.closed);
            });

            unstable_batchedUpdates(() => {
                setXAxisData(xAxis);
                setYAxisData([
                    {
                        name: 'open',
                        type: 'bar',
                        barGap: 0,
                        label: { show: true },
                        emphasis: { focus: 'series' },
                        data: openSeries
                    },
                    {
                        name: 'closed',
                        type: 'bar',
                        label: { show: true },
                        barGap: 0,
                        emphasis: { focus: 'series' },
                        data: closedSeries
                    }
                ]);
            });
        }
    }, [interactionLookUp]);



    // const formatSeriesData = useCallback(() => {
    //     setXAxisData(interactionLookUp?.map(s => s.channel))
    //     setYAxisData([{
    //         name: 'open',
    //         type: 'bar',
    //         barGap: 0,
    //         emphasis: {
    //             focus: 'series'
    //         },
    //         data: interactionLookUp?.map(s => s.open?.count ?? 0)
    //     },
    //     {
    //         name: 'closed',
    //         type: 'bar',
    //         barGap: 0,
    //         emphasis: {
    //             focus: 'series'
    //         },
    //         data: interactionLookUp?.map(s => s.closed?.count ?? 0)
    //     }])
    // }, [interactionLookUp])

    useEffect(() => {
        formatSeriesData()
    }, [formatSeriesData, interactionLookUp])

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['open', 'closed']
            },
            toolbox: {
                show: true,
                orient: 'vertical',
                left: 'right',
                top: 'center',
                feature: {
                    magicType: { show: true, type: ['line', 'bar', 'stack'] },
                    saveAsImage: { show: true }
                }
            },
            xAxis: [
                {
                    type: 'category',
                    axisTick: { show: false },
                    data: xAxisData
                }
            ],
            yAxis: [
                {
                    type: 'value'
                }
            ],
            series: yAxisData
        };

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [xAxisData, yAxisData]);
    return (<div style={{ height: '100%' }}>
        <div ref={chartRef} id="chart-container" style={{ position: "relative", height: "280px", overflow: "hidden" }} ></div>
    </div>)

}
export default StackedBar;