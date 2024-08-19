import { toast } from 'react-toastify'
import React, { useCallback, useEffect, useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { unstable_batchedUpdates } from "react-dom"
import { get, put } from "../../../../../common/util/restUtil"
import { properties } from "../../../../../properties"
import { getFullName } from "../../../../../common/util/commonUtils"
import ReactSelect from 'react-select'

const ReAssignToUser = (props) => {

    const { isModelOpen, interactionDetails, refresh } = props?.data
    const { setIsModelOpen, setRefresh } = props?.stateHandlers
    const [reAssignUserLookup, setReAssignUserLookup] = useState([])
    const [assignInputs, setAssignInputs] = useState()

    const getUsersBasedOnRole = useCallback(() => {
        if (interactionDetails?.currentRole?.code && interactionDetails?.currentDepartment?.code) {
            const data = {
                roleId: interactionDetails?.currentRole?.code,
                deptId: interactionDetails?.currentDepartment?.code
            }

            get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
                .then((userResponse) => {
                    let { data } = userResponse
                    data = data.filter((x) => x.userId !== interactionDetails?.currentUser?.code)
                    const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
                    setReAssignUserLookup(formattedResponse)
                }).catch(error => console.error(error))
                .finally()
        }
    }, [interactionDetails])

    // const handleOnChange = (e) => {
    //     const { target } = e;
    //     setAssignInputs({
    //         userId: target.value,
    //     })
    // }

    useEffect(() => {
        getUsersBasedOnRole()
    }, [getUsersBasedOnRole, interactionDetails])

    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isReassignToUserOpen: false })
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!assignInputs?.userId) {
            toast.error("User is Mandatory")
            return
        }

        let payload = {
            userId: assignInputs?.userId,
            type: "REASSIGN",
            // parallelUnits: null
        };

        // if (interactionDetails?.parallelUnits?.length > 0) {
        //     const pUnits = interactionDetails?.parallelUnits?.map((ele) => {
        //         if (ele?.roleId === interactionDetails?.currentRole?.code && ele?.unitId === interactionDetails?.currentDepartment?.code) {
        //             ele.currUser = assignInputs?.userId
        //         }
        //     })
        //     console.log('pUnits----------->', pUnits)
        //     payload.parallelUnits = pUnits
        // }

        put(`${properties.INTERACTION_API}/assignSelf/${interactionDetails?.intxnNo}`,
            { ...payload }
        )
            .then((response) => {
                toast.success(`${response.message}`)
                setRefresh(!refresh)
                handleOnClose()
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }


    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isReassignToUserOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Reassign Interaction - {interactionDetails?.intxnNo}</h5></Modal.Title>
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
                                You can reassign the interaction within your current department and role.
                                <br />
                                To proceed, please click the submit button
                            </div>
                        </div>
                    </div>
                    <div className="row pt-3">
                        <div className="col-md-12 pb-3">
                            <div className="form-group ">
                                <label htmlFor="userId" className="col-form-label" >User{" "}
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                <ReactSelect
                                    className="w-100"
                                    options={reAssignUserLookup}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                    value={assignInputs?.userId ? reAssignUserLookup.find(c => c?.value === assignInputs?.userId) : null}
                                    onChange={(val) => { setAssignInputs({ userId: val?.userId }) }}
                                />
                                {/* <select value={assignInputs?.userId} id="userId" className="form-control" onChange={handleOnChange} required>
                                    <option key="userId" value="">Select User</option>
                                    {reAssignUserLookup && reAssignUserLookup.map((e) => (
                                        <option key={e.userId} value={e.userId}>{getFullName(e) ?? ''}</option>))}
                                </select> */}
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
export default ReAssignToUser;