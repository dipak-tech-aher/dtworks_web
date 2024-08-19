import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import FileUpload from "../../../../../common/uploadAttachment/fileUpload";
import { getFullName } from "../../../../../common/util/commonUtils";
import { get, put, slowPut } from "../../../../../common/util/restUtil";
import { properties } from "../../../../../properties";

const EditInteraction = (props) => {

    let history = useNavigate()
    const currentWorkflowRef = useRef()
    const { setIsModelOpen } = props?.stateHandlers
    const { isModelOpen, interactionDetails, appConfig, auth, permissions, lookupData, slaEdoc } = props?.data
    const [interactionInputs, setInteractionInputs] = useState()
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const [currStatusLookup, setCurrStatusLookup] = useState([])
    const [resolutionBlockEnable, setresolutionBlockEnable] = useState(false)
    const [currTasksLookup, SetcurrTasksLookup] = useState([])
    const { register, handleSubmit, setValue, formState: { errors } } = useForm()
    const isRoleChangedByUserRef = useRef()
    const [roleLookUp, setRoleLookup] = useState([])
    const [roleLookUpBkp, setRoleLookupBkp] = useState([])
    const intxnCauseLookup= lookupData.current?.INTXN_CAUSE
    // const [error, setError] = useState()
    const [workflowLookup, setWorkflowLookup] = useState();
    const [userLookup, setUserLookup] = useState([])

    const [currentFiles, setCurrentFiles] = useState([])
    const [existingFiles, setExistingFiles] = useState([])
    const [isChecked, setIsChecked] = useState(false);

    const userLookupRef = useRef()
    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({ ...isModelOpen, isEditOpen: false })
            setInteractionInputs({})
            setIsChecked(false)
            setCurrentFiles([])
        })
    }
    // console.log('currStatusLookup', currStatusLookup, currTasksLookup)
    const onSubmit = (data) => {
        const statusDetails = currStatusLookup.find(x => x.code === interactionInputs?.currStatus);
        if (statusDetails?.mappingPayload?.requiredFields?.includes("remarks")
            && (!interactionInputs?.remarks || interactionInputs?.remarks === "")
        ) {
            toast.error('Remarks Required.')
            return false
        }
        // console.log(interactionInputs)
        if (resolutionBlockEnable && (!interactionInputs?.resolution || interactionInputs?.resolution === "")
        ) {
            toast.error('Resolution Required.')
            return false
        }
        // console.log('currStatusLookup',interactionInputs, currStatusLookup, currTasksLookup)
        // return false
        // console.log('interactionInputs---------->', interactionInputs)
        // console.log('interactionInputs?.assignRole---------->', interactionInputs?.assignRole)
        // console.log('interactionInputs?.assignDept---------->', interactionInputs?.assignDept)

        // {"units":[{"roleId":7,"unitId":"MEEZA.OU.PMO","currUser":null},{"roleId":14,"unitId":"MEEZA.OU.SR","currUser":null},{"roleId":13,"unitId":"MEEZA.OU.TF","currUser":null},{"roleId":15,"unitId":"MEEZA.OU.SOC","currUser":null}]}

        let reqBody = {
            roleId: Number(interactionInputs?.assignRole),
            departmentId: interactionInputs?.assignDept,

            status: interactionInputs?.currStatus,
            selectedRoles: interactionInputs?.selectedRoles,
            status: interactionInputs?.currStatus,
            intxnCause: interactionInputs?.intxnCause
        }
        if (resolutionBlockEnable) {
            reqBody.resolution = interactionInputs?.resolution
        }
        if (!interactionInputs?.edoc) {
            toast.error('Expected completion date is required')
            return false
        }
        if (!interactionInputs?.workCompletionDate) {
            toast.error('Work Completion date is  required')
            return false
        }
        if (interactionInputs?.workCompletionDate) {
            if (interactionInputs?.edoc) {
                const edoc = new Date(interactionInputs?.edoc);
                const userChoosedDate = new Date(interactionInputs?.workCompletionDate);
                if (!(edoc >= userChoosedDate)) { toast.info(`Work Completion should be less than or equal to ${moment(edoc).format('YYYY-MM-DD')}`); return false; }
            } else {
                toast.info(`Please provide expected completion date`)
            }
        }
        // if (isQAFormEnabled?.[0]?.isEnabled && !isQAFormEnabled?.[0]?.isRead && isEmpty(evaluation)) {
        //     toast.error('Please fill QA Form')
        //     return
        // }

        // const ifFormFilled = validateJsonObject(evaluation)
        // const uniqueGuide = guideRefId.reduce((accumulator, currentValue) => {
        //     if (!accumulator.includes(currentValue)) {
        //         accumulator.push(currentValue);
        //     }
        //     return accumulator;
        // }, []);

        // if (isQAFormEnabled?.[0]?.isEnabled && !isQAFormEnabled?.[0]?.isRead && ((Object?.values(evaluation)?.length !== uniqueGuide?.length) || ifFormFilled)) {
        //     toast.error('Please fill out all questions in the Quality Evaluation Form.')
        //     return
        // }

        // if (evaluation && !isEmpty(evaluation)) {
        //     reqBody.evaluation = evaluation;
        // }

        if (interactionInputs?.user) {
            reqBody.userId = Number(interactionInputs?.user);
        }
        if (interactionInputs?.remarks) {
            reqBody.remarks = interactionInputs?.remarks;
        }
        if (interactionInputs?.techCompletionDate) {
            reqBody.techCompletionDate = interactionInputs?.techCompletionDate;
        }

        if (interactionInputs?.deployementDate) {
            reqBody.deployementDate = interactionInputs?.deployementDate;
        }

        if (currentFiles && currentFiles?.length > 0) {
            reqBody.attachments =
                [...currentFiles.map((current) => current.entityId)].length > 0
                    ? [...currentFiles.map((current) => current.entityId)]
                    : ""
        }

        if (interactionInputs?.biCompletionDate) {
            reqBody.biCompletionDate = interactionInputs?.biCompletionDate;
        }

        if (interactionInputs?.qaCompletionDate) {
            reqBody.qaCompletionDate = interactionInputs?.qaCompletionDate;
        }

        reqBody.isDownTimeRequired = isChecked;
        if (interactionInputs?.selectedRoles?.length > 1) {
            reqBody.departmentId = null
            reqBody.roleId = null
        } else {
            reqBody.departmentId = interactionInputs?.selectedRoles?.[0]?.unitId
            reqBody.roleId = interactionInputs?.selectedRoles?.[0]?.roleId
        }

        put(properties.INTERACTION_API + "/update/" + interactionDetails.intxnNo, {
            ...reqBody,
        })
            .then((response) => {
                toast.success(`${response?.message}`);
                slowPut(`${properties.INTERACTION_API}/update/work/completion`, {
                    intxnNo: interactionDetails?.intxnNo,
                    workCompletionDate: interactionInputs?.workCompletionDate,
                    edoc: interactionInputs?.edoc
                }).then(res => {
                    let { status, message } = res
                    if (status === 200) {
                        console.log('Work Completion message', message)
                    }
                })
                history(`/my-workspace`);
            })
            .catch((error) => {
                console.error(error);
                toast.error(error);
            })
            .finally();
    }

    // const handleOnTicketDetailsInputsChange = (e, id) => {
    //     const { target } = e;
    //     console.log('id---------->', id)
    //     console.log('e--------->', e)
    //     if (id === "assignRole") {
    //         const { unitId = "" } = e && JSON.parse(e['data-entity']);
    //         unstable_batchedUpdates(() => {
    //             setInteractionInputs({ ...interactionInputs, assignDept: unitId, [id]: e?.value })
    //             isRoleChangedByUserRef.current = true;
    //             userLookupRef.current = undefined
    //             setUserLookup([])
    //         })
    //     } else {
    //         setInteractionInputs({ ...interactionInputs, [target.id]: target.value })
    //     }
    //     // if (target?.id === "assignRole") {
    //     //     const { unitId = "" } = target.value && JSON.parse(target.options[target.selectedIndex].dataset.entity)
    //     //     unstable_batchedUpdates(() => {
    //     //         setInteractionInputs({ ...interactionInputs, assignDept: unitId, [target.id]: target.value })
    //     //         isRoleChangedByUserRef.current = true;
    //     //         userLookupRef.current = undefined
    //     //         setUserLookup([])
    //     //     })
    //     // } else {
    //     //     setInteractionInputs({ ...interactionInputs, [target.id]: target.value })
    //     // }
    // }

    // {"units":[{"roleId":7,"unitId":"MEEZA.OU.PMO","currUser":null},{"roleId":14,"unitId":"MEEZA.OU.SR","currUser":null},{"roleId":13,"unitId":"MEEZA.OU.TF","currUser":null},{"roleId":15,"unitId":"MEEZA.OU.SOC","currUser":null}]}

    const handleOnTicketDetailsInputsChange = (selected, id) => {
        // console.log('id---------->', id);
        // console.log('selected--------->', selected);
        // console.log('roleLookup--------->', roleLookUp);

        if (id === "assignRole") {
            const unitId = selected?.map(sel => {
                if (sel['data-entity'] && JSON.parse(sel['data-entity'])?.unitId) {
                    return JSON.parse(sel['data-entity'])?.unitId
                } else {
                    return JSON.parse(sel?.options?.[0]['data-entity'])?.unitId
                }
            });
            unstable_batchedUpdates(() => {
                setInteractionInputs(prevState => ({
                    ...prevState,
                    assignDept: unitId,
                    selectedRoles: selected?.map((ele) => {
                        if (ele?.value) {
                            return {
                                roleId: ele?.value,
                                unitId: JSON.parse(ele['data-entity'])?.unitId,
                                currUser: null
                            }
                        } else {
                            return {
                                roleId: ele?.options?.[0]?.value,
                                unitId: JSON.parse(ele?.options?.[0]['data-entity'])?.unitId,
                                currUser: null
                            }
                        }
                    }),
                    [id]: selected.map(sel => {
                        if (sel?.value) {
                            return sel.value
                        } else {
                            return sel?.options?.[0]?.value
                        }
                    })
                }));
                isRoleChangedByUserRef.current = true;
                userLookupRef.current = undefined;
                const filteredArr = roleLookUpBkp.filter(item => !unitId.some(id => item.entity.some(entity => entity.unitId === id)));
                setRoleLookup(filteredArr)
                setUserLookup([]);
            });
        } else {
            const { target } = selected;
            setInteractionInputs(prevState => ({
                ...prevState,
                [target.id]: target.value
            }));
        }
    };

    const handleStatusChange = (e) => {
        e.preventDefault()
        const { target } = e
        let entity = []
        handleOnTicketDetailsInputsChange(e)
        workflowLookup && workflowLookup?.entities?.forEach((unit) => {
            for (const property in unit?.status) {
                if (unit.status[property].code === target.value) {
                    entity.push(unit);
                    break
                }
            }
        })
        setValue("assignRole", "");
        if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
            entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
            setInteractionInputs({
                ...interactionInputs,
                [target.id]: target.value,
                assignRole: entity?.[0]?.roles?.[0].roleId,
                assignDept: entity?.[0]?.entity?.[0]?.unitId
            })
            setValue("assignRole", entity?.[0]?.roles?.[0].roleId);
        }

        setRoleLookup(entity);
        setRoleLookupBkp(entity);
        if (target?.id === 'currStatus') {
            let filterdata = currTasksLookup.filter((val) => val.taskName.toLowerCase() === 'collectresolution')
            if (filterdata?.length) {
                setresolutionBlockEnable(true)
            }
        } else {
            setresolutionBlockEnable(false)
        }
    }

    const getInteractionWorkflowState = useCallback(() => {
        if (interactionDetails?.currentDepartment?.code) {
            get(`${properties.WORKFLOW_DEFN_API}/get-status?entityId=${interactionDetails?.intxnUuid}&entity=INTERACTION`)
                .then((response) => {
                    if (response.status === 200 && response?.data) {
                        const { data } = response
                        const { flow = '' } = data
                        // console.log('response', response)
                        if (flow !== "DONE") {
                            let statusArray = [], tasksArray = [];
                            response?.data?.entities?.forEach(node => {
                                node.status?.forEach(status => {
                                    statusArray.push(status);
                                })
                                node.task?.forEach(task => {
                                    tasksArray.push(task);
                                })

                            })
                            let statusLookup = [
                                ...new Map(
                                    statusArray.map((item) => [item["code"], item])
                                ).values(),
                            ];
                            let TasksLookup = [
                                ...new Map(
                                    tasksArray.map((item) => [item["taskName"], item])
                                ).values(),
                            ];
                            // const statusLookup = [...statuses]
                            unstable_batchedUpdates(() => {
                                currentWorkflowRef.current = data
                                setWorkflowLookup(data)
                                setCurrStatusLookup(statusLookup);
                                SetcurrTasksLookup(TasksLookup);
                            })
                        }

                    }
                })
        }
    }, [interactionDetails?.currentDepartment?.code, interactionDetails?.intxnUuid])

    useEffect(() => {
        if (permissions?.edit) {
            getInteractionWorkflowState();
        }
    }, [getInteractionWorkflowState, interactionDetails, permissions?.edit]);
    useEffect(() => {
        if (interactionDetails?.edoc) {
            setInteractionInputs({ edoc: interactionDetails?.edoc, workCompletionDate: interactionDetails?.workCompletionDate })
        }
    }, [isModelOpen.isEditOpen]);

    const getUsersBasedOnRole = useCallback(() => {
        if ((interactionInputs?.assignRole && interactionInputs?.assignDept)) {
            const data = {
                roleId: interactionInputs.assignRole,
                deptId: interactionInputs.assignDept
            }

            get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
                .then((userResponse) => {
                    const { data } = userResponse
                    unstable_batchedUpdates(() => {
                        const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
                        userLookupRef.current = formattedResponse
                        setUserLookup(formattedResponse)
                        if (isRoleChangedByUserRef.current) {
                            if (data?.length === 1) {
                                setInteractionInputs({
                                    ...interactionInputs,
                                    user: data?.[0].userId,
                                })
                            }
                        }
                    })
                }).catch(error => console.error(error))
                .finally()
        }
    }, [interactionInputs])

    useEffect(() => {
        if (interactionInputs?.selectedRoles?.length <= 1 && interactionInputs?.assignRole && !userLookupRef?.current) {
            getUsersBasedOnRole();
        }
    }, [getUsersBasedOnRole, interactionInputs])

    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setMenuIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (

        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen.isEditOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
            <Modal.Header>
                <Modal.Title><h5 className="modal-title">Edit Interaction - {interactionDetails?.intxnNo}</h5></Modal.Title>
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
                                    <label htmlFor="currStatus" className="control-label">Status<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <select className="form-control" id="currStatus" value={interactionInputs?.currStatus ?? ''} {...register("currStatus", { required: 'This is required' })} onChange={(e) => { handleStatusChange(e) }}>
                                        <option value="">Select</option>
                                        {currStatusLookup &&
                                            currStatusLookup?.map((currStatus, index) => (
                                                <option key={index} value={currStatus?.code}>{currStatus?.description}</option>
                                            ))}
                                    </select>
                                    {errors?.currStatus && <span className="errormsg">{errors.currStatus.message}</span>}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="assignRole" className="control-label">Department/Role <span
                                        className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custselect" ref={selectRef}>
                                        <ReactSelect
                                            id='assignRole'
                                            isMulti={true}
                                            menuIsOpen={menuIsOpen}
                                            onMenuOpen={() => setMenuIsOpen(true)}
                                            placeholder="Select Role"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                            options={
                                                roleLookUp?.map((dept) => {
                                                    return {
                                                        label: dept?.entity?.[0]?.unitDesc,
                                                        options: dept?.roles?.map((data) => ({
                                                            value: data?.roleId,
                                                            label: data?.roleDesc,
                                                            'data-entity': JSON?.stringify(dept?.entity?.[0])
                                                        }))
                                                    };
                                                })}
                                            onChange={(selected) => {
                                                const selectedOption = selected;
                                                handleOnTicketDetailsInputsChange(selectedOption, 'assignRole');
                                            }}
                                            value={
                                                (roleLookUpBkp?.filter(dept =>
                                                    Array.isArray(interactionInputs?.assignRole) ?
                                                        interactionInputs.assignRole.includes(dept?.roles.find(data => data?.roleId)?.roleId) :
                                                        false
                                                ) || []).map(dept => ({
                                                    label: dept?.entity?.[0]?.unitDesc,
                                                    options: dept?.roles?.map(data => ({
                                                        value: data?.roleId,
                                                        label: data?.roleDesc,
                                                        'data-entity': JSON.stringify(dept?.entity?.[0])
                                                    }))
                                                }))
                                            }
                                        />
                                        {/* <ReactSelect
                                        id='channel'
                                        placeholder="Select Channel"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}

                                        options={roleLookUp?.map((ele)=>{
                                            return {value:ele?., label:ele?.}
                                        })}
                                        isMulti={true}
                                        onChange={(selected) => {
                                            setFaqData({ ...faqData, channel: selected?.map(x => x.value) })
                                        }}
                                        value={channels?.filter(x => faqData?.channel?.includes(x.value))}
                                    />
                                        <select className="form-control" id="assignRole" {...register("assignRole", { required: 'This is required' })} value={interactionInputs?.assignRole} onChange={handleOnTicketDetailsInputsChange}>
                                            <option value="">Select Role</option>
                                            {roleLookUp &&
                                                roleLookUp.map((dept, key) => (
                                                    <optgroup key={key} label={dept?.entity?.[0]?.unitDesc}>
                                                        {!!dept.roles.length &&
                                                            dept.roles.map((data, childKey) => (
                                                                <option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity[0])}>{data.roleDesc}</option>
                                                            ))}
                                                    </optgroup>
                                                ))}
                                        </select> */}
                                        {errors?.assignRole && <span className="errormsg">{errors.assignRole.message}</span>}

                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="user" className="control-label">User</label>
                                    <ReactSelect
                                        isDisabled={interactionInputs?.selectedRoles?.length > 1}
                                        className="w-100"
                                        options={userLookup}
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999999 }) }}
                                        value={interactionInputs?.user ? userLookup.find(c => c?.value === interactionInputs?.user) : null}
                                        onChange={(val) => { setInteractionInputs({ ...interactionInputs, user: val?.userId }) }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label htmlFor="intxnCause" className="control-label">Interaction Cause<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <div className="custselect">
                                        <select className="form-control" id="intxnCause" {...register("intxnCause", { required: 'This is required' })}
                                            value={interactionInputs?.intxnCause}
                                            onChange={handleOnTicketDetailsInputsChange}>
                                            <option value="">Select cause</option>
                                            {intxnCauseLookup &&
                                                intxnCauseLookup.map((data, key) => (
                                                    <option key={key} value={data.code}>{data.description}</option>
                                                ))}

                                        </select>
                                        {errors?.intxnCause && <span className="errormsg">{errors.intxnCause.message}</span>}

                                    </div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <div className="form-group">
                                        <label htmlFor="edoc" className="col-form-label" >Expected Completion Date<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <input type="date" id="edoc" className="form-control"
                                            min={moment(new Date()).format('YYYY-MM-DD')}
                                            disabled={!!slaEdoc}
                                            value={interactionInputs?.edoc}
                                            onChange={(e) => { setInteractionInputs({ ...interactionInputs, edoc: e.target.value }) }}
                                        />
                                    </div>
                                    {errors?.workCompletionDate && <span className="errormsg">{errors.workCompletionDate.message}</span>}
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <div className="form-group">
                                        <label htmlFor="workCompletionDate" className="col-form-label" >Work Completion Date <span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <input
                                            type="date"
                                            id="workCompletionDate"
                                            name='workCompletionDate'
                                            className="form-control"
                                            min={moment(new Date()).format('YYYY-MM-DD')}
                                            value={interactionInputs?.workCompletionDate}
                                            onChange={(e) => {
                                                unstable_batchedUpdates(() => {
                                                    setInteractionInputs({ ...interactionInputs, workCompletionDate: e.target.value })
                                                })
                                            }
                                            }
                                        />
                                    </div>
                                    {errors?.workCompletionDate && <span className="errormsg">{errors.workCompletionDate.message}</span>}
                                </div>
                            </div>
                            {interactionDetails?.intxnStatus?.code !== "CLOSED" &&
                                appConfig?.clientConfig?.interaction?.editInteraction?.map((ele) => <>
                                    {ele?.isEnable && ele?.columnName === 'isDownTimeRequired' && ele?.roleId?.includes(auth?.currRoleId) &&
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="isDownTimeRequired" className="col-form-label" >Downtime Required (Yes/No)</label>
                                                <div className="switchToggledwntime ml-1">
                                                    <input id="switch1" type="checkbox" checked={isChecked} onChange={() => setIsChecked(!isChecked)} />
                                                    <label htmlFor="switch1">Toggle</label>
                                                </div>
                                            </div>
                                        </div>}
                                    {ele?.isEnable && ele?.columnName === 'techCompletionDate' && ele?.roleId?.includes(auth?.currRoleId) &&
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="techCompletionDate" className="col-form-label" >Date of Tech Completion</label>
                                                <input type="date" id="techCompletionDate" className="form-control"
                                                    min={moment(new Date()).format('YYYY-MM-DD')}
                                                    value={interactionInputs?.techCompletionDate}
                                                    onChange={handleOnTicketDetailsInputsChange}
                                                />
                                            </div>
                                        </div>}

                                    {ele?.isEnable && ele?.columnName === 'deployementDate' && ele?.roleId?.includes(auth?.currRoleId) &&
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="deployementDate" className="col-form-label" >Date of Deployment</label>
                                                <input type="date" id="deployementDate" className="form-control"
                                                    min={moment(new Date()).format('YYYY-MM-DD')}
                                                    value={interactionInputs?.deployementDate}
                                                    onChange={handleOnTicketDetailsInputsChange}
                                                />
                                            </div>
                                        </div>}

                                    {ele?.isEnable && ele?.columnName === 'dbCompletionDate' && ele?.roleId?.includes(auth?.currRoleId) && <div className="col-md-4">
                                        <div className="form-group">
                                            <label htmlFor="dbCompletionDate" className="col-form-label" >DB Completion Date</label>
                                            <input type="date" id="dbCompletionDate" className="form-control"
                                                min={moment(new Date()).format('YYYY-MM-DD')}
                                                value={interactionInputs?.dbCompletionDate}
                                                onChange={handleOnTicketDetailsInputsChange}
                                            />
                                        </div>
                                    </div>}

                                    {/* {ele?.isEnable && ele?.columnName === 'biCompletionDate' && ele?.roleId?.includes(auth?.currRoleId) && <div className="form-group">
                                        <label htmlFor="biCompletionDate" className="col-form-label" >BI Completion Date</label>
                                        <input type="date" id="biCompletionDate" className="form-control"
                                        min={moment(new Date()).format('YYYY-MM-DD')}
                                        value={interactionInputs?.biCompletionDate}
                                        onChange={handleOnTicketDetailsInputsChange}
                                        />
                                    </div>}

                                    {ele?.isEnable && ele?.columnName === 'qaCompletionDate' && ele?.roleId?.includes(auth?.currRoleId) && <div className="form-group">
                                        <label htmlFor="qaCompletionDate" className="col-form-label" >QA Completion Date</label>
                                        <input type="date" id="qaCompletionDate" className="form-control"
                                        min={moment(new Date()).format('YYYY-MM-DD')}
                                        value={interactionInputs?.qaCompletionDate}
                                        onChange={handleOnTicketDetailsInputsChange}
                                        />
                                    </div>} */}
                                </>)
                            }
                        </div>
                        <div className="row ">
                            <div className="col-md-12">
                                <span className="font-weight-bold mt-2 d-flex mb-2">Attachments</span>
                            </div>
                            <div className="col-md-12">
                                <div className="attachment-details">
                                    <FileUpload
                                        data={{
                                            currentFiles: currentFiles,
                                            entityType: 'INTERACTION',
                                            existingFiles: existingFiles,
                                            interactionId: interactionDetails?.intxnUuid,
                                            permission: false
                                        }}
                                        handlers={{
                                            setCurrentFiles: setCurrentFiles,
                                            setExistingFiles: setExistingFiles
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row mt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="Contactpreferenece" className="control-label">Remarks</label>
                                    <textarea className="form-control" onChange={handleOnTicketDetailsInputsChange} maxLength="2500" id="remarks" name="remarks" rows="4"></textarea>
                                    <span className="skel-fnt-xs">Maximum 2500 characters</span>
                                </div>
                            </div>
                        </div>
                        {resolutionBlockEnable && <div className="row mt-2">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label htmlFor="resolution" className="control-label">Resolution<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                    <textarea className="form-control" maxLength="2500" id="resolution" name="resolution" rows="4" onChange={(e) => { setInteractionInputs({ ...interactionInputs, [e.target.id]: e.target.value }) }}></textarea>
                                    <span className="skel-fnt-xs">Maximum 2500 characters</span>
                                </div>
                            </div>
                        </div>}
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

export default EditInteraction;
