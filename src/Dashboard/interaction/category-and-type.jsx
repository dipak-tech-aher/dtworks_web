import React, { useState, useEffect, useRef, useContext } from 'react';
import * as echarts from 'echarts';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import LastRefreshTime from './LastRefreshTime';
import Filter from './filter';
import { InteractionDashboardContext } from "../../AppContext";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { useHistory }from '../../common/util/history';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { unstable_batchedUpdates } from 'react-dom';

const CategoryType = (props) => {
    const history = useHistory()
    const { height, mode, level, searchParams, isParentRefresh, color, apiCall = false, exportData } = props?.data;
    // mode => interaction, service
    // level => category, type
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
            accessor: "oStatusDesc",
            disableFilters: true,
        },
        {
            Header: "Channel",
            accessor: "oChannel",
            disableFilters: true,
        },
        {
            Header: "Current User",
            accessor: "oCurrUser",
            id: "oCurrUser",
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

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1);
    }

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
        const fetchData = async () => {
            try {
                setLoading(true);
                slowPost(properties.INTERACTION_API + `/${mode}/${level}/cnt`, { searchParams }).then((resp) => {
                    if (resp?.status == 200) {
                        // console.log(mode, level, resp?.data?.rows);
                        setChartData(resp?.data?.rows ?? []);
                        const totalCount = resp?.data?.rows?.reduce((total, obj) => total + Number(obj?.oIntxnCnt), 0);
                        setTotal(totalCount)
                        let dataObject={}
                        dataObject['data'] = resp?.data?.rows ?? []
                        dataObject['totalCount'] = totalCount
                        props?.setExportData?.( `${mode}-${level}`, dataObject)
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
        let { data, totalCount } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (data) setChartData(data);
            if (totalCount) setTotal(totalCount);
        })
    }, [exportData])
    const interactionClicked = (data) => {
        console.log(data)
        let modee = data?.oCategory?.split("_")?.[0]?.toLowerCase();
        let levell = data?.oCategory?.split("_")?.[1]?.toLowerCase();
        // intxnType, intxnCat, serviceType, serviceCat
        const codes = {
            INTERACTION_CATEGORY: "intxnCat",
            INTERACTION_TYPE: "intxnType",
            SERVICE_CATEGORY: "serviceCat",
            SERVICE_TYPE: "serviceType",
        }
        let searchParamss = {
            ...searchParams,
            [codes[data?.oCategory]]: [{ value: data?.oCategoryCode }]
        }
        setLoading(true)
        slowPost(properties.INTERACTION_API + `/${modee}/${levell}/list`, { searchParams: searchParamss }).then((resp) => {
            if (resp?.status == 200) {
                let records = resp?.data?.rows?.filter(x => x[`o${capitalizeFirstLetter(modee)}${capitalizeFirstLetter(levell)}`] == data?.oCategoryValue);
                // console.log(records.length);
                records.sort((a, b) => {
                    return new Date(b.oCreatedAt) - new Date(a.oCreatedAt);
                });
                setTableData(records ?? []);
                setIsOpen({ ...isOpen, view: true });
            }
        }).catch((error) => console.log(error)).finally(() => {
            setIsRefresh(!isRefresh)
            setLoading(false)
        });
    }

    useEffect(() => {
        if (!loading && chartRef.current) {
            const chartDom = chartRef.current;
            const myChart = echarts.init(chartDom, null, {
                renderer: 'canvas',
                useDirtyRect: false
            });

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
                    trigger: 'axis',
                },
                xAxis: {
                    type: 'category',
                    axisLabel: { 
                        interval: 0, 
                        formatter: function (d) {
                            return d?.replace(" ", "\n");
                        }
                    },
                    fontSize: 10,
                    left: "10%",
                    data: chartData.map(x => x.oCategoryValue)
                },
                // grid: {
                //     left: '3%',
                //     right: '4%',
                //     bottom: '3%',
                //     containLabel: true
                // },
                yAxis: {},
                series: {
                    type: 'bar',
                    encode: { x: 'name', y: 'score' },
                    datasetIndex: 1,
                },
                series: [
                    {
                        type: 'bar',
                        legendHoverLink: true,
                        label: {
                            show: true,
                            position: 'inside'
                        },
                        data: chartData.map(x => ({
                            value: Number(x.oIntxnCnt),
                            metaData: x,
                            itemStyle: { color }
                        }))
                    }
                ]
            };

            if (option && typeof option === 'object') {
                myChart.setOption(option);
            }

            myChart.on('click', (params) => {
                interactionClicked(params.data.metaData);
            });

            window.addEventListener('resize', myChart.resize);

            return () => {
                window.removeEventListener('resize', myChart.resize);
                myChart.dispose();
            };
        }
    }, [chartData]);

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
                history(`/interaction360`, { state: {data} })
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
        else if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <React.Fragment>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="row h-100">
                    <div className="col-12 px-2">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Top 5 {capitalizeFirstLetter(mode)} {capitalizeFirstLetter(level)} ({total})</span>
                            <div className="skel-dashboards-icons">
                                <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                                    <i className="material-icons">refresh</i>
                                </a>

                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-graph-sect">
                            <div ref={chartRef} style={{ height }}></div>
                        </div>
                    </div>
                    <div className="col-12 px-2 align-self-end">
                        <hr className="cmmn-hline" />
                        <div className="skel-refresh-info">
                            <LastRefreshTime data={{ isRefresh, componentName: 'CategoryType' }} />
                        </div>
                    </div>
                </div>
                </div>
                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen.view} onHide={() => setIsOpen({ ...isOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction Details</h5></Modal.Title>
                        <CloseButton onClick={() => setIsOpen({ ...isOpen, view: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={tableData ?? []}
                                itemsPerPage={10}
                                columnFilter={true}
                                header={columns}
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
            </React.Fragment>
        )}
        </>
    );
};

export default CategoryType;