import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import { properties } from "../../properties";
import { get } from "../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
import { AppContext } from '../../AppContext';
import { uniqBy } from 'lodash'
const Filter = (props) => {
    const { auth } = useContext(AppContext);
    const { data, handler } = props;
    const { showFilter, searchParams, excelFilter, showRealTime } = data;
    const { setShowFilter, setSearchParams, setExcelFilter, checkComponentPermission } = handler;
    const { handleSubmit, control, reset, getValues, watch } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    const [projects, setProjects] = useState([])
    const [UserWiseprojects, setUserWiseProjects] = useState([])
    const [ageing] = useState([
        { label: "0 to 3 days", value: "0_3DAYS" },
        { label: "3 to 5 days", value: "3_5DAYS" },
        { label: "> than 5 days", value: "MORE_5DAYS" },
    ])
    const [interactionStatus, setInteractionStatus] = useState([])
    const [interactionPriorities, setInteractionPriorities] = useState([])
    const [interactionCategories, setInteractionCategories] = useState([])
    const [interactionTypes, setInteractionTypes] = useState([])
    const [serviceTypes, setServiceTypes] = useState([])
    const [serviceCat, setServiceCat] = useState([])
    const [channel, setChannel] = useState([])
    const [user, setUser] = useState([])

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            fromDate: undefined,
            toDate: undefined,
            dateRange: undefined,
            project: undefined,
            intxnCat: undefined,
            intxnType: undefined,
            serviceCat: undefined,
            serviceType: undefined,
            status: undefined,
            priority: undefined,
            userId: undefined,
            channel: undefined
        });
        setTimeout(() => {
            setShowFilter(false);
        });
    }

    const [intxnTypeOptions, setIntxnTypeOptions] = useState([]);
    const [serviceTypeOptions, setServiceTypeOptions] = useState([]);

    const watchintxnCat = watch("intxnCat");
    const watchserviceCat = watch("serviceCat");

    useEffect(() => {
        const options = watchintxnCat?.length ? interactionTypes.filter((e) => {
            return watchintxnCat.map(x => x.value).every(n => e.mapping?.intxnCategory?.includes(n));
        }) : [];
        setIntxnTypeOptions(options ?? [])
    }, [watchintxnCat])

    useEffect(() => {
        const options = watchserviceCat?.length ? serviceTypes.filter((e) => {
            return watchserviceCat.map(x => x.value).every(n => e.mapping?.prodSubType && e.mapping?.prodSubType?.includes(n));
        }) : [];
        setServiceTypeOptions(options ?? [])
    }, [watchserviceCat])

    //Ramesh 02.01.2024
    const Mergedprojects = useMemo(() => {
        let tempArray = [...UserWiseprojects, ...projects];
        return uniqBy(tempArray, function (e) { return e?.value; })
    }, [UserWiseprojects, projects])

    useEffect(() => {
        get(properties.USER_API + '/get-managerlist')
            .then((response) => {
                const { data } = response;
                setUser(data?.map((ele) => {
                    return {
                        label: `${ele?.firstName} ${ele?.lastName}`,
                        value: ele?.userId
                    }
                }));
            })
            .catch(error => {
                console.error(error);
            });

        get(properties.CUSTOMER_API + '/get-user-wise-projectlist').then((response) => {
            const { data } = response;
            setUserWiseProjects(data?.map((ele) => {
                return {
                    label: ele?.description,
                    value: ele?.code,
                    id: ele?.id,
                }
            }));
        }).catch(error => {
            console.error(error);
        });

        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INTERACTION_STATUS,PRIORITY,SEVERITY,INTXN_CATEGORY,INTXN_TYPE,PROD_SUB_TYPE,SERVICE_TYPE,TICKET_CHANNEL,PROJECT')
            .then((response) => {
                const { data } = response;

                let projectss = data.PROJECT.filter((f) => f.mapping && f.mapping.hasOwnProperty('department') && f.mapping.department.includes(auth?.currDeptId))
                // setProjects(projectss)
                setProjects(projectss?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        id: ele?.id,
                    }
                }));
                // setProjects(data?.PROJECT?.map((ele) => {
                //     return {
                //         label: ele?.description,
                //         value: ele?.code,
                //         mapping: ele?.mapping
                //     }
                // }));
                setInteractionStatus(data?.INTERACTION_STATUS?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setInteractionPriorities(data?.PRIORITY?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setInteractionCategories(data?.INTXN_CATEGORY?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setInteractionTypes(data?.INTXN_TYPE?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setServiceCat(data?.PROD_SUB_TYPE?.filter(x => x?.mapping?.department?.includes(auth?.currDeptId))?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setServiceTypes(data?.SERVICE_TYPE?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));
                setChannel(data?.TICKET_CHANNEL?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code,
                        mapping: ele?.mapping
                    }
                }));

            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const onSubmit = (data) => {
        // console.log('data--------->', data);
        setSubmitError(null);
        const noFilterSelected =
            !data?.dateRange?.length &&
            !data.project &&
            !data.ageing &&
            !data.intxnCat &&
            !data.intxnType &&
            !data.serviceCat &&
            !data.serviceType &&
            !data.status &&
            !data.priority &&
            !data.userId &&
            !data.channel

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

        setSearchParams({
            ...data
        });
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

    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            if (formRef.current && !formRef.current.contains(event.target)) {
                setShowFilter(false)
            }
        }
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, [formRef]);


    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="row mt-3 skel-filter-static">
                    {!showRealTime && /*checkComponentPermission("DATE_RANGE") &&*/ <div className="col-md-12">
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
                    </div>}

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Projects </label>
                            {console.log('Mergedprojects-------->', Mergedprojects)}
                            <Controller
                                control={control}
                                name="project"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={Mergedprojects}
                                        // options={projects}
                                        isMulti={true}

                                        value={value ? projects.find(c => c.value === value) : null}

                                        onChange={(val) => {
                                            onChange(val);
                                            handleInputChangeProject(val);
                                        }}
                                    />
                                )}
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
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={interactionStatus}
                                        isMulti={true}
                                        value={value ? interactionStatus.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Channel </label>
                            <Controller
                                control={control}
                                name="channel"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={channel}
                                        isMulti={true}
                                        value={value ? channel.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Priority </label>
                            <Controller
                                control={control}
                                name="priority"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={interactionPriorities}
                                        isMulti={true}
                                        value={value ? interactionPriorities.find(c => c.value === value) : null}
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
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Interaction Category </label>
                            <Controller
                                control={control}
                                name="intxnCat"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={interactionCategories}
                                        isMulti={true}
                                        value={value ? interactionCategories.find(c => c.value === value) : null}
                                        onChange={val => {
                                            onChange(val)
                                        }}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Interaction Type </label>
                            <Controller
                                control={control}
                                name="intxnType"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={intxnTypeOptions}
                                        isMulti={true}
                                        value={value ? intxnTypeOptions.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Service Category </label>
                            <Controller
                                control={control}
                                name="serviceCat"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={serviceCat}
                                        isMulti={true}
                                        value={value ? serviceCat.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Service Type </label>
                            <Controller
                                control={control}
                                name="serviceType"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={serviceTypeOptions}
                                        isMulti={true}
                                        value={value ? serviceTypeOptions.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

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