import img1 from '../../../assets/images/t-cust.svg'
import graphUp from '../../../assets/images/graph-up.svg'
import { useEffect, useState } from 'react'
import { post } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import ColumnChart from '../../charts/columnChart'
import SmileyChart from '../../charts/SmileyChart'
import VerticalChart from '../../charts/barChart'
import VerticalBar from '../../charts/barChart'


const ConsumerDetails = (props) => {
    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    const [axisData2, setAxisData2] = useState([]);
    const [seriesData2, setSeriesData2] = useState([]);
    const [smileyData, setSmileyData] = useState([]);
    const [smileyAxisData, setSmileyAxisData] = useState([]);
    useEffect(() => {
        let requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CONSUMER'
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

        requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CUSTOMER_STATUS'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        const axis = resp?.data?.map(item => item.oEntityType)
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
                        setAxisData2(axis)
                        setSeriesData2(chart)
                    }
                }
            })

        requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CSAT'
            }
        }
        post(`${properties.CUSTOMER_API}/get-top5-analytics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        const axis = [
                            { name: 'Happy', value: '😊' },
                            { name: 'Neutral', value: '😐' },
                            { name: 'Sad', value: '😢' },
                            { name: 'Satisfied', value: '😑' }
                          ];
                        const chart = axis.map(entityType => {
                            const totalCount = resp?.data?.reduce((acc, item) => {
                                if (item.oEntityType === entityType.name) {
                                    return acc + parseInt(item.oTotalCount, 10);
                                }
                                return acc;
                            }, 0);

                            return {
                                value: totalCount,
                                name: entityType.value
                            };
                        });
                        setSmileyAxisData(axis)
                        setSmileyData(chart)
                    }
                }
            })
    }, [])
    return (
        
        <div className="col-md-12">
        <div className="cmmn-skeleton skel-customer-full-info-sect-v1">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Customer Details</span>
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
            <div className="row">
                <div className="col-md-7 d-flex">
                    <div className="col-md-12">
                        <div className="skel-customer-avg-info skel-no-bord">
                            
                            <div className="skel-customer-active-info skel-customer-full-info-bg">
                                <div className="skel-customer-active-info-lft">
                                    <span>Total Customers</span>
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
                                        <span>Avg. Customers by Month</span>
                                        <div className="skel-dashboard-lg-value-graph">
                                            <span className="skel-dashboard-lg-value">{data?.[0]?.oAvgCount ?? 0}
                                                <img src={graphUp} alt="" className="img-fluid skel-cust-sm-img" /></span>
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
                            <div className="skel-graph-sect mt-3">
                                <ColumnChart
                                    data={{
                                        axisData,
                                        seriesData,
                                        title: 'Consumer Daily Statistics',
                                        chartType: 'bar'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-5 d-flex">
                    <div className="col-md-12">
                        <div className="skel-customer-avg-info skel-no-bord">
                            <span className="skel-header-title">Customer Satisfaction</span>
                            <div className="skel-graph-sect-md mt-0">
                                <VerticalBar data={{
                                    axisData: smileyAxisData,
                                    seriesData: smileyData
                                    }} />
                            </div>
                            <hr className="cmmn-hline" />

                            <div className="skel-graph-sect-md mt-2">
                                <VerticalChart data={{
                                    axisData: axisData2,
                                    seriesData: seriesData2,
                                    title: 'Customer by Status',
                                    height: '150px',
                                    width: null
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
        
    )
}

export default ConsumerDetails;