import React, { useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../../properties';
import { slowPost } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { RegularModalCustomStyles } from '../../../../../../common/util/util';
import DynamicTable from '../../../../../../common/table/DynamicTable';
import { AssignedOrdersColumns } from '../../Columns';
import moment from 'moment';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
export default function OrderList(props) {
    let customerUuid = props?.data?.profileUuid ? props?.data?.profileUuid : props?.data?.customerUuid;
    const [orderCount, setorderCount] = useState(0);
    const [orderList, setOrderList] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    useEffect(() => {
        if (customerUuid) {
            getOrderList()
        }
    }, [perPage, currentPage, customerUuid])
    const orderSearchAPI = `${properties.ORDER_API}/search`
    const getOrderList = () => {
        try {
            slowPost(orderSearchAPI + `?limit=${perPage}&page=${currentPage}`, {
                "searchParams": {
                    "customerUuid": customerUuid
                }
            })
                .then((response) => {
                    if (response?.data) {
                        unstable_batchedUpdates(() => {
                            setorderCount(response?.data?.count);
                            setOrderList(response?.data?.row);
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
        if (cell.column.id === "oOrderNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                    </div>
                </>
            )
        }
        else if (cell.column.id === "oChildOrderNo-ID") {
            return (<span>{cell?.value?.[0]?.orderNo ?? '-'}</span>)
        }
        else if (cell.column.id === "oOrderStatusDesc") {

            return (<span>{cell?.value?.description ?? '-'}</span>)
        }
        else if (cell.column.id === "oOrderCategoryDesc") {

            return (<span>{cell?.value?.description ?? '-'}</span>)
        }
        else if (cell.column.id === "oCreatedAt") {
            return (<span>{moment(row.original?.oCreatedAt).fromNow()}</span>)
        }
        else if (cell.column.id === "oCurrUserDesc") {
            return (<span>{`${cell?.value?.firstName ?? '-'} ${cell?.value?.lastName ?? ''}`}</span>)
        }
        else if (cell.column.id === "oOrderTypeDesc") {
            return (<span>{cell?.value?.description ?? '-'}</span>)
        }
        else if (cell.column.id === "oOrderCategoryDesc") {
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
        if (!orderCount) {
            toast.warn('No records found')
            return
        }
        setIsOpen(true);
    }
    return (
        <>
            <td>
                <a className="txt-underline" onClick={() => toggle()}>
                    {orderCount}
                </a>
            </td>
            <Modal
                isOpen={isOpen}
                contentLabel="Order List"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title">Order List</h4>
                    <button type="button" className="close" onClick={() => setIsOpen(!isOpen)}>×</button>
                </div>
                <DynamicTable
                    listKey={"Order List"}
                    row={orderList}
                    rowCount={orderCount}
                    header={AssignedOrdersColumns}
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
            </Modal>
        </>

    )
}
