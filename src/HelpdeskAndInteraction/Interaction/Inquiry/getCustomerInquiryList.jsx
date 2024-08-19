import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import InlineSpinner from '../../../common/inline-spinner';
import { get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

import DynamicTable from "../../../common/table/DynamicTable";
import { CustomerInquiryColumns } from "./customerInquiryColumns";


function CustomerInquiryList(props) {

  const history = useNavigate();

  const customerDetails = props.data.customerDetails
  const [customerInquirydetails, setNewCustomerInquiryDetails] = useState([])
  const [inlineSpinnerData, setInlineSpinnerData] = useState({ state: false, message: '' })

  useEffect(() => {
    if (customerDetails && customerDetails.customerId) {
      setInlineSpinnerData({ state: true, message: 'Loading service requests...please wait...' })

      getCustomerInquiryList()

    }
  }, [customerDetails.customerId]);

  const getCustomerInquiryList = () => {

    get(properties.CUSTOMER_INQUIRY_API + `/${customerDetails.customerId}`)
      .then((resp) => {
        if (resp.data) {
          if (resp.status === 200) {
            toast.success("get customer Inquiry Successfully");
            setNewCustomerInquiryDetails([resp.data])

          } else {
            toast.error("Failed to call get Customer - " + resp.status);

          }
        } else {
          toast.error("Uexpected error ocurred " + resp.statusCode);

        }
        setInlineSpinnerData({ state: false, message: '' })
      }).catch(error => console.log(error));
  }
  const handleLinkClick = (e, rowData) => {
    const { leadId } = rowData;
    localStorage.setItem("leadID", leadId)
    history(`/edit-customer-inquiry`, {
      state: {
        data: {
          leadId
        }
      }
    })

  }

  const handleCellRender = (cell, row) => {
    if (cell.column.Header === "Lead ID") {
      return (<span className="text-primary cursor-pointer" onClick={(e) => handleLinkClick(e, row.original)}>{cell.value}</span>)
    } else {
      return (<span>{cell.value}</span>)
    }
  }

  return (
    <>
      {
        (customerInquirydetails && customerInquirydetails.length > 0) ?
          <DynamicTable row={customerInquirydetails} header={CustomerInquiryColumns}
            itemsPerPage={10}
            handler={{
              handleCellRender: handleCellRender,
              handleLinkClick: handleLinkClick
            }}
          />
          :
          <span className="msg-txt">No Service Requests Available</span>
      }
      {
        (inlineSpinnerData.state) ?
          <>
            <InlineSpinner data={inlineSpinnerData.message} />
          </>
          :
          <></>
      }
    </>
  );
}

export default CustomerInquiryList;
