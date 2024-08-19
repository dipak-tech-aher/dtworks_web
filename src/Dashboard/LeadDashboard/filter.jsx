import React, { useEffect, useState, useRef, useContext } from 'react';
import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
import { toast } from "react-toastify";
import { unstable_batchedUpdates } from 'react-dom';

const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, searchParams, excelFilter, showRealTime } = data;
    const { setShowFilter, setSearchParams, setExcelFilter } = handler;
    const { handleSubmit, control, reset } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    const [interactionStatus, setTaskStatus] = useState([])
    const [interactionPriorities, setTaskPriorities] = useState([])
    const [ageing, setAgeing] = useState([])

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            dateRange: undefined,
            status: undefined,
            priority: undefined,
            ageing: undefined
        });
        setTimeout(() => {
            setShowFilter(false);
        });
    }

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRIORITY,LEAD_TASK_STATUS,AGEING')
            .then((response) => {
                const { data } = response;

                setTaskStatus(data?.LEAD_TASK_STATUS?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code
                    }
                }));

                setTaskPriorities(data?.PRIORITY?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code
                    }
                }));

                setAgeing(data?.AGEING?.map((ele) => {
                    return {
                        label: ele?.description,
                        value: ele?.code
                    }
                }));
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected =
            !data?.dateRange?.length &&
            !data.ageing &&
            !data.status &&
            !data.priority
        if (noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        }

        if (data?.dateRange?.length) {
            data.dateRange[1] = data.dateRange?.[1] ? data.dateRange?.[1] : data.dateRange?.[0]
            data['fromDate'] = moment(data.dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(data.dateRange?.[1]).format("YYYY-MM-DD")
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
                                        value={value ? value : []}
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