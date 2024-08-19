import React, { useEffect, useState } from 'react';
import { properties } from "../../../properties";
import moment from 'moment'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

const ByStatusLive = (props) => {
    const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

    const { searchParams, helpdeskSearchParams, isParentRefresh } = props?.data;

    const [isRefresh, setIsRefresh] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [chartData, setChartData] = useState({});
    const [typeData, setTypeData] = useState({});
    const getStatusWiseHelpdesk = async (searchParams) => {
        try {
            const response = await axios.post(API_ENDPOINT + properties.HELPDESK_API + '/helpdesk-by-status', { ...searchParams, type: 'LIST', mode: 'LIVE' }, {
                headers: {
                    "Content-Type": "application/json",
                    "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
                    authorization: JSON.parse(localStorage.getItem("auth")).accessToken
                }
            });

            const respData = response?.data?.data;

            const currentTime = moment();
            const twoHoursAgo = moment().subtract(2, 'hours');
            const xAxisLabels = [];
            const updateTypeData = {};

            for (let i = moment(twoHoursAgo); i <= currentTime; i.add(15, 'minutes')) {
                xAxisLabels.push(i.format('HH:mm'));
            }

            respData?.forEach(item => {
                const createdAtHour = moment(new Date(item?.oCreatedAt)).format('HH:mm');
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
            
            
            setChartData(updatedChartData);
            setIsLoading(false);
    
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getStatusWiseHelpdesk(searchParams);
    }, [isRefresh, isParentRefresh, searchParams]);

    useEffect(() => {
        const interval = setInterval(() => {
            getStatusWiseHelpdesk(searchParams);
        }, properties?.LIVESTREAMTIME);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Helpdesk by Status </span>
                <div className="skel-dashboards-icons">
                    <span>
                        <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                    </span>
                </div>
            </div>
            <hr className="cmmn-hline" />
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div className="skel-graph-sect mt-4">
                    <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} animationDuration={1500}>
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
                            stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} 
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

export default ByStatusLive;
