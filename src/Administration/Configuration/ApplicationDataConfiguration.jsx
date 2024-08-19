import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../AppContext";
import store from "../../assets/images/store.svg";
import { get } from "../../common/util/restUtil";
import { properties } from "../../properties";
import image6 from '../../assets/images/app-config.svg';
import image4 from '../../assets/images/business-config.svg';
import image5 from '../../assets/images/mapping-config.svg';
import image2 from '../../assets/images/settings-config.svg';
import image1 from '../../assets/images/store-config.svg';
import image3 from '../../assets/images/user-config.svg';
import { toast } from "react-toastify";

const ApplicationDataConfiguration = (props) => {
  const { appConfig } = useContext(AppContext);
  const [getTotalCount, setGetTotalCount] = useState();
  const [getPercentage, setPercentage] = useState(0);
  const history = useNavigate();
  const [prevBtnDisable, setPrevBtnDisable] = useState(true);
  const [nextBtnDisable, setNextBtnDisable] = useState(false);


  const screenInfo = props?.children?.props?.props?.screenInfo;
  const avatar = props?.children?.props?.props?.avatar ?? null
  let type;
  if (screenInfo === "Business Unit Data Configuration") {
    type = "department";
  } else if (screenInfo === "Role Data Configuration") {
    type = "role";
  } else if (screenInfo === "User Data Configuration") {
    type = "user";
  }

  const steps = [
    { key: 'role', label: 'Roles Setup', path: '/role-management', image: image2, description: 'Configure your organization roles and access to the screens.', sourceName: "adminRoleList" },
    { key: 'department', label: 'Business Unit', path: '/organisation-management', image: image1, description: 'Configure your Organization/Operational Unit/Department.', sourceName: "adminOrgHierarchy" },
    { key: 'user', label: 'Add User', path: '/user-management', image: image3, description: 'Configure your business users and map them to the Department and Roles.', sourceName: "userManagement" },
    { key: 'businessEntity', label: 'Add Business Master', path: '/business-parameter-management', image: image4, description: 'Configure your master data setup.', sourceName: "" },
    // { key: 'businessMapping', label: 'Business Data Mapping', path: '/business-parameter-mapping', image: image4, description: 'Business Data Mapping', sourceName: "" },
    { key: 'request', label: 'Add Requested Statement Setup', path: '/request-statement-list', image: image6, description: 'Configure your Interaction/Helpdesk statements.', sourceName: "" }
  ];
  const [nextStepCount, setNextStepCount] = useState(0)
  const [openProgressPopup, setOpenProgressPopup] = useState(true)

  useEffect(() => {
    if (Number(getPercentage) === 100) {
      setNextBtnDisable(true)
      setPrevBtnDisable(true)
    } else {
      if (nextStepCount === 0) {
        setPrevBtnDisable(true)
        setNextBtnDisable(false)
      } else if (nextStepCount === steps.length - 1) {
        setNextBtnDisable(true)
        setPrevBtnDisable(false)
      } else {
        setNextBtnDisable(false)
        setPrevBtnDisable(false)
      }
    }  

  }, [getPercentage, nextStepCount])

  const proceedNextStep = (index) => {
    index = index + 1
    if (getTotalCount && getTotalCount[steps[index]?.key] > 0) {
      setNextStepCount(index)
      const step = steps[index]
      if (step) {
        history(`${step.path}`, { state: {data: { sourceName: step.sourceName }} })
      }
    }
  }
  const proceedPrevStep = (index) => {
    index = index - 1
    if (getTotalCount && getTotalCount[steps[index]?.key] > 0) {
      setNextStepCount(index)
      const step = steps[index]
      if (step) {
        history(`${step.path}`, { state: {data: { sourceName: step.sourceName }} })
      } 
    }
  }

  const childGroup = () => {
    return React.Children.map(props.children, (child) => {
      return React.cloneElement(child, {
        totalCount: getTotalCount,
        percentage: getPercentage,
        proceedNextStep: proceedNextStep,
        steps,
        nextStepCount
      });
    });
  };

  useEffect(() => {
    get(properties.MASTER_API + "/get-total-count")
      .then((res) => {
        if (res.status === 200) {
          let l = 0;
          for (let t in res.data) {
            if (res.data[t] > 0) {
              l = l + 1;
            }
          }
          const pt = ((l / 5) * 100).toFixed(2);
          setGetTotalCount(res.data);
          setPercentage(pt);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally();
  }, []);

  return (
    <div className="cnt-wrapper">
      <div className="card-skeleton">
        <div className="customer-skel">
          <div className="cmmn-skeleton">
            <div className="row">
              <div className="skel-configuration-settings">
                <div className="col-md-8">
                  <div className="skel-config-top-sect">
                    <h2>{screenInfo}</h2>
                    <p>
                      {
                        "Follow the setup wizard that will guide you through the remaining steps to complete the configuration setup."
                      }
                    </p>
                    {screenInfo &&
                      screenInfo !== "Application Data Configuration" &&
                      ["department", "role", "user"].includes(type) && (
                        <>
                          <span className="skel-step-styl mb-3">
                            est. 5 minutes for 1{" "}
                            <span className="material-icons skel-config-active-tick">
                              check_circle
                            </span>
                          </span>
                          <p>
                            You can create{" "}
                            <strong>
                              max{" "}
                              {type === "department"
                                ? appConfig?.maxEntityLimit
                                : type === "role"
                                  ? appConfig?.maxRolesLimit
                                  : appConfig?.maxUserLimit}{" "}
                              {type}
                            </strong>
                            . If you need to increase more {type} go to{" "}
                            <span
                              onClick={() => {
                                history(`/configuration-settings`);
                              }}
                              className="skel-txt-underline"
                            >
                              <strong>settings</strong>
                            </span>{" "}
                            and increase the role.
                          </p>
                        </>
                      )}
                    <div className="skel-config-progress">
                      <div className="progress-status progress-moved">
                        <div
                          className="progress-bar"
                          style={{ width: getPercentage + "%" }}
                        ></div>
                      </div>
                      <span>{getPercentage}% Completed</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <img src={avatar ?? store} alt="" className="img-fluid" />
                </div>
              </div>
            </div>
            {childGroup()}
            {/*Tool Tips */}
            <div className={openProgressPopup ? "skel-config-progress-flow" : "d-none"}>
              <span className="material-icons skel-config-active-close cursor-pointer" onClick={() => { setOpenProgressPopup(false) }}>close</span>
              <span className="font-bold">Workflow Configuration</span>
              <div className="skel-config-progress">
                <div className="progress-status">
                  <div className="progress-bar" style={{ width: getPercentage + "%" }}>
                  </div>
                </div>
                <br />
                <span>{getPercentage}% Completed</span></div>
              <hr className="cmmn-hline pt-1 pb-1" />
              <ul>
                {steps.map((step, index) => (
                  <li key={index}>
                    <div className={getTotalCount && getTotalCount[step?.key] > 0 ? "skel-progress-config-steps" : "steps-disable-state"}>
                      <div className="skel-config-steps-divd">
                        <div>
                          <span className="material-icons skel-config-active-tick">check_circle</span>
                        </div>
                        <div>
                          <span>Step: {index + 1}</span>
                          <p>{step?.label}</p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div class="row text-center mt-3">
                <div className="col-6">
                  <button type="button" class={prevBtnDisable ? "skel-btn-cancel" : "skel-btn-submit"} disabled={prevBtnDisable} onClick={() => { proceedPrevStep(nextStepCount) }}>Go to Previous Step</button>
                </div>
                <div className="col-6">
                  <button type="button" class={nextBtnDisable ? "skel-btn-cancel" : "skel-btn-submit"} disabled={nextBtnDisable} onClick={() => { proceedNextStep(nextStepCount) }}>Proceed to Next Step</button>
                </div>
              </div>
            </div>
            {/*Tool Tips Ends */}
            {/* Floating */}
            <div id="skel-help-tips-base">
              <a class="skel-help-tips" data-tooltip="Help Tips" data-placement="left" onClick={() => { setOpenProgressPopup(true) }}>
                <i class="fa fa-question-circle"></i>
                <i class="fa fa-times"></i>
              </a>
            </div>
            {/* Floating Icons Ends */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDataConfiguration;
