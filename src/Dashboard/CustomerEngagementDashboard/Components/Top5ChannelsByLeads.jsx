import React, { useEffect, useState } from "react";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";

const Top5ChannelsByLeads = (props) => {

    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    useEffect(() => {
        const requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CUSTOMER_PRODUCT'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        setData(resp?.data)
                        const axis = resp?.data?.map(item => item.oEntityType)

                        const cData = axis.map(entityType => {
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
                        setAxisData(axis)
                        setSeriesData(cData)
                    }
                }
            })
    }, [])

    return (
        <div className="col-md-4">
            <div className="cmmn-skeleton skel-cmmn-card-base">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Top 5 Channels by Leads</span>
                    <div className="skel-dashboards-icons">
                        <a href="#"><i className="material-icons">refresh</i></a>
                        <a href="#"><i className="material-icons">filter_alt</i></a>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect">
                    {/* <embed type="text/html" src="./assets/chart/simple-pie.html" height="400" width="100%" /> */}
                </div>
            </div>
        </div>
    )
}

export default Top5ChannelsByLeads;