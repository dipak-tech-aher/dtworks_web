
import React from "react";
const TopPerformingChannels = (props) => {
    let { topPerforming } = props.data;
    // const { topPerforming } = props.data;
    const { getChannelClassName,getChannelIcon,getChannelNewClassName } = props.handlers;

    return (

        <div className="skel-omni-all-top-5-chnl mt-2">
            <span className="skel-header-title">Top 5 Performing Channel</span>
            {topPerforming === "0" ? (
                <div className="noRecord">
                    <p>NO RECORDS FOUND</p>
                </div>
            ) : (
                <div className={`row row-cols-${topPerforming.length ?? 5} mx-lg-n1 mt-2`}>
                    {topPerforming && topPerforming.length > 0 && topPerforming.map((x) => (
                         <div className="col px-lg-1">
                         <div className={`card ${getChannelNewClassName(x.channel)}`}>
                           <div className="card-body">
                           {getChannelIcon(x.channel)}
                             <p><span class="txt-value">{x?.percentage ?? x?.count}%</span> of <b>{x.type}</b> created by <span className="ch"> {x.channel}</span></p>
                           </div>
                         </div>
                       </div>
                    ))}
                    {/* {topPerforming && topPerforming.length > 0 && topPerforming.map((x) => (
                        <div className="skel-top-chnl-perf">
                            {x.channel && (
                                <span className={getChannelClassName(x.channel)}>
                                    {getChannelIcon(x.channel)}
                                </span>
                            )}
                            {x.channel && (
                                <>
                                    <p>
                                        <span className="skel-omni-chnl-per">{x.count}</span> of <b>{x.type}</b> created by{" "}
                                        <span className={getChannelClassName(x.channel)}>
                                            {x.channel}
                                        </span>
                                    </p>
                                </>
                            )}
                        </div>
                    ))} */}
                </div>
            )}
        </div>
    )
}

export default TopPerformingChannels;