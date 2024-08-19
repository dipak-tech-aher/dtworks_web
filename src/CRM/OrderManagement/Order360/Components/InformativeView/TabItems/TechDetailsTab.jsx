import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import DynamicTable from '../../../../../../common/table/DynamicTable'
import { v4 as uuidv4 } from 'uuid';
import { Order360Context } from '../../../../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { get, post, put } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';
import { Modal, CloseButton } from 'react-bootstrap'
import { toast } from 'react-toastify';
import TechnicalDetails from './TechDetails'
import moment from 'moment'

export default function TechnicalDetailsTab() {

    let { data } = useContext(Order360Context), { masterDataLookup, orderData, permissions } = data;
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [edit, setEdit] = useState({});
    const [filters, setFilters] = useState([]);
    const [productDetailsList, setProductDetailsList] = useState([]);
    const [productData, setProductData] = useState({});
    const [isPopupOpen, setIsPopupOpen] = useState(false)

    useEffect(() => {
        console.log('orderData ', orderData)
        if (orderData) {        
            const orderProductDetails = orderData?.orderProductDetails
            const formatedResponse = orderProductDetails && orderProductDetails.map((item) => {
                return {
                    orderId: orderData?.orderId,
                    orderDtlId: item?.orderDtlId,
                    fulfilmentStatus: item?.fulfilmentStatus?.code || 'FFMT_PENDING',
                    productId: item?.productId,
                    orderStatus: item?.orderStatus,
                    techgrp: item?.techgrp ?? 1,
                    billingGrp: item?.billingGrp ?? 1,
                    usageType: item?.usageType,
                    productName: item?.productDetails?.productName,
                    quantity: item?.productQuantity,
                    chargeType: item?.chargeList?.[0]?.chargeType,
                    frequency: item?.chargeList?.[0]?.frequency?.description ?? '',
                    pricePerUnit: item.chargeList?.[0]?.chargeAmount ?? 0,
                    duration: item?.duration,
                    fulfilmentStartDate: moment(item?.fulfilmentStartDate).format('YYYY-MM-DD'),
                    fulfilmentEndDate: moment(item?.fulfilmentEndDate).format('YYYY-MM-DD'),
                    edit: item?.fulfilmentStatus?.code === 'FFMT_COMPLETED',
                    serviceName: item?.serviceDetails?.serviceName,
                    serviceType: item?.productDetails?.serviceType?.description,
                    serviceCategory: item?.productDetails?.serviceCategory?.description,
                    orderUuid: item?.orderUuid,
                    productUuid: item?.productUuid,
                    status: item?.status,
                    productType: item?.productType?.description,


                }
            })
            setProductDetailsList(formatedResponse)
        }
    }, [orderData])

    const handleCellRender = (cell, row) => {
        if (cell.column.id == 'ProductName') {
            let productName = row?.original?.productName
            return (<span>{productName}</span>)
        } else if (cell.column.id === "chargeType") {
            let chargeType = row?.original?.chargeType?.description ?? '';
            return (<span>{chargeType}</span>)
        } else if (cell.column.id === "action") {
            return <button className="skel-btn-submit" onClick={() => { setProductData(row.original); setIsPopupOpen(!isPopupOpen) }}>Add/View</button>
        }
        return (<span>{cell?.value ?? '-'}</span>)
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    // console.log('isPopupOpen===========', isPopupOpen)

    return (
        <>
            <DynamicTable
                listKey={"TechnicalDetails list"}
                row={productDetailsList}
                rowCount={productDetailsList?.length}
                header={Columns}
                fixedHeader={true}
                columnFilter={false}
                customClassName={'table-sticky-header'}
                itemsPerPage={perPage}
                isScroll={false}
                backendPaging={false}
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

            {
                <Modal dialogClassName={'cust-lg-modal'} show={isPopupOpen} onHide={() => setIsPopupOpen(!isPopupOpen)}>
                    <Modal.Header>
                        <Modal.Title>{"CI/Technical Details"}</Modal.Title>
                        <CloseButton onClick={() => setIsPopupOpen(!isPopupOpen)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <TechnicalDetails
                            productData={productData}
                            edit={edit}
                            setEdit={setEdit}
                            isPopupOpen={isPopupOpen}
                            setIsPopupOpen={setIsPopupOpen}
                            setProductData={setProductData}
                        />
                    </Modal.Body>
                </Modal>
            }
        </>


    )
}

export const Columns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true,
        id: "action"
    },
    {
        Header: "Product Name",
        accessor: "ProductName",
        disableFilters: true,
        id: "ProductName"
    },
    {
        Header: "Product Type",
        accessor: "productType",
        disableFilters: true,
        id: "productType"
    },
    {
        Header: "Service Type",
        accessor: "serviceType",
        disableFilters: true,
        id: "serviceType"
    },
    {
        Header: "Quantity",
        accessor: "quantity",
        disableFilters: true,
        id: "quantity"
    },
];