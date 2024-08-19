import React, { useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { unstable_batchedUpdates } from 'react-dom'
import { toast } from "react-toastify"
import { put } from "../../../../../common/util/restUtil"
import { properties } from "../../../../../properties"


const CancelInteraction = (props) => {
    const { setIsModelOpen, setRefresh, setWorkCompletionIsOpen } = props?.stateHandlers
    const { isModelOpen, lookupData, interactionDetails, refresh } = props?.data

    const [cancellationReason, setCancellationReason] = useState()

    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isCancelOpen: false })
            setCancellationReason()
            setWorkCompletionIsOpen(false)
            setRefresh(!refresh)
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!cancellationReason) {
            toast.error("Cancellation Reason is Mandatory")
            return
        }
        put(`${properties.INTERACTION_API}/cancel/${interactionDetails?.intxnNo}`, { cancelReason: cancellationReason })
            .then((response) => {
                toast.success(`${response.message}`)
                handleOnClose()
            }).catch((error) => {
                console.error(error);
            }).finally();
    }

    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isCancelOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Cancel Interaction - {interactionDetails?.intxnNo}</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="modal-body">
                    <hr className="cmmn-hline" />
                    <div className="clearfix"></div>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="cancel-info">
                                Once you cancel you can't reassign/change the status
                                again. <br />
                                Before proceeding to "Cancel" you must agree to proceed!
                            </div>
                        </div>
                    </div>
                    <div className="row pt-3">
                        <div className="col-md-12 pb-3">
                            <div className="form-group ">
                                <label htmlFor="cancellationReason" className="col-form-label" >Reason for Cancellation{" "}
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                <select value={cancellationReason} id="cancellationReason" className="form-control" onChange={(e) => setCancellationReason(e.target.value)} required>
                                    <option key="cancellationReason" value="">Select Cancel Reason</option>
                                    {lookupData?.current?.INTXN_STATUS_REASON && lookupData?.current?.INTXN_STATUS_REASON.map((e) => (
                                        <option key={e.code} value={e.code}> {e.description}</option>))}
                                </select>
                            </div>
                        </div>
                        <div className="col-md-12 pl-2">
                            <div className="form-group pb-1">
                                <div className="d-flex justify-content-center">
                                    <button type="button" className="skel-btn-cancel" onClick={handleOnClose}>Cancel </button>
                                    <button type="button" className="skel-btn-submit" onClick={handleSubmit}>Submit</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default CancelInteraction;