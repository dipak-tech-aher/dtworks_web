import moment from "moment";
import React, { useMemo, useState } from "react";
import reminder from "../../../../../assets/images/reminder.svg";
import FileUpload from "../../../../../common/uploadAttachment/fileUpload";
import {
  getColorClass,
  getFullName,
} from "../../../../../common/util/commonUtils";
import { DefaultDateFormate } from "../../../../../common/util/dateUtil";
import HeaderActionsMenu from "../../../../CommonComponents/HeaderActionsMenu";
import AddEditTask from "../../../../CommonComponents/AddEditTask";
//import Scanimg from "../../../../../assets/images/main-qimg-833c55a3dd50cfa33fd7795809828a4e-lq2.jpeg";
import { Modal } from "react-bootstrap";
import { properties } from "../../../../../properties";
import { statusConstantCode } from "../../../../../AppConstants";
const InteractionDetails = (props) => {
  const { interactionDetails, lookupData, isModelOpen, existingFiles, currentFiles, appConfig, auth, permissions,dtWorksProductType } = props?.data;
  const { setIsModelOpen, setCurrentFiles, setExistingFiles, handleOnAssignToSelf, handleOnReAssignToSelf, checkComponentPermission, setShowTaskModal } = props?.stateHandlers;
  const [viewOtherDetails, setViewOtherDetails] = useState(false);

  // console.log('interactionDetails ', interactionDetails)
  const reminderDate = useMemo(() => {
    const currentDate = moment();
    const CompletionDate = interactionDetails?.edoc
      ? moment(interactionDetails?.edoc)
      : undefined;
    if (CompletionDate) {
      return CompletionDate.diff(currentDate, "days");
    }
    return undefined;
  }, [interactionDetails?.edoc]);

  //To find remaining hours of the day
  const reminderHours = useMemo(() => {
    const currentDate = moment();
    const eod = moment().endOf("day");
    if (!reminderDate) {
      return eod.diff(currentDate, "hours");
    }
    return undefined;
  }, [reminderDate]);

  const handleOnServiceClick = () => {
    const data = {
      ...interactionDetails.serviceDetails,
      accountDetails: interactionDetails.accountDetails,
      customerDetails: interactionDetails.customerDetails,
    }

    localStorage.setItem('viewServiceData', JSON.stringify(data));

    window.open(`${properties.REACT_APP_BASE}/view-service`, "_blank")
  }
  const isIntxnSolvedBy = interactionDetails?.isResolvedBy;

  return (
    <div className="cmmn-skeleton mt-2">
      <HeaderActionsMenu
        data={{ isModelOpen, permissions, module: "INTERACTION" }}
        stateHandlers={{ setIsModelOpen, setShowTaskModal }}
        functionHandlers={{
          handleOnAssignToSelf,
          handleOnReAssignToSelf,
          checkComponentPermission,
        }}
      />
      <hr className="cmmn-hline mt-2" />
      <div className="view-int-details-key skel-tbl-details">
        <table>
          {dtWorksProductType === statusConstantCode?.type?.CUSTOMER_SERVICE && <tr>
            <td>
              <span className="font-weight-bold">Subscription Number</span>
            </td>
            <td width="5%">:</td>
            <td><span className="txt-lnk txt-underline" onClick={handleOnServiceClick}>{interactionDetails?.serviceDetails?.serviceNo ?? "-"}</span></td>
          </tr>}
          <tr>
            <td>
              <span className="font-weight-bold">Interaction Category</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.intxnCategory?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Interaction Type</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.intxnType?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Service Category</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.serviceCategory?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Service Type</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.serviceType?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Interaction Cause</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.intxnCause?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Channel</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.intxnChannel?.description ?? "-"}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Project</span>
            </td>
            <td width="5%">:</td>
            <td>{interactionDetails?.projectDesc?.description ?? ""}</td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Severity</span>
            </td>
            <td width="5%">:</td>
            <td>
              <span
                className={`${interactionDetails?.severity?.code
                  ? `sev-critical ${getColorClass(
                    lookupData?.current?.SEVERITY,
                    interactionDetails?.severity?.code
                  ) ?? "skel-h-status"
                  }`
                  : ""
                  }`}
              >
                {interactionDetails?.severity?.description ?? "-"}
              </span>
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Contact Preference</span>
            </td>
            <td width="5%">:</td>
            <td>
              {(interactionDetails?.contactPreference &&
                interactionDetails?.contactPreference
                  ?.map((m) => m?.description)
                  .join(",")) ??
                "-"}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Location Details</span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.intxnAddress ? (
                <React.Fragment>
                  {interactionDetails?.intxnAddress?.address1 ?? ""}&nbsp;
                  {interactionDetails?.intxnAddress?.address2 ?? ""}&nbsp;
                  {interactionDetails?.intxnAddress?.address3 ?? ""}
                  <br />
                  {interactionDetails?.intxnAddress?.addrZone?.description ??
                    ""}
                  {interactionDetails?.intxnAddress?.city ?? ""}&nbsp;
                  {interactionDetails?.intxnAddress?.district ?? ""}&nbsp;
                  {interactionDetails?.intxnAddress?.state ?? ""}&nbsp;
                  {interactionDetails?.intxnAddress?.country ?? ""} -{" "}
                  {interactionDetails?.intxnAddress?.postcode ?? ""}&nbsp;
                </React.Fragment>
              ) : (
                "-"
              )}
            </td>
          </tr>
        </table>
        <table className="ml-4">
          <tr>
            <td>
              <span className="font-weight-bold">Current Department </span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.parallelUnits?.length > 0 ? (
                interactionDetails?.parallelUnitsDesc?.map((ele, index) => (
                  <div key={index}>
                    {ele?.currentParallelDepartments?.unitDesc}
                  </div>
                ))
              ) : (
                <div>
                  {interactionDetails?.currentDepartment?.description
                    ?.unitDesc ?? "-"}
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Current Role </span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.parallelUnits?.length > 0 ? (
                interactionDetails?.parallelUnitsDesc?.map((ele, index) => (
                  <div key={index}>{ele?.currentParallelRoles?.roleDesc}</div>
                ))
              ) : (
                <div>
                  {interactionDetails?.currentRole?.description?.roleDesc ??
                    "-"}
                </div>
              )}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Current User</span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.currentUser?.description
                ? getFullName(interactionDetails?.currentUser?.description)
                : "-"}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Expected Completion Date</span>
            </td>
            <td width="5%">:</td>
            <td className="font-weight-bold">
              {interactionDetails?.edoc
                ? DefaultDateFormate(interactionDetails?.edoc)
                : "-"}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Work Completion Date</span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.workCompletionDate
                ? DefaultDateFormate(interactionDetails?.workCompletionDate)
                : " -"}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Last Modified By</span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.updatedByDetails &&
                Object.keys(interactionDetails?.updatedByDetails).length
                ? `${interactionDetails?.updatedByDetails?.firstName ?? ""} ${interactionDetails?.updatedByDetails?.lastName ?? ""
                }`
                : "-"}
            </td>
          </tr>
          <tr>
            <td>
              <span className="font-weight-bold">Last Modified Date</span>
            </td>
            <td width="5%">:</td>
            <td>
              {interactionDetails?.updatedAt
                ? DefaultDateFormate(interactionDetails?.updatedAt)
                : "-"}
            </td>
          </tr>
          <tr>
            {/* need to fix inactive service type render issue - 0000614 */}
            <td>
              <span className="font-weight-bold">Solutions Solved by</span>
            </td>
            <td width="5%">:</td>
            <td className="font-weight-bold">
              {!isIntxnSolvedBy ? (
                <span>NOT RESOLVED YET</span>
              ) : (
                <div className="d-flex">
                  <span>
                    Smart Assistance {isIntxnSolvedBy === "BOT" ? "✅" : "❌"}
                  </span>
                  <span>
                    Human{" "}
                    {["HUMAN", "IRB_MANUAL"].includes(isIntxnSolvedBy)
                      ? "✅"
                      : "❌"}
                  </span>
                </div>
              )}
            </td>
          </tr>
          
          <tr>
            <td>
              <span className="font-weight-bold">Resolution</span>
            </td>
            <td width="5%">:</td>
            <td>
              <p className="line-height-normal mb-0 px-0">
                {interactionDetails?.responseSolution?.description ?? "-"}
              </p>
            </td>
          </tr>
          {reminderDate !== undefined && (
            <tr>
              <td colSpan="3">
                <div className="jumbotron bg-white border px-2 py-2 w-60 mt-2">
                  <div className="row align-items-center">
                    <div className="col-md-7 text-center">
                      <p className="mb-0 mb-0 d-block p-0 line-height-normal">
                        {reminderDate < 0 ? (
                          <div className="skel-word-break">
                            Interaction is<strong> overdue</strong> for more
                            than <strong>{Math.abs(reminderDate)} days</strong>{" "}
                          </div>
                        ) : reminderDate === 0 ? (
                          <div className="skel-word-break">
                            <strong>{reminderHours} more hours</strong> is
                            interaction completion date
                          </div>
                        ) : (
                          <div className="skel-word-break">
                            <strong>{reminderDate} more days</strong> to go for
                            Interaction Completion
                          </div>
                        )}
                      </p>
                    </div>
                    <div className="col-md">
                      <img
                        src={reminder}
                        alt={"remider"}
                        width="170"
                        className="img-fluid"
                      />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </table>
      </div>
      <div class="skel-help-cnt-sect">
        <span class="font-weight-bold mt-2 d-flex mb-2">Remarks</span>
        <p
          className="line-height-normal mb-0 px-0"
          dangerouslySetInnerHTML={{
            __html: interactionDetails?.intxnDescription ?? "-",
          }}
        ></p>
        <span
          className="txt-underline cursor-pointer"
          style={{ color: "rgb(6 88 242)" }}
          onClick={() =>
            setIsModelOpen({
              ...isModelOpen,
              isWorkflowHistoryOpen: true,
            })
          }
        >
          View Other Remarks
        </span>
      </div>
      <div>
        <span className="font-weight-bold mt-3 d-flex mb-2">Attachments</span>
        <div className="attachment-details">
          <FileUpload
            data={{
              currentFiles: currentFiles,
              entityType: "INTERACTION",
              existingFiles: existingFiles,
              interactionId: interactionDetails?.intxnUuid,
              permission: true,
            }}
            handlers={{
              setCurrentFiles: setCurrentFiles,
              setExistingFiles: setExistingFiles,
            }}
          />
        </div>
      </div>

      {/* Attachment Category */}
      {/* <div className='skel-up-category'>
          <hr className='cmmn-hline mt-2 mb-2' />
          <span className="skel-header-title">Category wise Attachements</span>

          <div className='row'>
              <div className='col-md-6'>
                  <span class="font-weight-bold mt-2 mb-2">Passport Details</span>
                  <div class="attachment-details">
                      <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportfront.png</span>
                      <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportback.png</span>
                  </div>
              </div>
          </div>
          <div className='row mt-2'>
              <div className='col-md-6'>
                  <span class="font-weight-bold mt-2 mb-2">ID Card Details</span>
                  <div class="attachment-details">
                      <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportfront.png</span>
                      <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportback.png</span>
                  </div>
              </div>                    
          </div>          
      </div> */}
      <hr className="cmmn-hline mt-2 mb-2" />
      <span
        className="cursor-pointer d-flex align-rht-side"
        onClick={() => {
          setViewOtherDetails(!viewOtherDetails);
        }}
      >
        <div
          id="showHideText"
          style={{ float: "right" }}
          className="txt-underline"
        >
          {viewOtherDetails ? "Hide " : "View "}Requirement Details
        </div>
      </span>
      {viewOtherDetails && (
        <div id="searchBlock">
          <span className="skel-profile-heading">Requirement Details</span>
          <div className="container-three-row">
            <div className="container-label">
              <span className="label-container-style">Solutions Solved by</span>
              <span>
                {interactionDetails?.isResolvedBy
                  ? interactionDetails?.isResolvedBy === "BOT"
                    ? "Smart Assistance"
                    : "Human"
                  : "-"}
              </span>
            </div>
            {interactionDetails?.intxnStatus?.code !== "CLOSED" &&
              appConfig?.clientConfig?.interaction?.editInteraction?.map(
                (ele) => (
                  <>
                    {ele?.isEnable &&
                      ele?.columnName === "isDownTimeRequired" &&
                      ele?.roleId?.includes(auth?.currRoleId) && (
                        <div className="container-label">
                          <span className="label-container-style">
                            Downtime Required (Yes/No)
                          </span>
                          <span>
                            {interactionDetails?.isDownTimeRequired
                              ? "Yes"
                              : !interactionDetails?.isDownTimeRequired
                                ? "No"
                                : ""}
                          </span>
                        </div>
                      )}
                    {ele?.isEnable &&
                      ele?.columnName === "techCompletionDate" &&
                      ele?.roleId?.includes(auth?.currRoleId) && (
                        <div className="container-label">
                          <span className="label-container-style">
                            Date of Tech Completion
                          </span>
                          <span>
                            {interactionDetails?.techCompletionDate
                              ? DefaultDateFormate(
                                interactionDetails?.techCompletionDate
                              )
                              : "-"}
                          </span>
                        </div>
                      )}
                    {ele?.isEnable &&
                      ele?.columnName === "deployementDate" &&
                      ele?.roleId?.includes(auth?.currRoleId) && (
                        <div className="container-label">
                          <span className="label-container-style">
                            Date of Deployment
                          </span>
                          <span>
                            {interactionDetails?.deployementDate
                              ? DefaultDateFormate(
                                interactionDetails?.deployementDate
                              )
                              : "-"}
                          </span>
                        </div>
                      )}
                  </>
                )
              )}
          </div>
        </div>
      )}
      {/* {
        <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" dialogClassName="cust-lg-modal" centered show={showTaskModal} onHide={() => { setShowTaskModal(false); setTaskDetails({}) }}>
          <Modal.Header>
            <Modal.Title><h5 className="modal-title">Add/Edit Task</h5></Modal.Title>
            <CloseButton onClick={() => { setShowTaskModal(false); setTaskDetails({}) }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

            </CloseButton>
          </Modal.Header>
          <Modal.Body>
            <AddEditTask 
            // data={
            //   {
            //     error, interactionData, isEdit: isTaskEdit, taskDetails, taskList, priorityLookup, taskStatusLookup, userList, tagsLookup
            //   }
            // }
              // handler={
              //   {
              //     handleInputChange,
              //     setTaskDetails,
              //     setTaskList,
              //     setTaskStatusLookup,
              //     setShowTaskModal,
              //     AddTask
              //   }
              // }
            />
          </Modal.Body>
        </Modal>
      } */}
    </div>
  );
};

export default InteractionDetails;
