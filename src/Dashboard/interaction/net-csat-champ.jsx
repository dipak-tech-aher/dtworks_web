import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import ResolutionTimeImg from "../../assets/images/nps.svg";
import MttrImg from "../../assets/images/CSAT.svg";
import WaitingTimeImg from "../../assets/images/BOT.svg";
import PositiveUpArrow from "../../assets/images/positive-up-arrow.svg";

const NetCsatChamp = (props) => {
    const { searchParams, isParentRefresh } = props?.data
    const { checkComponentPermission } = props?.handler
    const [npsData, setNpsData] = useState([]);
    const [champData, setChampData] = useState([]);

    useEffect(() => {
        slowPost(properties.INTERACTION_API + "/nps-csat-champ", { searchParams }).then((resp) => {
            if (resp?.status == 200) {
                setNpsData(resp?.data?.rows?.npsResponseData ?? [])
                setChampData(resp?.data?.rows?.champResponseData ?? [])
            }
        }).catch((error) => console.log(error));
    }, [searchParams, isParentRefresh])

    return (
        <div className="cmmn-skeleton cmmn-skeleton-new mt-2" style={{ color: '#333 !important' }}>
            <div className='skel-avg-sect-int'>
                {checkComponentPermission("NPS") && <div className="skel-avg-sect-active-info">
                    <div className="skel-customer-active-info-lft">
                        <img src={ResolutionTimeImg} className="img-fluid int-kpi-icons" />
                        <span className="skel-sm-heading">Net Promoter Score (NPS)</span>
                        <div className="skel-dashboard-lg-value-graph">
                            <span className="timer skel-fnt-md-bold" data-speed={2000} data-to={95}> {npsData?.length ? Number(npsData[0]?.oNps).toFixed(2) : 0} </span> %
                            <p className="skel-graph-positive mt-1">
                                <img src={PositiveUpArrow} className="img-fluid mr-1" />
                                <span>{npsData?.length ? npsData[0]?.oPercentage : 0}%</span>
                            </p>
                        </div>
                        <span className="skel-small-info"> per last month </span>
                    </div>
                </div>}
                {checkComponentPermission("SMART_RESOLVED") && <div className="skel-avg-sect-active-info">
                    <div className="skel-customer-active-info-lft">
                        <img src={WaitingTimeImg} className="img-fluid int-kpi-icons" />
                        <span className="skel-sm-heading">Smart Assistance Resolved</span>
                        <div className="skel-dashboard-lg-value-graph">
                            <span className="timer skel-fnt-md-bold" data-speed={2000} data-to={95}> {champData?.length ? Number(champData[0]?.oAutomationPercentage).toFixed(2) : 0} </span> %
                            <p className="skel-graph-positive mt-1">
                                <img src={PositiveUpArrow} className="img-fluid mr-1" />
                                <span>{champData?.length ? champData[0]?.oDifference : 0} %</span>
                            </p>
                        </div>
                        <span className="skel-small-info"> per last month </span>
                    </div>
                </div>}
            </div>
        </div>
    );
};

export default NetCsatChamp;