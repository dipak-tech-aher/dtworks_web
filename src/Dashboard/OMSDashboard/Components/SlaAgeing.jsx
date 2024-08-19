import React, { useRef, useEffect, useContext, useState } from 'react';
import * as echarts from 'echarts';
import { unstable_batchedUpdates } from 'react-dom';
import { OMSDashboardContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { replace } from 'lodash';
import { post, slowPost } from '../../../common/util/restUtil';
import DynamicTable from "../../../common/table/DynamicTable";
import { TotalCustomersColumns } from './Coulmns';
import { Modal } from 'react-bootstrap';
import moment from 'moment';

const SlaAgeing = (props) => {
    const { data, Loader, handlers } = useContext(OMSDashboardContext);
    const { setExportData, handleOpenRightModal } = handlers;
    const chartRef = useRef(null);
    const { searchParams = {}, isPageRefresh } = data, { fromDate, toDate, category, type, status, department } = searchParams;
    const [isLoading, setIsLoading] = useState(false);
    const [chartData, setChartData] = useState();
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
            let slaData = {}
            let requestObj = { ...searchParams, filterType: 'AGEING', vCategory2: '5_to_7' }
            setIsLoading(true)
            const response = await post(`${properties.ORDER_API}/oms-dashboard/sla-ageing`, { searchParams: requestObj })
            if (response?.data?.length) {
                setChartData(response?.data ?? []);
                slaData['chartData'] = response?.data ?? []
            }

            setExportData?.('sla-agening', slaData);
        } catch (e) {
            console.log('error', e)
        } finally {
            loaderClose()
        }
    }

    const loaderClose = () => setIsLoading(false)

    useEffect(() => {
        if (fromDate && toDate) getChartData();
        if (apiCall) getChartData();
    }, [fromDate, toDate, isPageRefresh, category, type, status, department])

    useEffect(() => {
        let { chartData } = exportData?.["sla-agening"] ?? {}
        unstable_batchedUpdates(() => {
            setIsLoading(false)
            if (chartData) setChartData(chartData);
        })
    }, [exportData])

    useEffect(() => {
        const chartDom = chartRef.current;
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
            xAxis: {
                type: 'category',
                data: chartData?.map((val) => {
                    let agingText = val?.oAgeing ? replace(val?.oAgeing, new RegExp("_", "g"), " ") : "";
                    return `${agingText ? replace(agingText, new RegExp("m t ", "g"), ">") : ''} Days`
                }),
            },
            yAxis: {
                type: 'value'
            },
            series: [
                {
                    name: 'Ageing',
                    data: chartData?.map((val) => Number(val.oCount ?? 0)),
                    type: 'bar',
                    color: '#5470C6',
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
    }, [chartData]);

    const showDetails = (e, range) => {
        setIsLoading(true)
        let requestObj = { ...searchParams, filterType: 'DETAIL', vCategory2: range }
        slowPost(properties.ORDER_API + '/oms-dashboard/sla-ageing', { searchParams: requestObj })
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
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">SLA Ageing</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="row">
                    {/* <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                0 to 3 days
                            </span>
                            <h4
                                className="font-bold cursor-pointer"
                                data-target="#detailsmodal"
                                data-toggle="modal"
                            >
                                {o0To3days}
                            </h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                3 to 5 days
                            </span>
                            <h4
                                className="font-bold cursor-pointer"
                                data-target="#detailsmodal"
                                data-toggle="modal"
                            >
                                {o3To5days}
                            </h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                5 to 7 days
                            </span>
                            <h4
                                className="font-bold cursor-pointer"
                                data-target="#detailsmodal"
                                data-toggle="modal"
                            >
                                {o5To7days}
                            </h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                7 to 10 days
                            </span>
                            <h4 className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">
                                {o7To10days}
                            </h4>
                        </div>
                    </div>
                    <div className="col">
                        <div className="text-center">
                            <span className="text-center text-truncate d-block mb-0 mt-2">
                                &gt; 10 days
                            </span>
                            <h4 className="font-bold cursor-pointer" data-target="#detailsmodal" data-toggle="modal">
                                {oMoreThan10}
                            </h4>
                        </div>
                    </div>*/}
                </div>
                {chartData && chartData.length > 0 && chartData.map((aging) => {
                    let agingText = aging?.oAgeing ? replace(aging?.oAgeing, new RegExp("_", "g"), " ") : "";
                    return (
                        <div className="col">
                            <div className="text-center">
                                <span className="text-center text-truncate d-block mb-0 mt-2" >
                                    {/* 0 to 3 Days */}
                                    {agingText ? replace(agingText, new RegExp("m t ", "g"), ">") : ''} Days
                                </span>
                                <h4
                                    className="font-bold cursor-pointer m-0"
                                    data-target="#detailsmodal"
                                    data-toggle="modal"
                                    onClick={(e) => showDetails(e, aging?.oAgeing)}
                                >
                                    {aging?.oCount}
                                </h4>
                            </div>
                        </div>
                    )
                })}
                {isLoading ? (
                    <Loader />
                ) : (
                    <div className="skel-graph-sect mt-2">
                        <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
                    </div>
                )}
            </div>
            <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <b>Total Count</b>
                    <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                        <span aria-hidden="true">×</span>
                    </button>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={"sla-ageing"}
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
    )
}

export default SlaAgeing;