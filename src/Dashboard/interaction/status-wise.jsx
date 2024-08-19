import React, { useState, useEffect, memo } from 'react';
import * as echarts from 'echarts';
import { slowPost, slowGet } from "../../common/util/restUtil";
import { properties } from '../../properties';
import LastRefreshTime from './LastRefreshTime';
import moment from 'moment';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import { useHistory } from '../../common/util/history';
import { unstable_batchedUpdates } from 'react-dom';

const StatusWise = memo((props) => {
    const history = useHistory()
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data
    const [statusData, setStatusData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [total, setTotal] = useState(0);
    const [statusDataList, setStatusDataList] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    const [columns, setColums] = useState([
        {
            Header: "Interaction No",
            accessor: "oIntxnNo",
            disableFilters: true,
            id: "oIntxnNo"
        },
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let statusWise = {}
                slowPost(properties.INTERACTION_API + "/by-status/count", { searchParams, listCountDatatype: 'count' }).then((resp) => {
                    if (resp?.status == 200) {
                        // console.log("resp?.data?.rows ===> ", resp?.data?.rows);
                        setStatusData(resp?.data?.rows ?? []);
                        const totalCount = resp?.data?.rows?.reduce((total, obj) => total + obj?.oIntxnCount, 0);
                        setTotal(totalCount);
                        statusWise['data'] = resp?.data?.rows ?? []
                        statusWise['totalCount'] = totalCount
                        props?.setExportData?.('statusWise', statusWise)
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
            if (data) setStatusData(data);
            if (totalCount) setTotal(totalCount);
        })
    }, [exportData])
    const countClicked = (status) => {
        const payloadSearchParams = { ...searchParams, status: [{ code: '', value: status }] }
        setLoading(true);
        slowPost(properties.INTERACTION_API + "/by-status/list", { searchParams: payloadSearchParams, listCountDatatype: 'list' }).then((resp) => {
            if (resp?.status == 200) {
                const data = resp?.data?.rows.sort((a, b) => {
                    // console.log('b.oIntxnId--->', b.oIntxnId, 'a.oIntxnId---', a.oIntxnId)
                    return b.oIntxnId - a.oIntxnId;
                });
                setStatusDataList(data ?? []);
                setModalOpen(true)
            }
        }).catch((error) => console.log(error)).finally(() => setLoading(false));
    }

    const fetchInteractionDetail = (intxnNo) => {
        setLoading(true);

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
        if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>);
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>)
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
                                <span className="skel-header-title"> Interaction by Status ({total})</span>
                                <div className="skel-dashboards-icons">
                                    <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                                        <i className="material-icons">refresh</i>
                                    </a>
                                </div>
                            </div>
                            <hr className="cmmn-hline mb-0" />
                            <div className="h-360 overflow-auto">
                                <div className="skel-graph-sect skel-graph-sect-new mt-3">
                                    <table className="table table-hover mb-0 table-centered table-nowrap">
                                        <tbody>
                                            {statusData?.length > 0 ? (
                                                statusData.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <h5 className="skel-font-sm-bold"> {item.oStatus ?? 'Others'} </h5>
                                                        </td>
                                                        <td>
                                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked(item.oStatusCode)}> {item.oIntxnCount} </p>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={2} className='text-center'>
                                                        <h5 className="font-size-14 mb-0 skel-font-sm-bold">No status wise interactions found</h5>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 px-2 align-self-end">
                            <hr className="cmmn-hline" />
                            <div className="skel-refresh-info">
                                <LastRefreshTime data={{ isRefresh, componentName: 'StatusWise' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={modalOpen} onHide={() => setModalOpen(!modalOpen)} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by Status</h5></Modal.Title>
                        <CloseButton onClick={() => setModalOpen(!modalOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="col-lg-12 col-md-12 col-xs-12">
                            <DynamicTable
                                row={statusDataList ?? []}
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
                            <button type="button" className="skel-btn-cancel" onClick={() => setModalOpen(!modalOpen)}>Close</button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </React.Fragment>
        )}
        </>
    );
});

export default StatusWise;