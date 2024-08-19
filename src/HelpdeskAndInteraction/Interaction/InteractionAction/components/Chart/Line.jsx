import * as echarts from 'echarts';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';

const Line = (props) => {

    const chartRef = useRef(null);
    const { statementHistory = [] } = props?.data
    const [weeklyInteractionCount, setWeeklyInteractionCount] = useState([])

    useEffect(() => {
        const lastSevenDays = Array.from({ length: 7 }, (_, i) => moment().subtract(i, 'days').format('YYYY-MM-DD')).reverse()
        const xAxisData = lastSevenDays && lastSevenDays?.map((e) => e && e && moment(e, 'YYYY-MM-DD HH:mm:ss').format('ddd'))
        const seriesData = lastSevenDays.map(day => statementHistory[day] ?? 0)
        setWeeklyInteractionCount({ xAxisData, seriesData: seriesData })
    }, [statementHistory])

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });


        const option = {
            title: {
                show: !weeklyInteractionCount?.xAxisData?.length > 0,
                // textStyle: {
                //   color: "grey",
                //   fontSize: 20
                // },
                text: "No details are available",
                left: "center",
                top: "center"
            },
            xAxis: {
                type: 'category',
                data: weeklyInteractionCount?.xAxisData ?? [],
                show: !!weeklyInteractionCount?.xAxisData?.length > 0
            },
            yAxis: {
                type: 'value',
                show: !!weeklyInteractionCount?.xAxisData?.length > 0
            },
            series: [
                {
                    data: weeklyInteractionCount?.seriesData ?? [],
                    type: 'line',
                    smooth: true,
                    color: '#1C64F2',
                    label: {
                        show: true
                    },
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
        }

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [weeklyInteractionCount]);
    return <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>;

}

export default Line