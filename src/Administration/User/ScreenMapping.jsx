import React, { useEffect, useState } from 'react';
import { get } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { isEqual } from 'lodash'
import { unstable_batchedUpdates } from 'react-dom';

export default function ScreenMapping({ data, handler }) {
    const { selectedRoles = [], userId, selectedDepts = [], departments } = data || {};
    const { setDepartments,setMappedDepts } = handler || {};
    const [activeTab, setActiveTab] = useState('');
    // console.log('selectedRoles', selectedRoles)
    // console.log('departments', departments)
    const checked = (a, screenCode, deptId) => {
        console.log(screenCode, deptId)
        const item = a?.find(item => item.deptId === deptId);
        const item2=selectedDepts?.find(item => item.deptId === deptId);
        return item?.screenCode === screenCode ?? item2?.screenCode === screenCode ;
    };
    useDeepCompareEffect(() => {
        const fetchScreens = async () => {
            try {
                const response = await get(`${properties.MASTER_API}/user-by/screen`);
                if (response?.data) {
                    let mappedDeptResponse;
                    if (userId) mappedDeptResponse = await get(`${properties.USER_API}/get-mapped-dept/${userId}`);
                    const formatedDepts = departments?.current?.filter(obj1 => selectedRoles.some(obj2 => obj1?.unitId === obj2.unitId))?.map(dept => ({
                        ...dept,
                        screens: response.data.map(screen => ({ ...screen, checked: checked(mappedDeptResponse?.data ?? [], screen?.screenCode, dept?.unitId) }))
                    }));
                    unstable_batchedUpdates(() => {
                        setMappedDepts?.(mappedDeptResponse?.data ?? [])
                        setDepartments(formatedDepts);
                        setActiveTab(formatedDepts[0]?.unitId)
                    })

                }
            } catch (error) {
                console.error('Error fetching screens:', error);
            }
        };
        if (selectedRoles?.length) fetchScreens();
    }, [selectedRoles]);
    const handleCheckboxChange = (item, role) => {
        // Update roleScreens with the new checkbox state
        setDepartments(prevDepts =>
            prevDepts.map(r =>
                r.unitId === role.unitId
                    ? {
                        ...r,
                        screens: r.screens.map(s =>
                            s.screenCode === item.screenCode
                                ? { ...s, checked: !s.checked }
                                : s
                        )
                    }
                    : r
            )
        );
    };
    return (
        <div>
            <span className="skel-heading">Screen Level Mapping</span>
            <div className="tabbable-responsive">
                <div className="tabbable mt-2">
                    <ul className="nav nav-tabs" role="tablist">
                        {selectedDepts.map(dept => (
                            <li className="nav-item" key={dept.unitId}>
                                <a
                                    className={`nav-link text-ellips ${dept.unitId === activeTab ? 'active' : ''}`}
                                    id={dept.unitId}
                                    data-toggle="tab"
                                    href={`#${dept.unitId}`}
                                    dept="tab"
                                    aria-controls={dept.unitId}
                                    onClick={() => setActiveTab(dept.unitId)}
                                >
                                    {dept.unitName}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card-body">
                    <div className="tab-content">
                        {selectedDepts.map((dept, index) => (
                            <div
                                className={`tab-pane fade skel-tabs-dept ${dept.unitId === activeTab ? 'active show' : ''}`}
                                id={dept.unitId}
                                dept="tabpanel"
                                aria-labelledby={dept.unitId}
                                key={dept.unitId}
                            >
                                <div className="row mt-0 pl-2 mb-4">
                                    {dept?.screens?.map((screen, i) => (
                                        <div className="col-md-3" key={screen.screenCode}>
                                            <div className="form-group">
                                                <div className="custom-control custom-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="custom-control-input"
                                                        id={`${screen.screenCode}_${i}_${index}`}
                                                        checked={screen.checked}
                                                        onClick={() => handleCheckboxChange(screen, dept)}
                                                        onChange={() => { }}
                                                    />
                                                    <label className="custom-control-label" htmlFor={`${screen.screenCode}_${i}_${index}`}>
                                                        {screen.displayName}
                                                    </label>
                                                </div>
                                            </div>
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
}
function useDeepCompareEffect(callback, dependencies) {
    const [lastDependencies, setLastDependencies] = useState([]);

    useEffect(() => {
        if (!isEqual(lastDependencies, dependencies)) {
            callback();
            setLastDependencies(dependencies);
        }
    }, [dependencies, lastDependencies, callback]);
}