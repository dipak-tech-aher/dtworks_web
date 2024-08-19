import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../properties";
import { get } from "../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, searchParams = {}, masterLookupData, startDate, endDate, entity } = data;
    const { setShowFilter, setSearchParams } = handler;
    const { handleSubmit, control, reset, } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    const [user, setUser] = useState([])
    const [roleList, setRoleList] = useState([]);
    useEffect(() => {
        if (entity) {
            handleClear()
        }
    }, [entity])
    const handleClear = (event) => {
        event?.preventDefault();
        reset();
        setSearchParams({
            fromDate: startDate, toDate: endDate, dateRange: undefined, category: undefined, type: undefined, status: undefined, sla: undefined, currentRole: undefined, createRole: undefined, user: undefined, createdDepartment: undefined, currentDepartment: undefined,
        });
        setTimeout(() => {
            setShowFilter(false);
        });
    }

    const helpdeskStatus = masterLookupData?.HELPDESK_STATUS?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const departmentList = masterLookupData?.DEPARTMENT?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const helpdeskTypeList = masterLookupData?.HELPDESK_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const interactionCategory = masterLookupData?.INTXN_CATEGORY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const interactionTypesList = masterLookupData?.INTXN_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const interactionStatusList = masterLookupData?.INTERACTION_STATUS?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const slaOptions = masterLookupData?.SLA_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
  

    useEffect(() => {
        (() => {
            try {
                // Get All users List
                get(properties.HELPDESK_API + '/get-helpdesk-users-list').then((response) => {
                    const { data } = response;
                    setUser(data?.map((ele) => {
                        return {
                            label: `${ele?.firstName} ${ele?.lastName}`,
                            value: ele?.userId
                        }
                    }));
                }).catch(error => {
                    console.error(error);
                });
                // Get All Roles List
                get(`${properties.ROLE_API}`).then((resp) => {
                    if (resp.data) {
                        let roles = []
                        resp.data.map((role) => {
                            roles.push({ id: role.roleId, label: role.roleName, value: role.roleDesc, });
                        });

                        setRoleList(roles);
                    }
                }).catch((error) => console.error(error));
            } catch (e) {
                console.log('error', e)
            }
        })()

    }, []);

    const onSubmit = (data) => {
        // console.log('data--------->', data);
        setSubmitError(null);
        const noFilterSelected =
            !data?.dateRange?.length &&
            !data.category &&
            !data.type &&
            !data.status &&
            !data.sla &&
            !data.role &&
            !data.currentUser &&
            !data.createRole &&
            !data.currentRole &&
            !data.currentDepartment &&
            !data.createdDepartment &&
            !data.department

        if (noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        }

        if (data?.dateRange?.length) {
            data.dateRange[1] = data.dateRange?.[1] ? data.dateRange?.[1] : data.dateRange?.[0]
            data['fromDate'] = moment(data.dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(data.dateRange?.[1]).format("YYYY-MM-DD")
        } else if (searchParams?.fromDate) {
            data['fromDate'] = searchParams?.fromDate;
            data['toDate'] = searchParams?.toDate ?? searchParams?.fromDate;
        }

        setSearchParams({ ...data });
        setTimeout(() => {
            setShowFilter(false);
        });
    }
    const getCurrentMonthDates = () => {
        const currentDate = new Date();
        const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
        const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return [fromDate, toDate];
    };
    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form
                className="mt-1 filter-form"
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="row mt-3 skel-filter-static">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label
                                htmlFor="apptname"
                                className="filter-form-label control-label"
                            >
                                Date Range
                            </label>
                            <Controller
                                control={control}
                                name="dateRange"
                                render={({
                                    field: { onChange, onBlur, value, ref },
                                }) => (
                                    <DateRangePicker
                                        format="dd-MM-yyyy"
                                        character={" to "}
                                        value={value ? value : getCurrentMonthDates()}
                                        onChange={onChange}
                                        placeholder="Select Date Range"
                                        className="z-idx w-100"
                                        placement='bottomEnd'
                                        cleanable={false}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    {entity === 'Interaction' && <>
                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="apptname" className="filter-form-label control-label">Interaction Category</label>
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <ReactSelect
                                            inputRef={ref}
                                            className="w-100"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            options={interactionCategory}
                                            isMulti={true}
                                            value={value ? interactionCategory.find(c => c.value === value) : null}
                                            onChange={val => onChange(val)}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="apptname" className="filter-form-label control-label">Interaction Type</label>
                                <Controller
                                    control={control}
                                    name="type"
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <ReactSelect
                                            inputRef={ref}
                                            className="w-100"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            options={interactionTypesList}
                                            isMulti={true}
                                            value={value ? interactionTypesList.find(c => c.value === value) : null}
                                            onChange={val => onChange(val)}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="apptname" className="filter-form-label control-label">Interaction Status</label>
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <ReactSelect
                                            inputRef={ref}
                                            className="w-100"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            options={interactionStatusList}
                                            isMulti={true}
                                            value={value ? interactionStatusList.find(c => c.value === value) : null}
                                            onChange={val => onChange(val)}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </>}
                    {entity === 'Helpdesk' && <><div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Helpdesk Type</label>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={helpdeskTypeList}
                                        isMulti={true}
                                        value={value ? helpdeskTypeList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                        </div>
                    </div>
                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="apptname" className="filter-form-label control-label">Helpdesk Status</label>
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field: { onChange, onBlur, value, ref } }) => (
                                        <ReactSelect
                                            inputRef={ref}
                                            className="w-100"
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                            options={helpdeskStatus}
                                            isMulti={true}
                                            value={value ? helpdeskStatus.find(c => c.value === value) : null}
                                            onChange={val => onChange(val)}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </>}
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">SLA</label>
                            <Controller
                                control={control}
                                name="sla"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={slaOptions}
                                        value={value ? slaOptions.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Created Role</label>
                            <Controller
                                control={control}
                                name="createRole"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={roleList}
                                        // value={value ? roleList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                        isMulti={true}
                                        value={value ? interactionCategory.find(c => c.value === value) : null}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Current Role</label>
                            <Controller
                                control={control}
                                name="currentRole"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={roleList}
                                        isMulti={true}
                                        value={value ? roleList.find(c => c.value === value) : null}
                                        // value={value ? roleList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Current User</label>
                            <Controller
                                control={control}
                                name="currentUser"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={user}
                                        isMulti={true}
                                        value={value ? user.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Current Department</label>
                            <Controller
                                control={control}
                                name="currentDepartment"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={departmentList}
                                        isMulti={true}
                                        value={value ? departmentList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Created Department</label>
                            <Controller
                                control={control}
                                name="createdDepartment"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={departmentList}
                                        value={value ? departmentList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                        isMulti={true}
                                    />
                                )}
                            />
                        </div>
                    </div>
                </div>
                <hr className="cmmn-hline" />
                {submitError && <span className="errormsg">{submitError}</span>}
                <div className="form-group skel-filter-frm-btn">
                    <button className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                    <button className="skel-btn-submit">
                        Filter
                    </button>
                </div>

            </Form>
        </div>
    );
};

export default Filter;