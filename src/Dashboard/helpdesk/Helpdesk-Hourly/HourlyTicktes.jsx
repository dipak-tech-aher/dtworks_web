import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import Chart from './Chart';

const HourlyTickets = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const [hourlyData, setHourlyData] = useState([])
    const [isRefresh, setIsRefresh] = useState(false);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/hourly-tkts', { ...searchParams, ...helpdeskSearchParams })

                setHourlyData(response?.data);

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
                <div className="cmmn-skeleton mh-500">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Today Tickets (Hourly) </span>
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
                        <div id="cardCollpase5" className="collapse show" dir="ltr">
                            <div className="skel-graph-sect" style={{ marginTop: 0 }}>
                                <Chart data={{ chartData: hourlyData }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    )
}

export default HourlyTickets;