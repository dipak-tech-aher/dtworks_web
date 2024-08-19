import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { get, post, slowPost } from '../../../common/util/restUtil';
import DynamicTable from "../../../common/table/DynamicTable";
import { TotalCustomersColumns } from './Coulmns';
import { Modal } from 'react-bootstrap';
import moment from 'moment';
import AverageArrow from '../../../assets/images/average-arrow.svg';

const PurchasingFrequencyOfCustomers = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
    const [graphType, setGraphType] = useState('SERVICE_TYPE')
    const [serviceList, setServiceList] = useState([]);
    const [productList, setProductList] = useState([]);
    const [graphCode, setGraphCode] = useState('');
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [averageCustomers, setAverageCustomers] = useState(0);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [columnData, setColumnData] = useState([]);
    const [exportBtn, setExportBtn] = useState(false);
    const { apiCall } = props
    const { exportData } = data

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=SERVICE_TYPE,PRODUCT_TYPE')
            .then((response) => {
                unstable_batchedUpdates(() => {
                    setServiceList(response?.data?.['SERVICE_TYPE'])
                    setProductList(response?.data?.['PRODUCT_TYPE'])
                    setGraphCode(response?.data?.['SERVICE_TYPE']?.[0]?.val?.code);
                })
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const getChartData = async () => {
        try {
            setIsLoading(true)
            let purchasingData = {}
            let requestObj = { ...searchParams, filterType: 'COUNT', vCategory2: graphCode }
            const response = await post(`${properties.ORDER_API}/oms-dashboard/purchasing-frequency`, { searchParams: requestObj })
            if (response?.data?.length) {
                // setChartData(response?.data ?? []);
                purchasingData['chartData'] = response?.data ?? []
            }

            requestObj = { ...searchParams, filterType: 'TOTAL_COUNT', vCategory2: graphCode }
            const response1 = await post(`${properties.ORDER_API}/oms-dashboard/purchasing-frequency`, { searchParams: requestObj })
            if (response1?.data?.length) {
                setTotalCustomers(Number(response1?.data[0]?.oRevenue ?? 0));
                purchasingData['totalCustomer'] = Number(response1?.data[0]?.oRevenue ?? 0)
            }

            requestObj = { ...searchParams, filterType: 'AVG', vCategory2: graphCode }
            const response2 = await post(`${properties.ORDER_API}/oms-dashboard/purchasing-frequency`, { searchParams: requestObj })
            if (response2?.data?.length) {
                setAverageCustomers(Number(response2?.data[0]?.oRevenue ?? 0));
                purchasingData['averageCustomer'] = Number(response2?.data[0]?.oRevenue ?? 0)
            }

            setExportData?.('purchasing-frequency', purchasingData);

            let { chartData, totalCustomer, averageCustomer } = purchasingData
            unstable_batchedUpdates(() => {
                setIsLoading(false)
                if (chartData) setChartData(chartData);
                if (totalCustomer) setTotalCustomers(totalCustomer);
                if (averageCustomer) setAverageCustomers(averageCustomer);
            })
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const getGraphData = () => {
        let requestObj = { ...searchParams, filterType: 'COUNT', vCategory2: graphCode }
        post(`${properties.ORDER_API}/oms-dashboard/purchasing-frequency`, { searchParams: requestObj })
            .then((response) => {
                if (response?.data?.length) setChartData(response?.data ?? []); else setChartData([]);
            }).catch(error => {
                console.log(error)
                setChartData([])
            })
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (fromDate && toDate) getChartData();
        if (apiCall) getChartData();
    }, [fromDate, toDate, isPageRefresh, category, type, status, department, graphType, graphCode])

    useEffect(() => {
        let { chartData, totalCustomer, averageCustomer } = exportData?.["purchasing-frequency"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
            if (totalCustomer) setTotalCustomers(totalCustomer);
            if (averageCustomer) setAverageCustomers(averageCustomer);
        })
    }, [exportData])

    useEffect(() => {
        const chartDom = chartRef.current;
        if (chartDom) {
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });
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
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross',
                        crossStyle: {
                            color: '#999'
                        }
                    }
                },

                xAxis: [
                    {
                        type: 'category',
                        // data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June'],
                        data: chartData?.map((val) => val?.oTotalOrder),
                        axisPointer: {
                            type: 'shadow'
                        }
                    }
                ],
                yAxis: [
                    {
                        type: 'value',
                        name: '',
                        min: 0,
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    {
                        type: 'value',
                        name: '',
                        min: 0,
                        max: 25,
                        interval: 0
                    }
                ],
                series: [
                    {
                        name: 'Total Customers',
                        type: 'bar',
                        tooltip: {
                            valueFormatter: function (value) {
                                return value;
                            }
                        },
                        // data: [13, 45, 23, 25, 19, 52],
                        data: chartData?.map((val) => val?.oRevenue),
                        itemStyle: {
                            color: '#5470C6'
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

    const showDetails = () => {
        setIsLoading(true)
        let requestObj = { ...searchParams, filterType: 'DETAIL', vCategory2: graphType }
        slowPost(properties.ORDER_API + '/oms-dashboard/purchasing-frequency', { searchParams: requestObj })
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
        getChartData();
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
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

    const handleOnSelect = (e) => {
        setGraphType(e.target.value)
        if (e.target.value === 'SERVICE_TYPE') {
            setGraphCode(serviceList[0]?.val?.code)
        } else if (e.target.value === 'PRODUCT_TYPE') {
            setGraphCode(productList[0]?.val?.code)
        }
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">
                        Purchasing Frequency of Customers
                    </span>
                </div>
                <hr className="cmmn-hline" />
                <div className="row">
                    <div className="col-4">
                        <select id="userId" className="form-control mt-2" value={graphType} onChange={(e) => handleOnSelect(e)}>
                            {/* <option value="">Select</option> */}
                            <option value={"SERVICE_TYPE"} data-custom-value="">
                                Service
                            </option>
                            <option value={"PRODUCT_TYPE"} data-custom-value="">
                                Product Type
                            </option>
                        </select>
                    </div>
                    <div className="col-8">
                        <div className="tabbable mt-2">
                            <ul
                                className="nav nav-tabs"
                                id="myTab2"
                                role="tablist"
                            >
                                {graphType === 'SERVICE_TYPE' && serviceList?.map((val, i) => {
                                    return (<li className="nav-item" onClick={() => setGraphCode(val?.code)}>
                                        <a className="nav-link" id={`s${val?.code}-tab`} data-toggle="tab" role="tab" aria-controls={`s${val?.code}tab`} aria-selected="true">
                                            {val?.description}
                                        </a>
                                    </li>)
                                })}
                                {graphType === 'PRODUCT_TYPE' && productList?.map((val, i) => {
                                    return (<li className="nav-item" onClick={() => setGraphCode(val?.code)}>
                                        <a className={`nav-link ${val?.code === graphCode ? 'active' : ''}`} id={`s${val?.code}-tab`} data-toggle="tab" role="tab" aria-controls={`s${val?.code}tab`} aria-selected="true">
                                            {val?.description}
                                        </a>
                                    </li>)
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="tab-content mt-2">
                    <div
                        className="tab-pane fade active show"
                        id="sgraph"
                        role="tabpanel"
                        aria-labelledby="stab"
                    >
                        <div className="row">
                            <div className="col">
                                <div className="text-center">
                                    <span className="text-center text-truncate d-block mb-0 mt-2">
                                        Total Customers
                                    </span>
                                    <h4
                                        className="font-bold cursor-pointer"
                                        data-target="#detailsmodal"
                                        data-toggle="modal"
                                        onClick={() => showDetails()}
                                    >
                                        {totalCustomers}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        {isLoading ? (
                            <Loader />
                        ) : (
                            <div className="skel-graph-sect mt-2">
                                <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                            </div>
                        )}
                        <hr className="cmmn-hline" />
                        <div className="skel-graph-average-sect">
                            <div className="skel-average">
                                <span className="skel-average-circle">
                                    <img
                                        src={AverageArrow}
                                        alt=""
                                    />
                                </span>
                                <div className="skel-average-data">
                                    <span className="skel-avg-title">
                                        Average Purchasing Frequency of Customers
                                    </span>
                                    <span>
                                        per month&nbsp;
                                        {averageCustomers >= 0 ?
                                            <span className="skel-arrow-up">
                                                <strong>{averageCustomers}%&nbsp;</strong>
                                                <i className="fa fa-arrow-up" aria-hidden="true" />
                                            </span> :
                                            <span className="skel-arrow-down">
                                                <strong>{averageCustomers}%&nbsp;</strong>
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
                            listKey={"purchasing-frequency"}
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
        </div>
    )
}

export default PurchasingFrequencyOfCustomers;