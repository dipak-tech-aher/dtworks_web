import React, { useEffect, useContext, useState } from 'react';
import customerGroupImg from '../../../assets/images/customer-group.svg';
import increamentImg from '../../../assets/images/increment.svg';
import timeImg from '../../../assets/images/AHT-Time.svg';
import accuracyImg from '../../../assets/images/accuracy-rate.svg';
import deliveryRateImg from '../../../assets/images/delivery-rate.svg';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import moment from 'moment';

const TotalStats = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData } = handlers;
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [cardCountList, setCardCountList] = useState({});
    let { oOar = 0, oOdr = 0 } = cardCountList;
    const [totalCustomersCount, setTotalCustomersCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [aht, setAht] = useState(0);
    const { apiCall } = props
    const { exportData, defaultCurrency } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let totalStatsData = {}
            let requestObj = { ...searchParams, filterType: 'TOTAL_COUNT' }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/total-customers`, { searchParams: requestObj })
            if (response?.data?.length) {
                setTotalCustomersCount(Number(response?.data[0]?.oTotalCustomer ?? 0))
                totalStatsData['totalCustomers'] = Number(response?.data[0]?.oTotalCustomer ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'Total_revenue_value' }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/top-order-revenue`, { searchParams: requestObj })
            if (response1?.data?.length) {
                setTotalRevenue(Number(response1?.data[0]?.oTotal ?? 0))
                totalStatsData['totalRevenue'] = Number(response1?.data[0]?.oTotal ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'AVG' }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/average-handling-time`, { searchParams: requestObj })
            if (response2?.data?.length) {
                let seconds = Number(response2?.data[0]?.oAvg ?? 0)
                let oAvgData = moment.utc(seconds * 1000).format('HH:mm:ss');
                setAht(oAvgData)
                totalStatsData['aht'] = oAvgData
            }

            setExportData('total-stats', totalStatsData)
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (apiCall && fromDate && toDate) {
            getChartData();
        }
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    useEffect(() => {
        let { totalCustomers, totalRevenue, aht } = exportData?.["total-stats"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (totalCustomers) setTotalCustomersCount(totalCustomers);
            if (totalRevenue) setTotalRevenue(totalRevenue);
            if (aht) setAht(aht);
        })
    }, [exportData])

    return (
        <div className="h-100 d-flex flex-direction-column">

            <div className="cmmn-skeleton cust-gr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon">
                            <img src={customerGroupImg} />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0 text-grey">Total Customers</p>
                        <p className="mb-0 font-weight-bold">{totalCustomersCount}</p>
                    </div>
                </div>
            </div>
            <div className="cmmn-skeleton rev-gr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon">
                            <img src={increamentImg} className="img-fluid"
                            />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0 text-grey">Total Revenue</p>
                        <p className="mb-0 font-weight-bold">{defaultCurrency[0]?.mapping?.Symbol}&nbsp;{totalRevenue}</p>
                    </div>
                </div>
            </div>
            <div className="cmmn-skeleton aht-gr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon">
                            <img src={timeImg} className="img-fluid" />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0 text-grey">
                            Average Handling Time (AHT)
                        </p>
                        <p className="mb-0 font-weight-bold">{aht}</p>
                    </div>
                </div>
            </div>
            <div className="cmmn-skeleton ord-gr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon">
                            <img src={accuracyImg} className="img-fluid" />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0 text-grey">
                            Order Accuracy Rate
                        </p>
                        <p className="mb-0 font-weight-bold">
                            {oOar}&nbsp;
                            <i className="fa fa-arrow-up skel-arrow-up" aria-hidden="true" />
                        </p>
                    </div>
                </div>
            </div>
            <div className="cmmn-skeleton del-gr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon">
                            <img src={deliveryRateImg} className="img-fluid" />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0 text-grey">
                            On-Time Delivery Rate
                        </p>
                        <p className="mb-0 font-weight-bold">
                            {oOdr}%&nbsp;
                            <i className="fa fa-arrow-up skel-arrow-up" aria-hidden="true" />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TotalStats;