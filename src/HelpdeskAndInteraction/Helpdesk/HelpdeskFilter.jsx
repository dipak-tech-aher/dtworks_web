import React, { useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { unstable_batchedUpdates } from 'react-dom';
import { Controller, useForm } from "react-hook-form";
import ReactSelect from "react-select";
import { get } from "../../common/util/restUtil";
import { properties } from "../../properties";

const HelpdeskFilter = (props) => {
    const { data, handler } = props;
    const { showFilter, helpdeskSearchParams } = data;
    const { setShowFilter, setHelpdeskSearchParams } = handler;
    const { handleSubmit, control, reset } = useForm();
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);
    // const [masterLookupData, setMasterLookupData] = useState({});
    const [helpdeskStatus, setHelpdeskStatus] = useState([])


    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=HELPDESK_STATUS').then((response) => {
            const { data } = response;
            // setMasterLookupData({ ...data });
            setHelpdeskStatus(data?.HELPDESK_STATUS?.map((ele) => {
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
        const noFilterSelected = !data.status
        if (noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        }
        setHelpdeskSearchParams({ ...helpdeskSearchParams, status: data.status })
        // setRefresh(!refresh)
    }

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        unstable_batchedUpdates(() => {
            setHelpdeskSearchParams({})
            setShowFilter(false)
        })
    }

    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="row mt-3 skel-filter-static">

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
                                        isMulti={false}
                                        value={value ? helpdeskStatus.find(c => c.value === value) : null}
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

export default HelpdeskFilter;