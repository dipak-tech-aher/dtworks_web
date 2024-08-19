import { useContext, useEffect } from "react"
import { unstable_batchedUpdates } from "react-dom"
import ReactSelect from "react-select"
import { AppContext } from "../../AppContext"
import { Tooltip } from "react-tooltip";
import { toast } from "react-toastify";
import { isEmpty } from "ol/extent";

const Alerts = () => {
    const { data, handlers, refs } = useContext(AppContext)
    const { formErrors,
        slaData,
        daysLookUp,
        hoursLookUp,
        minuteLookUp,
        frequencyTypeLookUp,
        alertTypeLookUp,
        notifyToLookUp,
        notifyTypeLookUp,
        alertList,
        smsTemplateList,
        emailTemplateList,
        alertComponentPermission,
        isDisabled,
        action,
        deleteRowAlerts
    } = data
    const { setAlertList, setSlaData, setAlertComponentPermission, handleAddAlert, setFormErrors, setDeleteRowAlerts } = handlers
    const { inputRef } = refs

    useEffect(() => {
        setAlertComponentPermission({
            isNotifyOthers: alertList?.notifyTo === 'NT_OTHERS',
            isNotifyEmail: ['NTY_BOTH', 'NTY_EMAIL'].includes(alertList?.notifyType),
            isNotifySMS: ['NTY_BOTH', 'NTY_SMS'].includes(alertList?.notifyType),
            isRecurringFrequency: ['FT_RECURRING'].includes(alertList?.alertInterval)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alertList?.alertInterval, alertList?.notifyTo, alertList?.notifyType])

    const handleAlertOnChange = (e) => {
        const { id, value } = e.target
        unstable_batchedUpdates(() => {
            setFormErrors({ ...formErrors, [id]: '' })
            setAlertList({
                ...alertList,
                [id]: value
            })
        })
    }

    const alertRowAction = (e, rowObj, rowAction, instantDelete = false) => {
        if (e) e.preventDefault();
        if (isEmpty(rowObj) || !rowObj?.value || !rowObj?.key) {
            toast.warn('Please provide correct ')
            return false
        }
        let updatedAlerts;
        switch (rowAction) {
            case 'DONE':
                updatedAlerts = slaData.alerts.map(item =>
                    item[rowObj.key] === rowObj.value ? { ...item, isEdit: false } : item
                );
                break;
            case 'EDIT':
                updatedAlerts = slaData.alerts.map(item =>
                    item[rowObj.key] === rowObj.value ? { ...item, isEdit: true } : item
                );
                break;
            case 'DELETE':
                if (instantDelete) {
                    updatedAlerts = slaData.alerts.filter(item => item[rowObj.key] !== rowObj.value)
                } else {
                    const selectedAlerts = slaData.alerts.filter(item => item[rowObj.key] === rowObj.value)
                    updatedAlerts = slaData.alerts.filter(item => item[rowObj.key] !== rowObj.value)
                    setDeleteRowAlerts([...deleteRowAlerts, ...selectedAlerts])
                }
                break;
            case 'CLOSE':
                const selectedRow = inputRef.current.alerts.filter(item => item[rowObj.key] === rowObj.value)
                updatedAlerts = slaData.alerts.map(item =>
                    item[rowObj.key] === rowObj.value ? { ...selectedRow?.[0], isEdit: false } : item
                );
                break
            default:
                toast.warn('Row Action Type not mentioned');
                return false;
        }

        unstable_batchedUpdates(() => {
            setSlaData(prevStatus => ({ ...prevStatus, alerts: updatedAlerts ?? prevStatus.alerts }))
        });
    }

    // const handleAlertRowOnChange = (e, rowObj) => {
    //     const { id, value } = e.target
    //     let updatedAlerts
    //     if (id === 'alertFrequency') {
    //         updatedAlerts = slaData?.alerts?.map(item =>
    //             item[rowObj.key] === rowObj.value ? { ...item, [id]: value, alertRecurring: null } : item
    //         )
    //     } else if (id === 'notifyTo') {
    //         updatedAlerts = slaData?.alerts?.map(item =>
    //             item[rowObj.key] === rowObj.value ? { ...item, [id]: value, emailOthers: '', mobileOthers: '' } : item
    //         )
    //     } else if (id === 'notifyType') {
    //         updatedAlerts = slaData?.alerts?.map(item =>
    //             item[rowObj.key] === rowObj.value ? { ...item, [id]: value, mailTemplateId: null, smsTemplateId: null } : item
    //         )
    //     } else {
    //         updatedAlerts = slaData?.alerts?.map(item =>
    //             item[rowObj.key] === rowObj.value ? { ...item, [id]: value } : item
    //         )
    //     }
    //     unstable_batchedUpdates(() => {
    //         setSlaData(prevStatus => ({ ...prevStatus, alerts: updatedAlerts ?? prevStatus.alerts }))
    //     })
    // }

    const handleAlertRowOnChange = (e, rowObj) => {
        const { id, value } = e.target;

        const updateAlertRow = (alert) => {
            if (alert[rowObj.key] === rowObj.value) {
                switch (id) {
                    case 'alertFrequency':
                        return { ...alert, alertFrequency: value, alertRecurring: null };
                    case 'notifyTo':
                        return { ...alert, notifyTo: value, emailOthers: '', mobileOthers: '' };
                    case 'notifyType':
                        return { ...alert, notifyType: value, mailTemplateId: null, smsTemplateId: null };
                    default:
                        return { ...alert, [id]: value };
                }
            }
            return alert;
        };

        const updatedAlerts = slaData?.alerts?.map(updateAlertRow);

        setSlaData((prevStatus) => ({
            ...prevStatus,
            alerts: updatedAlerts ?? prevStatus.alerts,
        }))
    }

    return (
        <div>
            <div className="col-12">
                <h5>Alerts</h5>
            </div>
            {!!!isDisabled && <div className="row">

                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="alertType" className="control-label">
                            Type
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='alertType'
                            placeholder="Choose Type"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={alertTypeLookUp?.map((x) => ({ label: x.description, value: x.code }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'alertType', value: selected.value } })
                            }}
                            value={alertTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.alertType) || []}
                        />
                        {formErrors?.alertType && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertType}</span>
                        )}
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="alertDays" className="control-label">
                            Days
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='alertDays'
                            placeholder="Choose Days"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={daysLookUp}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'alertDays', value: selected.value } })
                            }}
                            value={daysLookUp?.find(x => x.value === alertList?.alertDays) || []}
                        />
                        {formErrors?.alertDays && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertDays}</span>
                        )}
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="alertHours" className="control-label">
                            Hours
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='alertHours'
                            placeholder="Choose Hours"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={hoursLookUp}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'alertHours', value: selected.value } })
                            }}
                            value={hoursLookUp?.find(x => x.value === alertList?.alertHours) || []}
                        />
                        {formErrors?.alertHours && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertHours}</span>
                        )}
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="alertMinutes" className="control-label">
                            Minutes
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='alertMinutes'
                            placeholder="Choose Minutes"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={minuteLookUp}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'alertMinutes', value: selected.value } })
                            }}
                            value={minuteLookUp?.find(x => x.value === alertList?.alertMinutes) || []}
                        />
                        {formErrors?.alertMinutes && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertMinutes}</span>
                        )}
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="alertFrequency" className="control-label">
                            Frequency
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='alertFrequency'
                            placeholder="Choose Frequency"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={frequencyTypeLookUp?.map((x) => ({ label: x.description, value: x.code }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'alertFrequency', value: selected.value } })
                            }}
                            value={frequencyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.alertFrequency) || []}
                        />
                        {formErrors?.alertFrequency && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertFrequency}</span>
                        )}
                    </div>
                </div>
                {alertComponentPermission?.isRecurringFrequency && <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="alertRecurring" className="control-label">
                            No.of Recurring
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <input
                            className="form-control"
                            id="alertRecurring"
                            type="number"
                            min={1}
                            max={20}
                            disabled={isDisabled}
                            maxLength={2}
                            value={alertList?.alertRecurring ?? ""}
                            onChange={handleAlertOnChange}
                        />
                        {formErrors?.alertRecurring && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.alertRecurring}</span>
                        )}
                    </div>
                </div>}
                {/* Notify */}
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="durationMinutes" className="control-label">
                            Notify To
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='notifyTo'
                            placeholder="Choose Notify To"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={notifyToLookUp.map((x) => ({ label: x.description, value: x.code }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'notifyTo', value: selected.value } })
                            }}
                            value={notifyToLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.notifyTo) || []}
                        />
                        {formErrors?.notifyTo && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.notifyTo}</span>
                        )}
                    </div>
                </div>
                {alertComponentPermission?.isNotifyOthers && <div className="col-md-3">
                    <div className="form-group">
                        <span className="float-right ">
                            <svg data-tip id="emailOthers" data-htmlFor="emailOthers" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-alert-octagon icon-dual">
                                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                                <line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </span>
                        <label className="control-label" >Email - Others &nbsp;<span className="text-danger font-20 pl-1 fld-imp">*</span></label>

                        <Tooltip anchorId="emailOthers" place="top" effect="float" textColor="white">
                            Hint for Multiple Emails<hr /><br></br>
                            Multiple Email address separated by ;<br></br>
                            Example: abc@xyz.com;def@qws.com<br></br>
                        </Tooltip>
                        <textarea type="text"
                            id="emailOthers"
                            name="emailOthers"
                            className="form-control"
                            value={alertList?.emailOthers ?? ''}
                            onChange={handleAlertOnChange} />
                        {formErrors?.emailOthers && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.emailOthers}</span>
                        )}
                    </div>
                </div>}
                {alertComponentPermission?.isNotifyOthers && <div className="col-md-3" >
                    <div className="form-group">
                        <span className="float-right ">
                            <svg data-tip id="mobileOthers" data-htmlFor="mobileOthers" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-alert-octagon icon-dual">
                                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                                <line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </span>
                        <label className="control-label" >Mobile - Others &nbsp;<span className="text-danger font-20 pl-1 fld-imp">*</span></label>

                        <Tooltip anchorId="mobileOthers" place="top" effect="float" textColor="white">
                            Hint for Mobile Number<hr /><br></br>
                            Mobile Number must be with Prefix <br></br>
                            Multiple Mobile Number separated by ;<br></br>
                            Example: 91xxxx;673xxxx<br></br>
                        </Tooltip>
                        <textarea type="text"
                            id="mobileOthers"
                            name="mobileOthers"
                            className="form-control"
                            value={alertList?.mobileOthers ?? ''}
                            onChange={handleAlertOnChange} />
                        {formErrors?.mobileOthers && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.mobileOthers}</span>
                        )}
                    </div>
                </div>}
                <div className="col-md-2">
                    <div className="form-group">
                        <label htmlFor="notifyType" className="control-label">
                            Notify Type
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='notifyType'
                            placeholder="Choose Notify Type"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={notifyTypeLookUp.map((x) => ({ label: x.description, value: x.code }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'notifyType', value: selected.value } })
                            }}
                            value={notifyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.notifyType) || []}
                        />
                        {formErrors?.notifyType && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.notifyType}</span>
                        )}
                    </div>
                </div>
                {alertComponentPermission?.isNotifyEmail && <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="mailTemplateId" className="control-label">
                            Email Template
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='mailTemplateId'
                            placeholder="Choose Email Template"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={emailTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'mailTemplateId', value: selected.value } })
                            }}
                            value={emailTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.mailTemplateId) || []}
                        />
                        {formErrors?.mailTemplateId && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.mailTemplateId}</span>
                        )}
                    </div>
                </div>}
                {alertComponentPermission?.isNotifySMS && <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="smsTemplateId" className="control-label">
                            SMS Template
                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                        </label>
                        <ReactSelect
                            id='smsTemplateId'
                            placeholder="Choose SMS Template"
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                            options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                            onChange={(selected) => {
                                handleAlertOnChange({ target: { id: 'smsTemplateId', value: selected.value } })
                            }}
                            value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.smsTemplateId) || []}
                        />
                        {formErrors?.smsTemplateId && (
                            <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.smsTemplateId}</span>
                        )}
                    </div>
                </div>}
                <div className="d-flex w-100 m-2">
                    <button style={{ color: 'red' }} onClick={(e) => { e.preventDefault(); setAlertList({}); setFormErrors({}) }} className="skel-btn-cancel">
                        <i className="material-icons">clear_all</i> Clear
                    </button>
                    <button onClick={handleAddAlert} className="skel-btn-submit" >
                        <i className="material-icons">add</i>Add Alert
                    </button>
                </div>
            </div>}
            <div className="col-12" style={{ overflowX: 'scroll' }}>
                <table id="alert-table" className="table table-bordered table-striped mt-2">
                    <tbody>
                        <tr>
                            <td>S.No</td>
                            {!!!isDisabled && <td></td>}
                            <td>Type</td>
                            <td>Days</td>
                            <td>Hours</td>
                            <td>Minutes</td>
                            <td>Frequency</td>
                            <td>No.of Recurring</td>
                            <td>Notify To</td>
                            <td>Notify Type</td>
                            <td>Email - Others</td>
                            <td>Mobile - Others</td>
                            <td>Email Template</td>
                            <td>SMS Template</td>

                        </tr>
                        {slaData?.alerts?.length > 0 ? slaData?.alerts?.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <p>{index + 1}</p>
                                </td>
                                {!!!action.isView && <td>
                                    <>
                                        {action?.isEdit && item?.isEdit && <button onClick={(e) => alertRowAction(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }, 'DONE')} className="btn btn-success btn-sm mx-1">
                                            <i className="material-icons">done</i>
                                        </button>}
                                        {action?.isEdit && item?.isEdit && <button onClick={(e) => alertRowAction(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }, 'CLOSE')} className="btn btn-info btn-sm mx-1">
                                            <i className="material-icons">close</i>
                                        </button>}
                                        {action?.isEdit && !item?.isEdit && <button onClick={(e) => alertRowAction(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }, 'EDIT')} className="btn btn-warning btn-sm mx-1">
                                            <i className="material-icons">edit</i>
                                        </button>}
                                        <button onClick={(e) => alertRowAction(e, item?.alertUuid ? { key: 'alertUuid', value: item?.alertUuid } : { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }, 'DELETE', item?.alertUuid)} className="btn btn-danger btn-sm mx-1">
                                            <i className="material-icons">delete</i>
                                        </button>
                                        {formErrors?.[`alerts[${index}].isEdit`] && (
                                            <span className="text-danger font-20 pl-1 fld-imp">Please Complete the</span>
                                        )}
                                    </>
                                </td>}
                                <td>
                                    <ReactSelect
                                        id='alertType'
                                        placeholder="Choose Type"
                                        isDisabled={!item?.isEdit}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={alertTypeLookUp?.map((x) => ({ label: x.description, value: x.code }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'alertType', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={alertTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === item?.alertType) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].alertType`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertType`]}</span>
                                    )}                                </td>
                                <td>
                                    <ReactSelect
                                        id='alertDays'
                                        placeholder="Choose Days"
                                        menuPortalTarget={document.body}
                                        isDisabled={!item?.isEdit}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={daysLookUp}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'alertDays', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={daysLookUp?.find(x => x.value === item?.alertDays) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].alertDays`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertDays`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='alertHours'
                                        placeholder="Choose Hours"
                                        menuPortalTarget={document.body}
                                        isDisabled={!item?.isEdit}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={hoursLookUp}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'alertHours', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={hoursLookUp?.find(x => x.value === item?.alertHours) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].alertHours`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertHours`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='alertMinutes'
                                        placeholder="Choose Minutes"
                                        isDisabled={!item?.isEdit}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={minuteLookUp}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'alertMinutes', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={minuteLookUp?.find(x => x.value === item?.alertMinutes) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].alertMinutes`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertMinutes`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='alertFrequency'
                                        placeholder="Choose Frequency"
                                        isDisabled={!item?.isEdit}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={frequencyTypeLookUp?.map((x) => ({ label: x.description, value: x.code }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'alertFrequency', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={frequencyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === item?.alertFrequency) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].alertFrequency`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertFrequency`]}</span>
                                    )}
                                </td>
                                <td>
                                    <input
                                        className="form-control"
                                        id="alertRecurring"
                                        type="number"
                                        disabled={(['FT_SINGLE'].includes(item?.alertFrequency) || !item?.isEdit)}
                                        min={1}
                                        max={20}
                                        style={{ width: 'max-content' }}
                                        maxLength={2}
                                        value={item?.alertRecurring ?? ""}
                                        onChange={(e) => { handleAlertRowOnChange(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }) }}
                                    />
                                    {formErrors?.[`alerts[${index}].alertRecurring`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].alertRecurring`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='notifyTo'
                                        placeholder="Choose Notify To"
                                        menuPortalTarget={document.body}
                                        isDisabled={!item?.isEdit}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={notifyToLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'notifyTo', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={notifyToLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === item?.notifyTo) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].notifyTo`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].notifyTo`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='notifyType'
                                        placeholder="Choose Notify Type"
                                        isDisabled={!item?.isEdit}
                                        menuPortalTarget={document.body}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={notifyTypeLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'notifyType', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={notifyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === item?.notifyType) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].notifyType`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].notifyType`]}</span>
                                    )}
                                </td>
                                <td>
                                    <textarea type="text"
                                        id="emailOthers"
                                        name="emailOthers"
                                        disabled={!(item?.isEdit && ['NT_OTHERS'].includes(item?.notifyTo))}
                                        className="form-control"
                                        style={{ width: 'max-content' }}
                                        value={item?.emailOthers ?? ''}
                                        onChange={(e) => { handleAlertRowOnChange(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }) }}
                                    />
                                    {formErrors?.[`alerts[${index}].emailOthers`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].emailOthers`]}</span>
                                    )}
                                </td>
                                <td>
                                    <textarea type="text"
                                        id="mobileOthers"
                                        name="mobileOthers"
                                        disabled={!(item?.isEdit && ['NT_OTHERS'].includes(item?.notifyTo))}
                                        className="form-control"
                                        style={{ width: 'max-content' }}
                                        value={item?.mobileOthers ?? ''}
                                        onChange={(e) => { handleAlertRowOnChange(e, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid }) }}
                                    />
                                    {formErrors?.[`alerts[${index}].mobileOthers`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].mobileOthers`]}</span>
                                    )}
                                </td>
                                <td>
                                    <ReactSelect
                                        id='mailTemplateId'
                                        placeholder="Choose Email Template"
                                        menuPortalTarget={document.body}
                                        isDisabled={!(['NTY_BOTH', 'NTY_EMAIL'].includes(item?.notifyType) && item.isEdit)}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={emailTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'mailTemplateId', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={emailTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === item?.mailTemplateId) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].mailTemplateId`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].mailTemplateId`]}</span>
                                    )}
                                </td>

                                <td>
                                    <ReactSelect
                                        id='smsTemplateId'
                                        placeholder="Choose SMS Template"
                                        menuPortalTarget={document.body}
                                        isDisabled={!(item?.isEdit && ['NTY_BOTH', 'NTY_SMS'].includes(item?.notifyType))}
                                        styles={{
                                            menuPortal: base => ({ ...base, zIndex: 999999 }),
                                            control: (baseStyles, state) => ({
                                                ...baseStyles,
                                                width: 'max-content'
                                            })
                                        }}
                                        options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                        onChange={(selected) => {
                                            handleAlertRowOnChange({ target: { id: 'smsTemplateId', value: selected.value } }, { key: 'slaAlertListUuid', value: item?.slaAlertListUuid })
                                        }}
                                        value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === item?.smsTemplateId) || []}
                                    />
                                    {formErrors?.[`alerts[${index}].smsTemplateId`] && (
                                        <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.[`alerts[${index}].smsTemplateId`]}</span>
                                    )}
                                </td>
                            </tr>
                        )) : <tr><td colSpan={13}><span className="skel-widget-warning">No Alert Details</span></td></tr>}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
export default Alerts