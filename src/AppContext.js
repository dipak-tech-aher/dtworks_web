import React, { createContext, useEffect, useState } from "react";
import { setAccessToken, get } from "./common/util/restUtil";
import { properties } from "./properties";
import { unstable_batchedUpdates } from "react-dom";

export const AppContext = createContext();
export const TemplateContext = createContext();
export const OpsDashboardContext = createContext();
export const InteractionDashboardContext = createContext();
export const OmniChannelDashboardContext = createContext();
export const salesDashboardContext = createContext()
export const InventoryContext = createContext()
export const Service360Context = createContext()
export const OmniChannelContext = createContext()
export const Order360Context = createContext()
export const ModalContext = createContext()
export const Contract360Context = createContext()
export const CreateOrderContext = createContext()
export const ManagementDashboardContext = createContext()
export const OMSDashboardContext = createContext()

export const AppProvider = ({ children }) => {
  const [auth, setAuth] = useState(localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")) : {});
  const [appConfig, setAppConfig] = useState(localStorage.getItem("appConfig") ? JSON.parse(localStorage.getItem("appConfig")) : {});
  const [systemConfig, setSystemConfig] = useState()
  const [appLogo, setAppLogo] = useState()
  
  useEffect(() => {
    localStorage.setItem("auth", JSON.stringify(auth));
    setAccessToken(auth ? auth.accessToken : "");
  }, [auth]);

  const [selectedTab, setSelectedTab] = useState(
    localStorage.getItem("selectedTab") ? JSON.parse(localStorage.getItem("selectedTab")) : "Overview"
  );

  const getConfigDetails = async () => {
    // let accessToken = JSON.parse(localStorage.getItem("auth")) && JSON.parse(localStorage.getItem("auth")) !== null
    //   ? JSON.parse(localStorage.getItem("auth")).accessToken
    //   : "";
    try {
      // if (accessToken) {
        const resp = await get(properties.MASTER_API + "/config-details");
        const item = resp?.data?.find(item => item.configKey === "APP_LOGO");
        unstable_batchedUpdates(()=>{
          setAppLogo(item ? item.configValue : '')
          setSystemConfig(resp.data)
        })
        ;
      // }
    } catch (e) {
      console.log('error', e)
    }

  }

  useEffect(() => {
    getConfigDetails();
  }, [auth])

  useEffect(() => {
    localStorage.setItem("selectedTab", JSON.stringify(selectedTab));
    setSelectedTab(selectedTab ? selectedTab : "Overview");
  }, [selectedTab]);
  // Global Chat Enable
  const [globalChatEnable, setGlobalChatEnable] = useState(false)
  useEffect(() => {
    let GLOBALCHAT = localStorage.getItem('GLOBALCHAT');
    setGlobalChatEnable(GLOBALCHAT ? true : false);
  }, []);

  //Clear context here
  useEffect(() => {
    if (!auth) {
      setSelectedTab("Overview");
    }
  }, [auth]);

  return (
    <AppContext.Provider
      value={{
        auth,
        setAuth,
        appConfig,
        setAppConfig,
        setGlobalChatEnable,
        globalChatEnable,
        systemConfig,
        appLogo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
