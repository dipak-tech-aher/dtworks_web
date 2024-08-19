import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { toast } from "react-toastify";


import { post } from "../../common/util/restUtil";
import { properties } from "../../properties";

import DynamicTable from "../../common/table/DynamicTable";
import { CustomerSearchColumns, CustomerSearchHiddenColumns } from "./customerSearchColumns";
import { formFilterObject } from "../../common/util/util";
import { unstable_batchedUpdates } from "react-dom";


function CustomerSearch() {

  const history = useNavigate();
  let id = useParams();
  const [data, setData] = useState([]);
  const [rowdata, getRowsData] = useState();

  const searchType = localStorage.getItem("searchType");
  const customerQuickSearchInput = localStorage.getItem("customerQuickSearchInput");

  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState([]);

  const isTableFirstRender = useRef(true);

  useEffect(() => {
    let searchParams = {
      searchType: searchType,
      customerQuickSearchInput: customerQuickSearchInput,
      filters: formFilterObject(filters)
    }
    
    post(`${properties.CUSTOMER_API}/search?limit=${perPage}&page=${currentPage}`, searchParams)
      .then((resp) => {
        if (resp.data) {
          if (resp.status === 200) {
            const { rows, count } = resp.data;
            if (!!rows.length) {
              unstable_batchedUpdates(() => {
                setTotalCount(count)
                setData(rows);
              })
            }
          } else {
            toast.error("Error searching for customer - " + resp.status + ', ' + resp.message);
          }
        } else {
          toast.error("Uexpected error searching for customer " + resp.statusCode);

        }
      }).catch((error) => {
        console.log(error)
    }).finally();

  }, [customerQuickSearchInput, perPage, currentPage]);

  const handleLinkClick = (e, header, rowData) => {
    const { id } = e.target;
    const { customerId, accountId, accountNo, accountName, accountContactNo, accountEmail, serviceId, accessNbr, serviceStatus, prodType } = rowData;
    localStorage.setItem("accountNo", rowData.accountNo)
    localStorage.setItem("customerId", rowData.customerId)
    localStorage.setItem("accountId", rowData.accountId)
    localStorage.setItem("serviceId", rowData.serviceId)
    if (header === "Customer Number") {
      localStorage.removeItem("service")
      localStorage.removeItem("account")
    }
    if (header === "Account Number") {
      localStorage.removeItem("service")
      localStorage.setItem("account", true)
    }
    if (header === "Access Number") {
      localStorage.removeItem("account")
      localStorage.setItem("service", true)
    }
    localStorage.setItem('accessNbr', rowData.accessNbr)
    const data = {
      customerId,
      accountId,
      accountNo,
      accountName,
      accountContactNo,
      accountEmail,
      serviceId,
      serviceNo: accessNbr,
      serviceStatus,
      serviceType: prodType,
      accessNumber: rowData.accessNbr,
      sourceName: 'customer360',
      type: id
    }
    if (['Complaint', 'Service Request'].includes(id)) {
      if (serviceStatus === "PENDING") {
        toast.error(`${id === 'Complaint' ? 'Incident' : 'Order'} cannot be created when service is in PENDING status`);
        return false;
      }
      history(`/create-${id.toLowerCase().replace(' ', '-')}`, { state: {data} })
    }
    else if (id === 'INQ') {
      if (serviceStatus === "PENDING") {
        toast.error(`${id === 'Inquiry' ? 'Lead' : ''} cannot be created when service is in PENDING status`);
        return false;
      }
      history(`/create-inquiry-new-customer`, { state: {data} })
    }
    else {
      history(`/customer360`/*, { state: {data} }*/)
    }
    //history(`/customer360`)

  }

  const handleCellRender = (cell, row) => {
    const { crmCustomerNo, accountId, serviceId } = row.original;
    if ((cell.column.Header === "Customer Id" && (!crmCustomerNo || crmCustomerNo === ''))
      || (cell.column.Header === "Customer Number" && crmCustomerNo !== '')
      || (cell.column.Header === "Account Id" && (!accountId || accountId === ''))
      || (cell.column.Header === "Account Number" && accountId !== '')
      || (cell.column.Header === "Service Id" && (!serviceId || serviceId === ''))
      || (cell.column.Header === "Access Number" && serviceId !== '')) {

      return (<span
        className="text-secondary cursor-pointer"
        onClick={(e) => handleLinkClick(e,
          cell.column.Header,
          row.original
        )}>{cell.value}</span>)

    }
    else if (cell.column.Header === "Action") {
      return (
        <div className="btn-group">
          <button type="button" id="Complaint"
            className="btn btn-sm btn-primary"
            onClick={(e) => handleLinkClick(e, cell.column.Header, row.original)}>
            <i className="mdi mdi-pencil ml-0 mr-2 font-10 vertical-middle" />
            Create Incident
          </button>
          <button type="button" className="btn btn-sm btn-primary p-1 dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i className="mdi mdi-chevron-down"></i>
          </button>
          <div className="dropdown-menu dropdown-menu-right">
            <button
              id="Inquiry"
              className="dropdown-item text-primary"
              onClick={(e) => handleLinkClick(e, cell.column.Header, row.original)}>
              <i className="mdi mdi-account-question  ml-0 mr-2 font-10 vertical-middle" />
              Create Lead
            </button>
            <button
              id="Service Request"
              className="dropdown-item text-primary"
              onClick={(e) => handleLinkClick(e, cell.column.Header, row.original)}>
              <i className="mdi mdi-nut  ml-0 mr-2 font-10 vertical-middle" />
              Create Request
            </button>
          </div>
        </div >
      )
    }
    else {
      return (<span>{cell.value}</span>)
    }
  }

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo)
  }

  return (
    <div className="row mt-1">
      <div className="col-lg-12">
        <div className="page-title-box">
          <h4 className="page-title">Customer Listing</h4>
        </div>
        <div className="search-result-box m-t-30 card-box">
          <div className="row mt-2 pr-2">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <DynamicTable
                    row={data}
                    rowCount={totalCount}
                    header={CustomerSearchColumns}
                    hiddenColumns={CustomerSearchHiddenColumns}
                    itemsPerPage={perPage}
                    backendPaging={true}
                    backendCurrentPage={currentPage}
                    isTableFirstRender={isTableFirstRender}
                    handler={{
                      handleCellRender: handleCellRender,
                      handlePageSelect: handlePageSelect,
                      handleItemPerPage: setPerPage,
                      handleCurrentPage: setCurrentPage,
                      handleFilters: setFilters
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}

export default CustomerSearch;
