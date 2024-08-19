import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { get, post } from "../../../common/util/restUtil";
import { properties } from "../../../properties";

import DynamicTable from "../../../common/table/DynamicTable";
import { InteractionListColumns, HiddenColumns, Order360PageInteractionListColumns } from "./TabColumns";
import { formatISODateDDMMMYY, formatISODateTime } from '../../../common/util/dateUtil'
import { useHistory } from "../../../common/util/history";

function Interactions(props) {
    const history = useHistory()
    const [interactions, setInteractions] = useState([])
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState();

    const customerDetails = props.data.customerDetails ? props.data.customerDetails : null;
    const subscriptionDetails = props.data.subscriptionDetails ? props.data.subscriptionDetails : null;

    useEffect(() => {
        if (customerDetails?.customerUuid || subscriptionDetails?.serviceUuid || customerDetails?.profileNo) {
            // if (customerDetails || subscriptionDetails) {
            post(`${properties?.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`, { searchParams: { customerUuid: customerDetails?.customerUuid, serviceUuid: subscriptionDetails?.serviceUuid, profileNo: customerDetails?.profileNo } })
                .then((resp) => {
                    if (resp && resp?.data) {
                        setTotalCount(resp?.data?.count)
                        setInteractions(resp?.data?.rows)
                    } else {
                        toast.error("Failed to fetch complaints - " + resp?.status);
                    }
                }).catch((error) => {
                    console.error(error)
                }).finally();
        }
    }, [currentPage, perPage, customerDetails?.customerUuid, subscriptionDetails?.serviceUuid, customerDetails?.profileNo]);
    // }, [currentPage, perPage, customerDetails, subscriptionDetails]);

    const redirectToInteractionPage = (data) => {
        history(`/interaction360`, { state: { data: { intxnNo: data?.intxnNo, intxnUuid: data?.intxnUuid, intxnId: data?.intxnId } } })
    }
    const redirectToHelpdeskPage = (data) => {
        history(`/view-helpdesk`, { state: { data } })
    }
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
        if (["Interaction No", 'Interaction ID'].includes(cell.column.Header)) {
            return (<span className="text-secondary cursor-pointer" onClick={() => redirectToInteractionPage(cell?.row?.original)}>{cell.value}</span>)
        } else if (cell.column.Header === 'Helpdesk ID') {
            return (<span className="text-secondary cursor-pointer" onClick={() => redirectToHelpdeskPage(cell?.row?.original)}>{cell.value || '-' }</span>)
        } else if (cell.column.Header === "Customer ID") {
            return (<span className="text-secondary cursor-pointer" onClick={() => redirectToCustomerPage(cell.value)}>{cell.value}</span>)
        } else if (cell?.column?.Header === "Created Date & Time") {
            return (<span>{formatISODateTime(cell?.value)}</span>)
        }
        else if (cell?.column?.Header === "Created By") {
            return (<span>{row?.original?.createdBy?.firstName + " " + row?.original?.createdBy?.lastName}</span>)
        }
        /*else if (cell?.column?.Header === "Action") {
            if (row?.original?.woType === "FAULT") {
                return (<button type="button"
                    className="btn btn-outline-primary waves-effect waves-light btn-sm"
                    onClick={() => {
    
                    }}
                >
                    Workflow History
                </button>
                )
            }
            else {
                return (<span></span>)
            }
        }*/
        else {
            return (<span>{!cell?.value ? '-' : cell?.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    return (
        <>

            {
                (interactions && interactions?.length > 0) ?
                    <DynamicTable
                        row={interactions}
                        rowCount={totalCount}
                        itemsPerPage={perPage}
                        backendPaging={true}
                        columnFilter={true}
                        backendCurrentPage={currentPage}
                        hiddenColumns={HiddenColumns}
                        header={props?.source === 'Order360' ? Order360PageInteractionListColumns : InteractionListColumns}
                        handler={{
                            handleCellRender: handleCellRender,
                            handlePageSelect: handlePageSelect,
                            handleItemPerPage: setPerPage,
                            handleCurrentPage: setCurrentPage,
                        }}
                    />
                    :
                    <span className="msg-txt">No Interactions Available</span>
            }
        </>
    );
}

export default Interactions;
