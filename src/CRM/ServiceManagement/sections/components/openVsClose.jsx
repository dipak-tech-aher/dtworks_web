import React, { useContext, useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Service360Context } from '../../../../AppContext';
import { post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';
import { statusConstantCode } from '../../../../AppConstants';
import { Modal, Button, CloseButton } from 'react-bootstrap';
import { toast } from 'react-toastify';
import DynamicTable from '../../../../common/table/DynamicTable';
import { useHistory } from '../../../../common/util/history';
import moment from 'moment';

const OpenVsClose = (props) => {
    const history = useHistory();
    const chartRef = useRef(null);
    const { data } = useContext(Service360Context);
    const { subscriptionDetails } = data;
    const [seriesData, setSeriesData] = useState({});
    const [isOpen, setIsOpen] = useState();
    const [selectedItem, setSelectedItem] = useState({});
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);

    const helpdeskClosedStatuses = [statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL];
    const interactionClosedStatuses = [statusConstantCode.status.INTERACTION_CLOSED, statusConstantCode.status.INTERACTION_CANCEL];
    const orderClosedStatuses = [statusConstantCode.status.ORDER_CLOSED, statusConstantCode.status.ORDER_CANCEL];

    useEffect(() => {
        post(`${properties.HELPDESK_API}/search?limit=&page=`, { serviceUuid: subscriptionDetails?.serviceUuid }).then((response) => {
            if (response?.data?.rows?.length) {
                let openedCount = response.data.rows.filter(x => !helpdeskClosedStatuses.includes(x?.status?.code));
                let closedCount = response.data.rows.filter(x => helpdeskClosedStatuses.includes(x?.status?.code));
                seriesData['helpdesk'] = {
                    opened: openedCount,
                    closed: closedCount
                }
                setSeriesData({ ...seriesData });
            }
        }).catch(error => {
            console.error(error);
        });
        post(`${properties.INTERACTION_API}/search`, { page: null, limit: null, searchParams: { serviceUuid: subscriptionDetails?.serviceUuid } }).then((response) => {
            if (response?.data?.rows?.length) {
                let openedCount = response.data.rows.filter(x => !interactionClosedStatuses.includes(x?.intxnStatus?.code));
                let closedCount = response.data.rows.filter(x => interactionClosedStatuses.includes(x?.intxnStatus?.code));
                seriesData['interaction'] = {
                    opened: openedCount,
                    closed: closedCount
                }
                setSeriesData({ ...seriesData });
            }
        }).catch(error => {
            console.error(error);
        });
        post(`${properties.ORDER_API}/s360-search?limit=&page=`, { searchParams: { serviceUuid: subscriptionDetails?.serviceUuid } }).then((response) => {
            if (response?.data?.rows?.length) {
                let openedCount = response?.data?.rows?.filter(x => !orderClosedStatuses.includes(x?.orderStatus?.code));
                let closedCount = response?.data?.rows?.filter(x => orderClosedStatuses.includes(x?.orderStatus?.code));
                seriesData['order'] = {
                    opened: openedCount,
                    closed: closedCount
                }
                setSeriesData({ ...seriesData });
            }
        }).catch(error => {
            console.error(error);
        });
    }, [])

    const openPopUp = (entity, status) => {
        if (seriesData[entity]?.[status]?.length) {
            setSelectedItem({ entity, status });
            setIsOpen(true);
        } else {
            toast.error('No records available');
        }
    }

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1)?.toLowerCase();
    };

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom, null, {
            renderer: 'canvas',
            useDirtyRect: false
        });

        const hOpened = seriesData?.helpdesk?.opened?.length;
        const iOpened = seriesData?.interaction?.opened?.length;
        const oOpened = seriesData?.order?.opened?.length;
        const hClosed = seriesData?.helpdesk?.closed?.length;
        const iClosed = seriesData?.interaction?.closed?.length;
        const oClosed = seriesData?.order?.closed?.length;

        const option = {
            tooltip: {
                trigger: 'item',
                backgroundColor: 'white',
                borderColor: 'white',
                formatter: function (params) {
                    return `
                        <strong>Total ${params?.data?.name}: ${params?.data?.value}</strong><br/>
                        <span>Open: ${params?.data?.metaData?.opened ?? 0}</span><br/>
                        <span>Closed: ${params?.data?.metaData?.closed ?? 0}</span><br/>
                    `;
                }
            },
            legend: {
                top: '5%',
                left: 'center'
            },
            series: [
                {
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    label: {
                        show: false,
                        position: 'center'
                    },
                    labelLine: {
                        show: false
                    },
                    data: [
                        { value: oOpened + oClosed, name: 'Order', metaData: { opened: oOpened, closed: oClosed } },
                        { value: hOpened + hClosed, name: 'Helpdesk', metaData: { opened: hOpened, closed: hClosed } },
                        { value: iOpened + iClosed, name: 'Interaction', metaData: { opened: iOpened, closed: iClosed } }
                    ]
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
    }, [seriesData])

    const handleCellLinkClick = (event, rowData) => {
        history(`/view-${selectedItem.entity}`, {
            state: { data: rowData }
        })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "helpdeskNo") {
            // className="text-secondary cursor-pointer" title={row?.original?.helpdeskNo ?? ''}
            return (<span onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (['orderDate', 'createdAt'].includes(cell.column.id)) {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    return (
        <div className="col-md-6 mb-2 px-lg-1">
            <div className="cmmn-skeleton h-100">
                <div className="skel-dashboard-title-base">
                    <span className="skel-header-title">Open vs Close</span>
                </div>
                <hr className="cmmn-hline" />
                <div className="skel-graph-sect mt-2">
                    <div className="row">
                        <div className="col-md">
                            <div className="cust-table">
                                <table role="table" className="table table-responsive table-striped dt-responsive nowrap w-100" style={{ textAlign: "center", marginLeft: 0 }}>
                                    <thead>
                                        <tr>
                                            <th className="font-weight-bold"></th>
                                            <th className="font-weight-bold">Open</th>
                                            <th className="font-weight-bold">Closed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Order</td>
                                            <td><span onClick={() => openPopUp('order', 'opened')} className='txt-underline cursor-pointer'>{seriesData?.order?.opened?.length ?? 0}</span></td>
                                            <td><span onClick={() => openPopUp('order', 'closed')} className='txt-underline cursor-pointer'>{seriesData?.order?.closed?.length ?? 0}</span></td>
                                        </tr>
                                        <tr>
                                            <td>Helpdesk</td>
                                            <td><span onClick={() => openPopUp('helpdesk', 'opened')} className='txt-underline cursor-pointer'>{seriesData?.helpdesk?.opened?.length ?? 0}</span></td>
                                            <td><span onClick={() => openPopUp('helpdesk', 'closed')} className='txt-underline cursor-pointer'>{seriesData?.helpdesk?.closed?.length ?? 0}</span></td>
                                        </tr>
                                        <tr>
                                            <td>Interaction</td>
                                            <td><span onClick={() => openPopUp('interaction', 'opened')} className='txt-underline cursor-pointer'>{seriesData?.interaction?.opened?.length ?? 0}</span></td>
                                            <td><span onClick={() => openPopUp('interaction', 'closed')} className='txt-underline cursor-pointer'>{seriesData?.interaction?.closed?.length ?? 0}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="col-md-7">
                            <div ref={chartRef} style={{ width: '100%', height: '280px' }}></div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal show={isOpen} onHide={() => setIsOpen(false)} backdrop="static" size="lg" aria-labelledby="example-modal-sizes-title-lg" centered>
                <Modal.Header>
                    <Modal.Title>{capitalizeFirstLetter(selectedItem.entity)} {capitalizeFirstLetter(selectedItem.status)} Details</Modal.Title>
                    <CloseButton onClick={() => setIsOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <DynamicTable
                        listKey={capitalizeFirstLetter(selectedItem.entity) + capitalizeFirstLetter(selectedItem.status) + 'Details'}
                        row={seriesData?.[selectedItem.entity]?.[selectedItem.status]}
                        rowCount={seriesData?.[selectedItem.entity]?.[selectedItem.status]?.length}
                        header={columns[selectedItem.entity]}
                        fixedHeader={true}
                        // columnFilter={false}
                        itemsPerPage={perPage}
                        backendCurrentPage={currentPage}
                        // customClassName={'table-sticky-header'}
                        // isScroll={false}
                        handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setPerPage,
                            handleCurrentPage: setCurrentPage
                        }}
                    />
                </Modal.Body>
                <Modal.Footer className='skel-footer-modal-close'>
                    <Button variant="secondary" onClick={() => setIsOpen(false)} className="skel-btn-cancel">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

const columns = {
    helpdesk: [
        {
            Header: "Helpdesk ID",
            accessor: "helpdeskNo",
            disableFilters: true,
            id: "helpdeskNo"
        },
        {
            Header: "Customer ID",
            accessor: "profileNo",
            disableFilters: true,
            id: "customerID"
        },
        {
            Header: "Full Name",
            accessor: "userName",
            disableFilters: true,
            id: "userName"
        },

        {
            Header: "Source",
            accessor: "helpdeskSource.description",
            disableFilters: true,
            id: "helpdeskSource"
        },
        {
            Header: "Status",
            accessor: "status.description",
            disableFilters: true,
            id: "status"
        },
        {
            Header: "Contact Number",
            accessor: "phoneNo",
            disableFilters: true,
            id: "phoneNo"
        },
        {
            Header: "Email",
            accessor: "mailId",
            disableFilters: true,
            id: "mailId"
        },
        {
            Header: "Created Date",
            accessor: "createdAt",
            disableFilters: true,
            id: "createdAt"
        }
    ],
    interaction: [
        {
            Header: "Helpdesk ID",
            accessor: "helpdeskNo",
            disableFilters: true
        },
        {
            Header: "Interaction ID",
            accessor: "intxnNo",
            disableFilters: true
        },
        {
            Header: "Customer ID",
            accessor: "referenceValue",
            disableFilters: true
        },
        {
            Header: "Full Name",
            accessor: row => `${row.customerDetails?.firstName || ''} ${row.customerDetails?.lastName || ''}`,
            disableFilters: true
        },
        {
            Header: "Source",
            accessor: "source",
            disableFilters: true
        },
        {
            Header: "Status",
            accessor: "intxnStatus.description",
            disableFilters: true
        },
        {
            Header: "Contact Number",
            accessor: "intxnContact.mobileNo",
            disableFilters: true
        },
        {
            Header: "Email",
            accessor: "intxnContact.emailId",
            disableFilters: true
        },
        {
            Header: "Interaction Type",
            accessor: "intxnType.description",
            disableFilters: true
        },
        {
            Header: "Service Type",
            accessor: "serviceType.description",
            disableFilters: true
        },
        {
            Header: "Created Date",
            accessor: "createdAt",
            disableFilters: true
        },
        {
            Header: "Created By",
            accessor: row => `${row.createdBy?.firstName} ${row.createdBy?.lastName || ''}`,
            disableFilters: true
        },
        {
            Header: "Subscription ID",
            accessor: "serviceDetails.serviceNo",
            disableFilters: true
        }
    ],
    order: [
        {
            Header: "Order No",
            accessor: "orderNo",
            disableFilters: true,
        },
        {
            Header: "Customer ID",
            accessor: "customerContact.customerNo",
            disableFilters: true,
        },
        {
            Header: "Order Channel",
            accessor: "orderChannel.description",
            disableFilters: true,
        },
        {
            Header: "Priority",
            accessor: "orderPriority.description",
            disableFilters: true,
        },
        {
            Header: "Order Type",
            accessor: "orderType.description",
            disableFilters: true,
        },
        {
            Header: "Order Category",
            accessor: "orderCategory.description",
            disableFilters: true,
        },
        // {
        //     Header: "Created By",
        //     accessor: "orderSourceDesc.description",
        //     disableFilters: true,
        // },
        {
            Header: "Created Date",
            accessor: "orderDate",
            disableFilters: true,
        },
        {
            Header: "Status",
            accessor: "orderStatus.description",
            disableFilters: true,
        }
    ]
}

export default OpenVsClose;