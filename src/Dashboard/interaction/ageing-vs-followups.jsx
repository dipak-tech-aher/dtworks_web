import React, { useState, useEffect, useRef, useContext, useCallback, memo } from 'react';
import { slowGet, slowPost } from "../../common/util/restUtil";
import { properties } from '../../properties';
import { CloseButton, Modal } from 'react-bootstrap';
import DynamicTable from '../../common/table/DynamicTable';
import moment from 'moment';
import LastRefreshTime from './LastRefreshTime';
import { useHistory } from '../../common/util/history';
import { AppContext } from '../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { ChartComponent } from './CharComponent'

const AgeingVsFollowups = memo((props) => {
    console.log('This is renders-----')
    let { appConfig } = useContext(AppContext);
    const history = useHistory()
    const { searchParams, isParentRefresh, apiCall = false, exportData } = props?.data
    const [ageingChartData, setAgeingChartData] = useState({});
    const [followupChartData, setFollowupChartData] = useState({});
    const [tableData, setTableData] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isRefresh, setIsRefresh] = useState(false);
    const [type, setType] = useState();

    const [filters, setFilters] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(true);
    const columns = [
        {
            Header: "Interaction No",
            accessor: "oIntxnNo",
            disableFilters: true,
            id: "oIntxnNo"
        },
        {
            Header: `${appConfig?.clientFacingName?.customer ?? 'Customer'} Name`,
            accessor: "oCustomerName",
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
    ]

    useEffect(() => {
        console.log('This is renders----11111----')
        const fetchData = async () => {
            try {
                setLoading(true);
                let ageingVSfollow = {}
                const Ageingresponse = await slowPost(properties.INTERACTION_API + "/by-ageing", { searchParams });
                if (Ageingresponse?.status == 200) {
                    const data = Ageingresponse?.data?.rows?.[0]
                    ageingVSfollow['ageingChartData'] = { ...data, key: 'ageing' } ?? {}
                    setAgeingChartData({ ...data, key: 'ageing' } ?? {})
                }
                // slowPost(properties.INTERACTION_API + "/by-ageing", { searchParams }).then((resp) => {
                //     if (resp?.status == 200) {
                //         const data = resp?.data?.rows?.[0]   
                //         ageingVSfollow['ageingChartData']=  {...data, key: 'ageing'}  ?? {}             
                //         setAgeingChartData({...data, key: 'ageing'} ?? {})
                //     }
                // }).catch((error) => console.log(error));
                const followresponse = await slowPost(properties.INTERACTION_API + "/by-followups", { searchParams });
                if (followresponse?.status == 200) {
                    const data = followresponse?.data?.rows?.[0]
                    ageingVSfollow['followupChartData'] = { ...data, key: 'followups' } ?? {}
                    setFollowupChartData({ ...data, key: 'followups' } ?? {})
                }
                // slowPost(properties.INTERACTION_API + "/by-followups", { searchParams }).then((resp) => {
                //     if (resp?.status == 200) {
                //         const data = resp?.data?.rows?.[0]  
                //         ageingVSfollow['followupChartData']=  {...data, key: 'followups'} ?? {}                
                //         setFollowupChartData({...data, key: 'followups'} ?? {})
                //     }
                // }).catch((error) => console.log(error));
                props?.setExportData?.('ageingVSfollow', ageingVSfollow)
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        if (apiCall) fetchData(); setLoading(false);
    }, [isRefresh, searchParams, isParentRefresh])

    useEffect(() => {
        let { followupChartData, ageingChartData } = exportData ?? {}
        unstable_batchedUpdates(() => {
            setLoading(false)
            if (ageingChartData) setAgeingChartData(ageingChartData);
            if (followupChartData) setFollowupChartData(followupChartData);
        })
    }, [exportData])

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
        else if (cell.column.id === "oCurrUser") {
            return (<span>{cell.value ?? "Others"}</span>)
        }
        return (<span>{cell.value}</span>)
    }

    const countClicked = useCallback((type, duration) => {
        setType(type);
        setLoading(true)
        slowPost(properties.INTERACTION_API + `/by-${type}`, { searchParams: { ...searchParams, category: duration } }).then((resp) => {
            if (resp?.status == 200) {
                const records = resp?.data?.rows;
                records.sort((a, b) => {
                    return new Date(b.oCreatedAt) - new Date(a.oCreatedAt);
                });
                setTableData(records ?? []);
                setIsOpen({ ...isOpen, view: true });
            }
        }).catch((error) => console.log(error))
            .finally(() => setLoading(false));
    }, [ageingChartData])

    return (
        <> {loading ? (
            <Loader />
        ) : (
            <div className="cmmn-skeleton cmmn-skeleton-new">
                <div className="row h-100">
                    <div className="col-12 px-2">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Interaction by Ageing vs Follow-up by Ageing </span>
                            <div className="skel-dashboards-icons">
                                <a href="javascript:void(null)" onClick={() => setIsRefresh(!isRefresh)}>
                                    <i className="material-icons" >refresh</i>
                                </a>
                                {/* <a href="#">
                                <i className="material-icons">filter_alt</i>
                            </a> */}
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-graph-sect skel-graph-sect-new mt-3 skel-graph-grid">
                            <div className="skel-two-grid">
                                <span className="text-center d-block mb-3">Interaction By Ageing ({ageingChartData?.oIntxnTotalCnt})</span>
                                <div className="row">
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> 0 to 3 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('ageing', '0_3DAYS')}> {ageingChartData?.oIntxn3DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> 3 to 5 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('ageing', '3_5DAYS')}> {ageingChartData?.oIntxn5DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> &gt; 5 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('ageing', 'MORE_5DAYS')}> {ageingChartData?.oIntxnMoreThan5DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                </div>

                                <ChartComponent chartData={ageingChartData} loading={loading} countClicked={countClicked} />

                            </div>
                            <div className="skel-two-grid">
                                <span className="text-center d-block mb-3"> Follow-up By Ageing ({followupChartData?.oIntxnTotalCnt})</span>
                                <div className="row">
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> 0 to 3 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('followups', '0_3DAYS')}> {followupChartData?.oIntxn3DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> 3 to 5 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('followups', '3_5DAYS')}> {followupChartData?.oIntxn5DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="text-center">
                                            <p className="mb-2 text-truncate skel-sm-heading"> &gt; 5 Days </p>
                                            <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => countClicked('followups', 'MORE_5DAYS')}> {followupChartData?.oIntxnMoreThan5DayCnt ?? 0} </p>
                                        </div>
                                    </div>
                                </div>

                                <ChartComponent chartData={followupChartData} loading={loading} countClicked={countClicked} />

                            </div>
                        </div>
                    </div>
                    <div className="col-12 px-2 align-self-end">
                        <hr className="cmmn-hline" />
                        <div className="skel-refresh-info">
                            <LastRefreshTime data={{ isRefresh, componentName: 'AgeingVsFollowups' }} />
                        </div>
                    </div>
                </div>
                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen.view} onHide={() => setIsOpen({ ...isOpen, view: false })} dialogClassName="wsc-cust-mdl-temp-prev">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction by {type}</h5></Modal.Title>
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
                                    handleFilters: setFilters,
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
});

export default AgeingVsFollowups;