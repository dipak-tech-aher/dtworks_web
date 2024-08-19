import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { post, get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import EmailDetailsTab from "../shared/EmailDetailsTab";
import { Element } from "react-scroll";
import Attachements from "../shared/Attachments";
import { Markup } from "interweave";
import { useNavigate, useLocation } from "react-router-dom";
import { CustomerDetailsViewColumns } from "../CustomerDetailsViewColumn";
import DynamicTable from "../../../common/table/DynamicTable";
import { RegularModalCustomStyles } from "../../../common/util/util";
import Modal from "react-modal";

const ViewHelpdeskTicket = (props) => {
  const location = useLocation();
  let helpdeskId = props?.location?.state?.data?.helpdeskId;
  const oHelpdeskId = props?.location?.state?.data?.oHelpdeskId;
  helpdeskId = helpdeskId ?? oHelpdeskId;
  const [detailedViewItem, setDetailedViewItem] = useState();
  const [isTruncated, setIsTruncated] = useState(true);
  const [replyAttachments, setReplyAttachments] = useState([]);
  const [mailAttachments, setMailAttachments] = useState([]);
  const history = useNavigate();
  const [isWorflowHistoryOpen, setIsWorkflowHistoryOpen] = useState(false);
  const [isFollowUpHistoryOpen, setIsFollowUpHistoryOpen] = useState(false);
  const [interactionData, setInteractionData] = useState({});
  const [workflowHistory, setWorkflowHistory] = useState({
    rows: [],
    count: 0,
  });
  const [followUpHistory, setFollowUpHistory] = useState({
    rows: [],
    count: 0,
  });
  const getHelpdeskData = useCallback(() => {
    if (!helpdeskId) {
      toast.warn("Helpdesk Id not found");
    }

    const requestBody = {
      helpdeskId: Number(helpdeskId),
      contain: ["CUSTOMER", "INTERACTION"],
    };
    post(`${properties.HELPDESK_API}/search?limit=10&page=0`, requestBody)
      .then((response) => {
        const { status, data } = response;
        if (status === 200) {
          if (
            response &&
            response?.data &&
            response?.data?.rows &&
            response?.data?.rows.length > 0
          ) {
            setDetailedViewItem(response?.data?.rows?.[0]);
          }
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }, []);

  const getAttachments = useCallback((type) => {
    // Commented for dtWorks 2.0
    // detailedViewItem?.conversation[0]?.helpdeskTxnUuid
    const isHelpdesk = type === "HELPDESK" ? true : false;
    get(
      `${properties.ATTACHMENT_API}/${isHelpdesk
        ? detailedViewItem?.helpdeskUuid
        : `${detailedViewItem?.helpdeskUuid}?entityTxnUuid=${detailedViewItem?.conversation[0]?.helpdeskTxnUuid}`
      }`
    )
      .then((response) => {
        if (response.data && response.data.length) {
          isHelpdesk
            ? setMailAttachments(response.data)
            : setReplyAttachments(response.data);
        }
      })
      .catch((error) => {
        console.error("error", error);
      })
      .finally();
  }, [detailedViewItem]);

  useEffect(() => {
    getHelpdeskData();
  }, []);

  useEffect(() => {
    // console.log("Current route:", location.pathname?.split("/")[3]);
    if (
      helpdeskId && detailedViewItem &&
      detailedViewItem["interactionDetails"] &&
      detailedViewItem["interactionDetails"]?.length > 0 &&
      location.pathname?.includes("view-helpdesk-ticket")
    ) {
      get(
        `${properties.INTERACTION_API}/history/${detailedViewItem["interactionDetails"]?.[0]?.intxnNo}?getFollowUp=false&getAttachment=true`
      )
        .then((response) => {
          if (response?.data && response?.data) {
            setWorkflowHistory(response?.data);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();

      // get Interaction Followup History
      get(
        `${properties.INTERACTION_API}/history/${detailedViewItem["interactionDetails"]?.[0]?.intxnNo}?getFollowUp=true&getAttachment=true`
      )
        .then((response) => {
          if (response?.data && response?.data) {
            setFollowUpHistory(response?.data);
          }
        })
        .catch((error) => {
          console.error(error);
        })
        .finally();
    }
  }, []);

  useEffect(() => {
    if (detailedViewItem?.helpdeskUuid) {
      getAttachments("HELPDESK")
    }

    if (detailedViewItem && detailedViewItem?.conversation && !!detailedViewItem.conversation.length) {
      getAttachments("HELPDESKTXN");
    }
    // if (detailedViewItem && detailedViewItem?.conversation && !!detailedViewItem.conversation.length) {
    // Commented for dtWorks 2.0
    // getAttachments("HELPDESKTXN");
    // for (let idx = 0; idx < detailedViewItem.conversation.length; idx++) {
    //     if (detailedViewItem.conversation[idx].inOut === 'OUT') {
    //         // setConversationIndex(idx)
    //         break
    //     }
    // }
    // setConversationIndex(detailedViewItem.conversation.length - 1)
    // }
  }, [detailedViewItem, getAttachments]);

  const doSoftRefresh = () => {
    getHelpdeskData();
  };

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  const redirectToRespectivePages = (e, rows) => {
    const data = {
      intxnNo: rows?.intxnNo,
      customerUid: rows?.customerUid,
      sourceName: "customer360",
    };
    history(`/interaction360`, { state: {data} });
  };

  const handleCellRender = (cell, row) => {
    if (["Created On", "Updated On"].includes(cell.column.Header)) {
      return (
        <span>
          {cell.value
            ? moment(cell.value).format("DD-MMM-YYYY HH:MM:SS A")
            : "-"}
        </span>
      );
    } else if (cell.column.Header === "Interaction Number") {
      return (
        <span
          className="text-secondary"
          style={{ cursor: "pointer" }}
          onClick={(e) => redirectToRespectivePages(e, row.original)}
        >
          {cell.value}
        </span>
      );
    } else {
      return <span>{cell.value || "-"}</span>;
    }
  };


  const handleFileDownload = (id) => {
    get(`${properties.COMMON_API}/download-files/${id}`)
      .then((resp) => {
        if (resp?.data?.url) {
          const downloadLink = document.createElement("a");
          downloadLink.href = resp.data.url;
          downloadLink.style.display = "none";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      })
      .catch((error) => {
        console.error("error", error)
      })
      .finally(() => {

      })
  }

  return (
    <div className="container-fluid edit-complaint cust-skeleton cmmn-skeleton mt-2">
      {/* <div className={`row align-items-center`}>
                <div className="col">
                    <h1 className="title bold">Helpdesk ID {helpdeskId}</h1>
                </div>
                <div className="col-auto">
                    <button type="button" onClick={() => props.history.goBack()} className="btn btn-labeled btn-primary btn-sm">Back</button>
                </div>
            </div> */}
      <div className="">
        <div className="">
          <div className="">
            <div className="">
              {/* <div className={`col-md-2 sticky `}>
                                <nav className="navbar navbar-default navbar-fixed-top">
                                    <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                                        <ul key="ecul1" className="nav navbar-nav">
                                            <li key="ecli11">
                                                <Link activeclassName="active" to="ticketDetailsSection" spy={true} offset={-250} smooth={true} duration={100}>
                                                    Helpdesk Details
                                                </Link>
                                            </li>
                                        </ul>
                                    </div>
                                </nav>
                            </div> */}
              <div className="tab-pane active" id="details">
                <div className="">
                  <div className="col-12">
                    <div className="">
                      <div className="card-body p-0 pl-4 ml-2">
                        {
                          <EmailDetailsTab
                            data={{
                              detailedViewItem,
                            }}
                          />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <hr className="cmmn-hline mt-1 mb-1"></hr>
              <div className={`edit-inq new-customer skel-helpdesk-tab-details-management-view col-md-12`}>
                <div
                  data-spy="scroll"
                  data-target="#scroll-list"
                  data-offset="0"
                  className="new-customer"
                >
                  <div className="col-12">
                    <ul key="ecul2" className="nav nav-tabs" role="tablist">
                      <li key="ecli21" className="nav-item pl-0">
                        <button
                          data-target="#profileDetails"
                          role="tab"
                          data-toggle="tab"
                          aria-expanded="false"
                          className="nav-link active font-17 bolder"
                        >
                          Profile Details
                        </button>
                      </li>
                      <li key="ecli22" className="nav-item">
                        <button
                          data-target="#conversation"
                          role="tab"
                          data-toggle="tab"
                          aria-expanded="false"
                          className="nav-link font-17 bolder"
                        >
                          Customer Conversation
                        </button>
                      </li>
                      <li key="ecli22" className="nav-item">
                        <button
                          data-target="#attachment"
                          role="tab"
                          data-toggle="tab"
                          aria-expanded="false"
                          className="nav-link font-17 bolder"
                        >
                          Attachments
                        </button>
                      </li>
                      <li key="ecli22" className="nav-item">
                        <button
                          data-target="#interactionDet"
                          role="tab"
                          data-toggle="tab"
                          aria-expanded="false"
                          className="nav-link font-17 bolder"
                        >
                          Interaction Details
                        </button>
                      </li>
                    </ul>
                  </div>
                  <div className="tab-content py-0 pl-3">
                    <div className="tab-pane show active" id="profileDetails">
                      {detailedViewItem ? (
                        <div className="col-12 row pt-2 m-0 helpdesk-padding-left-0 skel-interaction-detail-section">
                          <Element>
                            <table>
                              <tr>
                                <td width="100%" className="form-label">
                                  Profile ID
                                </td>
                                <td width="5">:</td>
                                <td width="25%">
                                  {detailedViewItem?.customerDetails?.customer
                                    ?.crmCustomerNo ||
                                    detailedViewItem?.customerDetails
                                      ?.profileNo}
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" className="form-label">
                                  Full Name
                                </td>
                                <td width="5%">:</td>
                                <td width="25%">
                                  {detailedViewItem?.customerDetails?.customer
                                    ?.fullName ||
                                    (detailedViewItem?.customerDetails
                                      ?.firstName || "") +
                                    " " +
                                    (detailedViewItem?.customerDetails
                                      ?.lastName || "")}
                                </td>
                              </tr>
                              {/* <tr>
                                        <td width="100%" className='form-label'>Customer Type</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{detailedViewItem?.customerDetails?.profileCategory?.description}</td>
                                    </tr> */}
                              <tr>
                                <td width="100%" className="form-label">
                                  Contact Number
                                </td>
                                <td width="5%">:</td>
                                <td width="50%">
                                  {
                                    detailedViewItem?.customerDetails
                                      ?.contactDetails?.mobileNo
                                  }
                                </td>
                              </tr>
                              {/* <tr>
                                        <td width="100%" className='form-label'>ID Type</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{detailedViewItem?.customerDetails?.idType?.description}</td>
                                    </tr>
                                    <tr>
                                        <td width="100%" className='form-label'>ID Value</td>
                                        <td width="5%">:</td>
                                        <td width="50%">{detailedViewItem?.customerDetails?.idValue}</td>
                                    </tr> */}
                              <tr>
                                <td width="100%" className="form-label">
                                  Email
                                </td>
                                <td width="5%">:</td>
                                <td width="50%">
                                  {
                                    detailedViewItem?.customerDetails
                                      ?.contactDetails?.emailId
                                  }
                                </td>
                              </tr>
                              {/* <tr>
                                <td width="100%" className="form-label">
                                  Cc Email
                                </td>
                                <td width="5%">:</td>
                                <td width="50%" onClick={toggleTruncate}>
                                  {detailedViewItem?.helpdeskCcRecipients?.map(
                                    (ele) => ele?.emailAddress?.address + "\n"
                                  )}
                                </td>
                              </tr> */}
                              <tr>
                                <td width="100%" className="form-label">
                                  Contact Preference
                                </td>
                                <td width="5%">:</td>
                                <td width="50%">
                                  {detailedViewItem?.customerDetails
                                    ?.contactPreferences
                                    ? detailedViewItem?.customerDetails?.contactPreferences.map(
                                      (e) => {
                                        return " " + e.description;
                                      }
                                    )
                                    : ""}
                                </td>
                              </tr>
                            </table>
                            {/* <div className="col-12 row pt-2">
                            <div className="col-6 pl-0">
                                <div className="form-label ">Profile ID:</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.customer?.crmCustomerNo || detailedViewItem?.customerDetails?.profileNo}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">Full Name:</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.customer?.fullName || ( (detailedViewItem?.customerDetails?.firstName || "") + ' ' + (detailedViewItem?.customerDetails?.lastName || "")  )}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-6 pl-0">
                                <div className="form-label ">Customer Type:</div>
                                <div className="form-vtext text-capitalize">{detailedViewItem?.customerDetails?.profileCategory?.description}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">Contact Number:</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.contactDetails?.mobileNo}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-6 pl-0">
                                <div className="form-label ">ID Type:</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.idType?.description}</div>
                            </div>
                            <div className="col-6 pl-0">
                                <div className="form-label ">ID Value:</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.idValue}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-12 pl-0">
                                <div className="form-label ">Email:</div>
                                <div className="form-vtext text-break">{detailedViewItem?.customerDetails?.contactDetails?.emailId}</div>
                            </div>
                        </div>
                        <div className="col-12 row pt-1">
                            <div className="col-12 pl-0">
                                <div className="form-label ">Contact Preference :</div>
                                <div className="form-vtext">{detailedViewItem?.customerDetails?.contactPreferences ? detailedViewItem?.customerDetails?.contactPreferences.map((e)=> {return ' '+e.description}) : ''}</div>
                            </div>
                        </div> */}
                          </Element>
                        </div>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="tab-pane" id="conversation">
                      <div className="col-12 mb-1">
                        {detailedViewItem?.conversation &&
                          !!detailedViewItem?.conversation?.length &&
                          detailedViewItem?.conversation?.map((ele) => {
                            return (
                              <>
                                <div className="col-12 skel-transcript-conversation">
                                  <div className="col-5 form-vtext skel-form-vtext">
                                    {ele?.sender}
                                    <div className="badge badge-pill badge-success">
                                      {ele?.createdAt
                                        ? moment(ele?.createdAt).format(
                                          "DD-MMM-YYYY HH:MM A"
                                        )
                                        : ""}
                                    </div>
                                  </div>
                                  <div className="col-7 form-vtext skel-form-vtext">
                                    <Markup content={ele?.helpdeskContent} />
                                  </div>
                                </div>
                              </>
                            );
                          })}
                      </div>
                    </div>
                    <div className="tab-pane" id="attachment">
                      <div className="col-12 mb-1">
                        {/* {(detailedViewItem?.conversation && Array.isArray(detailedViewItem?.conversation) &&
                          detailedViewItem?.conversation?.length > 0) ?
                          detailedViewItem?.conversation?.map((ele) => {
                            return (
                              <>
                                <div
                                  className={`col-12 row pt-2 ${!replyAttachments.length ? "d-none" : ""}`}>
                                  <div className="col-3 form-vtext">
                                    Attachment
                                  </div>chements
                                    data={{
                                      attachmentList: replyAttachments,
                                      // entityId: ele?.helpdeskTxnId,
                                      entityType: "HELPDESKTXN",
                                    }}
                                  />
                                </div>
                              </>
                            );
                          })
                          :
                          <span className="skel-widget-warning">
                            No Attachment available yet
                          </span>
                        } */}
                        <>
                          <div
                            className={`col-12 row pt-2 ${!replyAttachments.length ? "d-none" : ""}`}>
                            {/* <div className="col-3 form-vtext">
                              Attachment
                            </div> */}
                            {/*
                                  ?.filter((e) => {
                                        console.log(e?.entityTxnUuid, ele?.helpdeskTxnUuid)
                                        if (e?.entityTxnUuid === ele?.helpdeskTxnUuid) {
                                          return true
                                        }
                                      }),
                                  */}
                            <Attachements
                              data={{
                                attachmentList: replyAttachments,
                                // entityId: ele?.helpdeskTxnId,
                                entityType: "HELPDESKTXN",
                              }}
                            />
                          </div>
                        </>
                      </div>
                    </div>
                    <div className="tab-pane" id="interactionDet">
                      <div className="col-12 mb-1">
                        <Element>
                          <div>
                            <hr className="cmmn-hmline" />
                            <div className="skel-helpdeskinfo-search mt-2">
                              <span style={{ display: "flex" }}>
                                <h5 id="list-item-0">Interaction History</h5>
                                {/* {location.pathname?.includes(
                                  "view-helpdesk-ticket"
                                ) && (
                                    <button
                                      className="skel-btn-submit"
                                      data-target="#skel-view-modal-workflow"
                                      data-toggle="modal"
                                      onClick={() =>
                                        setIsWorkflowHistoryOpen(true)
                                      }
                                    >
                                      Workflow History
                                    </button>
                                  )} */}
                              </span>
                              {detailedViewItem?.interactionDetails &&
                                detailedViewItem?.interactionDetails?.length >
                                0 ? (
                                <DynamicTable
                                  row={
                                    detailedViewItem?.interactionDetails
                                      ? detailedViewItem.interactionDetails
                                      : []
                                  }
                                  header={CustomerDetailsViewColumns}
                                  itemsPerPage={10}
                                  exportBtn={false}
                                  columnFilter={true}
                                  handler={{
                                    handleCellRender: handleCellRender,
                                  }}
                                />
                              ) : (
                                <span className="skel-widget-warning">
                                  No interactions found!
                                </span>
                              )}
                            </div>
                          </div>
                        </Element>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isWorflowHistoryOpen} style={RegularModalCustomStyles}>
        <div
          className="modal-center"
          id="followupModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="followupModal"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header px-4 border-bottom-0 d-block">
                <button
                  type="button"
                  className="close"
                  // data-dismiss="modal"
                  // aria-hidden="true"
                  onClick={() => setIsWorkflowHistoryOpen(false)}
                >
                  &times;
                </button>
                <h5 className="modal-title">
                  {!isFollowUpHistoryOpen
                    ? "Workflow History"
                    : "Followup History"}{" "}
                  for Interaction No {interactionData?.intxnNo}
                </h5>
              </div>
              <div className="modal-body px-4">
                <div className="row">
                  <div className="col-md-12 pull-right">
                    <button
                      type="button"
                      className="btn waves-effect waves-light btn-primary cmmn-styl-btn-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (followUpHistory?.count === 0) {
                          toast.error(
                            "No follow-up is available for this interaction."
                          );
                          return;
                        }
                        setIsFollowUpHistoryOpen(!isFollowUpHistoryOpen);
                      }}
                    >
                      {!isFollowUpHistoryOpen
                        ? `Followup History - ${followUpHistory?.count}`
                        : `WorkFlow History - ${workflowHistory?.count}`}
                    </button>
                  </div>
                </div>
                {!isFollowUpHistoryOpen ? (
                  <div className="timeline-workflow">
                    <ul>
                      {workflowHistory?.rows &&
                        workflowHistory?.rows.length > 0 &&
                        workflowHistory?.rows.map((data) => (
                          <li>
                            <div className="content">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      From Department/Role
                                    </label>
                                    <span className="data-cnt">
                                      {data?.fromEntityName?.unitDesc || ""} -{" "}
                                      {data?.fromRoleName?.roleDesc || ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Servicetype"
                                      className="control-label"
                                    >
                                      To Department/Role
                                    </label>
                                    <span className="data-cnt">
                                      {data?.toEntityName?.unitDesc || ""} -{" "}
                                      {data?.toRoleName?.roleDesc || ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Channel"
                                      className="control-label"
                                    >
                                      User
                                    </label>
                                    <span className="data-cnt">
                                      {data.flwCreatedby.flwCreatedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      Status
                                    </label>
                                    <span className="data-cnt">
                                      {data?.statusDescription?.description}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Servicetype"
                                      className="control-label"
                                    >
                                      Action Performed
                                    </label>
                                    <span className="data-cnt">
                                      {data?.flowActionDesc?.description}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Servicetype"
                                      className="control-label"
                                    >
                                      Attachment
                                    </label>
                                    <span className="data-cnt">
                                      {data?.AttachmentsDetails &&
                                        data?.AttachmentsDetails?.map(
                                          (file) => (
                                            <div
                                              className="attach-btn"
                                              title={`Click to download ${file.fileName}`}
                                              key={file.attachmentUuid}
                                              onClick={() =>
                                                handleFileDownload(
                                                  file.attachmentUuid
                                                )
                                              }
                                            >
                                              <i
                                                className="fa fa-paperclip"
                                                aria-hidden="true"
                                              ></i>
                                              <a
                                                key={file.attachmentUuid}
                                                alt={file.fileName}
                                              >
                                                {file.fileName}
                                              </a>
                                            </div>
                                          )
                                        )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      Comments
                                    </label>
                                    <span className="data-cnt">
                                      {data?.remarks}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="time">
                              <h4>
                                {moment(
                                  data?.intxnCreatedDate || new Date()
                                ).format("DD MMM YYYY hh:mm:ss A")}
                              </h4>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <div className="timeline-workflow">
                    <ul>
                      {followUpHistory?.rows &&
                        followUpHistory?.rows.length > 0 &&
                        followUpHistory?.rows.map((data) => (
                          <li>
                            <div className="content">
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      From Department/Role
                                    </label>
                                    <span className="data-cnt">
                                      {data?.fromEntityName?.unitDesc || ""} -{" "}
                                      {data?.fromRoleName?.roleDesc || ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Servicetype"
                                      className="control-label"
                                    >
                                      To Department/Role
                                    </label>
                                    <span className="data-cnt">
                                      {data?.toEntityName?.unitDesc || ""} -{" "}
                                      {data?.toRoleName?.roleDesc || ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Channel"
                                      className="control-label"
                                    >
                                      User
                                    </label>
                                    <span className="data-cnt">
                                      {data?.flwCreatedby?.flwCreatedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      Status
                                    </label>
                                    <span className="data-cnt">
                                      {data?.statusDescription?.description}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Servicetype"
                                      className="control-label"
                                    >
                                      Action Performed
                                    </label>
                                    <span className="data-cnt">
                                      {data?.flowActionDesc?.description}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="form-group">
                                    <label
                                      htmlFor="Interactiontype"
                                      className="control-label"
                                    >
                                      Comments
                                    </label>
                                    <span className="data-cnt">
                                      {data?.remarks}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="time">
                              <h4>
                                {moment(
                                  data?.intxnCreatedDate || new Date()
                                ).format("DD MMM YYYY hh:mm:ss A")}
                              </h4>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ViewHelpdeskTicket;
