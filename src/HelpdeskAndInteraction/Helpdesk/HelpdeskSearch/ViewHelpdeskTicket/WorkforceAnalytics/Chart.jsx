import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const Chart = (props) => {
    const chartRef = useRef(null);

    useEffect(() => {
        const seriesData = props?.data?.map((ele) => ({ name: ele?.keys, value: Number(ele?.percentage) })) || []
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            title: {
                text: "No data available",
                left: "center",
                top: "center",
                show: seriesData?.length === 0
            },
            tooltip: {
                trigger: 'item',
                // formatter: function (params) {
                //     return '<div className="custom-tooltip">' +
                //         '<p>' + params.name + '</p>' +
                //         '<p>' + params.data.tablevalue + '</p>' +
                //         '</div>'
                // }
            },
            legend: {
                orient: 'horizontal',
                left: 'center'
            },
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: '60%',
                    data: seriesData ?? [],
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
        myChart.on('click', (params) => {
            props?.handlers?.OnClick?.(params)
        });
        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [props?.data]);

    return <div ref={chartRef} style={{ width: '100%', height: '300px' }}></div>;
};

export default Chart;