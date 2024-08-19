import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { properties } from '../../../../properties';
import { post } from '../../../../common/util/restUtil';
import { OmniChannelContext } from '../../../../AppContext';

export default function ChannelUtilization() {
    const { data, Loader } = useContext(OmniChannelContext);
    const { channel, entity, searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment } = searchParams;;
    const [chartData, SetChartData] = useState();
    const [isLoading, setIsLoading] = useState(false);
    const chartRef = useRef(null);
    const apiDetails = {
        Helpdesk: {
            endpoint: `${properties.HELPDESK_API}/omni-dashboard`
        },
        Interaction: {
            endpoint: `${properties.INTERACTION_API}/omni-dashboard`
        }
    }

    const getChartData = (entity) => {
        try {
            let requestObj = { ...searchParams }
            if (channel !== 'ALL') requestObj.channel = channel
            setIsLoading(true)
            post(apiDetails[entity].endpoint + '/channel-utilization', { searchParams: requestObj }).then((response) => {
                if (response?.data?.length) SetChartData(response?.data); else SetChartData([]);
            }).catch(error => {
                console.log(error)
                SetChartData([])
            }).finally(() => {
                loaderClose()
            })
        } catch (e) {
            console.log('error', e)
        }

    }
    const loaderClose = () => setIsLoading(false)
    useEffect(() => {
        if (fromDate && toDate) getChartData(entity);
    }, [channel, entity, channel, fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, isPageRefresh])

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            title: {
                show: chartData?.length > 0 ? false : true,
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
                bottom: '0%',
                left: 'center'
            },
            color: ['#FF8B3F', '#7CED47', '#FEC53D', '#C64CFF', '#00B2BD',
                '#7CED47', '#4761ED', '#00A3FF', '#6e7074', '#546570', '#c4ccd3'],
            series: [
                {
                    name: 'Channel Utilization',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    label: {
                        show: true,
                        formatter: "{b} ({c}%)",
                    },
                    labelLine: {
                        show: true
                    },
                    data: chartData?.map((val) => {
                        return { value: val.oPercentage, name: val.oChnName }
                    })
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
    }, [chartData]);
    return (
        <div className="col-6 px-lg-1">
            <div className="cmmn-skeleton mh-480">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Channel Utilization
                    </span>
                </div>
                <hr className="cmmn-hline" />
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className="skel-graph-sect mt-0">
                        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                    </div>
                )}
            </div>
        </div>
    )
}