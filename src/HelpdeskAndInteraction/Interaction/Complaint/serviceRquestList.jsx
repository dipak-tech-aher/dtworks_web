import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router";
import { toast } from "react-toastify";

import InlineSpinner from '../../common/inline-spinner';
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";

import DynamicTable from "../../common/table/DynamicTable";
import { ServiceRequestColumns, SRHiddenColumns } from "./serviceRequestColumns";
import WorkflowHistory from "./workflowHistory";
import { formatISODateDDMMMYY, formatISODateTime } from '../../common/util/dateUtil'

function ServiceRequestList(props) {

  const leftNavCounts = props.handler.leftNavCounts
  const setLeftNavCounts = props.handler.setLeftNavCounts
  const refreshList = props.data.refreshList
  const refreshServiceRequest = props.data.refreshServiceRequest

  const customerDetails = props.data.customerDetails

  const selectedAccount = props.data.selectedAccount
  const isScroll = props?.data?.isScroll
  const activeService = props.data.activeService
  let value = ""

  const history = useNavigate();
  const [workFlowData, setWorkFlowData] = useState()
  const [isOpen, setIsOpen] = useState(false)
  const [serviceRequests, setServiceRequests] = useState([])
  const [inlineSpinnerData, setInlineSpinnerData] = useState({ state: false, message: '' })

  useEffect(() => {

    if (customerDetails && customerDetails.customerId && selectedAccount && selectedAccount.accountId && activeService) {
      setInlineSpinnerData({ state: true, message: 'Loading service requests...please wait...' })
      get(properties.SERVICE_REQUEST_LIST_BY_CUSTOMER + '/' + customerDetails.customerId +
        '?intxn-type=REQSR&account-id=' + selectedAccount.accountId + '&service-id=' + activeService)
        .then((resp) => {
          if (resp && resp.data) {
            let serviceRequest = resp.data.filter((item) => item.intxnType === "REQSR")
            // console.log("response : ",serviceRequest)
            setServiceRequests(serviceRequest)
            //setServiceRequests(resp.data)
            setLeftNavCounts({ ...leftNavCounts, srCount: serviceRequest.length })
          } else {
            toast.error("Failed to fetch Service Requests - " + resp.status);
          }
          setInlineSpinnerData({ state: false, message: '' })
        }).catch(error => console.log(error)).finally();
    }
  }, [customerDetails, refreshServiceRequest, selectedAccount, activeService]);


  const handleLinkClick = (e, rowData) => {
    const { intxnId, Connection, accountDetails, srType, workOrderType, intxnType } = rowData;
    const { accountId } = accountDetails;
    const { description } = srType;
    const isAdjustmentOrRefund = ['Adjustment', 'Refund'].includes(workOrderType.description) ? true : ['Fault'].includes(workOrderType.description) && intxnType === 'REQSR' ? true : false;
    history(`/edit-${description.toLowerCase().replace(' ', '-')}`, {
      state: {
        data: {
          customerId: customerDetails.customerId,
          serviceId: Connection.connectionId,
          interactionId: intxnId,
          accountId,
          type: isAdjustmentOrRefund ? 'complaint' : description.toLowerCase(),
          woType: rowData.woType,
          isAdjustmentOrRefund,
          row: rowData
        }
      }
    })
  }

  const handleCellRender = (cell, row) => {
    if (cell.column.Header === "Interaction ID") {
      return (<span className="text-secondary cursor-pointer" onClick={(e) => handleLinkClick(e, row.original)}>{cell.value}</span>)
    } else if (cell.column.Header === "Created Date") {
      return (<span>{formatISODateTime(cell.value)}</span>)
    }
    else if (cell.column.Header === "Created By") {
      return (<span>{row.original.userId.firstName + " " + row.original.userId.lastName}</span>)
    }
    else if (cell.column.Header === "Action") {
      return (<button type="button"
        className="btn btn-outline-primary waves-effect waves-light btn-sm"
        onClick={() => {
          setIsOpen(true);
          // console.log(row.original)
          setWorkFlowData(row.original);
        }}
      >
        Workflow History
      </button>
      )
    }
    else {
      return (<span>{cell.value}</span>)
    }
  }

  return (
    <>
      {
        (serviceRequests && serviceRequests.length > 0) ?
          <DynamicTable
            isScroll={isScroll}
            row={serviceRequests}
            header={ServiceRequestColumns}
            hiddenColumns={SRHiddenColumns}
            itemsPerPage={10}
            handler={{
              handleCellRender: handleCellRender,
              handleLinkClick: handleLinkClick
            }}
          />
          :
          <span className="msg-txt">No Request Available</span>
      }
      {
        (inlineSpinnerData.state) ?
          <>
            <InlineSpinner data={inlineSpinnerData.message} />
          </>
          :
          <></>
      }
      {
        isOpen ?
          <WorkflowHistory workFlowData={workFlowData} isOpen={isOpen} setIsOpen={setIsOpen} />
          :
          <></>
      }
    </>
  );
}

export default ServiceRequestList;
