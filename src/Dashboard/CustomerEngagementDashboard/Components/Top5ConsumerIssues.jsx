import React, { useEffect, useState } from "react";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";
import VerticalBar from "../../charts/barChart";

const Top5ConsumerIssues = (props) => {

    const [data, setData] = useState([])
    const [axisData, setAxisData] = useState([]);
    const [seriesData, setSeriesData] = useState([]);
    useEffect(() => {
        const requestBody = {
            searchParams: {
                ...props?.data?.searchParams,
                type: 'CUSTOMER_PROBLEMS'
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
        <div className="col-md-7">
            <div className="cmmn-skeleton">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Top 5 Customer Problems</span>
                    <div className="skel-dashboards-icons">
                        <a href="#"><i className="material-icons">refresh</i></a>
                        {/* <a href="#"><i className="material-icons">filter_alt</i></a> */}
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-cust-problem-data-sect">
                    {/* <VerticalBar data={{
                        axisData,
                        seriesData,
                        title: 'Revenue Daily Statistics'
                    }} /> */}
                    <ul className="skel-stacked-bar-chart">
                        {
                            data && !!data.length && data.map((item, index) => {
                                return (
                                    <li key={index}>
                                        {/* <span className={`wsc-before-prdt-bg wsc-sq-${index === 0 ? 'red' : index === 1 ? 'yellow' : 'blue'}`}></span> */}
                                        <span className="skel-txt-ellips">{item.oEntityType}</span>
                                        <div className="skel-stacked-bar-wd-data" style={{ display: 'flex' }}>
                                            {/* <div className="bar-container" */}
                                                <div className="col-auto bar-a" style={{ width: `${100 - item.oOpenCount}%` }}>{item.oOpenCount}</div>
                                                <div className="col-auto bar-b" style={{ width: `${item.oOpenCount}%` }}>{item.oClosedCount}</div>
                                                <span className="ml-2 font-bold">{item.oTotalCount}</span>
                                            {/* </div> */}
                                        </div>
                                    </li>
                                )
                            }
                            )
                        }
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Top5ConsumerIssues;
