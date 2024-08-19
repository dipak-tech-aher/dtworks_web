import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { properties } from '../../../properties';
import moment from 'moment'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';


const LiveCustomerWise = (props) => {
    const { searchParams, isParentRefresh } = props?.data

    const [chartData, setChartData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [seriesData, setSeriesData] = useState([]);
    const [typeData, setTypeData] = useState({});
    const chartRef = useRef(null);
    const currentDate = moment();
    const futureDate = currentDate.add(3, 'hours');
    const formattedFutureDate = futureDate.format('YYYY-MM-DD HH:mm:ss');
    const search = { ...searchParams, fromDate: moment().format('YYYY-MM-DD'), toDate: formattedFutureDate, categoryType: 'Internal', category: 'LIST' }

    const getCustomerWiseData = () => {
        const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

        axios.post(API_ENDPOINT + properties.INTERACTION_API + '/live-customer-wise', { searchParams: search }, {
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
                authorization: JSON.parse(localStorage.getItem("auth")).accessToken
            }
        }).then((resp) => {
            if (resp?.status == 200) {
                const respData = resp?.data?.data?.rows;
                const updateTypeData = {};

                const currentTime = moment();
                const twoHoursAgo = moment().subtract(2, 'hours');
                const xAxisLabels = [];

                for (let i = moment(twoHoursAgo); i <= currentTime; i.add(15, 'minutes')) {
                    xAxisLabels.push(i.format('HH:mm'));
                }

                respData?.forEach(item => {
                    const createdAtHour = moment(new Date(item?.oCreatedAt)).format('HH:mm');
                    const status = item?.oCustomerType;
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
            }
        }).catch((error) => console.log(error));
    }

    useEffect(() => {
        const interval = setInterval(() => {
            getCustomerWiseData();
            // console.log('Running customer wise every 5 seconds');
        }, properties?.LIVESTREAMTIME);
        return () => clearInterval(interval);
    }, [isRefresh, isParentRefresh, searchParams]);

    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Customer wise Interactions </span>
                <div className="skel-dashboards-icons">
                    <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                        <i className="material-icons" >refresh</i>
                    </a>
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
    );
};

export default LiveCustomerWise;