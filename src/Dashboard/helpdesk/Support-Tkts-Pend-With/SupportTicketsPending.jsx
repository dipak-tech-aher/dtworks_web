import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { SupportTicketPendingProjectWiseColumns } from "../Columns";

import moment from 'moment'
import Chart from './Chart';

const SupportTicketsPending = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [agentWiseData, setProjectWiseData] = useState([]);
    const [pendingTktsCounts, setPendingTktsCounts] = useState([]);
    const [filteredPendingTktsData, setFilteredPendingTktsData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/support-tkt-pending', { ...searchParams, ...helpdeskSearchParams })

                setProjectWiseData(response?.data?.rows);
                const pendingTktsCounts = {};
                response?.data?.rows?.forEach(item => {
                    // pendingTktsCounts.code = item?.project
                    const description = item?.pendingWithDesc?.description ?? null;
                    const code = item?.pendingWithDesc?.code ?? null;
                    if (pendingTktsCounts[description]) {
                        pendingTktsCounts[description]++;
                    } else {
                        pendingTktsCounts[description] = 1;
                    }
                });
                setPendingTktsCounts(pendingTktsCounts)
                const totalCount = Object.values(pendingTktsCounts).reduce((total, count) => total + count, 0);
                setTotal(totalCount)
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    const getProjectCode = (desc) => {
        return agentWiseData?.find(x => x?.pendingWithDesc?.description?.toLowerCase() === desc?.toLowerCase())?.pendingWithDesc?.code;
    }

    const showDetails = (projectName) => {
        // console.log({ projectName });
        projectName = projectName ? projectName : null;
        projectName = getProjectCode(projectName)
        // console.log(agentWiseData)
        const filteredPendingTktsData = agentWiseData?.filter((item) => {
            if (item?.pendingWith == projectName) {
                return true
            }
        });
        setFilteredPendingTktsData(filteredPendingTktsData)
        setShow(true)
    }

    const handleClose = () => {
        setShow(false);
        setFilteredPendingTktsData([]);
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt" || cell.column.id === "statusChngDate") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "helpdeskNo") {
            return (
                <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
            )
        }
        else if (cell.column.id === "currUser") {
            return (
                <span>
                    {(cell?.value?.firstName ?? '') + ' ' + (cell?.value?.lastName ?? '')}
                </span>
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
                            <span className="skel-header-title"> Helpdesk by Pending with ({total})</span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                                </span>
                                {/* <span>
                                <i className="material-icons" > filter_alt </i>
                            </span> */}
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                    </div>
                    <div className="card-body py-0">
                        <div className="row">
                            {Object.entries(pendingTktsCounts).map(([description, count], index) => (
                                <div key={index} className="col-3">
                                    <div className="text-center">
                                        <p className="mb-2 text-truncate">{description == 'null' ? "In Queue" : description?.toUpperCase() === "DTWORKS" ? 'DTWORKS' : description?.toUpperCase()}</p>
                                        <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => showDetails(description)}> {count} </p>
                                    </div>
                                </div>
                            ))}
                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-newmt-4">
                                    <Chart data={{ chartData: pendingTktsCounts }} handlers={{ showDetails }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal" >
                    <Modal.Header>
                        <b>Support Ticket pending with helpdesk details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredPendingTktsData}
                            rowCount={filteredPendingTktsData?.length}
                            header={SupportTicketPendingProjectWiseColumns}
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

export default SupportTicketsPending;