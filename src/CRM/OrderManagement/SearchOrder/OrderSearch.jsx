import React, { useContext, useEffect, useRef, useState } from "react";
import DynamicTable from "../../../common/table/DynamicTable";
import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import { useHistory } from '../../../common/util/history';
import { unstable_batchedUpdates } from "react-dom";
import moment from 'moment'
export default function SearchOrder(props) {
  const [searchData, setSearchData] = useState({})
  const [orderList, setOrderList] = useState([]);
  const [orderCategoryLookup, setOrderCategoryLookup] = useState([]);
  const [orderTypeLookup, setOrderTypeLookup] = useState([]);
  const [orderStatusLookup, setOrderStatusLookup] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const history = useHistory()

  useEffect(() => {
    get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=ORDER_CATEGORY,ORDER_TYPE,ORDER_STATUS')
      .then((response) => {
        if (response.data) {
          unstable_batchedUpdates(() => {
            setOrderCategoryLookup(response.data.ORDER_CATEGORY)
            setOrderTypeLookup(response.data.ORDER_TYPE)
            setOrderStatusLookup(response.data.ORDER_STATUS)
          })
        }
      }).catch((error) => console.error(error))
  }, [])
  const handleInputChange = (e) => {
    const { id, value } = e.target
    setSearchData({ ...searchData, [id]: value })
  }

  const handlePageSelect = (pageNo) => {
    setCurrentPage(pageNo)
  }

  const handleOnCellActionsOrLink = (rowData) => {

    const data = {
      ...rowData
    }
    // history(`/order360`, { state: { data } })
    localStorage.setItem('viewOrderData', JSON.stringify(data));

    window.open(`${properties.REACT_APP_BASE}/order360`, "_blank")

  }

  const handleCellRender = (cell, row) => {
    if (cell.column.id === "orderNo") {
      return (<span className="text-secondary cursor-pointer" id="CUSTOMERID" onClick={(e) => handleOnCellActionsOrLink(row.original)}>{cell.value}</span>)
    } else if (cell.column.id === "createdBy") {
      return (<span>{row.original.createdBy?.firstName} {row.original.createdBy?.lastName}</span>)
    } else if (cell.column.id === "updatedBy") {
      return (<span>{row.original.updatedBy?.firstName} {row.original.updatedBy?.lastName}</span>)
    } else if (cell.column.id === "currUser") {
      return (<span>{row.original.currUser?.firstName} {row.original.currUser?.lastName}</span>)
    } else if (cell.column.id === "customerName") {
      return (<span>{row.original.customerDetails?.firstName} {row.original.customerDetails?.lastName}</span>)
    } else if(cell.column.id === "serviceNo") {
      return (<span>{row.original.orderProductDetails?.[0]?.serviceDetails?.serviceNo}</span>)
    } else if(cell.column.id === "createdAt") {
      return (<span>{moment(row.original.createdAt).format('YYYY-MM-DD')}</span>)
    } else if(cell.column.id === "updatedAt") {
      return (<span>{moment(row.original.updatedAt).format('YYYY-MM-DD')}</span>)
    } else {
      return (<span>{cell.value}</span>);
    }
  }
  const handleSubmit = async (e) => {
    const resp = await post(`${properties.ORDER_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: { ...searchData } })

    if (resp.status === 200) {
      const { count, row } = resp.data
      if (count > 0) {
        setOrderList(row)
        setTotalCount(count)
      }
    }
  }
  return (
    <>
      <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
        <div className="row mt-2">
          <div className="col-lg-12">
            <div className="search-result-box m-t-30">
              <div id="searchBlock" className="modal-body p-2 d-block">
                <div className="d-flex justify-content-end">
                  <h6 className="cursor-pointer">Hide Search</h6>
                </div>
                <form>
                  <div className="row">
                    <div className="col">
                      <div className="text-muted font-20 pl-1 fld-imp mt-1 mb-2">
                        <span className="text-danger">*</span> Please provide
                        atleast one field
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="orderNo" className="control-label">
                          Order Number
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          maxlength="100"
                          className="form-control"
                          id="orderNo"
                          placeholder="Enter Order ID"
                          value={searchData.orderNo}
                          onChange={handleInputChange}
                        />
                        <span className="errormsg"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="orderCategory" className="control-label">
                          Order Category
                          <span className="error ml-1">*</span>
                        </label>
                        <select id="orderCategory" className="form-control"
                          value={searchData.orderCategory}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Order Category</option>
                          {
                            orderCategoryLookup.map((option) => (
                              <option key={option.code} value={option.code}>{option.description}</option>
                            ))
                          }
                        </select>
                        <span className="errormsg"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="orderType" className="control-label">
                          Order Type
                          <span className="error ml-1">*</span>
                        </label>
                        <select id="orderType" className="form-control"
                          value={searchData.orderType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Order Type</option>
                          {
                            orderTypeLookup.map((option) => (
                              <option key={option.code} value={option.code}>{option.description}</option>
                            ))
                          }
                        </select>
                        <span className="errormsg"></span>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="serviceNo" className="control-label">
                          Service Number
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          maxlength="100"
                          className="form-control"
                          id="serviceNo"
                          placeholder="Enter Service Number"
                          value={searchData.serviceNo}
                          onChange={handleInputChange}
                        />
                        <span className="errormsg"></span>
                      </div>
                    </div>

                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="customerNo" className="control-label">
                          Customer Number
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          maxlength="100"
                          className="form-control"
                          id="customerNo"
                          placeholder="Enter Customer Number"
                          value={searchData.customerNo}
                          onChange={handleInputChange}
                        />
                        <span className="errormsg"></span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="customerName" className="control-label">
                          Customer Name
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          maxlength="100"
                          className="form-control"
                          id="customerName"
                          placeholder="Enter Customer Name"
                          value={searchData.customerName}
                          onChange={handleInputChange}
                        />
                        <span className="errormsg"></span>
                      </div>
                    </div>
                    {/* <div className="col-md-3">
                      <div className="form-group">
                        <label for="servicenumber" className="control-label">
                          Service ID
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          maxlength="15"
                          className="form-control"
                          id="servicenumber"
                          placeholder="Enter Service ID "
                          type="text"
                          value={searchData.orderNo}
                          onChange={handleInputChange}
                          inputmode=""
                        />
                        <span className="errormsg"></span>
                      </div>
                    </div> */}
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="fromDate" className="control-label">
                          Created From
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          id="fromDate"
                          className="form-control"
                          value={searchData.fromDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="toDate" className="control-label">
                          Created To
                          <span className="error ml-1">*</span>
                        </label>
                        <input
                          type="date"
                          id="toDate"
                          className="form-control"
                          value={searchData.toDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="form-group">
                        <label for="orderStatus" className="control-label">
                          Order Status
                          <span className="error ml-1">*</span>
                        </label>
                        <select id="orderStatus" className="form-control"
                          value={searchData.orderStatus}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Order Status</option>
                          {
                            orderStatusLookup.map((option) => (
                              <option key={option.code} value={option.code}>{option.description}</option>
                            ))
                          }
                        </select>
                        <span className="errormsg"></span>
                      </div>
                    </div>
                  </div>
                  <div className="skel-btn-center-cmmn mt-2">
                    <button type="button" className="skel-btn-cancel">
                      Clear
                    </button>
                    <button type="button" className="skel-btn-submit" onClick={handleSubmit}>
                      Search
                    </button>
                  </div>
                </form>
              </div>
              <DynamicTable
                listKey={"Search Order"}
                row={orderList}
                rowCount={totalCount}
                header={columns}
                itemsPerPage={perPage}
                backendPaging={true}
                isScroll={false}
                backendCurrentPage={currentPage}
                handler={{
                  handleCellRender: handleCellRender,
                  handlePageSelect: handlePageSelect,
                  handleItemPerPage: setPerPage,
                  handleCurrentPage: setCurrentPage
                }} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const columns = [
  {
    Header: "Order No",
    accessor: "orderNo",
    disableFilters: true,
    id: "orderNo"
  },
  {
    Header: "Service ID",
    accessor: "serviceNo",
    disableFilters: true,
    id: "serviceNo"
  }, {
    Header: "Customer ID",
    accessor: "customerDetails.customerNo",
    disableFilters: true,
    id: "customerNo"
  }, {
    Header: "Customer Name",
    accessor: "customerDetails.firstName",
    disableFilters: true,
    id: "customerName"
  }, {
    Header: "Order Type",
    accessor: "orderType.description",
    disableFilters: true,
    id: "orderType"
  }, {
    Header: "Status",
    accessor: "orderStatus.description",
    disableFilters: true,
    id: "orderStatus"
  }, {
    Header: "Current Department",
    accessor: "currEntity.unitDesc",
    disableFilters: true,
    id: "currDept"
  }, {
    Header: "Assigned User",
    accessor: "currUser.firstName",
    disableFilters: true,
    id: "currUser"
  }, {
    Header: "Created By",
    accessor: "createdBy.firstName",
    disableFilters: true,
    id: "createdBy"
  }, {
    Header: "Created On",
    accessor: "orderDate",
    disableFilters: true,
    id: "createdAt"
  }, {
    Header: "Last Updated By",
    accessor: "updatedBy",
    disableFilters: true,
    id: "updatedBy"
  }, {
    Header: "Last Updated On",
    accessor: "updatedAt",
    disableFilters: true,
    id: "updatedAt"
  }
]