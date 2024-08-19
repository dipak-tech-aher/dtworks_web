import { useState } from "react";
import { Element } from 'react-scroll';
import CreateProfileModal from "./CreateProfileModal";
import HelpdeskDetails from "./HelpdeskDetails";
import EditHelpdeskModal from "./EditHelpdeskModal";
import { RegularModalCustomStyles } from "../../common/util/util";
import Modal from "react-modal";
import Select from "react-select";
import { isEmpty } from 'lodash'

const HelpdeskInfo = (props) => {
    const { detailedViewItem, customerDetails, projectTypes, helpdeskStatus, helpdeskTypes, severities, cancelReasonLookup, projectLookup, appsConfig, preferenceLookup } = props?.data;
    const { doSoftRefresh } = props?.handlers
    const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
    const [isCreateHelpdeskOpen, setIsCreateHelpdeskOpen] = useState(false);
    const [isTruncated, setIsTruncated] = useState(true);
    const [openMinimalInfo, setOpenMinimalInfo] = useState(false)

    const toggleTruncate = () => {
        setIsTruncated(!isTruncated);
    };

    const handleOpenMinimalInfo = () => {
        setOpenMinimalInfo(true);
    }

    return (
        <>
            {/* Profile details */}
            <div>
                <div className="row">
                    <div className="col-6 pl-2 mt-2">
                        <h6>Profile Details</h6>
                    </div>
                    {customerDetails && customerDetails?.profileId && <div className="col-6 pr-2 pr-0 pt-1 text-right">
                        <button type="button" className="skel-btn-submit" onClick={() => setIsCreateProfileOpen(!isCreateProfileOpen)}>
                            Update Profile
                        </button>
                    </div>}
                </div>
                {
                    ((!customerDetails || !customerDetails?.profileId || !customerDetails.profileNo)) &&
                    <div className="skel-widget-warning">
                        <span className="text-center mb-2">
                            Profile Source not found. Please Create new Profile!
                        </span>
                        <div className="text-center">
                            <button type="button" className="skel-btn-submit" onClick={() => setIsCreateProfileOpen(!isCreateProfileOpen)}> Add/Update Profile</button>
                        </div>
                    </div>
                }
                {/* {
                    ((customerDetails && customerDetails !== null && customerDetails?.profileId && customerDetails.profileNo)) &&
                    <div className="col-12 pl-0 pr-0 pt-1 text-right">
                        <button type="button" className="skel-btn-submit" onClick={() => setIsCreateProfileOpen(!isCreateProfileOpen)}>
                            Add/Update Profile
                        </button>
                    </div>
                } */}
                {
                    (customerDetails && customerDetails !== null && customerDetails?.profileId && customerDetails.profileNo) &&
                    <div className="col-12 row pt-2 m-0 helpdesk-padding-left-0 skel-interaction-detail-section">
                        <Element>
                            <table>
                                <tr>
                                    <td width="100%" className='form-label'>Profile ID</td>
                                    <td width="5">:</td>
                                    <td width="25%" className="text-primary cursor-pointer" onClick={() => { handleOpenMinimalInfo() }}>{customerDetails?.customer?.crmCustomerNo || customerDetails?.profileNo}</td>
                                </tr>
                                <tr>
                                    <td width="100%" className='form-label'>Full Name</td>
                                    <td width="5%">:</td>
                                    <td width="25%">{customerDetails?.customer?.fullName || ((customerDetails?.firstName || "") + ' ' + (customerDetails?.lastName || ""))}</td>
                                </tr>
                                <tr>
                                    <td width="100%" className='form-label'>Contact Number</td>
                                    <td width="5%">:</td>
                                    <td width="50%">{customerDetails?.contactDetails?.mobileNo}</td>
                                </tr>
                                <tr>
                                    <td width="100%" className='form-label'>Email</td>
                                    <td width="5%">:</td>
                                    <td width="50%">{customerDetails?.contactDetails?.emailId}</td>
                                </tr>
                                <tr>
                                    <td width="100%" className='form-label'>Cc Email</td>
                                    <td width="5%">:</td>
                                    {
                                        console.log('detailedViewItem?.helpdeskCcRecipients', detailedViewItem?.helpdeskCcRecipients)
                                    }
                                    <td width="50%" onClick={toggleTruncate}>{!isEmpty(detailedViewItem?.helpdeskCcRecipients) && detailedViewItem?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n")}</td>
                                </tr>
                                <tr>
                                    <td width="100%" className='form-label'>Contact Preference</td>
                                    <td width="5%">:</td>
                                    <td width="50%">{customerDetails?.contactPreferences ? customerDetails?.contactPreferences?.map((e) => { return ' ' + e?.description }) : ''}</td>
                                </tr>
                            </table>
                        </Element>
                    </div>
                }
            </div>
            <hr className='cmmn-hline mt-2 mb-2' />
            {/* Helpdesk Details -View */}
            <div>
                <div className="row">
                    <div className="col-6 pl-2 mt-2">
                        <h6>Helpdesk Details</h6>
                    </div>
                    <div className="col-6 pr-2 pr-0 pt-1 text-right">
                        <button type="button" className="skel-btn-submit" onClick={() => setIsCreateHelpdeskOpen(!isCreateHelpdeskOpen)}>
                            Update Helpdesk
                        </button>
                    </div>
                </div>
                <HelpdeskDetails
                    data={{
                        helpdeskNo: detailedViewItem?.helpdeskNo,
                    }}
                />
            </div>
            {
                isCreateProfileOpen &&
                <CreateProfileModal
                    data={{
                        isCreateProfileOpen,
                        detailedViewItem
                    }}
                    handlers={{
                        doSoftRefresh,
                        setIsCreateProfileOpen
                    }}
                />
            }
            {
                isCreateHelpdeskOpen &&
                <EditHelpdeskModal
                    data={{
                        isCreateHelpdeskOpen,
                        detailedViewItem,
                        projectTypes,
                        helpdeskStatus,
                        helpdeskTypes,
                        severities,
                        cancelReasonLookup,
                        projectLookup
                    }}
                    handlers={{
                        doSoftRefresh,
                        setIsCreateHelpdeskOpen
                    }}
                />
            }
            {openMinimalInfo && <Modal
                isOpen={openMinimalInfo}
                contentLabel="Customer Minimal Info Modal"
                style={RegularModalCustomStyles}
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
                                    {appsConfig?.clientFacingName?.customer ?? 'Customer'} Info
                                </h5>
                                <button
                                    type="button"
                                    className="close"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => setOpenMinimalInfo(false)}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <hr className="cmmn-hline" />
                                <div className="clearfix"></div>
                                <div className="row pt-3">
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                {appsConfig?.clientFacingName?.customer ?? 'Customer'} Name
                                            </label>
                                            <input type="text" className="form-control" value={(customerDetails?.firstName ?? '') + ' ' + (customerDetails?.lastName ?? '')} readOnly={true} />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                {appsConfig?.clientFacingName?.customer ?? 'Customer'} Category
                                            </label>
                                            <input type="text" className="form-control" value={customerDetails?.profileCategory?.description ?? ''} readOnly={true} />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                {appsConfig?.clientFacingName?.customer ?? 'Customer'} Contact Number
                                            </label>
                                            <input type="text" className="form-control" value={customerDetails?.contactDetails?.mobilePrefix + ' ' + customerDetails?.contactDetails?.mobileNo} readOnly={true} />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                {appsConfig?.clientFacingName?.customer ?? 'Customer'} Email Id
                                            </label>
                                            <input type="text" className="form-control" value={customerDetails?.contactDetails?.emailId} readOnly={true} />
                                        </div>
                                    </div>
                                    <div className="col-3">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                {appsConfig?.clientFacingName?.customer ?? 'Customer'} Contact Preference
                                            </label>
                                            <Select
                                                value={customerDetails?.contactPreferences?.map((option) => {
                                                    const matchingPreference = preferenceLookup.find((preference) => preference?.code === option?.code);
                                                    return {
                                                        value: option?.code,
                                                        label: matchingPreference ? matchingPreference.description : '',
                                                    };
                                                })}
                                                options={preferenceLookup.map((preference) => ({
                                                    value: preference.code,
                                                    label: preference.description,
                                                }))}
                                                isMulti={true}
                                                menuPortalTarget={document.body}
                                                readOnly={true}
                                                isDisabled={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>}
        </>
    )
}

export default HelpdeskInfo