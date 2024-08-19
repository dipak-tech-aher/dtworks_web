import { useState } from "react";
import { CloseButton, Modal } from "react-bootstrap";
import { unstable_batchedUpdates } from "react-dom";
import { hideSpinner, showSpinner } from "../../common/spinner";
import DynamicTable from "../../common/table/DynamicTable";
import { properties } from "../../properties";
import { get } from '../../common/util/restUtil'

const InteractionList = (props) => {
    // const [interactionRequests, setInteractionRequests] = useState([])
    const { interactionList } = props?.data
    const [isOpen, setIsOpen] = useState(false)
    const [interactionDetails, setInteractionDetails] = useState([])
    const [interactionAddress, setInteractionAddress] = useState({})
    const [isShowWorkflow, setIsShowWorkflow] = useState(false)
    const isScroll = false

    const getTicketDetails = (ticketId) => {
        if (ticketId) {
            showSpinner()
            get(`${properties.CUSTOMER_API}/oms/details/${ticketId}`).then((resp) => {
                if (resp && resp?.data) {
                    const address = resp?.data?.addressDetails?.reduce((merged, ele) => { return { ...merged, ...ele } }, {})
                    setInteractionDetails(resp.data)
                    setInteractionAddress(address)
                }
            }).catch((error) => {
                console.error(error)
            }).finally(hideSpinner)
        }
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Interaction ID") {
            return (<span className="text-secondary cursor-pointer">{cell.value}</span>)
        } else if (cell.column.Header === "Created Date") {
            return (<span>{cell?.value ?? '-'}</span>)
        }
        else if (cell.column.Header === "Created By") {
            return (<span>{cell?.value}</span>)
        }
        else if (cell.column.Header === "Action") {
            return (
                <button type="button" className="btn btn-outline-primary waves-effect waves-light btn-sm"
                    onClick={(e) => { setIsOpen(true); handleLinkClick(e, row.original); }}>View</button>
            )
        }
        else {
            return (<span>{cell.value}</span>)
        }
    }

    const handleLinkClick = (e, rowData) => {
        getTicketDetails(rowData?.appId)
    }

    const handleModelClose = () => {
        unstable_batchedUpdates(() => {
            setIsOpen(false)
            setInteractionDetails([])
            setInteractionAddress({})
            setIsShowWorkflow(false)
        })
    };

    return (
        <>
            {
                (interactionList?.rows && interactionList?.rows?.length > 0) ?
                    <DynamicTable
                        isScroll={isScroll}
                        row={interactionList?.rows}
                        header={InteractionRequestColumns}
                        itemsPerPage={10}
                        handler={{
                            handleCellRender: handleCellRender,
                            handleLinkClick: handleLinkClick
                        }}
                    />
                    :
                    <p className="skel-widget-warning">No records found!!!</p>
                // <span className="msg-txt">No Interaction History Available</span>
            }
            {<Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpen} onHide={handleModelClose} dialogClassName='modal-fullscreen-xl'>
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Interaction Details for {interactionDetails?.ticketId}</h5></Modal.Title>
                    <CloseButton onClick={handleModelClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        <span>×</span>
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    {!!!isShowWorkflow && <>
                        <div className='row col-auto mx-auto'>
                            <button className={`btn btn-labeled btn-primary btn-sm mt-1`} onClick={() => { setIsShowWorkflow(true) }}>Workflow History</button>
                        </div>
                        <div className="cust360 col-lg-12 col-md-12 col-xs-12">
                            <div className="form-row">
                                <div className="col-12 pl-2 bg-light border mt-2">
                                    <h5 className="text-primary">Customer Details</h5>
                                </div>
                            </div>
                            <div className="row col-12 pt-1">
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Ticket Id</label>
                                        <p>{interactionDetails?.ticketId ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Service Number</label>
                                        <p>{interactionDetails?.serviceNumber ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Service Type</label>
                                        <p>{interactionDetails?.serviceType ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Current Department</label>
                                        <p>{interactionDetails?.currentDepartment ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Priority</label>
                                        <p>{interactionDetails?.priorityCode ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Expected Completion</label>
                                        <p>{interactionDetails?.expectedCompletionDate ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Problem Code</label>
                                        <p>{interactionDetails?.problemCode ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Nature Code</label>
                                        <p>{interactionDetails?.natureCode ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Clear Code</label>
                                        <p>{interactionDetails?.clearCode ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Cause Code</label>
                                        <p>{interactionDetails?.causeCode ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Status</label>
                                        <p>{interactionDetails?.currentStatus ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Ticket Type</label>
                                        <p>{interactionDetails?.ticketType ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-9">
                                    <div className="form-group">
                                        <label htmlFor="inputName" className="col-form-label">Ticket Description
                                        </label>
                                        <p>{interactionDetails?.ticketDescription ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="col-12 pt-2 pr-2">
                                    <div className=" bg-light border pr-2">
                                        <h5 className="text-primary pl-2">Customer Address</h5>
                                    </div>
                                </div>
                            </div>
                            <div className="row col-12 pt-1">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="FlatNo" className="col-form-label">Flat/House/Unit No</label>
                                        <p>{interactionAddress?.No ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="Simpang" className="col-form-label">Simpang</label>
                                        <p>{interactionAddress?.Simpang ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="Bandar" className="col-form-label">Jalan</label>
                                        <p>{interactionAddress?.Jalan ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="District" className="col-form-label">Kampung</label>
                                        <p>{interactionAddress?.Kampung ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="Mukim" className="col-form-label">District</label>
                                        <p>{interactionAddress?.District ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="Postcode" className="col-form-label">Postcode</label>
                                        <p>{interactionAddress['Post Code'] ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>}
                    {isShowWorkflow && <div className="timeline-workflow">
                        <div className='col-auto mx-auto' style={{ "float": "inline-end", "padding": "14px 39px 0px 0px" }}>
                            <button className={`btn btn-labeled btn-primary btn-sm mt-1`} onClick={() => { setIsShowWorkflow(false) }}>Transaction</button>
                        </div>
                        <ul>
                            {interactionDetails?.workflowHistory ? interactionDetails?.workflowHistory?.map((data) => (
                                <li>
                                    <div className="content">
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="Interactiontype" className="control-label">From Department/Role </label>
                                                    <span className="data-cnt">
                                                        {data?.from_dept || ""} -{" "}
                                                        {data?.from_role || ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="Servicetype" className="control-label">To Department/Role </label>
                                                    <span className="data-cnt">
                                                        {data?.to_dept || ""} -{" "}
                                                        {data?.to_role || ""}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="Servicetype" className="control-label">User</label>
                                                    <span className="data-cnt">
                                                        {data?.user_acted || ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="Servicetype" className="control-label">Status</label>
                                                    <span className="data-cnt">
                                                        {data?.assigned_status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label htmlFor="Servicetype" className="control-label">Action Performed</label>
                                                    <span className="data-cnt">
                                                        {data?.ticket_action}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-12">
                                                <div className="form-group">
                                                    <label htmlFor="Servicetype" className="control-label">Comments</label>
                                                    <span className="data-cnt">
                                                        {data?.comments}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="time">
                                        <h4>{data?.assigned_date || '-'}</h4>
                                    </div>
                                </li>
                            ))
                                : <p className="skel-widget-warning">No records found!!!</p>
                                // <span className='skel-widget-info'>No Workflow History available in OMS</span>
                            }
                        </ul>
                    </div>}
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={handleModelClose}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal >
            }
        </>
    )
}

export default InteractionList

const InteractionRequestColumns = [{
    Header: "Ticket ID",
    accessor: "appId",
    disableFilters: true
},
{
    Header: "Service Number",
    accessor: "pserviceNumber",
    disableFilters: true
},
{
    Header: "Service Type",
    accessor: "psrvcDispName",
    disableFilters: true
},
{
    Header: "Ticket Type",
    accessor: "tktTyp",
    disableFilters: true
},
{
    Header: "Created Date",
    accessor: "pcreatedDate",
    disableFilters: true
},
{
    Header: "Status",
    accessor: "status",
    disableFilters: true
},
{
    Header: "Action",
    accessor: "action",
    disableFilters: true
}]