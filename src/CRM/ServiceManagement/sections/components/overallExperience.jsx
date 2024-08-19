import React, { useContext, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { post } from "../../../../common/util/restUtil";
import { Service360Context } from '../../../../AppContext';
import { properties } from '../../../../properties';

const OverallExperience = (props) => {
    const { data, handlers } = useContext(Service360Context);
    const { subscriptionDetails } = data;
    const [selectedEntity, setSelectedEntity] = useState('all');
    const [seriesData, setSeriesData] = useState({});
    const chartRef = useRef(null);
    useEffect(() => {
        post(`${properties.ACCOUNT_DETAILS_API}/service-experience`, { serviceNo: subscriptionDetails?.serviceNo, serviceUuid: subscriptionDetails?.serviceUuid }).then((response) => {
            if (response.data) {
                setSeriesData(response.data ?? {})
            }
        }).catch(error => {
            console.error(error);
        });
    }, [])
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            title: {
                show: !seriesData.positive?.[selectedEntity] && !seriesData.negative?.[selectedEntity],
                textStyle: {
                    color: "grey",
                    fontSize: 20
                },
                text: "No data available",
                left: "center",
                top: "center"
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: 'white',
                borderColor: 'white',
                formatter: (params) => {
                    return params?.data?.metaData?.[selectedEntity] + '%';
                },
                axisPointer: {
                    type: 'shadow'
                }
            },
            legend: {
                data: ['Positive', 'Negative'],
                itemHeight: 3
            },
            xAxis: {
                type: 'value',
                boundaryGap: [0, 0.01]
            },
            yAxis: {
                type: 'category',
                axisLabel: { show: false },
                name: 'Overall Experience of Service in %',
                nameLocation: 'middle',
                nameGap: 25,
                nameTextStyle: {
                    fontSize: 16
                }
            },
            series: [
                {
                    name: 'Positive',
                    type: 'bar',
                    data: [{
                        value: seriesData.positive?.[selectedEntity],
                        name: 'Positive',
                        metaData: {
                            helpdesk: seriesData.positive?.helpdesk,
                            interaction: seriesData.positive?.interaction,
                            all: seriesData.positive?.all
                        }
                    }],
                    itemStyle: {
                        color: '#5470c6'
                    }
                },
                {
                    name: 'Negative',
                    type: 'bar',
                    data: [{
                        value: seriesData.negative?.[selectedEntity],
                        name: 'Negative',
                        metaData: {
                            helpdesk: seriesData.negative?.helpdesk,
                            interaction: seriesData.negative?.interaction,
                            all: seriesData.negative?.all
                        }
                    }],
                    itemStyle: {
                        color: '#f25136'
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
    }, [selectedEntity, seriesData])
    const changeEntity = (e) => {
        const { value } = e.target;
        setSelectedEntity(value);
    }
    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title"> Overall Experience of Service </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row mb-0">
                        <div className="col-md-auto ml-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="">By</label>
                                    <select onChange={changeEntity} className="form-control form-control-sm w-auto px-1 ml-2" defaultValue={selectedEntity}>
                                        <option value={'all'}>All</option>
                                        <option value={'helpdesk'}>Helpdesk</option>
                                        <option value={'interaction'}>Interaction</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div ref={chartRef} style={{ width: '100%', height: '418px' }}></div>
                </div>
            </div>
        </div>
    )
}

export default OverallExperience;