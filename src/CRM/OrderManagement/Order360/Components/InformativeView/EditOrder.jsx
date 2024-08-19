import React, { useContext, useState } from 'react'
import { AppContext, Order360Context } from '../../../../../AppContext';
import _ from "lodash";
import { put } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { toast } from 'react-toastify';
import { object, string } from "yup";
import { useNavigate } from 'react-router-dom'
export default function EditOrder(props) {
    const { auth } = useContext(AppContext), history = useNavigate();
    let { data = {}, handlers } = useContext(Order360Context), { permissions, interactionInputs, workflowLookup, currStatusLookup, roleLookup, orderData } = data, { initialize, setInteractionInputs, setRoleLookup } = handlers, { userLookup } = props;
    const [error, setError] = useState({});
    const handleStatusChange = (e) => {
        let entity = [];
        const { target } = e;
        handleOnTicketDetailsInputsChange(e);
        // eslint-disable-next-line array-callback-return
        workflowLookup && workflowLookup.entities.map((unit) => {
            for (const property in unit.status) {
                if (unit.status[property].code === target.value) {
                    entity.push(unit);
                    break;
                }
            }
        });

        // console.log(entity, "on status change");

        if (entity && entity?.length === 1 && entity?.[0]?.roles.length === 1 && entity?.[0]?.entity.length === 1 &&
            entity?.[0]?.roles?.[0].roleId && entity?.[0]?.entity?.[0]?.unitId) {
            setInteractionInputs({
                ...interactionInputs,
                [target.id]: target.value,
                assignRole: entity?.[0]?.roles?.[0].roleId,
                assignDept: entity?.[0]?.entity?.[0]?.unitId
            })
        }
        setRoleLookup(entity);

        const taskFromWorkflow = _.flatMap(entity, (item) => {
            let taskForCurrentRole = item?.roles?.find(x => x.roleId == auth?.currRoleId);
            let taskForCurrentStatus = item?.status?.find(x => x.code == target.value);
            // console.log(taskForCurrentRole, taskForCurrentStatus)
            if (taskForCurrentRole && taskForCurrentStatus) return item.task;
        }).filter(item => !!item);

        // console.log("taskdetails =========> ", taskFromWorkflow)

        // setTaskDetails(taskFromWorkflow ?? []);
        // taskAvailableAndNotCompletedFunc(taskFromWorkflow ?? [])
    };
    const handleOnTicketDetailsInputsChange = (e) => {
        const { target } = e;
        if (target.id === "assignRole") {
            console.log(target)
            const { unitId = "" } =
                target.value !== "" &&
                JSON.parse(target.options[target.selectedIndex].dataset.entity);
            setInteractionInputs({
                ...interactionInputs,
                [target.id]: target.value,
                assignDept: unitId,
            });
            // isRoleChangedByUserRef.current = true;
        } else {
            setInteractionInputs({
                ...interactionInputs,
                [target.id]: target.value,
            });
        }
        setError({
            ...error,
            [target.id]: "",
        });
    };
    const validate = (section, schema, data) => {
        try {
            if (section === "DETAILS") {
                setError({});
            }
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e?.inner?.forEach((err) => {
                if (section === "DETAILS") {
                    setError((prevState) => {
                        return { ...prevState, [err.params.path]: err.message };
                    });
                }
            });
            return e;
        }
    };
    const ticketDetailsValidationSchema = object().shape({
        currStatus: string().required("Current Status is required"),
        //assignRole: string().required("Assgin to Department/Role is required")
        // assignRole: string().when(
        //   "currStatus", {
        //   is: 'CLS',
        //   then: string().optional(),
        //   otherwise: string().required()
        // })
        // string().required("Assgin to Department/Role is required"),

    });
    const checkTicketDetails = () => {
        // console.log("interactionInputs interactionInputs interactionInputs", interactionInputs);
        let error = validate(
            "DETAILS",
            ticketDetailsValidationSchema,
            interactionInputs
        );

        if (!interactionInputs.assignRole && !interactionInputs.currStatus === 'CLS') {
            toast.error("Validation errors found. Please check assign role field");
            return false;
        }


        if (error) {
            toast.error("Validation errors found. Please check highlighted fields");
            return false;
        }

        return true;
    };
    const handleTicketDetailsSubmit = (e) => {
        e.preventDefault();
        if (checkTicketDetails()) {
            let reqBody = {
                roleId: Number(interactionInputs?.assignRole),
                departmentId: interactionInputs?.assignDept,
                status: interactionInputs?.currStatus
            };

            // if (selectedTask?.length) {
            //     reqBody['tasks'] = selectedTask;
            // }

            // // console.log("taskdetails =========> ", taskDetails)
            // // console.log(reqBody);

            // for (let index = 0; index < taskDetails.length; index++) {
            //     let taskInfo = selectedTask.find(x => x.taskNo == taskDetails?.[index]?.['taskNo']);
            //     if (!taskInfo) {
            //         toast.error("Please select all task status and give some comments"); return false;
            //     }

            //     if (!taskInfo?.comments || taskInfo?.comments == "") {
            //         toast.error("Please give some comments for all the tasks"); return false;
            //     }
            // }

            if (interactionInputs?.user) {
                reqBody.userId = Number(interactionInputs?.user);
            }
            if (interactionInputs?.remarks) {
                reqBody.remarks = interactionInputs?.remarks;
            }

            put(properties.ORDER_API + "/edit/" + orderData.orderNo, { ...reqBody })
                .then((response) => {
                    // console.log(response);
                    toast.success(`${response?.message}`);
                    history(`/my-workspace`);
                })
                .catch((error) => {
                    console.error(error);
                    toast.error(error);
                })
                .finally();
        }
    };
    return (
        <>
            <div className="row pt-2">
                <div className="col-md-4">
                    <div className="form-group">
                        <label htmlFor="Contactpreferenece" className="control-label">
                            Status <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className="custselect">
                            <select
                                disabled={permissions?.readOnly}
                                id="currStatus"
                                value={interactionInputs?.currStatus}
                                onChange={(e) => { handleStatusChange(e); }}
                                className={`form-control ${error?.currStatus && "error-border"
                                    }`}
                            >
                                <option key="status" value="">
                                    Select...
                                </option>
                                {currStatusLookup &&
                                    currStatusLookup.map((currStatus, index) => (
                                        <option key={index} value={currStatus?.code || ''}>
                                            {currStatus?.description}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label htmlFor="Contactpreferenece" className="control-label">
                            Department/Role{" "}
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className="custselect">
                            <select
                                disabled={permissions?.readOnly}
                                id="assignRole"
                                value={interactionInputs?.assignRole}
                                onChange={(e) => {
                                    handleOnTicketDetailsInputsChange(e);
                                }}
                                className={`form-control ${error?.assignRole && "error-border"}`}
                            >
                                <option key="role" value="" data-entity="">
                                    Select Role
                                </option>
                                {roleLookup &&
                                    roleLookup.map((dept, key) => (
                                        <optgroup key={key} label={dept?.entity[0]?.unitDesc}>
                                            {!!dept.roles.length &&
                                                dept.roles.map((data, childKey) => (
                                                    <option
                                                        key={childKey}
                                                        value={data?.roleId}
                                                        data-entity={JSON.stringify(dept?.entity?.[0])}
                                                    >
                                                        {data?.roleDesc}
                                                    </option>
                                                ))}
                                        </optgroup>
                                    ))}
                            </select>
                            <span className="errormsg">
                                {error.assignRole ? error.assignRole : ""}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="form-group">
                        <label htmlFor="Contactpreferenece" className="control-label">
                            User <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <div className="custselect">
                            <select
                                disabled={permissions?.readOnly}
                                id="user"
                                className={`form-control ${error.user && "error-border"}`}
                                value={interactionInputs.user}
                                onChange={handleOnTicketDetailsInputsChange}
                            >
                                <option key="user" value="">
                                    Select User
                                </option>
                                {userLookup &&
                                    userLookup.map((user) => (
                                        <option key={user?.userId} value={user?.userId}>
                                            {user?.firstName || ''} {user.lastName || ''}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row mt-2">
                <div className="col-md-12">
                    <div className="form-group">
                        <label htmlFor="Contactpreferenece" className="control-label">
                            Remarks
                        </label>
                        <textarea
                            disabled={permissions?.readOnly}
                            maxLength="2500"
                            className={`form-control ${error?.remarks && "error-border"
                                }`}
                            id="remarks"
                            name="remarks"
                            rows="4"
                            value={interactionInputs?.remarks}
                            onChange={handleOnTicketDetailsInputsChange}
                            autoFocus
                        ></textarea>
                        <span className="skel-fnt-xs">Maximum 2500 characters</span>
                    </div>
                </div>
            </div>
            <div className="modal-footer skel-btn-center-cmmn">
                <div className="skel-btn-center-cmmn">
                    <button type="button" className="skel-btn-cancel" onClick={() => props?.onClose?.()}>
                        Cancel
                    </button>
                    <button type="submit" className="skel-btn-submit" id="btn-save-event" disabled={permissions.readOnly}
                        onClick={handleTicketDetailsSubmit}>
                        Submit
                    </button>
                </div>
            </div>
        </>
    )
}
