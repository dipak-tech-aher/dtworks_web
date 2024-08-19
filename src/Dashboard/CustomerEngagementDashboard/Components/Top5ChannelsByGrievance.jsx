import React, { useEffect, useState } from "react";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";
import StackedBar from "../../charts/stackedBar";

const Top5ChannelsByGrievance = (props) => {

    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    useEffect(() => {
        const requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CHANNELS_GRIEVANCE'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        setData(resp?.data);

                        const axis = Array.from(new Set(resp?.data?.map(item => item.oMonth)));

                        const groupedData = resp?.data?.reduce((acc, item) => {
                            const key = item.oEntityType;
                            if (!acc[key]) {
                                acc[key] = {};
                            }
                            acc[key][item.oMonth] = item.oTotalCount;
                            return acc;
                        }, {});

                        const seriesData = Object.keys(groupedData).map(entityType => ({
                            name: entityType,
                            type: 'bar',
                            label: {
                                show: true,
                                position: 'inside',
                            },
                            data: axis.map(month => ({
                                name: month,
                                value: groupedData[entityType][month] || 0                             
                            })),
                        }));

                        setAxisData(axis);
                        setSeriesData(seriesData);
                    }

                }
            })
    }, [])
    return (

        <div className="col-md-6">
            <div className="cmmn-skeleton mh-430">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Top 5 Channels by Grievance</span>
                    <div className="skel-dashboards-icons">
                        <a href="#"><i className="material-icons">refresh</i></a>
                        {/* <a href="#"><i className="material-icons">filter_alt</i></a> */}
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect-md">
                    <StackedBar data={{
                        seriesData,
                        axisData,
                        title: ''
                    }} />
                </div>
            </div>
        </div>
    )
}

export default Top5ChannelsByGrievance;