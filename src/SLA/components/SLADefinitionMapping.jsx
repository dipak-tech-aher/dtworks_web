import { isEmpty } from "ol/extent"
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import ReactSelect from "react-select"
import { toast } from "react-toastify"
import Swal from 'sweetalert2'
import { array, object, string } from 'yup'
import { removeDuplicateObjects } from "../../common/util/commonUtils"
import { useHistory } from "../../common/util/history"
import { get, post, put } from "../../common/util/restUtil"
import { removeEmptyKey } from "../../common/util/util"
import { properties } from "../../properties"
import { AppContext } from "../../AppContext"

const SLADefinitionMapping = (props) => {
    const { data, handlers } = useContext(AppContext)
    const { slaData, masterLookUp, formErrors, mappingPermission, workflowLookUp, isDisabled } = data
    const { handleOnChange } = handlers

    return (
        <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
            <div className="row mt-2">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <form>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="channel" className="control-label">Channel <span>*</span></label>
                                            <ReactSelect
                                                id='channel'
                                                placeholder="Choose Entity"
                                                // isMulti
                                                isDisabled={isDisabled}
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.channel?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'channel', value: selected.value } }, 'mapping')
                                                }}
                                                value={slaData?.entityType ?
                                                    masterLookUp?.channel?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.channel ?? '')
                                                    : []}
                                            />
                                            {formErrors?.channel && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.channel}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="entityType" className="control-label">Entity Type <span>*</span></label>
                                            <ReactSelect
                                                id='entityType'
                                                placeholder="Choose Entity"
                                                // isDisabled={isDisabled}
                                                isDisabled
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.entityCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'entityType', value: selected.value } }, 'mapping')
                                                }}
                                                value={slaData?.entityType ?
                                                    masterLookUp?.entityCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.entityType ?? '')
                                                    : []}
                                            />
                                            {formErrors?.entityType && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.entityType}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="severity" className="control-label">Severity <span>*</span></label>
                                            <ReactSelect
                                                id='severity'
                                                placeholder="Choose severity"
                                                menuPortalTarget={document.body}
                                                isDisabled={isDisabled}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.severity?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'severity', value: selected.value } }, 'mapping')
                                                }}
                                                value={slaData?.mapping?.severity ?
                                                    masterLookUp?.severity?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.severity ?? '')
                                                    : []}
                                            />
                                            {formErrors?.severity && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.severity}</span>
                                            )}
                                        </div>
                                    </div>
                                    {!mappingPermission.isModuleHelpdeskEnabled ? <>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="interactionCategory" className="control-label">
                                                    Interaction Category
                                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                                </label>
                                                <ReactSelect
                                                    id='interactionCategory'
                                                    placeholder="Choose Category"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.interactionCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'interactionCategory', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.interactionCategory ?
                                                        masterLookUp?.interactionCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.interactionCategory ?? '')
                                                        : []}
                                                />
                                                {formErrors?.interactionCategory && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.interactionCategory}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="interactionType" className="control-label">
                                                    Interaction Type
                                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                                </label>
                                                <ReactSelect
                                                    id='interactionType'
                                                    placeholder="Choose Category"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.interactionType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'interactionType', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.interactionType ?
                                                        masterLookUp?.interactionType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.interactionType ?? '')
                                                        : []}
                                                />
                                                {formErrors?.interactionType && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.interactionType}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="serviceCategory" className="control-label">
                                                    Service Category
                                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                                </label>
                                                <ReactSelect
                                                    id='serviceCategory'
                                                    placeholder="Choose Category"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.serviceCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'serviceCategory', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.serviceCategory ?
                                                        masterLookUp?.serviceCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.serviceCategory ?? '')
                                                        : []}
                                                />
                                                {formErrors?.serviceCategory && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.serviceCategory}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="serviceType" className="control-label">
                                                    Service Type
                                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                                </label>
                                                <ReactSelect
                                                    id='serviceType'
                                                    placeholder="Choose Category"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.serviceType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'serviceType', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.serviceType ?
                                                        masterLookUp?.serviceType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.serviceType ?? '')
                                                        : []}
                                                />
                                                {formErrors?.serviceType && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.serviceType}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="workflowId" className="control-label">
                                                    Workflow
                                                    <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                                </label>
                                                <ReactSelect
                                                    id='workflowId'
                                                    placeholder="Choose Workflow"
                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={workflowLookUp.map((x) => ({ label: x.mappingName, value: x.mappingId }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'workflowId', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.workflowId ?
                                                        workflowLookUp?.map((x) => ({ label: x.mappingName, value: x.mappingId })).find(x => x.value === slaData?.mapping?.workflowId ?? '')
                                                        : []}
                                                />
                                                {formErrors?.workflowId && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.workflowId}</span>
                                                )}
                                            </div>
                                        </div>
                                    </> : <>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskType" className="control-label">Helpdesk Type<span>*</span></label>
                                                <ReactSelect
                                                    id='helpdeskType'
                                                    placeholder="Choose Helpdesk Type"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskType', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.helpdeskType ?
                                                        masterLookUp?.helpdeskType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.helpdeskType ?? '')
                                                        : []}
                                                />
                                                {formErrors?.helpdeskType && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskType}</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskCategory" className="control-label">Helpdesk Category<span>*</span></label>
                                                <ReactSelect
                                                    id='helpdeskCategory'
                                                    placeholder="Choose Helpdesk Category"
                                                    menuPortalTarget={document.body}
                                                    // isDisabled={isDisabled.helpdeskCategory}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskCategory', value: selected.value } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.helpdeskCategory ?
                                                        masterLookUp?.helpdeskCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaData?.mapping?.helpdeskCategory ?? '')
                                                        : []}
                                                />
                                                {formErrors?.helpdeskCategory && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskCategory}</span>
                                                )}
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskStatus" className="control-label">Helpdesk Status (Exclude)</label>
                                                <ReactSelect
                                                    id='helpdeskStatus'
                                                    placeholder="Choose Helpdesk Status"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled}
                                                    isMulti
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskStatus?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskStatus', value: selected } }, 'mapping')
                                                    }}
                                                    value={slaData?.mapping?.helpdeskStatus ?? []}
                                                />
                                                {/* {formErrors?.helpdeskStatus && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskStatus}</span>
                                                )} */}
                                            </div>
                                        </div>
                                    </>}

                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
export default SLADefinitionMapping