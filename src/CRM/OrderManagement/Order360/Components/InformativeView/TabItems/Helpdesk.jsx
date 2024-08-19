import React, { useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../../properties';
import { post } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import DynamicTable from '../../../../../../common/table/DynamicTable';
import { HelpdeskColumns } from '../../../../../../HelpdeskAndInteraction/Helpdesk/HelpdeskSearch/ViewHelpdeskTicket/Columns';
import moment from 'moment';
export default function Helpdesk() {
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [tablelist, SetTableList] = useState([])
    const [status, setStatus] = useState('')
    const [totalCount, setTotalCount] = useState(0);
    useEffect(() => {
        FetchHelpdeskList();
    }, [perPage, currentPage])
    const FetchHelpdeskList = async () => {
        try {
            const requestBody = {
                "searchParams": {
                    "profileNo": 'CUST00000267', "mode": "LIST", "status": 'ALL', 'limit': perPage, "page": currentPage
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
    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, { state: { data: rowData } })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    return (
        <>
            <DynamicTable
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
            />
        </>
    )
}
