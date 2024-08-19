import { useCallback, useEffect, useState, useRef } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import { post } from "../../common/util/restUtil";
import { properties } from "../../properties";
// import Accordion from 'react-bootstrap/Accordion';
// import ViewAddress from "./ViewAddress";
import { isEmpty } from 'lodash';
import { Element } from "react-scroll";
import CreateHelpdeskForm from "./CreateHelpdeskForm";
import { createBrowserHistory } from "history";
import { array, object, string } from 'yup';
import ReactSwitch from "react-switch";

const CreateHelpdesk = (props) => {
    const { profileNo = '', ivrNo, phoneNo, serviceCategoryLookup, helpdeskTypeLookUp, severityLookUp, projectLookup } = props?.data
    const initialValues = {
        helpdeskSubject: null,
        helpdeskType: null,
        content: null,
        helpdeskSource: ivrNo ? 'CALL_CENTER' : 'WEB_APP',
        mailId: null,
        contactId: null,
        userCategory: null,
        userCategoryValue: null,
        userName: null,
        project: null,
        severity: null,
        serviceCategory: null,
        attachments: []
    };
    const [profileDetails, setProfileDetails] = useState({})
    const [helpdeskData, setHelpdeskData] = useState(initialValues)
    const [error, setError] = useState({});
    const [currentFiles, setCurrentFiles] = useState([])
    const history = createBrowserHistory()
    const [switchStatus, setSwitchStatus] = useState(true);


    const validationSchema = object().shape({
        content: string().required("Remark is required"),
        serviceCategory: string().required("Remark is required"),
        helpdeskType: string().required("Remark is required"),
        severity: string().required("Remark is required")
        // helpdeskSubject: string().required("Helpdesk Statement is required")
    })

    const getProfileDetails = useCallback(() => {
        if (profileNo) {
            const requestBody = { profileNo }
            post(`${properties.PROFILE_API}/search`, requestBody).then((resp) => {
                if (resp?.status === 200) {
                    unstable_batchedUpdates(() => {
                        setProfileDetails({
                            ...resp?.data?.rows?.[0],
                            profileName: (resp?.data?.rows?.[0]?.firstName || '' + resp?.data?.rows?.[0]?.lastName || ''),
                        })
                    })
                    if (resp?.data?.count === 0) {
                        toast.error(resp?.message)
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [profileNo])

    useEffect(() => {
        if (profileNo) {
            getProfileDetails()
        }

    }, [profileNo, getProfileDetails])

    const handleClear = () => {
        unstable_batchedUpdates(() => {
            setHelpdeskData(initialValues)
            setCurrentFiles([])
        })
    }

    const validate = (schema, data) => {
        try {
            setError({})
            schema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e?.inner?.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    }

    const handleSubmit = () => {
        if (!profileNo) {
            toast.warn('No Profile Details selected for Create Helpdesk')
            return false
        }

        let error = validate(validationSchema, helpdeskData);
        if (error) {
            toast.error("Validation errors found. Please check all fields");
            return false
        }

        if (!helpdeskData?.content) {
            toast.error('Please provide Remarks')
            return false
        }
        let customerName = `${profileDetails?.firstName ?? ''} ${profileDetails?.lastName ?? ''}`?.trim();
        let contact = profileDetails?.profileContact?.find(x => x.isPrimary);

        const requestBody = {
            ...helpdeskData,
            mailId: contact?.emailId,
            phoneNo: contact?.mobileNo,
            contactId: contact?.contactId ?? null,
            userCategory: contact?.contactCategory?.code ?? null,
            userCategoryValue: contact?.contactCategoryValue ?? null,
            userName: customerName,
            helpdeskSubject: helpdeskData?.helpdeskSubject ?? (helpdeskData?.serviceCategoryDesc),
            ivrNo: ivrNo ?? null,
            phoneNo: phoneNo ?? null,
            attachments: [...currentFiles.map((current) => current.entityId)].length > 0
                ? [...currentFiles.map((current) => current.entityId)]
                : [],
        }
        if (requestBody?.serviceCategory) {
            delete requestBody?.serviceCategoryDesc
            delete requestBody?.serviceCategory
        }
        post(`${properties.HELPDESK_API}/create`, requestBody).then((response) => {
            const { message, data } = response;
            if (data?.helpdeskNo) {
                handleClear()
                toast.success(message);
                if (!ivrNo) {
                    history.goBack();
                }
            } else {
                toast.error(message);
            }
        }).catch(error => {
            console.error(error);
        });
    }

    const formatedContactPreference = (payload, key) => {
        let response = ''
        if (!isEmpty(payload) && key) {
            payload?.forEach((e) =>
                response = response ? response + ',' + e?.[key] : e?.[key]
            )
        }
        return response
    }

    const handleOnChange = (e) => {
        const { target } = e
        unstable_batchedUpdates(() => {
            if (target.id === 'serviceCategory') {
                setHelpdeskData({
                    ...helpdeskData,
                    [target.id]: target.value,
                    serviceCategoryDesc: JSON.parse(target?.options[target.selectedIndex]?.dataset?.entity)?.description ?? ''
                })
            } else {
                setHelpdeskData({
                    ...helpdeskData,
                    [target.id]: target.value
                })
            }
            setError({ ...error, [target.id]: '' })
        })
    }

    return (
        <div className="px-2 pt-2">
            <div className="row skel-active-new-user-field mt-2">
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="profileNo" className="control-label">Profile ID</label>
                        <span>{profileDetails?.profileNo ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="profileName" className="control-label">Profile Name</label>
                        <span>{profileDetails?.profileName ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="emailId" className="control-label">Email ID</label>
                        <span>{profileDetails?.profileContact?.[0]?.emailId ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="mobileNo" className="control-label">Contact Number</label>
                        <span>{profileDetails?.profileContact?.[0]?.mobileNo ? `+${profileDetails?.profileContact?.[0]?.mobilePrefix ? profileDetails?.profileContact?.[0]?.mobilePrefix?.replaceAll('+', '') : ''} ${profileDetails?.profileContact?.[0]?.mobileNo ?? ''}` : ''}</span>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="form-group">
                        <label htmlFor="emailId" className="control-label">Contact Preference</label>
                        <span>{profileDetails?.contactPreferencesDesc ? formatedContactPreference(profileDetails?.contactPreferencesDesc, 'description') : ''}</span>
                    </div>
                </div>
            </div>
            {/* <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0">
                    <Accordion.Header className="mwidth100">
                        <section className="triangle">
                            <h4 id="list-item-1" className="pl-2" style={{ textAlign: 'left' }}>Profile Address</h4>
                        </section>
                    </Accordion.Header>
                    <Accordion.Body>
                        <ViewAddress
                            data={{
                                addressDetails: profileDetails?.profileAddress?.[0] ?? {}
                            }}
                        />
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion> */}
            <Element name="complaintSection" className="element">
                <div className="row">
                    <div className="col-12 p-0">
                        <section className="triangle col-12 row">
                            <h4 id="list-item-0" className="pl-2 col-md-10" style={{ alignContent: 'left' }}>Helpdesk Details</h4>
                            <div className="p-2">
                                <div className="row mb-0 toggle-switch pl-2">
                                    <label className="mr-1 mb-0">With Statement</label>
                                    <ReactSwitch
                                        onColor="#4C5A81"
                                        offColor="#6c757d"
                                        activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                                        height={20}
                                        width={48}
                                        className="inter-toggle skel-inter-toggle" id="switchStatus" checked={switchStatus}
                                        onChange={(e) => { setSwitchStatus(!switchStatus); setHelpdeskData(initialValues) }} />
                                </div>
                            </div>
                        </section>

                    </div>
                </div >
                <CreateHelpdeskForm
                    data={{
                        helpdeskData,
                        profileDetails,
                        error,
                        readOnly: !!!profileNo,
                        smartAssistance: switchStatus,
                        currentFiles,
                        ivrNo,
                        serviceCategoryLookup,
                        helpdeskTypeLookUp,
                        severityLookUp,
                        projectLookup
                    }}
                    lookups={{}}
                    stateHandler={{
                        setHelpdeskData,
                        handleClear,
                        handleSubmit,
                        setError,
                        setCurrentFiles,
                        handleOnChange
                    }}
                />
            </Element >
        </div >
    )

}
export default CreateHelpdesk;