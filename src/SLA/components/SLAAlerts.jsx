import { useContext, useEffect, useState } from "react"
import ReactSelect from "react-select"
import { AppContext } from "../../AppContext"

const SLAAlerts = (props) => {
    const { data, handlers, refs } = useContext(AppContext)
    const {
        slaData,
        daysLookUp,
        hoursLookUp,
        minuteLookUp,
        frequencyTypeLookUp,
        alertTypeLookUp,
        notifyToLookUp,
        notifyTypeLookUp,
        // alertList,
        smsTemplateList,
        emailTemplateList,
        isDisabled,
        action,
        deleteRowAlerts,
        whatsappTemplateId
    } = data
    const { setSlaData, handleAddAlert, setDeleteRowAlerts } = handlers
    const { alertComponentPermission, alertList, formErrors } = props?.data
    const { setAlertComponentPermission, setAlertList, setFormErrors } = props?.handlers
    const { inputRef } = refs
    const handleAlertOnChange = (e, type) => {
        const { id, value } = e.target
        setAlertList({
            ...alertList,
            [type]: {
                ...(alertList[type] || {}),
                [id]: value
            }
        })
    }

    useEffect(() => {
        setAlertComponentPermission({
            ...alertComponentPermission,
            preBeach: {
                ...alertComponentPermission.preBeach,
                isNotifyOthers: alertList?.preBeach?.notifyTo === 'NT_OTHERS',
                isNotifyEmail: ['NTY_BOTH', 'NTY_EMAIL'].includes(alertList?.preBeach?.notifyType),
                isNotifySMS: ['NTY_BOTH', 'NTY_SMS'].includes(alertList?.preBeach?.notifyType),
                isRecurringFrequency: ['FT_RECURRING'].includes(alertList?.preBeach?.alertInterval),
                isNotifyWhatsapp: ['NTY_BOTH', 'NTY_WHATSAPP'].includes(alertList?.preBeach?.notifyType)
            },
            onBreach: {
                ...alertComponentPermission.onBreach,
                isNotifyOthers: alertList?.onBreach?.notifyTo === 'NT_OTHERS',
                isNotifyEmail: ['NTY_BOTH', 'NTY_EMAIL'].includes(alertList?.onBreach?.notifyType),
                isNotifySMS: ['NTY_BOTH', 'NTY_SMS'].includes(alertList?.onBreach?.notifyType),
                isRecurringFrequency: ['FT_RECURRING'].includes(alertList?.onBreach?.alertInterval),
                isNotifyWhatsapp: ['NTY_BOTH', 'NTY_WHATSAPP'].includes(alertList?.onBreach?.notifyType)
            },
            postBeach: {
                ...alertComponentPermission.postBeach,
                isNotifyOthers: alertList?.postBeach?.notifyTo === 'NT_OTHERS',
                isNotifyEmail: ['NTY_BOTH', 'NTY_EMAIL'].includes(alertList?.postBeach?.notifyType),
                isNotifySMS: ['NTY_BOTH', 'NTY_SMS'].includes(alertList?.postBeach?.notifyType),
                isRecurringFrequency: ['FT_RECURRING'].includes(alertList?.postBeach?.alertInterval),
                isNotifyWhatsapp: ['NTY_BOTH', 'NTY_WHATSAPP'].includes(alertList?.postBeach?.notifyType)
            }
        })
    }, [alertList])

    return (
        <>
            <div>
                <div className="col-12">
                    <h5>Pre Breach</h5>
                </div>
                <div className="row">
                    <div className="col-md-2">
                        <div className="form-group">
                            <label htmlFor="alertDays" className="control-label">
                                Days
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='alertDays'
                                placeholder="Choose Days"
                                isDisabled={isDisabled}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={daysLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertDays', value: selected.value } }, 'preBeach')
                                }}
                                value={daysLookUp?.find(x => x.value === alertList?.preBeach?.alertDays) || []}
                            />
                            {formErrors?.['preBeach.alertDays'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.alertDays']}</span>
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
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={hoursLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertHours', value: selected.value } }, 'preBeach')
                                }}
                                value={hoursLookUp?.find(x => x.value === alertList?.preBeach?.alertHours) || []}
                            />
                            {formErrors?.['preBeach.alertHours'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.alertHours']}</span>
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
                                isDisabled={isDisabled}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={minuteLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertMinutes', value: selected.value } }, 'preBeach')
                                }}
                                value={minuteLookUp?.find(x => x.value === alertList?.preBeach?.alertMinutes) || []}
                            />
                            {formErrors?.['preBeach.alertMinutes'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.alertMinutes']}</span>
                            )}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="durationMinutes" className="control-label">
                                Alert To
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyTo'
                                placeholder="Choose Notify To"
                                isDisabled={isDisabled}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyToLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyTo', value: selected.value } }, 'preBeach')
                                }}
                                value={notifyToLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.preBeach?.notifyTo) || []}
                            />
                            {formErrors?.['preBeach.notifyTo'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.notifyTo']}</span>
                            )}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="notifyType" className="control-label">
                                Alert Channel
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyType'
                                placeholder="Choose Notify Type"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyTypeLookUp?.filter(e => e?.mapping?.alert?.includes('AT_PRE_BRCH'))?.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyType', value: selected.value } }, 'preBeach')
                                }}
                                value={notifyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.preBeach?.notifyType) || []}
                            />
                            {formErrors?.['preBeach.notifyType'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.notifyType']}</span>
                            )}
                        </div>
                    </div>
                    {/* alertComponentPermission?.isNotifyEmail && */}
                    {alertComponentPermission?.preBeach?.isNotifyEmail && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="mailTemplateId" className="control-label">
                                Email Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='mailTemplateId'
                                placeholder="Choose Email Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={emailTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'mailTemplateId', value: selected.value } }, 'preBeach')
                                }}
                                value={emailTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.preBeach?.mailTemplateId) || []}
                            />
                            {formErrors?.['preBeach.mailTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.mailTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {/*  */}
                    {alertComponentPermission?.preBeach?.isNotifySMS && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                SMS Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='smsTemplateId'
                                placeholder="Choose SMS Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'smsTemplateId', value: selected.value } }, 'preBeach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.preBeach?.smsTemplateId) || []}
                            />
                            {formErrors?.['preBeach.smsTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.smsTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {alertComponentPermission?.preBeach?.isNotifyWhatsapp && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                Whatsapp Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='whatsappTemplateId'
                                placeholder="Choose Whatsapp Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'whatsappTemplateId', value: selected.value } }, 'preBeach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.preBeach?.whatsappTemplateId) || []}
                            />
                            {formErrors?.['preBeach.whatsappTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['preBeach.whatsappTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
            <hr></hr>
            {/* On Day of Breach */}
            <div>
                <div className="col-12">
                    <h5>on Breach Alerts</h5>
                </div>
                <div className="row">

                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="durationMinutes" className="control-label">
                                Alert To
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyTo'
                                placeholder="Choose Notify To"
                                isDisabled={isDisabled}
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyToLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyTo', value: selected.value } }, 'onBreach')
                                }}
                                value={notifyToLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.onBreach?.notifyTo) || []}
                            />
                            {formErrors?.notifyTo && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.notifyTo}</span>
                            )}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="notifyType" className="control-label">
                                Alert Channel
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyType'
                                placeholder="Choose Notify Type"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyTypeLookUp?.filter(e => e?.mapping?.alert?.includes('AT_ON_BRCH'))?.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyType', value: selected.value } }, 'onBreach')
                                }}
                                value={notifyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.onBreach?.notifyType) || []}
                            />
                            {formErrors?.['onBreach.notifyType'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['onBreach.notifyType']}</span>
                            )}
                        </div>
                    </div>
                    {alertComponentPermission?.onBreach?.isNotifyEmail && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="mailTemplateId" className="control-label">
                                Email Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='mailTemplateId'
                                placeholder="Choose Email Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={emailTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'mailTemplateId', value: selected.value } }, 'onBreach')
                                }}
                                value={emailTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.onBreach?.mailTemplateId) || []}
                            />
                            {formErrors?.['onBreach.mailTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['onBreach.mailTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {alertComponentPermission?.onBreach?.isNotifySMS && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                SMS Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='smsTemplateId'
                                placeholder="Choose SMS Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'smsTemplateId', value: selected.value } }, 'onBreach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.onBreach?.smsTemplateId) || []}
                            />
                            {formErrors?.['onBreach.smsTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['onBreach.smsTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {alertComponentPermission?.onBreach?.isNotifyWhatsapp && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                Whatsapp Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='whatsappTemplateId'
                                placeholder="Choose Whatsapp Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'whatsappTemplateId', value: selected.value } }, 'onBreach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.onBreach?.whatsappTemplateId) || []}
                            />
                            {formErrors?.['onBreach.whatsappTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['onBreach.whatsappTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
            <hr></hr>
            {/* After Breach */}
            <div>
                <div className="col-12">
                    <h5>Post Breach Alerts</h5>
                </div>

                <div className="row">
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
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={daysLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertDays', value: selected.value } }, 'postBeach')
                                }}
                                value={daysLookUp?.find(x => x.value === alertList?.postBeach?.alertDays) || []}
                            />
                            {formErrors?.['postBeach.alertDays'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.alertDays']}</span>
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
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={hoursLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertHours', value: selected.value } }, 'postBeach')
                                }}
                                value={hoursLookUp?.find(x => x.value === alertList?.postBeach?.alertHours) || []}
                            />
                            {formErrors?.['postBeach.alertHours'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.alertHours']}</span>
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
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={minuteLookUp}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'alertMinutes', value: selected.value } }, 'postBeach')
                                }}
                                value={minuteLookUp?.find(x => x.value === alertList?.postBeach?.alertMinutes) || []}
                            />
                            {formErrors?.['postBeach.alertMinutes'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.alertMinutes']}</span>
                            )}
                        </div>
                    </div>
                    <div className="col-md-2">
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
                                value={alertList?.postBeach?.alertRecurring ?? ""}
                                onChange={(e) => { handleAlertOnChange(e, 'postBeach') }}
                            />
                            {formErrors?.['postBeach.alertRecurring'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.alertRecurring']}</span>
                            )}
                        </div>
                    </div>
                    {<div className="col-md-2">
                        <div className="form-group">
                            <label htmlFor="alertRecurring" className="control-label">
                                Recurring Interval (hours)
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <input
                                className="form-control"
                                id="alertInterval"
                                type="number"
                                min={1}
                                max={12}
                                disabled={isDisabled}
                                maxLength={2}
                                value={alertList?.postBeach?.alertInterval ?? ""}
                                onChange={(e) => { handleAlertOnChange(e, 'postBeach') }}
                            />
                            {formErrors?.['postBeach.alertInterval'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.alertInterval']}</span>
                            )}
                        </div>
                    </div>}
                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="durationMinutes" className="control-label">
                                Alert To
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyTo'
                                placeholder="Choose Notify To"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyToLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyTo', value: selected.value } }, 'postBeach')
                                }}
                                value={notifyToLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.postBeach?.notifyTo) || []}
                            />
                            {formErrors?.['postBeach.notifyTo'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.notifyTo']}</span>
                            )}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="notifyType" className="control-label">
                                Alert Channel
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='notifyType'
                                placeholder="Choose Notify Type"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={notifyTypeLookUp?.filter(e => e?.mapping?.alert?.includes('AT_POST_BRCH'))?.map((x) => ({ label: x.description, value: x.code }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'notifyType', value: selected.value } }, 'postBeach')
                                }}
                                value={notifyTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === alertList?.postBeach?.notifyType) || []}
                            />
                            {formErrors?.['postBeach.notifyType'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.notifyType']}</span>
                            )}
                        </div>
                    </div>
                    {alertComponentPermission?.postBeach?.isNotifyEmail && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="mailTemplateId" className="control-label">
                                Email Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='mailTemplateId'
                                placeholder="Choose Email Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={emailTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'mailTemplateId', value: selected.value } }, 'postBeach')
                                }}
                                value={emailTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.postBeach?.mailTemplateId) || []}
                            />
                            {formErrors?.['postBeach.mailTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.mailTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {alertComponentPermission?.postBeach?.isNotifySMS && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                SMS Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='smsTemplateId'
                                placeholder="Choose SMS Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'smsTemplateId', value: selected.value } }, 'postBeach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.postBeach?.smsTemplateId) || []}
                            />
                            {formErrors?.['postBeach.smsTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.smsTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                    {alertComponentPermission?.postBeach?.isNotifyWhatsapp && <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="smsTemplateId" className="control-label">
                                Whatsapp Template
                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                            </label>
                            <ReactSelect
                                id='whatsappTemplateId'
                                placeholder="Choose Whatsapp Template"
                                menuPortalTarget={document.body}
                                isDisabled={isDisabled}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                options={smsTemplateList.map((x) => ({ label: x.templateName, value: x.templateId }))}
                                onChange={(selected) => {
                                    handleAlertOnChange({ target: { id: 'whatsappTemplateId', value: selected.value } }, 'postBeach')
                                }}
                                value={smsTemplateList?.map((x) => ({ label: x.templateName, value: x.templateId })).find(x => x.value === alertList?.postBeach?.whatsappTemplateId) || []}
                            />
                            {formErrors?.['postBeach.whatsappTemplateId'] && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.['postBeach.whatsappTemplateId']}</span>
                            )}
                        </div>
                    </div>}
                </div>
            </div>
        </>

    )
}

export default SLAAlerts