import React, { useEffect, useState, useRef } from 'react';
import { properties } from "../../../properties";
import { get, post } from "../../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";

const Filter = (props) => {
    const { data, handler } = props
    const { showFilter, meOrMyTeam, auth, width } = data
    const { setSearchParams, handleClear } = handler
    const [teamMembers, setTeamMembers] = useState([])
    const [masterLookupData, setMasterLookupData] = useState({});
    const formRef = useRef();
    const taskStatuses = masterLookupData?.LEAD_TASK_STATUS?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const priorities = masterLookupData?.PRIORITY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const { handleSubmit, control, reset } = useForm();
    const [submitError, setSubmitError] = useState(null);
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=LEAD_TASK_STATUS,PRIORITY').then((resp) => {
            setMasterLookupData({ ...resp.data });
        }).catch(error => {
            console.error(error);
        });

        post(properties.ROLE_API + '/role-manager', { "userId": auth?.user?.userId, "roleId": auth?.currRoleId })
            .then((response) => {
                const { data = [] } = response;
                if (data.length > 0) {
                    setTeamMembers([...data]);
                }
            })
            .catch(error => {
                console.error(error);
            });

        // get(properties.USER_API + '/get-my-team-members').then((response) => {
        //     const { data } = response;
        //     if (data) {
        //         setTeamMembers([...data]);
        //     }
        // }).catch(error => {
        //     console.error(error);
        // });
    }, [])
    const teamMemberss = teamMembers?.map(elm => ({ label: (elm?.userDetails?.firstName + ' ' + elm?.userDetails?.lastName), value: elm?.userId }));
    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected = !data?.dateRange?.length && !data.priority && !data.status;
        if (meOrMyTeam === "Me" && noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        } else if (meOrMyTeam === "MyTeam" && noFilterSelected && !data.teamMemberId) {
            setSubmitError("Please apply atleast one filter"); return;
        }

        if (data?.dateRange?.length) {
            data.dateRange[1] = data.dateRange?.[1] ? data.dateRange?.[1] : data.dateRange?.[0]
            data['fromDate'] = moment(data.dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(data.dateRange?.[1]).format("YYYY-MM-DD")
        }

        if (meOrMyTeam !== "MyTeam") {
            data["teamMemberId"] = undefined;
        }

        console.log("setting search params..")
        setSearchParams({
            ...data
        });
    }

    return (
        <div className="skel-filter-int" id="searchBlock1" style={{
            display: showFilter ? 'block' : 'none',
            width: width ? width : "300px"
        }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                {meOrMyTeam === "MyTeam" && (
                    <div className="form-group">
                        <label htmlFor="apptname" className="filter-form-label control-label">Team Members</label>
                        <Controller
                            control={control}
                            name="teamMemberId"
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <ReactSelect
                                    inputRef={ref}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    className="w-100"
                                    options={teamMemberss}
                                    isMulti={true}
                                    value={value ? teamMemberss.find(c => c.value === value) : null}
                                    onChange={val => onChange(val)}
                                />
                            )}
                        />
                    </div>
                )}
                {/* <div className='skel-filter-dashboard-static'> */}
                <div className="form-group">
                    <label htmlFor="apptname" className="filter-form-label control-label">Date Range</label>
                    <Controller
                        control={control}
                        name="dateRange"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <DateRangePicker
                                format="dd-MM-yyyy"
                                character={' to '}
                                value={value ? value : []}
                                onChange={onChange}
                                placeholder="Select Date Range"
                                className="z-idx w-100"
                                placement='bottomEnd'
                                cleanable={false}
                            />
                        )}
                    />
                </div>
                {/* </div> */}
                <div className="form-group skel-z-index">
                    <label htmlFor="apptname" className="filter-form-label control-label">Task Status</label>
                    <Controller
                        control={control}
                        name="status"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <ReactSelect
                                inputRef={ref}
                                className="w-100"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                options={taskStatuses}
                                isMulti={true}
                                value={value ? taskStatuses.find(c => c.value === value) : null}
                                onChange={val => onChange(val)}
                            />
                        )}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="apptname" className="filter-form-label control-label">Task Priority</label>
                    <Controller
                        control={control}
                        name="priority"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <ReactSelect
                                inputRef={ref}
                                className="w-100"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                options={priorities}
                                isMulti={true}
                                value={value ? priorities.find(c => c.value === value) : null}
                                onChange={val => onChange(val)}
                            />
                        )}
                    />
                </div>
                {submitError && <span className="errormsg">{submitError}</span>}
                <div className="form-group skel-filter-frm-btn">
                    <button className="skel-btn-cancel" onClick={(e) => { handleClear(e); reset(); }}>
                        Clear
                    </button>
                    <button className="skel-btn-submit" onClick={() => { formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })) }}>
                        Filter
                    </button>
                </div>
            </Form>
        </div>
    );
};

export default Filter;