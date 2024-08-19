import React, { useState, useRef, useEffect } from 'react';
import { Controller, useForm } from "react-hook-form";
import { Form } from 'react-bootstrap';
import moment from "moment";
import Select from 'react-select';
import chroma from 'chroma-js';
const Filter = (props) => {
    const defaultColor = '#063970'
    const { data, handler } = props;
    const { showFilter, liveChatSource, selectedChatSource, selectedDate } = data;
    const { setShowFilter, handleChatSourceChange, handleSubmit: Apicall,handleClearDateChange } = handler;
    const { handleSubmit, control, reset, setValue } = useForm({
        channel: selectedChatSource
    });
    const formRef = useRef();
    const [submitError, setSubmitError] = useState(null);

    const onSubmit = (data) => {
        setSubmitError(null);
        const noFilterSelected = !data.channel && !data.date ;
        if (noFilterSelected) {
            setSubmitError("Please apply atleast one filter"); return;
        }
        Apicall?.();
    }
    useEffect(() => {
        setValue('channel', selectedChatSource)
        setValue('date', selectedDate)
    }, [selectedChatSource, selectedDate])

    const handleClear = (event) => {
        event.preventDefault();
        reset();
        setValue('channel', [{ label: 'ALL', value: 'ALL', color: defaultColor }])
        handleChatSourceChange([{ label: 'ALL', value: 'ALL', color: defaultColor }])
        setShowFilter(false);
        handleClearDateChange?.();
    }

    const getCurrentMonthDates = () => {
        const currentDate = new Date();
        const fromDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
        const toDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        return [fromDate, toDate];
    };
    const colourStyles = {
        control: (styles) => ({ ...styles, backgroundColor: 'white' }),
        option: (styles, { data, isDisabled, isFocused, isSelected }) => {
            const color = chroma(data?.color || '#fff');
            return {
                ...styles,
                // backgroundColor: isDisabled
                //   ? undefined
                //   : isSelected
                //   ? data.color
                //   : isFocused
                //   ? color.alpha(0.1).css()
                //   : undefined,
                // color: isDisabled
                //     ? '#ccc'
                //     : isSelected
                //         ? chroma.contrast(color, 'white') > 2
                //             ? 'white'
                //             : 'black'
                //         : data.color,
                // cursor: isDisabled ? 'not-allowed' : 'default',

                ':active': {
                    ...styles[':active'],
                    backgroundColor: !isDisabled
                        ? isSelected
                            ? data.color
                            : color.alpha(0.3).css()
                        : undefined,
                },
            };
        },
        multiValue: (styles, { data }) => {
            const color = chroma(data.color);
            return {
                ...styles,
                backgroundColor: color.alpha(0.1).css(),
            };
        },
        multiValueLabel: (styles, { data }) => ({
            ...styles,
            color: data.color,
        }),
        multiValueRemove: (styles, { data }) => ({
            ...styles,
            color: data.color,
            ':hover': {
                backgroundColor: data.color,
                color: 'white',
            },
        })
    };
    return (
        <div className="skel-filter-int" id="searchBlock1" style={{ display: showFilter ? 'block' : 'none' }}>
            <Form className="mt-1 filter-form" ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <div className="row mt-3 skel-filter-static">
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="channel" className="filter-form-label control-label">Chats</label>
                            <Controller
                                control={control}
                                name="channel"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <>
                                        <Select
                                            closeMenuOnSelect={false}
                                            value={value ?? null}
                                            options={liveChatSource}
                                            getOptionLabel={option => `${option.label}`}
                                            onChange={val => {
                                                onChange(val);
                                                handleChatSourceChange(val)
                                            }}
                                            styles={colourStyles}
                                            className=''
                                            isMulti
                                            isClearable
                                            name="channel"
                                        />
                                    </>

                                )}
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="date" className="filter-form-label control-label">Date</label>
                            <Controller
                                control={control}
                                name="date"
                                render={({ field: { onChange, onBlur, value, ref } }) => (
                                    <input type="date" className="input-sm form-control"
                                        value={value}
                                        max={moment(new Date()).format('YYYY-MM-DD')}
                                        onChange={(e) => {
                                            onChange(e)
                                        }}
                                        placeholder="Date Range" />
                                )}
                            />

                        </div>
                    </div>
                </div>
                {submitError && <span className="errormsg">{submitError}</span>}
                <div className="form-group skel-filter-frm-btn">
                    <button className="skel-btn-cancel" onClick={(e) => handleClear(e)}>
                        Cancel
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