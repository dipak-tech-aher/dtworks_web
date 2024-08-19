import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import ReactApexChart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
import LastRefreshTime from './LastRefreshTime';
import { unstable_batchedUpdates } from 'react-dom';

const DeptVsRole = (props) => {
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data
    const [isRefresh, setIsRefresh] = useState(false)
    const [chartData, setChartData] = useState({})
    const [responseData, setResponseData] = useState([])
    const [roleDataList, setRoleDataList] = useState([])
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    var colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#00D9E9', '#FF66C3'];

    function makeData(responseData, roleData) {
        // console.log('roleData--------->', roleData)
        // console.log('roleDataList--------->', roleDataList)
        if (roleData?.length > 0 || roleDataList?.length > 0) {
            // console.log('here--xx---')
            roleData = roleData ?? roleDataList
        }
        // let colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#00D9E9', '#FF66C3'];
        const quarter = roleData?.map((ele) => {
            return {
                x: ele?.oCurrRoleDec,
                y: Number(ele?.oIntxnCount)
            }
        })
        let dataYearSeries = responseData.map((item, index) => {
            return {
                x: item.oStatus,
                y: item.oIntxnCount,
                color: colors[index],
                quarters: quarter
            };
        });
        return dataYearSeries;
    }

    function updateQuarterChart(sourceChart, destChartIDToUpdate) {
        // console.log('sourceChart------->', sourceChart)
        // console.log('destChartIDToUpdate------->', destChartIDToUpdate)
        var series = [];
        var seriesIndex = 0;
        var colors = []

        if (sourceChart.w.globals.selectedDataPoints[0]) {
            var selectedPoints = sourceChart.w.globals.selectedDataPoints;
            for (var i = 0; i < selectedPoints[seriesIndex].length; i++) {
                var selectedIndex = selectedPoints[seriesIndex][i];
                var yearSeries = sourceChart.w.config.series[seriesIndex];
                // console.log('yearSeries-------->', yearSeries)
                // console.log('yearSeries.data[selectedIndex].color-------->', yearSeries?.data[selectedIndex]?.color)
                // console.log('yearSeries?.data[selectedIndex]?.quarters-------->', yearSeries?.data[selectedIndex]?.quarters)

                yearSeries?.data[selectedIndex]?.quarters?.forEach(item => {
                    if (item.x === null) {
                        item.x = "Others"; // Replace with your dynamic value
                    }
                });

                series = [{
                    name: yearSeries?.data[selectedIndex]?.x,
                    data: yearSeries?.data[selectedIndex]?.quarters
                }]
                // colors.push(yearSeries.data[selectedIndex].color)
                colors = [yearSeries?.data[selectedIndex]?.color]
            }

            if (series?.length === 0) series = [{
                data: []
            }]
            // console.log('series-------->', series)
            // console.log('colors-------->', colors)
            return ApexCharts.exec(destChartIDToUpdate, 'updateOptions', {
                series: series,
                colors: colors,
                // fill: {
                //     colors: colors
                // }
            })
        }
    }

    const callApi = (prevResp, opt) => {
        const t = opt?.w?.config?.series[0]?.data[opt?.dataPointIndex]
        const departmentId = prevResp?.find((ele) => ele?.oStatus === t?.x)?.oStatusCode;
        setLoading(true)
        slowPost(properties.INTERACTION_API + "/dept-vs-roles-interactions", { ...searchParams, departmentId, category: "COUNT" }).then((resp) => {
            if (resp?.status == 200) {
                setRoleDataList([...roleDataList, ...resp?.data?.rows]);
                const data = {
                    series: [{
                        data: makeData(prevResp, resp?.data?.rows)
                    }],
                    options: {
                        chart: {
                            id: 'barYear',
                            height: 400,
                            width: '100%',
                            type: 'bar',
                            events: {
                                dataPointSelection: function (e, chart, opts) {
                                    // console.log(prevResp, opts)
                                    callApi(prevResp, opts);
                                    
                                    var quarterChartEl = document.querySelector("#chart-quarter");
                                    var yearChartEl = document.querySelector("#chart-year");

                                    if (opts.selectedDataPoints[0].length === 1) {
                                        if (quarterChartEl.classList.contains("active")) {
                                            updateQuarterChart(chart, 'barQuarter')
                                        } else {
                                            yearChartEl.classList.add("chart-quarter-activated")
                                            quarterChartEl.classList.add("active");
                                            updateQuarterChart(chart, 'barQuarter')
                                        }
                                    } else {
                                        updateQuarterChart(chart, 'barQuarter')
                                    }

                                    if (opts.selectedDataPoints[0].length === 0) {
                                        yearChartEl.classList.remove("chart-quarter-activated")
                                        quarterChartEl.classList.remove("active");
                                    }
                                },
                                updated: function (chart) {
                                    updateQuarterChart(chart, 'barQuarter')
                                }
                            }
                        },
                        plotOptions: {
                            bar: {
                                distributed: true,
                                horizontal: true,
                                barHeight: '75%',
                                dataLabels: {
                                    position: 'bottom'
                                }
                            }
                        },
                        dataLabels: {
                            enabled: true,
                            textAnchor: 'start',
                            style: {
                                colors: ['#fff']
                            },
                            formatter: function (val, opt) {
                                return opt?.w?.globals?.labels[opt?.dataPointIndex]
                            },
                            offsetX: 0,
                            dropShadow: {
                                enabled: true
                            }
                        },
                        colors: colors,
                        states: {
                            normal: {
                                filter: {
                                    type: 'desaturate'
                                }
                            },
                            active: {
                                allowMultipleDataPointsSelection: true,
                                filter: {
                                    type: 'darken',
                                    value: 1
                                }
                            }
                        },
                        tooltip: {
                            x: {
                                show: false
                            },
                            y: {
                                title: {
                                    formatter: function (val, opts) {
                                        return opts?.w?.globals?.labels[opts?.dataPointIndex]
                                    }
                                }
                            }
                        },
                        title: {
                            text: 'Department Wise Interactions',
                            offsetX: 15
                        },
                        subtitle: {
                            text: '(Click on bar to see details)',
                            offsetX: 15
                        },
                        yaxis: {
                            labels: {
                                show: false
                            }
                        }
                    },
                    seriesQuarter: [{
                        data: []
                    }],
                    optionsQuarter: {
                        chart: {
                            id: 'barQuarter',
                            height: 400,
                            width: '100%',
                            type: 'bar',
                            stacked: true
                        },
                        plotOptions: {
                            bar: {
                                columnWidth: '50%',
                                horizontal: false
                            }
                        },
                        legend: {
                            show: false
                        },
                        grid: {
                            yaxis: {
                                lines: {
                                    show: false,
                                }
                            },
                            xaxis: {
                                lines: {
                                    show: true,
                                }
                            }
                        },
                        yaxis: {
                            labels: {
                                show: false
                            }
                        },
                        title: {
                            text: 'Role Wise Interactions',
                            offsetX: 10
                        },
                        tooltip: {
                            x: {
                                formatter: function (val, opts) {
                                    return opts?.w?.globals?.seriesNames[opts?.seriesIndex]
                                }
                            },
                            y: {
                                title: {
                                    formatter: function (val, opts) {
                                        return opts?.w?.globals?.labels[opts?.dataPointIndex]
                                    }
                                }
                            }
                        }
                    },
                };
                setChartData(data)
            }
        }).finally(() => setLoading(false))
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                slowPost(properties.INTERACTION_API + "/dept-interactions", { ...searchParams, category: "COUNT" }).then((resp) => {
                    if (resp?.status == 200) {
                        setResponseData(resp?.data?.rows)
                        const data = {
                            series: [{
                                data: makeData(resp?.data?.rows, [])
                            }],
                            options: {
                                chart: {
                                    id: 'barYear',
                                    height: 400,
                                    width: '100%',
                                    type: 'bar',
                                    events: {
                                        dataPointSelection: function (e, chart, opts) {
                                            // console.log('here call the api------>', opts?.w?.config?.series[0]?.data);

                                            callApi(resp?.data?.rows, opts);
                                            
                                            var quarterChartEl = document.querySelector("#chart-quarter");
                                            var yearChartEl = document.querySelector("#chart-year");

                                            if (opts.selectedDataPoints[0].length === 1) {
                                                if (quarterChartEl.classList.contains("active")) {
                                                    updateQuarterChart(chart, 'barQuarter')
                                                } else {
                                                    yearChartEl.classList.add("chart-quarter-activated")
                                                    quarterChartEl.classList.add("active");
                                                    updateQuarterChart(chart, 'barQuarter')
                                                }
                                            } else {
                                                updateQuarterChart(chart, 'barQuarter')
                                            }

                                            if (opts.selectedDataPoints[0].length === 0) {
                                                yearChartEl.classList.remove("chart-quarter-activated")
                                                quarterChartEl.classList.remove("active");
                                            }
                                        },
                                        updated: function (chart) {
                                            updateQuarterChart(chart, 'barQuarter')
                                            var quarterChartEl = document.querySelector("#chart-quarter");
                                            var yearChartEl = document.querySelector("#chart-year");
                                            yearChartEl.classList.remove("chart-quarter-activated")
                                            quarterChartEl.classList.remove("active");
                                        }
                                    }
                                },
                                plotOptions: {
                                    bar: {
                                        distributed: true,
                                        horizontal: true,
                                        barHeight: '75%',
                                        dataLabels: {
                                            position: 'bottom'
                                        }
                                    }
                                },
                                dataLabels: {
                                    enabled: true,
                                    textAnchor: 'start',
                                    style: {
                                        colors: ['#fff']
                                    },
                                    formatter: function (val, opt) {
                                        return opt.w.globals.labels[opt.dataPointIndex]
                                    },
                                    offsetX: 0,
                                    dropShadow: {
                                        enabled: true
                                    }
                                },

                                colors: colors,

                                states: {
                                    normal: {
                                        filter: {
                                            type: 'desaturate'
                                        }
                                    },
                                    active: {
                                        allowMultipleDataPointsSelection: true,
                                        filter: {
                                            type: 'darken',
                                            value: 1
                                        }
                                    }
                                },
                                tooltip: {
                                    x: {
                                        show: false
                                    },
                                    y: {
                                        title: {
                                            formatter: function (val, opts) {
                                                return opts.w.globals.labels[opts.dataPointIndex]
                                            }
                                        }
                                    }
                                },
                                title: {
                                    text: 'Yearly Results',
                                    offsetX: 15
                                },
                                subtitle: {
                                    text: '(Click on bar to see details)',
                                    offsetX: 15
                                },
                                yaxis: {
                                    labels: {
                                        show: false
                                    }
                                }
                            },

                            seriesQuarter: [{
                                data: []
                            }],
                            optionsQuarter: {
                                chart: {
                                    id: 'barQuarter',
                                    height: 400,
                                    width: '100%',
                                    type: 'bar',
                                    stacked: true
                                },
                                plotOptions: {
                                    bar: {
                                        columnWidth: '50%',
                                        horizontal: false
                                    }
                                },
                                legend: {
                                    show: false
                                },
                                grid: {
                                    yaxis: {
                                        lines: {
                                            show: false,
                                        }
                                    },
                                    xaxis: {
                                        lines: {
                                            show: true,
                                        }
                                    }
                                },
                                yaxis: {
                                    labels: {
                                        show: false
                                    }
                                },
                                title: {
                                    text: 'Quarterly Results',
                                    offsetX: 10
                                },
                                tooltip: {
                                    x: {
                                        formatter: function (val, opts) {
                                            return opts.w.globals.seriesNames[opts.seriesIndex]
                                        }
                                    },
                                    y: {
                                        title: {
                                            formatter: function (val, opts) {
                                                return opts.w.globals.labels[opts.dataPointIndex]
                                            }
                                        }
                                    }
                                }
                            },
                        };

                        setChartData(data);

                        let dataObject = {}
                        dataObject['responseData'] = resp?.data?.rows ?? []
                        dataObject['chartData'] = data
                        props?.setExportData?.(`deptRole`, dataObject)
                    }
                }).catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        if (apiCall) fetchData(); setLoading(false);
    }, [isRefresh, searchParams, isParentRefresh])
    useEffect(() => {
        let { responseData, chartData } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (responseData) setResponseData(responseData);
            if (chartData) setChartData(chartData);
        })
    }, [exportData])
    return (

        // <div> {loading ? (
        //     <Loader />
        //   ) : (

        <div className="cmmn-skeleton cmmn-skeleton-new" style={{ 'height': '100%' }}>
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title"> Interaction by Department wise vs Role wise </span>
                <div className="skel-dashboards-icons">
                    <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                        <i className="material-icons">refresh</i>
                    </a>
                </div>
            </div>
            <hr className="cmmn-hline" />
            <div className="skel-graph-sect">
                {responseData?.length && Object.keys(chartData).length !== 0 ? (
                    <div id="wrap">
                        <div id="chart-year">
                            <ReactApexChart options={chartData?.options} series={chartData?.series} type="bar" height={400} />
                        </div>
                        <div id="chart-quarter">
                            <ReactApexChart options={chartData?.optionsQuarter} series={chartData?.seriesQuarter} type="bar" height={400} />
                        </div>
                    </div>
                ) : (
                    <div id='wrap' style={{ display: 'block', fontWeight: 700, padding: '200px 0' }} className='text-center'>
                        No interactions found
                    </div>
                )}
            </div>
        </div>
        //  )}
        //  </div>
    );
};

export default DeptVsRole;