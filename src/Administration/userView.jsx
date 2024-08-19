import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import OrgHierarchy from "./Organization/orgHierarchy";
// import OrgHierarchyNew from "./Organization/orgHierarchyNew"
import RoleTable from "./RolesAndPermissions/RoleTable";
import UserManagement from "./User/userManagement";
import NewUserRequest from "./User/newUserRequest";
import { useNavigate, useLocation } from "react-router-dom";

const UserView = (props) => {
    let history = useNavigate();
    
    const adminMenu = [
        { id: "adminRoleList", title: "Roles Setup" },
        { id: "adminOrgHierarchy", title: "Org Hierarchy" },
        { id: "userManagement", title: `${props?.appsConfig?.clientFacingName?.user??"User"} Management` },
        { id: "newUserRequest", title: `New ${props?.appsConfig?.clientFacingName?.user??"User"} Request` }
    ];
    const [tab, setTab] = useState();
    const location = useLocation();
    // console.log(location.state)
    // console.log('history ',history?.location)
    const [isActive, setIsActive] = useState(location?.state?.sourceName || '')
    const { t } = useTranslation();
    const showtab = (selectedMenuId) => { 
        setIsActive(selectedMenuId) 
        setTab(selectedMenuId)
    }

    useEffect(() => {
        setTab(history?.location?.state?.sourceName)
        if (adminMenu.map(x => x.id).includes(history?.location?.state?.sourceName)) {
            showtab(history?.location?.state?.sourceName);
        } else {
            showtab("adminRoleList");
        }
    }, [])
    return (
        <div>
            {/* <div className="page-title-box">
                <h1 className="title">{t('admin_view_user')}</h1>
            </div> */}
            <div className="mt-2">
                <div className="cmmn-skeleton">
                    <ul className="nav nav-tabs">
                        {adminMenu.map((menu, i) => (
                            <li key={i} className="nav-item">
                                <a id="adminRoleList" onClick={() => showtab(menu.id)} to="#" data-toggle="tab" aria-expanded="true" className={"cursor-pointer nav-link" + (isActive === menu.id ? ' active' : '')}>{menu.title}</a>
                            </li>
                        ))}
                    </ul>
                    <div className="col-12 admin-user">
                        {(() => {
                            switch (isActive) {
                                case adminMenu[0].id:
                                    return <RoleTable />;
                                case adminMenu[1].id:
                                    return <OrgHierarchy />
                                case adminMenu[2].id:
                                    return (
                                        <UserManagement appsConfig={props?.appsConfig} />
                                    );
                                case adminMenu[3].id:
                                    return (
                                        <NewUserRequest appsConfig={props?.appsConfig} />
                                    );
                                default:
                                    return (<RoleTable></RoleTable>);
                            }
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserView;
