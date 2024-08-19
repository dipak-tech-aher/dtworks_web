import { toast } from 'react-toastify'
import React, { useCallback, useEffect, useState } from "react"
import { CloseButton, Modal } from 'react-bootstrap'
import { unstable_batchedUpdates } from "react-dom"
import { get, put } from "../../../../common/util/restUtil"
import { properties } from "../../../../properties"
import { getFullName } from "../../../../common/util/commonUtils"
import ReactSelect from 'react-select'
import { statusConstantCode } from "../../../../AppConstants";

const ReAssignToUser = (props) => {

    const { isModelOpen, detailedViewItem } = props?.data
    const { setIsModelOpen, setRefresh } = props?.stateHandlers
    const [reAssignUserLookup, setReAssignUserLookup] = useState([])
    const [assignInputs, setAssignInputs] = useState()

    // console.log('detailedViewItem ', detailedViewItem)
    const getUsersBasedOnRole = useCallback(() => {
        if (detailedViewItem?.currRoleInfo?.roleId && detailedViewItem?.currDeptInfo?.unitId) {
            const data = {
                roleId: detailedViewItem?.currRoleInfo?.roleId,
                deptId: detailedViewItem?.currDeptInfo?.unitId
            }
            get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`).then((userResponse) => {
                let { data } = userResponse
                data = data.filter((x) => x.userId !== detailedViewItem?.currUserInfo?.userId)
                const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
                setReAssignUserLookup(formattedResponse)
            }).catch(error => console.error(error));
        }
    }, [detailedViewItem?.helpdeskNo])

    // const handleOnChange = (e) => {
    //     const { target } = e;
    //     setAssignInputs({
    //         userId: target.value,
    //     })
    // }

    useEffect(() => {
        getUsersBasedOnRole()
    }, [detailedViewItem?.helpdeskNo])

    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isReassignToUserOpen: false })
        })
    }

    // const handleSubmit = (e) => {
    //     e.preventDefault()
    //     if (!assignInputs?.userId) {
    //         toast.error("User is Mandatory")
    //         return
    //     }
    //     let payload = {
    //         userId: assignInputs?.userId,
    //         type: "REASSIGN"
    //     };

    //     put(`${properties.HELPDESK_API}/assignSelf/${detailedViewItem?.helpdeskNo}`,
    //         { ...payload }
    //     )
    //         .then((response) => {
    //             toast.success(`${response.message}`)
    //             handleOnClose()
    //         })
    //         .catch((error) => {
    //             console.error(error);
    //         })
    //         .finally();
    // }

    const handleSubmit = () => {

        let payload = {
            userId: assignInputs?.userId
        };

        put(`${properties.HELPDESK_API}/reassign/${detailedViewItem?.helpdeskNo}`, payload)
            .then((response) => {
                const { status, message } = response;
                if (status === 200) {
                    setRefresh(true)
                    toast.success(message);
                    handleOnClose()
                }
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }


    return (
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isReassignToUserOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Reassign Helpdesk - {detailedViewItem?.helpdeskNo}</h5></Modal.Title>
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
                                <label htmlFor="userId" className="col-form-label" >User sds{" "}
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    className="w-100 skel-select-drpdown"
                                    options={reAssignUserLookup}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                    value={assignInputs?.userId ? reAssignUserLookup.find(c => c?.value === assignInputs?.userId) : null}
                                    onChange={(val) => { setAssignInputs({ userId: val?.userId }) }}
                                // menuIsOpen={true}
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