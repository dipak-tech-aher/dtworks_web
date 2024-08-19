import React, { useEffect, useState, useCallback, useContext } from 'react';
import { post, get, put } from '../../common/util/restUtil';
import { properties } from '../../properties';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { object, string } from "yup";
import { AppContext } from '../../AppContext';
import { hideSpinner, showSpinner } from '../../common/spinner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import Modal from 'react-modal';


const customStyles = {
    content: {
        width: '60%',
        maxWidth: '700px',
        margin: 'auto',
        height: '50%',
    },
};

const AddEditAnnouncement = (props) => {
    const { auth } = useContext(AppContext)
    const navigate = useNavigate();
    const { type, announcementDetails } = props?.data
    const isExisting = type === 'CREATE' ? false : true
    const [announcementsInputsErrors, setAnnouncementsInputsErrors] = useState({});
    const [announcementCategory, setAnnouncementCategory] = useState([]);
    const [announcementChannel, setAnnouncementChannel] = useState([]);
    const [announcementFile, setAnnouncementFile] = useState({})
    const announStatus = announcementDetails?.status && announcementDetails?.status == "AC" ? "AC" : "IN"
    const [announcementStatus, setAnnouncementStatus] = useState(announStatus)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImage, setExistingImage] = useState("");
    const initialValues = {
        title: announcementDetails?.announName || '',
        summary: announcementDetails?.announMsg || '',
        mark_as_imp: announcementDetails?.markAsImp,
        fromDate: announcementDetails?.effectiveFrm || '',
        toDate: announcementDetails?.effectiveTo || '',
        category: announcementDetails?.announCategory?.code || '',
        announChannel: announcementDetails?.announChannel || '',
    }
    const [announcementInputs, setAnnouncementInputs] = useState(initialValues);

    let checkedChannals = {};
    if (announcementDetails?.announChannel) {
        announcementDetails?.announChannel.split(",").forEach(channal => {
            checkedChannals[channal] = true;
        })
    }
    const [checkedChannelItems, setCheckedChannelItems] = useState(checkedChannals);
    const [errors, setErrors] = useState({
        fromDateError: '',
        toDateError: ''
    });

    const today = new Date().toISOString().split('T')[0]; 

    const announcementValidationSchema = object().shape({
        title: string().nullable(false).required("Title is required"),
        summary: string().nullable(false).required("Summary is required"),
        category: string().nullable(false).required("Category is required"),
        announChannel: string().nullable(false).required("Channel is required"),
        fromDate: string().nullable(false).required("From Date is required"),
        toDate: string().nullable(false).required("To Date is required"),
    });

    const getLookupData = useCallback(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=ANNOUNCEMENT_CATEGORY,ANNOUNCEMENT_CHANNELS')
            .then((response) => {
                const { data } = response;
                unstable_batchedUpdates(() => {
                    setAnnouncementCategory(data.ANNOUNCEMENT_CATEGORY)
                    setAnnouncementChannel(data.ANNOUNCEMENT_CHANNELS)
                })
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }, [])

    useEffect(() => {
        getLookupData();
    }, [])

    useEffect(() => {
        if (isExisting && announcementDetails?.tranId) {
            get(`${properties?.COMMON_API}/attachment-details/${announcementDetails?.tranId}`).then((response) => {
                if (response?.status === 200 && response?.data && Array?.isArray(response?.data) && response?.data?.length > 0) {
                    if (response?.data[0]?.attachedContent) {
                        setExistingImage(response?.data[0].attachedContent)
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [])

    const validate = (schema, data) => {
        try {
            setAnnouncementsInputsErrors({});
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setAnnouncementsInputsErrors((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const handleOnAnnouncementInputsChange = (e) => {
        const { target } = e
        let value = target?.value
        if (target?.id == 'mark_as_imp') {
            value = target.checked
        }
        setAnnouncementInputs({
            ...announcementInputs,
            [target.id]: value
        })

        if (target.id === 'fromDate') {
            validateDates(value, announcementInputs.toDate);
        } else if (target.id === 'toDate') {
            validateDates(announcementInputs.fromDate, value);
        }
    }

    const validateDates = (fromDate, toDate) => {
        const errors = {};

        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            errors.toDateError = 'To Date must be after From Date';
        } else {
            errors.toDateError = '';
        }

        if (new Date(fromDate) < new Date()) {
            errors.fromDateError = 'From Date cannot be in the past';
        } else {
            errors.fromDateError = '';
        }
        
        setErrors(errors);
    };

    const updateFile = async (entityId, newEntityId, entityType) => {
        put(properties.COMMON_API + '/update-attachement', { entityId, newEntityId, entityType })
            .then((response) => {
                // console.log(response);
            })
            .catch(error => {
                console.error(error);
            })
            .finally()
    }

    const fileUpload = async () => {
        let entityType = "ANNOUNCEMENT";
        const data = new FormData();
        data.append("file_to_upload", announcementFile);

        try {
            showSpinner();
            const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE);
            const response = await axios.post(API_ENDPOINT + properties.COMMON_API + '/upload-files/local?entityType=' + entityType, data, {
                headers: {
                    "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
                    Authorization: auth?.accessToken
                },
            });
            const arrayObject = {
                entityId: response?.data?.data?.entityId,
            };
            // toast.success(`${announcementFile.name} Uploaded Successfully`);
            return arrayObject;

        } catch (error) {
            console.error(error);
            return null;
        } finally {
            hideSpinner();
        }

    }

    const createOrUpdateAnnouncement = async (inputDetails) => {
        let announImg = "";
        if (announcementFile?.name) {
            const fileDetails = await fileUpload();
            announImg = fileDetails.entityId
        }
        let requestBody = {
            announName: inputDetails?.title,
            announMsg: inputDetails?.summary,
            markAsImp: inputDetails?.mark_as_imp,
            effectiveFrm: inputDetails?.fromDate,
            effectiveTo: inputDetails?.toDate,
            announCategory: inputDetails?.category,
            announChannel: inputDetails?.announChannel,
            announImg: announImg,
            status: inputDetails?.status ? "AC" : "IN",
        }
        let finalData = [requestBody];
        if (isExisting) {
            requestBody.tranId = announcementDetails?.tranId
            put(properties.COMMON_API + '/update-announcement', finalData)
                .then((response) => {
                    const { status, message, data: { tranId } } = response;
                    if (status === 200) {
                        if (announcementFile?.name) {
                            updateFile(requestBody.announImg, tranId, 'ANNOUNCEMENT');
                        }
                        handleOnCancel();
                        toast.success(message);
                        navigate('/announcements')
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally()
        } else {
            post(properties.COMMON_API + '/create-announcement', finalData)
                .then((response) => {
                    const { status, message, data: { tranId } } = response;
                    if (status === 200) {
                        if (announcementFile?.name) {
                            updateFile(requestBody.announImg, tranId, 'ANNOUNCEMENT');
                        }
                        handleOnCancel();
                        toast.success(`${message}`);
                        navigate('/announcements')
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(hideSpinner())
        }

    }

    const handleOnSubmit = async () => {
        let announChannelValue = "";
        const channelDetails = Object.keys(checkedChannelItems);
        const channelLength = channelDetails.length;

        if (channelLength > 0) {
            announChannelValue = channelDetails.join(',');
        }

        let inputDetails = { ...announcementInputs };
        inputDetails.announChannel = announChannelValue;
        inputDetails.status = announcementStatus;
        setIsModalOpen(false)
        await createOrUpdateAnnouncement(inputDetails);
    }

    const handleOnValidateAndConfirm = async () => {
        let announChannelValue = "";
        const channelDetails = Object.keys(checkedChannelItems);
        const channelLength = channelDetails.length;

        if (channelLength > 0) {
            announChannelValue = channelDetails.join(',');
        }

        let inputDetails = { ...announcementInputs };
        inputDetails.announChannel = announChannelValue;
        inputDetails.status = announcementStatus;

        if (validate(announcementValidationSchema, inputDetails)) {
            toast.error("Validation Errors Found")
            return;
        }
        
        if(errors.fromDateError != '' || errors.toDateError != ''){
            return;
        }

        if (announcementFile?.name) {
            const reader = new FileReader();
            reader.addEventListener('load', function () {
                setImagePreview(reader.result);
            });
            reader.readAsDataURL(announcementFile);
        } else {
            setImagePreview(null);
        }
        setIsModalOpen(true)
    }

    const handleChannelCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setCheckedChannelItems(prevState => {
            const updatedItems = { ...prevState };
            if (checked) {
                updatedItems[name] = checked;
            } else {
                if (updatedItems.hasOwnProperty(name)) {
                    delete updatedItems[name];
                }
            }
            return updatedItems;
        });
    };

    const handleOnClear = () => {
        setAnnouncementStatus(announStatus)
        setAnnouncementInputs(initialValues)
        setAnnouncementFile({})
        setExistingImage("")
    }

    const handleOnCancel = () => {
        handleOnClear();
        navigate('/announcements')
    }

    return (
        <div className="skel-config-data d-block">
            <div className="row pl-3 pt-2 skel-faq-add">
                <div className="col-md-7">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="title" className="control-label">Title
                                    <span
                                        className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                <input className="form-control" id="title"
                                    placeholder="" type="text" value={announcementInputs?.title ?? ''} onChange={handleOnAnnouncementInputsChange} />
                                <span className="errormsg">{announcementsInputsErrors?.title ? announcementsInputsErrors?.title : ""}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="Interactioncat" className="control-label">&nbsp;
                            </label>
                            <div className="form-group form-check form-check-inline">
                                <div className="custom-control custom-checkbox">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        checked={announcementInputs?.mark_as_imp || false}
                                        id="mark_as_imp"
                                        value={announcementInputs?.mark_as_imp ?? ''}
                                        onChange={handleOnAnnouncementInputsChange}
                                    />
                                    <label className="custom-control-label"
                                        htmlFor="mark_as_imp">Mark as
                                        Important Announcement</label>

                                </div>
                            </div>
                        </div>

                        <div className="col-md-12">
                            <div className="form-group">
                                <label htmlFor="summary" className="control-label">
                                    Summary <span
                                        className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                <textarea className="form-control" maxLength="2500"
                                    id="summary" name="summary"
                                    rows="4" value={announcementInputs?.summary ?? ''} onChange={handleOnAnnouncementInputsChange}></textarea>
                                <span className="errormsg">{announcementsInputsErrors?.summary ? announcementsInputsErrors?.summary : ""}</span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="Interactionsol" className="control-label">
                                Upload Image</label>
                            <div className="input-group mb-2">

                                <div className="custom-file">
                                    <input type="file" className="custom-file-input"
                                        id="announImg"
                                        aria-describedby="inputGroupFileAddon01" value="" name="announFile" onChange={(e) => setAnnouncementFile(e.target.files[0])} />
                                    <label className="custom-file-label"
                                        htmlFor="inputGroupFile01">Choose file</label>
                                </div>
                            </div>
                            {announcementFile?.name && <div className="attach-btn" key={announcementFile?.name}>
                                <span className='a cursor-pointer' >{announcementFile?.name}</span>
                                <span className='a cursor-pointer' style={{padding:"10px",marginTop:'7px'}} onClick={() => setAnnouncementFile({})}><i className="fa fa-times" aria-hidden="true"></i></span>
                            </div>}
                            <br/>
                            <span>Accepted file types are .PNG, .JPG, .JPEG.
                                <br />Maximum upload
                                file size in 10 MB</span>
                        </div>
                        <div className="col-md-6">
                            {(existingImage && isExisting) && <img
                                src={`data:image/jpeg;base64,${existingImage}`}
                                alt="Image Preview"
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />}
                        </div>
                    </div>
                </div>
                <div className="col-md-5">
                    <div className="row col-md-12">
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="fromDate" className="control-label">From
                                    Date</label>
                                <input type="date" id="fromDate" className="form-control" min={today}
                                    value={announcementInputs?.fromDate ?? ''} onChange={handleOnAnnouncementInputsChange} />
                            </div>
                            {errors.fromDateError && <div className="text-danger">{errors.fromDateError}</div>}
                            <span className="errormsg">{announcementsInputsErrors?.fromDate ? announcementsInputsErrors?.fromDate : ""}</span>
                        </div>
                        <div className="col-md-6">
                            <div className="form-group">
                                <label htmlFor="toDate" className="control-label">To
                                    Date</label>
                                <input type="date" id="toDate" className="form-control" min={announcementInputs.fromDate || today}
                                    value={announcementInputs?.toDate ?? ''} onChange={handleOnAnnouncementInputsChange} />
                            </div>
                            {errors.toDateError && <div className="text-danger">{errors.toDateError}</div>}
                            <span className="errormsg">{announcementsInputsErrors?.toDate ? announcementsInputsErrors?.toDate : ""}</span>
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="form-group">
                            <label htmlFor="Interactioncat" className="control-label">
                                Category <span
                                    className="text-danger font-20 pl-1 fld-imp">*</span></label>
                            <div className="custselect">
                                <select className="form-control" id="category" value={announcementInputs?.category ?? ''} onChange={handleOnAnnouncementInputsChange}>
                                    <option selected="">Choose Category</option>
                                    {announcementCategory.map((e) => (
                                        <option
                                            value={e.code}
                                            selected={announcementInputs?.category === e.code}
                                            key={e.code}
                                        >
                                            {e.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <span className="errormsg">{announcementsInputsErrors?.category ? announcementsInputsErrors?.category : ""}</span>
                    </div>
                    <div className="col-md-9">

                        <div className="form-group">
                            <label htmlFor="fname" className="control-label">Channels<span
                                className="text-danger font-20 pl-1 fld-imp">*</span></label>
                        </div>

                        {announcementChannel.map((e) => (
                            <div key={e.code} className="form-group form-check form-check-inline">
                                <div className="custom-control custom-checkbox">
                                    <input
                                        type="checkbox"
                                        className="custom-control-input"
                                        name={e.code}
                                        checked={checkedChannelItems?.[e.code] != undefined ? true : false}
                                        onChange={handleChannelCheckboxChange} />
                                    <label className="custom-control-label" htmlFor="consumer-portal">{e.description}</label>
                                </div>
                            </div>
                        ))}
                        <span className="errormsg">{announcementsInputsErrors?.announChannel ? announcementsInputsErrors?.announChannel : ""}</span>
                    </div>

                    <div className="col-md-3">
                        <div className="form-group">
                            <label htmlFor="status" className="control-label">Status <span
                                className="text-danger font-20 pl-1 fld-imp">*</span></label>
                            <button
                                type="button"
                                className={`btn btn-sm btn-toggle inter-toggle ${announcementStatus == "AC" ? 'active' : ''} ml-0`}
                                data-toggle="button"
                                aria-pressed={announcementStatus}
                                autoComplete="off"
                                onClick={(e) => setAnnouncementStatus(announcementStatus === 'AC' ? 'IN' : 'AC')}
                            >
                                <div className="handle"></div>
                            </button>
                        </div>
                    </div>

                </div>
                <div className="col-md-12 skel-btn-center-cmmn mt-4 mb-3">
                    <button type="button" className="skel-btn-cancel" onClick={() => navigate(`/announcements`)}>Cancel</button>
                    <button className="skel-btn-submit" type="button" data-dismiss="modal" onClick={handleOnValidateAndConfirm}>
                        {
                            isExisting ? 'Preview/Update' : 'Preview/Submit'
                        }
                    </button>
                </div>
            </div>
            <Modal isOpen={isModalOpen} contentLabel="Workflow History Modal" style={customStyles}>
                <div className="modal-dialog modal-md">
                    <div className="modal-content">
                        <div className="modal-header px-4 border-bottom-0 d-block mb-0">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                            <h5 className="modal-title">Preview</h5>
                        </div>
                        {/* <hr className="cmmn-hline" /> */}
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-4">
                                    {imagePreview && (
                                        <div><img src={imagePreview} className="img-fluid" alt="Image Preview" /></div>)
                                    }
                                    {(existingImage && isExisting && !imagePreview) && <img
                                        src={`data:image/jpeg;base64,${existingImage}`}
                                        alt="Image Preview"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    />}
                                </div>
                                <div className="col-md-8">
                                    <span className="skel-ann-important"><i className="fa fa-exclamation-triangle pr-1" aria-hidden="true"></i> Important
                                    </span>
                                    <div className="skel-announcement-title">
                                        <span className="skel-announcement-header">{announcementInputs?.title}</span>

                                    </div>
                                    <p> {announcementInputs?.summary} </p>
                                    <div className="time-announcement">
                                        <span>{announcementInputs?.fromDate} to {announcementInputs?.toDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <hr className="cmmn-hline" />
                        <div className="skel-btn-center-cmmn mb-3 mt-3">
                            <button className="skel-btn-cancel" type="button" onClick={() => setIsModalOpen(false)}>No</button>
                            <button className="skel-btn-submit" type="button" onClick={() => handleOnSubmit()}>Submit</button>
                        </div>

                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default AddEditAnnouncement;
