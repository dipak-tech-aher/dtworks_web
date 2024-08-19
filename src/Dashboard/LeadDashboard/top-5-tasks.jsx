import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { post } from "../../common/util/restUtil";
import { properties } from '../../properties';

const Top5Tasks = (props) => {
    const { searchParams, isParentRefresh } = props?.data;
    const [chartData, setChartData] = useState([]);
    const [responseData, setResponseData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const chartRef = useRef(null);

    useEffect(() => {
        let reqBody = { ...searchParams, type: "LIST" };
        post(properties.LEAD_API + "/top-5-tasks", { searchParams: reqBody }).then((resp) => {
            if (resp?.status === 200) {
                const respData = resp?.data;
                setResponseData(respData);

                const data = respData.map((ele, i) => ({
                    name: ele?.oTaskName,
                    value: i + 1
                }));

                const groupedData = data.reduce((acc, item) => {
                    const existingItem = acc.find(group => group.name === item.name);
                    if (existingItem) {
                        existingItem.value += Number(item.value);
                    } else {
                        acc.push({ name: item.name, value: Number(item.value) });
                    }

                    return acc;
                }, []);

                setChartData(groupedData || []);
            }

        }).catch((error) => console.log(error));
    }, [isRefresh])

    useEffect(() => {
        console.log("chartData =====> ", chartData)
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const option = {
            title: {
                show: !responseData?.length > 0 ? true : false,
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
                top: '5%',
                left: 'center',
                // doesn't perfectly work with our tricks, disable it
                selectedMode: false,
                width: "85%",
                left: "0"
            },
            series: [
                {
                    name: 'Tasks',
                    type: 'pie',
                    radius: ['40%', '50%'],
                    center: ['50%', '50%'],
                    // adjust the start angle
                    startAngle: 180,
                    label: {
                        show: true,
                        formatter(param) {
                            // correct the percentage
                            return param.name + ' (' + param.percent + '%)';
                        }
                    },
                    data: chartData
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
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Top 5 Tasks </span>
                <div className="skel-dashboards-icons">
                    <a href="javascript:void(null)" >
                        <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                    </a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-graph h-400">
                    <div ref={chartRef} style={{ height: '450px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default Top5Tasks;