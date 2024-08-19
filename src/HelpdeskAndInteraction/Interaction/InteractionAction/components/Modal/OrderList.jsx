import React from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import DynamicTable from "../../../../../common/table/DynamicTable"

const OrderList = (props) => {
    const { orderHistoryDetails, orderPerPage, orderCurrentPage, isOrderModelOpen } = props?.data
    const { handleOrderOnClose, handleCellRender, handleOrderPageSelect, setOrderPerPage, setOrderCurrentPage } = props?.stateHandlers

    return (<Modal aria-labelledby="contained-modal-title-vcenter" centered show={isOrderModelOpen} onHide={handleOrderOnClose} dialogClassName="cust-lg-modal">
        <Modal.Header>
            <Modal.Title><h5 className="modal-title">Order History</h5></Modal.Title>
            <CloseButton onClick={handleOrderOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
            </CloseButton>
        </Modal.Header>
        <Modal.Body>
            <DynamicTable
                listKey={"Helpdesk"}
                row={orderHistoryDetails?.row ?? []}
                rowCount={orderHistoryDetails?.count ?? 0}
                header={OrderSearchColumns}
                itemsPerPage={orderPerPage}
                isScroll={true}
                backendPaging={true}
                backendCurrentPage={orderCurrentPage}
                handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handleOrderPageSelect,
                    handleItemPerPage: setOrderPerPage,
                    handleCurrentPage: setOrderCurrentPage
                }}
            />
        </Modal.Body>
    </Modal>)

}

export default OrderList;

const OrderSearchColumns = [
    {
        Header: "Order No",
        accessor: "orderNo",
        disableFilters: true,
        id: "orderNo"
    },{
        Header: "Order Category",
        accessor: "orderCategory.description",
        disableFilters: true,
        id: "orderCategory"
    }, {
        Header: "Order Type",
        accessor: "orderType.description",
        disableFilters: true,
        id: "orderType"
    }, {
        Header: "Order Family",
        accessor: "orderFamily.description",
        disableFilters: true,
        id: "orderFamily"
    }, {
        Header: "Order Status",
        accessor: "orderStatus.description",
        disableFilters: true,
        id: "orderStatus"
    },  {
        Header: "Order Date",
        accessor: "orderDate",
        disableFilters: true,
        id: "orderDate"
    }]