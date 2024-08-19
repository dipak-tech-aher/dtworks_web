import React, { useState, useEffect } from 'react';
import ReactSwitch from "react-switch";
import PermissionTreeView from './PermissionsTreeView';

const UserLevelPermission = (props) => {
  const permissionMasterData = props.permissionMasterData
  const markAsDefaultScreen = props.markAsDefaultScreen
  // console.log('permissionMasterData==============================', permissionMasterData)

  const [moduleEnabledStates, setModuleEnabledStates] = useState({});//permissionMasterData.length > 0 ? permissionMasterData.map(() => true) : 
  // const [moduleVisibility, setModuleVisibility] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (permissionMasterData.length > 0) {
          const initialModuleEnabledStates = {};

          permissionMasterData.forEach((masterData) => {

            const hasAllowInModuleScreenMap = masterData.moduleScreenMap.some((page) => {
              return page.accessType === 'allow';
            });
            initialModuleEnabledStates[masterData.moduleCode] = hasAllowInModuleScreenMap;

            const submodules = masterData.submodules || [];
            submodules.forEach((submodule) => {
              const hasAllowInSubmodule = submodule.moduleScreenMap.some((page) => {
                return page.accessType === 'allow';
              });
              if (hasAllowInSubmodule) {
                initialModuleEnabledStates[submodule.moduleCode] = true;
                initialModuleEnabledStates[masterData.moduleCode] = true;
              }
            });
          });

          setModuleEnabledStates(initialModuleEnabledStates);
        }
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchData();
  }, [permissionMasterData]);



  const isActiveNode = (moduleCode) => {
    setModuleEnabledStates((prevVisibility) => ({
      ...prevVisibility,
      [moduleCode]: !prevVisibility[moduleCode],
    }));
  };



  const choosePermission = (moduleKey, submoduleKey, screenKey, componentKey, permission) => {
    props.cPermission(moduleKey, submoduleKey, screenKey, componentKey, permission);
  }

  const toggleModule = (moduleCode) => {
    setModuleEnabledStates((prevStates) => {
      const updatedModuleStates = { ...prevStates };
      updatedModuleStates[moduleCode] = !updatedModuleStates[moduleCode];

      const updatedPermissionMasterData = permissionMasterData.map((masterData) => {
        if (masterData.moduleCode === moduleCode) {
          const submodules = masterData.submodules || [];

          const moduleScreenAccessType = updatedModuleStates[moduleCode] ? 'allow' : 'deny';
          const updatedModuleScreenMap = masterData.moduleScreenMap.map((page) => ({
            ...page,
            accessType: moduleScreenAccessType,
          }));

          const updatedSubmodules = submodules.map((child) => {
            const childModuleId = child.moduleCode;
            const isChildEnabled = updatedModuleStates[childModuleId];
            const submoduleScreenAccessType = isChildEnabled ? 'allow' : 'deny';
            const updatedSubmoduleScreenMap = child.moduleScreenMap.map((page) => ({
              ...page,
              accessType: submoduleScreenAccessType,
            }));

            return {
              ...child,
              moduleScreenMap: updatedSubmoduleScreenMap,
            };
          });

          return {
            ...masterData,
            moduleScreenMap: updatedModuleScreenMap,
            submodules: updatedSubmodules,
          };
        }
        return masterData;
      });

      props.setPermissionMasterData(updatedPermissionMasterData);

      return updatedModuleStates;
    });
  };


  const toggleSubModule = (moduleCode) => {
    setModuleEnabledStates((prevStates) => {
      const updatedModuleStates = { ...prevStates };
      updatedModuleStates[moduleCode] = !updatedModuleStates[moduleCode];

      // setModuleVisibility((prevVisibility) => ({
      //   ...prevVisibility,
      //   [moduleCode]: updatedModuleStates[moduleCode],
      // }));

      const updatedPermissionMasterData = permissionMasterData.map((masterData) => {
        const updatedSubmodules =
          masterData.submodules &&
          masterData.submodules.map((child) => {
            if (child.moduleCode === moduleCode) {
              return {
                ...child,
                moduleScreenMap: child.moduleScreenMap.map((page) => ({
                  ...page,
                  accessType: updatedModuleStates[moduleCode] ? 'allow' : 'deny',
                })),
              };
            } else {
              return child;
            }
          });
        return {
          ...masterData,
          submodules: updatedSubmodules,
        };
      });

      props.setPermissionMasterData(updatedPermissionMasterData);

      return updatedModuleStates;
    });
  };


  // console.log('permissionMasterData ', permissionMasterData)
  // console.log('moduleEnabledStates ', moduleEnabledStates)

  return (
    <div className="user-block popup-box">
      <div className="row">
        <div className="userLevelPermission">
          <ul className="">
            {
              permissionMasterData.length > 0 &&
              // <PermissionTreeView
              //   permissionMasterData={permissionMasterData}
              //   moduleEnabledStates={moduleEnabledStates}
              //   toggleModule={toggleModule}
              //   choosePermission={choosePermission}
              // />

              permissionMasterData.map((masterData, i) => (
                <li key={i} className="parent_li">
                  <span onClick={(e) => isActiveNode("node" + masterData.moduleCode)}>
                    <i className="feather icon-chevron-right"></i>
                    {masterData.moduleName}
                    <ReactSwitch
                      onColor="#4C5A81"
                      offColor="#6c757d"
                      activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                      height={20}
                      width={48}
                      id={`moduleEnabled-${masterData.moduleCode}`}
                      className="inter-toggle skel-inter-toggle"
                      checked={moduleEnabledStates[masterData.moduleCode]}
                      onChange={() => {
                        toggleModule(masterData.moduleCode)
                      }}
                    />
                  </span>
                  {moduleEnabledStates[masterData.moduleCode] && (
                    <ul className={`userLevelChild ${moduleEnabledStates[masterData.moduleCode] ? 'active' : ''}`} id={"node" + masterData.moduleCode} style={{ display: moduleEnabledStates[masterData.moduleCode] ? 'block' : 'none' }}>
                      {masterData.moduleScreenMap?.map((permissionPage, j) => (
                        <li key={j} className="parent_li">
                          <span>{permissionPage.label}</span>
                          <ul className="ui-choose">
                            <li onClick={() => choosePermission(i, null, j, null, 'allow')} title="Allow" data-value="b" className={permissionPage.accessType === "allow" ? "selected" : "www"}>Allow</li>
                            <li onClick={() => choosePermission(i, null, j, null, 'deny')} title="Deny" data-value="c" className={permissionPage.accessType === "deny" ? "selected" : "ddd"}>Deny</li>

                          </ul>
                          <div className="form-group">
                            <div className="custom-control custom-radio">
                              <input type="radio" id={`mandatory ${permissionPage?.id}`}
                                className="custom-control-input"
                                value={permissionPage?.defaultScreen ?? false}
                                style={{ cursor: "pointer" }}
                                checked={permissionPage?.defaultScreen  ?? false}
                                onChange={(e) => markAsDefaultScreen(i, null, j, true)}
                              />
                              <label className="custom-control-label" htmlFor={`mandatory ${permissionPage?.id}`}>Mark as default screen</label>
                            </div>
                          </div>
                          {permissionPage.components && permissionPage.components.length > 0 && (
                            <div className="components-container">
                              <div className="components-header">Components</div>
                              <ul className="userLevelChild">
                                {permissionPage.components.map((component, k) => (
                                  <li key={k} className="parent_li">
                                    <span>{component.componentName}</span>
                                    <div className="ui-choose">
                                      <label>
                                        <input type="radio" value="allow" checked={component.accessType === 'allow'} onChange={() => choosePermission(i, null, j, k, 'allow')} /> Enable
                                      </label>
                                      <label>
                                        <input type="radio" value="deny" checked={component.accessType === 'deny'} onChange={() => choosePermission(i, null, j, k, 'deny')} /> Disable
                                      </label>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                      {masterData.submodules?.map((childData, idx) => (
                        <li key={idx} className="parent_li">
                          <span>
                            <i className="feather icon-chevron-right"></i>{childData.moduleName ?? ''}
                            <ReactSwitch
                              onColor="#4C5A81"
                              offColor="#6c757d"
                              activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                              height={20}
                              width={48}
                              className="inter-toggle skel-inter-toggle"
                              id={`childModuleEnabled-${childData.moduleCode}`}
                              checked={moduleEnabledStates[childData.moduleCode]}
                              onChange={() => {
                                toggleSubModule(childData.moduleCode)
                              }}
                            />
                          </span>
                          {moduleEnabledStates[childData.moduleCode] && (
                            <>
                              {childData.moduleScreenMap?.map((permissionPage, j) => (
                                <li key={j} className="parent_li">
                                  <span>{permissionPage.label}</span>
                                  <ul className="ui-choose">
                                    <li onClick={() => choosePermission(i, idx, j, null, 'allow')} title="Allow" data-value="b" className={permissionPage.accessType === "allow" ? "selected" : "www"}>Allow</li>
                                    <li onClick={() => choosePermission(i, idx, j, null, 'deny')} title="Deny" data-value="c" className={permissionPage.accessType === "deny" ? "selected" : "ddd"}>Deny</li>
                                  </ul>
                                  {permissionPage.components && permissionPage.components.length > 0 && (
                                    <div className="components-container">
                                      <div className="components-header">Components</div>
                                      <ul className="userLevelChild">
                                        {permissionPage.components.map((component, l) => (
                                          <li key={l} className="parent_li">
                                            <span>{component.componentName}</span>
                                            <div className="ui-choose">
                                              <label>
                                                <input type="radio" value="allow" checked={component.accessType === 'allow'} onChange={() => choosePermission(i, null, j, l, 'allow')} /> Enable
                                              </label>
                                              <label>
                                                <input type="radio" value="deny" checked={component.accessType === 'deny'} onChange={() => choosePermission(i, null, j, l, 'deny')} /> Disable
                                              </label>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </li>
                              ))}
                              {childData.modules?.map((grandchildData, grandIdx) => (
                                <li key={grandIdx} className="parent_li">
                                  <span>
                                    <i className="feather icon-chevron-right"></i>{grandchildData.moduleName ?? ''}
                                  </span>
                                  {grandchildData.moduleScreenMap?.map((permissionPage, k) => (
                                    <li key={k} className="parent_li">
                                      <span>{permissionPage.label}</span>
                                      <ul className="ui-choose">
                                        <li onClick={() => choosePermission(i, idx, grandIdx, k, null, 'allow')} title="Allow" data-value="b" className={permissionPage.accessType === "allow" ? "selected" : "www"}>Allow</li>
                                        <li onClick={() => choosePermission(i, idx, grandIdx, k, null, 'deny')} title="Deny" data-value="c" className={permissionPage.accessType === "deny" ? "selected" : "ddd"}>Deny</li>
                                      </ul>
                                      {permissionPage.components && permissionPage.components.length > 0 && (
                                        <div className="components-container">
                                          <div className="components-header">Components</div>
                                          <ul className="userLevelChild">
                                            {permissionPage.components.map((component, l) => (
                                              <li key={l} className="parent_li">
                                                <span>{component.componentName}</span>
                                                <div className="ui-choose">
                                                  <label>
                                                    <input type="radio" value="allow" checked={component.accessType === 'allow'} onChange={() => choosePermission(i, null, k, l, 'allow')} /> Enable
                                                  </label>
                                                  <label>
                                                    <input type="radio" value="deny" checked={component.accessType === 'deny'} onChange={() => choosePermission(i, null, k, l, 'deny')} /> Disable
                                                  </label>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </li>
                              ))}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                </li>
              ))
            }

          </ul>
        </div>
      </div>
    </div>
  )
}
export default UserLevelPermission;