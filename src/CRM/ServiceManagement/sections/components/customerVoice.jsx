import React, { useState, useEffect, useRef, useContext } from 'react';
import * as echarts from 'echarts';
import { emojis } from '../../../../AppConstants';
import { properties } from '../../../../properties';
import { post } from '../../../../common/util/restUtil';
import { Service360Context } from '../../../../AppContext';

const CustomerVoice = (props) => {
    const { data, handlers } = useContext(Service360Context);
    const { subscriptionDetails, masterDataLookup } = data;
    const productChart = useRef(null);
    const customerServiceChart = useRef(null);
    const productFeedbackChart = useRef(null);
    const [selectedEntity, setSelectedEntity] = useState('ALL');
    const [chartData, setChartData] = useState([])
    const [insights, setInsights] = useState([]);

    useEffect(() => {
        let requestObj = { serviceNo: subscriptionDetails?.serviceNo }
        if (selectedEntity !== 'ALL') {
            requestObj.category = selectedEntity
        }
        post(`${properties.ACCOUNT_DETAILS_API}/insights`,requestObj ).then((response) => {
            if (response?.data) {
                console.log(response.data)
                setInsights(response.data)
            }
        }).catch(error => {
            console.error(error);
        });
    }, [selectedEntity])

    const generateChart = (myChart, name, seriesData) => {
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                }
            },
            xAxis: [
                {
                    type: 'category',
                    data: [name],
                    name: name,
                    nameLocation: 'middle',
                    nameGap: 10,
                    nameTextStyle: {
                        fontSize: 16
                    },
                    axisLabel: {
                        show: false
                    }
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    axisLabel: {
                        show: true
                    }
                }
            ],
            series: seriesData
        };

        if (option && typeof option === 'object') {
            myChart.setOption(option);
        }

        window.addEventListener('resize', myChart.resize);

        return () => {
            window.removeEventListener('resize', myChart.resize);
            myChart.dispose();
        };
    }
console.log('insights',insights)
    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1)?.toLowerCase();
    };

    useEffect(() => {
        const chartDataa = [
            { name: "Product", code: "CUST_SERVICES", dom: productChart.current, data: [] },
            { name: "Customer Service", code: "PRODUCT", dom: customerServiceChart.current, data: [] }
        ]
        const fetchData = (chart) => {
            return new Promise((resolve, reject) => {
                let tempArr = [];
                post(`${properties.ACCOUNT_DETAILS_API}/customer-voice`, { serviceNo: subscriptionDetails?.serviceNo, category: chart.code, subCategory: selectedEntity }).then((response) => {
                    emojis.forEach(emoji => {
                        let count = response.data.find(x => x.oEmoji == emoji.name)?.oTotalCnt ?? 0;
                        tempArr.push({
                            name: capitalizeFirstLetter(emoji.name), type: 'bar', data: [count], itemStyle: {
                                color: emoji.color
                            }
                        });
                    });
                    chart['data'] = tempArr;
                    resolve(chart)
                }).catch(error => {
                    console.error(error);
                });
            })
        }
        Promise.all(chartDataa.map(x => fetchData(x))).then(result => {
            setChartData([...result]);
        })
    }, [selectedEntity])

    useEffect(() => {
        chartData.forEach(chart => {
            const myChart = echarts.init(chart.dom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            generateChart(myChart, chart.name, chart.data);
        })
    }, [chartData])

    useEffect(() => {
        const myChart = echarts.init(productFeedbackChart.current, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });
        const option = {
            tooltip: {
                trigger: 'item'
            },
            legend: {
                left: 'center',
                show: true,
                top: '5%'
            },
            title: {
                text: 'Cost Effective',
                left: 'center',     
                top: '50%',
                textStyle: {
                    fontSize: 14
                }
            },
            series: [
                {
                    name: '',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    data: [
                        {
                            value: Math.round(insights?.chartData?.positive ?? 0),
                            name: 'Yes',
                            itemStyle: {
                                color: '#5470C6'
                            }
                        },
                        {
                            value: Math.round(insights?.chartData?.negative ?? 0),
                            name: 'No',
                            itemStyle: {
                                color: '#F14F33'
                            }
                        },

                    ],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    },
                    tooltip: {
                        valueFormatter: function (value) {
                            return value + '%';
                        }
                    },
                    label: {
                        formatter: function(params) {
                            return `{a|${params.name}}\n{b|${params.value+'%'}}`;
                        },
                        rich: {
                            a: {
                                color: 'black',
                                fontSize: 16,
                                fontWeight: 300
                            },
                            b: {
                                color: 'black',
                                fontSize: 14,
                                fontWeight: 700

                            }
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
    }, [insights])

    return (
        <div className="col-md-12 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Customer Voice</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row mb-0">
                        <div className="col-md-auto ml-auto">
                            <form className="form-inline">
                                <div className="form-group">
                                    <label htmlFor="">By</label>
                                    <select onChange={(e) => setSelectedEntity(e.target.value)} className="form-control form-control-sm w-auto px-1 ml-2">
                                        <option value={'ALL'}> All </option>
                                        <option value={'HELPDESK'}>Helpdesk</option>
                                        <option value={'INTXN'}>Interaction</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-8">
                            <div className="row">
                                <div className="col-md-10 mx-auto">
                                    <div className="row">
                                        {emojis?.map((emoji) => (
                                            <div className="col-md-3" key={emoji.name}>
                                                <h3>
                                                    <i className={`far ${emoji.emojiClass}`} />
                                                </h3>
                                                <h6 className="text-center">{emoji.name}</h6>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-6 pr-0">
                                    <div ref={productChart} style={{ width: '100%', height: '350px' }}></div>
                                </div>
                                <div className="col-md-6 pr-0">
                                    <div ref={customerServiceChart} style={{ width: '100%', height: '350px' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div ref={productFeedbackChart} style={{ width: '100%', height: '350px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerVoice;