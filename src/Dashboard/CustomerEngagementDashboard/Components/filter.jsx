import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import { AppContext } from '../../../AppContext';

import { properties } from "../../../properties";
import { get } from "../../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
import { uniqBy } from 'lodash'
const Filter = (props) => {
    const { auth } = useContext(AppContext)

    const { data, handler } = props;
    const { showFilter, excelFilter, stream } = data;
    const { setShowFilter, setSearchParams, setHelpdeskSearchParams, setExcelFilter } = handler;
    const { handleSubmit, control, reset } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    const [projects, setProjects] = useState([])
    const [UserWiseprojects, setUserWiseProjects] = useState([])
    const [ageing] = useState([
        { label: "0 to 3 days", value: "0_3DAYS" },
        { label: "3 to 5 days", value: "3_5DAYS" },
        { label: "> than 5 days", value: "MORE_5DAYS" },
    ])
    const [masterLookupData, setMasterLookupData] = useState({});
    const [helpdeskStatus, setHelpdeskStatus] = useState([]);
    const [helpdeskPriorities, setHelpdeskPriorities] = useState([]);
    const [helpdeskSeverities, setHelpdeskSeverities] = useState([]);
    const [user, setUser] = useState([])
    //Ramesh 02.01.2024
    const Mergedprojects = useMemo(() => {
        let tempArray = [...UserWiseprojects, ...projects]
        return uniqBy(tempArray, function (e) { return e.id; })
    }, [UserWiseprojects, projects])


    useEffect(() => {
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
        get(properties.CUSTOMER_API + '/get-user-wise-projectlist').then((response) => {
            const { data } = response;
            setUserWiseProjects(data?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code,
                    id:ele.id
                }
            }));
        }).catch(error => {
            console.error(error);
        });
        
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PROJECT,HELPDESK_STATUS,PRIORITY,SEVERITY').then((response) => {
            const { data } = response;
            setMasterLookupData({ ...data });

            let projectss = data.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId))
           
            // setProjects(projectss)
            setProjects(projectss?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code,
                    id: ele?.id
                }
            }));

            setHelpdeskStatus(data?.HELPDESK_STATUS?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code
                }
            }));
            setHelpdeskPriorities(data?.PRIORITY?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code
                }
            }));
            setHelpdeskSeverities(data?.SEVERITY?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code
                }
            }));
        }).catch(error => {
            console.error(error);
        });
    }, []);

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected = !data?.dateRange?.length && !data.project && !data.status && !data.severity && !data?.userId && !data.ageing;
        if (noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        }

        if (data?.dateRange?.length) {
            data.dateRange[1] = data.dateRange?.[1] ? data.dateRange?.[1] : data.dateRange?.[0]
            // console.log(moment(data.dateRange?.[0]).format("YYYY-MM-DD"))
            data['fromDate'] = moment(data.dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(data.dateRange?.[1]).format("YYYY-MM-DD");
            // console.log('filter date ',data)        
        }
        if (data?.ageing?.value) {
            if (data?.ageing?.value == "0_3DAYS") {
                let enddate = moment();
                let startdate = moment().subtract(3, 'days');
                data['fromDate'] = moment(startdate).format("YYYY-MM-DD");
                data['toDate'] = moment(enddate).format("YYYY-MM-DD");         
            } else if (data?.ageing?.value == "3_5DAYS") {
                let enddate = moment().subtract(3, 'days');
                let startdate = moment().subtract(5, 'days');
                data['fromDate'] = moment(startdate).format("YYYY-MM-DD");
                data['toDate'] = moment(enddate).format("YYYY-MM-DD");         
            } else if (data?.ageing?.value == "MORE_5DAYS") {
                let enddate = moment().subtract(5, 'days');
                data['fromDate'] = undefined;
                data['toDate'] = moment(enddate).format("YYYY-MM-DD");             
            }
        }

        if (data?.userId) {
            data.currentUser = data?.userId;
            data.userId = data?.userId?.value
        }

        //Ramesh(Clear filter changes) 04.01.24
        let [startDate,endDate]=getCurrentMonthDates();
        setSearchParams({
            ...data,
            fromDate: moment(data.dateRange?.[0] || startDate).format('YYYY-MM-DD'),
            toDate: moment(data.dateRange?.[1] || endDate).format('YYYY-MM-DD'),
        });
    }

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setHelpdeskSearchParams({
            // fromDate: undefined, toDate: undefined, status: undefined, priority: undefined, project: undefined, severity: undefined, userId: undefined
        });
        setShowFilter(false);
        //Ramesh 04.01.24(Clear filter issue fixing)
        let [startDate,endDate]=getCurrentMonthDates()
        setSearchParams({fromDate: moment(startDate).format("YYYY-MM-DD"),toDate: moment(endDate).format("YYYY-MM-DD") })
        // setSearchParams((state)=>{return ({fromDate: state.fromDate,toDate: state.fromDate, }) })
    }


    const handleInputChangeDate = (dateRange) => {
        let data = {};
        if (dateRange?.length > 0) {
            data['fromDate'] = moment(dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(dateRange?.[1]).format("YYYY-MM-DD");
           
            setExcelFilter({
                ...excelFilter,
                dateRange: data,
                fromDate: data?.fromDate,
                toDate: data?.toDate
            })
            setHelpdeskSearchParams(data);
        }
    }

    const handleInputChangeProject = (project) => {
        setExcelFilter({
            ...excelFilter,
            project
        })
    }

    const handleInputChangeUser = (userId) => {
        setExcelFilter({
            ...excelFilter,
            userId: userId?.value
        })
    }

    const getCurrentMonthDates = () => {
        const currentDate = new Date();
        const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
        const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        // const fromDate = new Date(searchParams?.fromDate)
        // const toDate = new Date(searchParams?.toDate)
        return [fromDate, toDate];
    };


    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="row mt-3 skel-filter-static">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="apptname" className="filter-form-label control-label">Date Range</label>
                            <Controller
                                control={control}
                                name="dateRange"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <DateRangePicker
                                        format="dd-MM-yyyy"
                                        character={' to '}
                                        value={value ? value : getCurrentMonthDates()}
                                        // onChange={onChange}
                                        onChange={(selectedDates) => {
                                            onChange(selectedDates);
                                            handleInputChangeDate(selectedDates);
                                        }}
                                        placeholder="Select Date Range"
                                        className="z-idx w-100"
                                        placement='bottomEnd'
                                        preventOverflow
                                        cleanable={false}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    {/* <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Projects </label>
                            <Controller
                                control={control}
                                name="project"
                                render={({ field: { onChange, onBlur, value, ref } }) =>(

                                        <ReactSelect
                                            inputRef={ref}
    
                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
    
                                            className="w-100"
                                            // options={projects}
                                            options={Mergedprojects}
                                            isMulti={true}
                                            //ramesh(04.1.2024)
                                            value={value ? value : []}
                                            // value={
    
                                            //     projects?.find(c => {
                                            //         console.log('c?.value--------->', c?.value)
                                            //         console.log('value?--------->', value)
                                            //         if (c?.value == value?.value) {
                                            //             console.log('value---------->', value)
                                            //             console.log('c?.value---------->', c?.value)
                                            //             return true
                                            //         }
                                            //     })
                                            // }
                                            onChange={(val) => {
                                                onChange(val);
                                                handleInputChangeProject(val);
                                            }}
                                        />
                                    )
                                }
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Ageing </label>
                            <Controller
                                control={control}
                                name="ageing"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={ageing}
                                        isMulti={false}
                                        value={value ? ageing.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Status </label>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={helpdeskStatus}
                                        isMulti={true}
                                        value={value ? helpdeskStatus.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Severity </label>
                            <Controller
                                control={control}
                                name="severity"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={helpdeskSeverities}
                                        isMulti={true}
                                        value={value ? helpdeskSeverities.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Current User </label>
                            <Controller
                                control={control}
                                name="userId"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={user}
                                        isMulti={false}
                                        value={value ? user.find(c => c.value === value) : null}
                                        // onChange={val => onChange(val)}
                                        onChange={(val) => {
                                            onChange(val);
                                            handleInputChangeUser(val);
                                        }}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div> */}
                </div>
                <hr className="cmmn-hline" />
                {submitError && <span className="errormsg">{submitError}</span>}
                <div className="form-group skel-filter-frm-btn">
                    <button className="skel-btn-cancel" onClick={(e) => handleClear(e)}>
                        Clear
                    </button>
                    <button className="skel-btn-submit" onClick={() => {
                        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        setTimeout(() => {
                            setShowFilter(false);
                        });
                    }}>
                        Filter
                    </button>
                </div>
            </Form>
        </div>
    );
};

export default Filter;