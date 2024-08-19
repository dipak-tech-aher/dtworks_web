import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import moment from 'moment';

const ClosureVsBillingStart = (props) => {
    const { data: { selectedProductId } } = props;
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        post(`${properties.ORDER_API}/insights360`, { type: 'cls_cnt_vs_bill_start_cnt', startDate: '2024-01-01', endDate: '2025-12-31', productId: selectedProductId }).then((response) => {
            if (response?.data?.length) {
                let tempArray = response.data.map(x => ({ ...x, oInterval: moment(x.oInterval).format('MMM YY') }));
                setSeriesData(tempArray);
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
                data: ['Order Closure', 'Billing Start Date']
            },
            xAxis: [
                {
                    type: 'category',
                    data: seriesData.map(x => x.oInterval),
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
                    name: 'Order Closure',
                    type: 'bar',
                    itemStyle: {
                        color: '#F8961E'
                    },
                    data: seriesData.map(x => x.oOrderCloseCnt)
                },
                {
                    name: 'Billing Start Date',
                    type: 'bar',
                    itemStyle: {
                        color: '#5470C6'
                    },
                    data: seriesData.map(x => x.oBillingStartCount)
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

export default ClosureVsBillingStart;