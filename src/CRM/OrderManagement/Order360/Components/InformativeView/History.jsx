import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../properties'
import { get, post } from '../../../../../common/util/restUtil'
import { RegularModalCustomStyles } from '../../../../../common/util/util'
import { HelpdeskColumns, InteractionHistoryColumns } from '../../../../../HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/ViewHelpdeskTicket/Columns';
import Modal from 'react-modal';
import DynamicTable from '../../../../../common/table/DynamicTable';
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Order360Context } from '../../../../../AppContext';

export default function History(props) {
    const { page = '', consumerNo, InteractionCount, HelpdeskCount } = props?.data
    const { setInteractionCount, setHelpdeskCount } = props?.handler;
    let { data } = useContext(Order360Context), { customerDetails = {} } = data;
    const consumerId = customerDetails?.customerId;
    const history = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [tablelist, SetTableList] = useState([])
    const [status, setStatus] = useState('')
    const [totalCount, setTotalCount] = useState(0);
    // get Interaction summary Count
    const getInteractionSummaryData = useCallback((id) => {
        if (consumerNo) {
            get(`${properties.INTERACTION_API}/get-customer-history-count/${consumerNo}`)
                .then((response) => {
                    if (response?.data) {
                        setInteractionCount({ ...response?.data })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }, [consumerNo, setInteractionCount])
    // get Helpdesk summary Count
    const getHelpdeskData = useCallback(() => {

        if (consumerNo) {
            const requestBody = {
                "searchParams": { "profileNo": consumerNo, "mode": "COUNT" }
            };
            post(`${properties.HELPDESK_API}/profile-wise/helpdesk-summary`, requestBody)
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200) {
                        setHelpdeskCount({ ...data })
                    }

                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }, [consumerNo, setHelpdeskCount])
    useEffect(() => {
        getInteractionSummaryData()
        getHelpdeskData()
    }, [getHelpdeskData, getInteractionSummaryData]);

    const FetchHelpdeskList = async () => {
        try {
            const requestBody = {
                "searchParams": {
                    "profileNo": consumerNo, "mode": "LIST", "status": status, 'limit': perPage, "page": currentPage
                }
            };
            post(`${properties.HELPDESK_API}/profile-wise/helpdesk-summary`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetTableList(data?.rows || [])
                            setTotalCount(data?.count || [])
                            setIsOpen(true)
                        })
                    }
                }).catch((error) => {
                    console.error(error);
                }).finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    const FetchInteractionList = async () => {
        try {
            const requestBody = {
                "searchParams": { "cust_id": Number(consumerId), "mode": "LIST", "status": status, 'limit': perPage, page: currentPage }
            };
            post(`${properties.INTERACTION_API}/customer-wise/interaction-summary`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetTableList(data.rows || [])
                            setTotalCount(data?.count ?? 0)
                            setIsOpen(true)
                        })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (status) {
            if (page === 'Interaction') FetchInteractionList(); else FetchHelpdeskList();
        }
    }, [status, perPage, currentPage])
    const HelpdeskToggle = (count, type) => {
        if (!count) {
            toast.warn('No records found')
            return
        }
        console.log(count, type)

        unstable_batchedUpdates(() => {
            SetTableList([]); setTotalCount(0); setCurrentPage(0); setPerPage(10); setStatus(type);
        })
    }
    const handleCellLinkClick = (event, rowData) => {
        if (page === 'Interaction') {
            const data = { ...rowData, sourceName: 'order360' }
            if (rowData.customerUuid) {
                localStorage.setItem("customerUuid", rowData.customerUuid)
                localStorage.setItem("customerIds", rowData.customerId)
            }
            history(`/interaction360`, { state: { data } })
        } else {
            history(`/view-helpdesk`, { state: { data: rowData } })
        }
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.Header === "Interaction No") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const onClose = () => {
        unstable_batchedUpdates(() => {
            SetTableList([])
            setTotalCount(0)
            setIsOpen(!isOpen)
            setCurrentPage(0)
            setPerPage(10)
            setStatus('')
        })
    }
    let total = page === 'Interaction' ? InteractionCount?.totalInteractionCount ?? 0 : page === 'Helpdesk' ? HelpdeskCount?.total ?? 0 : 0;
    let open = page === 'Interaction' ? InteractionCount?.openInteraction ?? 0 : page === 'Helpdesk' ? HelpdeskCount?.open ?? 0 : 0
    let closed = page === 'Interaction' ? InteractionCount?.closedInteraction ?? 0 : page === 'Helpdesk' ? HelpdeskCount?.closed ?? 0 : 0;
    return (
        <>
            <div className="col-md px-lg-1 skel-inter-view-history mb-2">
                <span className="skel-header-title mt-1 text-16">
                    {page} History
                </span>
                <div className="skel-tot-inter skel-tot-inter-new w-auto">
                    <div className="skel-tot text-dark cursor-pointer">
                        Total
                        <span onClick={() => HelpdeskToggle(total, 'ALL')}>{total}</span>
                    </div>
                    <div className="skel-tot text-dark cursor-pointer">
                        Open
                        <span onClick={() => HelpdeskToggle(total, page === 'Interaction' ? 'NEW' : 'Open')}>{open}</span>
                    </div>
                    <div className="skel-tot text-dark cursor-pointer">
                        Closed
                        <span onClick={() => HelpdeskToggle(total, page === 'Interaction' ? 'CLOSED' : 'Closed')}>{closed}</span>
                    </div>
                </div>
            </div>
            <Modal
                isOpen={isOpen}
                contentLabel="HelpdeskList"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title">{page} List</h4>
                    <button type="button" className="close" onClick={() => onClose()}>×</button>
                </div>
                {page === 'Interaction' ? <DynamicTable
                    listKey={"Interaction List"}
                    row={tablelist}
                    rowCount={totalCount}
                    header={InteractionHistoryColumns}
                    fixedHeader={true}
                    columnFilter={false}
                    customClassName={'table-sticky-header'}
                    itemsPerPage={perPage}
                    isScroll={false}
                    backendPaging={true}
                    isTableFirstRender={tableRef}
                    backendCurrentPage={currentPage}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters
                    }}
                /> : <DynamicTable
                    listKey={"HelpdeskList"}
                    row={tablelist}
                    rowCount={totalCount}
                    header={HelpdeskColumns}
                    fixedHeader={true}
                    columnFilter={false}
                    customClassName={'table-sticky-header'}
                    itemsPerPage={perPage}
                    isScroll={false}
                    backendPaging={true}
                    isTableFirstRender={tableRef}
                    backendCurrentPage={currentPage}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters
                    }}
                />}


            </Modal>
        </>
    )
}
