import React, { useState } from 'react'
import { unstable_batchedUpdates } from 'react-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { hideSpinner, showSpinner } from '../../../common/spinner';
import { properties } from '../../../properties';
import { remove } from '../../../common/util/restUtil';
import { RegularModalCustomStyles } from '../../../common/util/util';

const ReceiptReversal = (props) => {

    const { isOpen, receiptData } = props?.data
    const { setIsOpen, softRefresh } = props?.handler 
    const [reversedReason,setReversedReason] = useState("")

    const handleCancel = () => {
        setIsOpen(false)
    }

    const handleInputChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            setReversedReason(target.value)
        })
    }

    const handleSubmit = () => {
        if(!reversedReason) {
            toast.error('Please Provide the Reason for Reversal')
            return;
        } 
        showSpinner()
        remove(properties.RECEIPT_API + '/reverse/dtl/' + receiptData?.receiptDtlId + '?reason=' + reversedReason)
        .then((response) => {
            if(response.data) {
                toast.success('Receipt Reversal Successful')
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
                        <h4 className="modal-title">Receipt Reversal</h4>
                        <button type="button" className="close" onClick={handleCancel}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                   
                    <div className="modal-body">
                        <div className="modal-body p-2" style={{ display: "block" }}>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="reversedReason" className="col-form-label">Reversal Reason<span>*</span></label>
                                        <textarea id="reversedReason" className={`form-control mr-2`} placeholder="Please Enter Reason" value={reversedReason}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <br />
                            <div className='skel-btn-center-cmmn'>
                                <button className="skel-btn-cancel" type="button" onClick={handleCancel}>Cancel</button>
                                <button className="skel-btn-submit" onClick={handleSubmit}>Submit</button>&nbsp;&nbsp;
                                
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>


        </>
    )
}

export default ReceiptReversal