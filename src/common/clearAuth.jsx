import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../AppContext";
import { properties } from "../properties";
// import { properties } from "../properties";

const ClearAuth = () => {

  const { setAuth,setGlobalChatEnable } = useContext(AppContext);

  useEffect(() => {
    setAuth({})
    setGlobalChatEnable(false)
    localStorage.removeItem('GLOBALCHATOBJ')
    localStorage.removeItem('GLOBALCHAT')
  }, []);

  return <Navigate to={`/user/login`} replace={true}></Navigate>;

};

export default ClearAuth;
