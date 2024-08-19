import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import { Controller, useForm } from "react-hook-form";
import { DateRangePicker } from 'rsuite';
import { Form } from 'react-bootstrap';
import moment from "moment";
import ReactSelect from "react-select";
import { OpsDashboardContext } from '../../../AppContext';
const Filter = (props) => {
    const { data, handler } = props;
    const { showFilter, excelFilter, stream, meOrMyTeam, serviceTypes, page = false, searchParams } = data;
    const { setShowFilter, setSearchParams, setHelpdeskSearchParams, setExcelFilter, handleClear, getOverViewDetails, getTopPerformance, setServiceTypes } = handler;
    const formRef = useRef();
    const { handleSubmit, control, reset } = useForm();
    const { data: ContextData, handlers } = useContext(OpsDashboardContext);
    let { teamMembers, masterLookupData } = ContextData || {}
    // const serviceCategories = masterLookupData?.SERVICE_CATEGORY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    // const serviceTypeList = masterLookupData?.SERVICE_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const HelpdeskTypeList = masterLookupData?.HELPDESK_TYPE?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const [submitError, setSubmitError] = useState(null);
    // const teamMemberss = teamMembers?.map(elm => ({ label: (elm?.firstName + ' ' + elm?.lastName), value: elm?.userId }));
    // const helpdeskStatus = masterLookupData?.HELPDESK_STATUS?.map(elm => ({ label: elm?.description, value: elm?.code }));;
    const severityList = masterLookupData?.SEVERITY?.map(elm => ({ label: elm?.description, value: elm?.code }));
    const HelpdeskSourceList = masterLookupData?.HELPDESK_SOURCE?.map(elm => ({ label: elm?.description, value: elm?.code }));

    const onSubmit = (data) => {

        setSubmitError(null);
        let noFilterSelected = !data?.dateRange?.length && !data.severity && !data.helpdeskType && !data.status && !data.serviceCat && !data.Channal;

        if (meOrMyTeam === "Me" && noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        } else if (meOrMyTeam === "MyTeam" && noFilterSelected) {
            // } else if (meOrMyTeam === "MyTeam" && noFilterSelected && !data.teamMemberId) {
            setSubmitError("Please apply atleast one filter"); return;
        }

        if (data?.dateRange?.length) {
            data.dateRange[1] = data.dateRange?.[1] ? data.dateRange?.[1] : data.dateRange?.[0]
            data['fromDate'] = moment(data.dateRange?.[0]).format("YYYY-MM-DD");
            data['toDate'] = moment(data.dateRange?.[1]).format("YYYY-MM-DD")
        }

        // if (meOrMyTeam !== "MyTeam") {
        //     data["teamMemberId"] = undefined;
        // }
        // console.log('data---------->', data);
        // let serviceTypes = data?.serviceType?.map((ele) => ele?.value);
        // console.log('serviceTypes-------xxxx--->', serviceTypes);

        setSearchParams({
            ...data
            // serviceType: serviceTypes ?? []
        });
        setShowFilter(false)

        getOverViewDetails && getOverViewDetails()
        getTopPerformance && getTopPerformance()
    }
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

    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
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

                <div className="form-group">
                    <label htmlFor="apptname" className="filter-form-label control-label">Helpdesk Type</label>
                    <Controller
                        control={control}
                        name="helpdeskType"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <ReactSelect
                                inputRef={ref}
                                className="w-100"

                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                options={HelpdeskTypeList}
                                isMulti={true}
                                value={value ? HelpdeskTypeList.find(c => c.value === value) : null}
                                onChange={val => onChange(val)}
                            />
                        )}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="apptname" className="filter-form-label control-label">Severity</label>
                    <Controller
                        control={control}
                        name="severity"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <ReactSelect
                                inputRef={ref}
                                className="w-100"

                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                options={severityList}
                                isMulti={true}
                                value={value ? severityList.find(c => c.value === value) : null}
                                onChange={val => onChange(val)}
                            />
                        )}
                    />
                </div>
                {/* <div className="form-group">
                    <label htmlFor="apptname" className="filter-form-label control-label">Status</label>
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
                </div> */}

                {/* <div className="form-group skel-z-index">
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
                                value={value ? serviceCategories.find(c => c.value === value) :null}
                                onChange={val => {
                                    onChange(val)
                                    handleOnChangeServiceCat(val);
                                }}
                            />
                        )}
                    />
                </div> */}
                <div className="form-group skel-z-index">
                    <label htmlFor="apptname" className="filter-form-label control-label">Channel</label>
                    <Controller
                        control={control}
                        name="Channal"
                        render={({ field: { onChange, onBlur, value, ref } }) => (
                            <ReactSelect
                                inputRef={ref}
                                className="w-100"
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                options={HelpdeskSourceList}
                                isMulti={true}
                                value={value ? HelpdeskSourceList.find(c => c.value === value) : null}
                                onChange={val => {
                                    onChange(val)
                                    handleOnChangeServiceCat(val);
                                }}
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