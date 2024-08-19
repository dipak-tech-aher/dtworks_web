import React, { useEffect, useRef, useState } from "react";
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from "react-hook-form";
import { get, put } from "../../common/util/restUtil";
import { properties } from "../../properties";
import { toast } from 'react-toastify';


const InvoicePaymentReversal = (props) => {
    const { data = {}, handler= {} } = props ?? {}
    const { isModelOpen = false, setIsModelOpen, invoiceData, setInvoiceData } = data ?? {}
    const { pageRefresh } = handler
    const [inputsDetails, setInputsDetails] = useState({ reversedReason: '', remarks: '' })
    const { register, handleSubmit, setValue, formState: { errors }, clearErrors, reset } = useForm()
    const masterLookupDataRef = useRef()

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INVOICE_CANCEL_REASON')
            .then((resp) => {
                if (resp?.status === 200) {
                    masterLookupDataRef.current = resp.data
                }
            }).catch((error) => console.error(error))
    }, [])

    const onSubmit = (e) => {
        // e.preventDefault()

        if (!invoiceData.invoiceId) {
            toast.error('kindly provide Invoice details')
            return false
        }

        if (!inputsDetails?.reversedReason) {
            toast.error('Please provide cancellation Reason')
            return false
        }
        const requestBody = { reason: inputsDetails?.reversedReason, remarks: inputsDetails?.remarks }

        put(`${properties.INVOICE_API}/reverse/${invoiceData.invoiceId}`, requestBody)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success('Payment Invoice updated Successfully')
                    handleOnClose()
                    pageRefresh()
                }
            })
            .catch(error => console.error(error))
    }

    const handleOnChange = (e) => {
        const target = e.target
        unstable_batchedUpdates(() => {
            setInputsDetails({ ...inputsDetails, [target.id]: target.value })
        })
    }

    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen(!isModelOpen)
            setInputsDetails({ reversedReason: '', remarks: '' })
            reset()
            setInvoiceData({})
            clearErrors()
        })
    }


    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Invoice Payment Reversal - {invoiceData?.invoiceId ?? ''}</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="mx-2">
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="clearfix"></div>
                        <div className="row pt-2">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="reversedReason" className="control-label">Reason For Cancellation<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control" id="reversedReason" value={inputsDetails?.reversedReason ?? ''} {...register("reversedReason", { required: 'This is required' })} onChange={handleOnChange}>
                                        <option value="">Please Select Reason</option>
                                        {masterLookupDataRef?.current?.INVOICE_CANCEL_REASON &&
                                            masterLookupDataRef?.current?.INVOICE_CANCEL_REASON?.map((reversedReason, index) => (
                                                <option key={index} value={reversedReason?.code}>{reversedReason?.description}</option>
                                            ))}
                                    </select>
                                    {errors?.reversedReason && <span className="errormsg">{errors.reversedReason.message}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="remarks" className="control-label">Remarks</label>
                                    <textarea className="form-control" onChange={handleOnChange} value={inputsDetails?.remarks ?? ''} maxLength="2500" id="remarks" name="remarks" rows="4"></textarea>
                                    <span className="skel-fnt-xs">Maximum 2500 characters</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-12 pl-2">
                            <div className="form-group pb-1">
                                <div className="d-flex justify-content-center">
                                    <button type="button" className="skel-btn-cancel" onClick={handleOnClose}>Cancel</button>
                                    <button type="submit" className="skel-btn-submit">Submit</button>
                                </div>
                            </div>
                        </div>
                    </Form>
                </div>
            </Modal.Body>
        </Modal>

    )
}

export default InvoicePaymentReversal