import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import moment from 'moment'
import Chart from './Chart';

const Trend = (props) => {
    const { searchParams, isParentRefresh,modalStyle } = props?.data;
    const [monthWiseTrendData, setMonthWiseTrendData] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const today = moment();
                const startDate = today.clone().startOf('month').format('YYYY-MM-DD');
                const endDate = today.clone().endOf('month').format('YYYY-MM-DD');
                // console.log('startDate--------->', startDate)
                // console.log('endDate--------->', endDate)
                const response = await slowPost(properties.HELPDESK_API + '/monthly-trend', { ...searchParams, startDate, endDate })
                   
                setMonthWiseTrendData(response?.data);
                   
                } catch (error) {
                    console.log(error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    return (
        <div className="col-md-4"> {loading ? (
            <Loader />
          ) : (
        <div className="">
            <div className="cmmn-skeleton">
                <div className="card-body">
                    <div className="skel-dashboard-title-base">
                        <span className="skel-header-title"> This Month Daily Trends </span>
                        <div className="skel-dashboards-icons">
                            <span>
                                <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                            </span>
                            {/* <span>
                                <i className="material-icons"> filter_alt </i>
                            </span> */}
                        </div>
                    </div>
                    <hr className="cmmn-hline" />
                </div>
                <div className="card-body ">
                    <div className="row">
                        <div className="col-12 text-center">
                            <div className="skel-graph-sect">
                                <Chart data={{ chartData: monthWiseTrendData }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )}
        </div>
    )
}

export default Trend;