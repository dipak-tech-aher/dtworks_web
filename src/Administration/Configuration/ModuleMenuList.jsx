import React from 'react';

const ModuleMenuList = ({ moduleSetupList, mainMenuData, handleSelectModuleSetup, handleSelectScreen }) => {

    return (
        <div className="skel-config-data">
            <div className="skel-config-cnt">
                <span className="skel-app-heading">Module Setup <span className="text-danger font-20 fld-imp">*</span></span>
                <div className="col-md-12">
                    <div className='row mt-3'>
                        {mainMenuData && mainMenuData.map((module) => (
                            module &&
                            <div className="col-md-3" key={module.moduleId}>
                                {/* {console.log('module===============>', module)} */}
                                <div className="form-group">
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            id={`mandatory ${module?.moduleId}`}
                                            className="custom-control-input"
                                            value={module.isSelected}
                                            style={{ cursor: "pointer" }}
                                            checked={module.isSelected}
                                            disabled={true}
                                            // onChange={(e) => handleSelectModuleSetup(module, e)}
                                        />
                                        <label className="custom-control-label" htmlFor={`mandatory ${module?.moduleId}`}>
                                            {module?.moduleName}
                                        </label>
                                    </div>
                                    {mainMenuData && mainMenuData.filter((menuData) => menuData && (menuData.moduleId === module.moduleId)).map((menuData) => (
                                        <div className="mt-2">
                                            {/* {console.log('menuData    ', menuData)} */}
                                            {menuData && menuData.moduleScreenMap?.map((screen) => (
                                                screen.screens &&
                                                <div key={screen.screens.screenId} className="form-group ml-2">

                                                    <div className="custom-control custom-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            id={`screen ${screen.screens.screenId}`}
                                                            className="custom-control-input"
                                                            value={screen.screens.isSelected}
                                                            style={{ cursor: "pointer" }}
                                                            checked={screen.screens.isSelected}
                                                            disabled={true}
                                                            // onChange={(e) => handleSelectScreen(module.moduleId, screen.screens, e)}
                                                        />
                                                        <label className="custom-control-label" htmlFor={`screen ${screen.screens.screenId}`}>
                                                            {screen.screens.screenName}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleMenuList;
