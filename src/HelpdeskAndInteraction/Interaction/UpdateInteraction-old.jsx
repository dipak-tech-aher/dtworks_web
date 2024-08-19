import React, { useEffect, useRef, useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { get, put } from "../../common/util/restUtil";
import { properties } from '../../properties';
import moment from "moment";
import axios from 'axios';
import { toast } from "react-toastify";
import DynamicForm from './CreateInteraction/DynamicForm';

const UpdateInteraction = (props) => {
    const [interactionDetails, setInteractionDetails] = useState();
    const [currStatusLookup, setCurrStatusLookup] = useState([]);
    const [roleLookup, setRoleLookup] = useState([]);
    const [formData, setFormData] = useState({});
    const [ticketSubmitted, setTicketSubmitted] = useState();
    const [errorMessage, setErrorMessage] = useState();
    const [values, setValues] = useState([])
    const formRef = useRef();
    const sigPad = useRef();
    useEffect(() => {
        get(`${properties.INTERACTION_API}/get-interaction-details/${props?.match?.params?.token}`).then((resp) => {
            if (resp?.data) {
                setInteractionDetails(resp.data);
                let statusArray = [];
                resp.data?.workflowDetails?.entities?.map((node) => {
                    node?.status?.map((st) => {
                        statusArray.push(st);
                    });
                });
                let statusLookup = [
                    ...new Map(
                        statusArray.map((item) => [item["code"], item])
                    ).values(),
                ];
                setCurrStatusLookup(statusLookup);
            }
        }).catch((error) => console.error(error))
    }, [])

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1);
    };

    const getRolesAndDeptBasedOnStatus = (statusCode) => {
        let rolesAndDepts = [];
        interactionDetails?.workflowDetails?.entities.map((unit) => {
            for (const property in unit.status) {
                if (unit.status[property].code === statusCode) {
                    rolesAndDepts.push(unit);
                    break;
                }
            }
        });
        return rolesAndDepts;
    }

    const handleChange = (e) => {
        const { id, value, options, selectedIndex } = e.target;
        if (id === "currStatus") {
            setRoleLookup([]);
            let rolesAndDepts = getRolesAndDeptBasedOnStatus(value);
            formData["assignRole"] = undefined;
            formData["assignDept"] = undefined;
            setTimeout(() => {
                setRoleLookup(rolesAndDepts);
            }, 500);
        } else if (id === "assignRole") {
            const { unitId = "" } = value !== "" && JSON.parse(options[selectedIndex].dataset.entity);
            formData["assignDept"] = unitId;
        }
        formData[id] = value;
        setFormData({ ...formData });
    }

    const checkTicketDetails = () => {
        if (!formData?.currStatus) {
            setErrorMessage("Please select interaction status");
            // toast.error("Please select interaction status");
            return false;
        }

        if (!formData?.assignRole) {
            setErrorMessage("Please select target role");
            // toast.error("Please select target role");
            return false;
        }

        if (formData?.currStatus == "REJECT" && !formData?.remarks?.trim()) {
            setErrorMessage("Comment required on rejection");
            // toast.error("Comment required on rejection");
            return false;
        }

        return true;
    };

    const submitTicket = (statusCode) => {
        // if (checkTicketDetails()) {
        let rolesAndDepts = getRolesAndDeptBasedOnStatus(statusCode);
        // console.log("rolesAndDepts ===> ", rolesAndDepts);
        let assignDept = rolesAndDepts?.[0]?.['entity']?.[0]?.['unitId']
        let assignRole = rolesAndDepts?.[0]?.['roles']?.[0]?.['roleId']
        // return;
        let reqBody = {
            roleId: Number(assignRole), // Number(formData?.assignRole),
            departmentId: assignDept, // formData?.assignDept,
            status: statusCode // formData?.currStatus,
        };
        if (formData?.user) {
            reqBody.userId = Number(formData?.user);
        }
        if (formData?.remarks) {
            reqBody.remarks = formData?.remarks;
        }

        // console.log(reqBody);
        const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

        axios({
            method: 'put',
            url: `${API_ENDPOINT}${properties.INTERACTION_API}/update-via-notify-medium/${interactionDetails.intxnNo}`,
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined
            },
            data: reqBody
        }).then(response => {
            setTicketSubmitted(response);
            // console.log("then block", response);
        }).catch((error) => {
            console.log("catch block", error);
            setErrorMessage("Some error occured");
            // toast.error(error);
        });
    }

    return (
        <div className="d-flex justify-content-center" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', zIndex: 1, marginTop: 0, marginBottom: 0 }}>
            <Card className="text-center">
                {!interactionDetails ? (
                    <React.Fragment>
                        <Card.Header><span style={{ color: 'white', fontSize: '26px' }}>Oops!</span></Card.Header>
                        <Card.Body>
                            <Card.Text>Ticket details not found.</Card.Text>
                        </Card.Body>
                    </React.Fragment>
                ) : ticketSubmitted ? (
                    <React.Fragment>
                        <Card.Header><span style={{ color: 'white', fontSize: '26px' }}>{ticketSubmitted?.status == 200 ? 'Ticket Submitted!' : 'Error in ticket Submission!'}</span></Card.Header>
                        <Card.Body>
                            <Card.Text>{ticketSubmitted?.message}</Card.Text>
                        </Card.Body>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <Card.Header><span style={{ color: 'white', fontSize: '26px' }}>Interaction Details</span></Card.Header>
                        <Card.Body>
                            <Card.Title><strong>{interactionDetails?.requestStatement}</strong></Card.Title>
                            <Card.Text>
                                <div className='mb-2'>
                                    <span><strong>Requested by:&nbsp;</strong>{capitalizeFirstLetter(interactionDetails?.customerDetails?.firstName)} {capitalizeFirstLetter(interactionDetails?.customerDetails?.lastName ?? '')}</span><br />
                                    <span><strong>Requested on:&nbsp;</strong>{moment(interactionDetails?.createdAt).format("DD-MMM-YYYY")}</span><br />
                                </div>
                                <div className='mb-2'>
                                    <DynamicForm
                                        data={{
                                            formAttributes: interactionDetails?.statementDetails?.metaAttributes || [],
                                            formRef,
                                            isFormDisabled: true,
                                            sigPad,
                                            isButtonHide: true,
                                            formDetails: interactionDetails?.formDetails || {},
                                            values
                                        }}
                                        handlers={{
                                            handleFormSubmit: () => { },
                                            handleFormOnChange: () => { },
                                            setValues
                                        }}
                                    />
                                </div>
                                <div>
                                    {/* <div className="form-group">
                                        <label htmlFor="currStatus" className="control-label">Status&nbsp;<span>*</span></label>
                                        <select id="currStatus" value={formData?.currStatus} onChange={handleChange} className={`form-control`}>
                                            <option key="status" value="">Select...</option>
                                            {currStatusLookup?.map((currStatus, index) => (
                                                <option key={index} value={currStatus?.code}>
                                                    {currStatus?.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="assignRole" className="control-label">Deparment/Role&nbsp;<span>*</span></label>
                                        <select id="assignRole" value={formData?.assignRole} onChange={handleChange} className={`form-control`}>
                                            <option key="role" value="" data-entity="">
                                                Select Role
                                            </option>
                                            {roleLookup.map((dept, key) => (
                                                <optgroup key={key} label={dept?.entity[0]?.unitDesc}>
                                                    {!!dept.roles.length && dept.roles.map((data, childKey) => (
                                                        <option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity[0])}>
                                                            {data.roleDesc}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div> */}
                                    {/* <div className="form-group">
                                        <label htmlFor="remarks" className="col-form-label">Comments</label>
                                        <textarea className='form-control' id="remarks" value={formData?.remarks} onChange={handleChange}></textarea>
                                    </div> */}
                                </div>
                            </Card.Text>
                            <p className='error-msg text-center' style={{ fontSize: '14px' }}>{errorMessage}</p>
                            <div className='text-center'>
                                {currStatusLookup?.map((currStatus, index) => (
                                    <a target='_blank' style={{
                                        width: '115px',
                                        height: '34px',
                                        padding: 0,
                                        textAlign: 'center',
                                        borderRadius: '5px',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        lineHeight: '34px',
                                    }} className={`${currStatus?.mappingPayload?.colorClass} ${index > 0 ? 'ml-2' : ''}`}>{currStatus?.code == "APPROVED" ? 'Approve' : currStatus?.description}</a>
                                ))}
                            </div>


                            {/* <a
                                key={index}
                                variant={`primary ${currStatus?.mappingPayload?.colorClass}`}
                                onClick={() => submitTicket(currStatus?.code)}>{currStatus?.code == "APPROVED" ? 'Approve' : currStatus?.description}
                            </a> */}
                        </Card.Body>
                        <Card.Footer className="text-muted">Requested on - {moment(interactionDetails?.createdAt).fromNow()}</Card.Footer>
                    </React.Fragment>
                )}
            </Card>
        </div>
    )
}

export default UpdateInteraction;