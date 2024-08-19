import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';

const OrderVsBilled = (props) => {
    const { data: { selectedProductId } } = props;
    const [seriesData, setSeriesData] = useState({});

    useEffect(() => {
        post(`${properties.ORDER_API}/insights360`, { type: 'value_vs_billed_value', productId: selectedProductId }).then((response) => {
            if (response?.data?.length) {
                setSeriesData(response.data[0])
            } else {
                setSeriesData({});
            }
        }).catch(error => {
            console.error(error);
        });
    }, [])

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1)?.toLowerCase();
    };

    const chartRef = useRef(null);
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            title: {
                show: Object.keys(seriesData).length > 0 ? false : true,
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
                left: 'center',
                show: true
            },
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: [
                        {
                            value: Math.round(seriesData?.oOrderValue ?? 0),
                            name: 'Order Value',
                            itemStyle: {
                                color: '#5470C6'
                            }
                        },
                        {
                            value: Math.round(seriesData?.oBilledValue ?? 0),
                            name: 'Billed Value',
                            itemStyle: {
                                color: '#F8961E'
                            }
                        },

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
    }, [seriesData])
    return (
        <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div>
    )
}

export default OrderVsBilled;