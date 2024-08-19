/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../../AppContext";

import { get, remove } from "../../common/util/restUtil";
import { properties } from "../../properties";
import useDropDownArea from "./useDropDownArea";
import { computeDynamicBaseURL } from "../../common/util/util";
const dynamicBase = computeDynamicBaseURL();

const ProfileNav = () => {
  const [display, setDisplay] = useDropDownArea("profile");
  //const [display, setDisplay] = useState(false)
  // const handleClick = () => {
  //     let element = document.getElementById("profilePop");
  //     if (element.classList.contains("show")) {
  //         element.classList.remove("show");
  //     } else {
  //         element.classList.add("show");
  //     }
  // }

  const { auth, setAuth } = useContext(AppContext);
  const [appsConfig, setAppsConfig] = useState({});

  let userDetail = auth.user;
  userDetail.Initial = (userDetail?.firstName ? userDetail?.firstName?.charAt(0)?.toUpperCase() : "D") + (userDetail?.lastName ? userDetail?.lastName?.charAt(0)?.toUpperCase() : "W")
  const history = useNavigate();
  const handleOnLogout = () => {

    remove(properties.AUTH_API + "/logout/" + userDetail.userId)
      .then((resp) => {
        if (resp.status === 200) {
          setAuth({});
        }
        localStorage.clear();
        const remember = localStorage.getItem('rememberMe') === 'true'
        if (!remember) {
          localStorage.clear();
        } else {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('password')
        }
        history(`/user/login`);
      }).catch((error) => {
        console.log(error)
      })
      .finally();
    setDisplay(!display);
  };

  useEffect(() => {
    // if (!isEmpty(appConfig)) {
    //   setAppsConfig(appConfig);
    // } else {
    get(properties.MASTER_API + "/get-app-config")
      .then((resp) => {
        if (resp?.status === 200) {
          setAppsConfig(resp?.data);
          localStorage.setItem("appConfig", JSON.stringify(resp?.data));
        }
      })
      .catch((error) => {
        console.log(error);
      })
      .finally();
    // }
  }, []);

  const handleOpenUserManual = (base64Data) => {
    if (base64Data) {
      // console.log("base64Data", base64Data);
      // Decode the Base64 data to binary
      const binaryData = atob(base64Data);

      // Create an array buffer from the binary data
      const arrayBuffer = new ArrayBuffer(binaryData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryData.length; i++) {
        uint8Array[i] = binaryData.charCodeAt(i);
      }

      // Create a blob object from the array buffer
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });

      // Generate the URL for the blob object
      const url = URL.createObjectURL(blob);

      // Open the URL in a new tab
      window.open(url, "_blank", "noopener");
    }
  };

  return (
    <>
      {auth && auth.user ? (
        <li className="nav-item nav-item-profile">
          <a
            className="nav-link dropdown-toggle profile-sect"
            data-toggle="dropdown"
            role="button"
            aria-haspopup="false"
            aria-expanded="false"
          >
            {/* <i className="mdi mdi-chevron-down"></i> */}
            {userDetail.firstName !== undefined
              ? userDetail.firstName.charAt(0).toUpperCase()
              : ""}
            {userDetail.lastName !== "undefined"
              ? userDetail.lastName.charAt(0).toUpperCase()
              : ""}
          </a>
          <div className="dropdown-menu dropdown-menu-right profile-dropdown">
            <span className="skel-profile-image-bg">
              {userDetail?.profilePicture ? <img src={userDetail?.profilePicture} width="50px" height="50px" style={{ objectFit: "cover" }} alt="profile"></img> : userDetail?.Initial}

              {/* {userDetail.firstName !== undefined
                  ? userDetail.firstName.charAt(0).toUpperCase()
                  : ""}
                {userDetail.lastName !== "undefined"
                  ? userDetail.lastName.charAt(0).toUpperCase()
                  : ""} */}
            </span>
            <span className="skel-profilename">
              {userDetail.firstName} {userDetail.lastName}
            </span>
            <span className="skel-userid-profile">
              User ID: {userDetail.loginid}
            </span>
            <span className="skel-userid-profile">
              Role: {auth.currRoleDesc}
            </span>
            <span className="skel-userid-profile">
              Department: {auth.currDeptDesc}
            </span>
            <span className="skel-email-profile">
              <a>{userDetail.email}</a>
            </span>
            <hr className="cmmn-hline pt-2" />
            <Link
              to={`/user/myprofile`}
              className="dropdown-item notify-item"
            >
              {/* <i className="fe-user"></i> */}
              <span className="skel-manage-profile-accnt skel-btn-submit">
                Manage your account
              </span>
            </Link>
            {/* <Link to="/" className="dropdown-item notify-item">
                                <i className="fe-lock"></i>
                                <span>Lock Screen</span>
                            </Link> */}
            {/* <Link to="/" className="dropdown-item notify-item">
                                <i className="fas fa-question font-17"></i>
                                <span>Help</span>
                            </Link> */}
            {/* <div className="dropdown-divider"></div> */}
            <span className="log-out">
              {/* <i className="fe-log-out"></i> */}
              <span
                className="text-center"
                onClick={() => {
                  history(
                    `/portal-settings`
                  );
                }}
              >
                <i className="fe-settings"></i>Settings
              </span>
              <span
                className="text-center"
                onClick={() => {
                  handleOpenUserManual(appsConfig.appUserManual);
                }}
              >
                <i className="fas fa-hands-helping"></i>Help
              </span>
              <span
                className="text-center"
                onClick={() => {
                  history(`/user/faq`);
                }}
              >
                <i className="fas fa-question"></i>FAQ
              </span>
              <span className="text-center" onClick={handleOnLogout}>
                <i className="fe-log-out"></i>Logout
              </span>
            </span>
          </div>
        </li>
      ) : (
        ""
      )}
    </>
  );
};

export default ProfileNav;
