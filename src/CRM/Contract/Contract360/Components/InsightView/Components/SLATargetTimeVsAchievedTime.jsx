import React, { useEffect, useState } from 'react'
import { post } from '../../../../../../common/util/restUtil'
import { properties } from '../../../../../../properties'
import GroupedColumnChart from '../../../../../../ChartComponents/groupedBar'
import { unstable_batchedUpdates } from 'react-dom'

export default function SLATargetTimeVsAchievedTime(props) {

    const { type, customerDetails, contractData } = props

    const [category, setCategory] = useState('RESPONSE')
    const [seriesData, setSeriesData] = useState([]);
    const [data, setData] = useState({});

    const getChartData = () => {
        try {
            if (contractData) {
                post(`${properties.CONTRACT_API}/insight/contract-target-time-vs-achieved-time`, {
                    searchParams: {
                        contractNo: contractData?.contractNo,
                        customerId: contractData?.customerId,
                        type,
                        category
                    }
                }).then((resp) => {
                    console.log('resp', resp)
                    if (resp?.data) {
                        let data = [
                            {
                                name: 'Target Time',
                                type: 'bar',
                                data: [convertToMinutes(resp.data.oTarget) ?? 0],
                                itemStyle: { color: '#2b4edc' }
                            },
                            {
                                name: 'Achieved Time',
                                type: 'bar',
                                data: [convertToMinutes(resp.data.oAchieved) ?? 0],
                                itemStyle: { color: '#f00' }
                            }
                        ]
                        unstable_batchedUpdates(() => {
                            setData(resp?.data)
                            setSeriesData(data)
                        })
                    }
                })
            }
        } catch (e) {
            console.log('error', e)
        }
    }

    const convertToMinutes = (timeString) => {
        if(timeString){
            const timePattern = /(\d+)\s*days?\s*(\d+)\s*hours?\s*(\d+)\s*mins?/;
            const matches = timeString.match(timePattern);
    
            if (matches) {
                const days = parseInt(matches[1], 10) || 0;
                const hours = parseInt(matches[2], 10) || 0;
                const minutes = parseInt(matches[3], 10) || 0;
    
                return (days * 1440) + (hours * 60) + minutes;
            } else {
                return timeString
            }
        } else {
            return 0
        }
    
    };

    useEffect(() => {
        if (contractData?.contractId) getChartData();
    }, [contractData?.contractId, type, category])

    return (
        <div class="col-md-6 mb-2 px-lg-1">
            <div class="cmmn-skeleton h-100">
                <div class="skel-dashboard-title-base">
                    <span class="skel-header-title">SLA Target Time Vs Achieved Time</span>
                </div>
                <hr class="cmmn-hline" />
                <div class=" w-100 skel-btn-center-cmmn skel-tab-btn-toggle mt-2 mb-2">
                    <div class="btn-group btn-group-tab btn-group-sm" role="group" aria-label="">

                        <button type="button" class={`btn btn-light ${category === 'RESPONSE' ? 'active' : ""}`}
                            onClick={() => setCategory('RESPONSE')}
                            id="ordervalue1">Response</button>
                        <button type="button" class={`btn btn-light ${category === 'RESOLUTION' ? 'active' : ""}`}
                            onClick={() => setCategory('RESOLUTION')}
                            id="ordercount1">Resolution</button>

                    </div>
                </div>
                <div id="ordervalue-sect1">
                    <div class="row">

                        <div class="col">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Target Time</span>
                                <h4 class="font-bold">{data.oTarget ?? 0}</h4>
                            </div>
                        </div>
                        <div class="col">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Achieved Time</span>
                                <h4 class="font-bold" >{data.oAchieved ?? 0}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="skel-graph-sect mt-2 skel-avg-graph-height d-flex gap-2" style={{ minHeight: "auto" }}>
                        <div class="w-100">
                            {/* <RadarChart /> */}
                            <GroupedColumnChart seriesData={seriesData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
