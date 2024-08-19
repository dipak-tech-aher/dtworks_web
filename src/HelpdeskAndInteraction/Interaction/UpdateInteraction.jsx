import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { properties } from '../../properties';
import axios from 'axios';

const UpdateInteraction = (props) => {
    const [ticketSubmitted, setTicketSubmitted] = useState();

    useEffect(() => {
        const query = new URLSearchParams(props.location.search);
        const intxnToken = query.get('intxnToken');
        const intxnNo = query.get('intxnNo');
        const roleId = query.get('roleId');
        const departmentId = query.get('departmentId');
        const status = query.get('status');
        submitTicket(status, roleId, departmentId, intxnNo);
    }, [])

    const capitalizeFirstLetter = (string) => {
        return string?.charAt(0)?.toUpperCase() + string?.slice(1);
    };

    const submitTicket = (statusCode, assignRole, assignDept, intxnNo) => {
        let reqBody = {
            interactionNumber: intxnNo,
            status: statusCode,
            selectedRoles: [{
                roleId: Number(assignRole),
                unitId: assignDept
            }]
        };
        const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)

        axios({
            method: 'put',
            url: `${API_ENDPOINT}${properties.INTERACTION_API}/update-via-notify-medium/${intxnNo}`,
            headers: {
                "Content-Type": "application/json",
                "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined
            },
            data: reqBody
        }).then(response => {
            setTicketSubmitted(response.data);
        }).catch((error) => {
            console.log(error);
            setTicketSubmitted({
                status: 500,
                message: error?.response?.data?.message
            });
        });
    }

    return (
        <div className="d-flex justify-content-center" style={{ position: 'absolute', left: 0, width: '100vw', zIndex: 1, marginTop: 0, marginBottom: 0 }}>
            <Card className="text-center">
                {ticketSubmitted && (
                    <React.Fragment>
                        <Card.Header><span style={{ color: 'white', fontSize: '26px' }}>{ticketSubmitted?.status == 200 ? 'Ticket Submitted!' : 'Error in ticket Submission!'}</span></Card.Header>
                        <Card.Body>
                            <Card.Text>{ticketSubmitted?.message}</Card.Text>
                        </Card.Body>
                    </React.Fragment>
                )}
            </Card>
        </div>
    )
}

export default UpdateInteraction;