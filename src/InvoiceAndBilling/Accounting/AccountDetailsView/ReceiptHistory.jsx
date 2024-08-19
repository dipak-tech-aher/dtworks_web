import React, { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import DynamicTable from '../../../common/table/DynamicTable';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import { post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { formFilterObject, USNumberFormat } from '../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import ReceiptReversal from '../Receipt/ReceiptReversal';
import { useHistory } from '../../../common/util/history'

const ReceiptHistory = (props) => {
    const history = useHistory()
    const accountData = props?.data?.data
    const refresh = props?.data?.refresh || false
    const pageRefresh = props?.handler?.pageRefresh
    const [receiptHistoryList, setReceiptHistoryList] = useState([])
    const [exportBtn, setExportBtn] = useState(true)
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const [listSearch, setListSearch] = useState([]);
    const [reverseIsOpen, setReversalIsOpen] = useState(false)
    const [receiptEditData, setReceiptEditData] = useState({})

    useEffect(() => {
        getReceiptHistoryData()
    }, [currentPage, perPage/*,refresh*/])

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setPerPage(10);
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }, [refresh])

    const getReceiptHistoryData = () => {
        showSpinner();
        const requestBody = {
            customerId: accountData,
            receiptStatus: ['RS_PARTIALLY_APPLIED', 'RS_UNAPPLIED', 'RS_APPLIED', 'RS_REVERSED', 'RS_CANCELLED'],
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);
        post(`${properties.RECEIPT_API}/dtl/search?limit=${perPage}&page=${currentPage}`, requestBody)
            .then((response) => {
                const { count, rows } = response.data;
                if (!!rows.length) {
                    unstable_batchedUpdates(() => {
                        setTotalCount(count)
                        setReceiptHistoryList(rows)
                    })
                }
                else {
                    if (filters.length) {
                        toast.error('No Records Found')
                    }
                }
            })
            .finally(hideSpinner)
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleReverseReceiptLineItem = (data) => {
        setReceiptEditData(data)
        setReversalIsOpen(true)
    }

    const handleReceiptEdit = (data) => {
        history(`/edit-receipt`, { state: { data: { mode: 'edit', editData: data } } })
    }
    
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Receipt Number") {
            return (<span className="text-secondary cursor-pointer" id="CUSTOMERID" onClick={(e) => handleReceiptEdit(row.original)}>{cell.value}</span>)
        }
        else if (["Receipt Amount", "Receipt Balance Amount", "Unidentified Amount"].includes(cell.column.Header)) {
            return (<span>{USNumberFormat(cell.value)}</span>)
        }
        else if (['Created By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdByName?.firstName || "") + " " + (row?.original?.createdByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (['Updated By'].includes(cell.column.Header)) {
            let name = (row?.original?.updatedByName?.firstName || "") + " " + (row?.original?.updatedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Receipt Created At"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        else if (['Reversal'].includes(cell.column.Header)) {
            return (
                <button type="button" className={`btn btn-labeled btn-primary btn-sm ${(!row?.original?.receiptDtlId || ['RS_REVERSED', 'RS_CANCELLED'].includes(row.original.status)) ? 'd-none' : ''}`} onClick={() => { handleReverseReceiptLineItem(row?.original) }}>Reverse</button>
            )
        }
        else if (['Reversed By'].includes(cell.column.Header)) {
            let name = (row?.original?.reversedByName?.firstName || "") + " " + (row?.original?.reversedByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Receipt Date"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else if (['Receipt Captured By'].includes(cell.column.Header)) {
            let name = (row?.original?.createdByName?.firstName || "") + " " + (row?.original?.createdByName?.lastName || "")
            return (<span>{name}</span>);
        }
        else if (["Reversal On"].includes(cell.column.Header)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>
            )
        }
        return (<span>{cell.value}</span>);
    }

    return (
        <>
            <div className="col-md-12 card-box m-0">
                {
                    !!receiptHistoryList.length ?
                        <div className="card p-2">
                            <DynamicTable
                                listSearch={listSearch}
                                listKey={"Receipt History"}
                                row={receiptHistoryList}
                                rowCount={totalCount}
                                header={ReceiptHistoryColumns}
                                itemsPerPage={perPage}
                                backendPaging={true}
                                backendCurrentPage={currentPage}
                                isTableFirstRender={isTableFirstRender}
                                exportBtn={exportBtn}
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handlePageSelect: handlePageSelect,
                                    handleItemPerPage: setPerPage,
                                    handleCurrentPage: setCurrentPage,
                                    handleFilters: setFilters,
                                    handleExportButton: setExportBtn
                                }}
                            />
                        </div>
                        :
                        <span className="msg-txt">No Receipt History Available</span>
                }
                {
                    reverseIsOpen &&
                    <ReceiptReversal
                        data={{
                            isOpen: reverseIsOpen,
                            receiptData: receiptEditData
                        }}
                        handler={{
                            setIsOpen: setReversalIsOpen,
                            softRefresh: pageRefresh
                        }}
                    />
                }
            </div>
        </>
    )
}

export default ReceiptHistory

const ReceiptHistoryColumns = [
    // {
    //     Header: "Receipt Number",
    //     accessor: "receiptId",
    //     disableFilters: true
    // },
    {
        Header: "Receipt Number",
        accessor: "receiptNumber",
        disableFilters: true
    },
    {
        Header: "Customer Name",
        accessor: "customer.firstName",
        disableFilters: true
    },
    {
        Header: "Receipt Amount",
        accessor: "amount",
        disableFilters: true
    },
    {
        Header: "Receipt Balance Amount",
        accessor: "balanceAmount",
        disableFilters: true
    },
    {
        Header: "Currency",
        accessor: "currencyDesc.description",
        disableFilters: true
    },
    {
        Header: "Payment Mode",
        accessor: "paymentModeDesc.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "statusDesc.description",
        id: "receiptStatus",
        disableFilters: true
    },
    {
        Header: "Receipt Captured By",
        accessor: "createdBy",
        disableFilters: true
    },
    {
        Header: "Receipt Date",
        accessor: "receiptCreatedAt",
        disableFilters: true
    },
    {
        Header: "Receipt Created At",
        accessor: "createdAt",
        disableFilters: true
    },

    {
        Header: "Reversal",
        accessor: "reversal",
        disableFilters: true
    },
    {
        Header: "Reversed By",
        accessor: "reversedBy",
        disableFilters: true
    },
    {
        Header: "Reversal On",
        accessor: "reversedAt",
        disableFilters: true
    },
    {
        Header: "Reversal Reason",
        accessor: "reversedReason",
        disableFilters: true
    }
]