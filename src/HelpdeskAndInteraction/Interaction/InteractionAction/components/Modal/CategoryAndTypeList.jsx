import { capitalize, isEmpty, kebabCase } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useRef, useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { useNavigate } from "react-router-dom"
import DynamicTable from "../../../../../common/table/DynamicTable"
import { get } from '../../../../../common/util/restUtil'
import { properties } from '../../../../../properties'

const CategoryAndTypeList = (props) => {
    let history = useNavigate()
    const { handleOnCloseModal } = props?.stateHandlers
    const { isModelOpen, popUpType } = props?.data
    const isFirstRender = useRef(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [perPage, setPerPage] = useState(10)
    const [interactionLookUp, setInteractionLookUp] = useState([])


    const handleOnClick = (payload) => {
        let url = '/interaction360'
        history(`${url}`, { state: {data: { intxnNo: payload?.intxnNo, customerUid: payload?.customerUid }} })
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>{row?.original?.createdAt ? moment(row.original?.createdAt).format("DD-MM-YYYY HH:mm:ss a") : '-'}</span>)
        } else if (cell.column.id === "intxnNo") {
            return <span onClick={() => { handleOnClick(row.original) }} className="text-secondary cursor-pointer" >{cell.value}</span>;
        }
        return <span>{cell.value}</span>;
    }

    const getInteractionDetails = useCallback(() => {
        if (!isEmpty(popUpType)) {
            get(`${properties.INTERACTION_API}/weekly/list?${popUpType?.key}=${popUpType?.value}&limit=${perPage}&page=${currentPage}`)
                .then((response) => {
                    if (response?.status === 200) {
                        setInteractionLookUp(response?.data ?? {})
                    }
                }).catch((error) => { console.error(error) })
        }
    }, [currentPage, perPage, popUpType])

    const handlePageSelect = (pageNo) => { setCurrentPage(pageNo) }


    useEffect(() => {
        if (!isFirstRender.current) {
            getInteractionDetails()
        }
        else {
            isFirstRender.current = false;
        }
    }, [getInteractionDetails, currentPage, perPage])

    useEffect(() => {
        setCurrentPage((currentPage) => {
            if (currentPage === 0) {
                return '0'
            }
            return 0
        })
    }, [])


    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen} onHide={handleOnCloseModal} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Interaction - {capitalize(kebabCase(popUpType?.key))}</h5></Modal.Title>
                <CloseButton onClick={handleOnCloseModal} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <DynamicTable
                    listKey={"Interactions"}
                    row={interactionLookUp?.rows ?? []}
                    rowCount={interactionLookUp?.count ?? 0}
                    header={interactionListColumns}
                    itemsPerPage={perPage}
                    isScroll={true}
                    backendPaging={true}
                    backendCurrentPage={currentPage}
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

export default CategoryAndTypeList

const interactionListColumns = [
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true
    },
    {
        Header: "Service Category",
        accessor: "serviceCategory.description",
        disableFilters: true
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
    },
]