import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import * as Yup from "yup";
import { statusConstantCode } from '../../AppConstants';
import { AppContext } from "../../AppContext";
import { get, post, put } from "../../common/util/restUtil";
import { getPermissions, removeEmptyKey, validate } from "../../common/util/util";
import { properties } from "../../properties";

const EditHelpdeskModal = (props) => {
    const { detailedViewItem, helpdeskStatus, helpdeskTypes, severities, cancelReasonLookup, projectLookup, projectTypes, isModelOpen, source, helpdeskID, shortInfo = false } = props?.data;
    const { auth } = useContext(AppContext)
    const [helpdeskDetails, setHelpdeskDetails] = useState({})
    const [error, setError] = useState({})
    const [status, setStatus] = useState("")
    const { doSoftRefresh, setIsModelOpen, setEditFrom, assignHelpdesk, setProjectLookup, setProjectTypes } = props.handlers
    const [text, setText] = useState("")
    const [slaEdoc, setslaEdoc] = useState()
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    // console.log('isModelOpen ', props)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('HELPDESK_CREATE');
                console.log('permissions',permissions)
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);
    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission?.components?.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])


    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])
    useEffect(() => {
        if (!isEmpty(detailedViewItem)) {
            unstable_batchedUpdates(() => {
                setText("<p><br></p>");
                setHelpdeskDetails({
                    status: detailedViewItem?.status?.code ?? null,
                    helpdeskType: detailedViewItem?.helpdeskType?.code ?? null,
                    severity: detailedViewItem?.severity?.code ?? null,
                    project: detailedViewItem?.project?.code ?? null,
                    complitionDate: detailedViewItem?.complitionDate ?? null,
                    pending: detailedViewItem?.pendingWith?.code ?? null
                })
            })
        }
    }, [detailedViewItem])

    const handleOnChange = (e) => {
        const target = e.target;
        unstable_batchedUpdates(() => {
            if (target.id === 'status') {
                 setStatus(target.value);
            }
            setHelpdeskDetails((prevVal) => ({
                ...prevVal,
                [target.id]: target.value
            }))
            setError((prevVal) => ({ ...prevVal, [target.id]: "" }))
        }, [])
    }

    useEffect(() => {
        if (helpdeskID) {
            const requestBody = {
                helpdeskId: helpdeskID,
                contain: ['CUSTOMER']
            }

            post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
                .then((response) => {
                    if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                        get(properties.MASTER_API + `/lookup?searchParam=code_type&valueParam=${statusConstantCode.businessEntity.PROJECT}`).then((resp) => {
                            let projectOptions = resp?.data?.PROJECT?.filter((f) => f.mapping?.department?.includes(auth?.currDeptId))
                            let projects = []
                            if (response?.data?.rows?.[0]?.customerDetails?.projectMapping?.length > 0) {
                                let currentDeptProject = response?.data?.rows?.[0]?.customerDetails?.projectMapping?.filter((f) => f?.entity === auth?.currDeptId)
                                projects = projectOptions?.filter((f) => currentDeptProject?.[0]?.project?.includes(f?.code))
                            }

                            if (projects && projects?.length > 0) {
                                setProjectLookup(projects)
                                setProjectTypes(projects)
                            }

                            // if (response?.data?.rows?.[0]?.customerDetails?.projectMapping
                            //     && Array.isArray(response?.data?.rows?.[0]?.customerDetails?.projectMapping)
                            //     && response?.data?.rows?.[0]?.customerDetails?.projectMapping?.length > 0) {
                            //     const projects = []
                            //     const filtertedCustomerProject = response?.data?.rows?.[0]?.customerDetails?.projectMapping.filter((e) => e.entity === auth?.currDeptId)
                            //     const filtertedProject = resp?.data?.PROJECT?.filter((e) => e?.mapping?.department?.includes(auth?.currDeptId))
                            //     filtertedProject?.forEach(element => {
                            //         filtertedCustomerProject?.forEach((ele) => {
                            //             console.log('ele ------------->', ele?.project)
                            //             console.log('element?.code ------------->', element)

                            //             if (ele?.project?.includes(element?.code)) {
                            //                 projects.push(element)
                            //             }
                            //         })
                            //     })
                            //     console.log('projects ::::: ', projects)
                            //     if (projects && projects?.length > 0) {
                            //         setProjectLookup(projects)
                            //     }
                            // }
                        })
                        // setHelpdeskDetails(response?.data?.rows?.[0])
                        setHelpdeskDetails({
                            helpdeskType: response?.data?.rows?.[0]?.helpdeskType?.code ?? null,
                            severity: response?.data?.rows?.[0]?.severity?.code ?? null,
                            project: response?.data?.rows?.[0]?.project?.code ?? null,
                            complitionDate: response?.data?.rows?.[0]?.complitionDate ?? null,
                            pending: response?.data?.rows?.[0]?.pendingWith?.code ?? null
                        })
                    }
                })
                .catch(error => {
                    console.log(error);
                })
                .finally()
        }
    }, [helpdeskID])

    const handleOnCancel = () => {
        doSoftRefresh('FULL_REFRESH')
        setIsModelOpen({ ...isModelOpen, isEditOpen: false })
        // doSoftRefresh('CANCEL_VIEW');
    }

    // console.log('detailedViewItem', detailedViewItem)

    const validationSchema = Yup.object().shape({
        status:Yup.string().required("status is required"),
        project: Yup.string().required("Project is required"),
        helpdeskType: Yup.string().required("Type is required"),
        severity: Yup.string().required("Severity is required"),
        // complitionDate: Yup.string().required("Complition date is required"),
    });

    const handleOnSubmit = () => {
        helpdeskDetails.complitionDate = helpdeskDetails?.complitionDate ?? slaEdoc
        let error = validate(validationSchema, helpdeskDetails, setError);
        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false
        }
        if (!helpdeskDetails?.status && source !== 'Assign') {
            toast.error("Validation errors found. Please check highlighted fields");
            return false
        }

        // if (detailedViewItem?.status?.code === helpdeskDetails.status && helpdeskDetails.complitionDate === detailedViewItem?.complitionDate) {
        //     toast.warn('There is no change in status and complition Date been specified')
        //     return false
        // }

        // if (currentFiles && currentFiles.length > 0 && (!text || text.trim() === '')) {
        //     toast.info('A reply to customer must be provided along with attachments')
        //     return false
        // }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.project && !helpdeskDetails.project) {
            toast.warn('Please select project')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.helpdeskType && helpdeskDetails?.helpdeskType) {
            toast.warn('Please select helpdesk type')
            return false
        }

        if (status === statusConstantCode?.status?.HELPDESK_CLOSED && !detailedViewItem.severity && helpdeskDetails?.severity) {
            toast.warn('Please select severity')
            return false
        }

        // if (status === statusConstantCode?.status?.HELPDESK_CANCEL && !helpdeskDetails?.cancelReason) {
        //     toast.warn('Please select cancel reason')
        //     return false
        // }

        if (source === 'Assign') {
            const status = assignHelpdesk(detailedViewItem?.helpdeskId ?? helpdeskID ?? undefined)
            status.then((handleResolve, handleReject) => {
                // setSearchAssignedQueueFilter("");
                handleHelpdeskSubmit()
                // doSoftRefresh();
            }).catch(error => console.log(error))
        } else {
            handleHelpdeskSubmit()
        }
    }

    const handleHelpdeskSubmit = () => {
        let requestBody = {
            ...helpdeskDetails,
            status: source === 'Assign' ? statusConstantCode.status.HELPDESK_ASSIGN : helpdeskDetails.status,
            helpdeskId: detailedViewItem?.helpdeskId,
            // content: '<p><br></p>',
            // attachments: currentFiles?.map((file) => file.entityId),
            source: source === 'Assign' ? 'AssignToSelf' : '',
            entityType: statusConstantCode?.entityCategory?.HELPDESKTXN,
        }
        /** Remove the empty keys in given objects */
        requestBody = removeEmptyKey(requestBody);
        put(`${properties.HELPDESK_API}/update/${detailedViewItem?.helpdeskId ?? helpdeskID ?? undefined}`, requestBody)
            .then((response) => {
                const { status, message } = response;
                if (status === 200) {
                    doSoftRefresh('FULL_REFRESH')
                    unstable_batchedUpdates(() => {
                        setIsModelOpen({ ...isModelOpen, isEditOpen: false })
                        if (typeof setEditFrom == 'function') {
                            setEditFrom(null);
                        }
                        setHelpdeskDetails({})
                    })
                    if (status === statusConstantCode?.status?.HELPDESK_CLOSED) {
                        let el = document.querySelector(`li[data-helpdesk-no="${detailedViewItem?.helpdeskNo}"]`);
                        el?.parentNode?.removeChild(el);
                    }
                    toast.success(message);
                }
            })
            .catch(error => {
                console.log(error);
            })
            .finally()
    }
    // statementId
    const getEdoc = useCallback((data) => {
        if (data?.requestId || data?.helpdeskProblemCode) {
            const params = data?.requestId ? `?requestId=${data?.requestId}` : data?.helpdeskProblemCode ? `?helpdeskProblemCode=${data?.helpdeskProblemCode}` : ''
            get(`${properties.SLA_API}/get-edoc${params}`)
                .then((resp) => {
                    if (resp?.status === 200 && !isEmpty(resp?.data)) {
                        const { oResolutionDate } = resp.data
                        setslaEdoc(oResolutionDate ? moment(oResolutionDate).format('YYYY-MM-DD') : '')
                        // setHelpdeskData({...helpdeskData, complitionDate: edoc ?moment(edoc).format('YYYY-MM-DD') : ''})
                    }
                }).catch(error => console.error(error))
        }
    }, [])

    useEffect(() => {
        getEdoc({ requestId: detailedViewItem.statementId })
    }, [detailedViewItem.statementId, getEdoc])
 
    return (
        <React.Fragment>
            <Modal show={isModelOpen.isEditOpen} onHide={handleOnCancel} dialogClassName="cust-md-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Helpdesk - {detailedViewItem?.helpdeskNo}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={`col row p-0 mb-2 mt-0`}>
                        {/* {source !== 'Assign' && <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Status<span className='text-danger font-20 pl-1 fld-imp'>*</span></div>
                            {detailedViewItem?.status?.code !== 'HS_ESCALATED' ? <select id="status" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} className={`form-control ${error.status && "error-border"
                                }`} value={helpdeskDetails?.status} onChange={handleOnChange}>
                                <option value="">Select Status</option>
                                {
                                    helpdeskStatus && helpdeskStatus?.map((e) => (
                                        <option key={e.code} value={e.code}>{e.description}</option>
                                    ))
                                }
                            </select> :
                                <input type="text" id="Status" className="form-control" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} value={detailedViewItem?.status?.description} />
                                // <p className='form-control'>{detailedViewItem?.status?.description}</p>
                            }
                            {error?.status ? <span className="errormsg">{error?.status}</span> : ""}
                        </div>} */}
                        {shortInfo && <>
                            <div className='col-md-12 mb-0 d-block'>
                                <span className='skel-heading'>{detailedViewItem?.helpdeskSubject ?? ''}</span>
                                <span>Channel: {detailedViewItem?.helpdeskSource?.description ?? '-'}</span>
                            </div>
                            <hr className='cmmn-hline mt-2 mb-2' />
                        </>}
                        
                        <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Status<span className='text-danger font-20 pl-1 fld-imp'>*</span></div>
                            <select id="status" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} className={`form-control ${error.status && "error-border"
                                }`} value={helpdeskDetails?.status} onChange={handleOnChange}>
                                <option value="">Select Status</option>
                                {
                                    helpdeskStatus && helpdeskStatus?.filter(e => e?.mapping?.isStatusEnabled?.[0]?.toUpperCase()?.includes("TRUE"))?.map((e) => (
                                        <option key={e.code} value={e.code} disabled={detailedViewItem?.status?.code === e.code ? true : false || e.code === statusConstantCode?.status?.HELPDESK_NEW}>{e.description}</option>
                                    ))
                                }
                            </select>
                            {error?.status ? <span className="errormsg">{error?.status}</span> : ""}
                        </div>



                        <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Type<span className='text-danger font-20 pl-1 fld-imp'>*</span></div>
                            <select id="helpdeskType" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} className={`form-control ${error.helpdeskType && "error-border"
                                }`} value={helpdeskDetails?.helpdeskType} onChange={handleOnChange}>
                                <option value="">Select Type</option>
                                {
                                    helpdeskTypes && helpdeskTypes.map((e) => (
                                        <option key={e.code} value={e.code}>{e.description}</option>
                                    ))
                                }
                            </select>
                            {error?.helpdeskType ? <span className="errormsg">{error?.helpdeskType}</span> : ""}
                        </div>
                        <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Severity<span className='text-danger font-20 pl-1 fld-imp'>*</span></div>
                            <select id="severity" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} className={`form-control ${error.severity && "error-border"
                                }`} value={helpdeskDetails?.severity} onChange={handleOnChange}>
                                <option value="">Select Severity</option>
                                {
                                    severities && severities.map((e) => (
                                        <option key={e.code} value={e.code}>{e.description}</option>
                                    ))
                                }
                            </select>
                            {error?.severity ? <span className="errormsg">{error?.severity}</span> : ""}
                        </div>
                        <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Project<span className='text-danger font-20 pl-1 fld-imp'>*</span></div>
                            <select id="project" disabled={detailedViewItem?.status?.code === 'HS_ESCALATED'} className={`form-control ${error.severity && "error-border"
                                }`} value={helpdeskDetails?.project} onChange={handleOnChange}>
                                <option value="">Select Project Type</option>
                                {
                                    projectLookup && projectLookup?.map((e) => (
                                        <option key={e.code} value={e.code}>{e.description}</option>
                                    ))
                                    // projectTypes && projectTypes.map((e) => (
                                    //     <option key={e.code} value={e.code}>{e.description}</option>
                                    // ))
                                }
                            </select>
                            {error?.project ? <span className="errormsg">{error?.project}</span> : ""}
                        </div>
                        <div className="col-md-4 clearfix form-group">
                            <div className="form-label">Completion date</div>
                            <input type="date" id="complitionDate" className="form-control" min={moment(new Date()).format('YYYY-MM-DD')} value={helpdeskDetails?.complitionDate ?? slaEdoc} disabled={slaEdoc} onChange={handleOnChange} />
                        </div>
                        <div className="clearfix">
                            <div className="form-label">Pending with</div>
                            <select id="pending" className="form-control" value={helpdeskDetails?.pending} onChange={handleOnChange}>
                                <option value="">Select Pending with</option>
                                {
                                    projectTypes && projectTypes.map((e) => (
                                        <option key={e.code} value={e.code}>{e.description}</option>
                                    ))
                                }
                            </select>
                        </div>
                        {helpdeskDetails?.status && (helpdeskDetails?.status === statusConstantCode.status.HELPDESK_CANCEL || helpdeskDetails?.status === statusConstantCode.status.HELPDESK_CLOSED) &&
                            <div className="col-md-4 clearfix form-group">
                                <div className="form-label">{helpdeskDetails?.status === statusConstantCode.status.HELPDESK_CLOSED ? 'Closed' : 'Cancel'} Reason
                                    {/* <span className='text-danger font-20 pl-1 fld-imp'>*</span> */}
                                </div>
                                <select id="cancelReason" className="form-control" value={helpdeskDetails?.cancelReason} onChange={handleOnChange}>
                                    <option value="">Select Reason</option>
                                    {
                                        cancelReasonLookup && cancelReasonLookup.map((e) => (
                                            <option key={e.code} value={e.code}>{e.description}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        }
                         {helpdeskDetails?.status && (helpdeskDetails?.status === statusConstantCode.status.HELPDESK_CLOSED && checkComponentPermission('ACTUALRESOLUTIONDATE')) &&
                            <div className="col-md-4 clearfix form-group">
                                <div className="form-label">
                                    Actual Resoultion Date & Time
                                </div>
                                <input type="datetime-local" id="actualResolutionDate" className="form-control" min={moment(new Date()).format('YYYY-MM-DDTHH:mm')} value={helpdeskDetails?.actualResolutionDate} onChange={handleOnChange} />
                            </div>
                        }
                        <div className='col-md-12 clearfix form-group'>
                            <div className="form-label">Remarks</div>
                            <textarea className="form-control" name="helpdeskContent" id="helpdeskContent" onChange={handleOnChange} cols="70" rows="4" placeholder='Type remarks here..'></textarea>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className={`row col-12 justify-content-center`}>
                        <button type="button" className="skel-btn-cancel" onClick={handleOnCancel}>Cancel</button>
                        <button type="button" className="skel-btn-submit skel-custom-submit-btn" onClick={handleOnSubmit}>Submit</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    )

}

export default EditHelpdeskModal;