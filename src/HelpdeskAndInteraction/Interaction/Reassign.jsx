import Modal from "react-modal";


export const Reassign = (props) => {
    const { isReAssignOpen, interactionData, RegularModalCustomStyles, reAssignInputs, reAssignUserLookup } = props?.data
    const { setIsReAssignOpen, handleOnReAssignInputsChange, handleOnReAssign } = props?.handlers
    return <Modal
        isOpen={isReAssignOpen}
        contentLabel="Followup Modal"
        style={RegularModalCustomStyles}
    >
        <div
            className="modal-center"
            id="reassignModal"
            tabIndex="-1"
            role="dialog"
            aria-labelledby="reassignModal"
            aria-hidden="true"
        >
            <div className="modal-dialog " role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="reassignModal">
                            Re-assign for Interaction No - {interactionData?.intxnNo}
                        </h5>
                        <button
                            type="button"
                            className="close"
                            data-dismiss="modal"
                            aria-label="Close"
                            onClick={() => setIsReAssignOpen(false)}
                        >
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body">
                        <hr className="cmmn-hline" />
                        <div className="clearfix"></div>
                        <div className="row pt-4">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label htmlFor="reAssignUser" className="control-label">
                                        User{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <select
                                        required
                                        value={reAssignInputs.userId}
                                        id="reAssignUser"
                                        className="form-control"
                                        onChange={handleOnReAssignInputsChange}
                                    >
                                        <option key="reAssignUser" value="">
                                            Select User
                                        </option>
                                        {reAssignUserLookup &&
                                            reAssignUserLookup.map((user) => (
                                                <option key={user.userId} value={user.userId}>
                                                    {user?.firstName || ""} {user?.lastName || ""}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-12 pl-2 mt-2">
                            <div className="form-group pb-1">
                                <div className="d-flex justify-content-center">
                                    <button
                                        type="button"
                                        className="skel-btn-cancel"
                                        onClick={() => setIsReAssignOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="skel-btn-submit"
                                        onClick={handleOnReAssign}
                                    >
                                        Submit
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Modal>
}