import React, { useEffect, useState, useRef} from 'react';
import { properties } from "../../properties";
import { get } from "../../common/util/restUtil";
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, searchParams, masterLookupData,startDate,endDate } = data;
    const { setShowFilter, setSearchParams } = handler;
    const { handleSubmit, control, reset, } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([])

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            fromDate: startDate,
            toDate: endDate,
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

    const serviceCategories = masterLookupData?.PRODUCT_FAMILY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const serviceTypeList = masterLookupData?.SERVICE_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const handleOnChangeServiceCat = (e) => {
        const arr = []
        if (e.length > 0) {
            for (const d of e) {
                masterLookupData?.SERVICE_TYPE
                    .filter(col => {
                        if (col?.mapping?.prodSubType && col?.mapping?.prodSubType?.includes(d.value)) {
                            arr.push(col)
                        }
                    })
                setServiceTypes(arr.map(val => (
                    {
                        label: val.description,
                        value: val.code
                    }
                )))
            }
        } else {
            setServiceTypes([])
        }
    }
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=INTERACTION_STATUS,PRIORITY,SEVERITY,INTXN_CATEGORY,INTXN_TYPE,PROD_SUB_TYPE,SERVICE_TYPE,TICKET_CHANNEL,PROJECT')
            .then((response) => {
                const { data } = response;

                setServiceTypes(data?.SERVICE_TYPE?.map((ele) => {
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
                                value={value ? value : getCurrentMonthDates ()}
                                onChange={onChange}
                                placeholder="Select Date Range"
                                className="z-idx w-100"
                                cleanable={false}
                            />
                        )}
                    />
                </div>

                    <div className="form-group skel-z-index">
                        <label htmlFor="apptname" className="filter-form-label control-label">Service Category</label>
                        <Controller
                            control={control}
                            name="serviceCat"
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <ReactSelect
                                    inputRef={ref}
                                    className="w-100"
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                    options={serviceCategories}
                                    isMulti={true}
                                    value={value ? serviceCategories.find(c => c.value === value) : null}
                                    onChange={val => {
                                        onChange(val)
                                        handleOnChangeServiceCat(val);
                                    }}
                                />
                            )}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="apptname" className="filter-form-label control-label">Service Type</label>
                        <Controller
                            control={control}
                            name="serviceType"
                            render={({ field: { onChange, onBlur, value, ref } }) => (
                                <ReactSelect
                                    inputRef={ref}
                                    className="w-100"

                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                    options={serviceTypes && serviceTypes.length > 0 ? serviceTypes : serviceTypeList}
                                    isMulti={true}
                                    value={value ? serviceTypes.find(c => c.value === value) : null}
                                    onChange={val => onChange(val)}
                                />
                            )}
                        />
                    </div>
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