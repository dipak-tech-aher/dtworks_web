import { useEffect, useState } from 'react'
import { post } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import ColumnChart from '../../charts/columnChart'
import img1 from "../../../assets/images/t-int.svg"
import graphUp from '../../../assets/images/graph-up.svg'

const InteractionDetails = (props) => {
    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        const requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'INTERACTION'
            }
        }
        post(`${properties.CUSTOMER_API}/get-second-level-statistics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        setData(resp?.data?.response)
                        const axis = resp?.data?.listResponse?.map(item => item.oEntityDate)
                       
                        const chart = axis.map(entityDate => {
                            const totalCount = resp?.data?.listResponse?.reduce((acc, item) => {
                                if (item.oEntityDate === entityDate) {
                                    return acc + parseInt(item.oEntityCount, 10);
                                }
                                return acc;
                            }, 0);

                            return {
                                value: totalCount,
                                name: entityDate
                            };
                        });
                        setAxisData(axis)
                        setSeriesData(chart)
                    }
                }
            })
    }, [])
    return (
        <div className="col-md-6 mb-2">
            <div className="cmmn-skeleton">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Interaction Details</span>
                    {/* <div className="skel-filter-area">
                        <select className="form-control">
                            <option value="">Filter By </option>
                            <option value="Business">Month</option>
                            <option value="Regular">Year</option>
                            <option value="Government">Day</option>
                        </select>
                    </div> */}
                </div>
                <hr className="cmmn-hline" />
                <div className="col-md-12">
                    <div className="skel-customer-avg-info skel-no-bord">
                        
                        <div className="skel-customer-active-info skel-interaction-full-info-bg">
                            <div className="skel-customer-active-info-lft">
                                <span>Total Interactions</span>
                                <span className="skel-dashboard-lg-value">{data?.[0]?.oTotalCount ?? 0}</span>
                            </div>
                                <div className="skel-customer-active-info-rht">
                                    <div className="skel-cdb-icon">
                                        <img src={img1} alt="" className="img-fluid" />
                                    </div>
                                </div>
                                
                        </div>
                        <div className="skel-avg-pre-cr">
                            <div className="skel-avg-sect-base">
                                <div className="skel-customer-avg-info-lft">
                                    <span>Avg. Interactions by Month</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value">{data?.[0]?.oAvgCount ?? 0}
                                            <img src={graphUp} alt=""
                                                className="img-fluid skel-cust-sm-img" /></span>
                                    </div>
                                </div>
                            </div>
                            <div className="skel-prev-avg">
                                <span>Prev. Month</span>
                                <span className="skel-dashboard-lg-value skel-fnt-md-bold">{data?.[0]?.oPrevMonthCount ?? 0}</span>
                            </div>
                            <div className="skel-crnt-avg">
                                <span>Current Month</span>
                                <span className="skel-dashboard-lg-value skel-fnt-md-bold">{data?.[0]?.oCurrMonthCount ?? 0}</span>
                            </div>
                        </div>

                    </div>
                </div>
                
                    <div className="skel-graph-sect mt-3">
                        <ColumnChart
                            data={{
                                axisData,
                                seriesData,
                                title: 'Interaction Daily Statistics'
                            }}
                        />
                    </div>
                
            </div>
        </div>
    )
}

export default InteractionDetails;
