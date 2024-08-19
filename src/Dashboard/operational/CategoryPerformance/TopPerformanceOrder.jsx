/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from "react";
import ReactSelect from "react-select";
import { OpsDashboardContext, AppContext } from "../../../AppContext";
import { slowPost } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import TopPerformingCategory from "./TopPerformingCategory";
import { unstable_batchedUpdates } from "react-dom";

const TopPerformanceOrder = (props) => {
    const { auth } = useContext(AppContext);
    const [isRefresh, setIsRefresh] = useState(false);
    const [searchParams, setSearchParams] = useState({
        userId: auth?.user?.userId,
        // fromDate: moment().startOf('month').format("YYYY-MM-DD"),
        // toDate: moment().endOf('month').format("YYYY-MM-DD")
    });
    const { data, handlers } = useContext(OpsDashboardContext);
    const { setLastDataRefreshTime } = handlers
    const { meOrMyTeam, lastDataRefreshTime, currentTime, searchParams: globalSearchParams, isPageRefresh, masterLookupData } = data;
    const [performer, setPerformer] = useState([])
    const [entityType, setEntityType] = useState({
        label: "Order Type",
        value: "orderType"
    })
    const [lastUpdatedAt, setLastUpdatedAt] = useState(moment());


    const getinformativeDetails = useCallback(() => {
        const intxnHandlingAPI = `${properties.ORDER_API}/get-order-category-performance`
        let searchParamss = {
            ...searchParams,
            limit: 5
        }
        slowPost(intxnHandlingAPI, {
            type: entityType?.value,
            searchParams: searchParamss,
        }).then((res) => {
            if (res?.data) {
                const rows = res?.data?.rows.length > 0 ? res?.data?.rows : []
                // const statusGroupedDetails = groupBy(rows, 'oUserDesc');

                const yAxisData = rows.map(r => {
                    return {
                        value: r.count,
                        itemStyle: {
                            color: '#148F77' // chroma.random().darken().hex()
                        }
                    }
                })
                const xAxisData = new Set([...rows.map(n => n.status)])
                const legend = new Set([...rows.map(n => n.description)])
                const seriesData = new Set()

                for (const l of Array.from(legend)) {
                    let data = []
                     
                    let filteredData = [] 
                    for (const x of Array.from(xAxisData)) {
                        let value=0
                        filteredData = rows.filter(r => {
                            if(r.description === l && r.status === x){
                                value += Number(r.count)
                            }
                        }) 
                        data.push(value)
                    }   
                    
                    const obj = {
                      barMaxWidth: 100,
                      name: l,
                      type: 'bar',
                      barGap: 0,
                      emphasis: {
                            label: {
                                show: true,
                                fontSize: '15',
                                fontWeight: 'bold'
                            }
                        },
                        label: {
                            show: true,
                            position: "insideBottom",
                            distance: 15,
                            align: "left",
                            verticalAlign: "middle",
                            fontSize: 16,
                        },
                      data: data
                    }
                    seriesData.add(obj);
                 }

                // setCurrentTime(moment().format('DD-MM-YYYY HH:mm:ss'))
                // setLastDataRefreshTime({ ...lastDataRefreshTime, performanceActivity: moment().format('DD-MM-YYYY HH:mm:ss') })
                setPerformer([{ yAxisData, xAxisData: Array.from(xAxisData), legend: Array.from(legend), seriesData: Array.from(seriesData) }])
            }
            unstable_batchedUpdates(() => {
                if (meOrMyTeam === 'Me') {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceOrder: moment().format('DD-MM-YYYY HH:mm:ss') })
                } else {
                    setLastDataRefreshTime({ ...lastDataRefreshTime, TopPerformanceOrderTeam: moment().format('DD-MM-YYYY HH:mm:ss') })
                }
            })
        }).catch((error) => {
            // console.log(error)
        }).finally(() => {
        })

    }, [meOrMyTeam, searchParams, entityType])

    useEffect(() => {
        // // console.log(globalSearchParams, "from assign to me component")
        setSearchParams({
            ...searchParams,
            ...globalSearchParams
        });
    }, [globalSearchParams])

    useEffect(() => {
        if (searchParams?.departmentId) getinformativeDetails();
    }, [isRefresh, meOrMyTeam, entityType, getinformativeDetails, isPageRefresh]);

    const entityTypes = [{
        label: "Order Type",
        value: "orderType"
    }, {
        label: "Order Category",
        value: "orderCategory"
    }]

    useEffect(() => {
        const interval = setInterval(() => setLastUpdatedAt(moment(meOrMyTeam === 'Me' ? lastDataRefreshTime?.TopPerformanceOrder : lastDataRefreshTime?.TopPerformanceOrderTeam, "DD-MM-YYYY HH:mm:ss")), 60 * 1000);
        return () => clearInterval(interval);
    }, [lastDataRefreshTime]);

    return (
        <div className="cmmn-skeleton">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Top 5 Orders</span>
                <ReactSelect
                    className="skel-cust-graph-select"
                    options={entityTypes}
                    menuPortalTarget={document.body} 
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}                    
                    value={entityType ? entityTypes.find(c => c.value === entityType.value) : null}
                    onChange={(val) => setEntityType(val)}
                />
                <div className="skel-dashboards-icons">
                    <a title="Refresh"><i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i></a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-perf-sect">
                <div className="skel-perf-data j-center">
                </div>
                <div className="skel-perf-graph">
                    <TopPerformingCategory
                        data={{
                            chartData: performer,
                            entity: entityType.label,
                            masterLookupData
                        }}
                    />
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-refresh-info">
                <span><i title="Refresh" className="material-icons">refresh</i> Updated {moment(lastUpdatedAt).fromNow()}</span>
            </div>
        </div>
    )

}

export default TopPerformanceOrder;