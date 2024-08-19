import React, { useCallback, useEffect, useRef, useState } from "react";
import { DatalistInput, useComboboxControls } from "react-datalist-input";
import { unstable_batchedUpdates } from "react-dom";
import { post, slowGet, get } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import FileUpload from "../../../common/uploadAttachment/fileUpload";
import moment from "moment";
import { getUTCLocalDateAndTime } from '../../../common/util/dateUtil';
import AddressComponent from "../AddressComponent";
import ReactSwitch from "react-switch";
import { toast } from "react-toastify";
import { isEmpty } from "lodash";
import { statusConstantCode } from '../../../AppConstants';
import DynamicTable from "../../../common/table/DynamicTable";
import { CloseButton, Modal } from "react-bootstrap";
import AddEditTask from "../../CommonComponents/AddEditTask";

// import Scanimg from "../../../assets/images/main-qimg-833c55a3dd50cfa33fd7795809828a4e-lq2.jpeg";
// import Uploadimg from "../../../assets/images/upload.svg";

const CreateHelpdeskForm = (props) => {
    const { profileDetails, helpdeskData, error, readOnly, currentFiles, ivrNo, smartAssistance, helpdeskTypeLookUp, serviceCategoryLookup,
        severityLookUp, projectLookup, serviceTypeLookup, withStatement, problemCodeLookupData, switchStatus, escalate, helpdeskStatus, enableHelpdeskAddress,
        consumerDetails, addressList, dtWorksProductType, addressError, slaEdoc, enableTask, taskStatusLookup,
        taskDetails, taskList, showTaskModal, refresh
        // helpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
    } = props.data;
    const { setHelpdeskData, handleClear, handleSubmit, setError, setCurrentFiles, handleOnChange, setServiceCategoryLookup, setEnableHelpdeskAddress,
        //setHelpdeskCategoryLookup, /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
        setServiceTypeLookup,
        setHelpdeskTypeLookUp,
        setSeverityLookUp,
        setEscalate, checkComponentPermission, setAddressList, setAddressError, setEnableTask, setTaskDetails,
        setTaskList,
        setTaskStatusLookup,
        setShowTaskModal } = props.stateHandler;

    const formRef = useRef();
    const [items, setItems] = useState([]);
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [userList, setUserList] = useState([])
    const [tagsLookup, setTagsLookup] = useState([])
    const [isTaskEdit, setIsTaskEdit] = useState(false)
    const [resolutionDate, setResolutionDate] = useState()
    const [resolutionTime, setResolutionTime] = useState()
    const [responseDate, setResponseDate] = useState()
    const [responseTime, setResponseTime] = useState()

    // const [viewUploadDetails, setViewUploadDetails] = useState(1);
    // const [viewUploadDetails1, setViewUploadDetails1] = useState(2);
    const addressDet = dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? consumerDetails?.customerAddress : consumerDetails?.profileAddress;
    useEffect(() => {
        if (enableHelpdeskAddress && addressDet?.length > 0 && helpdeskData?.markAsHelpdeskAddress) {
            const address = addressDet.map((e) => {
                return {
                    ...e,
                    addressType: e?.addressType?.code,
                }
            })
            setAddressList(address)
        } else if (enableHelpdeskAddress && isEmpty(addressDet)) {
            toast.info('Address not available. Please add new address')
            setHelpdeskData({ ...helpdeskData, markAsHelpdeskAddress: false })
        }
    }, [/*helpdeskData.markAsHelpdeskAddress,*/ enableHelpdeskAddress])

    const getMasterLookup = useCallback(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=HELPDESK_TYPE,PROD_SUB_TYPE,SEVERITY,SERVICE_TYPE,PRIORITY,TAGS')
            .then((response) => {
                const { data } = response;
                unstable_batchedUpdates(() => {
                    // console.log('data --------------->', data['PROD_SUB_TYPE'])
                    setServiceCategoryLookup(data['PROD_SUB_TYPE'])
                    // setHelpdeskCategoryLookup(data['INTXN_CATEGORY']) /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
                    setServiceTypeLookup(data['SERVICE_TYPE'])
                    setHelpdeskTypeLookUp(data['HELPDESK_TYPE'])
                    setSeverityLookUp(data['SEVERITY'])
                    setPriorityLookup(data['PRIORITY'])
                    setTagsLookup(data['TAGS']?.map(x => ({ value: x.code, label: x.description })))
                })
            })
            .catch(error => {
                console.error(error);
            })
            .finally()

        post(properties.USER_API + "/search?limit=1000&page=0")
            .then((resp) => {
                if (resp.data) {
                    setUserList(resp.data?.rows);
                } else {
                    toast.error("Error while fetching details");
                }
            })
            .catch(error => {
                // console.log(error)
            }).finally();
    }, [])

    useEffect(() => {
        if (helpdeskTypeLookUp?.length <= 0 || serviceCategoryLookup <= 0 || severityLookUp <= 0) {
            getMasterLookup()
        }
    }, [getMasterLookup])

    const handleDeleteTaskRow = (row) => {
        const updatedList = taskList.filter(f => f.taskName !== row.taskName)
        setTaskList(updatedList)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.id === 'taskAction') {
            return (
                <div className="skel-action-btn">
                    <div title="Edit" onClick={() => { setShowTaskModal(true); setTaskDetails(row.original); setIsTaskEdit(true) }} className="action-edit"><i className="material-icons">edit</i></div>
                    <div title="Delete" onClick={() => handleDeleteTaskRow(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">delete</i></a></div>
                </div>
            )
        } else {
            return <span>{cell.value}</span>;
        }
    };

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

    const AddTask = (taskDet) => {
        if (Object.keys(taskDet).length > 0) {
            const uniqueList = !isEmpty(taskList) ? taskList?.filter(f => f.taskName !== taskDet.taskName) : []
            setTaskList([
                ...uniqueList,
                taskDet
            ]);
        }
    }

    useEffect(() => {
        let respTime, respDate, resTime, resDate
        // console.log('-------------------', helpdeskData.responseDate, helpdeskData.complitionDate, slaEdoc.responseDate, slaEdoc.complitionDate)
        if (!helpdeskData?.responseDate && slaEdoc.responseDate) {

            const responseDate = new Date(slaEdoc.responseDate)
            const getDate = getUTCLocalDateAndTime(responseDate)
            respDate = getDate.date
            respTime = getDate.time
            // respDate = moment(responseDate).format('YYYY-MM-DD')
            // respTime = moment(responseDate).format('HH:mm:ss')

        } else if (helpdeskData?.responseDate) {

            const responseDate = new Date(helpdeskData.responseDate)
            const getDate = getUTCLocalDateAndTime(responseDate)
            respDate = getDate.date
            respTime = getDate.time
        } else {
            respDate = ''
            respTime = ''
        }
        setResponseTime(respTime)
        setResponseDate(respDate)

        if (!helpdeskData?.complitionDate && slaEdoc.complitionDate) {

            const compDate = new Date(slaEdoc.complitionDate)

            const getDate = getUTCLocalDateAndTime(compDate)
            resDate = getDate.date
            resTime = getDate.time

            // respDate = moment.utc(compDate).local().format('YYYY-MM-DD');
            // respTime = moment.utc(compDate).local().format('HH:mm:ss');
        } else if (helpdeskData?.complitionDate) {
            const compDate = new Date(helpdeskData.complitionDate)
            const getDate = getUTCLocalDateAndTime(compDate)
            resDate = getDate.date
            resTime = getDate.time

            // resDate = moment(helpdeskData.complitionDate).format('YYYY-MM-DD')
            // resTime = moment(helpdeskData.complitionDate).format('HH:mm:ss')
        } else {
            resDate = ''
            resTime = ''
        }

        setResolutionTime(resTime)
        setResolutionDate(resDate)
    }, [helpdeskData.responseDate, helpdeskData.complitionDate, slaEdoc.responseDate, slaEdoc.complitionDate])

    console.log('resol date ', resolutionDate, resolutionTime)
    return (
        <div className="">
            {/* <form ref={formRef}> */}
            <fieldset className="">
                <div className="">

                    <div className="mt-2">
                        <div className="form-row">
                            {/****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/}
                            {/* <div className="form-group col-md-4">
                                    <div className="">
                                        <label htmlFor="helpdeskCategory" className="control-label">
                                            Helpdesk Category
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="helpdeskCategory" value={helpdeskData?.helpdeskCategory ?? ''} onChange={handleOnChange}>
                                            <option value="" key='helpdeskCategory'>Select</option>
                                            {
                                                helpdeskCategoryLookup && helpdeskCategoryLookup.map((e) => (
                                                    <option value={e.code} data-entity={JSON.stringify(e)} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.helpdeskCategory ? error.helpdeskCategory : ""}
                                        </span>
                                    </div>
                                </div> */}
                            <div className="form-group col-md-4">
                                <div className="">
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
                            {!withStatement &&
                                <div className="form-group col-md-4">
                                    <div className="">
                                        <label htmlFor="serviceType" className="control-label">
                                            Service Type
                                            <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                        </label>
                                        <select className="form-control" disabled={smartAssistance} id="serviceType" value={helpdeskData?.serviceType ?? ''} onChange={handleOnChange}>
                                            <option value="" key='serviceType'>Select</option>
                                            {
                                                serviceTypeLookup && serviceTypeLookup.map((e) => (
                                                    <option value={e.code} data-entity={JSON.stringify(e)} key={e.code}>{e.description}</option>
                                                ))
                                            }
                                        </select>
                                        <span className="errormsg">
                                            {error.serviceType ? error.serviceType : ""}
                                        </span>
                                    </div>
                                </div>
                            }
                            <div className="form-group col-md-4">
                                <div className="">
                                    <label htmlFor="serviceCategory" className="control-label">
                                        Service Category
                                        <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                    </label>
                                    <select className="form-control" disabled id="serviceCategory" value={helpdeskData?.serviceCategory ?? ''} onChange={handleOnChange}>
                                        <option value="" key='serviceCategory'>Select</option>
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
                            {!withStatement && <div className="form-group col-md-4">
                                <div className="">
                                    <label
                                        htmlFor="helpdeskProblemCode"
                                        className="control-label"
                                    >
                                        Problem Code{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <div className="custselect">
                                        <select
                                            value={helpdeskData?.helpdeskProblemCode ?? ''}
                                            disabled={switchStatus}
                                            id="helpdeskProblemCode"
                                            className="form-control"
                                            onChange={handleOnChange}
                                        >
                                            <option key="helpdeskProblemCode" value="">
                                                Select
                                            </option>
                                            {problemCodeLookupData &&
                                                problemCodeLookupData?.map((e) => (
                                                    <option key={e.code} value={e.code}>
                                                        {e.description}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <span className="errormsg">
                                        {error.helpdeskProblemCode
                                            ? error.helpdeskProblemCode
                                            : ""}
                                    </span>
                                </div>
                            </div>}
                            <div className="form-group col-md-4">
                                <div className="">
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
                            {!escalate && <div className="form-group col-md-4">
                                <div className="">
                                    <label htmlFor="helpdeskStatus" className="control-label">
                                        Status<span className="text-danger font-20 pl-1 fld-imp">*</span>
                                    </label>
                                    <select className="form-control" id="helpdeskStatus" value={helpdeskData?.helpdeskStatus ?? ''} onChange={handleOnChange}>
                                        <option value="" key='helpdeskStatus'>Select</option>
                                        {
                                            helpdeskStatus && helpdeskStatus.map((e) => (
                                                <option value={e.code} key={e.code}>{e.description}</option>
                                            ))
                                        }
                                    </select>
                                    <span className="errormsg">
                                        {error.helpdeskStatus ? error.helpdeskStatus : ""}
                                    </span>
                                </div>
                            </div>}
                            {slaEdoc.responseDate && <div className="form-group col-md-4">
                                <div className="">
                                    <label
                                        htmlFor="responseDate"
                                        className="control-label"
                                    >
                                        Expected Response Date{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <div className="d-flex align-items-center">
                                        <input type="date" id="responseDate" className="form-control" style={{ width: '50%' }}
                                            min={moment(new Date()).format('YYYY-MM-DD')} disabled
                                            value={responseDate}
                                            onChange={(e) => {
                                                if (enableTask) {
                                                    toast.error("Cannot perform this action due to Enabled Task action. Kindly disable and provide new tasks based on new EDOC")
                                                } else {
                                                    handleOnChange(e)
                                                }
                                            }}
                                        />
                                        <input
                                            type="time"
                                            id="responseTime"
                                            className="form-control"
                                            style={{ width: '50%' }}
                                            disabled={slaEdoc.responseDate}
                                            value={responseTime}
                                            onChange={(e) => {
                                                if (enableTask) {
                                                    toast.error("Cannot perform this action due to Enabled Task action. Kindly disable and provide new tasks based on new EDOC");
                                                } else {
                                                    // handleOnChange(e);
                                                    setResponseTime(e.target.value);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="errormsg">
                                    {error.responseDate ?? ""}
                                </span>
                            </div>}
                            {<div className="form-group col-md-4">
                                <div className="">
                                    <label
                                        htmlFor="complitionDate"
                                        className="control-label"
                                    >
                                        Expected Resolution Date
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <div className="d-flex align-items-center">
                                        <input type="date" id="complitionDate" className="form-control" style={{ width: '50%' }}
                                            min={moment(new Date()).format('YYYY-MM-DD')} disabled={!!slaEdoc.complitionDate}
                                            value={resolutionDate}
                                            onChange={(e) => {
                                                if (enableTask) {
                                                    toast.error("Cannot perform this action due to Enabled Task action. Kindly disable and provide new tasks based on new EDOC")
                                                } else {
                                                    handleOnChange(e)
                                                }
                                            }}
                                        />
                                        {slaEdoc.responseDate && <input
                                            type="time"
                                            id="resolutionTime"
                                            className="form-control"
                                            style={{ width: '50%' }}
                                            disabled={!!slaEdoc.complitionDate}
                                            value={resolutionTime}
                                            onChange={(e) => {
                                                if (enableTask) {
                                                    toast.error("Cannot perform this action due to Enabled Task action. Kindly disable and provide new tasks based on new EDOC");
                                                } else {
                                                    // handleOnChange(e);
                                                    setResolutionTime(e.target.value);
                                                }
                                            }}
                                        />}
                                    </div>
                                </div>
                                <span className="errormsg">
                                    {error.complitionDate ? error.complitionDate : ""}
                                </span>
                            </div>}
                            {!switchStatus && <div className="col-md-12">
                                <div className="form-group col-md-3">
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" className="custom-control-input" id="proceedChecks" checked={escalate}
                                            onClick={(e) => { setEscalate(e.target.checked); setHelpdeskData({ ...helpdeskData, helpdeskStatus: '' }) }} />
                                        <label className="custom-control-label" htmlFor="proceedChecks">Escalate the issue</label>
                                    </div>
                                </div>
                            </div>}

                            <div className="col-md-12">
                                <div className="skel-form-heading-bar mt-2">
                                    <span className="messages-page__title">
                                        Capture Helpdesk Address ?
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle ml-2"
                                            id="smartSwitch"
                                            checked={enableHelpdeskAddress}
                                            onChange={() => {
                                                setEnableHelpdeskAddress(!enableHelpdeskAddress)
                                            }}
                                        />
                                    </span>
                                </div>
                                {enableHelpdeskAddress && <div className="col-md-12">
                                    <div className="">
                                        {addressDet?.length && (
                                            <label htmlFor="markAsHelpdeskAddress" className="control-label">
                                                <input type="checkbox" onChange={(e) => {
                                                    setHelpdeskData({ ...helpdeskData, markAsHelpdeskAddress: e.target.checked })
                                                }} id="markAsHelpdeskAddress" checked={helpdeskData?.markAsHelpdeskAddress} />Use existing address
                                            </label>
                                        )}
                                        <AddressComponent index={0}
                                            readOnly={helpdeskData?.markAsHelpdeskAddress}
                                            addressList={addressList}
                                            setAddressList={setAddressList}
                                            error={addressError}
                                            setError={setAddressError}
                                        />
                                    </div>
                                    <span className="errormsg">
                                        {error.helpdeskAddress ? error.helpdeskAddress : ""}
                                    </span>
                                </div>}
                            </div>
                            <div className="row">
                                <div className="skel-form-heading-bar mt-2">
                                    <span className="messages-page__title">
                                        Would you like to create task ?
                                        <ReactSwitch
                                            onColor="#4C5A81"
                                            offColor="#6c757d"
                                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                            height={20}
                                            width={48}
                                            className="inter-toggle skel-inter-toggle ml-2"
                                            id="enableTask"
                                            checked={enableTask}
                                            onChange={() => {
                                                if (!helpdeskData.complitionDate) {
                                                    toast.error('Cannot perform this action due to missing Expected date of completion')
                                                } else {
                                                    setEnableTask(!enableTask)
                                                }
                                            }}
                                        />
                                    </span>
                                </div>
                                {enableTask && <div className="col-md-12">
                                    <div>
                                        <button className="skel-btn-submit" onClick={() => { setShowTaskModal(true); setIsTaskEdit(false) }}>Add New Task</button>
                                    </div>
                                    <div className="">
                                        <DynamicTable
                                            row={taskList}
                                            header={taskListColumns}
                                            itemsPerPage={10}
                                            backendPaging={false}
                                            handler={{
                                                handleCellRender: handleCellRender,
                                            }}
                                        />
                                    </div>
                                </div>}
                            </div>
                            <div className="form-group col-md-12">
                                <div className="">
                                    <label htmlFor="remarks" className="control-label">
                                        Remarks{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                    </label>
                                    <textarea
                                        value={helpdeskData?.content ?? ''}
                                        className={`form-control height-auto ${error.content && "error-border"}`}
                                        id="content"
                                        name="content"
                                        rows="3"
                                        maxLength="2500"
                                        aria-describedby="contentHelp"
                                        placeholder="Enter Remarks"
                                        onChange={(e) => { setHelpdeskData({ ...helpdeskData, content: e?.target?.value }); setError({ ...error, content: '' }) }}
                                    />
                                    <small id="contentHelp" className="form-text text-muted">Maximum 2500 characters</small>
                                    <span className="errormsg">
                                        {error.content && error.content}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-12">
                                <label className="control-label">
                                    Attachments
                                </label>
                                <FileUpload
                                    data={{
                                        currentFiles,
                                        entityType: "HELPDESK",
                                        shouldGetExistingFiles: false,
                                        refresh
                                    }}
                                    handlers={{
                                        setCurrentFiles,
                                    }}
                                />
                            </div>

                        </div>

                        {/* Attachment Category */}
                        {/* {viewUploadDetails === 1 && (
                        <>
                        <hr className="cmmn-hline mt-2 mb-2" />
                        <span className="skel-header-title">Category wise Attachements</span>

                        <div className="row">
                        <div class="col-md-6 pl-0">
                        <label for="customerTitle" className="col-form-label">Passport Front Page<span>*</span></label>

                        <div class="form-group">
                        <input type="file" id="frontPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                        </div>
                        <span className="img-attachment skel-img-icon-pos">passportfront.png <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                        </div>
                        <div className="col-md-6 pl-0">
                        <label for="customerTitle" className="col-form-label">Passport Back Page</label>
                        <div className="form-group">
                        <input type="file" id="backPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                        </div>
                        <span className="img-attachment skel-img-icon-pos">passportback.png <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                        </div>
                        </div>
                        </>
                        )}

                        {viewUploadDetails === 2 && (
                        <>
                        <hr className="cmmn-hline mt-2 mb-2" />
                        <div className="d-flex justify-content-spacebetween">
                        <div className="skel-upload-header">
                        <span className="skel-header-title mb-0">Upload Passport</span>
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                        </div>
                        <div className="cursor-pointer">
                        <img src={Uploadimg} alt="" class="img-fluid mr-1" width="25" height="25" onClick={() => {setViewUploadDetails(1); }}/>
                        </div>
                        </div>
                        <div className="row">
                        <div class="col-md-6 pl-0">
                        <span className="skel-capture-img"><img src={Scanimg} className="img-fluid" /></span>
                        </div>
                        <div className="col-md-6 pl-0">
                        <span className="skel-capture-img"><img src={Scanimg} className="img-fluid" /></span>
                        </div>
                        </div>
                        <div className="skel-btn-center-cmmn mt-2 mb-2">                
                        <button className="skel-btn-submit-outline">Recapture</button>
                        </div>
                        </>
                        )}              

                        {viewUploadDetails1 === 2 && (
                        <>
                        <hr className="cmmn-hline mt-2 mb-2" />

                        <div className="row">
                        <div class="col-md-6 pl-0">
                        <label for="customerTitle" className="col-form-label">ID Card Front Page<span>*</span></label>
                        <div class="form-group">
                        <input type="file" id="frontPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                        </div>
                        <span className="img-attachment skel-img-icon-pos">IDcardfront.jpg <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                        </div>
                        <div className="col-md-6 pl-0">
                        <label for="customerTitle" className="col-form-label">ID Card Back Page</label>
                        <div className="form-group">
                        <input type="file" id="backPage" />
                        <span class="skel-int-cr-date mt-0">(Maximum file size 10 MB)</span>
                        </div>
                        <span className="img-attachment skel-img-icon-pos">IDcardback.jpg <span className="cursor-pointer"><i class="fa fa-times" aria-hidden="true"></i></span></span>
                        </div>
                        </div>
                        </>
                        )} */}



                        <div className="skel-btn-center-cmmn mt-4 mb-4">
                            <button type="button" className={`skel-btn-cancel ${readOnly ? 'disabled' : ''}`} disabled={readOnly} onClick={handleClear}>Clear</button>
                            <button type="button" className={`skel-btn-submit ${readOnly ? 'disabled' : ''}`} disabled={readOnly} onClick={handleSubmit} >Create</button>
                        </div>
                    </div>

                </div>
            </fieldset>
            {/* </form> */}
            {
                <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" dialogClassName="cust-lg-modal" centered show={showTaskModal} onHide={() => { setShowTaskModal(false); setTaskDetails({}) }}>
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Add/Edit Task</h5></Modal.Title>
                        <CloseButton onClick={() => { setShowTaskModal(false); setTaskDetails({}) }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>

                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <AddEditTask data={
                            {
                                error, taskDetails, taskList, isEdit: isTaskEdit, helpdeskData, priorityLookup, taskStatusLookup, userList, tagsLookup, showTaskModal
                            }
                        }
                            handler={
                                {
                                    handleInputChange: handleOnChange,
                                    setTaskDetails,
                                    setTaskList,
                                    setTaskStatusLookup,
                                    setShowTaskModal,
                                    AddTask
                                }
                            }
                        />
                    </Modal.Body>
                </Modal>
            }
        </div>
    );
};

export default CreateHelpdeskForm;
const taskListColumns = [
    {
        Header: "Action",
        accessor: "taskAction",
        disableFilters: true,
        id: "taskAction"
    },
    {
        Header: "Task Name",
        accessor: "taskName",
        disableFilters: true
    },
    {
        Header: "Description",
        accessor: "taskDescription",
        class: 'skel-wb',
        disableFilters: true
    }
]