import { useState } from 'react';
import FileUpload from '../common/uploadAttachment/fileUpload';
import Modal from 'react-modal';
import { properties } from '../properties';
import { toast } from 'react-toastify';
import { post } from '../common/util/restUtil';
import { RegularModalCustomStyles } from '../common/util/util';


const FollowupModel = (props) => {
    const accessToken = localStorage.getItem("accessToken")

    const { interactionData, isFollowupOpen, priorityLookup } = props?.data
    const { setIsFollowupOpen } = props?.handler

    const [followupInputs, setFollowupInputs] = useState({
        priority: "",
        source: "",
        remarks: ""
    })

    const [currentFiles, setCurrentFiles] = useState([])
    const [existingFiles, setExistingFiles] = useState([])

    const handleOnAddFollowup = (e) => {
        e.preventDefault();
        const { priority, remarks } = followupInputs;
        // console.log('followupInputs', followupInputs)
        if (!priority|| !remarks) {
            toast.error("Please provide mandatory fields");
            return;
        }
        let payload = {
            priorityCode: priority,
            source: 'CALL-CENTER',
            remarks,
            interactionNumber: interactionData?.intxnNo,
        };

        post(`${properties.INTERACTION_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    setIsFollowupOpen(false);
                    setFollowupInputs({
                        priority: "",
                        source: "",
                        remarks: "",
                    });
                    // initialize();
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    };

    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({
            ...followupInputs,
            [target.id]: target.value
        })
    }


    return (
        <>

            <Modal isOpen={isFollowupOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles}>
                <div className="modal-content tick-det">
                    <div className="page-title-box">
                        <h4 className="page title">Followup for complaint {interactionData?.intxnId}</h4>
                        <button type="button" className="close-btn" onClick={() => {
                            setIsFollowupOpen(false); setFollowupInputs({
                                priority: "",
                                source: "",
                                remarks: ""
                            })
                        }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body overflow-auto">
                        <form className="d-flex justify-content-center" onSubmit={handleOnAddFollowup}>
                            <div className="col-md-12 row form-group detailsbg-grey">
                                <div className="col-md-3 pl-0">
                                    <div className="form-group">
                                        <label htmlFor="priority" className="col-form-label">Followup Priority<span>*</span></label>
                                        <select required value={followupInputs?.priority} id="priority" className="form-control" onChange={handleOnFollowupInputsChange}>
                                            <option key="priority" value="">Select Priority</option>
                                            {
                                                priorityLookup && priorityLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>
                                <div className="col-3">
                                    <div className="form-group">
                                        <label htmlFor="Bandar" className="col-form-label">Channel</label>
                                        <p>CALL-CENTER</p>
                                    </div>
                                </div>
                                {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="source" className="col-form-label">Source<span>*</span></label>
                                                <select required id="source" className="form-control" value={followupInputs.source} onChange={handleOnFollowupInputsChange}>
                                                    <option key="source" value="">Select Source</option>
                                                    {
                                                        sourceLookup && sourceLookup.map((e) => (
                                                            <option key={e.code} value={e.code}>{e.description}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </div> */}
                                <div className="col-md-12 p-0">
                                    <div className="form-group">
                                        <h4 id="list-item-4">Attachments</h4>
                                        <div className="col">
                                            <FileUpload
                                                data={{
                                                    currentFiles,
                                                    entityType: 'COMPLAINT',
                                                    interactionId: interactionData?.intxnId,
                                                    permission: false,
                                                    shouldGetExistingFiles: false,
                                                    // refresh: attachmentRefresh
                                                }}
                                                handlers={{
                                                    setCurrentFiles,
                                                    setExistingFiles
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-12 p-0">
                                    <div className="form-group ">
                                        <label htmlFor="inputState" className="col-form-label pt-0">Remarks</label>
                                        <textarea className="form-control" maxLength='2500' id="remarks" value={followupInputs?.remarks} onChange={handleOnFollowupInputsChange} name="remarks" rows="4"></textarea>
                                        <span>Maximum 2500 characters</span>
                                    </div>
                                </div>
                                <div className="col-md-12 pl-2">
                                    <div className="form-group pb-1">
                                        <div className="d-flex justify-content-center">
                                            <button type="button" className="skel-btn-close" onClick={() => setIsFollowupOpen(false)}>Cancel</button>
                                            <button type="submit" className="skel-btn-submit">Add Followup</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </Modal>

        </>
    )
}
export default FollowupModel