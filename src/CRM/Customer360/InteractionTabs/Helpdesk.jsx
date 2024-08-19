import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

import DynamicTable from "../../../common/table/DynamicTable";
import { HelpdeskListColumns, HiddenColumns, Order360PageHelpdeskListColumns, Contract360PageHelpdeskListColumns } from "./TabColumns";
import { formatISODateDDMMMYY, formatISODateTime } from '../../../common/util/dateUtil'
import { useHistory } from "../../../common/util/history";

function Helpdesk(props) {
  const history = useHistory()
  const [helpdesk, setHelpdesk] = useState([])
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState();
  const [currentPage, setCurrentPage] = useState(0);
  const customerDetails = props.data.customerDetails ? props.data.customerDetails : null;
  const subscriptionDetails = props.data.subscriptionDetails ? props.data.subscriptionDetails : null;
  // console.log('customerDetails---------', customerDetails)
  // console.log('subscriptionDetails---------', subscriptionDetails)
  useEffect(() => {
    if (customerDetails?.profileNo || customerDetails?.customerNo || subscriptionDetails?.serviceUuid) {
      // if (customerDetails || subscriptionDetails) {
      post(`${properties.HELPDESK_API}/search?limit=${perPage}&page=${currentPage}`, { userCategoryValue: customerDetails?.customerNo, profileNo: customerDetails?.profileNo, serviceUuid: subscriptionDetails?.serviceUuid, contain: ['CUSTOMER'] })
        .then((resp) => {
          if (resp && resp.data) {
            setTotalCount(resp.data.count)
            setHelpdesk(resp.data.rows)
          } else {
            toast.error("Failed to fetch helpdesk - " + resp.status);
          }
        }).catch((error) => {
          console.error(error)
        })
        .finally();
    }
  }, [customerDetails?.profileNo, customerDetails?.customerNo, subscriptionDetails?.serviceUuid, currentPage, perPage]);
  // }, [customerDetails, subscriptionDetails, currentPage, perPage]);
  const redirectToCustomerPage = (customerNo) => {
    get(`${properties.CUSTOMER_API}/search?q=${customerNo.trim()}`)
      .then((resp) => {
        if (resp.status === 200) {
          const data = {
            ...resp?.data[0],
            sourceName: 'order60'
          }
          if (resp?.data[0]?.customerUuid) {
            localStorage.setItem("customerUuid", resp.data[0].customerUuid)
          }
          history(`/view-customer`, { state: { data } })
        }
      }).catch(error => {
        console.log(error)
      }).finally();
  }

  const handleCellRender = (cell, row) => {
    if (cell.column.Header === "Helpdesk Number" || cell.column.Header === 'Helpdesk ID') {
      return (<span className="text-secondary cursor-pointer" onClick={() => redirectToInteractionPage(cell?.row?.original)}>{cell.value}</span>)
    }
    else if (cell.column.Header === "Customer ID") {
      return (<span className="text-secondary cursor-pointer" onClick={() => redirectToCustomerPage(cell.value)}>{cell.value}</span>)
    }
    else if (cell.column.Header === "Created Date") {
      return (<span>{formatISODateTime(cell.value)}</span>)
    }
    else if (cell.column.Header === "Phone Number") {
      return (<span>{`${cell?.row?.original?.customerDetails?.contactDetails?.mobilePrefix ?? ''} ${cell?.row?.original?.customerDetails?.contactDetails?.mobileNo ?? '-'}`}</span>)
    }
    else {
      return (<span>{!cell.value ? '-' : cell.value}</span>)
    }
  }

  const redirectToInteractionPage = (data) => {
    history(`/view-helpdesk`, { state: { data } })
  }

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo)
  }
  const getTableColumns = () => {
    if (props?.source === 'Order360') return Order360PageHelpdeskListColumns;
    if (props?.source === 'Contract360') return Contract360PageHelpdeskListColumns;
    return HelpdeskListColumns
  }

  return (
    <>

      {
        (helpdesk && helpdesk.length > 0) ?
          <DynamicTable
            row={helpdesk}
            header={getTableColumns()}
            rowCount={totalCount}
            itemsPerPage={perPage}
            backendPaging={true}
            columnFilter={true}
            backendCurrentPage={currentPage}
            hiddenColumns={HiddenColumns}
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
  );
}

export default Helpdesk;
