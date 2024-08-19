import React, { useContext, useEffect, useState } from "react";
import SwitchRoleLogo from '../../assets/images/svgviewer-switchrole.svg';
import { AppContext } from "../../AppContext";

import { toast } from 'react-toastify';
import { properties } from '../../properties'
import { get, put } from '../../common/util/restUtil'
import useDropDownArea from "./useDropDownArea";
import { useNavigate } from "react-router-dom";

const UserRole = () => {

    const history = useNavigate();
    const [display, setDisplay] = useDropDownArea('switchUser')
    let { auth, setAuth } = useContext(AppContext)
    const [role, setRole] = useState({ currRole: auth.currRole, currDept: auth.currDept, currRoleId: auth.currRoleId, currDeptId: auth.currDeptId, currDeptDesc: auth.currDeptDesc, currRoleDesc: auth.currRoleDesc, defaultScreen: '/' })
    let hierarchy = ['ORG', 'OU', 'DEPT']
    let counter = 0
    const [roles, setRoles] = useState([])

    const rnd = (min = 100000, max = 999999) => Math.floor(Math.random() * (max - min + 1) + min);

    useEffect(() => {

        get(properties.USER_API + "/switch-user")
            .then((resp) => {
                if (resp.data && resp.data.length > 0) {
                    setRoles(resp.data)
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    const updateRole = (id) => {
        let array = id.split(" ");
        let dept = "";
        let name = "";
        let deptId = "";
        let deptDesc = "";
        let roleDesc = "";
        let defaultScreen = "/";

        if (auth.user.mappingPayload.userDeptRoleMapping && roles && roles.length) {
            for (const node of roles) {
                if (node.unitId === array[1]) {
                    const role = node.roles.find(role => role.roleId === Number(array[0]));
                    if (role) {
                        dept = node.unitName;
                        deptDesc = node.unitDesc;
                        roleDesc = role.roleDesc;
                        name = role.roleName;
                        deptId = node.unitId;
                        defaultScreen = role.defaultScreenPath

                        const screens = role?.mappingPayload?.permissions

                        if (!defaultScreen || defaultScreen === '/') {
                            let defaultScreenFound = false;
                            let recentAllowScreen = null;

                            for (const s of screens) {
                                const screen = s.moduleScreenMap;

                                for (const m of screen) {
                                    if (defaultScreenFound) {
                                        break;
                                    }

                                    if (m.defaultScreen) {
                                        defaultScreen = m.api;
                                        defaultScreenFound = true;
                                        break;
                                    }

                                    if (m.accessType === 'allow') {
                                        recentAllowScreen = m.api;
                                    }
                                }

                                if (defaultScreenFound) {
                                    break;
                                }
                            }

                            if (!defaultScreenFound && recentAllowScreen) {
                                defaultScreen = recentAllowScreen;
                            }
                        }

                    }
                }
            }
        }
        setRole({
            ...role,
            currRole: name,
            currDept: dept,
            currRoleId: Number(array[0]),
            currDeptId: deptId,
            currRoleDesc: roleDesc,
            currDeptDesc: deptDesc,
            defaultScreen
        });
    };


    const handleChange = () => {
        put(properties.AUTH_API + "/session/" + auth.user.userId, role)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success("Role Switch Successfully")
                    setDisplay(!display)
                    let defaultScreen = role.defaultScreen
                    const screens = resp.data.permissions

                    if (!defaultScreen || defaultScreen === '/') {
                        let defaultScreenFound = false;

                        screens.forEach(obj => {
                            if (defaultScreenFound) return;
                            defaultScreen = obj.moduleScreenMap?.find(screen => screen.defaultScreen === true)?.api;
                            if (defaultScreen) {
                                defaultScreenFound = true;
                            } else {
                                defaultScreen = obj.moduleScreenMap?.find(screen => screen.accessType === 'allow')?.api;
                                if (defaultScreen) {
                                    defaultScreenFound = true;
                                }
                            }
                        });
                    }
                    setAuth({ ...auth, defaultScreen, currRole: role.currRole, currDept: role.currDept, currRoleId: role.currRoleId, currDeptId: role.currDeptId, currRoleDesc: role.currRoleDesc, currDeptDesc: role.currDeptDesc, permissions: resp.data.permissions })

                    history(`/${defaultScreen}`);
                }
                else {
                    toast.error("Error while switching role")
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
        //window.location.reload(false);
    }

    return (
        <li className={`nav-item nav-item-switchuser ${display && "show"}`} id="switchUser" key={rnd()}>
            <span className="nav-link dropdown-toggle arrow-none waves-effect waves-light" onClick={() => { setDisplay(!display) }} >
                <img className="gray-icon" src={SwitchRoleLogo} alt="switch" height="27px" width="27px" />
                {/* <img className="orange-icon" src={SwitchRoleLogo} alt="switch" height="27px" width="27px" /> */}
            </span>
            <div className={`dropdown-menu dropdown-lg dropdown-menu-right ${display && "show"}`} style={{ width: "300px" }}>
                {
                    display ?
                        <div className="p-lg-1">
                            <div className="row no-gutters">
                                <div className="col text-center">
                                    <p>Switch User - Select your role</p>
                                    {
                                        auth && auth.user && auth.user.mappingPayload.userDeptRoleMapping && auth.user.mappingPayload.userDeptRoleMapping.length > 0 && roles.length > 0 ?
                                            <select className="form-control" value={role.currRoleId + " " + role.currDeptId} data-toggle="select2"
                                                onChange={(e) => { updateRole(e.target.value) }}
                                            >
                                                {
                                                    hierarchy.map((value) => {
                                                        if (value !== "ORG") {
                                                            counter = counter + 1;
                                                        }
                                                        return (
                                                            roles.map((node, index) => (
                                                                node.unitType === hierarchy[counter] ?
                                                                    <optgroup key={value + index + node.unitDesc} label={node.unitDesc}>
                                                                        {node.roles.map((role, roleIndex) => (
                                                                            <option key={value + role.roleId + node.unitId} value={role.roleId + " " + node.unitId}>{role.roleDesc}</option>
                                                                        ))}
                                                                    </optgroup>
                                                                    :
                                                                    null
                                                            ))
                                                        )
                                                    })

                                                }
                                            </select>
                                            :
                                            <select className="form-control" data-toggle="select2">
                                                <option>Select</option>
                                                <optgroup label="CEM">
                                                    <option value="AK">Agent</option>
                                                    <option value="HI">Manager</option>
                                                </optgroup>
                                                <optgroup label="Call Center">
                                                    <option value="CA">Agent</option>
                                                    <option value="NV">Manager</option>
                                                </optgroup>
                                                <optgroup label="Sales">
                                                    <option value="CA">Executive</option>
                                                    <option value="NV">Manager</option>
                                                </optgroup>
                                            </select>
                                    }
                                    <button type="button" className="btn btn-outline-primary waves-effect waves-light mt-3 text-center" onClick={handleChange}>Switch</button>
                                </div>
                            </div>


                        </div>
                        :
                        <></>
                }
            </div>
        </li>
    );
};

export default UserRole;
