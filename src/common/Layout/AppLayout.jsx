import React, { useState, useEffect, useContext } from 'react';
import Header from '../header';
import { useHistory }from '../util/history';
import { properties } from "../../properties";
import { get } from "../util/restUtil";
import CommonLiveChat from './CommonLiveChat';
import { AppContext } from '../../AppContext';
import { useLocation } from 'react-router-dom';
const AppLayout = ({ isAuthenticated, children, location }) => {
    const history = useHistory()
    const [menuCollapse, setMenuCollapse] = useState(true)
    const [clientFacingName, setClientFacingName] = useState(null)
    const [appsConfig, setAppsConfig] = useState([])
    const child = children?.props?.props
    const { pathname } = useLocation();

    const pathName = children?.props?.location?.pathname
    const screenName = child?.screenName ? child?.screenName : children?.props?.children?.props?.props?.screenName
    const screenAction = child?.screenAction ? child?.screenAction : children?.props?.children?.props?.props?.screenAction
    // const previousPage = child.previousPage
    const isLogin = pathName === "user/login" || pathName === "user/faq"
        || pathName === "user/forgotpassword" || pathName === "user/change-password"
        || pathName === "user/register" ? true : false


    useEffect(() => {
        get(properties.MASTER_API + '/get-app-config')
            .then((resp) => {
                if (resp?.status === 200) {
                    setAppsConfig(resp?.data)
                    if (resp?.data?.clientFacingName?.[screenName]) {
                        let lable = resp?.data?.clientFacingName[screenName]?.lable
                        setClientFacingName(lable || screenName)
                    }
                }
            }).catch((error) => { console.log(error) })
            .finally()
    }, [])

    useEffect(() => {
        if (appsConfig && appsConfig?.clientFacingName) {
            for (const key in appsConfig?.clientFacingName) {
                if (key === screenName) {
                    setClientFacingName(appsConfig?.clientFacingName[key]?.lable);
                    break;
                } else {
                    setClientFacingName(screenName);
                }
            }
        } else {
            setClientFacingName(screenName);
        }
    }, [child])

    const handleGoBack = () => {
        history(-1); // Go back one step in history
      };

    const { globalChatEnable,setGlobalChatEnable } = useContext(AppContext)
    return (
        <div id="wrapper" className="App">
            {isAuthenticated && (
                <Header
                    data={{
                        menuCollapse: menuCollapse,
                        appsConfig: appsConfig
                    }}
                    handler={{
                        setMenuCollapse: setMenuCollapse
                    }}
                />
            )}
            <div className={isLogin === true ? '' : "menu-show"}>
                <div className={isLogin === true ? "" : "content-page"}>
                    <div className="content">
                        <div className="container-fluid">
                            {screenName && <div className="top-breadcrumb cmmn-skeleton">
                                <div className="lft-skel">
                                    <ul>
                                        <li><a href="" onClick={
                                            (e) => {
                                                e.preventDefault()
                                                handleGoBack();
                                                //history(`/my-workspace`)
                                            }}><i className="fas fa-arrow-left"></i> Back</a></li>
                                        <li>{clientFacingName} - {screenAction}</li>
                                        {/* <li>{screenName} - {screenAction}</li> */}
                                    </ul>
                                </div>
                            </div>}
                            {/* {children} */}
                            {React.cloneElement(children, { screenName, setClientFacingName, clientFacingName, appsConfig })}
                        </div>
                    </div>
                </div>
            </div>
           {(globalChatEnable && !pathname.includes('/agent-chat'))&& <CommonLiveChat setGlobalChatEnable={setGlobalChatEnable}/>}
        </div>
    )
}

export default AppLayout;