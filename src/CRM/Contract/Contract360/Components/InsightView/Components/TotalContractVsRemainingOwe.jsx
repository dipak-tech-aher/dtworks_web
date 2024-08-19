import { useEffect, useState } from "react";
import DoughnutChart from "../../../../../../ChartComponents/doghnut";
import { post } from "../../../../../../common/util/restUtil";
import { properties } from "../../../../../../properties";


export default function TotalContractVsRemainingOwe(props) {
    const [seriesData, setSeriesData] = useState([]);
    const [totalContractVsOweCount, setTotalContractVsOweCount] = useState({})

    const { type, customerDetails, contractData } = props

    const getChartData = () => {
        try {
            post(`${properties.CONTRACT_API}/insight/totalcontract-remaningowevalue`, {
                searchParams: {
                    contractNo: contractData?.contractNo,
                    customerId: contractData?.customerId,
                    type
                }
            }).then((resp) => {
                setTotalContractVsOweCount(resp.data)

                const contractData = [
                    { value: Number(resp.data?.oContractValue).toFixed(2), name: 'Contract Value' },
                    { value: Number(resp.data?.oContractOweValue).toFixed(2), name: 'Owe Value' }
                ];

                setSeriesData(contractData)
            })
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
                    <span class="skel-header-title">Total Contract Vs Remaining Owe Value</span>
                </div>
                <hr class="cmmn-hline" />
                <div class="skel-graph-sect mt-2">
                    <div class="row mt-0 mb-2">
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Contract Value</span>
                                <h4 class="font-bold cursor-pointer m-0" data-toggle="modal">{Number(totalContractVsOweCount.oTotalContractValue).toFixed(2)}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Owe Value</span>
                                <h4 class="font-bold cursor-pointer m-0" data-toggle="modal">{Number(totalContractVsOweCount.oTotalOweValue).toFixed(2)}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Paid Value</span>
                                <h4 class="font-bold cursor-pointer m-0">{totalContractVsOweCount.oTotalPaidValue}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md d-flex mt-4">
                            <div class="w-100">
                                <DoughnutChart chartData={seriesData} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}