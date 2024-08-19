import { useContext } from "react";
import ReactSelect from 'react-select';
import { AppContext } from "../../AppContext";
import Alerts from "./Alert";
import moment from "moment";
import { TimePicker } from 'antd';
import dayjs from 'dayjs';

const SLADetails = () => {
    const { data, handlers } = useContext(AppContext)

    const { formErrors,
        slaData,
        slaTypeLookUp,
        durationLookUp,
        calenderLookup,
        shiftLookUp,
        daysLookUp,
        hoursLookUp,
        minuteLookUp,
        responseTypeLookup,
        isDisabled, action, entityCategory } = data
    const { handleOnChange } = handlers

    return (
        <form>
            <div className="skel-tabs-role-config p-2">
                <div className="col-12">
                    <div className="row">
                        {/* {!action?.isCreate && <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="slaName" className="control-label">
                                    SLA Code
                                </label>
                                <p disabled>{slaData.slaCode ?? ''}</p>
                            </div>
                        </div>} */}
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="slaName" className="control-label">
                                    SLA Name
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <input
                                    className="form-control"
                                    id="slaName"
                                    type="text"
                                    disabled={isDisabled}
                                    maxLength={100}
                                    // ref={el => inputRef?.current['slaCode'] = el}
                                    value={slaData?.slaName ?? ""}
                                    onChange={handleOnChange}
                                />
                                {formErrors?.slaName && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.slaName}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="slaType" className="control-label">
                                    Type
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='slaType'
                                    placeholder="Choose Type"
                                    isDisabled={isDisabled}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={slaTypeLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'slaType', value: selected.value } })
                                    }}
                                    value={slaTypeLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.slaType) || []}
                                />
                                {formErrors?.slaType && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.slaType}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="entityType" className="control-label">
                                    Entity Type
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='entityType'
                                    placeholder="Choose Type"
                                    isDisabled={isDisabled}
                                    menuPortalTarget={document.body}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={entityCategory.map((x) => ({ label: x.description, value: x.code }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'entityType', value: selected.value } })
                                    }}
                                    value={entityCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.entityType) || []}
                                />
                                {formErrors?.entityType && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.entityType}</span>
                                )}
                            </div>
                        </div>
                        {/* <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="description" className="control-label">
                                    Description
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <textarea type="text"
                                    id="description"
                                    name="description"
                                    disabled={isDisabled}
                                    className="form-control"
                                    value={slaData?.description ?? ''}
                                    onChange={handleOnChange} />
                            </div>
                            {formErrors?.description && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.description}</span>
                            )}
                        </div> */}
                        <div className="col-md-3">
                            <div className="form-group">
                                {/* <label htmlFor="tags" className="control-label invisible">Active</label> */}
                                <div className="form-inline pt-1">
                                    <span className="mr-2 font-weight-bold">Active <span className="text-danger font-20 pl-1 fld-imp">*</span></span>
                                    <div className="switchToggle switchToggle-new">
                                        <input type="checkbox" id="status" disabled={isDisabled} checked={slaData?.status === 'SL_AC'} onChange={(e) => {
                                            handleOnChange({ target: { id: 'status', value: e.target.checked ? 'SL_AC' : 'SL_IN' } })
                                        }} />
                                        <label htmlFor="status">Active</label>
                                    </div>
                                </div>
                                {formErrors?.status && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.status}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <hr></hr>
                    <div className="row">
                        {/* <div className="col-12">
                            <h5 className="control-label">SLA Duration</h5>
                        </div> */}
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="durationType" className="control-label">
                                    Working Type
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='durationType'
                                    placeholder="Choose Type"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={durationLookUp.map((x) => ({ label: x.description, value: x.code }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'durationType', value: selected.value } })
                                    }}
                                    value={durationLookUp?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.durationType) || []}
                                />
                                {formErrors?.durationType && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.durationType}</span>
                                )}
                            </div>
                        </div>
                        {slaData?.durationType === 'DT_BUSINESS' && <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="calendarNo" className="control-label">
                                    Working Hours
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <input className="form-control" id="workingHours" disabled={isDisabled} value={slaData?.workingHours ?? ""} min={0} type='number' max={24} onChange={handleOnChange} />
                                {formErrors?.workingHours && (
                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.workingHours}</span>
                            )}
                            </div>
                           
                        </div>}
                        {slaData?.durationType === 'DT_BUSINESS' && <div className="col-md-3">
                            <div className="form-group">
                                {/* <label htmlFor="tags" className="control-label invisible">Active</label> */}
                                <div className="form-inline pt-1">
                                    <span className="mr-2 font-weight-bold">Is Holiday Included</span>
                                    <div className="switchToggle switchToggle-new">
                                        <input type="checkbox" id="holidayFlag" disabled={isDisabled} checked={slaData?.holidayFlag} onChange={(e) => {
                                            handleOnChange({ target: { id: 'holidayFlag', value: e.target.checked } })
                                        }} />
                                        <label htmlFor="holidayFlag">Is Holiday Included</label>
                                    </div>
                                </div>
                                {formErrors?.holidayFlag && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.holidayFlag}</span>
                                )}
                            </div>
                        </div>}
                        {slaData?.durationType === 'DT_BUSINESS' && <div className="col-md-3">
                            <div className="form-group">
                                {/* <label htmlFor="tags" className="control-label invisible">Active</label> */}
                                <div className="form-inline pt-1">
                                    <span className="mr-2 font-weight-bold">Is Weekend Included</span>
                                    <div className="switchToggle switchToggle-new">
                                        <input type="checkbox" id="weekendFlag" disabled={isDisabled} checked={slaData?.weekendFlag} onChange={(e) => {
                                            handleOnChange({ target: { id: 'weekendFlag', value: e.target.checked } })
                                        }} />
                                        <label htmlFor="weekendFlag">Is Weekend Included</label>
                                    </div>
                                </div>
                                {formErrors?.weekendFlag && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.weekendFlag}</span>
                                )}
                            </div>
                        </div>}
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="calendarNo" className="control-label">
                                    Calendar Name
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='calendarNo'
                                    placeholder="Choose Calendar"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={calenderLookup.map((x) => ({ label: x.calendarDescription, value: x.calendarNo }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'calendarNo', value: selected.value } })
                                    }}
                                    value={calenderLookup?.map((x) => ({ label: x.calendarDescription, value: x.calendarNo })).find(x => x.value === slaData?.calendarNo) || []}
                                />
                                {formErrors?.calendarNo && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.calendarNo}</span>
                                )}
                            </div>
                        </div>

                        {/* <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="shiftNo" className="control-label">
                                    Shift
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='shiftNo'
                                    placeholder="Choose Shift"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    getOptionLabel={option => `${option.label} - (${option.startTime ? moment(option.startTime, 'HH:mm:ss')?.format('HH:mm A') : 'NA'} - ${option?.endTime ? moment(option.endTime, 'HH:mm:ss')?.format('HH:mm A') : 'NA'})`}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={shiftLookUp.map((x) => ({ label: x.shiftShortName, value: x.shiftNo, startTime: x.shiftStartTime, endTime: x.shiftEndTime }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'shiftNo', value: selected.value } })
                                    }}
                                    value={shiftLookUp?.map((x) => ({ label: x.shiftShortName, value: x.shiftNo, startTime: x.shiftStartTime, endTime: x.shiftEndTime })).find(x => x.value === slaData?.shiftNo) || []}
                                />
                                {formErrors?.shiftNo && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.shiftNo}</span>
                                )}
                            </div>
                        </div> */}
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="durationType" className="control-label">
                                    Response Type
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='responseType'
                                    placeholder="Choose Type"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={responseTypeLookup?.map((x) => ({ label: x.description, value: x.code }))}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'responseType', value: selected.value } })
                                    }}
                                    value={responseTypeLookup?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.responseType) || []}
                                />
                                {formErrors?.responseType && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.responseType}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="responseDays" className="control-label">
                                    Response Duration
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>

                                <div className="row">
                                    <div className="col-md-6">
                                        <ReactSelect
                                            id='responseDays'
                                            placeholder="Days"
                                            menuPortalTarget={document.body}
                                            isDisabled={isDisabled}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                            options={daysLookUp}
                                            onChange={(selected) => handleOnChange({ target: { id: 'responseDays', value: selected.value } })}
                                            value={daysLookUp.find(x => x.value === slaData?.responseDays) || null} // Changed || [] to || null
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TimePicker id='responseDuration' showNow={false} disabled={isDisabled} value={slaData?.responseDuration ? dayjs(slaData?.responseDuration, 'HH:mm') : null} onChange={(value, dateString) => { handleOnChange({ target: { id: 'responseDuration', value: dateString } }) }} format={'HH:mm'} />
                                    </div>
                                </div>
                                {(formErrors?.responseDuration || formErrors?.responseDays) && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors.responseDuration ?? formErrors?.responseDays ?? ''}</span> // Removed ?. for consistency
                                )}
                            </div>
                        </div>
                        {/* <div className="col-md-3">
                            <div className="form-group">
                                <div className="form-inline pt-1">
                                    <span className="mr-2 font-weight-bold">Automated Response <span className="text-danger font-20 pl-1 fld-imp">*</span></span>
                                    <div className="switchToggle switchToggle-new">
                                        <input type="checkbox" id="isAutomatedResponse" disabled={isDisabled} checked={slaData?.isAutomatedResponse} onChange={(e) => {
                                            handleOnChange({ target: { id: 'isAutomatedResponse', value: e.target.checked } })
                                        }} />
                                        <label htmlFor="isAutomatedResponse">Automated Response</label>
                                    </div>
                                </div>
                                {formErrors?.isAutomatedResponse && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.isAutomatedResponse}</span>
                                )}
                            </div>
                        </div> */}
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="resolutionDays" className="control-label">
                                    Resolution Duration
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>

                                <div className="row">
                                    <div className="col-md-6">
                                        <ReactSelect
                                            id='resolutionDays'
                                            placeholder="Days"
                                            menuPortalTarget={document.body}
                                            isDisabled={isDisabled}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                            options={daysLookUp}
                                            onChange={(selected) => handleOnChange({ target: { id: 'resolutionDays', value: selected.value } })}
                                            value={daysLookUp.find(x => x.value === slaData?.resolutionDays) || null} // Changed || [] to || null
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <TimePicker id='resolutionDuration' showNow={false} disabled={isDisabled} value={slaData?.resolutionDuration ? dayjs(slaData?.resolutionDuration, 'HH:mm') : null} onChange={(value, dateString) => { handleOnChange({ target: { id: 'resolutionDuration', value: dateString } }) }} format={'HH:mm'} />
                                    </div>
                                </div>
                                {(formErrors?.resolutionDuration || formErrors?.resolutionDays) && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors.resolutionDuration ?? formErrors?.resolutionDays ?? ''}</span> // Removed ?. for consistency
                                )}
                            </div>
                        </div>
                        {/* <div className="col-md-1">
                            <div className="form-group">
                                <label htmlFor="durationDays" className="control-label">
                                    Days
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='durationDays'
                                    placeholder="Days"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={daysLookUp}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'durationDays', value: selected.value } })
                                    }}
                                    value={daysLookUp?.find(x => x.value === slaData?.durationDays) || []}
                                />
                                {formErrors?.durationDays && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.durationDays}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-1">
                            <div className="form-group">
                                <label htmlFor="durationHours" className="control-label">
                                    Hours
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='durationHours'
                                    placeholder="Hours"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={hoursLookUp}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'durationHours', value: selected.value } })
                                    }}
                                    value={hoursLookUp?.find(x => x.value === slaData?.durationHours) || []}
                                />
                                {formErrors?.durationHours && (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.durationHours}</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-1">
                            <div className="form-group">
                                <label htmlFor="durationMinutes" className="control-label">
                                    Minutes
                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                </label>
                                <ReactSelect
                                    id='durationMinutes'
                                    placeholder="Minutes"
                                    menuPortalTarget={document.body}
                                    isDisabled={isDisabled}
                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                    options={minuteLookUp}
                                    onChange={(selected) => {
                                        handleOnChange({ target: { id: 'durationMinutes', value: selected.value } })
                                    }}
                                    value={minuteLookUp?.find(x => x.value === slaData?.durationMinutes) || []}
                                />
                                {formErrors?.durationMinutes & (
                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.durationMinutes}</span>
                                )}
                            </div>
                        </div> */}
                    </div>
                    <hr></hr>
                    {/* Alert Component */}
                    {/* <Alerts /> */}
                </div>
            </div>
        </form>
    )

}

export default SLADetails