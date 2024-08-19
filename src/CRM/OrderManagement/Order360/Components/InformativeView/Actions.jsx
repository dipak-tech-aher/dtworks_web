import React, { useContext, useEffect, useState } from 'react'
import { AppContext, Order360Context } from '../../../../../AppContext';
import { get, post, put } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { toast } from 'react-toastify';
import Modal from "react-modal";
import { RegularModalCustomStyles } from '../../../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import moment from "moment";

import EditOrder from './EditOrder';
export default function Actions() {
    let { data = {}, handlers } = useContext(Order360Context), { permissions, orderData, masterDataLookup = {}, interactionInputs } = data, { initialize } = handlers, { TICKET_SOURCE: sourceLookup, TICKET_PRIORITY: priorityLookup, ORD_STATUS_REASON: cancellationReasonLookup } = masterDataLookup;
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [followupInputs, setFollowupInputs] = useState({ priority: "", source: "", remarks: "" });
    const [followUpHistory, setFollowUpHistory] = useState({ rows: [], count: 0 });
    const [workflowHistory, setWorkflowHistory] = useState({ rows: [], count: 0 });
    const [isFollowUpHistoryOpen, setIsFollowUpHistoryOpen] = useState(false);
    const [isWorflowHistoryOpen, setIsWorkflowHistoryOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [cancellationReason, setCancellationReason] = useState();
    const [isReAssignOpen, setIsReAssignOpen] = useState(false);
    const [reAssignUserLookup, setReAssignUserLookup] = useState();
    const [reAssignInputs, setReAssignInputs] = useState({ userId: "" });
    const [userLookup, setUserLookup] = useState();
    const [editOrder, setEditOrder] = useState(false);
    const [error, setError] = useState({});
    useEffect(() => {
        try {
            if (orderData && orderData?.orderNo) {
                //get followup history
                get(`${properties.ORDER_API}/history/${orderData?.orderNo}?getFollowUp=true`)
                    .then((response) => {
                        if (response?.data && response?.data) {
                            setFollowUpHistory(response?.data);
                        }
                    }).catch((error) => {
                        console.error(error);
                    }).finally();
                // get workflow history
                get(`${properties.ORDER_API}/history/${orderData?.orderNo}`)
                    .then((response) => {
                        if (response?.data && response?.data) {
                            setWorkflowHistory(response?.data);
                        }
                    }).catch((error) => {
                        console.error(error);
                    }).finally();
            }


        } catch (e) {
            console.log('error', e)
        }
    }, [orderData])

    const handleOnAssignToSelf = (types) => {
        put(`${properties.ORDER_API}/assignSelf`, { order: [{ orderNo: orderData?.orderNo, type: types }] })
            .then((response) => {
                toast.success(`${response.message}`);
                initialize?.();
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    };
    const handleOnAddFollowup = (e) => {
        e.preventDefault();
        const { priority, source, remarks } = followupInputs;
        if (!priority || !source || !remarks) {
            toast.error("Please provide mandatory fields");
            return;
        }
        let payload = {
            priorityCode: priority,
            source,
            remarks,
            orderNo: orderData?.orderNo,
        };

        post(`${properties.ORDER_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    unstable_batchedUpdates(() => {
                        setIsFollowupOpen(false);
                        setFollowupInputs({ priority: "", source: "", remarks: "" });
                    })

                    initialize?.();
                }
            }).catch((error) => {
                console.error(error);
            }).finally();
    };
    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({ ...followupInputs, [target.id]: target.value });
    };
    const handleOnCancel = () => {
        try {
            if (!cancellationReason) {
                toast.error("Cancellation Reason is Mandatory");
                return;
            }
            const payload = { cancelReason: cancellationReason };

            put(`${properties.ORDER_API}/cancel/${orderData?.orderNo}`, payload)
                .then((response) => {
                    toast.success(`${response.message}`);
                    setIsCancelOpen(false);
                    initialize();
                })
                .catch((error) => {
                    console.error(error);
                }).finally();
        } catch (e) {
            console.log('error', e)
        }

    };
    const handleOnReAssignInputsChange = (e) => {
        const { target } = e;
        setReAssignInputs({ userId: target.value });
    };
    const getUsersBasedOnRole = (source = undefined) => {
        const data = source ? { roleId: orderData?.currRole?.roleId, deptId: orderData?.currEntity?.unitId } : { roleId: interactionInputs.assignRole, deptId: interactionInputs.assignDept };

        get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
            .then((userResponse) => {
                const { data } = userResponse;
                if (source) {
                    setReAssignUserLookup(data.filter((x) => x.userId !== orderData?.currentUser?.code));
                } else {
                    setUserLookup(data);
                    // if (isRoleChangedByUserRef.current) {
                    //     if (data.length === 1) {
                    //         setInteractionInputs({ ...interactionInputs, user: data[0].userId, });
                    //     }
                    // }
                }
            }).catch(error => console.log(error))
            .finally();
    };
    useEffect(() => {
        if (interactionInputs.assignRole !== "") {
            getUsersBasedOnRole();
        } else {
            setUserLookup([]);
        }
        if (isReAssignOpen) {
            getUsersBasedOnRole("RE-ASSIGN");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interactionInputs.assignRole, isReAssignOpen]);

    const handleOnReAssign = (e) => {
        try {
            e.preventDefault();
            const { userId } = reAssignInputs;
            let payload = { userId: userId, roleId: orderData?.currRole?.roleId, departmentId: orderData?.currEntity?.unitId, status: "REASSIGNED", remarks: "Reassigned to User", };
            if (!userId) {
                toast.error("User is Mandatory");
                return;
            }

            put(`${properties.ORDER_API}/edit/${orderData?.orderNo}`, { ...payload })
                .then((response) => {
                    toast.success(`${response.message}`);
                    setIsReAssignOpen(false);
                    initialize();
                }).catch((error) => {
                    console.error(error);
                }).finally();
        } catch (e) {
            console.log('error', e)
        }

    };

    return (
        <div className="skel-flex-card-wrap">
            <div className="skel-btns">
                {!["CLS", "CNCLED"].includes(orderData?.orderStatus?.code) && (
                    <>
                        <button className="skel-btn-cancel" onClick={() => setIsCancelOpen(true)}>Cancel Order</button>
                        {(!!!['CLS', 'CNCLED'].includes(orderData?.orderStatus?.code) &&!permissions?.readOnly )&& <button className="skel-btn-submit" onClick={() => setEditOrder(true)}>   Edit Order</button>}
                        {permissions?.assignToSelf && <button className="skel-btn-submit" onClick={() => handleOnAssignToSelf("SELF")}>
                            Assign To Self
                        </button>}
                        {permissions?.reAssign && <button className={`skel-btn-submit `} onClick={() => setIsReAssignOpen(true)}>
                            Re-Assign
                        </button>}
                        {permissions?.followup && <button className="skel-btn-submit" onClick={() => setIsFollowupOpen(true)}>
                            Add Follow-up
                        </button>}
                    </>
                )}

                <button className="skel-btn-submit" onClick={() => setIsWorkflowHistoryOpen(true)}>
                    Workflow/Follow-up History
                </button>
            </div>
            {/* FOllowup And WorkFlow History */}
            <Modal isOpen={isFollowupOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles} ariaHideApp={false}
            >
                <div
                    className="modal-center"
                    id="cancelModal"
                    tabIndex="-1"
                    role="dialog"
                    aria-labelledby="cancelModal"
                    aria-hidden="true"
                >
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="cancelModal">
                                    Followup for Order No {orderData?.orderNo}
                                </h5>
                                <button
                                    type="button"
                                    className="close"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setIsFollowupOpen(false)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <hr className="cmmn-hline" />
                                <div className="clearfix"></div>
                                <div className="row">
                                    <div className="col-md-12 pt-2">
                                        <p style={{ fontWeight: "600" }}>
                                            You Currently have {followUpHistory?.count || 0}{" "}
                                            <span style={{ textDecoration: "underline" }}>
                                                Followup(s)
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                <div className="row pt-3">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                FollowUp Priority{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                value={followupInputs.priority}
                                                id="priority"
                                                className="form-control"
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="priority" value="">
                                                    Select Priority
                                                </option>
                                                {priorityLookup && priorityLookup.map((e) => (
                                                    <option key={e.code} value={e.code}>
                                                        {e.description}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="source" className="col-form-label">
                                                Source{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                id="source"
                                                className="form-control"
                                                value={followupInputs.source}
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="source" value="">
                                                    Select Source
                                                </option>
                                                {sourceLookup &&
                                                    sourceLookup.map((e) => (
                                                        <option key={e.code} value={e.code}>
                                                            {e.description}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12 ">
                                        <div className="form-group ">
                                            <label
                                                htmlFor="inputState"
                                                className="col-form-label pt-0"
                                            >
                                                Remarks{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                required
                                                className="form-control"
                                                maxLength="2500"
                                                id="remarks"
                                                value={followupInputs?.remarks}
                                                onChange={handleOnFollowupInputsChange}
                                                name="remarks"
                                                rows="4"
                                            ></textarea>
                                            <span>Maximum 2500 characters</span>
                                        </div>
                                    </div>
                                    <div className="col-md-12 pl-2">
                                        <div className="form-group pb-1">
                                            <div className="d-flex justify-content-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary waves-effect waves-light mr-2"
                                                    onClick={handleOnAddFollowup}
                                                >
                                                    Submit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-light waves-effect waves-light"
                                                    onClick={() => setIsFollowupOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            <Modal isOpen={isWorflowHistoryOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles} ariaHideApp={false}>
                <>
                    <div className="modal-content">
                        <div className="modal-header px-4 border-bottom-0 d-block">
                            <button type="button" className="close" data-dismiss="modal" aria-hidden="true" onClick={() => setIsWorkflowHistoryOpen(false)}>
                                &times;
                            </button>
                            <h5 className="modal-title">
                                {!isFollowUpHistoryOpen ? "Workflow History" : "Followup History"}{" "}
                                for Order No {orderData?.orderNo}
                            </h5>
                        </div>
                        <div className="modal-body px-4">
                            <div className="row">
                                <div className="col-md-12 pull-right">
                                    <button type="button" className="skel-btn-submit"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (followUpHistory?.count === 0 || !followUpHistory) {
                                                toast.error("No follow-up is available for this order.");
                                                return;
                                            }
                                            setIsFollowUpHistoryOpen(!isFollowUpHistoryOpen);
                                        }}
                                    >
                                        {!isFollowUpHistoryOpen ? `Followup History - ${followUpHistory?.count || 0}` : `WorkFlow History - ${workflowHistory?.count || 0}`}
                                    </button>
                                </div>
                            </div>
                            {!isFollowUpHistoryOpen ? (
                                <div className="timeline-workflow">
                                    <ul>
                                        {workflowHistory?.rows && workflowHistory?.rows.length > 0 && workflowHistory?.rows.map((data, idx) => (
                                            <li key={idx}>
                                                <div className="content">
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label htmlFor="Interactiontype" className="control-label">From Department/Role</label>
                                                                <span className="data-cnt">{data?.fromEntityId?.unitDesc || ""} -{" "}{data?.fromRoleId?.roleDesc || ""}</span>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label htmlFor="Servicetype" className="control-label">To Department/Role</label>
                                                                <span className="data-cnt">
                                                                    {data?.fromEntityId?.unitDesc || ""} -{" "}
                                                                    {data?.toRoleId?.roleDesc || ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label htmlFor="Channel" className="control-label">
                                                                    User
                                                                </label>
                                                                <span className="data-cnt">
                                                                    {data?.createdByDescription?.firstName || ''} {data?.createdByDescription?.lastName || ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label
                                                                    htmlFor="Interactiontype"
                                                                    className="control-label"
                                                                >
                                                                    Status
                                                                </label>
                                                                <span className="data-cnt">
                                                                    {data?.orderStatus?.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="form-group">
                                                                <label
                                                                    htmlFor="Servicetype"
                                                                    className="control-label"
                                                                >
                                                                    Action Performed
                                                                </label>
                                                                <span className="data-cnt">
                                                                    {data?.flowActionDesc?.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="row">
                                                        <div className="col-md-12">
                                                            <div className="form-group">
                                                                <label
                                                                    htmlFor="Interactiontype"
                                                                    className="control-label"
                                                                >
                                                                    Comments
                                                                </label>
                                                                <span className="data-cnt">
                                                                    {data?.remarks}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="time">
                                                    <h4>
                                                        {data?.createdAt ? moment(
                                                            data?.createdAt
                                                        ).format("DD MMM YYYY hh:mm:ss A") : 'NA'}
                                                    </h4>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="timeline-workflow">
                                    <ul>
                                        {followUpHistory?.rows &&
                                            followUpHistory?.rows?.length > 0 &&
                                            followUpHistory?.rows?.map((data, idx) => (
                                                <li key={idx}>
                                                    <div className="content">
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Interactiontype"
                                                                        className="control-label"
                                                                    >
                                                                        From Department/Role
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.fromEntityId?.unitDesc || ""} -{" "}{data?.fromRoleId?.roleDesc || ""}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Servicetype"
                                                                        className="control-label"
                                                                    >
                                                                        To Department/Role
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.fromEntityId?.unitDesc || ""} -{" "}{data?.fromRoleId?.roleDesc || ""}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Channel"
                                                                        className="control-label"
                                                                    >
                                                                        User
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.createdByDescription?.firstName || ''} {data?.createdByDescription?.lastName || ''}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Interactiontype"
                                                                        className="control-label"
                                                                    >
                                                                        Status
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.orderStatus?.description}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Servicetype"
                                                                        className="control-label"
                                                                    >
                                                                        Action Performed
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.flowActionDesc?.description}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="row">
                                                            <div className="col-md-12">
                                                                <div className="form-group">
                                                                    <label
                                                                        htmlFor="Interactiontype"
                                                                        className="control-label"
                                                                    >
                                                                        Comments
                                                                    </label>
                                                                    <span className="data-cnt">
                                                                        {data?.remarks}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="time">
                                                        <h4>
                                                            {data?.createdAt ? moment(
                                                                data?.createdAt
                                                            ).format("DD MMM YYYY hh:mm:ss A") : 'NA'}
                                                        </h4>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            </Modal>
            {/** Cancel Order */}
            <Modal isOpen={isCancelOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles}      >
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="followupModal">
                            Cancellation for Order No - {orderData?.orderNo}
                        </h5>
                        <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => setIsCancelOpen(false)}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
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
                                    <label
                                        htmlFor="cancellationReason"
                                        className="col-form-label"
                                    >
                                        Reason for Cancellation{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <select value={cancellationReason} id="cancellationReason" className="form-control" onChange={(e) => setCancellationReason(e.target.value)} required>
                                        <option key="cancellationReason" value=""> Select Reason</option>
                                        {cancellationReasonLookup && cancellationReasonLookup.map((e) => (
                                            <option key={e.code} value={e.code}>
                                                {e.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-12 pl-2 skel-btn-center-cmmn">
                                <button type="button" className="skel-btn-cancel" onClick={() => setIsCancelOpen(false)}>Cancel</button>
                                <button
                                    type="button"
                                    className="skel-btn-submit"
                                    onClick={handleOnCancel}
                                >
                                    Submit
                                </button>


                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            {/** Reassign */}
            <Modal isOpen={isReAssignOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles}>
                <div className="modal-center"
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
                                    Re-assign for order No - {orderData?.orderNo}
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
                                                        <option key={user?.userId} value={user.userId}>
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
                                                className="btn btn-primary waves-effect waves-light mr-2"
                                                onClick={handleOnReAssign}
                                            >
                                                Submit
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-light waves-effect waves-light"
                                                onClick={() => setIsReAssignOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            {/** Reassign */}
            <Modal isOpen={editOrder} contentLabel="Followup Modal" style={RegularModalCustomStyles}>
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="reassignModal">
                                Edit Order
                            </h5>
                            <button type="button" className="close" onClick={() => setEditOrder(!editOrder)}>
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="clearfix" />

                            <EditOrder onClose={() => setEditOrder(!editOrder)} userLookup={userLookup} />

                        </div>

                    </div>

                </div>

            </Modal>
        </div>
    )
}
