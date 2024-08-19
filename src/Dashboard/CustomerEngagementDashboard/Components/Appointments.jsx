
import { useEffect, useState } from 'react'
import { post } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import ColumnChart from '../../charts/columnChart'

const Appointments = (props) => {
    const [data, setData] = useState({})
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    useEffect(() => {
        let requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'APPOINTMENTS'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        const axis = Array.from(new Set(resp?.data?.map(item => item.oEntityType)));

                        const chart = axis.map(entityType => {
                            const totalCount = resp?.data?.reduce((acc, item) => {
                                if (item.oEntityType === entityType) {
                                    return acc + parseInt(item.oTotalCount, 10);
                                }
                                return acc;
                            }, 0);

                            return {
                                value: totalCount,
                                name: entityType
                            };
                        });

                        setAxisData(axis);
                        setSeriesData(chart);
                    }

                }
            })
            requestBody = {
                searchParams: {
                    ...props?.data?.searchParams,
                    type: 'ISSUE_SOLVED_BY'
                }
            }
            post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {                        

                        const totalCountHuman = resp?.data.reduce((acc, item) => {
                            return item.oEntityType === 'HUMAN' ? acc + item.oTotalCount : acc;
                        }, 0);
                        
                        const totalCountBot = resp?.data.reduce((acc, item) => {
                            return item.oEntityType === 'BOT' ? acc + item.oTotalCount : acc;
                        }, 0);
                        
                        // Calculate percentages
                        const percentageHuman = (totalCountHuman / (totalCountHuman + totalCountBot)) * 100;
                        const percentageBot = (totalCountBot / (totalCountHuman + totalCountBot)) * 100;

                        setData({
                            percentageHuman,
                            percentageBot
                        })
                    }

                }
            })
    }, [])

    const ProgressBar = ({ percentage }) => {
        const progressStyle = {
          width: `${percentage}%`,
        };
      
        return (
          <div className="progress-status progress-moved">
            <div className="progress-bar" style={progressStyle}></div>
          </div>
        );
      };

    return (
        <div className="col-md-4">
            <div className="cmmn-skeleton h-auto">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Appointments</span>
                    {/* <div className="skel-filter-area">
                        <input type="date" id="dateFrom" className="form-control" value="" />
                    </div> */}
                </div>
                <hr className="cmmn-hline" />

                <div className="skel-graph-sect-md">
                    <ColumnChart data={{
                        axisData,
                        seriesData,
                        title: ''
                    }}/>
                </div>
            </div>
            <div className="cmmn-skeleton mt-2 h-130">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Issues Solved by</span>
                    {/* <div className="skel-filter-area">
                        <input type="date" id="dateFrom" className="form-control" value="" />
                    </div> */}
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-bots-h">
                    <span>Champs</span>
                    <ProgressBar percentage={data?.percentageBot} />
                    <span>{data?.percentageBot}%</span>
                </div>
                <div className="skel-bots-h">
                    <span>Humans</span>
                    <ProgressBar percentage={data?.percentageHuman} />
                    <span>{data?.percentageHuman}%</span>
                </div>
            </div>
        </div>
    )
}
export default Appointments;