
import React from "react";
import ReactEcharts from 'echarts-for-react';

const ChannelsByLead = (props) => {
    const { channelsByLead, width = '100%', height = '400px' } = props?.data;

    const option = {
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            top: '-1%',
            left: 'center'
        },
        xAxis: {
            type: 'category',
            data: channelsByLead?.length > 0 && channelsByLead.map(item => item?.channel),
            axisLabel: {
                interval: 0, // Display all x-axis labels
                rotate: 45 // Rotate x-axis labels for better readability
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: 'Total Leads',
                type: 'bar',
                itemStyle: {
                    borderRadius: 0,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    position: 'top',
                    formatter: '{c}'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 10,
                        fontWeight: 'bold'
                    }
                },
                data: channelsByLead?.length > 0 && channelsByLead.map((item, index) => ({
                    value: item.count,
                    name: item.channel,
                    itemStyle: {
                        color: `rgb(84,112,198)` // Assign different colors based on index
                    }
                }))
            }
        ]
    };

    return (
        <div className="col-md-4">
            <div className="cmmn-skeleton skel-cmmn-card-base">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Top 5 Channels by Leads</span>
                    <div className="skel-dashboards-icons">
                        <a href="#"><i className="material-icons">refresh</i></a>
                        {/* <a href="#"><i className="material-icons">filter_alt</i></a> */}
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect">
                    {channelsByLead?.length > 0 ? <ReactEcharts option={option} style={{ height, width }} /> : <p style={{ fontSize: "17px", margin: "143px" }}>No Data Found</p>}
                </div>
            </div>
        </div>
    )
}

export default ChannelsByLead;