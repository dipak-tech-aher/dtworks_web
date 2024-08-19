import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import moment from 'moment'
import axios from 'axios'
import * as echarts from 'echarts';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
const LiveProjectWise = (props) => {
    const chartRef = useRef(null);

    const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

    const { searchParams, isParentRefresh } = props?.data;
    const [chartOption, setChartOption] = useState({});
    const [byProjectData, setByProjectData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [seriesData, setSeriesData] = useState([]);
    const [typeData, setTypeData] = useState({});
    const getProjectWiseHelpdesk = (searchParams) => {
        const currentDate = moment();
        const futureDate = currentDate.add(3, 'hours');
        const formattedFutureDate = futureDate.format('YYYY-MM-DD HH:mm:ss');
        axios.post(API_ENDPOINT + properties.INTERACTION_API + '/live-project-wise', {searchParams: { ...searchParams, fromDate: moment().format('YYYY-MM-DD'), toDate: formattedFutureDate }}, {
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
                authorization: JSON.parse(localStorage.getItem("auth")).accessToken
            }
        }).then((response) => {
            const respData = response?.data?.data?.rows;
            setByProjectData(respData);
            const projectCounts = {};
            respData?.forEach(item => {
                const description = item?.projectDesc?.description ?? 'UNASSIGNED';
                if (projectCounts[description]) {
                    projectCounts[description]++;
                } else {
                    projectCounts[description] = 1;
                }
            });

                const updateTypeData = {};

                const currentTime = moment();
                const twoHoursAgo = moment().subtract(2, 'hours');
                const xAxisLabels = [];

                for (let i = moment(twoHoursAgo); i <= currentTime; i.add(15, 'minutes')) {
                    xAxisLabels.push(i.format('HH:mm'));
                }

                respData?.forEach(item => {
                    const createdAtHour = moment(new Date(item?.assignedDate)).format('HH:mm');
                    const status = item?.oStatus;
                    const closestIndex = xAxisLabels.findIndex(label => {
                        const labelTime = moment(label, 'HH:mm');
                        const createdTime = moment(createdAtHour, 'HH:mm');
                    
                        // Check if the created time falls within the 15-minute interval
                        return createdTime.isSameOrAfter(labelTime) && createdTime.isBefore(labelTime.clone().add(15, 'minutes'));
                    });
                    // Ensure closestIndex is within valid bounds
                    if (closestIndex !== -1) {                        
                        // Calculate the intervalIndex based on the difference in minutes
                        const minutesDifference = moment(createdAtHour, 'HH:mm').diff(moment(xAxisLabels[closestIndex], 'HH:mm'), 'minutes');

                        const intervalIndex = closestIndex + Math.round(minutesDifference / 15);
                        
                        if (!updateTypeData[status]) {
                            updateTypeData[status] = Array(xAxisLabels?.length).fill(0);
                        }

                        if (intervalIndex !== -1) {
                            // updateTypeData[status][closestIndex] += 1;
                            updateTypeData[status][intervalIndex] += 1;

                        }
                    }
                });

                setTypeData(updateTypeData);
                let updatedChartData = xAxisLabels.map((label, index) => {
                    const dataObject = { label };

                    Object.keys(updateTypeData).forEach(status => {
                        dataObject[status] = updateTypeData[status][index] || 0;
                    });

                    return dataObject;
                });

                setSeriesData(updatedChartData);
                setIsLoading(false);
 
        }).catch(error => {
            console.error(error);
        });
    }

    useEffect(() => {
        getProjectWiseHelpdesk(searchParams);
    }, [isRefresh, isParentRefresh, searchParams])

    useEffect(() => {
        const interval = setInterval(() => {
            getProjectWiseHelpdesk(searchParams);
        }, properties?.LIVESTREAMTIME);
        return () => clearInterval(interval);
    }, []);

    // useEffect(() => {
    //     const chartDom = chartRef.current;
    //     const myChart = echarts.init(chartDom, null, {
    //         renderer: 'canvas',
    //         useDirtyRect: false
    //     });

    //     if (chartOption && typeof chartOption === 'object') {
    //         myChart.setOption(chartOption);
    //     }

    //     window.addEventListener('resize', myChart.resize);

    //     return () => {
    //         window.removeEventListener('resize', myChart.resize);
    //         myChart.dispose();
    //     };
    // }, [chartOption]);

    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Interaction by Projects </span>
                <div className="skel-dashboards-icons">
                    <span onClick={() => setIsRefresh(!isRefresh)}>
                        <i className="material-icons">refresh</i>
                    </span>
                </div>
            </div>
            <hr className="cmmn-hline" />
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="skel-graph-sect mt-4">
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={seriesData} isAnimationActive={true} animationBegin={0} animationDuration={1500}>
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <CartesianGrid stroke="#f5f5f5" />
                            {Object.keys(typeData).map(status => (
                                <Line
                                    key={status}
                                    type="monotone"
                                    dataKey={status}
                                    stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
                                    dot={{ stroke: 'none', fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`, r: 5 }}
                                    animationDuration={1500}
                                >
                                    <LabelList dataKey={status} position="top" />
                                </Line>
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default LiveProjectWise;