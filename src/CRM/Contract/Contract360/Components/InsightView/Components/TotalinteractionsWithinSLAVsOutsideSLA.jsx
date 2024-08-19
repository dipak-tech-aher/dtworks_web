import React, { useContext, useEffect, useState } from 'react'
import GroupedColumnChart from '../../../../../../ChartComponents/groupedBar'
import { properties } from '../../../../../../properties';
import { Contract360Context } from '../../../../../../AppContext';
import { post } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';

export default function TotalinteractionsWithinSLAVsOutsideSLA(props) {
    const { data: { contractData } } = useContext(Contract360Context);
    const type = props.type
    const [seriesData, setSeriesData] = useState([]);
    const [data, setData] = useState({});
    const getChartData = () => {
        try {
            post(`${properties.CONTRACT_API}/insight/cont-total-intxn-within-sla-vs-outside-sla`, {
                searchParams: {
                    contractNo: contractData?.contractNo,
                    customerId: contractData?.customerId,
                    type
                }
            })
                .then((resp) => {
                    if (resp?.data) {
                        unstable_batchedUpdates(() => {
                            setData(resp?.data)
                            setSeriesData([
                                {
                                  name: 'Total Interaction',
                                  type: 'bar',
                                  barWidth: '20%',
                                  data: [resp?.data?.oTotalInteraction ?? 0],
                                },
                                {
                                  name: 'Within SLA',
                                  type: 'bar',
                                  barWidth: '20%',
                                  stack: 'Ad',
                                  data: [resp?.data?.oWithinSla ?? 0]
                                },
                                {
                                  name: 'Outside SLA',
                                  type: 'bar',
                                  barWidth: '20%',
                                  stack: 'Ad',
                                  color: '#F00',
                                  data: [resp?.data?.oOutsideSla ?? 0]
                                },
                              ])
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
            <span class="skel-header-title">Total interactions Within SLA Vs Outside SLA</span>
        </div>
        <hr class="cmmn-hline" />
        <div class="skel-graph-sect mt-2">
            <div class="row mt-0 mb-2">
                <div class="col-4">
                    <div class="text-center">
                        <span class="text-center text-truncate d-block mb-0 mt-2">Total Interaction</span>
                        <h4 class="font-bold cursor-pointer m-0">{data?.oTotalInteraction ?? 0}</h4>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <span class="text-center text-truncate d-block mb-0 mt-2">Within SLA</span>
                        <h4 class="font-bold cursor-pointer m-0">{data?.oWithinSla ?? 0}</h4>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <span class="text-center text-truncate d-block mb-0 mt-2">Outside SLA</span>
                        <h4 class="font-bold cursor-pointer m-0">{data?.oOutsideSla ?? 0}</h4>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md">
                    <GroupedColumnChart seriesData={seriesData} legent={['Total Interaction', 'Within SLA','Outside SLA']}/>
                </div>
            </div>
        </div>
    </div>
</div>
  )
}
