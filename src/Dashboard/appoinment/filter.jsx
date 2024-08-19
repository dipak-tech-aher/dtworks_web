import React, { useState, useRef, } from 'react';
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, searchParams } = data;
    const { setShowFilter, setSearchParams } = handler;
    const { handleSubmit, control, reset, } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            fromDate: undefined,
            toDate: undefined
        });
        setTimeout(() => {
            setShowFilter(false);
        });
    }

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected = !data?.dateRange?.length

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
        setSearchParams({
            ...data
        });
    }


    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form
                className="mt-1 filter-form"
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
            >
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
                                value={value ? value : []}
                                onChange={onChange}
                                placeholder="Select Date Range"
                                className="z-idx w-100"
                                cleanable={false}
                            />
                        )}
                    />
                    {submitError && <span className="errormsg">{submitError}</span>}
                    <div className="form-group skel-filter-frm-btn skel-btn-center-cmmn mt-2">
                        <button className="skel-btn-cancel" onClick={handleClear}>Clear</button>
                        <button className="skel-btn-submit">
                            Filter
                        </button>
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default Filter;