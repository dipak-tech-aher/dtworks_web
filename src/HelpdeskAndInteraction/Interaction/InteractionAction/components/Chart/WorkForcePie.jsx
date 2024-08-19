import * as echarts from 'echarts'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const WorkForcePie = (props) => {
    const chartRef = useRef(null);
    const { interactionLookUp = {} } = props?.data ?? {}

    const [workforceChat, setWorkforceChat] = useState()

    const formatteData = useCallback(() => {
        const seriesData = interactionLookUp?.map((ele) => ({ name: ele?.keys, value: ele?.percentage })) || []
        setWorkforceChat(seriesData)
    }, [interactionLookUp])

    useEffect(() => {
        formatteData()
    }, [formatteData])

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        })

        const option = {
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
                    data: workforceChat,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        }

        if (option && typeof option === 'object') {
            myChart.setOption(option)
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose()
        };
    }, [workforceChat])

    return (
        <div style={{ height: '100%' }}>
            <div ref={chartRef} id="chart-container" style={{ position: "relative", height: "280px", overflow: "hidden" }} >
            </div>
        </div>
    )
}

export default WorkForcePie