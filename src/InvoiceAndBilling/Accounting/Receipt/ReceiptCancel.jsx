import React, { useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import { properties } from '../../../properties';
import { remove } from '../../../common/util/restUtil';
import { RegularModalCustomStyles } from '../../../common/util/util';

const ReceiptCancel = (props) => {

    const { isOpen, receiptData } = props?.data
    const { setIsOpen, softRefresh } = props?.handler 
    const [cancelledReason,setCancelledReason] = useState("")

    const handleCancel = () => {
        setIsOpen(false)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            setCancelledReason(target.value)
        })
    }

    const handleSubmit = () => {
        if(!cancelledReason) {
            toast.error('Please Provide the Reason for Cancellation')
            return;
        } 
        showSpinner()
        remove(properties.RECEIPT_API + '/cancel/' + receiptData?.receiptId + '?reason=' + cancelledReason)
        .then((response) => {
            if(response.data) {
                toast.success('Receipt Cancellation Successful')
                softRefresh()
                setIsOpen(false)
            }
            })
        .catch(error => {
            console.error(error);
        })
        .finally(hideSpinner)
    }

    return (
        <>
            <Modal style={RegularModalCustomStyles} isOpen={isOpen} onRequestClose={handleCancel} contentLabel="Receipt Cancel">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Receipt Cancellation</h4>
                        <button type="button" className="close" onClick={handleCancel}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        <div className="modal-body p-2" style={{ display: "block" }}>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="cancelledReason" className="col-form-label">Cancellation Reason<span>*</span></label>
                                        <textarea id="cancelledReason" className={`form-control mr-2`} placeholder="Please Enter Reason" value={cancelledReason}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <br />
                            <div style={{ display: "flex", justifyContent: "center" }}>
                                <button className="skel-btn-cancel" type="button" onClick={handleCancel}>Cancel</button>
                                <button className="skel-btn-submit" onClick={handleSubmit}>Submit</button>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>


        </>
    )
}

export default ReceiptCancel