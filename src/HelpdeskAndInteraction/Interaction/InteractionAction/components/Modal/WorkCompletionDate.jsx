import React, { useState } from "react"
import { CloseButton, Modal, FormGroup } from 'react-bootstrap';
import moment from 'moment'
import { toast } from "react-toastify";
import { unstable_batchedUpdates } from "react-dom";
import { put } from "../../../../../common/util/restUtil";
import { properties } from "../../../../../properties";
import { useHistory } from "../../../../../common/util/history";
const WorkCompletionDate = (props) => {
    const history = useHistory()

    const { interactionDetails, workCompletionIsOpen, slaEdoc } = props?.data
    const { handleServiceOnClose, handleOnAssignToSelf, setWorkCompletionIsOpen } = props?.stateHandlers
    const [error, setError] = useState({})
    // console.log('interactionDetails', interactionDetails, interactionDetails?.edoc ? moment(interactionDetails?.edoc).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'))
    const [inputObj, setInputObj] = useState({ edoc: interactionDetails?.edoc });
    const handleInputChange = (e) => {
        unstable_batchedUpdates(() => {
            setInputObj({ ...inputObj, [e.target.id]: e.target.value })
            setError({ ...error, [e.target.id]: false })
        })
    }
    const handleSubmit = () => {
        try {
            let { edoc, workCompletionDate } = inputObj
            if (!edoc) {
                setError({ edoc: true });
                return false
            }
            if (!workCompletionDate) {
                setError({ workCompletionDate: true });
                return false
            }
            if (inputObj?.edoc) {
                const edoc = new Date(inputObj?.edoc);
                const userChoosedDate = new Date(inputObj?.workCompletionDate);
                if (!(edoc >= userChoosedDate)) { toast.info(`Work Completion should be less than or equal to ${moment(edoc).format('YYYY-MM-DD')}`); return false; }
                put(`${properties.INTERACTION_API}/update/work/completion`, {
                    intxnNo: interactionDetails?.intxnNo,
                    ...inputObj
                }).then(res => {
                    let { status, message } = res
                    if (status === 200) {
                        toast.success(message)
                        if (workCompletionIsOpen !== true) handleOnAssignToSelf?.(workCompletionIsOpen, true);
                        handleServiceOnClose()
                    }
                })

            } else {
                toast.info(`Please provide expected completion date`)
            }

        } catch (e) {
            console.log('error', e)
        }
    }
    // let max = interactionDetails?.edoc ? new Date(interactionDetails?.edoc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    // // console.log(max)
    const isOpen = Boolean(workCompletionIsOpen)
    return (<Modal aria-labelledby="contained-modal-title-vcenter" centered show={isOpen} dialogClassName="cust-sm-modal">
        <Modal.Header>
            <Modal.Title><h5 className="modal-title">Completion Dates</h5></Modal.Title>
            {/* <CloseButton onClick={handleServiceOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
            </CloseButton> */}
        </Modal.Header>
        <Modal.Body>
            <FormGroup>
                <label htmlFor="priorityCode" className="control-label">
                    Expected Completion Date<span className="text-danger font-20 pl-1 fld-imp">*</span>{" "}
                </label>
                <input type="date"
                    min={moment().format('YYYY-MM-DD')}
                    value={inputObj.edoc}
                    disabled={!!slaEdoc}
                    id="edoc"
                    className={`form-control `}
                    onChange={handleInputChange}
                />
                {error?.edoc && <span className="errormsg">Expected Completion Date is required</span>}
            </FormGroup>
            <FormGroup className="mt-2">
                <label htmlFor="priorityCode" className="control-label">
                    Work Completion Date<span className="text-danger font-20 pl-1 fld-imp">*</span>{" "}
                </label>
                <input type="date"
                    min={moment().format('YYYY-MM-DD')}
                    value={inputObj.workCompletionDate}
                    id="workCompletionDate"
                    className={`form-control `}
                    onChange={handleInputChange}
                />
                {error?.workCompletionDate && <span className="errormsg">Work completion date is required</span>}
            </FormGroup>
            <div className="d-flex mt-2 skel-btn-center-cmmn">
                <button
                    type="button"
                    className="skel-btn-cancel"
                    onClick={() => {
                        setWorkCompletionIsOpen(false)
                        // history("/")
                    }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="skel-btn-submit"
                    onClick={(e) => handleSubmit(e)}
                >
                    Submit
                </button>
            </div>
        </Modal.Body>
    </Modal>)

}

export default WorkCompletionDate;
