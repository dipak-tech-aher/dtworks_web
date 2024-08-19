import React, { useEffect, useState } from 'react'
import Chart from './Chart'
import moment from 'moment';
import { get } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { nanoid } from 'nanoid';
import { orderBy } from 'lodash'
function getDuration(startDate, endDate) {
    var duration = endDate - startDate;
    var days = Math.floor(duration / (1000 * 60 * 60 * 24));
    var hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return days + " day(s) " + hours + " hrs " + minutes + " mins";
}

export default function WorkforceAnalytics(props) {
    let helpdeskId = props?.data?.detailedViewItem?.helpdeskNo ?? '';
    const [ChartData, setChartData] = useState([])
    const dateFormate = (val, i, data) => {
        if (val.status === 'NEW') {
            return moment(val.created_at).format('DD-MMM-YYYY HH:MM A')
        } else {
            let startDate = new Date(moment(data[i - 1]?.created_at));
            let endDate = new Date(moment(val?.created_at));
            return getDuration(startDate, endDate)
        }
    }
    useEffect(() => {
        if (helpdeskId) {
            getWorkForceList();
        }
    }, [helpdeskId]);
    const getWorkForceList = () => {
        try {

            get(properties.HELPDESK_API + `/workforce/analytics/${helpdeskId}`)
                .then((response) => {
                    const { data = [] } = response, orderedData = orderBy(data, 'helpdeskTxnId')
                    // const formatedData = data.map((val, i) => {
                    //     return { ...val, value: val.count, tablevalue: dateFormate(val, i, data), name: val.description }
                    //     // return { ...val, date: dateFormate(val, i), name: val.status,  itemStyle: {
                    //     //     color: generateRandomColor()
                    //     //   } }
                    // })
                    setChartData(orderedData)
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
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">
                    Workforce Analytics
                </span>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect mt-3">
                <div className="mt-1 mb-2">
                    Status wise ageing
                    {/* {props?.data?.detailedViewItem?.currUserInfo ? <> by{" "}<span className="font-weight-bold"> {`${props?.data?.detailedViewItem?.currUserInfo?.firstName ?? ""} ${props?.data?.detailedViewItem?.currUserInfo?.lastName ?? ""}`}</span></> : ' '} */}

                </div>
                <div className="row">

                    {ChartData && ChartData.length > 0 ? <>   <div className="col-md-4"><table className="table table-hover mb-0 table-centered table-nowrap">
                        <tbody>
                            {ChartData?.length > 0 && ChartData?.map((ia) => {
                                if (ia) {
                                    return (<tr key={nanoid()}>
                                        <td key={nanoid()}><h5 className="font-size-14">{ia?.keys ?? '-'}</h5></td>
                                        <td key={nanoid()}>
                                            <p className="text-dark mb-0 cursor-pointer"
                                                data-toggle="modal">{Number(ia?.values?.years) ? `${ia?.values?.years} Year's ` : ' '}
                                                {ia?.values?.months ? `${ia?.values?.months} Month's ` :  ''}
                                                {ia?.values?.days ? `${ia?.values?.days} day's ` : ' '}
                                                {ia?.values?.hours ? `${ia?.values?.hours} hrs ` : ' '}
                                                {ia?.values?.minutes ? `${ia?.values?.minutes} min's ` : ' '}
                                                {ia?.values?.seconds ? `${ia?.values?.seconds} sec's ` : ' 0 sec '}
                                                {ia?.values?.milliseconds ? `${ia?.values?.milliseconds} millisec's ` : ' 0 millisec'}
                                            </p>
                                        </td>
                                    </tr>)
                                }
                            })}
                            {/* {ChartData && ChartData.map((val, i) => {
                                return (
                                    <tr key={i}>
                                        <td>
                                            <h5 className="font-size-14">{val.description}</h5>
                                        </td>
                                        <td>
                                            <p
                                                className="text-dark mb-0 cursor-pointer"
                                                data-target="#detailsmodal"
                                                data-toggle="modal"
                                            >
                                                {val.tablevalue}
                                            </p>
                                        </td>
                                    </tr>
                                )
                            })} */}
                        </tbody>
                    </table>
                    </div>
                        <div className="col-md-8">
                            <Chart data={ChartData} />
                        </div></> : <span className="skel-widget-warning text-center">No data available</span>}

                </div>
            </div>
        </div>
    )
}
