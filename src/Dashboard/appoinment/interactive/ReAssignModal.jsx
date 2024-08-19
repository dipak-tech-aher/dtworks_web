import React, { useState, useContext, useEffect } from 'react';
import { properties } from "../../../properties";
import { post, get } from "../../../common/util/restUtil";
import { AppContext } from "../../../AppContext";
import { toast } from 'react-toastify';
import { Modal, CloseButton } from 'react-bootstrap';

const ReAssignModal = (props) => {
    const { selectedCustomer, isOpen, isUpcomingRefresh, statusReason } = props.data;
    const { setIsOpen, setIsUpcomingRefresh } = props.handlers;
    const { auth } = useContext(AppContext);

    const [reAssignInputs, setReAssignInputs] = useState({
        userId: ""
    });

    const [reAssignUserLookup, setReAssignUserLookup] = useState();

    useEffect(() => {
        getAvailableAgents();
    }, [props])

    const getAvailableAgents = () => {
        if (selectedCustomer?.appoint_id) {
            post(`${properties.APPOINTMENT_API}/available-agent`, {
                "startTime": selectedCustomer?.appoint_start_time,
                "endTime": selectedCustomer?.appoint_end_time,
                "mode": selectedCustomer?.appoint_mode,
                "location": selectedCustomer?.location,
                "date": selectedCustomer?.appoint_date || new Date(),
                "appointId": selectedCustomer?.appoint_id
            }).then((userResponse) => {
                const { data } = userResponse;
                setReAssignUserLookup(data)
            }).catch((error) => {
                console.log(error)
            });
        }
    }


    const handleOnReAssignInputsChange = (e) => {
        const { target } = e;
        setReAssignInputs({
            userId: target.value
        })
    }

    const reAssignAppoinment = (e) => {
        post(`${properties.APPOINTMENT_API}/re-assign-appoinment`, {
            "appointTxnId": selectedCustomer?.appoint_txn_id,
            "agentId": reAssignInputs?.userId,
            // "departmentId": selectedCustomer?.appoinmentModeDesc?.code,
            // "roleId": selectedCustomer?.appointmentHdrDetails?.location
        }).then((userResponse) => {
            toast.success(userResponse?.message);
            document.getElementById('reAssignBtn').click();
            setIsOpen(!isOpen)
            setIsUpcomingRefresh(!isUpcomingRefresh);
        }).catch((error) => {
            console.log(error)
        })
    }


    const initialFormData = {
        agentId: '',
        statusReason: '',
        appointTxnId: selectedCustomer?.appoint_txn_id,
    }
    const [formData, setFormData] = useState(initialFormData);

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmitForm = (e) => {
        e.preventDefault();

        // Validate form data
        const newErrors = {};
        if (!formData.agentId) {
            newErrors.agentId = 'user is required';
        }
        if (!formData.statusReason) {
            newErrors.statusReason = 'Status Reason is required';
        }

        // If there are errors, update the state
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
        } else {
            // Submit the form or perform other actions
            post(`${properties.APPOINTMENT_API}/re-assign-appoinment`, {
                "agentId": formData?.agentId,
                "statusReason": formData?.statusReason,
                "appointTxnId": formData?.appointTxnId,
                // "departmentId": selectedCustomer?.appoinmentModeDesc?.code,
                // "roleId": selectedCustomer?.appointmentHdrDetails?.location
            }).then((userResponse) => {
                toast.success(userResponse?.message);
                document.getElementById('reAssignBtn').click();
                setIsOpen(!isOpen)
                setIsUpcomingRefresh(!isUpcomingRefresh);
            }).catch((error) => {
                console.log(error)
            })
        }
    };

    return (
        <Modal show={isOpen} className="right skel-view-rh-modal">
            <Modal.Header>
                <Modal.Title>Re-assign for Interaction ID {selectedCustomer?.tran_category_no}</Modal.Title>
                <CloseButton onClick={() => setIsOpen(false)}><span aria-hidden="true">×</span></CloseButton>
            </Modal.Header>
            <Modal.Body>
                <div className="clearfix"></div>
                <span className="skel-lbl-flds">{selectedCustomer?.first_name + ' ' + selectedCustomer?.last_name}</span>
                <span>Appt. Type - {selectedCustomer?.appoint_mode_description}</span>
                <div className="row pt-2">
                    <div className="col-md-12">
                        <form onSubmit={handleSubmitForm}>
                            <div>
                                <label>User:</label>
                                <div>
                                    <select name='agentId' defaultValue={reAssignInputs.userId} id="reAssignUser" className="form-control" onChange={handleChange}>
                                        <option key="reAssignUser" value="">Select User</option>
                                        {
                                            reAssignUserLookup && reAssignUserLookup?.length > 0 && reAssignUserLookup?.map((user) => (
                                                <option key={user.user_id} value={user.user_id}>{user?.first_name || ""} {user?.last_name || ""}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                                {errors.agentId && <span className="error">{errors.agentId}</span>}
                            </div>
                            <div>
                                <label>Status Reason:</label>
                                {
                                    <select className="form-control" name="statusReason" id="statusReason" onChange={handleChange}>
                                        <option value="">Select the status reason</option>
                                        {statusReason?.map((ele) => {
                                            return <option value={ele?.code}>{ele?.description}</option>
                                        })}
                                    </select>
                                }
                                {errors.statusReason && <span className="error">{errors.statusReason}</span>}
                            </div>
                            <button type="submit" className='btn btn-primary'>Submit</button>
                        </form>

                        {/* <div className="form-group">
                                    <label htmlFor="Contactpreferenece" className="control-label">User <span
                                        className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custselect">
                                        <select required value={reAssignInputs.userId} id="reAssignUser" className="form-control" onChange={handleOnReAssignInputsChange}>
                                            <option key="reAssignUser" value="">Select User</option>
                                            {
                                                reAssignUserLookup && reAssignUserLookup?.length > 0 && reAssignUserLookup?.map((user) => (
                                                    <option key={user.user_id} value={user.user_id}>{user?.first_name || ""} {user?.last_name || ""}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                            </div> */}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}

export default ReAssignModal;


