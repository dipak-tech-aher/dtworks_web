import { isEmpty } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { statusConstantCode } from "../../../AppConstants";
import { AppContext } from "../../../AppContext";
import { get, post, put } from "../../../common/util/restUtil";
import { properties } from "../../../properties";
import InsightView from "./components/InsightView";
import InteractionHeader from "./components/InteractionHeader";
import AddFollowUp from "./components/Modal/AddFollowup";
import CancelInteraction from "./components/Modal/Cancelnteraction";
import EditInteraction from "./components/Modal/EditInteraction";
import InteractionFlowHistory from "./components/Modal/InteractionFlowHistory";
import ReAssignToUser from "./components/Modal/ReAssignToUser";
import AppointmentInformation from './components/Normal/AppointmentInformation';
import AttachmentInformation from "./components/Normal/AttachmentInformation";
import CustomerInformation from "./components/Normal/Customerinformation";
import HelpdeskInformation from "./components/Normal/HelpdeskInformation";
import InteractionDetails from "./components/Normal/InteractionDetails";
import LogInformation from './components/Normal/LogInformation';
import { getPermissions } from '../../../common/util/util';
import WorkCompletionDate from './components/Modal/WorkCompletionDate';
import QAForm from '../QAForm';
import EvaluationModal from '../EvaluationModal';
import moment from 'moment'
import TaskDetails from '../../CommonComponents/TaskDetails';
import HeaderActionsMenu from '../../CommonComponents/HeaderActionsMenu';
import EditTask from '../../CommonComponents/EditTask';
import { CloseButton, Modal } from "react-bootstrap";
import AddEditTask from "../../CommonComponents/AddEditTask";

const EditAndViewInteraction = (props) => {

    const viewInteractionData = JSON.parse(localStorage.getItem('viewInteractionData'))
    const propsData = props?.location?.state?.data ? props?.location?.state?.data : viewInteractionData?.data;
// console.log('propsData===============================',propsData)
    let history = useNavigate()
    const { auth, appConfig } = useContext(AppContext);
    const dtWorksProductType = appConfig.businessSetup?.[0];
    const masterLookupDataRef = useRef()
    const intxnNo = propsData?.intxnNo ?? propsData?.oIntxnNo
    const [isInsightView, setIsInSightView] = useState(false)
    const [interactionDetails, setInteractionDetails] = useState({})
    const [taskDetails, setTaskDetails] = useState({})
    const [newTaskDetails, setNewTaskDetails] = useState({})
    const [newTaskList, setNewTaskList] = useState([])
    const [taskList, setTaskList] = useState([])
    const [tasks, setTasks] = useState([])
    const [currentFiles, setCurrentFiles] = useState([])
    const [existingFiles, setExistingFiles] = useState([])
    const [activeTab, setActiveTab] = useState(0)
    const [activeMainTab, setActiveMainTab] = useState(0)
    const [isModelOpen, setIsModelOpen] = useState({
        isCancelOpen: false,
        isEditOpen: false,
        isAssignToSelfOpen: false,
        isReassignOpen: false,
        isAddFollowUpOpen: false,
        isWorkflowHistoryOpen: false,
        isReassignToUserOpen: false,
        isTaskEditOpen: false
    })

    const [showTaskModal, setShowTaskModal] = useState(false)
    const [isTaskEdit, setIsTaskEdit] = useState(false)
    const [taskStatusLookup, setTaskStatusLookup] = useState([])
    const [userList, setUserList] = useState([])
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [isPublicService, setIsPublicService] = useState(false)
    const [permissions, setPermissions] = useState({
        cancel: false,
        edit: false,
        assignToSelf: false,
        followup: false,
        readOnly: false,
        reAssign: false,
        reAssignToSelf: false
    })
    const [taskPermissions, setTaskPermissions] = useState({
        cancel: false,
        edit: false,
        assignToSelf: false,
        followup: false,
        readOnly: false,
        reAssign: false,
        reAssignToSelf: false
    })
    const weeklyStatementLookUpRef = useRef()
    const weeklyInteractionsLookUpRef = useRef()
    const [refresh, setRefresh] = useState(false)
    const [screenPermission, setScreenPermission] = useState()
    const [componentPermission, setComponentPermission] = useState({})
    const [workCompletionIsOpen, setWorkCompletionIsOpen] = useState(false)
    const [evaluation, setEvaluation] = useState({})
    const [evaluationForm, setEvaluationForm] = useState([])
    const [guideRefId, setGuideRefId] = useState([])
    const [slaEdoc, setslaEdoc] = useState()

    const isQAFormEnabled = appConfig?.clientFacingName?.QAFormRole?.roleId?.filter((e) => e?.id === auth?.currRoleId)
    const grantPermissions = useCallback((assignedRole, assignedUserId, status, assignedDept) => {
        if (["CLOSED", "CANCELLED"].includes(status)) {
            setPermissions({
                cancel: false,
                edit: false,
                assignToSelf: false,
                followup: false,
                readOnly: true,
                reAssign: false,
                reAssignToSelf: false
            })
        } else {
            const { user, currRoleId, currDeptId } = auth;
            const requestBody = { searchParams: { interactionNumber: intxnNo } }
            post(`${properties.INTERACTION_API}/search?limit=1&page=0`, requestBody).then((resp) => {
                if (resp?.status === 200 && resp?.data?.count > 0) {
                    const { rows = [] } = resp?.data;
                    const parallelUnitsArr = Array.isArray(rows?.[0]?.parallelUnits) ? rows?.[0]?.parallelUnits : [];
                    if (parallelUnitsArr?.length > 0) {
                        const matchFound = parallelUnitsArr?.some(ele => ele?.unitId === currDeptId && ele?.roleId === currRoleId && ele?.currUser === user?.userId);

                        const assignToSelf = parallelUnitsArr?.some(ele => ele?.unitId === currDeptId && ele?.roleId === currRoleId && ele?.currUser === null);

                        if (matchFound) {
                            setPermissions({
                                cancel: false,
                                edit: true,
                                assignToSelf: false,
                                followup: true,
                                readOnly: true,
                                reAssign: true,
                                reAssignToSelf: false
                            })
                        } else if (assignToSelf) {
                            setPermissions({
                                cancel: false,
                                edit: false,
                                assignToSelf: true,
                                followup: true,
                                readOnly: true,
                                reAssign: false,
                                reAssignToSelf: false
                            })
                        }
                    } else {
                        if ((Number(assignedRole) === Number(currRoleId) && assignedDept === currDeptId)) {
                            if (assignedUserId) {
                                if (Number(assignedUserId) === Number(user.userId)) {
                                    setPermissions({
                                        cancel: true,
                                        edit: true,
                                        assignToSelf: false,
                                        followup: false,
                                        readOnly: false,
                                        reAssign: true,
                                        reAssignToSelf: false
                                    });
                                } else {
                                    setPermissions({
                                        cancel: false,
                                        edit: false,
                                        assignToSelf: false,
                                        followup: true,
                                        readOnly: true,
                                        reAssign: false,
                                        reAssignToSelf: true
                                    });
                                }
                            } else {
                                setPermissions({
                                    cancel: false,
                                    edit: false,
                                    assignToSelf: true,
                                    followup: true,
                                    readOnly: true,
                                    reAssign: false,
                                    reAssignToSelf: false
                                })
                            }
                        } else {
                            setPermissions({
                                cancel: false,
                                edit: false,
                                assignToSelf: false,
                                followup: true,
                                readOnly: true,
                                reAssign: false,
                                reAssignToSelf: false
                            })
                        }
                    }
                }
            }).catch(error => console.error(error))
        }
    }, [auth])

    useEffect(() => {
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
        if (!showTaskModal && newTaskList.length > 0)
            handleOnTasksubmit()
    }, [showTaskModal])

    const handleOnTasksubmit = (event) => {

        const { intxnNo, intxnUuid } = interactionDetails
        let interactionData = { intxnNo, intxnUuid }
        let taskData = { interactionData, newTaskList }
        unstable_batchedUpdates(() => {
            setNewTaskList([]);
            setNewTaskDetails({})
        })
        post(properties.INTERACTION_API + "/create-task", taskData)
            .then((resp) => {
                if (resp.data) {
                    toast.success("Task Added successfully");
                    setRefresh(true)
                } else {
                    toast.error("Error while fetching details");
                }
            })
            .catch(error => {
                // console.log(error)
            }).finally();
    }

    const grantTaskPermissions = useCallback((assignedRole, assignedUserId, status, assignedDept) => {
        if (["CLOSED", "CANCELLED"].includes(interactionDetails?.intxnStatus?.code)) {
            setTaskPermissions({
                cancel: false,
                edit: false,
                assignToSelf: false,
                followup: false,
                readOnly: true,
                reAssign: false,
                reAssignToSelf: false
            })
        }
        if (["TS_CLOSED", "TS_CANCELLED", "TS_COMPLETED"].includes(status)) {
            setTaskPermissions({
                cancel: false,
                edit: false,
                assignToSelf: false,
                followup: false,
                readOnly: true,
                reAssign: false,
                reAssignToSelf: false
            })
        }
        else {
            const { user, currRoleId, currDeptId } = auth;

            if ((Number(assignedRole) === Number(currRoleId) && assignedDept === currDeptId)) {
                if (assignedUserId) {
                    if (Number(assignedUserId) === Number(user.userId)) {
                        setTaskPermissions({
                            cancel: true,
                            edit: true,
                            assignToSelf: false,
                            followup: false,
                            readOnly: false,
                            reAssign: true,
                            reAssignToSelf: false
                        });
                    } else {
                        setTaskPermissions({
                            cancel: false,
                            edit: false,
                            assignToSelf: false,
                            followup: true,
                            readOnly: true,
                            reAssign: false,
                            reAssignToSelf: true
                        });
                    }
                } else {
                    setTaskPermissions({
                        cancel: false,
                        edit: false,
                        assignToSelf: true,
                        followup: true,
                        readOnly: true,
                        reAssign: false,
                        reAssignToSelf: false
                    })
                }
            } else {
                setTaskPermissions({
                    cancel: false,
                    edit: false,
                    assignToSelf: false,
                    followup: true,
                    readOnly: true,
                    reAssign: false,
                    reAssignToSelf: false
                })
            }
        }
    }, [auth])

    const AddTask = (taskDet) => {
        if (Object.keys(taskDet).length > 0) {
            const uniqueList = !isEmpty(newTaskList) ? newTaskList?.filter(f => f.taskName !== taskDet.taskName) : []
            setNewTaskList([
                ...uniqueList,
                taskDet
            ]);
        }
    }

    const fetchInteractionDetail = (intxnNo) => {
        get(`${properties.INTERACTION_API}/search?q=${intxnNo}`).then((resp) => {
            if (resp.status === 200) {
                const response = resp.data?.[0];
                const data = {
                    ...response,
                    sourceName: 'customer360'
                }
                if (response.customerUuid) {
                    localStorage.setItem("customerUuid", response.customerUuid)
                    localStorage.setItem("customerIds", response.customerId)
                }
                history(`/interaction360`, { state: { data } })
            } else {
                //
            }
        }).catch(error => {
            // console.log(error);
        });
    }

    const handleDeleteTaskRow = (row) => {
        const updatedList = newTaskList.filter(f => f.taskName !== row.taskName)
        setNewTaskList(updatedList)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Interaction No") {
            return (
                <span classNameName="text-secondary cursor-pointer" onClick={(e) => fetchInteractionDetail(cell.value)}>
                    {cell.value}
                </span>
            );
        } else if (cell.column.id === "createdAt") {
            return (
                <span>
                    {moment(row.original?.createdAt).format("DD-MM-YYYY HH:mm:ss a")}
                </span>
            );
        } else if (cell.column.id === 'taskAction') {
            return (
                <div className="skel-action-btn">
                    <div title="Edit" onClick={() => { setShowTaskModal(true); setTaskDetails(row.original); setIsTaskEdit(true); }} className="action-edit"><i className="material-icons">edit</i></div>
                    <div title="Delete" onClick={() => handleDeleteTaskRow(row.original)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">delete</i></a></div>
                </div>
            )
        } else {
            return <span>{cell.value}</span>;
        }
    };

    const getInteractionDetails = useCallback(() => {
        if (intxnNo) {
            const requestBody = { searchParams: { interactionNumber: intxnNo } }
            post(`${properties.INTERACTION_API}/search?limit=1&page=0`, requestBody).then((resp) => {
                if (resp?.status === 200 && resp?.data?.count > 0) {
                    const { rows = [] } = resp?.data
                    setInteractionDetails(rows?.[0])
                }
            }).catch(error => console.error(error))
        }
    }, [intxnNo, refresh])

    const getTaskList = useCallback(() => {
        if (intxnNo || refresh) {
            const requestBody = { referenceValue: intxnNo }
            post(`${properties.TASK_API}/search`, requestBody).then((resp) => {
                if (resp?.status === 200 && resp?.data?.length > 0) {
                    setTaskList(resp?.data)
                    setTaskDetails(resp?.data?.[0])
                    const task = resp?.data && resp?.data?.map(f => {
                        return {
                            code: f.taskNo,
                            value: f.taskName
                        }
                    })
                    setTasks(task)
                }
            }).catch(error => console.error(error))
        }
    }, [intxnNo, refresh])

    useEffect(() => {
        if (!isEmpty(interactionDetails)) {
            let assignRole = !!interactionDetails?.currentRole?.code
                ? parseInt(interactionDetails?.currentRole?.code)
                : "";
            let assignDept = !!interactionDetails?.currentDepartment?.code
                ? interactionDetails?.currentDepartment?.code
                : "";
            let user = !!interactionDetails?.currentUser?.code
                ? parseInt(interactionDetails?.currentUser?.code)
                : "";
            grantPermissions(assignRole, user, interactionDetails?.intxnStatus?.code, assignDept)
        }
    }, [grantPermissions, interactionDetails])

    useEffect(() => {
        if (!isEmpty(taskDetails)) {
            let assignRole = !!taskDetails?.currentRole?.code
                ? parseInt(taskDetails?.currentRole?.code)
                : "";
            let assignDept = !!taskDetails?.currentDepartment?.code
                ? taskDetails?.currentDepartment?.code
                : "";
            let user = !!taskDetails?.currentUser?.code
                ? parseInt(taskDetails?.currentUser?.code)
                : "";
            grantTaskPermissions(assignRole, user, taskDetails?.taskStatus?.code, assignDept)
        }
    }, [grantTaskPermissions, taskDetails])

    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=PRIORITY,SEVERITY,INTERACTION_STATUS,HELPDESK_STATUS,INTXN_STATUS_REASON,TICKET_SOURCE,FOLLOWUP_PRIORITY,INTXN_CAUSE')
            .then((resp) => {
                if (resp?.status === 200) {
                    masterLookupDataRef.current = resp.data
                    setPriorityLookup(resp.data.PRIORITY || []);
                }
            }).catch((error) => console.error(error))
    }, [])

    // Functions

    const handleOnClick = (type, payload) => {
        let url = type === statusConstantCode.entityCategory.HELPDESK ? '/view-helpdesk'
            : statusConstantCode.entityCategory.INTERACTION ? '/interaction360' : ''
        if (!url) { toast.error('No URL is defined'); return false }
        history(`${url}`, { state: { data: { ...payload } } })
    }

    const handleTabChange = (index) => {
        setActiveTab(index)
    }

    const handleMainTabChange = (index) => {
        setActiveMainTab(index)
    }

    const handleOnReAssignToSelf = () => {
        Swal.fire({
            title: "Are you sure?",
            text: `Confirm Re-Assign To Self`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: `Yes, Submit it!`,
            allowOutsideClick: false,
        }).then((result) => {
            if (result.isConfirmed) {
                handleOnAssignToSelf("REASSIGN_TO_SELF");
            }
        }).catch(error => console.error(error));
    };

    const handleOnAssignToSelf = (type, apiaction) => {
        // if (!interactionDetails?.workCompletionDate && !apiaction) {
        //     setWorkCompletionIsOpen(type)
        //     return false
        // }
        if (interactionDetails?.intxnNo && type) {
            put(`${properties.INTERACTION_API}/assignSelf/${interactionDetails.intxnNo}`, {
                type
            }).then((response) => {
                toast.success(`${response.message}`)
                setRefresh(!refresh)
                // initialize();
            }).catch((error) => {
                console.error(error)
            }).finally();
        }

    };

    const getAttachmentList = useCallback(() => {
        if (interactionDetails?.intxnUuid) {
            get(`${properties?.COMMON_API}/attachment/${interactionDetails?.intxnUuid}`).then((response) => {
                if (response?.status === 200 && response?.data && Array?.isArray(response?.data) && response?.data?.length > 0) {
                    setExistingFiles(response?.data)
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [interactionDetails?.intxnUuid])

    useEffect(() => {
        getInteractionDetails()
        getAttachmentList()
        getTaskList()
    }, [getAttachmentList, getInteractionDetails, getTaskList, intxnNo, refresh])

    useEffect(() => {
        const response = (dtWorksProductType === statusConstantCode?.type?.PUBLIC_SERVICE || dtWorksProductType === statusConstantCode?.type?.HELPDESK_SERVICE)

        unstable_batchedUpdates(() => {
            setIsPublicService(response)
            setActiveTab(!!!response ? 0 : 1)
        })

    }, [dtWorksProductType])

    useEffect(() => {
        if (interactionDetails?.intxnNo) {
            const { user, currRoleId } = auth;
            get(`${properties.INTERACTION_API}/history/${interactionDetails?.intxnNo}?getFollowUp=false&getAttachment=true`)
                .then((response) => {
                    if ((currRoleId === response?.data?.rows?.[0]?.toRoleName?.roleId)
                        && (response?.data?.rows?.[0]?.toUserName?.userId === user?.userId)
                        && !response?.data?.rows?.[0].workCompletionDate
                        && (interactionDetails?.currentUser?.code === user?.userId)
                        && !['CANCELLED', 'CLOSED'].includes(interactionDetails?.intxnStatus?.code)) {
                        setWorkCompletionIsOpen(true)
                    }
                }).catch((error) => { console.error(error) })
                .finally()
        }
    }, [interactionDetails?.intxnNo, interactionDetails?.currentUser?.code])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('INTERACTION_360')
                setScreenPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error)
            }
        }

        fetchData()
    }, [])

    useEffect(() => {
        if (screenPermission && Array.isArray(screenPermission?.components) && screenPermission?.components?.length > 0) {
            if (screenPermission?.accessType === 'allow') {
                let componentPermissions = {}
                screenPermission.components.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [screenPermission])

    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    const getEdoc = (data) => {
        if (data?.requestId || data?.problemCodeId) {
            const params = data?.requestId ? `?requestId=${data?.requestId}` : data?.problemCodeId ? `?problemCodeMapId=${data?.problemCodeId}` : ''
            get(`${properties.SLA_API}/get-edoc${params}`)
                .then((resp) => {
                    if (resp?.status === 200 && !isEmpty(resp?.data)) {
                        const { edoc } = resp.data
                        setslaEdoc(edoc ? moment(edoc).format('YYYY-MM-DD') : '')
                        // setInteractionDetails({ ...interactionDetails, edoc: edoc ? moment(edoc).format('YYYY-MM-DD') : '' })
                    }
                }).catch(error => console.error(error))
        }
    }

    useEffect(() => {
        if (interactionDetails?.requestId) {
            getEdoc({ requestId: interactionDetails?.requestId ?? '' })
        } else if (interactionDetails?.intxnProblemCode?.code) {

        }
    }, [interactionDetails])

    return (
        <div className="card-skeleton">
            <ul className="nav nav-tabs" id="myTab1" role="tablist">
                <li className="nav-item">
                    <a className={`nav-link ${activeMainTab === 0 ? 'active ' : ''}`} onClick={() => { handleMainTabChange(0) }} id="cust-conv-tab" data-toggle="tab" href="#customerinformation" role="tab" aria-controls="custconvtab"
                        aria-selected="false">Interaction Details</a>
                </li>
                {taskList.length > 0 && <li className="nav-item">
                    <a className={`nav-link ${activeMainTab === 1 ? 'active ' : ''}`} onClick={() => { handleMainTabChange(1) }} id="task-tab" data-toggle="tab" href="#taskInfo" role="tab" aria-controls="taskInfo"
                        aria-selected="false">Task Details</a>
                </li>}
                {isQAFormEnabled?.[0]?.isEnabled && !isQAFormEnabled?.[0]?.isRead && !!!permissions.readOnly &&
                    <>{evaluationForm && evaluationForm?.sort((a, b) => a.sortOrder - b.sortOrder)?.map((e, index) => (<li className="nav-item">
                        <button data-target={'#' + e?.qaDispalyName} role="tab" data-toggle="tab" aria-expanded="true" className={`nav-link ${activeMainTab === index + 2 ? 'active' : ''} `} onClick={() => handleMainTabChange(index + 2)}>
                            {e?.qaDispalyName}
                        </button>
                    </li>))}</>}
            </ul>
            <InteractionHeader
                data={{ interactionDetails, isInsightView, screenPermission, lookupData: masterLookupDataRef, dtWorksProductType }}
                stateHandlers={{ setIsInSightView }}
                functionHandlers={{ handleOnClick }} />
            {activeMainTab === 0 &&
                <div >
                    {!isInsightView && <div className="skel-self-data">
                        <InteractionDetails
                            data={{ interactionDetails, isModelOpen, lookupData: masterLookupDataRef, existingFiles, currentFiles, appConfig, auth, permissions,dtWorksProductType }}
                            stateHandlers={{ setIsModelOpen, setCurrentFiles, setExistingFiles, handleOnAssignToSelf, handleOnReAssignToSelf, checkComponentPermission, setShowTaskModal }} />
                    </div>}
                </div>
            }
            {activeMainTab === 1 &&
                <div >
                    {!isInsightView && taskList.length > 0 && <div className="skel-self-data">
                        <TaskDetails
                            data={{ taskDetails, taskList, isModelOpen, lookupData: masterLookupDataRef, existingFiles, currentFiles, appConfig, auth, tasks, taskPermissions, refresh }}
                            stateHandlers={{ setTaskDetails, setIsModelOpen, setCurrentFiles, setExistingFiles, setRefresh }} />

                    </div>}
                </div>
            }
            {isQAFormEnabled?.[0]?.isEnabled && !isQAFormEnabled?.[0]?.isRead && !!!permissions.readOnly &&
                <>
                    {evaluationForm && evaluationForm?.sort((a, b) => a.sortOrder - b.sortOrder)?.map((evaluationGuide, index) => (
                        <div className={`tab-pane ${activeMainTab === index + 2 ? 'active' : ''}`} id={evaluationGuide?.qaDispalyName}>
                            {activeMainTab === index + 2 && <div className="skel-inter-statement card-box border mt-2 w-100 ">
                                <span className="container-title"> {evaluationGuide?.qaDispalyName} - {interactionDetails?.agentName ?? ''}</span>
                                <div> <QAForm
                                    data={{
                                        permissions,
                                        isQAFormEnabled,
                                        evaluation,
                                        interactionData: interactionDetails,
                                        evaluationForm: evaluationGuide,
                                        guideRefId,
                                        qaObjects: evaluationForm
                                    }}
                                    handlers={{
                                        setEvaluation,
                                        setGuideRefId
                                    }}
                                />
                                </div>
                            </div>}
                        </div>
                    ))
                    }
                </>
            }
            <div className="cmmn-skeleton mt-2">
                <div className="tabbable mt-2">
                    <ul className="nav nav-tabs" id="myTab1" role="tablist">
                        {(!isPublicService) &&
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === 0 ? 'active ' : ''}`} onClick={() => { handleTabChange(0) }} id="cust-conv-tab" data-toggle="tab" href="#customerinformation" role="tab" aria-controls="custconvtab"
                                    aria-selected="false">Customer Details</a>
                            </li>
                        }
                        {isPublicService &&
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === 1 ? 'active ' : ''}`} onClick={() => { handleTabChange(1) }} id="profile-tab" data-toggle="tab" href="#profiledetails" role="tab" aria-controls="custtab"
                                    aria-selected="true">Profile Details</a>
                            </li>}
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 2 ? 'active ' : ''}`} onClick={() => { handleTabChange(2) }} id="att-tab" data-toggle="tab" href="#attachment" role="tab" aria-controls="atttab"
                                aria-selected="false">Attachment</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 3 ? 'active ' : ''}`} onClick={() => { handleTabChange(3) }} id="helpdesk-tab" data-toggle="tab" href="#helpdesktab" role="tab" aria-controls="helpdesktab"
                                aria-selected="false">Helpdesk Details</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 4 ? 'active ' : ''}`} onClick={() => { handleTabChange(4) }} id="upcoming-tab" data-toggle="tab" href="#upcoming" role="tab" aria-controls="upcomingtab"
                                aria-selected="false">Upcoming Appointments</a>
                        </li>
                        <li className="nav-item">
                            <a className={`nav-link ${activeTab === 5 ? 'active ' : ''}`} onClick={() => { handleTabChange(5) }} id="log-tab" data-toggle="tab" href="#logtab" role="tab" aria-controls="logtab"
                                aria-selected="false">Log Info</a>
                        </li>
                        {isQAFormEnabled?.[0]?.isEnabled && <li className="nav-item">
                            <button data-target="#evaluation" role="tab" data-toggle="tab" aria-expanded="true" className={`nav-link ${activeTab === 6 ? 'active' : ''} `} onClick={() => handleTabChange(6)}>
                                Evaluation Details
                            </button>
                        </li>}
                    </ul>
                </div>
                <div className="tab-content mt-2">
                    {((!isPublicService) && activeTab === 0)
                        && <CustomerInformation id="customerinformation" role="tabpanel" data={{ interactionDetails, isPublicService, appConfig }} stateHandlers={{ handleOnClick }} />}
                    {(isPublicService && activeTab === 1)
                        && <CustomerInformation id="profiledetails" role="tabpanel" data={{ interactionDetails, isPublicService, appConfig }} stateHandlers={{ handleOnClick }} aria-labelledby="custtab" />}
                    {activeTab === 2
                        && <AttachmentInformation data={{ existingFiles }} />}
                    {activeTab === 3
                        && <HelpdeskInformation data={{ interactionDetails, lookupData: masterLookupDataRef, isPublicService }} />}
                    {activeTab === 4
                        && <AppointmentInformation data={{ informationHelpdeskDetails:interactionDetails, isPublicService }} />}
                    {activeTab === 5
                        && <LogInformation data={{ interactionDetails }} />}
                    {activeTab === 6
                        &&
                        isQAFormEnabled?.[0]?.isEnabled &&
                        <div className={`tab-pane ${activeTab === 0 ? 'active' : ''}`} id="evaluation">
                            {activeTab === 1 &&
                                <EvaluationModal
                                    data={{
                                        permissions,
                                        isQAFormEnabled,
                                        evaluation,
                                        interactionData: interactionDetails,
                                        evaluationForm: evaluationForm,
                                        guideRefId
                                    }}
                                    handlers={{
                                        setEvaluation,
                                        setGuideRefId
                                    }}
                                />
                            }
                        </div>
                    }
                </div>
            </div>
            {isInsightView && <InsightView data={{ interactionDetails, weeklyStatementLookUpRef, weeklyInteractionsLookUpRef, isPublicService }} />}
            {<InteractionFlowHistory data={{ isModelOpen, interactionDetails }} stateHandlers={{ setIsModelOpen }} />}
            {<CancelInteraction data={{ isModelOpen, lookupData: masterLookupDataRef, interactionDetails, refresh }} stateHandlers={{ setIsModelOpen, setRefresh, setWorkCompletionIsOpen }} />}
            {<AddFollowUp data={{ isModelOpen, lookupData: masterLookupDataRef, interactionDetails }} stateHandlers={{ setIsModelOpen }} />}
            {<EditInteraction data={{ isModelOpen, lookupData: masterLookupDataRef, interactionDetails, appConfig, auth, permissions, slaEdoc }} stateHandlers={{ setIsModelOpen }} />}
            {<EditTask data={{ isModelOpen, lookupData: masterLookupDataRef, taskDetails, appConfig, auth, permissions, slaEdoc, refresh }} stateHandlers={{ setIsModelOpen, setRefresh }} />}
            {<ReAssignToUser data={{ isModelOpen, interactionDetails, refresh }} stateHandlers={{ setIsModelOpen, setRefresh }} />}
            {workCompletionIsOpen && <WorkCompletionDate data={{ workCompletionIsOpen, interactionDetails, slaEdoc }} stateHandlers={{ setWorkCompletionIsOpen, handleServiceOnClose: () => { setWorkCompletionIsOpen(false); setRefresh(!refresh) }, handleOnAssignToSelf }} />}
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" dialogClassName="cust-lg-modal" centered show={showTaskModal} onHide={() => { setShowTaskModal(false); setTaskDetails({}) }}>
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Add/Edit Task</h5></Modal.Title>
                    <CloseButton onClick={() => { setShowTaskModal(false); setTaskDetails({}) }} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}></CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <AddEditTask
                        data={{
                            interactionData: interactionDetails,
                            isEdit: isTaskEdit,
                            taskDetails: newTaskDetails,
                            newTaskList,
                            priorityLookup,
                            taskStatusLookup,
                            userList
                        }}
                        handler={{
                            setTaskDetails: setNewTaskDetails,
                            setNewTaskList,
                            setTaskStatusLookup,
                            setShowTaskModal,
                            AddTask
                        }}
                    />
                </Modal.Body>
            </Modal>

        </div>
    )
}

export default EditAndViewInteraction