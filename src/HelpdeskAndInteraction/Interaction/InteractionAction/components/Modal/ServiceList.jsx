import React from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import DynamicTable from "../../../../../common/table/DynamicTable"

const ServiceList = (props) => {
    const { serviceHistoryDetails, servicePerPage, serviceCurrentPage, isServiceModelOpen } = props?.data
    const { handleServiceOnClose, handleCellRender, handleServicePageSelect, setServicePerPage, setServiceCurrentPage } = props?.stateHandlers

    return (<Modal aria-labelledby="contained-modal-title-vcenter" centered show={isServiceModelOpen} onHide={handleServiceOnClose} dialogClassName="cust-lg-modal">
        <Modal.Header>
            <Modal.Title><h5 className="modal-title">Service History</h5></Modal.Title>
            <CloseButton onClick={handleServiceOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
            </CloseButton>
        </Modal.Header>
        <Modal.Body>
            <DynamicTable
                listKey={"Helpdesk"}
                row={serviceHistoryDetails?.rows ?? []}
                rowCount={serviceHistoryDetails?.count ?? 0}
                header={ServiceSearchColumns}
                itemsPerPage={servicePerPage}
                isScroll={true}
                backendPaging={true}
                backendCurrentPage={serviceCurrentPage}
                handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handleServicePageSelect,
                    handleItemPerPage: setServicePerPage,
                    handleCurrentPage: setServiceCurrentPage
                }}
            />
        </Modal.Body>
    </Modal>)

}

export default ServiceList;

const ServiceSearchColumns = [{
    Header: "Service No",
    accessor: "serviceNo",
    disableFilters: true,
    id: "serviceNo"
}, {
    Header: "Service Name",
    accessor: "serviceName",
    disableFilters: true,
    id: "serviceName"
}, {
    Header: "Service Type",
    accessor: "srvcTypeDesc.description",
    disableFilters: true,
    id: "srvcTypeDesc"
}, {
    Header: "Service Category",
    accessor: "srvcCatDesc.description",
    disableFilters: true,
    id: "srvcCatDesc"
}, {
    Header: "Status",
    accessor: "serviceStatus.description",
    disableFilters: true,
    id: "serviceStatus"
}, {
    Header: "Created At",
    disableFilters: true,
    id: "createdAt"
}]