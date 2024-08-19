import EquiSvg from "../../../assets/images/ops/equi.svg"
import SuccessCalSvg from "../../../assets/images/ops/success-cal.svg"
import WarnCalSvg from "../../../assets/images/ops/warn-cal.svg"
import DangerCalSvg from "../../../assets/images/ops/danger-cal.svg"
import { useEffect, useState } from "react";
import { properties } from "../../../properties";
import { post } from "../../../common/util/restUtil";

const Overview = (props) => {
    const { searchParams, isPageRefresh, meOrMyTeam} = props.data;
    const { updateSearchParams } = props.handler;
    const [result, setResult] = useState({});
    const entityType = "Tasks";

    useEffect(() => {
        let reqBody = {
            ...searchParams,
            mode: 'cnt'
        }

        const taskSearchAPI = `${properties.LEAD_API}/${meOrMyTeam === 'Me' ? 'tasks-by-ageing' : 'tasks-by-ageing/team'}`;

        post(taskSearchAPI, { searchParams: reqBody }).then((response) => {
            if (response.status === 200) {
                setResult({ ...response.data[0] })
            } else {
                setResult({ ...{} })
            }
        }).catch((error) => { })
    }, [searchParams, isPageRefresh, meOrMyTeam])

    return (
        <div className="skel-four-grid-top">
            <span className="skel-header-title">Assigned to me ({result?.oTotalCnt || 0})</span>
            <div className="skel-dashboard-tiles">
                <span className="skel-header-title">{entityType} Overview</span>
                <div className="skel-tile-sect">
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-b-color">
                            <img src={EquiSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>Total {entityType}</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('all', 'Tasks - All')}>{result?.oTotalCnt || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-g-color">
                            <img src={SuccessCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>0 to 2 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('0_to_3', 'Tasks - 0 to 3 Days')}>{result?.o0To3Days || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-y-color">
                            <img src={WarnCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>3 to 5 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('3_to_5', 'Tasks - 3 to 5 Days')}>{result?.o3To5Days || 0}</span>
                        </div>
                    </div>
                    <div className="skel-tile-info">
                        <div className="skel-tile-icon skel-tile-r-color">
                            <img src={DangerCalSvg} />
                        </div>
                        <div className="skel-tile-data">
                            <p>&gt; 5 Days</p>
                            <span className="cursor-pointer" onClick={() => updateSearchParams('to_5', 'Tasks - More than 5 Days')}>{result?.oMore5Days || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Overview