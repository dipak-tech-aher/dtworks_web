import React, { useContext } from "react";
import DynamicTable from '../../common/table/DynamicTable';
import moment from 'moment';
import { AppContext } from '../../AppContext';
import { CloseButton, Modal } from 'react-bootstrap';

const PopupListModal = (props) => {
    const { appConfig } = useContext(AppContext);
    const { isTableFirstRender, hasExternalSearch, list, entityType, count, fixedHeader, itemsPerPage, isScroll, backendCurrentPage, backendPaging, isPopupOpen, headerColumn } = props.data
    const { handlePageSelect, setPerPage, setCurrentPage, setIsPopupOpen } = props.handlers

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "CustomerName") {
            return (<span>{row.original?.first_name + ' ' + row.original?.last_name}</span>)
        } else if (cell.column.id === "createdAt") {
            if (row.original?.created_at) {
                return (<span>{moment(row.original?.created_at).format('DD MMM YYYY')}</span>)

            } else {
                return (<span>{moment(row.original?.createdAt).format('DD MMM YYYY')}</span>)

            }
        } else if (cell.column.id === "appointmentDate") {
            if (row.original?.appoint_date) {
                return (<span>{moment(row.original?.appoint_date).format('DD MMM YYYY')}</span>)
            } else {
                return (<span>{moment(row.original?.appointDate).format('DD MMM YYYY')}</span>)
            }
        } else if (cell.column.id === "appointStartTime") {
            if (row.original?.appoint_start_time) {
                return (<p className="skel-time"><i className="material-icons">schedule</i> {row.original?.appoint_start_time + ' - ' + row.original?.appoint_end_time}</p>
                )
            } else {
                return (<p className="skel-time"><i className="material-icons">schedule</i> {row.original?.appointStartTime + ' - ' + row.original?.appointEndTime}</p>
                )
            }

        } else if (cell.column.id === "appointModeValue") {
            if (row.original?.appoint_mode_value) {
                return (((row.original?.appoint_mode === 'AUDIO_CONF' || row.original?.appoint_mode === 'VIDEO_CONF') && row.original?.status === 'AS_SCHED') ?
                    <a target="_blank" href={row.original?.appoint_mode_value}><button className="skel-btn-submit  btn-video ">
                        <i className="material-icons ml-0">videocam</i>Join</button></a>
                    : <span>{row.original?.status_description}</span>
                )
            } else {
                return (((row.original?.appointMode === 'AUDIO_CONF' || row.original?.appointMode === 'VIDEO_CONF') && row.original?.status === 'AS_SCHED') ?
                    <a target="_blank" href={row.original?.appointModeValue}><button className="skel-btn-submit  btn-video ">
                        <i className="material-icons ml-0">videocam</i>Join</button></a>
                    : <span>{row.original?.status.description}</span>
                )
            }

        } else if (typeof cell.value === 'object' && (cell?.value?.hasOwnProperty('code') || cell?.value?.hasOwnProperty('description'))) {
            return (<span>{cell.value.description ?? cell.value.code}</span>)
        } else {
            return (<span>{cell.value}</span>)
        }
    }

    return (
        <Modal show={isPopupOpen} onHide={() => setIsPopupOpen(!isPopupOpen)}>
            <Modal.Header>
                <Modal.Title>{entityType}</Modal.Title>
                <CloseButton onClick={() => setIsPopupOpen(!isPopupOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <DynamicTable
                    listSearch={[]}
                    listKey={entityType}
                    row={list && list.length > 0 ? list : []}
                    rowCount={count ? count : 0}
                    header={headerColumn}
                    fixedHeader={fixedHeader}
                    itemsPerPage={itemsPerPage}
                    isScroll={isScroll}
                    backendPaging={backendPaging}
                    isTableFirstRender={isTableFirstRender}
                    hasExternalSearch={hasExternalSearch}
                    backendCurrentPage={backendCurrentPage}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage
                    }}
                />
            </Modal.Body>
        </Modal>
    )
}

export default PopupListModal;


