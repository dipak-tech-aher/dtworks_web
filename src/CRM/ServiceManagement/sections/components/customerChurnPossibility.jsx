import React, { useContext, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { statusConstantCode } from '../../../../AppConstants';

const CustomerChurnPossibility = (props) => {
    const { data } = useContext(Service360Context);
    const { subscriptionDetails } = data;
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        post(`${properties.ACCOUNT_DETAILS_API}/customer-churn-possibility`, { serviceNo: subscriptionDetails?.serviceNo }).then((response) => {
            if (response?.data) {
                setSeriesData(response.data);
            }
        }).catch(error => {
            console.error(error);
        });
    }, [])

    const chartRef = useRef(null);
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'white',
                borderColor: 'white',
                formatter: function (params) {
                    return `<strong>${params.data.name}: </strong>${params.data.value}%`;
                }
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: seriesData.map(x => x.oMonth)
            },
            yAxis: {
                axisLabel: {
                    formatter: '{value}%',
                    show: true
                }
            },
            series: [
                {
                    type: 'line',
                    stack: 'Total',
                    smooth: true,
                    data: seriesData.map(x => ({
                        value: x.oCount,
                        name: x.oChurnType,
                        smooth: true,
                        symbolSize: 12,
                        itemStyle: {
                            borderWidth: 10,
                            color: x.oChurnType === 'Potential Churners' ? '#f1556c' : '#0eb715'
                        }
                    }))
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
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title"> Customer Churn Possibility </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-4">
                    <div ref={chartRef} style={{ width: '100%', height: '518px' }}></div>
                </div>
            </div>
        </div>
    )
}

export default CustomerChurnPossibility;