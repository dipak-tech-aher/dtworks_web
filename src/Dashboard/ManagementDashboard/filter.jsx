import { isEmpty } from "lodash"
import moment from "moment"
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Form } from 'react-bootstrap'
import { Controller, useForm } from "react-hook-form"
import ReactSelect from "react-select"
import { DateRangePicker } from 'rsuite'
import { AppContext } from '../../AppContext'
import { get } from "../../common/util/restUtil"
import { properties } from "../../properties"

const Filter = (props) => {
    const { data, handler } = props
    const { showFilter, searchParams, excelFilter, showRealTime } = data
    const { setShowFilter, setSearchParams, setExcelFilter, checkComponentPermission } = handler;
    const { handleSubmit, control, reset } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null)
    const [channel, setChannel] = useState([])
    const [ouLookup, setOuLookUp] = useState([])
    const [departmentLookup, setDepartmentLookUp] = useState([])
    const masterLookUp = useRef()
    const startDate = moment().clone().startOf('month').format('YYYY-MM-DD');
    const endDate = moment().clone().endOf('month').format('YYYY-MM-DD');

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setSearchParams({
            fromDate: startDate,
            toDate: endDate,
            dateRange: undefined,
            ou: undefined,
            dept: undefined,
            channel: undefined
        })
        getIntialHierarchy(masterLookUp?.current)
        setTimeout(() => {
            setShowFilter(false);
        });
    }
    useEffect(() => {

        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=TICKET_CHANNEL')
            .then((response) => {
                const { data } = response;
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
            })

        get(properties.ORGANIZATION + '/search')
            .then(resp => {
                if (resp && resp.data && resp.data.length > 0) {
                    masterLookUp.current = resp.data
                    getIntialHierarchy(resp.data)
                }
            }).catch((error) => {
                console.error(error)
            })
    }, [])

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected =
            !data?.dateRange?.length &&
            !data.ou &&
            !data.dept &&
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
        if (data?.ou && !isEmpty(data?.ou)) {
            data.ou = data?.ou?.value
        }

        if (data?.dept && !isEmpty(data?.dept)) {
            data.dept = data?.dept?.value
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

    const getCurrentMonthDates = () => {
        const currentDate = new Date();
        const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return [fromDate, toDate];
    }

    const getIntialHierarchy = (payload) => {
        const ouLookUp = [];
        const departmentLookUp = [];
        payload?.forEach(({ unitType, unitDesc, unitId, status }) => {
            const item = { label: unitDesc, value: unitId };
            if (unitType === 'OU' && status === 'AC') {
                ouLookUp.push(item);
            } else if (unitType === 'DEPT' && status === 'AC') {
                departmentLookUp.push(item);
            }
        })
        setOuLookUp(ouLookUp);
        setDepartmentLookUp(departmentLookUp);
    }

    const handleOUChange = (val) => {
        let data = { ...searchParams };
        data['ou'] = val?.value
        const isOUSelected = Boolean(val?.value);
        const filteredDepartments = masterLookUp.current.filter(({ unitType, status, parentUnit }) =>
            unitType === 'DEPT' && status === 'AC' && (!isOUSelected || parentUnit === val.value)
        ).map((element) => ({ label: element.unitDesc, value: element.unitId }))
        setDepartmentLookUp(filteredDepartments)
        setExcelFilter({
            ...excelFilter,
            ou: val?.value
        })
    }

    const handleDeptChange = (val) => {
        let data = { ...searchParams };
        data['dept'] = val?.value
        setExcelFilter({
            ...excelFilter,
            dept: val?.value
        })
    }

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
                                    />
                                )}
                            />
                        </div>
                    </div>}
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="idType" className="control-label"> By Operational Unit </label>
                            <Controller
                                control={control}
                                name="ou"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={ouLookup}
                                        isMulti={false}
                                        value={value ? ouLookup.find(c => c.value === value) : null}
                                        onChange={(val) => { onChange(val); handleOUChange(val) }}
                                    />
                                )}
                            />
                            <span className="errormsg" />
                        </div>
                    </div>

                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="dept" className="control-label"> By Department </label>
                            <Controller
                                control={control}
                                name="dept"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <ReactSelect
                                        isClearable
                                        inputRef={ref}

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        className="w-100"
                                        options={departmentLookup}
                                        isMulti={false}
                                        value={value ? departmentLookup.find(c => c.value === value) : null}
                                        onChange={(val) => { onChange(val); handleDeptChange(val) }}
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

export default Filter