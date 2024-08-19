import React, { useCallback, useEffect, useRef, useState } from "react";
import { DatalistInput, useComboboxControls } from "react-datalist-input";
import { unstable_batchedUpdates } from "react-dom";
import { slowGet } from "../../common/util/restUtil";
import { properties } from "../../properties";
import FileUpload from "../../common/uploadAttachment/fileUpload";


const CreateHelpdeskForm = (props) => {
    const { profileDetails, helpdeskData, error, readOnly, currentFiles, ivrNo, smartAssistance, helpdeskTypeLookUp, serviceCategoryLookup, severityLookUp, projectLookup } = props.data;
    const { setHelpdeskData, handleClear, handleSubmit, setError, setCurrentFiles, handleOnChange } = props.stateHandler;

 

    const formRef = useRef();
    const [items, setItems] = useState([]);
    const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
        isExpanded: false,
    });

    useEffect(() => {
        if (!helpdeskData?.helpdeskSubject || helpdeskData?.helpdeskSubject === "") {
            // if (formRef.current) { formRef.current.reset(); }
            setValue();
        }
    }, [helpdeskData, setValue])

    const getStatement = useCallback(() => {
        slowGet(`${properties.HELPDESK_API}/get-helpdesk-statements`).then((resp) => {
            if (resp?.data?.rows) {
                const arr = resp?.data?.rows?.map((i) => ({
                    id: i.helpdeskStatementId, value: i.helpdeskStatement, ...i,
                }))
                unstable_batchedUpdates(() => {
                    setItems(arr);
                })
            }
        }).catch((error) => {
            console.error(error);
        });
    }, [])

    useEffect(() => {
        getStatement()
    }, [getStatement])

    const handleKnowledgeSelect = (item) => {
        let customerName = `${profileDetails?.firstName ?? ''} ${profileDetails?.lastName ?? ''}`?.trim();
        let contact = profileDetails?.profileContact?.find(x => x.isPrimary);
        let payload = {
            ...helpdeskData,
            helpdeskSubject: item?.helpdeskStatement ?? '',
            serviceCategory: item?.serviceCategory ?? '',
            helpdeskType: item?.helpdeskType ?? '',
            mailId: contact?.emailId,
            phoneNo: contact?.mobileNo,
            contactId: contact?.contactId ?? null,
            userCategory: contact?.contactCategory?.code ?? null,
            userCategoryValue: contact?.contactCategoryValue ?? null,
            userName: customerName,
            project: item?.project ?? null,
            severity: item?.sevearity ?? null,
            // priority: item.priority ?? null,
        }

        setHelpdeskData({ ...payload });
        setError({ ...error, project: "", severity: "", helpdeskType: "", helpdeskSubject: '' })
    }

    Object.byString = function (o, s) {
        s = s?.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
        s = s?.replace(/^\./, '');           // strip a leading dot
        var a = s?.split('.');
        for (var i = 0, n = a?.length; i < n; ++i) {
            var k = a?.[i];
            if (k in o) {
                o = o?.[k];
            } else {
                return;
            }
        }
        return o;
    }

    const getValue = (valuePath) => {
        let item = items.find(x => x?.helpdeskStatement === helpdeskData?.helpdeskSubject);
        return item ? Object.byString(item, valuePath) : '';
    }

    return (
        <div className="block-section">
            <form ref={formRef}>
                <fieldset className="scheduler-border">
                    <div className="form-row">
                        {<div className="col-12 mt-2">
                            <div className={`skel-inter-search-st ${error.helpdeskSubject && "error-border"}`}>
                                {smartAssistance ? <> <i className="fa fa-search"></i>
                                    <DatalistInput
                                        className=""
                                        ref={formRef}
                                        isExpanded={isExpanded}
                                        setIsExpanded={setIsExpanded}
                                        value={value}
                                        setValue={setValue}
                                        inputProps={{
                                            'auto-complete': "new-password",
                                            id: "knowledgeBase",
                                            name: "knowledgeBase",
                                        }}
                                        onSelect={(item) => {
                                            setValue(item.value);
                                            handleKnowledgeSelect(item);
                                        }}
                                        onChange={(e) => {
                                            if (e.target.value === "") {
                                                handleClear();
                                            }
                                        }}
                                        label={false}
                                        items={items}
                                        placeholder="Type to search..."
                                    /></> :


                                    <div className="form-group">
                                        <i className="fa fa-envelope-o" aria-hidden="true"></i>
                                        <input className="react-datalist-input__textbox" type="text" id='helpdeskSubject' placeholder="Type subject here ..." onChange={handleOnChange}></input>
                                    </div>
                                }
                                <span className="errormsg">
                                    {error.helpdeskSubject ? error.helpdeskSubject : ""}
                                </span>
                            </div>
                        </div>}
                        <div className="col-12 mt-3">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="helpdeskResolution" className="control-label">
                                            Helpdesk Solution
                                        </label>
                                        <span style={{ whiteSpace: 'pre-wrap' }}>{getValue('helpdeskResolution')}</span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="serviceCategory" className="control-label">
                                            Service Category
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="serviceCategory" value={helpdeskData?.serviceCategory ?? ''} onChange={handleOnChange}>
                                            <option value="" key='selectCat'>Select</option>
                                            {
                                                serviceCategoryLookup && serviceCategoryLookup.map((e) => (
                                                    <option value={e.code} data-entity={JSON.stringify(e)} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.serviceCategory ? error.serviceCategory : ""}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="helpdeskType" className="control-label">
                                            Helpdesk Type
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="helpdeskType" value={helpdeskData?.helpdeskType ?? ''} onChange={handleOnChange}>
                                            <option value="" key='selectCat'>Select</option>
                                            {
                                                helpdeskTypeLookUp && helpdeskTypeLookUp.map((e) => (
                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.helpdeskType ? error.helpdeskType : ""}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label htmlFor="severity" className="control-label">
                                            Severity
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="severity" value={helpdeskData?.severity ?? ''} onChange={handleOnChange}>
                                            <option value="" key='severity'>Select</option>
                                            {
                                                severityLookUp && severityLookUp.map((e) => (
                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.severity ? error.severity : ""}
                                        </span>
                                    </div>
                                </div>
                                {/* <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="priority" className="control-label">
                                            Priority
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <input id="priority" className="form-control" value={
                                            getValue('priorityCodeDesc.description')
                                        } disabled={true} type="text" />
                                        <span className="errormsg">
                                            {error.priority ? error.priority : ""}
                                        </span>
                                    </div>
                                </div> */}
                                {/* <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="project" className="control-label">
                                            Project
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="project" value={helpdeskData?.project ?? ''} onChange={handleOnChange}>
                                            <option value="" key='selectCat'>Select</option>
                                            {
                                                projectLookup && projectLookup.map((e) => (
                                                    <option value={e.code} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.project ? error.project : ""}
                                        </span>
                                    </div>
                                </div> */}
                                
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label htmlFor="remarks" className="control-label">
                                            Remarks{" "}
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <textarea
                                            value={helpdeskData?.content ?? ''}
                                            className={`form-control ${error.content && "error-border"}`}
                                            id="content"
                                            name="content"
                                            rows="4"
                                            maxLength="2500"
                                            placeholder="Enter Remarks"
                                            onChange={(e) => { setHelpdeskData({ ...helpdeskData, content: e?.target?.value }); setError({ ...error, content: '' }) }}
                                        />
                                        <span>Maximum 2500 characters</span>
                                        <span className="errormsg">
                                            {error.content && error.content}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <FileUpload
                                        data={{
                                            currentFiles,
                                            entityType: "HELPDESK",
                                            shouldGetExistingFiles: false,
                                            permission: false,
                                            existingFiles: []
                                        }}
                                        handlers={{
                                            setCurrentFiles,
                                        }}
                                    />
                                </div>

                            </div>
                            <div className="skel-btn-center-cmmn">
                                <button type="button" className={`skel-btn-cancel ${readOnly ? 'disabled' : ''}`} disabled={readOnly} onClick={handleClear}>Clear</button>
                                <button type="button" className={`skel-btn-submit ${readOnly ? 'disabled' : ''}`} disabled={readOnly} onClick={handleSubmit} >Create</button>
                            </div>
                        </div>

                    </div>
                </fieldset>
            </form>
        </div>
    );
};

export default CreateHelpdeskForm;
