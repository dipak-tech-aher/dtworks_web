import React, { useEffect, useState } from 'react'
import GroupedColumnChart from '../../../../../../ChartComponents/groupedBar'
import { properties } from '../../../../../../properties';
import { post } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';

export default function BilledVsUnbilledContract(props) {

    const { type, customerDetails, contractData } = props

    const [seriesData, setSeriesData] = useState([]);
    const [data, setData] = useState({});
    const getChartData = () => {
        try {
            post(`${properties.CONTRACT_API}/insight/billed-unbilled`, {
                searchParams: {
                    contractNo: contractData?.contractNo,
                    customerId: contractData?.customerId,
                    type
                }
            })
                .then((resp) => {
                    if (resp?.data) {
                        let data = [
                            {
                                name: 'Billed',
                                type: 'bar',
                                data: [resp?.data?.oBilledValue ?? 0],
                                itemStyle: { color: '#2b4edc' }
                            },
                            {
                                name: 'Unbilled',
                                type: 'bar',
                                data: [resp?.data.oUnbilledValue ?? 0],
                                itemStyle: { color: '#f00' }
                            }]
                        unstable_batchedUpdates(() => {
                            setData(resp?.data)
                            setSeriesData(data)
                        })
                    }
                }).catch((error) => console.error(error))
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (contractData?.contractId) getChartData();
    }, [contractData?.contractId, type])
    return (
        <div class="col-md-6 mb-2 px-lg-1">
            <div class="cmmn-skeleton h-100">
                <div class="skel-dashboard-title-base">
                    <span class="skel-header-title">Billed Vs Unbilled Contract</span>
                </div>
                <hr class="cmmn-hline" />
                <div class="skel-graph-sect mt-2">
                    <div class="row mt-0 mb-2">
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Value</span>
                                <h4 class="font-bold cursor-pointer m-0">{Number(data?.oTotalValue).toFixed(2) ?? 0}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Billed Value</span>
                                <h4 class="font-bold cursor-pointer m-0">{Number(data?.oTotalBilledValue).toFixed(2) ?? 0}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Unbilled Value</span>
                                <h4 class="font-bold cursor-pointer m-0">{Number(data?.oTotalUnbilledValue).toFixed(2) ?? 0}</h4>

                            </div>
                        </div>
                    </div>
                    <div class="skel-graph-sect mt-0">
                        <GroupedColumnChart seriesData={seriesData} legend={['Billed', 'Unbilled']} />
                    </div>
                </div>

            </div>
        </div>
    )
}
