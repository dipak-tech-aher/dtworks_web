import { capitalize } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useRef, useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { useNavigate } from "react-router-dom"
import DynamicTable from "../../../../../common/table/DynamicTable"
import { properties } from '../../../../../properties'
import { get } from '../../../../../common/util/restUtil'
import { unstable_batchedUpdates } from 'react-dom'

const InteractionList = (props) => {

    let history = useNavigate()
    const { handleOnCloseModal } = props?.stateHandlers
    const { isModelOpen, popUpType, ModelType, interactionDetails } = props?.data
    const [interactionList, setInteractionList] = useState([])
    const isFirstRender = useRef(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [perPage, setPerPage] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const interactionSearchRef = useRef()

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

    const getInteractionDetails = useCallback((data, popUpType, ModelType) => {
        if (!interactionSearchRef.current) {
            interactionSearchRef.current = { data }
        }
        if (popUpType && (data?.requestId || interactionSearchRef?.current?.data?.requestId)) {
            get(`${properties.INTERACTION_API}/get-related-statement-info/details/${data?.requestId ?? interactionSearchRef?.current?.data?.requestId}?status=${popUpType}&limit=${perPage}&page=${currentPage}${ModelType ? `&channel=${ModelType}` : ''}`)
                .then((response) => {
                    unstable_batchedUpdates(() => {
                        setInteractionList(response?.data?.rows ?? [])
                        setTotalCount(response?.data?.count)
                    })
                }).catch(err => console.log(err))
        }
    }, [currentPage, perPage])

    useEffect(() => {
        getInteractionDetails(interactionDetails, popUpType, ModelType)
    }, [ModelType, getInteractionDetails, interactionDetails, popUpType])

    const handlePageSelect = (pageNo) => { setCurrentPage(pageNo) }

    useEffect(() => {
        if (!isFirstRender.current) {
            getInteractionDetails()
        }
        else {
            isFirstRender.current = false;
        }
    }, [getInteractionDetails])

    console.log('interactionList?.rows', interactionList)

    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen} onHide={handleOnCloseModal} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Interaction - {capitalize(popUpType)}</h5></Modal.Title>
                <CloseButton onClick={handleOnCloseModal} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <DynamicTable
                    isScroll={true}
                    row={interactionList ?? []}
                    rowCount={totalCount ?? 0}
                    header={interactionListColumns}
                    itemsPerPage={perPage}
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

export default InteractionList;

const interactionListColumns = [
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategoryDesc.description",
        disableFilters: true
    },
    {
        Header: "Interaction Type",
        accessor: "srType.description",
        disableFilters: true
    },
    {
        Header: "Service Category",
        accessor: "categoryDescription.description",
        disableFilters: true
    },
    {
        Header: "Service Type",
        accessor: "serviceTypeDesc.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "currStatusDesc.description",
        disableFilters: true
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
    },
];