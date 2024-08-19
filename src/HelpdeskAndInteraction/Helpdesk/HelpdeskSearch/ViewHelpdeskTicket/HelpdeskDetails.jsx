import React, { useCallback, useContext, useEffect, useState } from 'react'
import ReminderImg from '../../../../assets/images/reminder-img.svg'
import moment from 'moment';
import { properties } from '../../../../properties';
import { get, post, put } from '../../../../common/util/restUtil';
import { RegularModalCustomStyles, handleOnAttchmentDownload, getPermissions } from '../../../../common/util/util';
import { statusConstantCode } from '../../../../AppConstants';
import { unstable_batchedUpdates } from 'react-dom';
// import Modal from 'react-modal';
import { CloseButton, Form, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import HelpdeskCancelModal from '../../HelpdeskCancelModal';
import { Markup } from 'interweave';
import EditHelpdeskModal from '../../EditHelpdeskModal';
import MailEditor from '../../MailEditor';
import { AppContext } from '../../../../AppContext';
import CloseHelpdeskTicket from '../../CloseHelpdeskTicket';
import ChatEditorSocial from '../../ChatEditorSocial';
import { useNavigate } from "react-router-dom";
import { Dropdown } from 'react-bootstrap';
import HeaderActionsMenu from '../../../CommonComponents/HeaderActionsMenu';
import TaskDetails from '../../../CommonComponents/TaskDetails';
import Swal from 'sweetalert2';
import { isEmpty } from 'lodash';
import ReAssignToUser from './ReAssignToUser';
import AddressDetailsFormViewMin from '../../../../CRM/Address/AddressDetailsFormViewMin';
//import Scanimg from "../../../../assets/images/main-qimg-833c55a3dd50cfa33fd7795809828a4e-lq2.jpeg";
import EditTask from '../../../CommonComponents/EditTask';

const HelpdeskDetails = (props) => {
    let { auth } = useContext(AppContext);
    const { detailedViewItem, readOnly = false, mailAttachments, refresh, logList } = props.data;
    const { getHelpdeskData, setRefresh } = props.handler
    const [isTruncated, setIsTruncated] = useState(true);
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [helpdeskDetails, setHelpdeskDetails] = useState();
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [editFrom, setEditFrom] = useState();
    const [sourceLookup, setSourceLookup] = useState([]);
    const [followupInputs, setFollowupInputs] = useState({
        priority: "",
        source: "",
        remarks: "",
    });
    // const [isCancelOpen, setIsCancelOpen] = useState(false);
    // const [isEditOpen, setIsEditOpen] = useState(false);
    const toggleTruncate = () => {
        setIsTruncated(!isTruncated);
    };
    const [helpdeskStatus, setHelpdeskStatus] = useState([])
    const [helpdeskTypes, setHelpdeskTypes] = useState([])
    const [severities, setSeverities] = useState([])
    const [projectTypes, setProjectTypes] = useState([])
    const [projectLookup, setProjectLookup] = useState([]);
    const [cancelReasonLookup, setCancelReasonLookup] = useState([]);
    const [pendingCompDays, setPendingCompDays] = useState()
    const [responseDate, setResponseDate] = useState()
    const [isDisabled, setIsDisabled] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [activeTab, setActiveTab] = useState('hdDetails')
    const [taskDetails, setTaskDetails] = useState({})
    const [taskList, setTaskList] = useState([])
    const [tasks, setTasks] = useState([])
    const history = useNavigate();
    const [isModelOpen, setIsModelOpen] = useState({
        isCreateOpen: false,
        isCancelOpen: false,
        isEditOpen: false,
        isAssignToSelfOpen: false,
        isReassignOpen: false,
        isAddFollowUpOpen: false,
        isWorkflowHistoryOpen: false,
        isReassignToUserOpen: false,
        isTaskEditOpen: false
    })
    const [permissions, setPermissions] = useState({
        cancel: false,
        edit: false,
        assignToSelf: false,
        followup: false,
        readOnly: false,
        reAssign: false,
        reAssignToSelf: false,
        create: false
    })
    const [taskPermissions, setTaskPermissions] = useState({
        cancel: false,
        edit: false,
        assignToSelf: false,
        followup: false,
        readOnly: false,
        reAssign: false,
        reAssignToSelf: false,
        create: false
    })
    const [screenPermission, setScreenPermission] = useState()
    const [componentPermission, setComponentPermission] = useState({})
    // console.log('detailedViewItem ', detailedViewItem)

    const grantPermissions = useCallback((assignedRole, assignedUserId, status, assignedDept) => {
        if ([statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode)) {
            setPermissions({
                cancel: false,
                edit: false,
                assignToSelf: false,
                followup: false,
                readOnly: true,
                reAssign: false,
                reAssignToSelf: false,
                create: false
            })
        } else {
            const { user, currRoleId, currDeptId } = auth
            if (Number(assignedRole) === Number(currRoleId) && assignedDept === currDeptId) {
                if (assignedUserId) {
                    if (Number(assignedUserId) === Number(user.userId)) {
                        setPermissions({
                            cancel: true,
                            edit: true,
                            assignToSelf: false,
                            followup: false,
                            readOnly: false,
                            reAssign: true,
                            reAssignToSelf: false,
                            create: true
                        });
                    } else {
                        setPermissions({
                            cancel: false,
                            edit: false,
                            assignToSelf: false,
                            followup: true,
                            readOnly: true,
                            reAssign: false,
                            reAssignToSelf: true,
                            create: false
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
                        reAssignToSelf: false,
                        create: false
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
                    reAssignToSelf: false,
                    create: false
                })
            }
        }
    }, [auth, detailedViewItem?.statusCode])

    useEffect(() => {
        if (!isEmpty(detailedViewItem)) {
            let assignRole = !!detailedViewItem?.currRoleInfo?.roleId
                ? parseInt(detailedViewItem?.currRoleInfo?.roleId)
                : "";
            let assignDept = !!detailedViewItem?.currDeptInfo?.unitId
                ? detailedViewItem?.currDeptInfo?.unitId
                : "";
            let user = !!detailedViewItem?.currUserInfo?.userId
                ? parseInt(detailedViewItem?.currUserInfo?.userId)
                : "";
            grantPermissions(assignRole, user, detailedViewItem?.intxnStatus?.code, assignDept)
        }
    }, [grantPermissions, detailedViewItem])

    useEffect(() => {
        get(
            properties.MASTER_API +
            `/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY,${statusConstantCode.businessEntity.HELPDESK_TYPE},${statusConstantCode.businessEntity.SEVERITY},${statusConstantCode.businessEntity.PROJECT},${statusConstantCode.businessEntity.HELPDESKSTATUS},${statusConstantCode.businessEntity.HELPDESKCANCELREASON}`
        )
            .then((resp) => {
                if (resp.data) {
                    const { PROJECT, HELPDESK_STATUS, HELPDESK_TYPE, SEVERITY, HELPDESK_CANCEL_REASON } = resp?.data

                    // const helpdeskStatusList = HELPDESK_STATUS && HELPDESK_STATUS.filter((e) => {
                    //     if (e.code !== statusConstantCode?.status?.HELPDESK_NEW) {
                    //         return true
                    //     }
                    //     return false
                    // })
                    setSourceLookup(resp.data["TICKET_SOURCE"]);
                    setPriorityLookup(resp.data["FOLLOWUP_PRIORITY"]);
                    setHelpdeskTypes(HELPDESK_TYPE)
                    setSeverities(SEVERITY)
                    setHelpdeskStatus(HELPDESK_STATUS)
                    setCancelReasonLookup(HELPDESK_CANCEL_REASON ?? [])
                    let projects = []
                    if (!detailedViewItem?.customerDetails) {
                        projects = PROJECT.filter((f) => f?.mapping && f?.mapping?.hasOwnProperty('department') && f?.mapping?.department?.includes(auth?.currDeptId))
                    } else {
                        PROJECT.forEach(element => {
                            detailedViewItem?.customerDetails?.projectMapping && detailedViewItem?.customerDetails?.projectMapping?.forEach((ele) => {
                                // console.log('departments', element?.mapping.department, 'customer department', ele?.entity, 'customer project', ele?.project, 'project', element?.code)
                                if (element?.mapping && element?.mapping?.hasOwnProperty('department') && element?.mapping?.department?.includes(auth?.currDeptId) && element?.mapping?.department?.includes(ele?.entity) && ele?.project?.includes(element?.code)) {
                                    projects.push(element)
                                }
                            })
                        })
                    }
                    setProjectLookup(projects ?? []);
                    setProjectTypes(projects)
                } else {
                    // toast.error("Error while fetching address details");
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();


    }, []);

    useEffect(() => {
        if (detailedViewItem?.complitionDate) {
            const daysLeft = moment(detailedViewItem?.complitionDate).diff(new Date(), 'days')
            setPendingCompDays(daysLeft)
        }
        if (detailedViewItem?.conversation.length > 0) {

            const recentHelpdeskReply = detailedViewItem?.conversation?.filter(ele => ele.helpdeskActionRemark === 'HELPDESK_REPLY_TO_CUSTOMER');

            const mostRecentTimestamp = recentHelpdeskReply.length > 0 ? recentHelpdeskReply[recentHelpdeskReply.length - 1].createdAt : null;

            const formattedTimestamp = mostRecentTimestamp ? moment(mostRecentTimestamp).format('DD-MM-YYYY hh:mm A') : '-';
            setResponseDate(formattedTimestamp)
            // console.log(formattedTimestamp);
        }
    }, [detailedViewItem])

    const getTaskList = useCallback(() => {
        if (detailedViewItem?.helpdeskNo) {
            const requestBody = { referenceValue: detailedViewItem.helpdeskNo }
            post(`${properties.TASK_API}/search`, requestBody).then((resp) => {
                if (resp?.status === 200 && resp?.data?.length > 0) {
                    const sortedData = resp.data.sort((a, b) => a.taskNo.localeCompare(b.taskNo));

                    setTaskList(sortedData);
                    setTaskDetails(sortedData[0]);
                    const task = sortedData.map(f => {
                        return {
                            code: f.taskNo,
                            value: f.taskName
                        }
                    })
                    setTasks(task)
                }
            })
        }
    }, [detailedViewItem?.helpdeskNo, refresh])

    useEffect(() => {
        getTaskList()
    }, [getTaskList, detailedViewItem?.helpdeskNo, refresh])

    const grantTaskPermissions = useCallback((assignedRole, assignedUserId, status, assignedDept) => {
        if ([statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.statusCode)) {
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
    }, [auth, refresh])

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
    }, [grantTaskPermissions, taskDetails, refresh])

    // const handleFollowupHelpdesk = (e) => {
    //     console.log(e)
    //     unstable_batchedUpdates(() => {
    //         setIsFollowupOpen(true)
    //         setHelpdeskDetails(e)
    //     })

    // }
    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({
            ...followupInputs,
            [target.id]: target.value,
        });
    };
    const handleOnAddFollowup = (e) => {
        e.preventDefault();
        const { priority, source, remarks } = followupInputs;
        if (!priority || !source || !remarks) {
            toast.error("Please provide mandatory fields");
            return;
        }
        let payload = {
            priorityCode: priority,
            source,
            remarks,
            helpdeskNo: detailedViewItem?.helpdeskNo,
            is_followup: 'Y',
            channel: statusConstantCode.businessEntity.WEB
        };

        post(`${properties.HELPDESK_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    unstable_batchedUpdates(() => {
                        setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: false })
                        setFollowupInputs({
                            priority: "",
                            source: "",
                            remarks: "",
                        });
                    })

                    getHelpdeskData()
                }
            })
            .catch((error) => {
                console.error(error);
            })
        // .finally();
    };
    const handleCancelHelpdesk = (e) => {
        unstable_batchedUpdates(() => {
            setIsModelOpen({
                ...isModelOpen,
                isCancelOpen: true
            })
            setHelpdeskDetails(e)
        })

    }

    const getCustomerDataForComplaint = () => {
        if (detailedViewItem && detailedViewItem?.userCategory !== 'PROFILE') {

            if (!!!detailedViewItem?.profileNo) {
                toast.error(`No ${props?.appsConfig?.clientFacingName?.customer ?? "Customer"} details Found`)
                return
            }
            const requestParam = {
                customerNo: detailedViewItem?.profileNo,                
                status: ['CS_ACTIVE', 'CS_PEND', 'CS_TEMP', 'CS_PROSPECT']
            }

            post(`${properties.CUSTOMER_API}/get-customer?limit=${1}&page=${0}`, requestParam)
                .then((resp) => {
                    if (resp?.data) {
                        if (resp?.status === 200) {
                            const data = resp?.data?.rows?.[0]
                            if (data) {
                                data.source = statusConstantCode.entityCategory.HELPDESK
                                data.helpdeskDetails = detailedViewItem || {}
                                history(`/create-interaction`, { state: { data } })
                            }
                        }
                    } else {
                        toast.error('No Customer details Found')
                    }
                }).catch((error) => {
                    console.error(error);
                    toast.error('No Customer details Found')
                })
                .finally();

        } else {

            const requestParam = {
                profileNo: detailedViewItem?.profileNo,
            }
            post(`${properties.PROFILE_API}/search?limit=${1}&page=${0}`, requestParam).then((resp) => {
                if (resp?.data && resp?.status === 200) {
                    const { rows, count } = resp.data;
                    const data = rows[0]
                    if (data) {
                        data.source = statusConstantCode.entityCategory.HELPDESK
                        data.helpdeskDetails = detailedViewItem || {}
                        history(`/create-interaction`, { state: { data } })
                    }
                }
            }).catch((error) => {
                console.error(error)
            })
        }
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

    const assignHelpdesk = (helpdeskId) => {
        return new Promise((resolve, reject) => {
            put(`${properties.HELPDESK_API}/assign/${helpdeskId}`, { status: statusConstantCode.status.HELPDESK_ASSIGN }).then((response) => {
                const { status, message } = response;
                if (status === 200) {
                    toast.success(message);
                    resolve(true);
                }
            }).catch(error => {
                console.error(error);
                reject(false);
            })
        })
    }

    const handleOnAssignToSelf = (type, apiaction) => {
        if (type == "REASSIGN_TO_SELF") {
            let payload = {
                userId: auth?.user?.userId
            };
            if (detailedViewItem?.helpdeskNo && type) {
                put(`${properties.HELPDESK_API}/reassign/${detailedViewItem.helpdeskNo}`, payload).then((response) => {
                    toast.success(`${response.message}`)
                    setRefresh(!refresh)
                    // initialize();
                }).catch((error) => {
                    console.error(error)
                }).finally();
            }
        } else {
            setEditFrom('Assign');
            setIsModelOpen({ ...isModelOpen, isEditOpen: true });
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('HELPDESK_360')
                setScreenPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error)
            }
        }

        fetchData()
    }, [refresh])

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

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="tabbable mt-2">
                <ul className="nav nav-tabs" id="myTab1" role="tablist">
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'hdDetails' ? 'active' : ""}`}
                            id="hdDetails"
                            data-toggle="tab"
                            href="#hdTab"
                            role="tab"
                            aria-controls="hdTab"
                            aria-selected="false"
                            onClick={() => setActiveTab('hdDetails')}
                        >
                            Helpdesk Details
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'conversation' ? 'active' : ""}`}
                            id="conversation"
                            data-toggle="tab"
                            href="#conversationTab"
                            role="tab"
                            aria-controls="conversationTab"
                            aria-selected="false"
                            onClick={() => setActiveTab('conversation')}
                        >
                            Conversation
                        </a>
                    </li>
                    {taskList.length > 0 && <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'task' ? 'active' : ""}`}
                            id="task"
                            data-toggle="tab"
                            href="#taskTab"
                            role="tab"
                            aria-controls="taskTab"
                            aria-selected="false"
                            onClick={() => setActiveTab('task')}
                        >
                            Tasks
                        </a>
                    </li>}
                </ul>
            </div>
            {![statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_ESCALATED].includes(detailedViewItem?.status?.code) && (
                <HeaderActionsMenu
                    data={{ isModelOpen, permissions, module: 'HELPDESK' }}
                    stateHandlers={{ setIsModelOpen }}
                    functionHandlers={{ handleOnAssignToSelf, handleOnReAssignToSelf, checkComponentPermission, getCustomerDataForComplaint }}
                />
            )}
            <hr className="cmmn-hline mt-2" />
            <div className="tab-content mt-2">
                <div
                    className={`tab-pane fade ${activeTab === 'hdDetails' ? 'active show' : ''}`}
                    id="helpdeskDetails"
                    role="tabpanel"
                    aria-labelledby="hdTab"
                >
                    <div className="view-int-details-key skel-tbl-details">
                        <table>
                            <tbody>
                                {/****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/}
                                {/* <tr>
                                    <td>
                                        <span className="font-weight-bold">Helpdesk Category</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.helpdeskCategory?.description ?? '-'}</td>
                                </tr> */}
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Helpdesk Type</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.helpdeskType?.description ?? '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Channel</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.helpdeskSource?.description ?? '-'}</td>
                                </tr>
                                {/* {(detailedViewItem?.source)?.toUpperCase() !== 'WHATSAPP' && <tr>
                                    <td>
                                        <span className="font-weight-bold">Domain</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.mailId ? detailedViewItem?.mailId.split('@')[1] : ''}</td>
                                </tr>} */}
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Project</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.project ? detailedViewItem?.project?.description : ''}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Severity</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        {detailedViewItem?.severity?.description ? <span className="badge badge-warning px-3 py-1 rounded-pill text-15 font-weight-normal">
                                            {detailedViewItem?.severity?.description ?? '-'}
                                        </span> : ' -'}
                                    </td>
                                </tr>
                                {/* <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Contact Preference
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.detailedViewItem?.contactPreferences
                                        ? detailedViewItem?.customerDetails?.contactPreferences?.filter(val => val !== null).map(
                                            (e) => { return " " + e.description; }
                                        )
                                        : ""}</td>
                                </tr> */}
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">From Email</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.mailId ?? ''}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">CC Email</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td onClick={toggleTruncate}>{(detailedViewItem?.helpdeskCcRecipients && Array.isArray(detailedViewItem?.helpdeskCcRecipients)) ? detailedViewItem?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n") ?? '-' : '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Location Details</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td onClick={toggleTruncate}>{(detailedViewItem?.helpdeskAddress) ? <AddressDetailsFormViewMin data={{ addressDetails: detailedViewItem?.helpdeskAddress }} /> : '-'}</td>
                                </tr>
                                <tr>
                                    <td><span className="font-weight-bold">Latest Remarks</span></td>
                                    <td width="5%">:</td>
                                    <td>
                                        <p className="line-height-normal mb-0 px-0 skel-min-rmrks">{logList?.[0]?.helpdeskContent}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table className='ml-4'>
                            <tbody>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Current Department/Role
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>
                                        <div className="skel-line-height-auto">
                                            {detailedViewItem?.currDeptInfo?.unitDesc ?? ''} / {detailedViewItem?.currRoleInfo
                                                ?.roleName ?? '-'}
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">Current User</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {detailedViewItem?.currUserInfo ? `${detailedViewItem?.currUserInfo?.firstName ?? ""} ${detailedViewItem?.currUserInfo?.lastName ?? ""}` : ' '}</td>
                                </tr>
                                {[statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_CLOSED].includes(detailedViewItem?.statusCode) && <tr>
                                    <td>
                                        <span className="font-weight-bold">Remarks</span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td title={detailedViewItem?.cancelReason?.description ?? ''}> {detailedViewItem?.cancelReason?.description ?? '-'}</td>
                                </tr>}
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Solutions Solved by
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {(detailedViewItem && detailedViewItem.isResolvedBy) ? detailedViewItem.isResolvedBy === 'BOT' ? "Smart Assistance" : 'Human' : '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Latest Modified By
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {(detailedViewItem?.updatedByDetails && Object.keys(detailedViewItem?.updatedByDetails).length) ? `${detailedViewItem?.updatedByDetails?.firstName ?? ""} ${detailedViewItem?.updatedByDetails?.lastName ?? ""}` : '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Expected Response Date and Time
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {detailedViewItem?.expectedResponseDate ? moment(detailedViewItem?.expectedResponseDate).format('DD-MM-YYYY') : ' -'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Actual Response Date and Time
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td> {detailedViewItem?.responseAt ? moment(detailedViewItem?.responseAt).format('DD-MM-YYYY') : ' -'}
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Expected Resolution Date
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>  {detailedViewItem?.complitionDate ? moment(detailedViewItem?.complitionDate).format('DD-MM-YYYY') : ' -'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            {detailedViewItem?.statusCode === statusConstantCode.status.HELPDESK_CLOSED ? 'Actual Resolution Date' : 'Latest Modified Date'}
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{(detailedViewItem?.statusCode === statusConstantCode.status.HELPDESK_CLOSED ? detailedViewItem?.actualResolutionDate ? `${moment(detailedViewItem?.actualResolutionDate).format('DD-MM-YYYY hh:mm A')}` : '-' : `${moment(detailedViewItem?.updatedAt).format('DD-MM-YYYY hh:mm A')}`) || '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Days Delay
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.actualResolutionDate ? `${moment(detailedViewItem?.complitionDate).diff(detailedViewItem?.actualResolutionDate, 'Days')}` : '-'}</td>
                                </tr>
                                <tr>
                                    <td>
                                        <span className="font-weight-bold">
                                            Within Resolution Date ?
                                        </span>
                                    </td>
                                    <td width="5%">:</td>
                                    <td>{detailedViewItem?.actualResolutionDate ? moment(detailedViewItem?.complitionDate).format('YYYY-MM-DD') > moment(detailedViewItem?.actualResolutionDate).format('YYYY-MM-DD') ? '✅' : '❌' : 'Unknown'}</td>
                                </tr>
                                {detailedViewItem?.complitionDate && <tr>
                                    <td colSpan={5}>
                                        <div className="jumbotron bg-white border px-2 py-2 w-60 mt-2">
                                            <div className="row align-items-center">
                                                <div className="col-md-7 text-center">
                                                    <p className="mb-0 mb-0 d-block p-0 line-height-normal">
                                                        {pendingCompDays !== null && (
                                                            <span className={`skel-word-break ${pendingCompDays < 0 ? 'text-danger' : ''}`}>
                                                                {pendingCompDays < 0 ? `Helpdesk is overdue for more than ${Math.abs(pendingCompDays)} days.` : pendingCompDays === 0 ? `${pendingCompDays} days remaining. Your completion date is today.` : `${pendingCompDays} days remaining for completion.`}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="col-md">
                                                    <img
                                                        src={ReminderImg}
                                                        width={170}
                                                        className="img-fluid"
                                                        alt=''
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>}
                            </tbody>
                        </table>
                    </div>

                    {/* Attachment Category */}
                    {/* <div className='skel-up-category'>
                        <hr className='cmmn-hline mt-2 mb-2' />
                        <span className="skel-header-title">Category wise Attachements</span>

                        <div className='row'>
                            <div className='col-md-6'>
                                <span class="font-weight-bold mt-2 mb-2">Passport Details</span>
                                <div class="attachment-details">
                                    <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportfront.png</span>
                                    <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> Passportback.png</span>
                                </div>
                            </div>
                        </div>
                        <div className='row mt-2'>
                            <div className='col-md-6'>
                                <span class="font-weight-bold mt-2 mb-2">ID Card Details</span>
                                <div class="attachment-details">
                                    <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> IDCardfront.png</span>
                                    <span class="img-attachment"><i class="fa fa-paperclip" aria-hidden="true"></i> IDCardback.png</span>
                                </div>
                                
                            </div>                    
                        </div>
                        <hr className='cmmn-hline mt-2 mb-2' />
                    </div>  */}

                    <div className="skel-help-cnt-sect mt-2">
                        <span className="font-weight-bold mt-2 d-flex mb-0">
                            Content
                        </span>
                        <div onClick={toggleTruncate} dangerouslySetInnerHTML={{ __html: detailedViewItem?.helpdeskContent }} style={{ whiteSpace: 'pre-line' }} className='txt-wrap'></div>
                        {/* <p onClick={toggleTruncate}>{detailedViewItem?.helpdeskContent}</p> */}
                    </div>
                    {/* {mailAttachments && mailAttachments.length > 0 && <>
                        <span className="font-weight-bold mt-2 d-flex mb-2">
                            Attachment
                        </span>

                        <div className="attachment-details">
                            {mailAttachments && mailAttachments.length > 0 && mailAttachments.map((attachment, i) => {
                                let { fileName = false, attachmentUuid } = attachment
                                return (
                                    <span className="img-attachment cursor-pointer" key={i} onClick={() => handleOnAttchmentDownload(attachmentUuid)}>
                                        <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                                        {fileName ? fileName : ''}
                                    </span>
                                )
                            })}
                        </div>
                    </>} */}
                </div>
                <div
                    className={`tab-pane fade ${activeTab === 'conversation' ? 'active show' : ''}`}
                    id="conversationDetails"
                    role="tabpanel"
                    aria-labelledby="conversationTab">
                    {
                        ['LIVE-CHAT', 'WHATS-APP', 'FACEBOOK']?.includes(detailedViewItem?.helpdeskSource?.code) ? (
                            <ChatEditorSocial
                                data={{
                                    isVerified,
                                    detailedViewItem,
                                    channelSource: detailedViewItem?.helpdeskSource?.code,
                                    fbId: detailedViewItem?.phoneNo
                                }}
                                handlers={{
                                    doSoftRefresh: getHelpdeskData
                                }}
                            />
                        ) : ['E-MAIL', 'WEB-PORTAL', 'WEB_APP', 'CALL_CENTER'].includes(detailedViewItem?.helpdeskSource?.code) ? (
                            <MailEditor
                                data={{
                                    isDisabled,
                                    isVerified,
                                    detailedViewItem,
                                    projectTypes,
                                    helpdeskStatus,
                                    helpdeskTypes,
                                    severities,
                                    projectLookup,
                                    refresh
                                }}
                                handlers={{
                                    doSoftRefresh: getHelpdeskData,
                                    setRefresh
                                }}
                            />
                        )
                            // : detailedViewItem?.helpdeskSource?.code === 'FACEBOOK' ? (
                            //     <FacebookDetails
                            //         data={{
                            //             isDisabled,
                            //             isVerified,
                            //             detailedViewItem,
                            //             helpdeskStatus,
                            //         }}
                            //         handlers={{
                            //             doSoftRefresh
                            //         }}
                            //     />
                            // )
                            : <CloseHelpdeskTicket data={{
                                isDisabled,
                                isVerified,
                                detailedViewItem,
                                helpdeskStatus,
                            }}
                                handlers={{
                                    doSoftRefresh: getHelpdeskData
                                }}>
                            </CloseHelpdeskTicket>
                    }
                </div>
                {activeTab === 'task' &&
                    <div >
                        {taskList.length > 0 && <div className="skel-self-data">
                            <TaskDetails
                                data={{ taskDetails, taskList, isModelOpen, auth, tasks, taskPermissions, refresh }}
                                stateHandlers={{ setTaskDetails, setIsModelOpen, setRefresh }} />

                        </div>}
                    </div>
                }
            </div>
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isAddFollowUpOpen} onHide={() => setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: false })} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Add Helpdesk FollowUp</h5></Modal.Title>
                    <CloseButton onClick={() => setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        {/* <span>×</span> */}
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="modal-body">
                        <div className="row pt-3">
                            <div className="col-6">
                                <div className="form-group">
                                    <label htmlFor="priority" className="col-form-label">
                                        FollowUp Priority{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <select
                                        required
                                        value={followupInputs.priority}
                                        id="priority"
                                        className="form-control"
                                        onChange={handleOnFollowupInputsChange}
                                    >
                                        <option key="priority" value="">
                                            Select Priority
                                        </option>
                                        {priorityLookup &&
                                            priorityLookup.map((e) => (
                                                <option key={e.code} value={e?.code}>
                                                    {e?.description}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="form-group">
                                    <label htmlFor="source" className="col-form-label">
                                        Source{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <select
                                        required
                                        id="source"
                                        className="form-control"
                                        value={followupInputs.source}
                                        onChange={handleOnFollowupInputsChange}
                                    >
                                        <option key="source" value="">
                                            Select Source
                                        </option>
                                        {sourceLookup &&
                                            sourceLookup.map((e) => (
                                                <option key={e.code} value={e.code}>
                                                    {e.description}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-12 ">
                                <div className="form-group ">
                                    <label
                                        htmlFor="inputState"
                                        className="col-form-label pt-0"
                                    >
                                        Remarks{" "}
                                        <span className="text-danger font-20 pl-1 fld-imp">
                                            *
                                        </span>
                                    </label>
                                    <textarea
                                        required
                                        className="form-control"
                                        maxLength="2500"
                                        id="remarks"
                                        value={followupInputs.remarks}
                                        onChange={handleOnFollowupInputsChange}
                                        name="remarks"
                                        rows="4"
                                    ></textarea>
                                    <span>Maximum 2500 characters</span>
                                </div>
                            </div>
                            <div className="col-md-12 pl-2">
                                <div className="form-group pb-1">
                                    <div className="d-flex justify-content-center">
                                        <button
                                            type="button"
                                            className="skel-btn-cancel"
                                            onClick={() => setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: false })}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="skel-btn-submit"
                                            onClick={handleOnAddFollowup}
                                        >
                                            Submit
                                        </button>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isModelOpen?.isWorkflowHistoryOpen} onHide={() => setIsModelOpen({ ...isModelOpen, isWorkflowHistoryOpen: false })} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">FollowUp History</h5></Modal.Title>
                    <CloseButton onClick={() => setIsModelOpen({ ...isModelOpen, isWorkflowHistoryOpen: false })} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        {/* <span>×</span> */}
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    {(detailedViewItem?.conversation &&
                        !!detailedViewItem?.conversation?.filter((val) => val.isFollowup === 'Y').length) ? <>
                        {detailedViewItem?.conversation?.filter((val) => val.isFollowup === 'Y').map((ele, idx) => {
                            return (
                                <>
                                    <div key={idx} className="row skel-transcript-conversation">
                                        <div className="col-12 form-vtext skel-form-vtext">
                                            <div className='row'>
                                                <div className='col'>
                                                    <b>By: </b> {ele?.updatedByDetails?.firstName ?? ''} {ele?.updatedByDetails?.lastName ?? ''}
                                                </div>
                                                <div className='col-4 text-right'>
                                                    <div className="badge badge-pill badge-success">
                                                        {moment(ele?.updatedAt).format('YYYY-MM-DD HH:mm A')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-12 form-vtext skel-form-vtext">
                                            <p><b>Comments: </b> <Markup content={ele?.helpdeskContent} /> </p>
                                        </div>
                                        <div className="col-12 form-vtext skel-form-vtext">
                                            <p><b>Channel: </b> {ele?.channelDesc?.description ?? '-'}</p>
                                        </div>
                                    </div>
                                </>
                            );
                        })}</> : <span className="skel-widget-warning">
                        No records available yet
                    </span>}

                </Modal.Body>
            </Modal>
            <HelpdeskCancelModal
                data={{
                    detailedViewItem,
                    isModelOpen,
                    refresh
                }}

                handler={{
                    setIsModelOpen,
                    setRefresh
                }}
            />

            {isModelOpen.isEditOpen &&
                <EditHelpdeskModal
                    data={{
                        isModelOpen,
                        detailedViewItem,
                        projectTypes,
                        helpdeskStatus,
                        helpdeskTypes,
                        severities,
                        projectLookup,
                        cancelReasonLookup,
                        source: editFrom
                    }}
                    handlers={{
                        doSoftRefresh: getHelpdeskData,
                        setIsModelOpen, setEditFrom,
                        assignHelpdesk
                    }}
                />
            }
            {<ReAssignToUser data={{ isModelOpen, detailedViewItem }} stateHandlers={{ setIsModelOpen, setRefresh }} />}
            {<EditTask data={{ isModelOpen, taskDetails, auth, taskPermissions, refresh }} stateHandlers={{ setIsModelOpen, setRefresh }} />}
        </div>
    )
}

export default HelpdeskDetails;