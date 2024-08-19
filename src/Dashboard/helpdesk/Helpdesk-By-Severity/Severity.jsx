import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { StatusWiseColumns } from "../Columns";
import moment from 'moment'
import PieChart from './PieChart';

const Severity = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [severityCounts, setSeverityCounts] = useState([]);
    const [severityCount, setSeverityCount] = useState([]);
    const [filteredSeverityData, setFilteredSeverityData] = useState([]);
    const [isRefresh, setIsRefresh] = useState(false);
    const [show, setShow] = useState(false);
    const tableRef = useRef(true);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [filters, setFilters] = useState([]);
    const [severityCodes, setSeverityCodes] = useState([]);
    const Loader = props.loader
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/helpdesk-by-severity', { ...searchParams, ...helpdeskSearchParams, type: 'COUNT' });
                
                setSeverityCounts(response?.data)
                setSeverityCodes(response?.data?.map((ele) => ele?.oStatus))
                const result = response?.data.reduce((acc, obj) => {
                    const existingObj = acc.find(item => item.oStatus === obj.oStatus);
                    if (existingObj) {
                        existingObj.oCnt += obj.oCnt;
                    } else {
                        acc.push({ oStatus: obj.oStatus, oCnt: obj.oCnt, oSeverityCode: obj?.oSeverityCode });
                    }
                    return acc;
                }, []);
                setSeverityCount(result);
                const totalCount = result?.reduce((total, obj) => total + obj?.oCnt, 0);
                setTotal(totalCount)

            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    const showDetails = (severity) => {
        setLoading(true)
        slowPost(properties.HELPDESK_API + '/helpdesk-by-severity', { ...searchParams, ...helpdeskSearchParams, i_severity_str: severity, type: 'LIST' })
            .then((response) => {
                setFilteredSeverityData(response?.data);
                setShow(true)
            })
            .catch(error => {
                console.error(error);
            }).finally(() => setLoading(false));
    }

    const handleClose = () => {
        setShow(false);
        setFilteredSeverityData([]);
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
                            <span className="skel-header-title"> Helpdesk by Severity ({total})</span>
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
                            {severityCount?.map((ele) => <div className="col-2" key={ele?.oStatus}>
                                <div className="text-center">
                                    <p className="mb-2 text-truncate" title={ele?.oStatus}> {ele?.oStatus} </p>
                                    <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={() => showDetails(ele?.oSeverityCode)}> {ele?.oCnt} </p>
                                </div>
                            </div>)}

                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-new mt-2">
                                    <PieChart data={{ severityCounts }} handlers={{ showDetails }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>Severity Wise Helpdesk Details</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredSeverityData}
                            rowCount={filteredSeverityData?.length}
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

export default Severity;