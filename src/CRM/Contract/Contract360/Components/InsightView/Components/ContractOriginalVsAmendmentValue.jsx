import React, { useContext, useState, useEffect } from 'react'
import GroupedColumnChart from '../../../../../../ChartComponents/groupedBar'
import { Contract360Context } from '../../../../../../AppContext';
import { post } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';
import { unstable_batchedUpdates } from 'react-dom';

export default function ContractOriginalVsAmendmentValue(props) {
    const { data: { contractData } } = useContext(Contract360Context);
    const type = props.type

    const [seriesData, setSeriesData] = useState([]);
    const [data, setData] = useState({});
    const getChartData = () => {
        try {
            post(`${properties.CONTRACT_API}/insight/contract-valuevsamandment-value`, {
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
                                name: 'Original',
                                type: 'bar',
                                data: [resp?.data?.currentContractValue ?? 0,],
                                itemStyle: { color: 'rgb(50, 205, 50)' }
                            },
                            {
                                name: 'Amendments',
                                type: 'bar',
                                data: [resp?.data.currentContractAmandment ?? 0, ],
                                itemStyle: { color: '#666' }
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
                    <span class="skel-header-title">Contract Original Vs Amendment Value</span>
                </div>
                <hr class="cmmn-hline" />
                <div class="skel-graph-sect mt-2">
                    <div class="row mt-0 mb-2">
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Original Value</span>
                                <h4 class="font-bold cursor-pointer m-0" data-toggle="modal">${data?.totalOriginalValue}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Total Amendment Value</span>
                                <h4 class="font-bold cursor-pointer m-0" data-toggle="modal">${data?.totalAmandmentValue}</h4>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="text-center">
                                <span class="text-center text-truncate d-block mb-0 mt-2">Difference From Original</span>
                                <h4 class="font-bold cursor-pointer m-0" data-toggle="modal">${data?.differenceFromOriginal}
                                    {/* {data?.differenceFromOriginal>0 ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-arrow-up" viewBox="0 0 16 16">  <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={"#f00"} className="bi bi-arrow-down" viewBox="0 0 16 16">
                                        <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1" />
                                    </svg>} */}
                                </h4>

                            </div>
                        </div>
                    </div>
                    <div class="skel-graph-sect mt-0">
                        <GroupedColumnChart seriesData={seriesData} legend={['Original', 'Amendments']} />
                    </div>
                </div>

            </div>
        </div>
    )
}
