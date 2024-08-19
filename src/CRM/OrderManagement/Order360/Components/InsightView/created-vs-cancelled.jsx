import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import moment from 'moment';

const CreatedVsCancelled = (props) => {
    const { data: { selectedProductId } } = props;
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        post(`${properties.ORDER_API}/insights360`, { type: 'createdvscancelled', productId: selectedProductId }).then((response) => {
            if (response?.data?.length) {
                let tempArray = response.data.map(x => ({ ...x, oDate: moment(x.oDate).format('MMM YY') }));
                var result = Object.values(tempArray.reduce((hash, item) => {
                    if (!hash[item.oDate]) {
                        hash[item.oDate] = { oDate: item.oDate, oCreated: 0, oCancelled: 0 };
                    }
                    hash[item.oDate].oCreated += item.oCreated;
                    hash[item.oDate].oCancelled += item.oCancelled;
                    return hash;
                }, {}));
                console.log("createdvscancelled => ", result)
                setSeriesData(result);
            } else {
                setSeriesData([]);
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
                show: seriesData?.length > 0 ? false : true,
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
                            value: seriesData.reduce((n, { oCreated }) => n + oCreated, 0),
                            name: 'Order Created',
                            itemStyle: {
                                color: '#5470C6'
                            }
                        },
                        {
                            value: seriesData.reduce((n, { oCancelled }) => n + oCancelled, 0),
                            name: 'Order Cancelled',
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
        <div ref={chartRef} style={{ width: '100%', height: '380px' }}></div>
    )
}

export default CreatedVsCancelled;