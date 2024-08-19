import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import DynamicTable from '../../../../../../common/table/DynamicTable'
import { v4 as uuidv4 } from 'uuid';
import { Order360Context } from '../../../../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import { get, put } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';
import { toast } from 'react-toastify';
import moment from 'moment';
import { statusConstantCode } from '../../../../../../AppConstants';
import { isObjectEmpty } from '../../../../../../common/util/validateUtil';

const Fulfilment = (props) => {
    let { data } = useContext(Order360Context), { masterDataLookup, orderData, permissions } = data;
    // console.log('permissions ', permissions)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [edit, setEdit] = useState(false);
    const [columns, setColumns] = useState([]);
    const [filters, setFilters] = useState([]);
    const [fulfilmentList, setFulfilmentList] = useState([]);
    const [backUpfulfilmentList, setBackUpfulfilmentList] = useState([]);
    const usageTypelookup = useMemo(() => { return masterDataLookup?.USAGE_TYPE }, [masterDataLookup]);
    const statuslookup = useMemo(() => { return masterDataLookup?.FULFILMENT_STATUS }, [masterDataLookup]);

    useEffect(() => {
        console.log('orderData ', orderData)
        // return
        if (orderData) {
            if (orderData?.orderCategory?.code === statusConstantCode.orderCategory.New) {
                setColumns(NewOrderColumns)
            } else {
                setColumns(ExistingOrderColumns)
            }
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
                    serviceId: item?.serviceId,
                    productName: item?.productDetails?.productName,
                    quantity: item?.productQuantity,
                    chargeType: item?.chargeList?.[0]?.chargeType,
                    frequency: item?.chargeList?.[0]?.frequency?.description ?? '',
                    pricePerUnit: (Number(item.nrcAmount) + Number(item?.rcAmount)) ?? 0,
                    nrcAmount: Number(item.nrcAmount) ?? 0,
                    rcAmount: Number(item?.rcAmount) ?? 0,
                    duration: item?.duration,
                    fulfilmentStartDate: moment(item?.fulfilmentStartDate).format('YYYY-MM-DD'),
                    fulfilmentEndDate: moment(item?.fulfilmentEndDate).format('YYYY-MM-DD'),
                    edit: item?.fulfilmentStatus?.code === 'FFMT_COMPLETED',
                    serviceName: item?.serviceDetails?.serviceName,
                    serviceType: item?.productDetails?.serviceType?.description,
                    serviceCategory: item?.productDetails?.serviceCategory?.description,
                    productBenefit: item?.productBenefit,
                    actualProductBenefit: item?.actualProductBenefit,
                    actualContractMonths: item?.actualContractMonths
                }
            })
            setFulfilmentList(formatedResponse)
        }
    }, [orderData])


    // console.log('fulfilmentList', fulfilmentList)


    const handleInputChange = (e, data) => {
        unstable_batchedUpdates(() => {
            let { id, value } = e.target;

            // if (['billingGrp', 'techgrp'].includes(id) && value === 0) {
            //     toast.warn('kindly provide the value greater then 0')
            //     return false
            // }

            setFulfilmentList(
                fulfilmentList.map((item) => {
                    if (data.orderDtlId === item.orderDtlId) {
                        if (['billingGrp', 'techgrp'].includes(id)) {
                            item[id] = value
                        } else if (['fulfilmentStatus', 'usageType', 'fulfilmentStartDate'].includes(id)) {
                            item[id] = value
                        }
                    }
                    return item
                })
            )
        })
    }

    const handleCellRender = (cell, row) => {
        const rowEdit = row?.original?.edit ? false : true;
        if (cell.column.id == 'ProductName') {
            let productName = row?.original?.productName
            return (<span>{productName}</span>)
        } else if (cell.column.id === "Status") {

            return <select className="form-control" id="fulfilmentStatus" disabled={!(edit && rowEdit)} style={{ width: 150, cursor: "pointer" }}
                onChange={(e) => { handleInputChange(e, row.original) }} value={cell.value ?? row.original?.status ?? ''}>
                <option value="">Select Status</option>
                {statuslookup && statuslookup.map((val, i) => {
                    return <option value={val.code} key={i}>{val.description}</option>
                })}
            </select>
        } else if (cell.column.Header === "Technology Group") {

            return <input type="text" id="techgrp" className="form-control" value={cell.value ? row.original.techgrp : ""} style={{ width: 150, cursor: "pointer" }}
                onChange={(e) => { handleInputChange(e, row.original) }} maxLength={2} disabled={!(edit && rowEdit)} />

        } else if (cell.column.Header === "Billing Group") {
            return <input type="text" id="billingGrp" className="form-control" style={{ width: 150, cursor: "pointer" }} value={cell.value ? row.original.billingGrp : ""}
                onChange={(e) => { handleInputChange(e, row.original) }} maxLength={2} disabled={!(edit && rowEdit)} />

        } else if (cell.column.id === "usageType") {
            return <select className="form-control" id="usageType" style={{ width: 150, cursor: "pointer" }} onChange={(e) => { handleInputChange(e, row.original) }}
                disabled={!(edit && rowEdit && row?.original?.chargeType?.code === "CC_USGC")} value={cell.value ? row.original.usageType : ""}>
                <option value="">Select Usage Type</option>
                {usageTypelookup && usageTypelookup.map((val, i) => {
                    return <option value={val.code} key={i}>{val.description}</option>
                })}
            </select>
        } else if (cell.column.Header == 'Billing Start Date') {
            return (<span>
                <input
                    type="date"
                    min={moment('1940-01-01').format('YYYY-MM-DD')}
                    id='fulfilmentStartDate'
                    value={row?.original?.fulfilmentStartDate ? moment(row?.original?.fulfilmentStartDate).format('YYYY-MM-DD') : ""}
                    disabled={!(edit && rowEdit)}
                    onChange={(e) => { handleInputChange(e, row.original) }}
                    className="form-control"
                />
            </span>)
        } else if (cell.column.Header === "Charge Type") {

            let chargeType = row?.original?.chargeType?.description ?? '';
            return (<span>{chargeType}</span>)

        } else if (cell.column.Header == 'Is Usage Based') {

            let isUsageBased = row?.original?.chargeType?.code === "CC_USGC" ?? '';
            return (<span>{isUsageBased ? ' YES' : 'No'}</span>)

        } else if (cell.column.Header == 'Total Amount') {
            let productQuantity = row?.original?.quantity ?? 1
            let duration = row?.original?.duration ?? 1;
            let rcAmount = Number(row?.original?.rcAmount).toFixed(2) * Number(duration)
            let nrcAmount = Number(row?.original?.nrcAmount).toFixed(2)
            return (<span>{(Number(rcAmount || 0)+Number(nrcAmount || 0))*Number(productQuantity)}</span>)

        }

        return (<span>{cell?.value ?? '-'}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const isValidDate = (date) => {
        console.log(date)
        const parsedDate = Date.parse(date);
        return !isNaN(parsedDate);
    };

    const UpdateFulfilment = () => {
        try {
            const hasZeroValue = fulfilmentList.some(obj => obj.billingGrp === 0 || obj.techgrp === 0)
            if (hasZeroValue) {
                toast.error('Kindly provide value greater than Zero')
                return false
            }
            const hasInvalidDate = fulfilmentList.some(item =>
                item.fulfilmentStatus === 'FFMT_COMPLETED' && (item.fulfilmentStartDate ? !isValidDate(item.fulfilmentStartDate) : false)
            );
            // console.log(hasInvalidDate)
            if (hasInvalidDate) {
                toast.error('Please provide a valid Start Date for completed fulfilments');
                return false;
            }

            let requestObj = {
                orderId: orderData?.orderId,
                orderType: orderData?.orderType?.code,
                orderCategory: orderData?.orderCategory?.code,
                customerUuid: orderData?.customerDetails?.customerUuid,
                fulfilmentdata: fulfilmentList.map((item) => {
                    return {
                        fulfilmentStatus: item?.fulfilmentStatus || 'FFMT_PENDING',
                        techgrp: item?.techgrp,
                        usageType: item?.usageType,
                        billingGrp: item?.billingGrp,
                        fulfilmentStartDate: item?.fulfilmentStartDate,
                        orderDtlId: item?.orderDtlId,
                        productId: item?.productId,
                        serviceId: item?.serviceId
                    }
                })
            }
            console.log(requestObj);
            // return 
            put(`${properties.ORDER_API}/fulfilment`, requestObj).then(res => {
                if (res?.status === 200) {
                    toast.success(res?.message);
                    // getFulfilment();
                    setEdit(!edit)
                } else {
                    toast.error('Something went wrong')
                }
            }).catch(err => console.log(err)).finally()
        } catch (e) {
            console.log('error', e)
        }
    }
    const onSearch = (e) => {
        let { value } = e.target;
        if (value) {
            setFulfilmentList(backUpfulfilmentList.filter((item) => {
                return item.productName.toLowerCase().includes(value.toLowerCase())
            }))
        } else {
            setFulfilmentList(backUpfulfilmentList)
        }
    }
    return (
        <>
            <div className="skel-fulfill-srh">
                <div className="">
                    <div className="search-box2">
                        <div className="box-srh">
                            <i className="fas fa-search" />
                            <form autoComplete="off">
                                <input
                                    type="search"
                                    id="search-input-box"
                                    className="expandable-input"
                                    placeholder="Search..."
                                    maxLength={50}
                                    onChange={(e) => onSearch(e)}
                                />
                            </form>
                        </div>

                    </div>
                </div>
                {!['CLS', 'CNCLED'].includes(orderData?.orderStatus?.code) && !permissions?.readOnly && <span>
                    {!edit && <button type="button" className="skel-btn-submit" onClick={() => { setEdit(true); }}>
                        Edit
                    </button>}
                    <div className="skel-btn-center-cmmn" style={{ display: edit ? '' : "none" }}>
                        <button type="button" className="skel-btn-cancel" onClick={() => { setEdit(false); }} >
                            Cancel
                        </button>
                        <button type="button" className="skel-btn-submit" onClick={() => UpdateFulfilment()} >
                            Done
                        </button>
                    </div>
                </span >}
            </div >
      
            {fulfilmentList && fulfilmentList.length ? <DynamicTable
                listKey={"Fulfilment list"}
                row={fulfilmentList || []}
                rowCount={fulfilmentList?.length || 0}
                header={columns}
                fixedHeader={false}
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
            /> : <></>
            }       </>
    )
}

export default Fulfilment

const NewOrderColumns = [
    {
        Header: "Product Name",
        accessor: "ProductName",
        disableFilters: true,
        id: "ProductName"
    },
    {
        Header: "Status",
        accessor: "fulfilmentStatus",
        disableFilters: true,
        id: "Status"
    },
    {
        Header: "Technology Group",
        accessor: "techgrp",
        disableFilters: true,
        id: "techgrp"
    },
    {
        Header: "Billing Group",
        accessor: "billingGrp",
        disableFilters: true,
        id: "billingGrp"
    },
    {
        Header: "Is Usage Based",
        accessor: "intxnCategoryDescDescription",
        disableFilters: true,
        id: "intxnCategoryDescDescription"
    },
    {
        Header: "Usage Type",
        accessor: "usageType",
        disableFilters: true,
        id: "usageType"
    },
    {
        Header: "Quantity",
        accessor: "quantity",
        disableFilters: true,
        id: "quantity"
    },
    {
        Header: "Price Per Unit",
        accessor: "pricePerUnit",
        disableFilters: true,
        id: "pricePerUnit"
    },
    {
        Header: "RC Amount",
        accessor: "rcAmount",
        disableFilters: true,
        id: "rcAmount"
    },
    {
        Header: "NRC Amount",
        accessor: "nrcAmount",
        disableFilters: true,
        id: "nrcAmount"
    },
    {
        Header: "Duration",
        accessor: "duration",
        disableFilters: true,
        id: "duration"
    },
    {
        Header: "Total Amount",
        accessor: "currStatusDescDescription",
        disableFilters: true,
        id: "currStatusDescDescription"
    },
    // {
    //     Header: "Charge Type",
    //     accessor: "chargeType",
    //     disableFilters: true,
    //     id: "ChargeType"
    // },
    {
        Header: "Frequency",
        accessor: "frequency",
        disableFilters: true,
        id: "frequency"
    },
    {
        Header: "Billing Start Date",
        accessor: "fulfilmentStartDate",
        disableFilters: true,
        id: "fulfilmentStartDate"
    }
];

const ExistingOrderColumns = [
    {
        Header: "Service Name",
        accessor: "serviceName",
        disableFilters: true,
        id: "serviceName"
    },
    {
        Header: "Product Name",
        accessor: "ProductName",
        disableFilters: true,
        id: "ProductName"
    },
    {
        Header: "Status",
        accessor: "fulfilmentStatus",
        disableFilters: true,
        id: "Status"
    },
    {
        Header: "Start Date",
        accessor: "fulfilmentStartDate",
        disableFilters: true,
        id: "fulfilmentStartDate"
    },
    {
        Header: "End Date",
        accessor: "fulfilmentEndDate",
        disableFilters: true,
        id: "fulfilmentEndDate"
    },
    {
        Header: "Service Category",
        accessor: "serviceCategory",
        disableFilters: true,
        id: "serviceCategory"
    },
    {
        Header: "Service Type",
        accessor: "serviceType",
        disableFilters: true,
        id: "serviceType"
    },
    {
        Header: "Penalty Amount",
        accessor: "penaltyAmount",
        disableFilters: true,
        id: "penaltyAmount"
    },
    {
        Header: "Total Amount",
        accessor: "totalAmount",
        disableFilters: true,
        id: "totalAmount"
    },
    {
        Header: "Charge Type",
        accessor: "chargeType",
        disableFilters: true,
        id: "ChargeType"
    },
    {
        Header: "Frequency",
        accessor: "frequency",
        disableFilters: true,
        id: "frequency"
    }
];
