import { isEmpty, set } from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import { array, bool, boolean, number, object, string } from 'yup';
import { AppContext } from "../AppContext";
import { daysLookUp, hoursLookUp, minuteLookUp } from "../common/util/dateUtil";
import { useHistory } from '../common/util/history';
import { get, post, put } from "../common/util/restUtil";
import { getRandomId } from "../common/util/util";
import { properties } from "../properties";
import SLADetails from './components/SLADetails';
import Alerts from './components/Alert';
import SLADefinitionMapping from './components/SLADefinitionMapping';
import SLAAlerts from './components/SLAAlerts';
import { useNavigate } from 'react-router-dom';

const CreateSlaDefinitionContainer = (props) => {
    const { proceedNextStep, nextStepCount, proceedPrevStep } = props
    const [formErrors, setFormErrors] = useState({})
    const [action, setAction] = useState(props?.props?.screenAction?.toLowerCase() ?? 'create')
    const [slaData, setSlaData] = useState({ status: 'SL_AC' })
    const inputRef = useRef()
    const [slaTypeLookUp, setSlaTypeLookUp] = useState([])
    const [durationLookUp, setDurationLookUp] = useState([])
    const [calenderLookup, setCalenderLookup] = useState([])
    const [shiftLookUp, setShiftLookUp] = useState([])
    const [frequencyTypeLookUp, setFrequencyTypeLookUp] = useState([])
    const [alertTypeLookUp, setAlertTypeLookUp] = useState([])
    const [notifyToLookUp, setNotifyToLookUp] = useState([])
    const [notifyTypeLookUp, setNotifyTypeLookUp] = useState([])
    const [statusLookUp, setStatusLookUp] = useState([])
    const [alertList, setAlertList] = useState({
        alertType: '',
        alertDays: null,
        alertHours: null,
        alertMinutes: null,
        alertInterval: '',
        alertRecurring: null,
        notifyTo: '',
        emailOthers: '',
        mobileOthers: '',
        notifyType: '',
        mailTemplateId: null,
        smsTemplateId: null,
    })
    const templateRef = useRef([])
    const [emailTemplateList, setEmailTemplateList] = useState([])
    const [smsTemplateList, setSmsTemplateList] = useState([])
    const [whatsappTemplateList, setWhatsappTemplateList] = useState([])

    const [responseAlertComponentPermission, setResponseAlertComponentPermission] = useState({
        responseAlert: {
            preBeach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false,
                isNotifyWhatsapp: false
            },
            onBreach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false,
                isNotifyWhatsapp: false
            },
            postBeach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false,
                isNotifyWhatsapp: false
            }
        }
    })
    const [resolutionAlertComponentPermission, setResolutionAlertComponentPermission] = useState({
        responseAlert: {
            preBeach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false
            },
            onBreach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false
            },
            postBeach: {
                isNotifyOthers: false,
                isNotifyEmail: false,
                isNotifySMS: false
            }
        }
    })
    const [isDisabled, setIsDisabled] = useState()
    const [deleteRowAlerts, setDeleteRowAlerts] = useState([])
    const [entityCategory, setEntityCategory] = useState([])
    const [masterLookUp, setMasterLookUp] = useState({
        WORKFLOW_MODULE: [],
        severity: [],
        interactionType: [],
        interactionCategory: [],
        serviceType: [],
        serviceCategory: [],
        helpdeskType: [],
        helpdeskCategory: [],
        channel: [],
        helpdeskStatus: [],
        // customerType: []
    })
    const [mappingPermission, setMappingPermission] = useState({
        isModuleHelpdeskEnabled: false,
        // withStatement: true
    })
    const [workflowLookUp, setWorkflowLookUp] = useState([])
    const [responseTypeLookup, setResponseTypeLookup] = useState([])
    const [responseAlertList, setResponseAlertList] = useState({})
    const [resolutionAlertList, setResolutionAlertList] = useState({})
    const [responseFormError, setResponseFormError] = useState({})
    const [resolutionFormError, setResolutionFormError] = useState()
    const history = useNavigate();

    // const slaSchema = object({
    //     slaName: string().required().label('Name'),
    //     slaType: string().required().label('Type'),
    //     entityType: string().required().label('Entity Type'),
    //     // description: string().required().label('Description'),
    //     status: string().required().label('status'),
    //     durationType: string().required().label('Working Type'),
    //     workingHours: number().when('durationType', (durationType, schema) => {
    //         const isExist = durationType.includes('DT_BUSINESS')
    //         if (isExist) {
    //             return schema.max(23, 'Maximum Working Hours is 23').required()
    //         }
    //         return schema
    //     }).nullable().label('Working Hours'),
    //     responseType: string().required().label('Automated Response'),
    //     // calendarNo: string().required().label('Calender'),
    //     // shiftNo: string().required().label('Shift'),
    //     responseDays: number().required().label('Response Duration'),
    //     responseDuration: string().required().label('Response Duration'),
    //     resolutionDays: number().required().label('Resolution Duration'),
    //     resolutionDuration: string().required().label('Resolution Duration'),
    //     // alerts: array().of(object({
    //     //     isEdit: boolean().oneOf([false]),
    //     //     alertType: string().required().label('Type'),
    //     //     alertDays: number().required().label('Days'),
    //     //     alertHours: number().required().label('Hours'),
    //     //     alertMinutes: number().when(['alertDays', 'alertHours'], (isalertDefined, schema) => {
    //     //         if (isalertDefined?.[0] === 0 && isalertDefined?.[1] === 0) {
    //     //             return number().moreThan(0, 'An alert minute is required as alert days and hours are zero.').required("Alert Minutes is required");
    //     //         }
    //     //         return schema
    //     //     }).label('alert Minutes'),
    //     //     alertFrequency: string().required().label('Frequency'),
    //     //     alertRecurring: number().when('alertFrequency', (alertFrequency, schema) => {
    //     //         if (alertFrequency.includes('FT_RECURRING')) {
    //     //             return number().moreThan(0, 'No.of Recurring cannot be Zero').required("No.of Recurring is required");
    //     //         }
    //     //         return schema
    //     //     }).nullable().label('No.of Recurring'),
    //     //     notifyTo: string().required().label('Notify To'),
    //     //     //TODO: Need to validate EMail formate 
    //     //     emailOthers: string().when('notifyTo', (notifyTo, schema) => {
    //     //         const isExist = notifyTo.every(element => ['NT_OTHERS'].includes(element))
    //     //         if (isExist) {
    //     //             return schema.required()
    //     //         }
    //     //         return schema
    //     //     }).nullable().label('email Others'),
    //     //     //TODO: Need to validate Mobile Number formate 
    //     //     mobileOthers: string().when('notifyTo', (notifyTo, schema) => {
    //     //         const isExist = notifyTo.every(element => ['NT_OTHERS'].includes(element))
    //     //         if (isExist) {
    //     //             return schema.required()
    //     //         }
    //     //         return schema
    //     //     }).nullable().label('mobile Others'),
    //     //     notifyType: string().required().label('Notify Type'),
    //     //     mailTemplateId: string().when('notifyType', (notifyType, schema) => {
    //     //         const isExist = notifyType.every(element => ['NTY_BOTH', 'NTY_EMAIL'].includes(element))
    //     //         if (isExist) {
    //     //             return schema.required()
    //     //         }
    //     //         return schema
    //     //     }).nullable().label('E-Mail Template'),
    //     //     smsTemplateId: string().when('notifyType', (notifyType, schema) => {
    //     //         const isExist = notifyType.every(element => ['NTY_BOTH', 'NTY_SMS'].includes(element))
    //     //         if (isExist) {
    //     //             return schema.required()
    //     //         }
    //     //         return schema
    //     //     }).nullable().label('SMS Template')
    //     // })).required()
    // })

    const alertFinalSchema = object().shape({
        alertType: string().required(),
        alertEntityType: string().required(),
        alertDays: number().required(),
        alertHours: number().required(),
        alertMinutes: number().required(),
        alertRecurring: string().notRequired(), // Only for POST_BRCH
        alertInterval: string().notRequired(), // Only for POST_BRCH
        notifyTo: string().required(),
        notifyType: string().required(),
        mailTemplateId: number().required(),
        smsTemplateId: number().notRequired() // Optional based on notifyType
    });


    const mappingFinalSchema = object().shape({
        channel: array().of(
            object().shape({
                label: string().required(),
                value: string().required()
            })
        ).required(),
        severity: string().required(),
        helpdeskType: string().required()
    });

    const slaSchema = object().shape({
        status: string().required(),
        slaName: string().required(),
        slaType: string().required(),
        entityType: string().required(),
        durationType: string().required(),
        calendarNo: string().required(),
        responseType: string().required(),
        responseDays: number().required(),
        responseDuration: string().required(),
        resolutionDays: number().required(),
        resolutionDuration: string().required(),
        workingHours: number().when('durationType', (durationType, schema) => {
            const isExist = durationType.includes('DT_BUSINESS')
            if (isExist) {
                return schema.max(23, 'Maximum Working Hours is 23').required()
            }
            return schema
        }).nullable().label('Working Hours'),
    });


    const slaFinalSchema = object().shape({
        status: string().required(),
        slaName: string().required(),
        slaType: string().required(),
        entityType: string().required(),
        durationType: string().required(),
        calendarNo: string().required(),
        responseType: string().required(),
        responseDays: number().required(),
        responseDuration: string().required(),
        resolutionDays: number().required(),
        resolutionDuration: string().required(),
        mapping: mappingFinalSchema.required(),
        alerts: array().of(alertFinalSchema).required()
    });

    const isHelpdesk = (entityType) => entityType === 'HELPDESK'
    const isInteraction = (entityType) => entityType === 'INTXN'

    const mappingSchema = object({
        entityType: string(),
        channel: string().required().label('Channel'),
        // channel: array().of(object({
        //     label: string().required(),
        //     value: string().required()
        // })).required().label('Channel'),
        severity: string().required().label('Severity'),
        helpdeskCategory: string().when(['entityType'], {
            is: (entityType) => isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Helpdesk Category'),
        helpdeskType: string().when(['entityType'], {
            is: (entityType) => isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Helpdesk Type'),
        interactionCategory: string().when(['entityType'], {
            is: (entityType) => isInteraction(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Interaction Category'),
        interactionType: string().when(['entityType'], {
            is: (entityType) => isInteraction(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Interaction Type'),
        serviceCategory: string().when(['entityType'], {
            is: (entityType) => isInteraction(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Service Category'),
        serviceType: string().when(['entityType'], {
            is: (entityType) => isInteraction(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Service Type'),
        // customerType: string().required()
        workflowId: number().when(['entityType'], {
            is: (entityType) => isInteraction(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('workflow'),
        helpdeskStatus: array().of(object({
            label: string().required(),
            value: string().required()
        }))
    })

    const alertSchema = object({
        alertType: string().required().label('Type'),
        alertDays: number().required().label('Days'),
        alertHours: number().required().label('Hours'),
        alertMinutes: number().required().label('Minutes'),
        alertInterval: string().required().label('Frequency'),
        notifyTo: string().required().label('Notify To'),
        // alertRecurring: alertComponentPermission?.isRecurringFrequency ? number().required().max(20).min(1).label('No.of Recurring') : number().nullable(),
        // emailOthers: alertComponentPermission?.isNotifyOthers ? string().required().label('Email Others') : string().nullable(),
        // mobileOthers: alertComponentPermission?.isNotifyOthers ? string().required().label('SMS Others') : string().nullable(),
        // notifyType: string().required().label('Notify Type'),
        // mailTemplateId: alertComponentPermission?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
        // smsTemplateId: alertComponentPermission?.isNotifySMS ? string().required().label('SMS Template') : string().nullable()
    })

    const responseAlertSchema = object({
        onBreach: object({
            mailTemplateId: responseAlertComponentPermission?.onBreach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        }),
        postBeach: object({
            alertDays: number().required().label('Days'),
            alertHours: number().required().label('Hours'),
            alertMinutes: number().required().label('Minutes'),
            alertRecurring: number().required().label('Minutes'),
            alertInterval: string().required().label('Frequency'),
            mailTemplateId: responseAlertComponentPermission?.postBeach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            smsTemplateId: responseAlertComponentPermission?.postBeach?.isNotifySMS ? string().required().label('SMS Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        }),
        preBeach: object({
            alertDays: number().required().label('Days'),
            alertHours: number().required().label('Hours'),
            alertMinutes: number().required().label('Minutes'),
            mailTemplateId: responseAlertComponentPermission?.preBeach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            smsTemplateId: responseAlertComponentPermission?.preBeach?.isNotifySMS ? string().required().label('SMS Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        })
    })

    const resolutionAlertSchema = object({
        onBreach: object({
            mailTemplateId: resolutionAlertComponentPermission?.onBreach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        }),
        postBeach: object({
            alertDays: number().required().label('Days'),
            alertHours: number().required().label('Hours'),
            alertMinutes: number().required().label('Minutes'),
            alertRecurring: number().required().label('Minutes'),
            alertInterval: string().required().label('Frequency'),
            mailTemplateId: resolutionAlertComponentPermission?.postBeach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            smsTemplateId: resolutionAlertComponentPermission?.postBeach?.isNotifySMS ? string().required().label('SMS Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        }),
        preBeach: object({
            alertDays: number().required().label('Days'),
            alertHours: number().required().label('Hours'),
            alertMinutes: number().required().label('Minutes'),
            mailTemplateId: resolutionAlertComponentPermission?.preBeach?.isNotifyEmail ? string().required().label('Email Template') : string().nullable(),
            smsTemplateId: resolutionAlertComponentPermission?.preBeach?.isNotifySMS ? string().required().label('SMS Template') : string().nullable(),
            notifyTo: string().required().label('Notify To'),
            notifyType: string().required().label('Notify Type')
        })
    })

    const validateData = async (schema, data) => {
        return new Promise((resolve, reject) => {
            schema.validate(data, { abortEarly: false }).then(function () {
                resolve({ success: true });
            }).catch(function (err) {
                let errors = {};
                err?.inner?.forEach(e => {
                    errors[e.path] = e.message;
                });
                resolve({ failure: errors });
            });
        });
    }

    useLayoutEffect(() => {
        const actiontype = props?.props?.screenAction?.toLowerCase()
        unstable_batchedUpdates(() => {
            setAction({ isCreate: actiontype === 'create', isView: actiontype === 'view', isEdit: actiontype === 'edit' })
            setIsDisabled(actiontype === 'view')
        })
    }, [props?.props?.screenAction])


    const handleAddAlert = async (e) => {
        e.preventDefault()
        const validationResponse = await validateData(alertSchema, alertList)
        if (validationResponse.success) {
            if (!alertList || isEmpty(alertList)) {
                toast.warn('Please fill required details')
                return false
            }
            if (alertList?.alertDays === 0 && alertList?.alertHours === 0 && alertList?.alertMinutes === 0) {
                toast.warn('All days, hours, and minutes cannot be zero.')
                return false
            }
            let updatedArray = slaData?.alerts
                ? [...slaData?.alerts, { ...alertList, alertUuid: getRandomId() }]
                : [{ ...alertList, alertUuid: getRandomId() }];
            setAlertList({});
            setSlaData({
                ...slaData,
                alerts: updatedArray
            });
        } else {
            setFormErrors({ ...validationResponse.failure });
            toast.error("Please fill the mandatory fields");
        }

    }

    const handleOnChange = (e, type) => {
        const { id, value } = e.target;
        unstable_batchedUpdates(() => {
            if (type) {
                setSlaData({
                    ...slaData,
                    [type]: {
                        ...(slaData[type] || {}),
                        [id]: value
                    }
                })
            } else {
                if (id === 'entityType') {
                    setMappingPermission({ ...mappingPermission, isModuleHelpdeskEnabled: ['HELPDESK'].includes(value) })
                }
                setSlaData({
                    ...slaData,
                    [id]: value
                });
            }
            setFormErrors({ ...formErrors, [id]: '' });
        });
    };


    const getMasterLookup = useCallback(() => {
        get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=SLA_TYPE,DURATION_TYPE,FREQUENCY_TYPE,ALERT_TYPE,NOTIFY_TO,NOTIFY_TYPE,SLA_STATUS,WORKFLOW_MODULE,SEVERITY,INTXN_TYPE,INTXN_CATEGORY,SERVICE_TYPE,PROD_SUB_TYPE,HELPDESK_TYPE,HELPDESK_CATEGORY,HELPDESK_SOURCE,HELPDESK_STATUS,RESOLUTION_TYPE`)
            .then((response) => {
                if (response?.data) {
                    unstable_batchedUpdates(() => {
                        setSlaTypeLookUp(response?.data?.SLA_TYPE ?? [])
                        setDurationLookUp(response?.data?.DURATION_TYPE ?? [])
                        setFrequencyTypeLookUp(response?.data?.FREQUENCY_TYPE ?? [])
                        setAlertTypeLookUp(response?.data?.ALERT_TYPE ?? [])
                        setNotifyToLookUp(response?.data?.NOTIFY_TO ?? [])
                        setNotifyTypeLookUp(response?.data?.NOTIFY_TYPE ?? [])
                        setStatusLookUp(response?.data?.SLA_STATUS ?? [])
                        setEntityCategory(response?.data?.WORKFLOW_MODULE?.filter(ele => ele?.mapping?.isSla) ?? [])
                        setResponseTypeLookup(response?.data?.RESOLUTION_TYPE ?? [])
                        setMasterLookUp({
                            helpdeskType: response?.data['HELPDESK_TYPE'] ?? [],
                            helpdeskCategory: response?.data['HELPDESK_CATEGORY'] ?? [],
                            channel: response?.data['HELPDESK_SOURCE'] ?? [],
                            helpdeskStatus: response?.data['HELPDESK_STATUS'] ?? [],
                            serviceType: response?.data['SERVICE_TYPE'] ?? [],
                            serviceCategory: response?.data['PROD_SUB_TYPE'] ?? [],
                            severity: response?.data['SEVERITY'] ?? [],
                            interactionType: response?.data['INTXN_TYPE'] ?? [],
                            entityCategory: response?.data?.WORKFLOW_MODULE?.filter(ele => ele?.mapping?.isSla) ?? []
                        })
                    })
                }
            })
            .catch((error) => console.error(error))
        get(`${properties.MASTER_API}/calendar/search`)
            .then((resp) => {
                if (resp.data) {
                    setCalenderLookup(resp.data)
                }
            }).catch(error => console.error(error))

        get(`${properties.MASTER_API}/shifts`)
            .then((resp) => {
                if (resp.data) {
                    setShiftLookUp(resp.data)
                }
            }).catch(error => console.error(error))

        post(`${properties?.MASTER_API}/template/search`, { eventType: 'ET_BREACH', isActive: true })
            .then((response) => {
                const { data } = response ?? [];
                if (!isEmpty(data) && Array.isArray(data)) {
                    templateRef.current = response.data
                    const EmailTemplate = response?.data?.filter((x) => x?.categoryDesc?.code === 'TC_EMAIL')
                    const SMSTemplate = response?.data?.filter((x) => x?.categoryDesc?.code === 'TC_SMS')
                    const whatsAppTemplate = response?.data?.filter((x) => x?.categoryDesc?.code === 'TC_WHATSAPP')

                    setEmailTemplateList(EmailTemplate)
                    setSmsTemplateList(SMSTemplate)
                    setWhatsappTemplateList(whatsAppTemplate)
                }
            }).catch(error => console.error(error))
    }, [])

    useEffect(() => {
        getMasterLookup()
    }, [getMasterLookup])

    const convertArrayToObject = (arr) => {
        return arr.reduce((acc, alert) => {
            const { alertType, ...rest } = alert;
            acc[alertType] = rest;
            return acc;
        }, {});
    };

    const query = new URLSearchParams(props?.location?.search);
    const slaCode = query?.get('slaCode');
    const getSlaDefinition = useCallback(() => {
        if (slaCode) {
            post(`${properties.SLA_API}/search?limit=1&page=0`, { slaCode, contain: ['ALERT', 'MAPPING'] })
                .then((response) => {
                    if (response?.data) {
                        const { rows } = response?.data
                        const data = rows?.[0] || {}
                        const slaDetails = {
                            slaName: data?.slaName ?? '',
                            slaCode: data?.slaCode ?? '',
                            slaType: data?.slaType?.code ?? '',
                            // description: data?.description ?? '',
                            entityType: data?.entityType?.code ?? '',
                            status: data?.status?.code ?? '',
                            durationType: data?.durationType?.code ?? '',
                            calendarNo: data?.calendarNo ?? '',
                            // shiftNo: data?.shiftNo ?? '',
                            responseType: data?.responseType?.code ?? '',
                            responseDays: data?.responDurationDays ?? '',
                            workingHours: data?.workingHours ?? null,
                            responseDuration: (data?.responDurationHours ?? '00') + ':' + (data?.responDurationMinutes ?? '00'),
                            // responDurationHours: data?.responDurationHours ?? '',
                            resolutionDays: data?.resolDurationDays ?? '',
                            resolutionDuration: (data?.resolDurationHours ?? '00') + ':' + (data?.resolDurationMinutes ?? '00'),
                            holidayFlag: data?.holidayFlag ?? '',
                            weekendFlag: data?.weekendFlag ?? '',
                            mapping: {
                                slaMappingId: data?.mapping?.slaMappingId ?? '',
                                slaMappingNo: data?.mapping?.slaMappingNo ?? '',
                                severity: data?.mapping?.severity?.code ?? '',
                                channel: data?.mapping?.channel?.code ?? '',
                                helpdeskType: data?.mapping?.helpdeskType?.code ?? '',
                            },
                            alerts: data?.alerts?.map((x) => ({
                                alertType: x?.alertType?.code === 'AT_PRE_BRCH' ? 'preBeach' : x?.alertType?.code === 'AT_POST_BRCH' ? 'postBeach' : 'onBreach',
                                alertEntityType: x?.alertEntityType ?? '',
                                slaAlertListUuid: x?.slaAlertListUuid,
                                alertDays: x?.alertDays ?? null,
                                alertHours: x?.alertHours ?? null,
                                alertMinutes: x?.alertMinutes ?? null,
                                alertInterval: x?.alertInterval ?? null,
                                alertRecurring: x?.alertRecurring ?? null,
                                notifyTo: x?.notifyTo?.code ?? '',
                                // emailOthers: x?.emailOthers ?? '',
                                // mobileOthers: x?.mobileOthers ?? '',
                                notifyType: x?.notifyType?.code ?? '',
                                mailTemplateId: x?.mailTemplateId ?? null,
                                smsTemplateId: x?.smsTemplateId ?? null,
                                whatsAppTemplateId: x?.whatsAppTemplateId ?? null
                            }) || [])
                        }
                        inputRef.current = slaDetails
                        setMappingPermission({ ...mappingPermission, isModuleHelpdeskEnabled: ['HELPDESK'].includes(data?.entityType?.code) })
                        setSlaData(slaDetails)

                        const filterdResolutionAlert = slaDetails?.alerts?.filter((ele) => ele.alertEntityType === 'RESOLUTION')
                        const filterdResponseAlert = slaDetails?.alerts?.filter((ele) => ele.alertEntityType === 'RESPONSE')

                        const resolutionAlert = convertArrayToObject(filterdResolutionAlert)
                        const responseAlert = convertArrayToObject(filterdResponseAlert)

                        setResolutionAlertList(resolutionAlert)
                        setResponseAlertList(responseAlert)
                    }
                }).catch(error => console.error(error))
        }
    }, [slaCode])

    // console.log('resolutionAlertList', resolutionAlertList)
    console.log('responseAlertList', responseAlertList)

    useEffect(() => {
        getSlaDefinition()
    }, [getSlaDefinition])


    const clearItem = (e) => {
        if (e) { e.preventDefault() }
        setAlertList({})
        setSlaData({})
        setResponseAlertList({})
        setResolutionAlertList({})
        setFormErrors({})
    }

    const transformAlertList = (alertList, alertEntityType) => {
        return Object.keys(alertList).map(key => ({
            alertType: key === 'preBeach' ? 'AT_PRE_BRCH' : key === 'postBeach' ? 'AT_POST_BRCH' : 'AT_ON_BRCH',
            alertEntityType,
            ...alertList[key]
        }));
    };

    // const onSubmit = async (e) => {
    //     if (e) { e.preventDefault() }
    //     let responseAlertArray = isEmpty(responseAlertList) ? [] : transformAlertList(responseAlertList, 'RESPONSE');
    //     let resolutionAlertArray = isEmpty(resolutionAlertList) ? [] : transformAlertList(resolutionAlertList, 'RESOLUTION');

    //     let requestBody = {
    //         ...slaData,
    //         alerts: [...resolutionAlertArray, ...responseAlertArray]
    //     };

    //     const validationResponse = await validateData(slaSchema, slaData)
    //     if (validationResponse.success) {
    //         if (slaData?.durationDays === 0 && slaData?.durationHours === 0 && slaData?.durationMinutes === 0) {
    //             toast.warn('All days, hours, and minutes cannot be zero.')
    //             return false
    //         }
    //         // const finalAlertList = (requestBody?.alerts?.filter((x) => x.alertId) || [])?.map(({ alertId, ...rest }) => rest)
    //         if (action?.isCreate) {
    //             const finalAlertList = (requestBody?.alerts?.filter((x) => x.alertUuid) || [])
    //             if (!finalAlertList || (Array.isArray(finalAlertList) && finalAlertList.length === 0)) {
    //                 toast.warn('Please add atleast one Breach Alert')
    //                 return false
    //             }
    //             requestBody.alerts = finalAlertList
    //             post(`${properties.SLA_API}/create`, requestBody)
    //                 .then((resp) => {
    //                     if (resp.data) {
    //                         toast.success('SLA Definition created Successfully.')
    //                         clearItem()
    //                     }
    //                 }).catch(error => console.error(error))
    //         } else if (action?.isEdit && slaData?.slaCode) {

    //             if (isEmpty(requestBody?.alerts)) {
    //                 toast.warn('Please add atleast one Breach Alert')
    //                 return false
    //             }

    //             if (deleteRowAlerts && Array.isArray(deleteRowAlerts) && deleteRowAlerts?.length > 0) {
    //                 const deleteRequests = deleteRowAlerts.map(ele => ({ slaAlertListUuid: ele?.slaAlertListUuid }));
    //                 post(`${properties.SLA_API}/delete`, { type: 'alert', list: deleteRequests })
    //                     .then((resp) => {
    //                     }).catch((error) => console.error(error))
    //             }
    //             // requestBody.alerts = requestBody?.alerts?.map((isEdit, ...rest) => rest)
    //             put(`${properties.SLA_API}/update/${slaData?.slaCode}`, requestBody)
    //                 .then((resp) => {
    //                     if (resp.data) {
    //                         toast.success('SLA Definition updated Successfully.')
    //                         clearItem()
    //                         history("/my-workspace")
    //                     }
    //                 }).catch(error => console.error(error))
    //         }
    //     } else {
    //         setFormErrors({ ...validationResponse.failure ?? {} })
    //         toast.error("Please fill the mandatory fields");
    //     }
    // } 

    const onSubmit = async (e) => {
        if (e) { e.preventDefault() }
        let responseAlertArray = isEmpty(responseAlertList) ? [] : transformAlertList(responseAlertList, 'RESPONSE');
        let resolutionAlertArray = isEmpty(resolutionAlertList) ? [] : transformAlertList(resolutionAlertList, 'RESOLUTION');

        let requestBody = {
            ...slaData,
            alerts: [...resolutionAlertArray, ...responseAlertArray]
        }

        if (!requestBody) {
            toast.warn('Please fill the mandatory fields')
            return false
        }

        if (action?.isCreate) {
            post(`${properties.SLA_API}/create`, requestBody)
                .then((resp) => {
                    if (resp.data) {
                        toast.success('SLA Definition created Successfully.')
                        clearItem()
                        history('/sla')
                    }
                }).catch(error => console.error(error))

        } else if (action?.isEdit && slaData?.slaCode) {
            put(`${properties.SLA_API}/update/${slaData?.slaCode}`, requestBody)
                .then((resp) => {
                    if (resp.data) {
                        toast.success('SLA Definition updated Successfully.')
                        clearItem()
                        history("/sla")
                    }
                }).catch(error => console.error(error))
        }
    }



    const OnNext = async () => {
        if (nextStepCount === 0) {
            const validationResponse = await validateData(slaSchema, slaData)
            if (validationResponse.success) {
                proceedNextStep(nextStepCount)
            } else {
                setFormErrors({ ...validationResponse.failure ?? {} })
                toast.error("Please fill the mandatory fields")
            }
        } else if (nextStepCount === 1) {
            const validationResponse = await validateData(mappingSchema, slaData?.mapping ?? {})
            if (validationResponse.success) {
                proceedNextStep(nextStepCount)
            } else {
                setFormErrors({ ...validationResponse.failure ?? {} })
                toast.error("Please fill the mandatory fields")
            }
        } else if (nextStepCount === 2) {
            // proceedNextStep(nextStepCount)
            const validationResponse = await validateData(responseAlertSchema, responseAlertList ?? {})
            // console.log('validationResponse', validationResponse)
            if (validationResponse.success) {
                proceedNextStep(nextStepCount)
            } else {
                setFormErrors({ ...validationResponse.failure ?? {} })
                toast.error("Please fill the mandatory fields")
            }
        } else if (nextStepCount === 3) {
            // proceedNextStep(nextStepCount)
            const validationResponse = await validateData(resolutionAlertSchema, resolutionAlertList ?? {})
            if (validationResponse.success) {
                proceedNextStep(nextStepCount)
            } else {
                setFormErrors({ ...validationResponse.failure ?? {} })
                toast.error("Please fill the mandatory fields")
            }
        }
    }

    const OnPrevious = () => {
        proceedPrevStep(nextStepCount)
    }

    const contextProvider = {
        data: {
            formErrors,
            slaData,
            slaTypeLookUp,
            durationLookUp,
            calenderLookup,
            shiftLookUp,
            daysLookUp,
            hoursLookUp,
            minuteLookUp,
            frequencyTypeLookUp,
            alertTypeLookUp,
            notifyToLookUp,
            notifyTypeLookUp,
            statusLookUp,
            alertList,
            emailTemplateList,
            smsTemplateList,
            responseAlertComponentPermission,
            isDisabled,
            action,
            deleteRowAlerts,
            entityCategory,
            responseTypeLookup,
            masterLookUp,
            mappingPermission,
            workflowLookUp,
            whatsappTemplateList
        },
        refs: { inputRef, templateRef },
        handlers: {
            setFormErrors,
            handleOnChange,
            setAlertList,
            setSlaData,
            setSmsTemplateList,
            setEmailTemplateList,
            clearItem,
            setResponseAlertComponentPermission,
            handleAddAlert,
            setIsDisabled,
            setDeleteRowAlerts,
            setWhatsappTemplateList
        }
    }

    return (
        <AppContext.Provider value={contextProvider}>
            <div className="row px-3">
                <div className="col-12">
                    <div className="tabbable-responsive">
                        {nextStepCount === 0 && <SLADetails />}
                        {nextStepCount === 1 && <SLADefinitionMapping />}
                        {nextStepCount === 2 && <SLAAlerts data={{ alertComponentPermission: responseAlertComponentPermission, alertList: responseAlertList, formErrors: responseFormError }} handlers={{ setAlertComponentPermission: setResponseAlertComponentPermission, setAlertList: setResponseAlertList, setFormErrors: setResponseFormError }} />}
                        {nextStepCount === 3 && <SLAAlerts data={{ alertComponentPermission: resolutionAlertComponentPermission, alertList: resolutionAlertList, formErrors: resolutionFormError }} handlers={{ setAlertComponentPermission: setResolutionAlertComponentPermission, setAlertList: setResolutionAlertList, setFormErrors: setResolutionFormError }} />}
                        {<div className="d-flex flex-justify-center w-100 mt-2">
                            {nextStepCount > 0 && <button type="button" className="skel-btn-submit mr-2" onClick={OnPrevious}>
                                Back
                            </button>}
                            {action?.isCreate && <button type="button" hidden={isDisabled} className="skel-btn-cancel" onClick={clearItem}>
                                Clear
                            </button>}
                            {nextStepCount <= 2 && <button type="button" className="skel-btn-submit ml-2" onClick={OnNext}>
                                Next
                            </button>}
                            {nextStepCount === 3 && <button type="button" hidden={isDisabled} className="skel-btn-submit ml-2" onClick={onSubmit}>
                                Submit
                            </button>}
                        </div>}
                    </div>
                </div>
            </div>
        </AppContext.Provider>
    )
}
export default CreateSlaDefinitionContainer;