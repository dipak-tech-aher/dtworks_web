import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

import DynamicTable from "../../../common/table/DynamicTable";
import { WorkOrdersListColumns, HiddenColumns } from "./TabColumns";
import { formatISODateDDMMMYY, formatISODateTime } from '../../../common/util/dateUtil'
import { useHistory }from "../../../common/util/history";


function WorkOrders(props) {
  const history = useHistory()

  const [workOrders, setWorkOrders] = useState([])
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState();

  const customerDetails = props.data.customerDetails ? props.data.customerDetails : null;
  const subscriptionDetails = props.data.subscriptionDetails ? props.data.subscriptionDetails : null;

  useEffect(() => {
    if (customerDetails || subscriptionDetails) {
      post(`${properties?.ORDER_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: { customerUuid: customerDetails.customerUuid, serviceUuid: subscriptionDetails?.serviceUuid } })
        .then((resp) => {

          if (resp && resp?.data) {
            setTotalCount(resp?.data?.count)
            setWorkOrders(resp?.data?.row)
          } else {
            toast.error("Failed to fetch WorkOrders - " + resp?.status);
          }
        }).catch((error) => {
          console.log(error)
        }).finally();
    }
  }, [customerDetails, subscriptionDetails, currentPage, perPage]);

  const redirectToInteractionPage = (data) => {
    history(`/order360`, { state: { data: { orderNo: data?.orderNo, orderUuid: data?.orderUuid, orderId: data?.orderId } } })
  }

  const handleCellRender = (cell, row) => {
    if (cell.column.id === "orderNo") {
      return (<span className="text-secondary cursor-pointer" onClick={() => redirectToInteractionPage(cell?.row?.original)}>{cell.value}</span>)
    } else if (cell?.column?.Header === "Created Date") {
      return (<span>{formatISODateTime(cell?.value)}</span>)    
    } else if (cell?.column?.id === "createdBy") {
      return (<span>{row.original.createdBy?.firstName} {row.original.createdBy?.lastName}</span>)
    }
    else {
      return (<span>{!cell?.value ? '-' : cell?.value}</span>)
    }
  }

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo)
  }

  let columns = WorkOrdersListColumns;
  if (props?.source === 'Order360') {
    columns = WorkOrdersListColumns.filter((col) => (col.Header !== 'Source'))
  }
  return (
    <>
      {
        (workOrders && workOrders?.length > 0) ?
          <DynamicTable
            row={workOrders}
            rowCount={totalCount}
            itemsPerPage={perPage}
            backendPaging={true}
            backendCurrentPage={currentPage}
            header={columns}
            hiddenColumns={HiddenColumns}
            handler={{
              handleCellRender: handleCellRender,
              handlePageSelect: handlePageSelect,
              handleItemPerPage: setPerPage,
              handleCurrentPage: setCurrentPage,
            }}
          />
          :
          <span className="msg-txt">No WorkOrders Available</span>
      }
    </>
  );
}

export default WorkOrders;
