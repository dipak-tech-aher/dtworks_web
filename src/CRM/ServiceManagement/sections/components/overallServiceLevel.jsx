import React, { useContext, useEffect, useState, useRef } from 'react';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { emojis } from '../../../../AppConstants';
import * as echarts from 'echarts';

const OverallServiceLevel = (props) => {
    const { data, handlers } = useContext(Service360Context);
    const { subscriptionDetails, masterDataLookup } = data;
    const entities = [
        { code: "ALL", description: "All" },
        {
            code: "HELPDESK_TYPE", description: "Helpdesk",
            emojis: [...new Set(masterDataLookup['HELPDESK_TYPE'].map(x => emojis.find(y => y.name === x.mapping?.emoji?.[0])))]
        },
        {
            code: "INTXN_TYPE", description: "Interaction",
            emojis: [...new Set(masterDataLookup['INTXN_TYPE'].map(x => emojis.find(y => y.name === x.mapping?.emoji?.[0])))]
        },
        {
            code: "ORDER_TYPE", description: "Order",
            emojis: [...new Set(masterDataLookup['ORDER_TYPE'].map(x => emojis.find(y => y.name === x.mapping?.emoji?.[0])))]
        }
    ]

    const [selectedEntity, setSelectedEntity] = useState(entities[0]);
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
             
                const helpdeskResponse = await post(`${properties.HELPDESK_API}/search?limit=&page=`, { serviceUuid: subscriptionDetails?.serviceUuid });
                const interactionResponse = await post(`${properties.INTERACTION_API}/search`, { page: null, limit: null, searchParams: { serviceUuid: subscriptionDetails?.serviceUuid } });
                const orderResponse = await post(`${properties.ORDER_API}/s360-search?limit=&page=`, { searchParams: { serviceUuid: subscriptionDetails?.serviceUuid } });
                const filterRows = (rows, type) => {
                    if (type === 'ALL') {
                        return rows;
                    }
                    if (type === 'HELPDESK_TYPE') {
                        return rows.filter(row => row.helpdeskType);
                    }
                    if (type === 'INTXN_TYPE') {
                        return rows.filter(row => row.intxnType);
                    }
                    if (type === 'ORDER_TYPE') {
                        return rows.filter(row => row.orderType);
                    }
                    return rows;
                };


                const allRows = [...helpdeskResponse.data.rows, ...interactionResponse.data.rows, ...orderResponse.data.rows];
                const filteredRows = filterRows(allRows, selectedEntity.code);

                const slaCounts = filteredRows.reduce((acc, row) => {
                    const category = row.sla?.slaCategory;
                    if (!acc[category]) {
                        acc[category] = 0;
                    }
                    acc[category]++;
                    return acc;
                }, {});

                const formattedData = Object.keys(slaCounts).map((key) => ({
                    name: key,
                    count: slaCounts[key]
                }));
                console.log(formattedData);

                setSeriesData(formattedData);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [selectedEntity, subscriptionDetails])

    const chartRef = useRef(null);
    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const selectedEmojies = selectedEntity.code === 'ALL' ? emojis : selectedEntity.emojis;
        const option = {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'white',
                borderColor: 'white',
            },
            xAxis: {
                type: 'value',
                boundaryGap: [0, 0.01]
            },
            yAxis: {
                type: 'category',
                data: seriesData.map(data => data.name),
                // name: 'Overall Service Level',
                // nameLocation: 'middle',
                // nameGap: 25,
                // nameTextStyle: {
                //     fontSize: 16
                // }
            },
            series: [
                {
                    type: 'bar',
                    data: seriesData.map(data => ({ value: data.count })),
                    itemStyle: {
                        color: (params) => {
                            const category = params.name;
                            const emoji = emojis.find(e => e.name === category);
                            return emoji ? emoji.color : '#8884d8';
                        }
                    }
                }
            ]
        };

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }, [seriesData, selectedEntity])

    const onChangeEntity = (e) => {
        const { value } = e.target;
        setSelectedEntity(entities.find(x => x.code === value));
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Overall Service Level</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row mb-0">
                        <div className="col-md-auto ml-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="">By</label>
                                    <select onChange={onChangeEntity} defaultValue={selectedEntity.code} className="form-control form-control-sm w-auto px-1 ml-2">
                                        {entities?.map((entity) => (
                                            <option key={entity.code} value={entity.code}>{entity.description}</option>
                                        ))}
                                    </select>
                                </div>
                            </form>
                        </div>
                    </div>
                    {/* <div className="row mt-3">
                        {emojis?.map((emoji) => (
                            <div className="col-md-3" key={emoji.name}>
                                <h3>
                                    <i className={`far ${emoji.emojiClass}`} />
                                </h3>
                                <h6 className="text-center">{emoji.name}</h6>
                            </div>
                        ))}
                    </div> */}
                    <div ref={chartRef} style={{ width: '100%', height: '418px' }}></div>
                </div>
            </div>
        </div>
    )
}

export default OverallServiceLevel;