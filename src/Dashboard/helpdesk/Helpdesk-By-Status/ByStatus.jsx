import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { StatusWiseColumns } from "../Columns";
import moment from 'moment'

import PieChart from './PieChart';

const ByStatus = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [statusCounts, setStatusCounts] = useState([]);
    const [filteredStatusData, setFilteredStatusData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const [chartData, setChartData] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/helpdesk-by-status', { ...searchParams, ...helpdeskSearchParams, type: 'COUNT' })

                setStatusCounts(response?.data);
                const chartData = response?.data?.map((ele) => {
                    return {
                        value: ele?.oCnt,
                        name: ele?.oStatus,
                        statusCode: ele?.oStatusCode,
                    }
                });
                setChartData(chartData)
                const totalCount = chartData.reduce((total, obj) => total + obj.value, 0);
                setTotal(totalCount)
                // console.log('chartData------------>', chartData)
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    const showDetails = (status) => {
        setLoading(true)
        slowPost(properties.HELPDESK_API + '/helpdesk-by-status', { ...searchParams, ...helpdeskSearchParams, status, type: 'LIST' })
            .then((response) => {
                setFilteredStatusData(response?.data);
                setShow(true)
            })
            .catch(error => {
                console.error(error);
            }).finally(() => setLoading(false));
    }

    const handleClose = () => {
        setShow(false);
        setFilteredStatusData([]);
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
        if (cell.column.id === "currUserInfo") {
            return (<span>
                {cell?.value?.currUserInfo?.firstName + ' ' + cell?.value?.currUserInfo?.lastName}
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
        <div className="col-md-6 mt-2"> {loading ? (
            <Loader />
        ) : (
            <>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> Helpdesk by Status ({total}) </span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                                </span>
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                    </div>
                    <div className="card-body py-0">
                        <div className="row">
                            {statusCounts.map((ele) => (<div className="col-3" key={ele?.oStatus}>
                                <div className="text-center" key={ele.oStatus}>
                                    <p className="mb-2 text-truncate" title={ele?.oStatus}>{ele?.oStatus}</p>
                                    <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => showDetails(ele?.oStatusCode)}> {ele?.oCnt} </p>
                                </div>
                            </div>))}

                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-new mt-2">
                                    <PieChart data={{ chartData }} handlers={{ showDetails }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Status Wise Helpdesk Details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredStatusData}
                            rowCount={filteredStatusData?.length}
                            columnFilter={true}
                            header={StatusWiseColumns}
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

export default ByStatus;