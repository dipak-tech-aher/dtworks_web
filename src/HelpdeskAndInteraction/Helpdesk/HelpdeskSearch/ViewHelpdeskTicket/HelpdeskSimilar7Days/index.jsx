import React, { useEffect, useState } from 'react'
import Chart from './Chart'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import moment from 'moment';
const getDates = () => {
    let days = [], today = moment();
    for (let i = 0; i < 7; i++) {
        days.push(today.format('YYYY-MM-DD'));
        today.subtract(1, 'days');
    }
    return days
}
export default function HelpdeskSimilar7Days(props) {
    let helpdeskNo = props?.data?.detailedViewItem?.helpdeskNo;
    const [ChartData, SetChartData] = useState([])
    useEffect(() => {
        if (helpdeskNo) {
            // console.log(moment().subtract(7, 'd').format('YYYY-MM-DD'))
            getChartData();
        }
    }, [helpdeskNo]);
    const getChartData = () => {
        try {
            let requestBody = {
                searchParams: {
                    helpdeskNo
                }
            }
            post(properties.HELPDESK_API + '/get/frequency/helpdesk', requestBody)
                .then((response) => {
                    const { data } = response;
                    let dates = [...getDates()];
                    if (data && data.length > 0) {
                        let yAxis = [], xAxis = [];
                        for (let i = 0; i < dates.length; i++) {
                            const filterDate = data.filter((val) => val.date === dates[i])
                            if (filterDate && filterDate.length > 0) {
                                yAxis.push(Number(filterDate?.[0]?.count ?? 0))
                                xAxis.push(moment(dates[i]).format('DD MMM'))
                            } else {
                                yAxis.push(Number(0))
                                xAxis.push(moment(dates[i]).format('DD MMM'))
                            }
                        }
                        SetChartData([{ yAxis, xAxis }])
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally()
        } catch (e) {
            console.log('error', e)
        }
    }
    return (
        <>

            <div className="cmmn-skeleton">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Frequency of the Similar Helpdesk for last 7 days
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-0">
                    <Chart data={{ ChartData }} />
                </div>
            </div>


        </>
    )
}
