import React, { useState, useEffect } from 'react';
import Switch from "react-switch";
import { properties } from "../../properties";
import { post, get } from "../../common/util/restUtil";
import { toast } from "react-toastify";
import { string, object, number } from "yup";
import { useTranslation } from "react-i18next";

import UserLevelPermission from './userLevelPermission';
const validationSchema = object().shape({
    roleName: string().required("Please enter role name"),
    roleDesc: string().required("Please enter role description"),
    roleFamilyId: number().required("Please select role family").typeError('Please select role family'),
});

const NewRole = (props) => {
    const { roleFamilies, setDisplay } = props
    const { t } = useTranslation();
    const [error, setError] = useState({});
    const [state, setState] = useState(false);
    const [permissionMasterData, setPermissionMasterData] = useState({});
    const [data, setData] = useState({
        roleName: "",
        roleDesc: "",
        roleFamilyId: "",
        isAdmin: false,
        mappingPayload: "",
        status: "AC"
    })
    const handleClear = () => {
        setData({ ...data, roleName: "", roleDesc: "", roleFamilyId: "", isAdmin: false, mappingPayload: "", status: 'AC' })
    }

    useEffect(() => {
        get(properties.MASTER_API + "/menu/menu-list")
            .then((resp) => {
                if (resp.data && resp.data.length > 0) {
                    const array = resp.data;

                    // Organize data into modules and submodules
                    const organizedData = array.map((item) => {
                        const { moduleName, moduleScreenMap, modules, ...rest } = item;

                        const screens = moduleScreenMap.map((screen) => {
                            const { screenName, screenCode, url, props, icon, components } = screen;
                            const updatedComponents = components.map((component) => ({
                                ...component,
                                accessType: 'deny',
                            }));
                            return {
                                label: screenName,
                                id: screenCode,
                                url,
                                props,
                                icon,
                                accessType: 'deny',
                                components: updatedComponents,
                            };
                        });

                        const submodules = modules && modules.map((submodule) => {
                            const { moduleScreenMap: subScreens, ...submoduleRest } = submodule;

                            const subScreensData = subScreens.map((subScreen) => {
                                const { screenName, screenCode, url, props, icon, components } = subScreen;
                                const updatedComponents = components.map((component) => ({
                                    ...component,
                                    accessType: 'deny',
                                }));
                                return {
                                    label: screenName,
                                    id: screenCode,
                                    url,
                                    props,
                                    icon,
                                    accessType: 'deny',
                                    components: updatedComponents,
                                };
                            });

                            return {
                                ...submoduleRest,
                                moduleName: submodule.moduleName,
                                moduleScreenMap: subScreensData,
                            };
                        });

                        return {
                            ...rest,
                            moduleName,
                            moduleScreenMap: screens,
                            submodules,
                        };
                    });

                    setPermissionMasterData(organizedData);
                } else {
                    toast.error("Error while getting permission");
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    const choosePermission = (moduleKey, submoduleKey, screenKey, componentKey, permission) => {
        setPermissionMasterData((prevState) => {
            const updatedState = [...prevState];

            if (submoduleKey !== null && submoduleKey !== undefined) {
                const submodule = updatedState[moduleKey]?.submodules[submoduleKey];
                if (submodule) {
                    const screen = submodule.moduleScreenMap[screenKey];
                    if (screen) {
                        if (componentKey !== null && componentKey !== undefined) {
                            if (permission === 'allow' && screen.accessType === 'deny') {
                                toast.error('Please select allow for the screen');
                            }
                            const components = [...screen.components];
                            if (components && components.length > componentKey) {
                                components[componentKey] = {
                                    ...components[componentKey],
                                    accessType: screen.accessType === 'deny' ? 'deny' : permission
                                };
                                screen.components = components;
                            }
                        } else {
                            screen.accessType = permission;

                            if (screen.components && screen.components.length > 0) {
                                screen.components.forEach((component) => {
                                    component.accessType = permission === 'deny' ? 'deny' : 'allow';
                                });
                            }

                        }
                    }
                }
            } else {
                const screen = updatedState[moduleKey].moduleScreenMap[screenKey];
                if (screen) {
                    if (componentKey !== null && componentKey !== undefined) {
                        if (permission === 'allow' && screen.accessType === 'deny') {
                            toast.error('Please select allow for the screen');
                        }
                        const components = [...screen.components];
                        if (components && components.length > componentKey) {
                            components[componentKey] = {
                                ...components[componentKey],
                                accessType: screen.accessType === 'deny' ? 'deny' : permission
                            };
                            screen.components = components;
                        }
                    } else {
                        screen.accessType = permission;
                        if (screen.components && screen.components.length > 0) {
                            screen.components.forEach((component) => {
                                component.accessType = permission === 'deny' ? 'deny' : 'allow';
                            });
                        }
                    }
                }
            }
            return updatedState;
        });
    };

    const markAsDefaultScreen = (moduleKey, submoduleKey, screenKey, permission) => {
        setPermissionMasterData((prevState) => {
            const updatedState = [...prevState];

            updatedState.forEach(module => {
                if (module.submodules) {
                    module.submodules.forEach(submodule => {
                        submodule.moduleScreenMap.forEach(screen => {
                            screen.defaultScreen = false;
                        });
                    });
                }
                module.moduleScreenMap.forEach(screen => {
                    screen.defaultScreen = false;
                });
            });

            if (submoduleKey !== null && submoduleKey !== undefined) {
                const submodule = updatedState[moduleKey]?.submodules[submoduleKey];
                if (submodule) {
                    if (submodule.moduleScreenMap[screenKey].accessType === 'allow') {
                        submodule.moduleScreenMap[screenKey].defaultScreen = permission;
                    } else {
                        toast.error('Cannot set denied screen as default')
                    }
                }
            } else {
                if (updatedState[moduleKey].moduleScreenMap[screenKey].accessType === 'allow') {
                    updatedState[moduleKey].moduleScreenMap[screenKey].defaultScreen = permission;
                } else {
                    toast.error('Cannot set denied screen as default')
                }
            }

            return updatedState;
        });
    };
    // const choosePermission = (moduleKey, submoduleKey, screenKey, permission) => {
    //     // console.log(moduleKey, submoduleKey, screenKey, permission)
    //     if (moduleKey !== null && moduleKey !== undefined && moduleKey !== "") {
    //         setPermissionMasterData((prevState) => {
    //             const updatedState = [...prevState];

    //             if (submoduleKey !== null && submoduleKey !== undefined && submoduleKey !== "") {

    //                 // if (moduleKey < updatedState.length && screenKey < updatedState[moduleKey]?.submodules?.length) {
    //                 const moduleScreenMap = updatedState[moduleKey].submodules[submoduleKey]?.moduleScreenMap;

    //                 if (moduleScreenMap && moduleScreenMap.length > 0) {
    //                     moduleScreenMap[screenKey].accessType = permission;
    //                 }
    //                 // }
    //             }
    //             else {
    //                 const moduleScreenMap = updatedState[moduleKey].moduleScreenMap;

    //                 if (moduleScreenMap && moduleScreenMap.length > 0) {
    //                     moduleScreenMap[screenKey].accessType = permission;
    //                 }
    //             }

    //             return updatedState;
    //         });
    //     }
    // };
    const handleChange = (checked) => {
        setState(checked)
        setData({ ...data, isAdmin: checked })
    }

    const validate = () => {
        try {
            validationSchema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const onHandleSubmit = () => {
        const error = validate(validationSchema, data);
        if (error) return;
        let mappingScreen = [];

        permissionMasterData.forEach((value) => {
            let screens = [];

            value?.moduleScreenMap?.forEach((o) => {
                let components = [];

                o?.components?.forEach((component) => {
                    components.push({
                        componentName: component.componentName,
                        accessType: component.accessType,
                        componentType: component.componentType,
                        componentCode: component.componentCode,
                        componentOrder: component?.componentOrder ?? null
                    });
                });

                screens.push({
                    screenName: o.label,
                    screenCode: o.id,
                    props: o.props,
                    accessType: o.accessType,
                    api: o.url,
                    method: o.method,
                    components: components,
                    defaultScreen: o.defaultScreen,
                });
            });

            let temp = { moduleName: value.moduleName, moduleCode: value.moduleCode, moduleScreenMap: screens };

            if (value?.submodules && value?.submodules.length > 0) {
                temp.submodules = value.submodules.map((submodule) => ({
                    moduleName: submodule.moduleName,
                    moduleCode: submodule.moduleCode,
                    moduleScreenMap: submodule?.moduleScreenMap?.map((screen) => {
                        let components = [];

                        screen?.components?.forEach((component) => {
                            components.push({
                                componentName: component.componentName,
                                accessType: component.accessType,
                                componentType: component.componentType,
                                componentCode: component.componentCode
                            });
                        });

                        return {
                            screenName: screen.label,
                            screenCode: screen.id,
                            props: screen.props,
                            accessType: screen.accessType,
                            defaultScreen: screen.defaultScreen,
                            api: screen.url,
                            method: screen.method,
                            components: components,
                        };
                    }),
                }));
            }

            mappingScreen.push(temp);
        });
        data["mappingPayload"] = { "permissions": mappingScreen }
        post(properties.ROLE_API + '/create', data)
            .then((resp) => {
                if (resp.status === 200) {
                    toast.success("Role created successfully")
                }
                else {
                    toast.error("Error while creating role")
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally(() => { props.setDisplay(false) });
    }

    return (

        <div className="">
            <div className="modal-content">
                <div className="modal-header">
                    <h4 className="modal-title">Create Role</h4>
                    <button type="button" className="close" onClick={() => setDisplay(false)}>
                        <span aria-hidden="true">&times;</span>
                    </button>
                    {/* <button className="close" data-dismiss="modal" aria-label="Close" type="button"><span aria-hidden="true">X</span></button> */}
                </div>
                <div className="modal-body">
                    <fieldset className="scheduler-border">
                        <form className="col-md-12 justify-content-center">
                            <div className="row col-12">
                                <div style={{ paddingLeft: "0px", paddingRight: "12px" }} className="col-md-3">
                                    <label>Role Name <span className="text-danger">*</span></label>
                                    <input onChange={(e) => { setData({ ...data, roleName: e.target.value }); setError({ ...error, roleName: '' }) }}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") onHandleSubmit();
                                        }}
                                        id="roleName" value={data.roleName} className="form-control" type="text" required="" placeholder="Role Name" />
                                    {error?.roleName ? <p className="error-msg">{error?.roleName ?? ''}</p> : ""}
                                </div>
                                <div style={{ paddingLeft: "12px", paddingRight: "12px" }} className="col-md-3">
                                    <label>Role Family <span className="text-danger">*</span></label>
                                    <select className='form-control' onChange={(e) => { setData({ ...data, roleFamilyId: e.target.value }); setError({ ...error, roleFamilyId: '' }) }} >
                                        <option value="">Select Role Family</option>
                                        {roleFamilies?.map((e, i) => (
                                            <option value={e.value} key={i}>{e.label}</option>
                                        ))}
                                    </select>
                                    {error?.roleFamilyId ? <p className="error-msg">{error?.roleFamilyId ?? ''}</p> : ""}
                                </div>
                                <div style={{ paddingLeft: "12px", paddingRight: "12px" }} className="col-md-3">
                                    <label >Role Description <span className="text-danger">*</span></label>
                                    <input onChange={(e) => { setData({ ...data, roleDesc: e.target.value }); setError({ ...error, roleDesc: '' }) }}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") onHandleSubmit();
                                        }} id="roleDesc" value={data.roleDesc} className="form-control" type="text" required="" placeholder="Role Description" />
                                    {error?.roleDesc ? <p className="error-msg">{error?.roleDesc ?? ''}</p> : ""}
                                </div>
                                {/* <div style={{ paddingLeft: "12px", paddingRight: "12px" }} className="col-md-3">
                                    <label >Is Admin</label>
                                    <Switch onChange={handleChange} checked={data.isAdmin} />
                                    {error.roleName ? <p className="error-msg">     </p> : ""}
                                </div> */}
                            </div>
                        </form>
                        <div className=" pt-2"><div className="col-12 pl-2 bg-light border"><h5 className="text-primary">Set Role Level Permission</h5> </div></div>
                        <UserLevelPermission setPermissionMasterData={setPermissionMasterData} cPermission={choosePermission} markAsDefaultScreen={markAsDefaultScreen} permissionMasterData={permissionMasterData}></UserLevelPermission>
                    </fieldset>
                    <div className='skel-btn-center-cmmn'>
                        <button className="skel-btn-cancel" type="button" onClick={handleClear}>Clear</button>
                        <button className="skel-btn-submit" onClick={onHandleSubmit}>{t("Add")}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
export default NewRole;