import { useContext, useState } from "react";
import { NumberFormatBase } from "react-number-format";
import { string, object } from "yup";
import { properties } from "../properties";
import { post, get } from "../common/util/restUtil";
import FileUpload from "../common/uploadAttachment/fileUpload";
import { useEffect } from "react";
import { AppContext } from "../AppContext";

const ReportProblems = (props) => {
  let { appLogo } = useContext(AppContext);
  const initialValues = {
    userName: "",
    mailId: "",
    phoneNo: "",
    // contactPreference: "Phone",
    content: "",
    helpdeskSubject: "",
    status: "HS_NEW",
  };

  const [reportInputs, setReportInputs] = useState(initialValues);
  const [error, setError] = useState({});
  const [appsConfig, setAppsConfig] = useState({})

  const [currentFiles, setCurrentFiles] = useState([]);
  const [ticketId, setTicketId] = useState({});
  const [apiError, setApiError] = useState({});
  const [contact, setContact] = useState("Phone");

  const reportProblemsValidationSchema = object().shape({
    userName: string().required("Name is required"),
    mailId: string()
      .required("Email is required")
      .email("Email is not in correct format"),
    phoneNo: string()
      .required("Contact Number is required"),
      helpdeskSubject: string().required("Subject is required"),
    content: string().required("Content is required"),
    
  });

  const reportDetails = (e) => {
    const error = validate(reportProblemsValidationSchema, reportInputs);
    console.log(error)
    if (error) {
      //toast.error("Validation errors found. Please check highlighted fields");
      return false;
    }
    return true;
  };

  useEffect(() => {
    // if (!isEmpty(appConfig)) {
    //   setAppsConfig(appConfig)
    // } else {
    get(properties.MASTER_API + '/get-app-config')
      .then((resp) => {
        if (resp?.status === 200) {
          setAppsConfig(resp?.data)
          localStorage.setItem("appConfig", JSON.stringify(resp?.data));
        }
      }).catch((error) => { console.log(error) })
      .finally()
    // }
  }, [])

  const handleContactTypeChange = (e) => {
    const { target } = e;
    let value = null;
    if (target.id === "radio1") {
      value = "Phone";
    } else {
      value = "Email";
    }
    setContact(value);
    setReportInputs({ ...reportInputs, contactPreference: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reportDetails()) {
      //   const { userName, mailId, phoneNo, contactPreference, content } = reportInputs;
      let obj = {
        ...reportInputs,
        helpdeskSource: "WEB-PORTAL",
        attachments: [...currentFiles.map((current) => current.entityId)],
      };
      post(properties.HELPDESK_API + "/web-ticket", obj)
        .then((response) => {
          if (response.status === 200) {
            setCurrentFiles([]);
            setReportInputs(initialValues);
            setTicketId(response);
          }
          //toast.success(`${response.message} with ID ${response.data.interactionId}`);
          //toast.success("Thank you for your message", response.message);
          // props.history(`/create`);
        })
        .catch((err) => {
          setApiError(err);
        })
        .finally();
    }
  };

  const displayHelpdeskSuccessMessage = () => {
    if (ticketId.data?.helpdeskId) {
      return (
        <div className="pt-3 pr-2">
          {/* <div className="form-group col-6"> */}
          <div
            className="form-control col-md-12"
            style={{
              margin: "1em 0.5em 1em",
              border: "2px solid #00A300",
              width: "100%",
              height: "50%",
              fontSize: 18
            }}
          >
            <p>
            {`Thank you! Your queries/concern has been raised with Ticket #${ticketId.data?.helpdeskId}.`}
            </p>
            <p>

            Soon one of our agents will reach out to you.

            </p>
          </div>
          {/* </div> */}
        </div>
      );
    } else if (apiError.redirected === false) {
      return (
        <div className="pt-3 pr-2">
          <div className="form-group col-6">
            <div
              className="form-control col-md-6"
              style={{
                margin: "2em 0.5em 1em",
                border: "2px solid #ffb900",
              }}
            >{`Error while creating helpdesk Ticket. Please try again`}</div>
          </div>
        </div>
      );
    }
  };

  const validate = () => {
    try {
      reportProblemsValidationSchema.validateSync(reportInputs, {
        abortEarly: false,
      });
    } catch (e) {
      e.inner.forEach((err) => {
        setError((prevState) => {
          return { ...prevState, [err.params.path]: err.message };
        });
      });
      return e;
    }
  };

  useEffect(() => {
    displayHelpdeskSuccessMessage();
  }, [ticketId, apiError]);

  return (
    <>
    <span className="logo-lg skel-login-sect">
          <img src={appLogo} alt="" style={{width: '150px', height: '50px'}} />
        </span>
    <div className="row form-area">
       
      <div className="col-6">
       
        {/*start remove this div if place with in col-6  */}
        <div className="col-12 pl-2 pr-2 ">
          <div className="title form-header">
            <h3>Report Problems</h3>
          </div>
          <div className="pt-1 pr-2">
            <p>{displayHelpdeskSuccessMessage()}</p>
          </div>
          <div className="pt-1">
            <input
              name="userName"
              id="userName"
              className={`form-control ${error.userName ? "input-error" : ""}`}
              value={reportInputs.userName}
              style={{
                border: "",
                borderTop: 1,
                borderRight: 1,
                borderLeft: 1,
                backgroundColor: "transparent",
                fontWeight: 400,
                fontSize: 18,
              }}
              onChange={(e) => {
                setReportInputs({ ...reportInputs, userName: e.target.value });
                setError({ ...error, userName: "" });
              }}
              placeholder="Full Name *"
            />
            {error.userName ? (
              <span className="errormsg">{error.userName}</span>
            ) : (
              ""
            )}
          </div>
          <div className="pt-1">
            <input
              name="mailId"
              id="mailId"
              className={`form-control ${error.mailId ? "input-error" : ""}`}
              value={reportInputs.mailId}
              style={{
                border: "",
                borderTop: 1,
                borderRight: 1,
                borderLeft: 1,
                backgroundColor: "transparent",
                fontWeight: 400,
                fontSize: 18,
              }}
              onChange={(e) => {
                setReportInputs({ ...reportInputs, mailId: e.target.value });
                setError({ ...error, mailId: "" });
              }}
              placeholder="Email ID *"
            />
            {error.mailId ? (
              <span className="errormsg">{error.mailId}</span>
            ) : (
              ""
            )}
          </div>
          <div className="pt-1">
            <NumberFormatBase
              name="phoneNo"
              id="phoneNo"
              className={`form-control ${error.phoneNo ? "input-error" : ""}`}
              value={reportInputs.phoneNo}
              style={{
                border: "",
                borderTop: 1,
                borderRight: 1,
                borderLeft: 1,
                backgroundColor: "transparent",
                fontWeight: 400,
                fontSize: 18,
              }}
              onChange={(e) => {
                setReportInputs({ ...reportInputs, phoneNo: e.target.value });
                setError({ ...error, phoneNo: "" });
              }}
              placeholder="Contact Number *"
              maxLength="15"
            />
            {error.phoneNo ? (
              <span className="errormsg">{error.phoneNo}</span>
            ) : (
              ""
            )}
          </div>
          {/* <div className="pt-2">
            <div className="row pl-2 cont-pre" >
              <p className="form-group ft-color ft-size16" htmlFor="contactPreference" id="contactPreference">Contact Preference</p>

              <label htmlFor="radio1" className="pl-2 pr-2" style={{ fontSize: 18 }}>
              <input type="radio" checked={reportInputs?.contactPreference === "Phone"} onChange={handleContactTypeChange} name="contactPreference" id="radio1" value="Phone" />
              <span className="pl-1 pr-2 ft-color ft-size16">Phone</span></label>
              <label className="pl-2 pr-2" style={{ fontSize: 18 }}>
              <input type="radio" checked={reportInputs?.contactPreference === "Email"} onChange={handleContactTypeChange} name="contactPreference" id="radio2" value="Email" />
              <span className="pl-1 pr-2 ft-color ft-size16">Email</span></label>

            </div>
          </div> */}
          <div className="pt-1">
            <input
              className={`form-control ${error.mailId ? "input-error" : ""}`}
              style={{
                border: "",
                borderTop: 1,
                borderRight: 1,
                borderLeft: 1,
                backgroundColor: "transparent",
                fontWeight: 400,
                fontSize: 18,
              }}
              onChange={(e) => {
                setReportInputs({
                  ...reportInputs,
                  helpdeskSubject: e.target.value,
                });
                setError({ ...error, helpdeskSubject: "" });
              }}
              name="helpdeskSubject"
              id="helpdeskSubject"
              value={reportInputs.helpdeskSubject}
              placeholder="Subject *"
            />
          </div>
          <div>
            {/* <div style="width:100px; height:574px; display:block"></div> */}
            <div className="title form-header">
              <h3>Your Comments in detail</h3>
            </div>
            <div className="form-row row text-area">
              <div className="form-group col-12">
                <label
                  htmlFor="content"
                  className="col-form-label pt-0"
                ></label>
                <textarea
                  id="content"
                  name="content"
                  rows="3"
                  style={{ width: "100%", height: "90%" }}
                  maxLength="2500"
                  className={`form-control ${
                    error.content ? "input-error" : ""
                  }`}
                  value={reportInputs.content}
                  onChange={(e) => {
                    setReportInputs({
                      ...reportInputs,
                      content: e.target.value,
                    });
                    setError({ ...error, content: "" });
                  }}
                  placeholder="max limit 2500 characters"
                />
                {error.content ? (
                  <span className="errormsg">{error.content}</span>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
          <div className="pt-0">
            {/* <input type="file" id="file" onChange={handleChangeStatus} /> */}
            <div className="pt-0 ">
              <FileUpload
                data={{
                  currentFiles,
                  source: "web-ticket",
                  //customerId: props.location.state.data.customerId,
                  entityType: "HELPDESK",
                  shouldGetExistingFiles: false,
                  permission: false,
                }}
                handlers={{
                  setCurrentFiles,
                }}
              />
            </div>
          </div>
          <div className="col-md-12 pl-2">
            <div className="form-group pb-1">
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="skel-btn-cancel"
                  onClick={() => setReportInputs(initialValues)}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="skel-btn-submit"
                  onClick={handleSubmit}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/*  /*end remove this div if place with in col-6  */}
    </div>
    </>
  );
};
export default ReportProblems;
