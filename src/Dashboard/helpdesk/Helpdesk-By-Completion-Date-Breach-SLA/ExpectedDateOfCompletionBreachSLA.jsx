import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { slowPost } from "../../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../../common/table/DynamicTable";
import { AgeingWiseColumns } from "../Columns";
import moment from 'moment'
import Chart from './Chart';

const ExpectedDateOfCompletionBreachSLA = (props) => {
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [ageingWiseData, setAgeingWiseData] = useState([]);
    const [filteredAgeingData, setFilteredAgeingData] = useState([]);
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
                const response = await slowPost(properties.HELPDESK_API + '/open-helpdesk-by-aging', { ...searchParams, ...helpdeskSearchParams });
                setTotal(response?.data?.[0]?.oTotalHdSlaCnt ?? 0)
                setAgeingWiseData([
                    {
                        description: "Less Then 0",
                        value: "SLA_LESS_0DAYS",
                        count: response?.data?.[0]?.oHdSlaLessThan0DayCnt ?? 0
                    },
                    {
                        description: "0 to 2 Days",
                        value: "SLA_0to2DAYS",
                        count: response?.data?.[0]?.oHdSla2DayCnt ?? 0
                    },
                    {
                        description: "3 to 5 Days",
                        value: "SLA_3to5DAYS",
                        count: response?.data?.[0]?.oHdSla5DayCnt ?? 0
                    }
                ]);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, isParentRefresh, searchParams]);


    const showDetails = async (value) => {
        setLoading(true)
        const response = await slowPost(properties.HELPDESK_API + '/open-ageing-list', { ...searchParams, ...helpdeskSearchParams, type: value });
        setFilteredAgeingData(response.data)
        setShow(true)
        setLoading(false)
    }

    const handleClose = () => {
        setShow(false);
        setFilteredAgeingData([]);
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>
                {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
            </span>)
        }
        if (cell.column.id === "helpdeskNo") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleOpenRightModal(row.original)}>{cell.value}</span>)
            // <a href="javascript:void(null)" onClick={() => handleOpenRightModal(row.original)}>{cell?.value}</a>
        }
        if (cell.column.id === "currUserInfo") {
            return (<span>
                {cell?.value?.currUserInfo?.firstName + ' ' + cell?.value?.currUserInfo?.lastName}
            </span>)
        }
        else {
            return (<span>{cell.value ?? '-'}</span>)
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
                            <span className="skel-header-title"> Expected Date of Completion Breach SLA ({total})</span>
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
                            {ageingWiseData.map(({ description, value, count }) => (<div className="col-3" key={description}>
                                <div className="text-center">
                                    <p className="mb-2 text-truncate" title={description?.replace(/_/g, ' - ')}> {description?.replace(/_/g, ' - ')} </p>
                                    <p className={`${description === '> 10 Days' ? "text-danger" : "text-primary"} mb-0 cursor-pointer txt-underline`} onClick={() => showDetails(value)}> {count} </p>
                                </div>
                            </div>))}
                            <div className="col-12 text-center">
                                <div className="skel-graph-sect skel-graph-sect-new mt-2">
                                    <Chart data={{ chartData: ageingWiseData }} handlers={{ showDetails }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal dialogClassName="cust-lg-modal" show={show} backdrop="static" keyboard={false} onHide={handleClose}>
                    <Modal.Header>
                        <b>Open Helpdesk by Expected Date of Completion Breach SLA</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredAgeingData}
                            rowCount={filteredAgeingData?.length}
                            header={AgeingWiseColumns.filter((val)=>val.Header!=='Ageing')}
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

export default ExpectedDateOfCompletionBreachSLA;