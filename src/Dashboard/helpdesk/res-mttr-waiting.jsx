import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import ResolutionTimeImg from "../../assets/images/res-time.svg";
import MttrImg from "../../assets/images/mttr.svg";
import WaitingTimeImg from "../../assets/images/w-time.svg";

const ResMttrWaiting = (props) => {
    const { searchParams, isParentRefresh } = props?.data;
    const { checkComponentPermission } = props?.handlers;
    const [isRefresh, setIsRefresh] = useState(false);
    const [resolutionData, setResolutionData] = useState([]);
    const [mttrData, setMttrData] = useState([]);
    const [waitingData, setWaitingData] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                slowPost(properties.HELPDESK_API + "/res-mttr-waiting", { searchParams }).then((resp) => {
                    if (resp?.status == 200) {
                        setResolutionData(resp?.data?.rows?.avgResolutionTimeData ?? [])
                        // setMttrData(resp?.data?.rows?.mttrData ?? [])
                        setWaitingData(resp?.data?.rows?.avgWaitingData ?? [])
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
        <> {loading ? (
            <Loader />
        ) : (
            
            <div className="cmmn-skeleton cmmn-skeleton-new mt-2 mb-2 mh-220">
                <div className='skel-avg-sect-int'>
                    {checkComponentPermission("AVG_RESOL_TIME") && <div className="skel-avg-sect-active-info">
                        <div className="skel-customer-active-info-lft">
                            <img src={ResolutionTimeImg} className="img-fluid int-kpi-icons" />
                            <span className="skel-sm-heading">Avg. Resolution Time({resolutionData[0]?.oCnt})</span>
                            <div className="skel-dashboard-lg-value-graph">
                                <span className="timer skel-fnt-md-bold" data-to={5} data-speed={4000}> {resolutionData?.length ? (resolutionData[0]?.oAvgResolutionTimeHrs).replace(/:/g, '') : ''} </span>
                            </div>


                            <span className="skel-small-info"> per last month </span>
                        </div>
                    </div>}
                    {checkComponentPermission("AVG_WAIT_TIME") && <div className="skel-avg-sect-active-info">
                        <div className="skel-customer-active-info-lft">
                            <img src={WaitingTimeImg} className="img-fluid int-kpi-icons" />
                            <span className="skel-sm-heading">Avg. Wait Time({waitingData[0]?.oCnt})</span>
                            <span className="skel-dashboard-lg-value-graph ">
                                <span className="timer skel-fnt-md-bold" data-to={2} data-speed={4000}> {waitingData?.length && waitingData[0]?.oAvgWaitTimeHrs ? (waitingData[0]?.oAvgWaitTimeHrs).replace(/:/g, '') : ''} </span>
                            </span>
                            <span className="skel-small-info"> per last month </span>
                        </div>
                    </div>}
                </div>
            </div>
        )}
        </>
    );
};

export default ResMttrWaiting;