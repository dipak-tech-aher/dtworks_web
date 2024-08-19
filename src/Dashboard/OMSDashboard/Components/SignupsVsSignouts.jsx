import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post, slowPost } from '../../../common/util/restUtil';
import DynamicTable from "../../../common/table/DynamicTable";
import { TotalCustomersColumns } from './Coulmns';
import { Modal } from 'react-bootstrap';
import moment from 'moment';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const SignupsVsSignouts = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData, handleOpenRightModal } = handlers;
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const chartRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [totalStats, setTotalStats] = useState({
        oTSignups: 0,
        oTSignouts: 0,
        oAvgSignups: 0,
        oAvgSignouts: 0
    });
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [columnData, setColumnData] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const { apiCall } = props
    const { exportData } = data

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let totalData = {}
            let requestObj = { ...searchParams, filterType: 'COUNT' }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                totalData['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'TOTAL_SIGNOUT' }
            const response1 = await slowPost(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            if (response1?.data?.length) {
                // setTotalStats((prevState) => ({ ...prevState, oTSignouts: Number(response1?.data[0]?.oSignout ?? 0) }));
                totalData['tSignouts'] = Number(response1?.data[0]?.oSignout ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'TOTAL_SIGNUPS' }
            const response2 = await slowPost(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            if (response2?.data?.length) {
                // setTotalStats((prevState) => ({ ...prevState, oTSignups: Number(response2?.data[0]?.oSignin ?? 0) }));
                totalData['tSignups'] = Number(response2?.data[0]?.oSignin ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'AVG_SIGNUPS' }
            const response3 = await slowPost(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            if (response3?.data?.length) {
                // setTotalStats((prevState) => ({ ...prevState, oAvgSignups: Number(response3?.data[0]?.oSignin ?? 0) }));
                totalData['avgSignups'] = Number(response3?.data[0]?.oSignin ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'AVG_SIGNOUT' }
            const response4 = await slowPost(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            if (response4?.data?.length) {
                // setTotalStats((prevState) => ({ ...prevState, oAvgSignouts: Number(response4?.data[0]?.oSignin ?? 0) }));
                totalData['avgSignouts'] = Number(response4?.data[0]?.oSignout ?? 0)
            }

            setExportData?.('signups-signouts', totalData);

            let { chartData, tSignouts, tSignups, avgSignups, avgSignouts } = totalData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (tSignouts) setTotalStats((prevState) => ({ ...prevState, oTSignouts: tSignouts }))
                if (tSignups) setTotalStats((prevState) => ({ ...prevState, oTSignups: tSignups }))
                if (avgSignups) setTotalStats((prevState) => ({ ...prevState, oAvgSignups: avgSignups }))
                if (avgSignouts) setTotalStats((prevState) => ({ ...prevState, oAvgSignouts: avgSignouts }))
                if (chartData) setChartData(chartData);
            })
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const getGraphData = () => {
        let requestObj = { ...searchParams, filterType: 'COUNT' }
        post(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
            .then((response) => {
                if (response?.data?.length) setChartData(response?.data ?? []); else setChartData([]);
            }).catch(error => {
                console.log(error)
                setChartData([])
            })
    }

    // const getTotatSignOuts = () => {
    //     let requestObj = { ...searchParams, filterType: 'TOTAL_SIGNOUT' }
    //     post(`${properties.ORDER_API}/oms-dashboard/signups-signouts`, { searchParams: requestObj })
    //         .then((response) => {
    //             if (response?.data?.length) setTotalStats((prevState) => ({ ...prevState, oTSignouts: Number(response?.data[0]?.oSignout ?? 0) }));
    //         }).catch(error => {
    //             console.log(error)
    //         })
    // }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (fromDate && toDate) {
            getChartData();
            if (apiCall) getChartData();
        }
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    useEffect(() => {
        let { chartData, tSignouts, tSignups, avgSignups, avgSignouts } = exportData?.["signups-signouts"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (tSignouts) setTotalStats((prevState) => ({ ...prevState, oTSignouts: tSignouts }))
            if (tSignups) setTotalStats((prevState) => ({ ...prevState, oTSignups: tSignups }))
            if (avgSignups) setTotalStats((prevState) => ({ ...prevState, oAvgSignups: avgSignups }))
            if (avgSignouts) setTotalStats((prevState) => ({ ...prevState, oAvgSignouts: avgSignouts }))
        })
    }, [exportData])

    useEffect(() => {
        const chartDom = chartRef.current;
        if (chartDom) {
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
            let newChartData = chartData?.map((val, i) => {
                return ({
                    'product': val?.oInterval,
                    'Sign-ups': Number(val?.oSignin ?? 0),
                    'Sign-outs': Number(val?.oSignout ?? 0)
                })
            })
            const option = {
                title: {
                    show: chartData?.length > 0 ? false : true,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No data available",
                    left: "center",
                    top: "center"
                },
                legend: { bottom: 10 },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },

                color: ['#5470C6', '#FF6666'],
                dataset: {
                    dimensions: ['product', 'Sign-ups', 'Sign-outs'],
                    source: chartData?.map((val, i) => {
                        return ({
                            'product': val?.oInterval,
                            'Sign-ups': Number(val?.oSignin ?? 0),
                            'Sign-outs': Number(val?.oSignout ?? 0)
                        })
                    }) ?? []
                },
                xAxis: [
                    {
                        type: 'category',
                        data: chartData?.map((val, i) => val?.oInterval),
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ],
                yAxis: { type: 'value' },

                series: [
                    {
                        name: 'Sign-ups',
                        type: 'bar',
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        label: {
                            show: true,
                            ellipsis: '...'
                        }
                    },
                    {
                        name: 'Sign-outs',
                        type: 'bar',
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        label: {
                            show: true,
                            ellipsis: '...'
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
        }
    }, [chartData]);

    const showDetails = (filterType) => {
        setIsLoading(true)
        let requestObj = { ...searchParams, filterType: filterType }
        slowPost(properties.ORDER_API + '/oms-dashboard/signups-signouts', { searchParams: requestObj })
            .then((response) => {
                setColumnData(response?.data);
                setShow(true)
            })
            .catch(error => {
                console.error(error);
            }).finally(() => setIsLoading(false));
    }

    const handleClose = () => {
        setShow(false);
        setColumnData([]);
        getGraphData();
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "oCustomerNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        if (cell.column.id === "updatedAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            {isLoading ? (
                <Loader />
            ) : (
                <div className="cmmn-skeleton h-100">
                    <div className="skel-dashboard-title-base">
                        <span className="skel-header-title">
                            Total Sign-ups vs Sign-outs
                        </span>
                    </div>
                    <hr className="cmmn-hline" />
                    <div className="row mt-2">
                        <div className="col-6">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2">
                                    Total Sign-ups
                                </span>
                                <h4 className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal" onClick={() => showDetails("DETAIL_SIGNUPS")}>
                                    {totalStats?.oTSignups}
                                </h4>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2">
                                    Total Sign-outs
                                </span>
                                <h4
                                    className="font-bold cursor-pointer"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={() => showDetails("DETAIL_SIGNOUT")}
                                >
                                    {totalStats?.oTSignouts}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <div className="skel-graph-sect mt-2 skel-avg-graph-height">
                        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                    </div>
                    <hr className="cmmn-hline" />
                    <div className="skel-graph-average-sect">
                        <div className="row">
                            <div className="col">
                                <div className="skel-average">
                                    <span className="skel-average-circle">
                                        <img
                                            src={AverageArrow}
                                            alt=""
                                        />
                                    </span>
                                    <div className="skel-average-data">
                                        <span className="skel-avg-title">
                                            Average Sign-ups
                                        </span>
                                        <span>
                                            per month&nbsp;
                                            {totalStats?.oAvgSignups >= 0 ?
                                                <span className="skel-arrow-up">
                                                    <strong>{totalStats?.oAvgSignups}%&nbsp;</strong>
                                                    <i className="fa fa-arrow-up" aria-hidden="true" />
                                                </span> :
                                                <span className="skel-arrow-down">
                                                    <strong>{totalStats?.oAvgSignups}%&nbsp;</strong>
                                                    <i className="fa fa-arrow-down" aria-hidden="true" />
                                                </span>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col">
                                <div className="skel-average">
                                    <span className="skel-average-circle">
                                        <img
                                            src="./assets/images/average-arrow.svg"
                                            alt=""
                                        />
                                    </span>
                                    <div className="skel-average-data">
                                        <span className="skel-avg-title">
                                            Average Sign-outs
                                        </span>
                                        <span>
                                            per month&nbsp;
                                            {totalStats?.oAvgSignouts >= 0 ?
                                                <span className="skel-arrow-up">
                                                    <strong>{totalStats?.oAvgSignouts}%&nbsp;</strong>
                                                    <i className="fa fa-arrow-up" aria-hidden="true" />
                                                </span> :
                                                <span className="skel-arrow-down">
                                                    <strong>{totalStats?.oAvgSignouts}%&nbsp;</strong>
                                                    <i className="fa fa-arrow-down" aria-hidden="true" />
                                                </span>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                        <Modal.Header>
                            <b>Total Customers</b>
                            <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                                <span aria-hidden="true">×</span>
                            </button>
                        </Modal.Header>
                        <Modal.Body>
                            <DynamicTable
                                listKey={"signups-signouts"}
                                row={columnData}
                                exportBtn={exportBtn}
                                rowCount={columnData?.length}
                                header={TotalCustomersColumns}
                                columnFilter={true}
                                fixedHeader={true}
                                itemsPerPage={perPage}
                                isScroll={true}
                                isTableFirstRender={tableRef}
                                backendCurrentPage={currentPage}
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handlePageSelect: handlePageSelect,
                                    handleItemPerPage: setPerPage,
                                    handleCurrentPage: setCurrentPage,
                                    handleFilters: setFilters,
                                    handleExportButton: setExportBtn,
                                }}
                            />
                        </Modal.Body>
                    </Modal>
                </div>
            )}
        </div>
    )
}

export default SignupsVsSignouts;