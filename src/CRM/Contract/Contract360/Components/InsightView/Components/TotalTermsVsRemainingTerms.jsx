import SunburstChart from "../../../../../../ChartComponents/Sunburst";
import React, { useEffect, useState } from "react";
import { post } from "../../../../../../common/util/restUtil";
import { properties } from "../../../../../../properties";
import { unstable_batchedUpdates } from "react-dom";
export default function TotalTermsVsRemainingTerms(props) {
    const { type, customerDetails, contractData } = props
    const [seriesData, setSeriesData] = useState([]);
    const [data, setData] = useState({});
    const getChartData = () => {
        try {
            post(`${properties.CONTRACT_API}/insight/contract-total-time-vs-remaining-term`, {
                searchParams: {
                    contractNo: contractData?.contractNo,
                    customerId: contractData?.customerId,
                    type,
                    category: 'TOTAL'
                }
            })
                .then((resp) => {
                    // console.log('resp', resp)
                    if (resp?.data) {
                        unstable_batchedUpdates(() => {
                            setData(resp?.data)
                            const transformedData = transformData(resp?.data);
                            setSeriesData(transformedData)

                        })
                    }
                }).catch((error) => console.error(error))

            // post(`${properties.CONTRACT_API}/insight/contract-total-time-vs-remaining-term`, {
            //     searchParams: {
            //         contractNo: contractData?.contractNo,
            //         customerId: contractData?.customerId,
            //         type,
            //         category: 'PRODUCT'
            //     }
            // })
            //     .then((resp) => {
            //         if (resp?.data) {
            //             const transformedData = transformData(resp?.data);
            //             setSeriesData(transformedData)

            //         }
            //     }).catch((error) => console.error(error))
        } catch (e) {
            console.log('error', e)
        }

    }


    const transformData = (data) => {
        return {
            name: 'Total Term',
            value: parseInt(data.oTotalTerm, 10),
            itemStyle: {
                color: '#2b4edc'
            },
            children: [
                {
                    name: `Remaining Term`,
                    value: parseInt(data.oOverallRemTerm, 10),
                    itemStyle: {
                        color: '#f42e2e'
                    },
                    children: [
                        {
                            name: data.oProductName,
                            value: 1,
                            itemStyle: {
                                color: '#f4bd2e'
                            }
                        }
                    ]
                }
            ]
        };
    };


    useEffect(() => {
        if (contractData?.contractId) getChartData();
    }, [contractData?.contractId, type])
    return (<div class="col-md-6 mb-2 px-lg-1">
        <div class="cmmn-skeleton h-100">
            <div class="skel-dashboard-title-base">
                <span class="skel-header-title">Total Terms Vs Remaining Terms</span>
            </div>
            <hr class="cmmn-hline" />
            <div class="skel-graph-sect mt-2">
                <div class="row mt-0 mb-2">
                    <div class="col-4">
                        <div class="text-center">
                            <span class="text-center text-truncate d-block mb-0 mt-2">Total Terms</span>
                            <h4 class="font-bold cursor-pointer m-0">{data.oTotalTerm || 0} months</h4>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="text-center">
                            <span class="text-center text-truncate d-block mb-0 mt-2">Total Remaining Terms</span>
                            <h4 class="font-bold cursor-pointer m-0">{data.oOverallRemTerm || 0} months</h4>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="text-center">
                            <span class="text-center text-truncate d-block mb-0 mt-2">Total Paid Terms</span>
                            <h4 class="font-bold cursor-pointer m-0">{data.oPaidTerm || 0} months</h4>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md d-flex">
                        <div class="w-100 mr-5">
                            <SunburstChart chartData={seriesData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>)

}