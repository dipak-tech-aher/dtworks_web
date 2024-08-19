import React, { useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../../properties';
import { slowPost } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { RegularModalCustomStyles } from '../../../../../../common/util/util';
import DynamicTable from '../../../../../../common/table/DynamicTable';
import { ServiceColumns } from '../../Columns';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
export default function ServiceList(props) {
    // console.log('props?.data? ', props?.data)
    let customerUuid = props?.data?.profileUuid ? props?.data?.profileUuid : props?.data?.customerUuid;
    const [ServiceCount, setServiceCount] = useState(0);
    const [ServiceList, setServiceList] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    useEffect(() => {
        if (customerUuid) getServiceList();
    }, [perPage, currentPage, customerUuid])
    const orderSearchAPI = `${properties.ACCOUNT_DETAILS_API}/get-service-list`
    const getServiceList = () => {
        try {
            slowPost(orderSearchAPI, {
                customerUuid: customerUuid,
                limit: `${perPage}`,
                page: `${currentPage}`,
            })
                .then((response) => {
                    if (response?.data) {
                        unstable_batchedUpdates(() => {
                            setServiceCount(response?.data?.length);
                            setServiceList(response?.data);
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
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oOrderStatusDesc") {
            return (<span>{cell?.value?.description ?? '-'}</span>)
        }
        if (cell.column.id === "srvcCatDesc") {
            return (<span>{cell?.value?.description ?? '-'}</span>)
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const toggle = () => {
        if (!ServiceCount) {
            toast.warn('No records found')
            return
        }
        setIsOpen(true);
    }
    const OnClose = () => {
        unstable_batchedUpdates(() => {
            setIsOpen(!isOpen); setServiceList([]); setCurrentPage(0);setPerPage(10);
        })
    }
    return (
        <>
            <td>
                <a className="txt-underline" onClick={() => toggle()}>
                    {ServiceCount}
                </a>
            </td>
            <Modal
                isOpen={isOpen}
                contentLabel="Order List"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title">Service List</h4>
                    <button type="button" className="close" onClick={() => OnClose()}>×</button>
                </div>
                <DynamicTable
                    listKey={"Order List"}
                    row={ServiceList}
                    rowCount={ServiceCount}
                    header={ServiceColumns}
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
            </Modal >
        </>

    )
}
