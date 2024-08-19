import React from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import DynamicTable from "../../../../../common/table/DynamicTable"

const HelpdeskList = (props) => {

    const { helpdeskHistoryDetails, perPage, currentPage, isHelpdeskModelOpen } = props?.data
    const { handleHelpdeskOnClose, handleCellRender, handleHelpdeskPageSelect, setPerPage, setCurrentPage } = props?.stateHandlers

    return (
        <Modal aria-labelledby="contained-modal-title-vcenter" centered show={isHelpdeskModelOpen} onHide={handleHelpdeskOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Helpdesk History</h5></Modal.Title>
                <CloseButton onClick={handleHelpdeskOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <DynamicTable
                    listKey={"Helpdesk"}
                    row={helpdeskHistoryDetails?.rows ?? []}
                    rowCount={helpdeskHistoryDetails?.count ?? 0}
                    header={HelpdeskSearchColumns}
                    itemsPerPage={perPage}
                    isScroll={true}
                    backendPaging={true}
                    backendCurrentPage={currentPage}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handleHelpdeskPageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage
                    }}
                />
            </Modal.Body>
        </Modal>
    )

}

export default HelpdeskList

const HelpdeskSearchColumns = [
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true,
        click: true,
        id: "helpdeskNo",
    },
    {
        Header: "Helpdesk Subject",
        accessor: "helpdeskSubject",
        disableFilters: true,
        click: true,
        id: "helpdeskSubject",
    },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true,
        id: "source"
    },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true,
        id: "status"
    },
    {
        Header: "Source Reference",
        accessor: "mailId",
        disableFilters: true,
        id: "sourceReference"
    },
    {
        Header: "Helpdesk Type",
        accessor: "helpdeskType.description",
        disableFilters: true,
        id: "helpdeskType"
    },
    {
        Header: "Helpdesk Category",
        accessor: "helpdeskCategory.description",
        disableFilters: true,
        id: "helpdeskCategory"
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt"
    }
]