import React, { useState } from "react";
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from "react-hook-form"
import { toast } from "react-toastify";
import { post } from "../../../../../common/util/restUtil";
import { properties } from "../../../../../properties";

const AddFollowUp = (props) => {
    //Props
    const { setIsModelOpen } = props?.stateHandlers
    const { isModelOpen, interactionDetails, lookupData } = props?.data
    const [followupInputs, setFollowupInputs] = useState()

    const { register, handleSubmit, control, value, formState: { errors },
        setError, clearErrors, reset, watch, setValue } = useForm()

    const handleOnClose = () => {
        reset()
        clearErrors()
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: false })
            setFollowupInputs({ priority: '', source: '', remarks: '' })
        })
    }

    const onSubmit = (data) => {
        const { priority, source, remarks } = followupInputs;
        if (!priority || !source || !remarks) {
            toast.error("Please provide mandatory fields")
            return
        }

        post(`${properties.INTERACTION_API}/followUp`, { priorityCode: priority, source, remarks, interactionNumber: interactionDetails?.intxnNo })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    handleOnClose()
                    // initialize();
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }

    const handleOnChange = (e) => {
        const { target } = e
        setFollowupInputs({ ...followupInputs, [target.id]: target.value })
    }


    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isAddFollowUpOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Add Interaction FollowUp</h5></Modal.Title>
                <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="modal-body">
                    {/* <hr className="cmmn-hline" />
                    <div className="clearfix"></div> */}
                    {/* <div className="row">
                        <div className="col-md-12 pt-2">
                            <p style={{ fontWeight: "600" }}>
                                You Currently have {followUpHistory?.count || 0}{" "}
                                <a style={{ textDecoration: "underline" }}>
                                    Followup(s)
                                </a>
                            </p>
                        </div>
                    </div> */}
                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <div className="row pt-3">
                            <div className="col-6">
                                <div className="form-group">
                                    <label htmlFor="priority" className="col-form-label">FollowUp Priority {" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                    </label>
                                    <select value={followupInputs?.priority ?? ''} id="priority" className="form-control" {...register("priority", { required: 'This is mandatory' })} onChange={handleOnChange}>
                                        <option key="priority" value="">Select Priority</option>
                                        {lookupData?.current?.FOLLOWUP_PRIORITY && lookupData?.current?.FOLLOWUP_PRIORITY.map((e) => (<option key={e.code} value={e.code}>{e.description}</option>))}
                                    </select>
                                    {errors.priority && <span className="errormsg">{errors.priority.message}</span>}
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="form-group">
                                    <label htmlFor="source" className="col-form-label">Source{" "}<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select id="source" className="form-control" value={followupInputs?.source ?? ''} {...register("source", { required: 'This is mandatory' })} onChange={handleOnChange}>
                                        <option key="source" value="">Select Source</option>
                                        {lookupData?.current?.TICKET_SOURCE && lookupData?.current?.TICKET_SOURCE.map((e) => (<option key={e.code} value={e.code}>{e.description}</option>))}
                                    </select>
                                    {errors.source && <span className="errormsg">{errors.source.message}</span>}
                                </div>
                            </div>
                            <div className="col-md-12 ">
                                <div className="form-group ">
                                    <label htmlFor="inputState" className="col-form-label pt-0">Remarks{" "}<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <textarea {...register("remarks", { required: 'This is mandatory' })} placeholder="Remarks" className="form-control" maxLength="2500" id="remarks" value={followupInputs?.remarks ?? ''} onChange={handleOnChange} name="remarks" rows="4"></textarea>
                                    <span>Maximum 2500 characters</span>
                                    {errors.remarks && <span className="errormsg">{errors.remarks.message}</span>}
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
                        </div>
                    </Form>
                </div>
            </Modal.Body>
        </Modal>
    )

}

export default AddFollowUp