import React from 'react'
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { properties } from '../../../../../properties';
export default function Interaction(props) {
    let interactionDetails = props.data?.detailedViewItem?.interactionDetails;
    const history = useNavigate();
    const redirectToRespectivePages = (rows) => {
        const data = {
            intxnNo: rows?.intxnNo,
            customerUid: rows?.customerUid,
            sourceName: 'helpdesk360'
        }
        history(`/interaction360`, { state: {data} })
    }
    return (
        <div className="view-int-details-key skel-tbl-details">
            {interactionDetails && interactionDetails.length > 0 ? <>
                <table className="table-responsive dt-responsive nowrap w-50">
                    <tbody>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Interaction ID
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>
                                <a className="txt-underline cursor-pointer" onClick={() => redirectToRespectivePages(interactionDetails[0])}>
                                    {get(interactionDetails, '[0].intxnNo', '-')}
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Interaction Category
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].intxnCategory.description', '-')}</td>

                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Interaction Type
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].intxnType.description', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Service Category
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].serviceCategory.description', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Service Type
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].serviceType.description', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">Channel</span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].intxnChannel.description', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">Project</span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].projectInfo.description', '-')}</td>
                        </tr>
                    </tbody>
                </table>
                <table className="table-responsive dt-responsive nowrap w-50 ml-4">
                    <tbody>
                        <tr>
                            <td>
                                <span className="font-weight-bold">Severity</span>
                            </td>
                            <td width="5%">:</td>
                            <td>
                                <span className="badge badge-danger badge-critical px-3 py-1 rounded-pill text-15 font-weight-normal">
                                    {get(interactionDetails, '[0].intxnPriority.description', '-')}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">Created At</span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].createdAt', false) ? moment(get(interactionDetails, '[0].createdAt', false)).format("DD-MMM-YYYY HH:MM:SS A") : '-'}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Current Department
                                </span>
                            </td>
                            <td width="5%">:</td>

                            <td>{get(interactionDetails, '[0].currDeptInfo.unitDesc', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">Role</span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].currRoleInfo.roleDesc', '-')}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">User</span>
                            </td>
                            <td width="5%">:</td>
                            <td>{(get(interactionDetails, '[0].currUserInfo.firstName', false) && get(interactionDetails, '[0].currUserInfo.lastName', false)) ? `${get(interactionDetails, '[0].currUserInfo.firstName',)} ${get(interactionDetails, '[0].currUserInfo.lastName', false)}` : '-'}</td>
                        </tr>
                        <tr>
                            <td>
                                <span className="font-weight-bold">
                                    Completion Date
                                </span>
                            </td>
                            <td width="5%">:</td>
                            <td>{get(interactionDetails, '[0].edoc', '-')}</td>
                        </tr>
                    </tbody>
                </table>
            </> : <span className="skel-widget-warning">
                No interactions found!
            </span>}

        </div>
    )
}
