import React, { useState, useEffect, useContext } from 'react';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import moment from 'moment';
import LastRefreshTime from './LastRefreshTime';
import { useHistory }from '../../common/util/history';
import { AppContext } from '../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';

const BlankExpectedDateCompletionInteraction = (props) => {
    const history = useHistory()
    const { appConfig } = useContext(AppContext);
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data;
    const [isRefresh, setIsRefresh] = useState(false);
    const [listData, setListData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [total, setTotal] = useState(0);
    const [users, setUser] = useState();
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
  

    useEffect(() => {
        if(apiCall){
            slowPost(properties.INTERACTION_API + "/agent-wise/BLANK_COUNT", { searchParams }).then((resp) => {
                if (resp?.status == 200) {
                    setListData(resp?.data?.rows ?? []);
                    const totalCount = resp?.data?.rows?.reduce((total, obj) => total + Number(obj?.oIntxnCount), 0);
                    setTotal(totalCount)
                    let dataObject = {}
                    dataObject['total'] = totalCount
                    dataObject['listData'] = resp?.data?.rows ?? []
                    props?.setExportData?.(`blankExpectedDateComplietionInteraction`, dataObject)
                }
            }).catch((error) => console.log(error));
        }
       
    }, [isRefresh, searchParams, isParentRefresh])

    useEffect(() => {
        let { total, listData, } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (total) setTotal(total);
            if (listData) setListData(listData);
        })
    }, [exportData])

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
        else if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{cell.value ? moment(cell.value).format("DD-MM-YYYY hh:mm:ss") : '-'}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    const countClicked = (agent) => {
        setUser(agent);
        setLoading(true);
        slowPost(properties.INTERACTION_API + `/agent-wise/list`, { searchParams: { ...searchParams, userId: agent ?? null } }).then((resp) => {
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

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="row h-100">
                    <div className="col-12 px-2">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Blank Expected Date of Completion ({total})</span>
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
                                        {listData?.length > 0 ? (
                                            listData.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <h5 className="font-size-14 mb-0 skel-font-sm-bold"> {item.oCurrUserDesc ?? 'Others'} </h5>
                                                    </td>
                                                    <td>
                                                        <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked(item.oCurrUser)}> {item.oIntxnCount} </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={2}>
                                                    <h5 className="font-size-14 mb-0 skel-font-sm-bold"> No interactions found</h5>
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
                            <LastRefreshTime data={{ isRefresh, componentName: 'AgentWise' }} />
                        </div>
                    </div>
                </div>
        
                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen.view} onHide={() => setIsOpen({ ...isOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by {listData?.find(x => x.oCurrUser == users)?.oCurrUserDesc ?? "Others"}</h5></Modal.Title>
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

export default BlankExpectedDateCompletionInteraction;
const columns = [
    {
        Header: "Interaction No",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo"
    },
    {
        Header: "Current User",
        accessor: "oCurrUserDesc",
        id: 'oCurrUser',
        disableFilters: true,
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
]