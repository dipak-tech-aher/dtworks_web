import React, { useContext, useEffect, useState } from 'react'
import DynamicTable from '../../../../../../common/table/DynamicTable'
import { post } from '../../../../../../common/util/restUtil';
import { properties } from '../../../../../../properties';
import { formatISODateTime } from '../../../../../../common/util/dateUtil';
import { toast } from 'react-toastify';
import { useHistory } from '../../../../../../common/util/history';
import { Order360Context } from '../../../../../../AppContext';
import { unstable_batchedUpdates } from 'react-dom';
import moment from 'moment';

export default function Contract(props) {
    let { data } = useContext(Order360Context), { orderData = {}, customerDetails = {}, orderNo } = data;
    const history = useHistory()
    const [list, setList] = useState([])
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState();
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        if (customerDetails?.customerNo) {
            post(`${properties.CONTRACT_API}/search?limit=${perPage}&page=${currentPage}`, { orderId: orderData?.orderId }).then((resp) => {
                if (Number(resp?.data?.count) > 0) {
                    const { rows, count } = resp.data;
                    unstable_batchedUpdates(() => {
                        setTotalCount(count);
                        setList(rows);
                    })
                }

            }).catch(error => console.log(error))
                .finally(() => {
                })
        }
    }, [customerDetails?.customerNo, currentPage, perPage]);


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "contractNo") {
            return (<span className="text-secondary cursor-pointer" onClick={() => redirectToInteractionPage(cell?.row?.original)}>{cell.value}</span>)
        }
        else if (cell.column.Header === "Created Date") {
            return (<span>{formatISODateTime(cell.value)}</span>)
        }
        else if (cell.column.Header === "Phone Number") {
            return (<span>{`${cell?.row?.original?.customer?.customerContact?.[0]?.mobilePrefix ?? ''} ${cell?.row?.original?.customer?.customerContact?.[0]?.mobileNo ?? '-'}`}</span>)
        }
        else if (cell.column.id === "totalAmount") {
            const duration = row?.original?.contractDetail?.find(c=> c.chargeType === 'CC_RC')?.durationMonth || 1;
            let productQuantity = row?.original?.contractDetail?.find(c=> c.chargeType === 'CC_RC')?.quantity || 1
            let rcAmount = Number(row?.original?.rcAmount).toFixed(2) * Number(duration)
            let nrcAmount = Number(row?.original?.otcAmount).toFixed(2)
            const chargeAmount = (Number(rcAmount || 0)+Number(nrcAmount || 0))*Number(productQuantity)
            const currency = cell?.row?.original?.contractDetail[0]?.charge?.currencyDesc?.description;
            return (<span>{currency} {chargeAmount}</span>)
        }
        else if (["actualStartDate","actualEndDate"].includes(cell.column.id)) {
            return (
                <span>{cell.value ? moment(cell.value).format('DD MMM YYYY') : '-'}</span>
            )
        }
        else {
            return (<span>{!cell.value ? '-' : cell.value}</span>)
        }
    }

    const redirectToInteractionPage = (data) => {
        history(`/contract360`, { state: { data } })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    return (
        <>
            {
                (list && list.length > 0) ?
                    <DynamicTable
                        row={list}
                        header={Columns}
                        rowCount={totalCount}
                        itemsPerPage={perPage}
                        backendPaging={true}
                        columnFilter={true}
                        backendCurrentPage={currentPage}
                        handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setPerPage,
                            handleCurrentPage: setCurrentPage,
                        }}
                    />
                    :
                    <p className='skel-widget-warning'>No Records Found!!!</p>
            }

        </>
    )
}

export const Columns = [
    {
        Header: "Contract Number",
        accessor: "contractNo",
        disableFilters: false,
        id: "contractNo"
    },
    {
        Header: "Status",
        accessor: "statusDesc.description",
        disableFilters: false,
        id: "cstatus"
    },
    {
        Header: "Start Date",
        accessor: "actualStartDate",
        disableFilters: true,
        id: "actualStartDate"
    },
    {
        Header: "End Date",
        accessor: "actualEndDate",
        disableFilters: true,
        id: "actualEndDate"
    },
    {
        Header: "Value",
        accessor: "totalAmount",
        disableFilters: true,
        id: "totalAmount",

    }
]
