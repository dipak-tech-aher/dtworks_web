import React, { useRef, useState } from 'react';
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import ReactSelect from "react-select";
import moment from "moment";
import isAfter from 'date-fns/isAfter';

const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, searchParams = {}, masterLookupData, startDate, endDate } = data;
    const { setShowFilter, setSearchParams } = handler;
    const { handleSubmit, control, reset, } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);

    const category = masterLookupData?.ORDER_CATEGORY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const type = masterLookupData?.ORDER_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const status = masterLookupData?.ORDER_STATUS?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const departmentList = masterLookupData?.DEPARTMENT?.map(elm => ({ label: elm?.description, value: elm?.code }));

    // const getMaxDate = moment().clone().endOf('month').format('YYYY-MM-DD');
    const getMaxDate = moment().format('YYYY-MM-DD');

    const handleClear = (event) => {
        event?.preventDefault();
        reset();
        setSearchParams({
            fromDate: startDate, toDate: endDate, dateRange: undefined, category: undefined, type: undefined, status: undefined, department: undefined,
        });
        setTimeout(() => {
            setShowFilter(false);
        });
    }

    const onSubmit = (data) => {
        // console.log('data--------->', data);
        setSubmitError(null);
        const noFilterSelected =
            !data?.dateRange?.length &&
            !data.category &&
            !data.type &&
            !data.status &&
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
        <div
            className="skel-filter-int"
            id="searchBlock1"
            style={{ display: showFilter ? 'block' : 'none' }}
        >
            <Form
                className="mt-1 filter-form"
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
            >
                <div className="row mt-3 skel-filter-static">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label
                                htmlFor="Interactiontype"
                                className="control-label"
                            >
                                Custom Date
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
                                        shouldDisableDate={date => isAfter(date, new Date())}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label">
                                By Category
                            </label>
                            <Controller
                                control={control}
                                name="category"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={category}
                                        isMulti={false}
                                        value={value ? category.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label">
                                By Status
                            </label>
                            <Controller
                                control={control}
                                name="status"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={status}
                                        isMulti={false}
                                        value={value ? status.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label">
                                By Department/Role
                            </label>
                            <Controller
                                control={control}
                                name="department"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={departmentList}
                                        isMulti={false}
                                        value={value ? departmentList.find(c => c.value === value) : null}
                                        onChange={val => onChange(val)}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label">
                                By Type
                            </label>
                            <Controller
                                control={control}
                                name="type"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        inputRef={ref}
                                        className="w-100"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        options={type}
                                        isMulti={false}
                                        value={value ? type.find(c => c.value === value) : null}
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
                <div className="row mt-3">
                    <div className="col-md-12">
                        <div className="form-group skel-filter-frm-btn">
                            <label className="control-label">&nbsp;</label>
                            <button className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                            <button className="skel-btn-submit">Submit</button>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    )
}

export default Filter;