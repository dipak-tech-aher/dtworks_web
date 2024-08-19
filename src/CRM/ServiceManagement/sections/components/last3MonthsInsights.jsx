import React, { useContext, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { statusConstantCode } from '../../../../AppConstants';

const Last3MonthsInsights = (props) => {
    const { data } = useContext(Service360Context);
    const { subscriptionDetails } = data;
    const [insights, setInsights] = useState([]);

    useEffect(() => {
        post(`${properties.ACCOUNT_DETAILS_API}/insights`, { serviceNo: subscriptionDetails?.serviceNo }).then((response) => {
            if (response?.data) {
                setInsights(response.data)
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
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['Positive', 'Negative'],
                itemHeight: 3
            },
            xAxis: [
                {
                    type: 'category',
                    data: ['Customer Feedback'],
                    name: 'Customer Feedback',
                    nameLocation: 'middle',
                    nameGap: 10,
                    nameTextStyle: {
                        fontSize: 16
                    },
                    axisLabel: {
                        show: false
                    }
                }
            ],
            yAxis: [
                {
                    axisLabel: {
                        show: false
                    }
                }
            ],
            series: [
                {
                    name: 'Positive',
                    type: 'bar',
                    color: '#5470C6',
                    smooth: true,
                    data: [(insights?.chartData?.positive ?? 0).toFixed(2)]
                },
                {
                    name: 'Negative',
                    type: 'bar',
                    color: '#F14F33',
                    smooth: true,
                    data: [(insights?.chartData?.negative ?? 0).toFixed(2)]
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
    }, [insights])
    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Last 3 months Insights</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row">
                        <div className="col-md">
                            <div className="cust-table mt-5">
                                <table role="table" className="table table-responsive table-striped dt-responsive nowrap w-100" style={{ textAlign: "center", marginLeft: 0 }}>
                                    <thead>
                                        <tr role="row">
                                            <th className="font-weight-bold">Open and Closed</th>
                                            <th className="font-weight-bold">Total TAT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {insights?.tableData?.length ? insights?.tableData?.map(x => (
                                            <tr key={x.oOpCl}>
                                                <td>{capitalizeFirstLetter(x.oOpCl)}</td>
                                                <td>{x.oTotTat}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={2}>No records found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="col-md-7">
                            <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Last3MonthsInsights;