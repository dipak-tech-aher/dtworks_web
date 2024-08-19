import { useEffect, useMemo, useState } from 'react'
import { post } from '../../../common/util/restUtil'
import { properties } from '../../../properties'
import Lottie from "react-lottie";
import { useSizeComponents } from '../../../common/util/util';

const TopRowAnalytics = (props) => {
    const [animationData, setAnimationData] = useState(null);
    const [width, height] = useSizeComponents()
    const scaleLottie = 0.5

    useEffect(() => {
        const fetchAnimation = async () => {
            try {
                const response = await fetch("https://lottie.host/3cb7f847-6de1-4997-b553-fcbd7ffa737d/14x6G8KcSB.json");

                const data = await response.json();
                setAnimationData(data);
            } catch (error) {
                console.error("Error fetching animation:", error);
            }
        };

        fetchAnimation();
    }, []);

    const [data, setData] = useState([])
    useEffect(() => {
        const requestBody = {
            searchParams: props?.data?.searchParams
        }
        post(`${properties.CUSTOMER_API}/get-top-statistics`, requestBody)
            .then((resp) => {
                if (resp?.data) {
                    if (resp?.status === 200) {
                        setData(resp?.data)
                    }
                }
            })
    }, [])

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: animationData,
        renderer: 'canvas',
    };

    const control = useMemo(() => {
        if (!width) return null
        const xMidYMid = 0.5
        const sizeComponent = {
            width: width * scaleLottie,
            height: width * scaleLottie * xMidYMid
        }
        return <Lottie key={width} options={defaultOptions} {...sizeComponent} />
    }, [width])

    return (
        <div className="customer-skel col-md-12">
            <div className="row">
                <div className="col-md-3">
                    <div className="cmmn-skeleton">
                        <Lottie key={width} options={defaultOptions} width={300} height={200} />
                    </div>
                </div>
                <div className="col-md-9">
                    <div className="skel-key-metrics row mx-lg-n1">
                        <div className="col-md-3 px-lg-1 mb-2">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Customer Effort Score (CES)</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value"><span className="timer" data-speed="2000"
                                            data-to="95"></span>{data?.[0]?.oCustEffortScore ?? 0}%</span>
                                        <p className="skel-graph-positive mt-1">
                                            <img src="./assets/images/positive-up-arrow.svg" className="img-fluid mr-1" alt="" /><span>+31.5%</span>
                                        </p>
                                    </div>
                                </div>

                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-2">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Customer Satisfaction Score (CSAT)</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value">
                                            <span className="timer" data-speed="2000"
                                                data-to="98"></span>{data?.[0]?.oCustSatisfactionScore ?? 0}%
                                        </span>
                                        <p className="skel-graph-negative mt-1">
                                            <img src="./assets/images/negative-down-arrow.svg" className="img-fluid mr-1" alt="" /><span>-11.5%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-2">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Net Promoter Score (NPS)</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value"><span className="timer" data-speed="2000"
                                            data-to="98"></span>{data?.[0]?.oNetPromoterScore ?? 0}%</span>
                                        <p className="skel-graph-negative mt-1">
                                            <img src="./assets/images/negative-down-arrow.svg" className="img-fluid mr-1" alt="" /><span>-31.5%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-2">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Customer Retention Rate</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value"><span className="timer" data-speed="2000"
                                            data-to="93"></span>{data?.[0]?.oCustRetentionRate ?? 0}%</span>
                                        <p className="skel-graph-positive mt-1">
                                            <img src="./assets/images/positive-up-arrow.svg" className="img-fluid mr-1" alt="" /><span>+31.5%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-0">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Potential Churn Rate</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value">
                                            <span className="timer" data-speed="2000" data-to="88">
                                            </span>{data?.[0]?.oChurnRate ?? 0}%</span>
                                        <p className="skel-graph-positive mt-1">
                                            <img src="./assets/images/positive-up-arrow.svg" className="img-fluid mr-1" alt="" /><span>+31.5%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-0">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Conversion Rates</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value"><span className="timer" data-speed="2000"
                                            data-to="94"></span>{data?.[0]?.oConversionRate ?? 0}%</span>
                                        <p className="skel-graph-positive mt-1">
                                            <img src="./assets/images/positive-up-arrow.svg" className="img-fluid mr-1" alt="" /><span>+31.5%</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-0">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Avg. Wait Time</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value">
                                            <span className="timer" data-speed="2000"
                                                data-to="3">{data?.[0]?.oAvgWaitTime ?? 0}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 px-lg-1 mb-0">
                            <div className="cmmn-skeleton skel-key-data-info">
                                <div className="skel-tot-info-details-cust-keymetrics">
                                    <span className="wsc-tile-heading">Avg. Resolution Time</span>
                                    <div className="skel-dashboard-lg-value-graph">
                                        <span className="skel-dashboard-lg-value"><span className="timer" data-speed="2000"
                                            data-to="10">{data?.[0]?.oAvgResolutionTime}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TopRowAnalytics;