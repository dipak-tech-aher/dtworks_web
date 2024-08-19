import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { StatusWiseColumns } from "../Columns";
import moment from 'moment'
import Chart from './Chart';


const HelpdeskSummary = (props) => {

    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [summaryCounts, setSummaryCounts] = useState([]);
    const [summaryCount, setSummaryCount] = useState([]);
    const [filteredSummaryData, setFilteredSummaryData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/summary', { ...searchParams, ...helpdeskSearchParams, type: 'COUNT' });
                console.log("response..........>", response);
                setSummaryCounts(response?.data?.filter((ele) => ele?.oType === 'status'));

                // const resultStatus = response?.data?.filter((ele) => ele?.oType === 'status').reduce((acc, obj) => {
                //     const existingObj = acc.find(item => item.oStatusCode === obj.oStatusCode);
                //     if (existingObj) {
                //         existingObj.oCnt += obj.oCnt;
                //     } else {
                //         acc.push({ oStatus: obj.oStatus, oCnt: obj.oCnt, oStatusCode: obj?.oStatusCode });
                //     }
                //     return acc;
                // }, []);
                // console.log('resultStatus--------->', resultStatus)
                // setSummaryCount(resultStatus);

                const result = response?.data?.filter((ele) => ele?.oType === 'Helpdesk Type').reduce((acc, obj) => {
                    const existingObj = acc.find(item => item.oHelpdeskType === obj.oHelpdeskType);
                    if (existingObj) {
                        existingObj.oCnt += obj.oCnt;
                    } else {
                        acc.push({ oHelpdeskType: obj.oHelpdeskType, oCnt: obj.oCnt, oHelpdeskTypeCode: obj?.oHelpdeskTypeCode });
                    }
                    return acc;
                }, []);

                // Calculate total count
                const totalCount = result.reduce((total, obj) => total + obj.oCnt, 0);
                setTotal(totalCount)
                // Add total key-value pair
                const resultWithTotal = result;

                setSummaryCount(resultWithTotal);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isRefresh, searchParams, isParentRefresh]);

    // const showDetails = (helpdeskType, type) => {
    //     setLoading(true)
    //     if (type === "helpdeskType") {
    //         let payload = { ...searchParams, ...helpdeskSearchParams, helpdeskType: [{ label: helpdeskType, value: helpdeskType }], type: 'LIST' }
    //         if (helpdeskType === "Total") {
    //             delete payload.helpdeskType
    //         }
    //         slowPost(properties.HELPDESK_API + '/summary', payload)
    //             .then((response) => {
    //                 let responseData = response?.data
    //                 setFilteredSummaryData(responseData)
    //                 setShow(true)
    //             })
    //             .catch(error => {
    //                 console.error(error);
    //             }).finally(() => setLoading(false));
    //     } else {
    //         slowPost(properties.HELPDESK_API + '/summary', { ...searchParams, ...helpdeskSearchParams, severity: [{ value: helpdeskType?.severityCode }], status: [{ value: helpdeskType?.status }], type: 'LIST' })
    //             .then((response) => {
    //                 let responseData = response?.data
    //                 console.log("responseData...............>",responseData);
    //                 setFilteredSummaryData(responseData)
    //                 setShow(true)
    //             })
    //             .catch(error => {
    //                 console.error(error);
    //             }).finally(() => setLoading(false));
    //     }
    // }

    const showDetails = (helpdeskType, type) => {
        console.log("helpdeskType............>", helpdeskType);
        console.log("type............>", type);
        setLoading(true);
        let payload = { ...searchParams, ...helpdeskSearchParams, type: 'LIST' };

        if (type === "helpdeskType") {
            if (helpdeskType && helpdeskType !== "Total") {
                payload.helpdeskType = [{ label: helpdeskType, value: helpdeskType }];
            } else {
                delete payload.helpdeskType;
            }
        }
        else {
            payload.severity = [{ value: helpdeskType.severityCode }];
            payload.status = [{ value: helpdeskType.status }];
        }

        slowPost(properties.HELPDESK_API + '/summary', payload)
            .then((response) => {
                console.log("res..............>", response);
                let responseData = response?.data;
                setFilteredSummaryData(responseData);
                setShow(true);
            })
            .catch(error => {
                console.error(error);
            })
            .finally(() => setLoading(false));
    };


    const handleClose = () => {
        setShow(false);
        setFilteredSummaryData([]);
    };

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "oHelpdeskNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <div className="col-md-6 mt-2"> {loading ? (
            <Loader />
        ) : (
            <>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Helpdesk summary by Helpdesk Type ({total}) </span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => {
                                        setIsRefresh(!isRefresh);
                                    }}>refresh</i>
                                </span>
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                    </div>
                    <div className="card-body py-0">
                        <div className="row">
                            {summaryCount?.map((ele) => <div className="col-3" key={ele?.oHelpdeskType}>
                                <div className="text-center">
                                    <p className="mb-2 text-truncate" title={ele?.oHelpdeskType ? ele?.oHelpdeskType : 'In Queue'}> {ele?.oHelpdeskType ? ele?.oHelpdeskType : 'In Queue'} </p>
                                    <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => showDetails(ele?.oHelpdeskTypeCode, 'helpdeskType')}> {ele?.oCnt} </p>
                                </div>
                            </div>)}
                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-new mt-4">
                                    <div id="chartzz">
                                        <Chart data={{ chartData: summaryCounts }} handlers={{ showDetails }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                    <Modal.Header>
                        <b>Summary Wise Helpdesk Details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredSummaryData}
                            rowCount={filteredSummaryData?.length}
                            header={StatusWiseColumns}
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
                                handleFilters: setFilters
                            }}
                        />
                    </Modal.Body>
                </Modal>
            </>
        )}
        </div>
    )
}

export default HelpdeskSummary;