import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import moment from 'moment';

const ReceivedVsFulfilled = (props) => {
    const { data: { selectedProductId } } = props;
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        post(`${properties.ORDER_API}/insights360`, { type: 'receivedvsfulfilled', productId: selectedProductId }).then((response) => {
            if (response?.data?.length) {
                let tempArray = response.data.map(x => ({ ...x, oDate: moment(x.oDate).format('MMM YY') }));
                var result = Object.values(tempArray.reduce((hash, item) => {
                    if (!hash[item.oDate]) {
                        hash[item.oDate] = { oDate: item.oDate, oFulfilled: 0, oReceived: 0 };
                    }
                    hash[item.oDate].oFulfilled += item.oFulfilled;
                    hash[item.oDate].oReceived += item.oReceived;
                    return hash;
                }, {}));
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
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    crossStyle: {
                        color: '#999'
                    }
                }
            },
            toolbox: {
                feature: {
                    dataView: { show: false, readOnly: false },
                    magicType: { show: false, type: ['line', 'bar'] },
                    restore: { show: false },
                    saveAsImage: { show: false }
                }
            },
            legend: {
                data: ['Order Received', 'Order Fulfill Date', 'Order Fullfill Rate']
            },
            xAxis: [
                {
                    type: 'category',
                    data: seriesData.map(x => x.oDate),
                    axisPointer: {
                        type: 'shadow'
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value'
                },
                {
                    type: 'value'
                }
            ],
            series: [
                {
                    name: 'Order Received',
                    type: 'bar',
                    data: seriesData.map(x => x.oReceived)
                },
                {
                    name: 'Order Fulfill Date',
                    type: 'bar',
                    data: seriesData.map(x => x.oFulfilled)
                },
                {
                    name: 'Order Fullfill Rate',
                    type: 'line',
                    data: seriesData.map(x => {
                        return {
                            value: Math.round((x.oFulfilled/x.oReceived) * 100)
                        };
                    }),
                    tooltip: {
                        valueFormatter: (value) => (isNaN(value) ? 0 : value) + '%'
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
        <div ref={chartRef} style={{ width: '100%', height: '418px' }}></div>
    )
}

export default ReceivedVsFulfilled;