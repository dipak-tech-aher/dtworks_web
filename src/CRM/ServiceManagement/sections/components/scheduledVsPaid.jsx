import React, { useContext, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';

const ScheduledVsPaid = (props) => {
    const { data } = useContext(Service360Context);
    const { subscriptionDetails } = data;
    const [seriesData, setSeriesData] = useState({});

    useEffect(() => {
        const history = async () => {
            try {
                let schedule = await post(`${properties.CONTRACT_API}/history?limit=1000&page=0`, { serviceUuid: subscriptionDetails?.serviceUuid });
                let paid = await post(`${properties.INVOICE_API}/search?limit=&page=`, { serviceUuid: subscriptionDetails?.serviceUuid });
                schedule = schedule?.data?.rows;
                paid = paid?.data?.rows;
                setSeriesData({
                    scheduled: schedule.reduce((total, obj) => Number(obj.rcAmount) + total, 0),
                    paid: paid.filter(x => x.invoiceStatus === 'INV-CLOSED').reduce((total, obj) => Number(obj.invAmt) + total, 0)
                });
            } catch (error) {
                console.error(error);
            }
        };
        history();
    }, [subscriptionDetails]);

    const chartRef = useRef(null);

    const initializeChart = () => {
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
            xAxis: [
                {
                    type: 'category',
                    data: ['Scheduled vs Paid'],
                    name: 'Scheduled vs Paid',
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
                    type: 'value',
                    name: 'Amount',
                    nameLocation: 'middle',
                    nameGap: 50,
                    nameTextStyle: {
                        fontSize: 16
                    },
                    axisLabel: {
                        formatter: '${value}',
                        show: true
                    }
                }
            ],
            series: [
                {
                    name: 'Scheduled',
                    type: 'bar',
                    color: '#F8961E',
                    data: [(seriesData.scheduled ?? 0).toFixed(2)],
                    tooltip: {
                        valueFormatter: (value) => {
                            return ' $' + value;
                        }
                    }
                },
                {
                    name: 'Paid',
                    type: 'bar',
                    color: '#5470C6',
                    data: [(seriesData.paid ?? 0).toFixed(2)],
                    tooltip: {
                        valueFormatter: (value) => {
                            return ' $' + value;
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
    };

    useEffect(() => {
        if (Object.keys(seriesData).length > 0) {
            initializeChart();
        }
    }, [seriesData]);

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Scheduled vs Paid</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row mt-0">
                        <div className="col-6">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2"> Total Scheduled Amount </span>
                                <h4 className="font-bold cursor-pointer m-0"> ${(seriesData.scheduled ?? 0).toFixed(2)} </h4>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2"> Total Paid Amount </span>
                                <h4 className="font-bold cursor-pointer m-0"> ${(seriesData.paid ?? 0).toFixed(2)} </h4>
                            </div>
                        </div>
                    </div>
                    <div className="skel-graph-sect mt-0">
                        <div ref={chartRef} style={{ width: '100%', height: '350px' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduledVsPaid;
