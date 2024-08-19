import { isEmpty } from "ol/extent"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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

const SLADefinitionMapping = (props) => {

    const { slaData } = props?.data
    const [slaLookUp, setSlaLookUp] = useState([])
    const [slaMappingData, setSlaMappingData] = useState({
        templateName: '',
        slaType: '',
        slaId: '',
        entityType: '',
        severity: '',
        interactionType: '',
        interactionCategory: '',
        // withStatement: 'Y',
        serviceCategory: '',
        serviceType: '',
        requestId: [],
        problemCode: [],
        helpdeskType: '',
        helpdeskCategory: '',
        workflowId: '',
        status: 'AC',
        // customerType: ''
    })
    const [formErrors, setFormErrors] = useState({})
    const [masterLookUp, setMasterLookUp] = useState({
        slaType: [],
        WORKFLOW_MODULE: [],
        severity: [],
        interactionType: [],
        interactionCategory: [],
        orderCategory: [],
        orderType: [],
        serviceType: [],
        serviceCategory: [],
        // customerType: []
    })
    const [mappingPermission, setMappingPermission] = useState({
        isModuleHelpdeskEnabled: false,
        // withStatement: true
    })
    // eslint-disable-next-line no-unused-vars
    const [workflowLookUp, setWorkflowLookUp] = useState([])
    const [requestStatement, setRequestStatement] = useState([])
    let actiontype = 'view'
    const ActionType = useMemo(() => ({
        CREATE: 'create',
        VIEW: 'view',
        EDIT: 'edit'
    }), [])
    const history = useHistory()

    const [action, setAction] = useState(ActionType[actiontype.toUpperCase()]);
    const [isDisabled, setIsDisabled] = useState({
        templateName: action === ActionType.VIEW,
        slaType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        slaId: [ActionType.EDIT, ActionType.VIEW].includes(action),
        entityType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        severity: [ActionType.EDIT, ActionType.VIEW].includes(action),
        interactionType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        interactionCategory: [ActionType.EDIT, ActionType.VIEW].includes(action),
        // withStatement: [ActionType.EDIT, ActionType.VIEW].includes(action),
        serviceCategory: [ActionType.EDIT, ActionType.VIEW].includes(action),
        serviceType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        // requestId: action === ActionType.VIEW,
        // problemCode: action === ActionType.VIEW,
        helpdeskType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        workflowId: [ActionType.EDIT, ActionType.VIEW].includes(action),
        status: [ActionType.CREATE, ActionType.VIEW].includes(action),
        helpdeskCategory: [ActionType.CREATE, ActionType.VIEW].includes(action)
        // customerType: [ActionType.EDIT, ActionType.VIEW].includes(action),
    })
    const allEntityTypesRef = useRef({});
    const isWorkflowCheckRef = useRef(false)

    // const needsAdditionalFields = (entityType, withStatement) => !isHelpdesk(entityType)

    const slaMapppingSchema = object({
        templateName: string().required().label('Template Name'),
        slaType: string().required().label('SLA Type'),
        slaId: string().required().label('SLA Definition'),
        entityType: string().required().label('Entity Type'),
        // withStatement: string().required().label('Entity Type'),
        // requestId: array().of(object({
        //     label: string().required(),
        //     value: string().required()
        // })).when(['withStatement'], {
        //     is: (withStatement) => withStatement === 'Y',
        //     then: (schema) => schema.required(),
        //     otherwise: (schema) => schema
        // }).label('Request Statement'),
        severity: string().required().label('Severity'),
        // problemCode: array().of(object({
        //     label: string().required(),
        //     value: string().required()
        // })).when(['withStatement'], {
        //     is: (withStatement) => withStatement === 'N',
        //     then: (schema) => schema.required(),
        //     otherwise: (schema) => schema
        // }).label('Problem Code'),
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
            is: (entityType) => !isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Interaction Category'),
        interactionType: string().when(['entityType'], {
            is: (entityType) => !isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Interaction Type'),
        serviceCategory: string().when(['entityType'], {
            is: (entityType) => !isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Service Category'),
        serviceType: string().when(['entityType'], {
            is: (entityType) => !isHelpdesk(entityType),
            then: (schema) => schema.required(),
            otherwise: (schema) => schema
        }).label('Service Type'),
        // customerType: string().required()
        // workflowId: string().when('entityType', (entityType, schema) => {
        //     if (!entityType.includes('HELPDESK')) {
        //         return schema.required()
        //     }
        // }).label('workflow')
    })

    const filterAndMap = (payload, key, value, description) => {
        if (!Array.isArray(payload) || !key || !value) {
            return []
        }
        if (!description) {
            const filteredObject = payload
                ?.filter((ele) => ele[key] === value)
            return removeDuplicateObjects(filteredObject, key)
        } else {
            const filteredObject = payload
                ?.filter((ele) => ele[key] === value)
                ?.map((item) => item[description]);
            return removeDuplicateObjects(filteredObject, 'code')
        }
    }

    const handleOnChange = (e) => {
        // if (e) { e.preventDefault() }
        const { id, value, entityType = '' } = e.target
        let updatedMapping = { ...slaMappingData, [id]: value };
        let filteredInteractionType, filteredServiceCategory, filteredServiceType, filteredProblemCode, lookupUpdateNeeded = false;
        switch (id) {
            case 'slaType':
                getSlaLookUp({ [id]: value })
                updatedMapping = { ...slaMappingData, [id]: value, slaId: '' };
                break;
            case 'slaId':
                updatedMapping = { ...slaMappingData, [id]: value, entityType: entityType, interactionCategory: '', interactionType: '', serviceCategory: '', serviceType: '', 'problemCode': [], 'helpdeskType': '', 'workflowId': '', 'requestId': [] }
                unstable_batchedUpdates(() => {
                    // getStatement({ entityType: entityType })
                    getProblemCode({ entityType: entityType })
                    setMappingPermission({ ...mappingPermission, isModuleHelpdeskEnabled: ['HELPDESK'].includes(entityType) })
                    setWorkflowLookUp([])
                })
                break;
            // case 'withStatement':
            //     updatedMapping = { ...slaMappingData, [id]: value, requestId: [], interactionCategory: '', interactionType: '', serviceCategory: '', serviceType: '', 'problemCode': [], 'helpdeskType': '', 'workflowId': '' }
            //     setMappingPermission({ ...mappingPermission, withStatement: value === 'Y' })
            //     setWorkflowLookUp([])
            //     break;
            case 'interactionCategory':
                filteredInteractionType = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'intxnCategory', value, 'intxnTypeDesc');
                updatedMapping = { ...slaMappingData, [id]: value, interactionType: '', serviceCategory: '', serviceType: '', 'problemCode': [] }
                isWorkflowCheckRef.current = true
                lookupUpdateNeeded = true
                break;
            case 'interactionType':
                isWorkflowCheckRef.current = true
                filteredServiceCategory = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'intxnType', value, 'serviceCategoryDesc');
                updatedMapping = { ...slaMappingData, [id]: value, serviceCategory: '', serviceType: '', 'problemCode': [] }
                lookupUpdateNeeded = true
                break;
            case 'serviceCategory':
                isWorkflowCheckRef.current = true
                filteredServiceType = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'serviceCategory', value, 'serviceTypeDesc');
                updatedMapping = { ...slaMappingData, [id]: value, serviceType: '', 'problemCode': [] }
                lookupUpdateNeeded = true
                break;
            case 'serviceType':
                isWorkflowCheckRef.current = true
                filteredProblemCode = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'serviceType', value, null);
                updatedMapping = { ...slaMappingData, [id]: value, problemCode: '' }
                lookupUpdateNeeded = true
                break;
            // case 'requestId':
            //     isWorkflowCheckRef.current = true
            //     const filteredStatement = filterAndMap(requestStatement ?? [], 'code', value)?.[0]
            //     updatedMapping = {
            //         ...slaMappingData, [id]: value,
            //         helpdeskType: filteredStatement?.helpdeskType ?? '',
            //         serviceCategory: filteredStatement?.serviceCategory ?? '',
            //         serviceType: filteredStatement?.serviceType ?? '',
            //         interactionType: filteredStatement?.intxnType ?? '',
            //         interactionCategory: filteredStatement?.intxnCategory
            //     }
            //     break;
            default:
                break;
        }

        unstable_batchedUpdates(() => {
            if (lookupUpdateNeeded) {
                setMasterLookUp((prevState) => ({
                    ...prevState,
                    interactionType: filteredInteractionType ?? [],
                    serviceCategory: filteredServiceCategory ?? [],
                    serviceType: filteredServiceType ?? [],
                    problemCode: filteredProblemCode ?? prevState?.problemCode
                }))
            }
            setFormErrors({ ...formErrors, [id]: '' })
            setSlaMappingData({ ...slaMappingData, ...updatedMapping })
        })
    }

    const getMasterLookup = useCallback(() => {
        get(`${properties.MASTER_API}/lookup?searchParam=code_type&valueParam=SLA_TYPE,WORKFLOW_MODULE,SEVERITY,INTXN_TYPE,INTXN_CATEGORY,ORDER_CATEGORY,ORDER_TYPE,SERVICE_TYPE,PROD_SUB_TYPE,YES_NO,HELPDESK_TYPE,CUSTOMER_TYPE,HELPDESK_CATEGORY,HELPDESK_SOURCE,HELPDESK_STATUS`)
            .then((response) => {
                if (response?.data) {
                    const { data } = response
                    unstable_batchedUpdates(() => {
                        allEntityTypesRef.current = { ...allEntityTypesRef.current, ...data }
                        setMasterLookUp((prevState) => ({
                            ...prevState,
                            slaType: data['SLA_TYPE'] ?? [],
                            // interactionCategory: data['INTXN_CATEGORY'] ?? [],
                            entityCategory: data['WORKFLOW_MODULE'] ?? [],
                            severity: data['SEVERITY'] ?? [],
                            interactionType: data['INTXN_TYPE'] ?? [],
                            orderCategory: data['ORDER_CATEGORY'] ?? [],
                            orderType: data['ORDER_TYPE'] ?? [],
                            serviceType: data['SERVICE_TYPE'] ?? [],
                            serviceCategory: data['PROD_SUB_TYPE'] ?? [],
                            condition: data['YES_NO'] ?? [],
                            helpdeskType: data['HELPDESK_TYPE'] ?? [],
                            helpdeskCategory: data['HELPDESK_CATEGORY'] ?? [],
                            channel: data['HELPDESK_SOURCE'] ?? [],
                            helpdeskStatus: data['HELPDESK_STATUS'] ?? []
                            // customerType: data['CUSTOMER_TYPE'] ?? []
                        }))
                    })
                }
            })
            .catch((error) => console.error(error))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getProblemCode = useCallback((props) => {
        if (props?.entityType === 'HELPDESK') {
            post(`${properties.HELPDESK_API}/lookup?isAll=true`)
                .then((resp) => {
                    if (resp.data) {
                        allEntityTypesRef.current.problemCode = resp?.data
                        // const uniqueHelpdeskType = Array.from(new Set(resp?.data?.map(item => JSON.stringify(item.helpdeskTypeDesc)))).map(JSON.parse);
                        const filteredRows = removeDuplicateObjects(resp?.data, 'helpdeskProblemCode')
                        setMasterLookUp((prevState) => ({ ...prevState, problemCode: filteredRows }))
                    }
                }).catch(error => console.error(error))

        } else {
            post(`${properties.INTERACTION_API}/lookup`)
                .then((resp) => {
                    if (resp.data) {
                        allEntityTypesRef.current.problemCode = resp?.data
                        const uniqueIntxnCategoryDesc = Array.from(new Set(resp?.data?.map(item => JSON.stringify(item.intxnCategoryDesc)))).map(JSON.parse)
                        setMasterLookUp((prevState) => ({ ...prevState, problemCode: resp?.data, interactionCategory: uniqueIntxnCategoryDesc ?? [] }))
                    }
                }).catch(error => console.error(error))
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getSlaLookUp = useCallback((props) => {
        post(`${properties.SLA_API}/search`, { ...props, isAll: true, limit: 1000, page: 0 })
            .then((resp) => {
                setSlaLookUp(resp?.data?.rows ?? [])
            })
            .catch(error => console.error(error))
    }, [])

    // const getWorkflow = useCallback((props) => {
    //     if (isWorkflowCheckRef?.current) {
    //         post(`${properties.WORKFLOW_API}/mapped-workflow-list?page=0&limit=10&isAll=true`, { ...props, isAll: true })
    //             .then((resp) => {
    //                 if (resp.data) {
    //                     isWorkflowCheckRef.current = false
    //                     const rows = removeDuplicateObjects(resp.data.rows ?? [], 'workflowId')
    //                     setWorkflowLookUp(rows)
    //                 }
    //             }).catch(error => console.error(error))
    //     }
    // }, [])

    const getStatement = useCallback((props) => {
        if (props?.entityType === 'HELPDESK') {
            get(`${properties.HELPDESK_API}/get-helpdesk-statements`)
                .then((resp) => {
                    if (resp.data.count > 0) {
                        const rows = resp.data.rows.map((item) => ({ ...item, code: item.helpdeskStatementId, description: item.helpdeskStatement })) || []
                        setRequestStatement(rows)
                    }
                }).catch(error => console.error(error))

        } else if (['INTXN'].includes(props?.entityType)) {
            get(`${properties.KNOWLEDGE_API}/get-smartassistance-list`)
                .then((resp) => {
                    if (resp.data) {
                        const rows = resp?.data?.map((item) => ({ ...item, code: item.requestId, description: item.requestStatement }))
                        setRequestStatement(rows)
                    }
                }).catch(error => console.error(error))

        }
    }, [])

    // useEffect(() => {
    //     const isAllAvailable = (slaMappingData?.entityType && slaMappingData?.interactionCategory
    //         && slaMappingData?.interactionType && slaMappingData?.serviceType
    //         && slaMappingData?.serviceCategory) ?? (slaMappingData?.entityType && slaMappingData?.orderCategory
    //             && slaMappingData?.orderType && slaMappingData?.serviceType
    //             && slaMappingData?.serviceCategory) ?? false

    //     if (isAllAvailable) {
    //         let payload = {
    //             moduleName: slaMappingData?.entityType ?? '',
    //             serviceType: slaMappingData?.serviceType ?? '',
    //             interactionType: slaMappingData?.interactionType ?? '',
    //             serviceCategory: slaMappingData?.serviceCategory ?? '',
    //             interactionCategory: slaMappingData?.interactionCategory ?? '',
    //             orderCategory: slaMappingData?.orderCategory ?? '',
    //             orderType: slaMappingData?.orderType ?? ''
    //         }
    //         payload = removeEmptyKey(payload)
    //         getWorkflow(payload)
    //     }
    // }, [getWorkflow, slaMappingData])

    useEffect(() => {
        getMasterLookup()
    }, [getMasterLookup])

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

    const onSubmit = async (e) => {
        const validationResponse = await validateData(slaMapppingSchema, slaMappingData)
        if (validationResponse.success) {
            if (action === ActionType.CREATE) {
                let requestBody = {
                    slaId: slaMappingData?.slaId ?? '',
                    templateName: slaMappingData?.templateName ?? '',
                    entityType: slaMappingData?.entityType ?? '',
                    severity: slaMappingData?.severity ?? '',
                    requestId: slaMappingData?.requestId?.map((item) => item.value) ?? '',
                    problemCode: slaMappingData?.problemCode?.map((item) => item.value) ?? [],
                    // status: 'AC',
                    // customerType: slaMappingData?.customerType ?? ''
                }
                requestBody = removeEmptyKey(requestBody)
                requestBody?.problemCode?.length === 0 && delete requestBody?.problemCode
                requestBody?.requestId?.length === 0 && delete requestBody?.requestId

                post(`${properties.SLA_API}/mapping/create`, { ...requestBody })
                    .then((resp) => {
                        if (resp.status === 200) {
                            toast.success('SLA Mapping is created Successfully')
                            history("/sla-map-search")
                        }
                    }).catch(error => console.error(error))
            } else if (action === ActionType.EDIT && slaMappingData.slaMappingNo) {
                Swal.fire({
                    title: "Are you sure?",
                    text: "You won't be able to revert this!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, Save it!"
                }).then((result) => {
                    if (result.isConfirmed) {
                        let requestBody = {
                            slaId: slaMappingData?.slaId ?? '',
                            templateName: slaMappingData?.templateName ?? '',
                            entityType: slaMappingData?.entityType ?? '',
                            severity: slaMappingData?.severity ?? '',
                            requestId: slaMappingData?.requestId?.map((item) => item.value) ?? '',
                            problemCode: slaMappingData?.problemCode?.map((item) => item.value) ?? [],
                            status: slaMappingData?.status,
                            // customerType: slaMappingData?.customerType ?? ''
                        }
                        requestBody = removeEmptyKey(requestBody)
                        requestBody?.problemCode?.length === 0 && delete requestBody?.problemCode
                        requestBody?.requestId?.length === 0 && delete requestBody?.requestId
                        put(`${properties.SLA_API}/mapping/update/${slaMappingData.slaMappingNo}`, { ...requestBody })
                            .then((resp) => {
                                if (resp.status === 200) {
                                    toast.success('SLA Mapping is Updated Successfully')
                                    history("/sla-map-search")
                                }
                            }).catch(error => console.error(error))
                    }
                })
            }
        } else {
            setFormErrors({ ...validationResponse.failure })
            toast.error("Please fill the mandatory fields")
        }
    }

    const clearItem = () => {
        unstable_batchedUpdates(() => {
            setSlaLookUp([])
            setSlaMappingData({
                templateName: '',
                slaType: '',
                slaId: '',
                entityType: '',
                severity: '',
                interactionType: '',
                interactionCategory: '',
                // withStatement: 'Y',
                serviceCategory: '',
                serviceType: '',
                // requestId: [],
                // problemCode: [],
                helpdeskType: '',
                workflowId: '',
                status: 'AC',
                // customerType: ''
            })
            setFormErrors({ ...{} })
            setMappingPermission({
                isModuleHelpdeskEnabled: false,
                // withStatement: true
            })
            setMasterLookUp({
                slaType: allEntityTypesRef.current['SLA_TYPE'] ?? [],
                entityCategory: allEntityTypesRef.current['WORKFLOW_MODULE'] ?? [],
                severity: allEntityTypesRef.current['SEVERITY'] ?? [],
                interactionType: allEntityTypesRef.current['INTXN_TYPE'] ?? [],
                orderCategory: allEntityTypesRef.current['ORDER_CATEGORY'] ?? [],
                orderType: allEntityTypesRef.current['ORDER_TYPE'] ?? [],
                serviceType: allEntityTypesRef.current['SERVICE_TYPE'] ?? [],
                serviceCategory: allEntityTypesRef.current['PROD_SUB_TYPE'] ?? [],
                condition: allEntityTypesRef.current['YES_NO'] ?? [],
                helpdeskType: allEntityTypesRef.current['HELPDESK_TYPE'] ?? [],
                // customerType: allEntityTypesRef.current['CUSTOMER_TYPE'] ?? []
            })
            setRequestStatement([])
            isWorkflowCheckRef.current = false
        })
    }

    const query = new URLSearchParams(props?.location?.search)
    const slaMappingNo = query?.get('slaMappingNo')
    const getSlaMapping = useCallback(() => {
        if (slaMappingNo) {
            post(`${properties.SLA_API}/mapping/search`, {
                slaMappingNo,
                isActive: true,
                contain: [
                    "STATEMENT",
                    "PROBLEM_CODE"
                ]
            })
                .then((response) => {
                    const data = response?.data?.rows?.[0] || {}
                    if (!isEmpty(data)) {
                        const problemCodeDetails = data?.problemCode?.[0] ?? {}
                        unstable_batchedUpdates(() => {
                            setSlaMappingData({
                                slaMappingNo: data?.slaMappingNo,
                                templateName: data?.templateName ?? '',
                                slaType: data?.slaDetails?.slaType,
                                slaId: data?.slaId ?? '',
                                entityType: data?.slaDetails?.entityType ?? '',
                                status: data?.status?.code ?? '',
                                severity: data?.severity?.code ?? '',
                                interactionType: problemCodeDetails?.intxnType?.code ?? '',
                                interactionCategory: problemCodeDetails?.intxnCategory?.code ?? '',
                                // withStatement: data?.problemCode.length > 0 ? 'N' : 'Y',
                                serviceCategory: problemCodeDetails?.serviceCategory?.code ?? '',
                                serviceType: problemCodeDetails?.serviceType?.code ?? '',
                                // requestId: data?.requestStatement?.map((ele) => ({ label: ele.requestStatement, value: ele.requestId })) || [],
                                // problemCode: data?.problemCode?.map((ele) => ({ label: ele?.problemCode?.description, value: ele?.probCodeMapId })),
                                helpdeskType: problemCodeDetails?.helpdeskType?.code ?? '',
                                workflowId: data.workflowId ?? '',
                                // customerType: data.customerType?.code ?? ''
                            })
                            setMappingPermission({ ...mappingPermission, isModuleHelpdeskEnabled: ['HELPDESK'].includes(data?.slaDetails?.entityType) })
                            getSlaLookUp({ slaType: data.slaDetails.slaType })
                            getStatement({ entityType: data?.slaDetails?.entityType })
                            getProblemCode({ entityType: data?.slaDetails?.entityType })
                            // if (!isEmpty(problemCodeDetails)) {
                            //     const filteredProblemCode = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'serviceType', problemCodeDetails?.serviceType?.code, null);
                            //     setMasterLookUp({
                            //         ...masterLookUp,
                            //         problemCode: filteredProblemCode ?? masterLookUp?.problemCode
                            //     })
                            // }
                        })
                    }
                })
                .catch(error => console.error(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slaMappingNo])

    const updateMaterLookup = useCallback(() => {

        if (slaMappingNo && allEntityTypesRef?.current?.problemCode && slaMappingData?.serviceType && slaMappingData?.entityType === 'INTXN') {
            const filteredProblemCode = filterAndMap(allEntityTypesRef?.current?.problemCode ?? [], 'serviceType', slaMappingData.serviceType, null);
            setMasterLookUp(prevState => ({
                ...prevState,
                problemCode: filteredProblemCode,
            }))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slaMappingNo, slaMappingData.serviceType, allEntityTypesRef?.current?.problemCode])

    useEffect(() => {
        if (slaMappingNo) {
            updateMaterLookup()
        }
    }, [slaMappingNo, updateMaterLookup])

    useEffect(() => {
        getSlaMapping()
    }, [getSlaMapping])

    useLayoutEffect(() => {
        unstable_batchedUpdates(() => {
            setAction(ActionType[props?.props?.screenAction?.toUpperCase() ?? '']);
        })
    }, [ActionType, props?.props?.screenAction])

    useEffect(() => {
        setIsDisabled({
            templateName: action === ActionType.VIEW,
            slaType: [ActionType.EDIT, ActionType.VIEW].includes(action),
            slaId: [ActionType.EDIT, ActionType.VIEW].includes(action),
            entityType: [ActionType.EDIT, ActionType.VIEW].includes(action),
            severity: [ActionType.EDIT, ActionType.VIEW].includes(action),
            interactionType: [ActionType.EDIT, ActionType.VIEW].includes(action),
            interactionCategory: [ActionType.EDIT, ActionType.VIEW].includes(action),
            // withStatement: [ActionType.EDIT, ActionType.VIEW].includes(action),
            serviceCategory: [ActionType.EDIT, ActionType.VIEW].includes(action),
            serviceType: [ActionType.EDIT, ActionType.VIEW].includes(action),
            // requestId: action === ActionType.VIEW,
            // problemCode: action === ActionType.VIEW,
            helpdeskType: [ActionType.EDIT, ActionType.VIEW].includes(action),
            workflowId: [ActionType.EDIT, ActionType.VIEW].includes(action),
            status: [ActionType.CREATE, ActionType.VIEW].includes(action),
            // customerType: [ActionType.EDIT, ActionType.VIEW].includes(action),
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action])

    return (
        <div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-3">
            <div className="row mt-2">
                <div className="col-lg-12">
                    <div className="search-result-box m-t-30">
                        <div id="searchBlock" className="modal-body p-2 d-block">
                            <form onSubmit={onSubmit}>
                                <div className="row">
                                    {/* {slaMappingData?.slaMappingNo && < div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="templateName" className="control-label">
                                                Template No
                                            </label>
                                            <span>{slaMappingData?.slaMappingNo}</span>
                                        </div>
                                    </div>} */}
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="templateName" className="control-label">
                                                Mapping Template Name
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <input
                                                className="form-control"
                                                id="templateName"
                                                type="text"
                                                maxLength={100}
                                                disabled={isDisabled.templateName}
                                                // ref={el => inputRef?.current['slaCode'] = el}
                                                value={slaMappingData?.templateName ?? ""}
                                                onChange={handleOnChange}
                                            />
                                            {formErrors?.templateName && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.templateName}</span>
                                            )}
                                        </div>
                                    </div> */}
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="slaType" className="control-label">
                                                SLA Type
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <ReactSelect
                                                id='slaType'
                                                placeholder="Choose Type"
                                                isDisabled={isDisabled.slaType}
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.slaType?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'slaType', value: selected.value } })
                                                }}
                                                value={masterLookUp?.slaType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.slaType) || []}
                                            />
                                            {formErrors?.slaType && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.slaType}</span>
                                            )}
                                        </div>
                                    </div> */}
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="slaId" className="control-label">
                                                SLA Definition
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <ReactSelect
                                                id='slaId'
                                                placeholder="Choose Name"
                                                isDisabled={isDisabled.slaId}
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={slaLookUp.map((x) => ({ label: x.slaName, value: x.slaId, entityType: x?.entityType?.code ?? '' }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'slaId', value: selected.value, entityType: selected.entityType } })
                                                }}
                                                value={slaMappingData?.slaId ?
                                                    slaLookUp?.map((x) => ({ label: x.slaName, value: x.slaId })).find(x => x.value === slaMappingData?.slaId ?? '')
                                                    : []}
                                            />
                                            {formErrors?.slaId && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.slaId}</span>
                                            )}
                                        </div>
                                    </div> */}
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <div className="form-inline">
                                                <span className="mr-2 font-weight-bold">Active <span className="text-danger font-20 pl-1 fld-imp">*</span></span>
                                                <div className="switchToggle switchToggle-new">
                                                    <input type="checkbox" id="status" disabled={isDisabled.status} checked={slaMappingData?.status === 'AC'} onChange={(e) => {
                                                        handleOnChange({ target: { id: 'status', value: e.target.checked ? 'AC' : 'IN' } })
                                                    }} />
                                                    <label htmlFor="status">Active</label>
                                                </div>
                                            </div>
                                            {formErrors?.status && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.status}</span>
                                            )}
                                        </div>
                                    </div> */}
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="channel" className="control-label">Channel <span>*</span></label>
                                            <ReactSelect
                                                id='channel'
                                                placeholder="Choose Entity"
                                                // isDisabled={isDisabled}
                                                isMulti
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.channel?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'channel', value: selected } })
                                                }}
                                                value={slaMappingData?.channel ?? []}
                                            />
                                            {formErrors?.channel && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.channel}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="customerType" className="control-label">
                                                Customer Type
                                                <span className="text-danger font-20 pl-1 fld-imp">*</span>
                                            </label>
                                            <ReactSelect
                                                id='customerType'
                                                placeholder="Choose Customer Type"
                                                menuPortalTarget={document.body}
                                                isDisabled={isDisabled.customerType}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.customerType?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'customerType', value: selected.value } })
                                                }}
                                                value={slaMappingData?.customerType ?
                                                    masterLookUp?.customerType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.customerType ?? '')
                                                    : []}
                                            />
                                            {formErrors?.customerType && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.customerType}</span>
                                            )}
                                        </div>
                                    </div> */}
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
                                                    handleOnChange({ target: { id: 'entityType', value: selected.value } })
                                                }}
                                                value={slaMappingData?.entityType ?
                                                    masterLookUp?.entityCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.entityType ?? '')
                                                    : []}
                                            />
                                            {formErrors?.entityType && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.entityType}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="withStatement" className="control-label">With Statement <span>*</span></label>
                                            <ReactSelect
                                                id='withStatement'
                                                placeholder="select"
                                                isDisabled={isDisabled.withStatement}
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.condition?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'withStatement', value: selected.value } })
                                                }}
                                                value={slaMappingData?.withStatement ?
                                                    masterLookUp?.condition?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.withStatement ?? '')
                                                    : []}
                                            />
                                            {formErrors?.withStatement && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.withStatement}</span>
                                            )}
                                        </div>
                                    </div> */}
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="severity" className="control-label">Severity <span>*</span></label>
                                            <ReactSelect
                                                id='severity'
                                                placeholder="Choose severity"
                                                menuPortalTarget={document.body}
                                                isDisabled={isDisabled.severity}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.severity?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'severity', value: selected.value } })
                                                }}
                                                value={slaMappingData?.severity ?
                                                    masterLookUp?.severity?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.severity ?? '')
                                                    : []}
                                            />
                                            {formErrors?.severity && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.severity}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* {mappingPermission?.withStatement && <div className="col-md-6">
                                        <div className="form-group">
                                            <label htmlFor="requestId" className="control-label">Request Statment<span>*</span></label>
                                            <ReactSelect
                                                id='requestId'
                                                placeholder="Choose Statement"
                                                menuPortalTarget={document.body}
                                                isDisabled={isDisabled.requestId}
                                                isMulti
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={requestStatement?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'requestId', value: selected } })
                                                }}
                                                value={slaMappingData?.requestId ?? []}
                                            />
                                            {formErrors?.requestId && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.requestId}</span>
                                            )}
                                        </div>
                                    </div>} */}

                                    {/* {!mappingPermission?.withStatement && mappingPermission.isModuleHelpdeskEnabled && <div className="col-md-3">
                                        <div className="form-group">
                                            <label htmlFor="entityType" className="control-label">Helpdesk Type<span>*</span></label>
                                            <ReactSelect
                                                id='entityType'
                                                placeholder="Choose Entity"
                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                options={masterLookUp?.entityCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                onChange={(selected) => {
                                                    handleOnChange({ target: { id: 'entityType', value: selected.value } })
                                                }}
                                                value={slaMappingData?.entityType ?
                                                    masterLookUp?.entityCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.entityType ?? '')
                                                    : []}
                                            />
                                            {formErrors?.entityType && (
                                                <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.entityType}</span>
                                            )}
                                        </div>
                                    </div>} */}
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
                                                    isDisabled={isDisabled.interactionCategory}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.interactionCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'interactionCategory', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.interactionCategory ?
                                                        masterLookUp?.interactionCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.interactionCategory ?? '')
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
                                                    isDisabled={isDisabled.interactionType}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.interactionType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'interactionType', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.interactionType ?
                                                        masterLookUp?.interactionType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.interactionType ?? '')
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
                                                    isDisabled={isDisabled.serviceCategory}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.serviceCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'serviceCategory', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.serviceCategory ?
                                                        masterLookUp?.serviceCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.serviceCategory ?? '')
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
                                                    isDisabled={isDisabled.serviceType}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.serviceType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'serviceType', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.serviceType ?
                                                        masterLookUp?.serviceType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.serviceType ?? '')
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
                                                        handleOnChange({ target: { id: 'workflowId', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.workflowId ?
                                                        workflowLookUp?.map((x) => ({ label: x.mappingName, value: x.mappingId })).find(x => x.value === slaMappingData?.workflowId ?? '')
                                                        : []}
                                                />
                                                {formErrors?.workflowId && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.workflowId}</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="problemCode" className="control-label">Problem code<span>*</span></label>
                                                <ReactSelect
                                                    id='problemCode'
                                                    placeholder="Choose Entity"
                                                    isMulti
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled.problemCode}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.problemCode?.map((x) => ({ label: x?.problemCodeDesc?.description, value: x?.probCodeId ?? x.hpdProbMapId }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'problemCode', value: selected } })
                                                    }}
                                                    value={slaMappingData?.problemCode}
                                                />
                                                {formErrors?.problemCode && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.problemCode}</span>
                                                )}
                                            </div>
                                        </div> */}
                                    </> : <>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskType" className="control-label">Helpdesk Type<span>*</span></label>
                                                <ReactSelect
                                                    id='helpdeskType'
                                                    placeholder="Choose Helpdesk Type"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled.helpdeskType}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskType?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskType', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.helpdeskType ?
                                                        masterLookUp?.helpdeskType?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.helpdeskType ?? '')
                                                        : []}
                                                />
                                                {formErrors?.helpdeskType && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskType}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskCategory" className="control-label">Helpdesk Category<span>*</span></label>
                                                <ReactSelect
                                                    id='helpdeskCategory'
                                                    placeholder="Choose Helpdesk Category"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled.helpdeskCategory}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskCategory?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskCategory', value: selected.value } })
                                                    }}
                                                    value={slaMappingData?.helpdeskCategory ?
                                                        masterLookUp?.helpdeskCategory?.map((x) => ({ label: x.description, value: x.code })).find(x => x.value === slaMappingData?.helpdeskCategory ?? '')
                                                        : []}
                                                />
                                                {formErrors?.helpdeskCategory && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskCategory}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label htmlFor="helpdeskStatus" className="control-label">Helpdesk Status (Exclude)<span>*</span></label>
                                                <ReactSelect
                                                    id='helpdeskStatus'
                                                    placeholder="Choose Helpdesk Status"
                                                    menuPortalTarget={document.body}
                                                    isDisabled={isDisabled.helpdeskStatus}
                                                    isMulti
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
                                                    options={masterLookUp?.helpdeskStatus?.map((x) => ({ label: x.description, value: x.code }))}
                                                    onChange={(selected) => {
                                                        handleOnChange({ target: { id: 'helpdeskStatus', value: selected } })
                                                    }}
                                                    value={slaMappingData?.helpdeskStatus ?? []}
                                                />
                                                {formErrors?.helpdeskStatus && (
                                                    <span className="text-danger font-20 pl-1 fld-imp">{formErrors?.helpdeskStatus}</span>
                                                )}
                                            </div>
                                        </div>
                                    </>}

                                </div>
                            </form>
                            {/* {action !== ActionType.VIEW && <div className="d-flex flex-justify-center w-100 mt-2">
                                {action === ActionType.CREATE && <button type="button" className="skel-btn-cancel" onClick={clearItem}>
                                    Clear
                                </button>}
                                {<button type="button" className="skel-btn-submit ml-2" onClick={onSubmit}>
                                    Submit
                                </button>}
                            </div>} */}
                        </div>
                    </div>
                </div>
            </div >
        </div >
    )
}
export default SLADefinitionMapping