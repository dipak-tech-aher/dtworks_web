import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import LastRefreshTime from './LastRefreshTime';
import { useHistory } from '../../common/util/history';
import { unstable_batchedUpdates } from 'react-dom';

const Priority = (props) => {
    const history = useHistory()
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data
    const [chartData, setChartData] = useState([]);
    const chartRef = useRef(null);
    const [isRefresh, setIsRefresh] = useState(false);
    const [tableData, setTableData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [columns, setColums] = useState([
        {
            Header: "Interaction No",
            accessor: "oIntxnNo",
            disableFilters: true,
            id: "oIntxnNo"
        },
        // {
        //     Header: "Customer Name",
        //     accessor: "oCustomerName",
        //     disableFilters: true,
        // },
        {
            Header: "Interaction Category",
            accessor: "oInteractionCategory",
            disableFilters: true,
        },
        {
            Header: "Interaction Type",
            accessor: "oInteractionType",
            disableFilters: true,
        },
        {
            Header: "Service Category",
            accessor: "oServiceCategory",
            disableFilters: true,
        },
        {
            Header: "Service Type",
            accessor: "oServiceType",
            disableFilters: true,
        },
        {
            Header: "Priority",
            accessor: "oPriority",
            disableFilters: true,
        },
        {
            Header: "Project",
            accessor: "oProject",
            disableFilters: true,
        },
        {
            Header: "Status",
            accessor: "oStatus",
            disableFilters: true,
        },
        {
            Header: "Channel",
            accessor: "oChannel",
            disableFilters: true,
        },
        {
            Header: "Current User",
            accessor: "oCurrUserDesc",
            id: "oCurrUserDesc",
            disableFilters: true,
        },
        {
            Header: "Created User",
            accessor: "oCreatedUser",
            disableFilters: true,
        },
        {
            Header: "Created At",
            accessor: "oCreatedAt",
            disableFilters: true,
            id: "oCreatedAt"
        }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                delete searchParams.category
                setLoading(true);
                slowPost(properties.INTERACTION_API + "/by-priority", { searchParams }).then((resp) => {
                    if (resp?.status == 200) {
                        setChartData(resp?.data?.rows ?? []);
                        const totalCount = resp?.data?.rows?.reduce((total, obj) => total + obj?.oIntxnCount, 0);
                        setTotal(totalCount)
                        let priorityWise = {}
                        priorityWise['data'] = resp?.data?.rows ?? []
                        priorityWise['totalCount'] = totalCount
                        props?.setExportData?.('priorityWise', priorityWise)
                    }
                }).catch((error) => console.log(error));
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        if (apiCall) fetchData(); setLoading(false);
    }, [isRefresh, isParentRefresh, searchParams])
    useEffect(() => {
        let { data, totalCount } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (data) setChartData(data);
            if (totalCount) setTotal(totalCount);
        })
    }, [exportData])
    const stringToColour = (str) => {
        let hash = 0;
        str.split('').forEach(char => {
            hash = char.charCodeAt(0) + ((hash << 5) - hash)
        })
        let colour = '#'
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff
            colour += value.toString(16).padStart(2, '0')
        }
        return colour
    }

    useEffect(() => {
        if (!loading && chartRef.current) {
            const chartDom = chartRef.current;
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

            const xAxisLabels = chartData.map(x => x.oPriorityDesc);
            const xAxisData = chartData.map(x => ({ value: x.oIntxnCount, priorityCode: x.oPriorityCode, itemStyle: { color: stringToColour(x.oPriorityDesc) } }));
            
            const option = {
                title: {
                    show: chartData.length === 0,
                    textStyle: {
                        color: "grey",
                        fontSize: 20
                    },
                    text: "No interactions found",
                    left: "center",
                    top: "center"
                },
                tooltip: {
                    trigger: 'axis'
                },
                xAxis: {
                    type: 'category',
                    data: xAxisLabels

                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        name: 'Count',
                        type: 'bar',
                        data: xAxisData,
                        label: {
                            show: true,
                            position: 'inside'
                        },
                    }
                ]
            };

            if (option && typeof option === 'object') {
                myChart.setOption(option);
            }

            myChart.on('click', (params) => {
                countClicked(params?.data?.priorityCode)
            })

            window.addEventListener('resize', myChart.resize);

            return () => {
                window.removeEventListener('resize', myChart.resize);
                myChart.dispose();
            };
        }
    }, [chartData]);


    const countClicked = (oPriorityCode) => {
        let searchPayload = { ...searchParams, category: 'LIST' }
        searchPayload.priority = [{ "label": "", "value": oPriorityCode }]
        setLoading(true)
        slowPost(properties.INTERACTION_API + "/by-priority", { searchParams: searchPayload }).then((resp) => {
            if (resp?.status == 200) {
                const records = resp?.data?.rows;
                records.sort((a, b) => {
                    return new Date(b.oCreatedAt) - new Date(a.oCreatedAt);
                });
                setTableData(records ?? []);
                setIsOpen({ ...isOpen, view: true });
            }
        }).catch((error) => console.log(error)).finally(() => {
            setIsRefresh(!isRefresh);
            setLoading(false)
        });
    }

    const fetchInteractionDetail = (intxnNo) => {
        setLoading(true)
        slowGet(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'customer360'
                }
                if (response.customerUuid) {
                    localStorage.setItem("customerUuid", response.customerUuid)
                    localStorage.setItem("customerIds", response.customerId)
                }
                history(`/interaction360`, { state: { data } })
            } else {
                //
            }
        }).catch(error => {
            console.log(error);
        }).finally(() => setLoading(false));
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oIntxnNo") {
            return (<span onClick={() => fetchInteractionDetail(cell.value)} style={{ cursor: 'pointer', color: 'rgb(80, 154, 222)' }}>{cell.value}</span>);
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>)
        }
        else if (cell.column.id === "oCurrUserDesc") {
            return (<span>{cell.value ?? "Others"}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title"> Interactions by Priority ({total}) </span>
                    <div className="skel-dashboards-icons">
                        <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                            <i className="material-icons">refresh</i>
                        </a>
                        {/* <a href="#">
                        <i className="material-icons">filter_alt</i>
                    </a> */}
                    </div>
                </div>
                <hr className="cmmn-hline" />
                <div className="row mt-3">
                    <div className="col-4">
                        <div className="text-center">
                            <p className="mb-2 text-truncate skel-sm-heading"> High </p>
                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('PRTYHGH')}>{chartData?.find(x => x.oPriorityCode == 'PRTYHGH')?.oIntxnCount ?? 0}</p>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="text-center">
                            <p className="mb-2 text-truncate skel-sm-heading"> Medium </p>
                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('PRTYMED')}>{chartData?.find(x => x.oPriorityCode == 'PRTYMED')?.oIntxnCount ?? 0}</p>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="text-center">
                            <p className="mb-2 text-truncate skel-sm-heading"> Low </p>
                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('PRTYLOW')}>{chartData?.find(x => x.oPriorityCode == 'PRTYLOW')?.oIntxnCount ?? 0}</p>
                        </div>
                    </div>
                </div>
                <div className="skel-graph-sect skel-graph-sect-new mt-2">
                    <div ref={chartRef} style={{ height: '290px' }}></div>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-refresh-info">
                    <LastRefreshTime data={{ isRefresh, componentName: 'Priority' }} />
                </div>
                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen.view} onHide={() => setIsOpen({ ...isOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by Priority</h5></Modal.Title>
                        <CloseButton onClick={() => setIsOpen({ ...isOpen, view: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={tableData ?? []}
                                itemsPerPage={10}
                                header={columns}
                                columnFilter={true}
                                handler={{
                                    handleCellRender: handleCellRender,
                                }}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer style={{ display: 'block' }}>
                        <div className="skel-btn-center-cmmn">
                            <button type="button" className="skel-btn-cancel" onClick={() => setIsOpen({ ...isOpen, view: false })}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </div>
        )}
        </>
    );
};

export default Priority;