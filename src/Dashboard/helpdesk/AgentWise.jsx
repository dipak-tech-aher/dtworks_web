import React, { useEffect, useState, useRef, useContext } from 'react';
import { properties } from "../../properties";
import { slowPost } from "../../common/util/restUtil";
import { Modal } from 'react-bootstrap';
import DynamicTable from "../../common/table/DynamicTable";
import { AgentWiseColumns } from "./Columns";
import moment from 'moment'
import { AppContext } from '../../AppContext';

const AgentWise = (props) => {
    const { appConfig } = useContext(AppContext);
    const { searchParams, helpdeskSearchParams, isParentRefresh, modalStyle } = props?.data;
    const { handleOpenRightModal } = props?.handlers;
    const [agentWiseData, setAgentWiseData] = useState([]);
    const [agentCounts, setAgentCounts] = useState([]);
    const [filteredAgentsData, setFilteredAgentsData] = useState([]);
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
                const searches = {
                    ...searchParams,
                    ...helpdeskSearchParams
                }
                if (!searchParams.fromDate || !searchParams.toDate) {
                    searches.fromDate = moment(searchParams.dateRange?.[0]).format("YYYY-MM-DD")
                    searches.toDate = moment(searchParams.dateRange?.[1]).format("YYYY-MM-DD")
                }
                setLoading(true);
                const response = await slowPost(properties.HELPDESK_API + '/agent-wise/count', { ...searches })
                const responseData = (response?.data ?? []).map(x => ({
                    ...x,
                    oUserId: x.oUserId || null,
                }));

                setAgentCounts(responseData);

                const totalCount = responseData.map(x => x.oCnt).reduce((total, count) => total + count, 0);
                setTotal(totalCount);

            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isRefresh, searchParams, isParentRefresh])

    const showDetails = async (value) => {

        const response = await slowPost(properties.HELPDESK_API + '/agent-wise/list', { ...searchParams, ...helpdeskSearchParams, userId: value });

        setFilteredAgentsData(response.data)
        setShow(true)


    }

    const handleClose = () => {
        setShow(false);
        setFilteredAgentsData([]);
    };


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (
                <span>
                    {cell.value ? moment(cell.value).format('YYYY-MM-DD') : '-'}
                </span>
            )
        }
        if (cell.column.id === "helpdeskNo") {
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
        <div className="col-md-4 mt-2"> {loading ? (
            <Loader />
        ) : (
            <>
                <div className="cmmn-skeleton cmmn-skeleton-new">
                    <div className="card-body">
                        <div className="skel-dashboard-title-base">
                            <span className="skel-header-title"> {appConfig?.clientFacingName?.agent ?? "Agent"} wise Helpdesk ({total})</span>
                            <div className="skel-dashboards-icons">
                                <span>
                                    <i className="material-icons" onClick={() => setIsRefresh(!isRefresh)}>refresh</i>
                                </span>
                                {/* <span>
                                <i className="material-icons"> filter_alt </i>
                            </span> */}
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div id="cardCollpase5cz" className='mh-min-310'>
                            <table className="table table-hover mb-0 table-centered table-nowrap">
                                <tbody>
                                    {agentCounts?.length ? agentCounts.map(({ oUserDesc, oUserId, oCnt }) => (
                                        <tr key={oUserDesc}>
                                            <td>
                                                <h5 className="font-size-14 mb-0 skel-font-sm-bold" > {oUserDesc} </h5>
                                            </td>
                                            <td>
                                                <p className="text-dark mb-0 cursor-pointer txt-underline" onClick={(e) => showDetails(oUserId)}> {oCnt ?? 0} </p>
                                            </td>
                                        </tr>
                                    )) : (
                                        <td colSpan={2} className='text-center'>No data available</td>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <Modal show={show} backdrop="static" keyboard={false} onHide={handleClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <b>{appConfig?.clientFacingName?.agent ?? "Agent"} wise Helpdesk</b>
                        <button type="button" className="close mr-2" keyboard={false} onClick={handleClose}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Assigned"}
                            row={filteredAgentsData}
                            rowCount={filteredAgentsData?.length}
                            header={AgentWiseColumns}
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

export default AgentWise;