import React, { useEffect, useState } from "react";
import SignaturePad from "react-signature-canvas";
import ReactSelect from 'react-select';
import { DatePicker, DateRangePicker } from 'rsuite';
import { Tooltip } from "react-tooltip";
import moment from "moment";

/**
 * Renders a dynamic form based on the provided data.
 *
 * @param {Object} props - The props object containing the form attributes, form reference, form disabled state, signature pad reference, button hide state, and form details.
 * @param {Array} props.data.formAttributes - An array of objects representing the form attributes.
 * @param {Object} props.data.formRef - A reference to the form element.
 * @param {boolean} props.data.isFormDisabled - A flag indicating whether the form is disabled.
 * @param {Object} props.data.sigPad - A reference to the signature pad element.
 * @param {boolean} props.data.isButtonHide - A flag indicating whether the button is hidden.
 * @param {Object} props.data.formDetails - An object containing the form details.
 * @param {Object} props.handlers - The handlers for form submission and form field changes.
 * @param {Function} props.handlers.handleFormSubmit - The handler function for form submission.
 * @param {Function} props.handlers.handleFormOnChange - The handler function for form field changes.
 * @returns {JSX.Element} - The rendered dynamic form.
 */
const DynamicForm = (props) => {

    let { formAttributes, formRef, isFormDisabled, sigPad, isButtonHide, formDetails, values, tagDefaultValues, idx, lookupData } = props?.data;
    console.log('formDetails-------->', formDetails)
    console.log('formAttributes-------->', formAttributes)
    console.log('tagDefaultValues-------->', tagDefaultValues)
    const { handleFormSubmit, handleFormOnChange, setValues, setIsFormDisabled, clickToProceed } = props?.handlers
    const [formAttributesWithData, setFormAttributesWithData] = useState([])

    const customElementsRenderer = (headers, count, rowsIndex, formDetails, rest) => {
        const elements = []
        for (let i = 1; i <= count; i++) {
            elements.push(
                <td key={i}>
                    <input type="text" id={`d_${headers[i]?.id}_` + rowsIndex + i} /*data-id={header.id}*/ data-index={i} value={formDetails?.[`d_${headers[i]?.id}_` + rowsIndex + i]} required={rest?.required || false} disabled={isFormDisabled}
                        onChange={handleFormOnChange} ></input>
                </td>
            )
        }
        return elements
    }

    const customerRowsRenderer = (header, rowsIndex, formDetails, rest, indx) => {
        // console.log('indx------------->', indx)
        // console.log('rest------------->', rest)
        let elements = []
        elements = header?.map((h, index) => {
            return (
                <td key={index}>
                    {h?.fieldType === 'select' ?
                        <>
                            <ReactSelect
                                id={h?.id + rowsIndex + index}
                                placeholder={h?.title}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                options={lookupData?.current?.[h?.options?.code]?.map((item) => ({ label: item.description, value: item.code }))}
                                isMulti={h?.option?.isMulti}
                                onChange={(e) => { handleRowsOnChange(e, 'select', { id: h.id, index: rowsIndex }) }}
                            // value={channels?.filter(x => faqData?.channel?.includes(x.value))}
                            />
                        </>
                        : <input style={isFormDisabled ? { cursor: 'auto' } : { cursor: 'pointer' }} type="text" id={h?.id + rowsIndex + index + h?.formNumber + h?.sortOrder} data-id={h.id} data-index={rowsIndex} value={typeof (formDetails?.[h?.id]) === 'object' ? formDetails?.[h?.id]?.label : formDetails?.[h?.id]} required={rest?.required || false} disabled={isFormDisabled}
                            onChange={handleRowsOnChange} >
                        </input>}
                </td>
            )
        })
        return elements
    }

    const handleRowsOnChange = (e, type, rest) => {
        if (type === 'select') {
            values[rest?.index][rest.id] = e
        } else {
            const { dataset, value } = e?.target
            values[dataset.index][dataset.id] = value
        }
        setValues([...values])
    }

    const handleAddRows = (header, indx) => {
        const headerAttributes = header?.map((r) => r?.id)
        const rowAttributes = headerAttributes?.reduce((obj, key) => {
            obj[key] = "";
            return obj;
        }, {});
        setValues([...values, { ...rowAttributes, id: indx }])
    }

    const handleRemoveRow = (index) => {
        const updatedValues = [...values];
        updatedValues.splice(index, 1);
        setValues(updatedValues);
    };

    const clearSignature = () => {
        sigPad?.current?.clear();
    }

    function getMonthName(monthNumber) {
        const monthNames = [
            "Jan", "Feb", "Mar",
            "Apr", "May", "Jun", "Jul",
            "Aug", "Sept", "Oct",
            "Nov", "Dec"
        ];

        return monthNames[monthNumber - 1]; // Adjust for 0-based index
    }


    const getFormWithData = (item, index) => {
        console.log('item------------->', item)
        return (
            item ? (
                <div key={index} id={'hide' + idx} >
                    <form ref={formRef} onSubmit={(e) => { handleFormSubmit(e, idx) }} id="dynamicForm">
                        {item?.fieldType && item?.fieldType === 'select' && (
                            <>
                                <span className="header-title mb-2 font-weight-bold mt-4 d-block">{item?.title}</span>
                                {item?.id === "year" ? <input className="form-control" type="text" id={item?.id} name={item?.id} value={formDetails[item?.id]} disabled={true}></input> : item?.id === "month" ? <input className="form-control" type="text" id={item?.id} name={item?.id} value={getMonthName(formDetails[item?.id])} disabled={true}></input> : <></>}
                            </>
                        )}
                        {item?.fieldSet?.map((field, fieldIndex) => (
                            <div key={fieldIndex}>
                                {field?.fieldType === 'selectbox' && (
                                    <>
                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                        {Array.isArray(formDetails?.[field?.id]) ? formDetails?.[field?.id]?.map((ele, i) => <><input type={field?.inputType} id={field?.id + '_' + i} defaultValue={ele?.code} data-raw-data={JSON.stringify(ele)} name={ele?.serviceNo} multiple={item?.mode === 'single' ? false : true} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} disabled={true} />{ele?.value}<br /> </>)
                                            : <input className="form-control" type={field?.inputType} defaultValue={formDetails?.[field?.id]} disabled={true} />
                                        }
                                    </>
                                )}
                                {field?.fieldType === 'select' && (
                                    <>
                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                        {field?.id === "year" ? <input className="form-control" type="text" id={field?.id} name={field?.id} value={formDetails[field?.id]} disabled={true}></input> : field?.id === "month" ? <input className="form-control" type="text" id={field?.id} name={field?.id} value={getMonthName(formDetails[field?.id])} disabled={true}></input> : <></>}
                                    </>
                                )}
                                {field?.fieldType === 'datePicker' && (
                                    <div className="form">
                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                        <div className="form-group">
                                            <label htmlFor="apptname" className="filter-form-label control-label">Date Range</label>
                                            {/* {console.log('formDetails?.[field?.id]------------>', formDetails?.[field?.id])} */}

                                            <DateRangePicker
                                                // format="dd-MM-yyyy"
                                                format="yyyy-MM-dd"
                                                character={' to '}
                                                value={[
                                                    "2023-10-01T13:41:29.103Z",
                                                    "2023-11-30T13:41:29.103Z"
                                                ]}
                                                onChange={(e) => handleFormOnChange(e, null, [{ fieldSet: [field] }])} required={field?.required}
                                                placeholder="Select Date Range"
                                                className="z-idx w-100"
                                                placement='bottomEnd'
                                                preventOverflow
                                                disabled={true}
                                            />
                                        </div>
                                    </div>
                                )}
                                {field?.fieldType === 'checkbox' && (
                                    <>
                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                        {formDetails?.[field?.id]?.map((ele, i) => <><input type={field?.inputType} id={field?.id + '_' + i} defaultValue={ele?.code} data-raw-data={JSON.stringify(ele)} name={ele?.serviceNo} placeholder={field.placeHolder} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} disabled={true} />{ele?.value}<br /></>)}
                                    </>
                                )}
                                {field?.fieldType === 'textarea' && (
                                    <>
                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}{field?.Tooltip && <Tooltip>{field?.Tooltip}</Tooltip>}</span>
                                        <textarea id={field.id} defaultValue={formDetails?.[field?.id] || ''} name={field.id} placeholder={field.placeHolder} rows={4} cols={50} disabled={true} onChange={handleFormOnChange} required={field?.required} />
                                    </>
                                )}
                                {field?.fieldType === 'grid' && (
                                    <table className="skel-req-details mt-2">
                                        <thead>
                                            <tr>
                                                {field?.headers.map((header, headerIndex) => (
                                                    <th key={headerIndex}>{header?.title}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {field.columns?.[0]?.column_headers?.map((rows, rowsIndex) => (
                                                <tr key={rowsIndex} id={'r' + rowsIndex}>
                                                    <td key={rowsIndex}>
                                                        <input id={`d_${rows?.id}_` + rowsIndex + '1'} type="text" value={rows?.title + (rows?.required && '*')} disabled={true} />
                                                    </td>
                                                    {
                                                        customElementsRenderer(field?.headers, field?.headers?.length - 1 || 0, rowsIndex, formDetails, { required: rows?.required })
                                                    }
                                                </tr>
                                            ))}
                                            {values?.length > 0 && values?.map((rows, rowsIndex) => (
                                                <tr key={rowsIndex} id={'r' + rowsIndex}>
                                                    {
                                                        customerRowsRenderer(field?.headers || [], rowsIndex, rows, { required: true })
                                                    }
                                                </tr>
                                            ))}
                                            {
                                                field.rows?.length > 0 &&
                                                <tr>
                                                    {(!isButtonHide || !isFormDisabled) && (
                                                        <button type="button" className="skel-btn-submit mt-2 mb-2" disabled={isButtonHide || isFormDisabled} hidden={isButtonHide || isFormDisabled} onClick={() => { handleAddRows(field?.headers) }}>Add Row</button>
                                                    )}
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                )}
                                {field?.fieldType === 'sigature' && (
                                    <React.Fragment>
                                        <label htmlFor="sign" className="control-label">{field?.title}*</label>
                                        {(!isButtonHide || !isFormDisabled) ? (
                                            <div className="form-group text-center">
                                                <div className='form-inline imessage'>
                                                    <SignaturePad
                                                        ref={sigPad}
                                                        disabled={isFormDisabled}
                                                        canvasProps={{
                                                            width: 500,
                                                            height: 100,
                                                            className: "sign-canvas",
                                                        }}
                                                    />
                                                    <span
                                                        // className="btn waves-effect waves-light btn-secondary"
                                                        className='cursor-pointer'
                                                        onClick={clearSignature}
                                                        id="sign-clearBtn"
                                                        style={{ float: 'right' }}
                                                        type="button"
                                                        disabled={isFormDisabled}
                                                        hidden={isButtonHide}>
                                                        Clear Signature
                                                    </span>
                                                    {/* <span className="errormsg"></span> */}
                                                </div>
                                            </div>
                                        ) : (
                                            formDetails?.signature && <img src={formDetails?.signature} alt='signature' />
                                        )}
                                    </React.Fragment>
                                )}

                                {field?.fieldType === 'radio' && (
                                    <>
                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                        <input className="form-control input-sm border" id={field.id} defaultValue={formDetails?.[field?.id]?.[0]?.value || ''} name={field.id} data-raw-data={JSON.stringify(field)} placeholder={field.placeHolder} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes, null, 'radio')} disabled={true} required={field?.required} />
                                    </>
                                )}
                                {field?.fieldType === 'textField' && (
                                    <>
                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                        <input className="form-control input-sm border" id={field.id} defaultValue={formDetails?.[field?.id] || ''} name={field.id} data-raw-data={JSON.stringify(field)} placeholder={field.placeHolder} onChange={(e) => handleFormOnChange(e, null, formAttributes)} disabled={true} required={field?.required} />
                                    </>
                                )}
                            </div>
                        ))}
                    </form>
                </div >
            ) : null
        )
    }

    useEffect(() => {
        let arrData = []
        if (formDetails && isFormDisabled && !!!formDetails?.isFullForm) {
            let keysWithFormAttributes = Object.keys(formDetails).filter(key => key.includes('_formAttributes'));
            let valuesWithFormAttributes = keysWithFormAttributes.map(key => formDetails[key]);
            // let arrData = []
            valuesWithFormAttributes?.map((ele) => {
                arrData.push(ele[0])
            });
            setFormAttributesWithData(arrData);
        }

        if (formDetails?.grid && isFormDisabled && formDetails?.grid.length > 0) {
            if (!!!formDetails?.isFullForm) {
                const outputArray = [];
                for (const key in formDetails?.grid[0]) {
                    if (formDetails?.grid[0].hasOwnProperty(key)) {
                        const newObj = {};
                        newObj['id'] = key;
                        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
                        newObj['title'] = capitalizedKey
                        outputArray.push(newObj);
                    }
                }
                arrData.push([{
                    fieldSet: [
                        {
                            'fieldType': 'grid',
                            headers: outputArray
                        }
                    ]
                }])
            }
            setValues([...formDetails?.grid])

        }
        setFormAttributesWithData(arrData)

    }, [formDetails, isFormDisabled])

    // console.log('formAttributesWithData', formAttributesWithData)


    return (
        <React.Fragment>
            {formAttributesWithData && formAttributesWithData?.length > 0 ? formAttributesWithData?.map((item, index) => {
                return getFormWithData(item?.[0], index);
            })

                : <div className="mt-2" id={'hide' + idx}>
                    {
                        formAttributes?.length > 0 && formAttributes?.map((item, index) => {
                            return (
                                <div key={index}>
                                    <form ref={formRef} onSubmit={(e) => { handleFormSubmit(e, idx) }} id="dynamicForm">
                                        {item?.fieldSet?.map((field, fieldIndex) => (
                                            <div key={fieldIndex}>
                                                {field?.fieldType === 'select_box' && (
                                                    <>
                                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                        <select className="form-control" id={field?.id} multiple={item?.mode === 'single' ? false : true} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} >
                                                            <option value={field?.placeHolder}>{field?.placeHolder}</option>
                                                            {field?.options?.map((ele) => <option
                                                                value={ele?.code}
                                                            >{ele?.value}</option>)}
                                                        </select>
                                                    </>
                                                )}
                                                {field?.fieldType === 'select' && (
                                                    <>
                                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                        <select className="form-control" id={field?.id} multiple={item?.mode === 'single' ? false : true} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} >
                                                            <option value={field?.placeHolder}>{field?.placeHolder}</option>
                                                            {field?.options?.map((ele) => <option
                                                                value={Number(ele?.code)}
                                                            >{ele?.value}</option>)}
                                                        </select>
                                                    </>
                                                )}
                                                {field?.fieldType === 'selectbox' && (
                                                    <>
                                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                        <select className="form-control" id={field?.id} multiple={item?.mode === 'single' ? false : true} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} >
                                                            <option value={field?.placeHolder}>{field?.placeHolder}</option>
                                                            {tagDefaultValues?.map((ele) => <option defaultValue={ele?.code} data-raw-data={JSON.stringify(ele)}>{ele?.description ?? ele?.value}</option>)}
                                                        </select>
                                                    </>
                                                )}
                                                {field?.fieldType === 'checkbox' && (
                                                    <>
                                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                        {tagDefaultValues?.map((ele, i) => <>
                                                            {/* {console.log('formDetails?.[field?.id]?.[i]?.code-------->', formDetails?.[field?.id]?.[i]?.code, '----ele.code------>', ele?.code)}
                                                    {console.log('formDetails?.[field?.id]?.[i]?.code == ele?.code----->', formDetails?.[field?.id]?.[i]?.code == ele?.code)} */}
                                                            <input key={i}
                                                                defaultChecked={formDetails?.[field?.id]?.[i]?.code === ele?.code}
                                                                type={field?.inputType} id={field?.id + '_' + i}
                                                                data-raw-data={JSON.stringify(ele)}
                                                                name={ele?.serviceNo || ele?.value}
                                                                placeholder={field.placeHolder}
                                                                onChange={(e) => handleFormOnChange(e, field?.id, formAttributes, i)}
                                                            />{ele?.value}<br />
                                                        </>)}
                                                    </>
                                                )}
                                                {field?.fieldType === 'textarea' && (
                                                    <>
                                                        <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                        <Tooltip anchorId="confPass" place="top" effect="float">{field?.Tooltip}</Tooltip>
                                                        <textarea disabled={isFormDisabled} id={field.id} defaultValue={formDetails?.[field?.id] || ''} name={field.id} placeholder={field.placeHolder} rows={4} cols={50} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes)} required={field?.required} />
                                                    </>
                                                    // <>
                                                    //     <span className="header-title mb-2 font-weight-bold mt-4 d-block">{field?.title}</span>
                                                    //     <textarea id={field.id} defaultValue={formDetails?.[field?.id] || ''} disabled={isFormDisabled} name={field.id} placeholder={field.placeHolder} rows={4} cols={50} onChange={handleFormOnChange} required={field?.required} />
                                                    // </>
                                                )}
                                                {field?.fieldType === 'grid' && (
                                                    <table className="skel-req-details">
                                                        <thead>
                                                            <tr>
                                                                {field?.headers.map((header, headerIndex) => (
                                                                    <th key={headerIndex}>{header?.title}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {field.columns?.[0]?.column_headers?.map((rows, rowsIndex) => (
                                                                <tr key={rowsIndex} id={'r' + rowsIndex}>
                                                                    <td key={rowsIndex}>
                                                                        <input id={`d_${rows?.id}_` + rowsIndex + '1'} type="text" value={rows?.title + (rows?.required && '*')} disabled={true} />
                                                                    </td>
                                                                    {
                                                                        customElementsRenderer(field?.headers, field?.headers?.length - 1 || 0, rowsIndex, formDetails, { required: rows?.required })
                                                                    }
                                                                </tr>
                                                            ))}
                                                            {values?.length > 0 && values?.map((rows, rowsIndex) => (
                                                                rows?.id === fieldIndex && <tr key={rowsIndex} id={'r' + rowsIndex + rows?.id}>
                                                                    {
                                                                        customerRowsRenderer(field?.headers || [], rowsIndex, rows, { required: true }, fieldIndex)
                                                                    }
                                                                    {(!isButtonHide || !isFormDisabled) && (<i className='fa fa-times' style={{ "fontSize": "28px", "color": "red" }} onClick={() => { handleRemoveRow(rowsIndex) }}></i>)}
                                                                </tr>
                                                            ))}
                                                            {
                                                                field.rows?.length > 0 &&
                                                                <tr>
                                                                    {(!isButtonHide || !isFormDisabled) && (
                                                                        <>
                                                                            <button type="button" className="skel-btn-submit mt-2 mb-2" disabled={isButtonHide || isFormDisabled} hidden={isButtonHide || isFormDisabled} onClick={() => { handleAddRows(field?.headers, fieldIndex) }}>Add Row</button>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                            }
                                                        </tbody>
                                                    </table>
                                                )}

                                                {field?.fieldType === 'sigature' && (
                                                    <React.Fragment>
                                                        <label htmlFor="sign" className="control-label">{field?.title}*</label>
                                                        {(!isButtonHide || !isFormDisabled) ? (
                                                            <div className="form-group text-center">
                                                                <div className='form-inline imessage'>
                                                                    <SignaturePad
                                                                        ref={sigPad}
                                                                        onEnd={() => handleFormOnChange('signature', null, [{ fieldSet: [field] }])}
                                                                        disabled={isFormDisabled}
                                                                        canvasProps={{
                                                                            width: 500,
                                                                            height: 100,
                                                                            className: "sign-canvas",
                                                                        }}
                                                                    />
                                                                    <span
                                                                        // className="btn waves-effect waves-light btn-secondary"
                                                                        className='cursor-pointer'
                                                                        onClick={clearSignature}
                                                                        id="sign-clearBtn"
                                                                        style={{ float: 'right' }}
                                                                        type="button"
                                                                        disabled={isFormDisabled}
                                                                        hidden={isButtonHide}>
                                                                        Clear Signature
                                                                    </span>
                                                                    {/* <span className="errormsg"></span> */}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            formDetails?.signature && <img src={formDetails?.signature} alt='signature' />
                                                        )}
                                                    </React.Fragment>
                                                )}
                                                {field?.fieldType === 'radio' && (
                                                    <>
                                                        <span>{field.title}</span>
                                                        {field?.taskContextPrefix ?
                                                            tagDefaultValues?.map((t, index) => (
                                                                <div className='radio radio-primary m-2'>
                                                                    <input type="radio" id={field?.id + '_' + index} name={field?.id} defaultValue={t?.value} data-raw-data={JSON.stringify(t)} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes, null, 'radio')}></input>
                                                                    <label htmlFor={field?.id + '_' + index}>{t.value}</label>
                                                                    <br></br>
                                                                </div>
                                                            ))
                                                            :
                                                            <>
                                                                < div className='radio radio-primary'>
                                                                    <input type="radio" id={field?.id} name={field?.id} defaultValue={field.title} data-raw-data={JSON.stringify(field)} onChange={(e) => handleFormOnChange(e, field?.id, formAttributes, null, 'radio')}></input>
                                                                    <label htmlFor={field?.id}>{field.title}</label>
                                                                    <br></br>
                                                                </div>
                                                            </>
                                                        }
                                                    </>
                                                )}
                                                {field?.fieldType === 'textField' && (
                                                    <div className="form">
                                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                                        <input className="form-control input-sm border" id={field.id} defaultValue={formDetails?.[field?.id] || ''} name={field.id} data-raw-data={JSON.stringify(field)} placeholder={field.placeHolder} onChange={(e) => handleFormOnChange(e, null, [{ fieldSet: [field] }])} required={field?.required} />
                                                    </div>
                                                )}

                                                {field?.fieldType === 'dateRangePicker' && (
                                                    <div className="form">
                                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                                        <div className="form-group">
                                                            <label htmlFor="apptname" className="filter-form-label control-label">Date Range</label>
                                                            <DateRangePicker
                                                                format="dd-MM-yyyy"
                                                                character={' to '}
                                                                // value={[]}
                                                                onChange={(e) => handleFormOnChange(e, null, [{ fieldSet: [field] }])} required={field?.required}
                                                                placeholder="Select Date Range"
                                                                className="z-idx w-100"
                                                                placement='bottomEnd'
                                                                preventOverflow
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {field?.fieldType === 'datePicker' && (
                                                    <div className="form">
                                                        <label className="header-title mb-2 d-block">{field?.title}</label>
                                                        <div className="form-group">
                                                            <label htmlFor="apptname" className="filter-form-label control-label">Date Range</label>
                                                            <DatePicker
                                                                format="dd-MM-yyyy"
                                                                character={' to '}
                                                                // value={[]}
                                                                // onChange={(e) => handleFormOnChange(e, null, [{ fieldSet: [field] }])} 
                                                                required={field?.required}
                                                                onChange={(dateTime) => {
                                                                    dateTime = dateTime ? moment(dateTime).format('YYYY-MM-DD hh:mm a') : null;
                                                                    handleFormOnChange(index, "dateTime", dateTime ? new Date(dateTime) : '');
                                                                }}
                                                                placeholder="Select Date Range"
                                                                className="z-idx w-100"
                                                                placement='bottomEnd'
                                                                preventOverflow
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {((field?.fieldType === 'button' || field?.fieldType === 'custom_button') && !field?.group) && (
                                                    <div className='text-center mt-2'>
                                                        {(!isButtonHide || !isFormDisabled) && (
                                                            <button className="skel-btn-submit" id={field.id} type="submit" disabled={isButtonHide || isFormDisabled} hidden={isButtonHide || isFormDisabled}>{field?.title}</button>
                                                        )}
                                                    </div>
                                                )}
                                                {((field?.fieldType === 'button' || field?.fieldType === 'custom_button') && field?.group) && (
                                                    <div className="row">
                                                        {field.groupButton.map((btn, index) => (
                                                            btn.inputType === 'button'
                                                                ? <div className='text-center mt-2'>
                                                                    <button className="skel-btn-submit" id={btn.id} type={field.inputType} disabled={isButtonHide || isFormDisabled} hidden={isButtonHide || isFormDisabled} onClick={() => { clickToProceed('FORM_SUBMIT', 'cancel', { data: {} }, idx, { grid: [...values], ...formDetails }) }}>{btn?.title}</button>
                                                                </div>
                                                                : <div className='text-center mt-2'>
                                                                    <button className="skel-btn-submit" id={btn.id} type={field.inputType} disabled={isButtonHide || isFormDisabled} hidden={isButtonHide || isFormDisabled}>{btn?.title}</button>
                                                                </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </form>
                                </div >
                            )
                        })
                    }
                </div >}

        </React.Fragment >
    )

}

export default DynamicForm;