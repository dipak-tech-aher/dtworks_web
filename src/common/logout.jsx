import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { properties } from "../properties";
import { AppContext } from "../AppContext";
import { remove } from "../common/util/restUtil";
import {  } from "./spinner";

const Logout = ({base}) => {
  const { setAuth } = useContext(AppContext);
  let userId =
    JSON.parse(localStorage.getItem("auth")) && JSON.parse(localStorage.getItem("auth")) !== null
      ? JSON.parse(localStorage.getItem("auth")).user.userId
      : "";
  remove(properties.AUTH_API + "/logout/" + userId)
    .then((resp) => {
      if (resp.status === 200) {
        setAuth({});
      } else {
      }
      localStorage.removeItem("auth");
      localStorage.removeItem("appConfig");
    }

    ).catch((error) => {
      console.log(error)
  })
    .finally();
  return <Navigate to='/user/login'/>;

};

export default Logout;
