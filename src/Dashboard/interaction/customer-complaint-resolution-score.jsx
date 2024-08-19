import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowGet } from "../../common/util/restUtil";
import { properties } from '../../properties';
import ResolutionTimeImg from "../../assets/images/res-time.svg";
import MttrImg from "../../assets/images/mttr.svg";
import WaitingTimeImg from "../../assets/images/w-time.svg";

const CustomerComplaintResolutionScore = (props) => {
    const { searchParams, isParentRefresh } = props?.data;
    const [isRefresh, setIsRefresh] = useState(false);
    const [resolutionData, setResolutionData] = useState(0);
    const [mttrData, setMttrData] = useState(0);
    const [avgScore, setAvgScore] = useState(0);
    const [totalCustomer, setTotalCustomer] = useState(0);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                slowGet(properties.INTERACTION_API + "/ccrs").then((resp) => {
                    if (resp?.status == 200) {
                        // console.log(resp.data)
                        setMttrData(resp?.data?.scores[0] ?? 0)
                        setTotalCustomer(resp?.data?.totalCustomers ?? 0)
                        setAvgScore(resp?.data?.averageScore ?? 0)
                    }
                }).catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])
    return (
        <div> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton mt-2 mb-2 mh-220">
                <p>Customer Complaint Resolution Score</p>
                <div className='skel-avg-sect-int'>
                        <div className="skel-avg-sect-active-info">
                            <div className="skel-customer-active-info-lft">
                            <img src={ResolutionTimeImg} className="img-fluid int-kpi-icons" /> 
                                <span className="skel-sm-heading">Average Score</span>
                                <div className="skel-dashboard-lg-value-graph">
                                    <span className="timer skel-fnt-md-bold" data-to={5} data-speed={4000}> {avgScore.toFixed(2)} </span>
                                </div>                          
                            
                            <span className="skel-small-info"> per Quarter </span>
                        </div>
                    </div>
                        <div className="skel-avg-sect-active-info">
                            <div className="skel-customer-active-info-lft">
                                <img src={MttrImg} className="img-fluid int-kpi-icons" />
                                <span className="skel-sm-heading">Month Score</span>
                            <span className="skel-fnt-md-bold">
                                <span className="timer skel-fnt-md-bold" data-to={2} data-speed={4000}> {mttrData} </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
};

export default CustomerComplaintResolutionScore;