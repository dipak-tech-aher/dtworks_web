import { useCallback, useContext, useEffect, useState } from "react"
import { AppContext } from "../../AppContext"
import { get, post, put } from "../../common/util/restUtil"
import { getPermissions } from "../../common/util/util"
import { properties } from "../../properties"
import EditTask from "./EditTask"
import EditTaskHeaders from "./EditTaskHeader"
import ViewTaskDetails from "./ViewTaskDetails"
import { toast } from "react-toastify"

const EditViewTask = (props) => {
    const { auth } = useContext(AppContext)
    const [taskData, setTaskData] = useState({})
    const [currentFiles, setCurrentFiles] = useState([])
    const [existingFiles, setExistingFiles] = useState([])
    const [roleDetails, setRoleDetails] = useState()
    const [componentPermission, setComponentPermission] = useState({})
    const [screenPermission, setScreenPermission] = useState()
    const [refresh, setRefresh] = useState(false)

    const [isModelOpen, setIsModelOpen] = useState({
        isEditOpen: false,
        isAssignToSelfOpen: false
    })
    const [permissions, setPermissions] = useState({
        edit: false,
        assignToSelf: false,
        taskStatus: false,
        taskAssignedRole: false,
        taskAssignedTo: false,
        taskDueDate: false,
        readOnly: true
    })

    const query = new URLSearchParams(props?.location?.search)
    const taskUuid = query?.get('taskUuid')

    const getTaskLeadDetails = useCallback(() => {
        if (taskUuid) {
            post(`${properties.LEAD_API}/tasks/search`, { taskUuid }).then((resp) => {
                if (resp.status === 200) {
                    const taskData = resp.data.rows?.[0] ?? {}
                    taskData['taskPriority'] = taskData.priorityDesc.code
                    taskData['taskStatus'] = taskData.statusDesc.code
                    taskData['taskAssignedTo'] = taskData.assignedTo
                    taskData['taskTags'] = taskData.tags
                    taskData['taskDueDate'] = taskData.dueDate
                    setTaskData(taskData)
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [taskUuid])

    useEffect(() => {
        getTaskLeadDetails()
    }, [getTaskLeadDetails, refresh])

    const handleOnAssignToSelf = () => {
        if (taskData?.taskUuid) {
            put(`${properties.LEAD_API}/assignSelf/${taskData?.taskUuid}`, {}).then((response) => {
                toast.success(`${response.message}`)
                setRefresh(!refresh)
            }).catch((error) => {
                console.error(error)
            }).finally();
        }
    }

    const getAttachmentList = useCallback(() => {
        if (taskData?.taskUuid) {
            get(`${properties?.COMMON_API}/attachment/${taskData?.taskUuid}`).then((response) => {
                if (response?.status === 200 && response?.data && Array?.isArray(response?.data) && response?.data?.length > 0) {
                    setExistingFiles(response?.data)
                }
            }).catch((error) => {
                console.error(error)
            })
        }
    }, [taskData?.taskUuid])

    useEffect(() => {
        getAttachmentList()
    }, [getAttachmentList])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('TASK_EDIT')
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


    const getManagerialStatus = useCallback((currRoleId) => {
        if (currRoleId) {
            get(`${properties.ROLE_API}/search/${currRoleId}`)
                .then((resp) => {
                    if (resp.data) {
                        if (resp.status === 200) {
                            setRoleDetails(resp.data?.[0] ?? {})
                        }
                    }
                })
                .catch(error => console.error(error))
        }
    }, [])

    useEffect(() => {
        const { currRoleId } = auth
        if (currRoleId) { getManagerialStatus(currRoleId) }
    }, [auth, getManagerialStatus])

    const grantPermissions = useCallback((assignedRole, assignedUserId, status, assignedDept) => {
        if (assignedDept && assignedRole && status) {
            if (['TS_CLOSED']?.includes(status)) {
                setPermissions({
                    edit: false,
                    assignToSelf: false,
                    taskStatus: false,
                    taskAssignedRole: false,
                    taskAssignedTo: false,
                    stakeholder: false,
                    Mission: false,
                    taskName: false,
                    taskDescription: false,
                    taskPriority: false,
                    taskTags: false,
                    taskDueDate: false,
                    readOnly: true
                })
            } else {
                const { user, currRoleId, currDeptId } = auth
                if (!!!roleDetails?.isManagerialRole) {
                    if (Number(assignedRole) === Number(currRoleId) && assignedDept === currDeptId) {
                        if (assignedUserId) {
                            if (Number(assignedUserId) === Number(user.userId)) {
                                setPermissions({
                                    edit: true,
                                    taskStatus: true,
                                    assignToSelf: false,
                                    taskAssignedRole: false && checkComponentPermission('TOROLE_ASSIGN_TASK'),
                                    taskAssignedTo: false && checkComponentPermission('TOUSER_ASSIGN_TASK'),
                                    taskDueDate: false || checkComponentPermission('DUEDATE_TASK'),
                                    readOnly: true
                                })
                            }
                        } else {
                            // assign to self
                            setPermissions({
                                edit: false,
                                taskStatus: false,
                                assignToSelf: true,
                                taskAssignedRole: (false || checkComponentPermission('TOROLE_ASSIGN_TASK')),
                                taskAssignedTo: (false || checkComponentPermission('TOUSER_ASSIGN_TASK')),
                                taskDueDate: (false || checkComponentPermission('DUEDATE_TASK')),
                                readOnly: true
                            })
                        }
                    } else {
                        setPermissions({
                            edit: (false || checkComponentPermission('EDIT_TASK')),
                            taskStatus: (false || checkComponentPermission('TOSTATUS_ASSIGN_TASK')),
                            assignToSelf: false,
                            taskAssignedRole: false || checkComponentPermission('TOROLE_ASSIGN_TASK'),
                            taskAssignedTo: false || checkComponentPermission('TOUSER_ASSIGN_TASK'),
                            taskDueDate: false || checkComponentPermission('DUEDATE_TASK'),
                            readOnly: true
                        })
                    }
                } else {
                    if (assignedDept === currDeptId) {
                        if (Number(assignedRole) === Number(currRoleId)) {
                            if (assignedUserId) {
                                if (Number(assignedUserId) === Number(user.userId)) {
                                    setPermissions({
                                        edit: true,
                                        taskStatus: (false || checkComponentPermission('TOSTATUS_ASSIGN_TASK')),
                                        assignToSelf: false,
                                        taskAssignedRole: false || checkComponentPermission('TOROLE_ASSIGN_TASK'),
                                        taskAssignedTo: false || checkComponentPermission('TOUSER_ASSIGN_TASK'),
                                        taskDueDate: false || checkComponentPermission('DUEDATE_TASK'),
                                        readOnly: true
                                    })
                                }
                            } else {
                                setPermissions({
                                    edit: false,
                                    taskStatus: (false || checkComponentPermission('TOSTATUS_ASSIGN_TASK')),
                                    assignToSelf: true,
                                    taskAssignedRole: false || checkComponentPermission('TOROLE_ASSIGN_TASK'),
                                    taskAssignedTo: false || checkComponentPermission('TOUSER_ASSIGN_TASK'),
                                    taskDueDate: false || checkComponentPermission('DUEDATE_TASK'),
                                    readOnly: true
                                })
                            }
                        } else {
                            setPermissions({
                                edit: (false || checkComponentPermission('EDIT_TASK')),
                                taskStatus: (false || checkComponentPermission('TOSTATUS_ASSIGN_TASK')),
                                assignToSelf: false,
                                taskAssignedRole: false || checkComponentPermission('TOROLE_ASSIGN_TASK'),
                                taskAssignedTo: false || checkComponentPermission('TOUSER_ASSIGN_TASK'),
                                taskDueDate: false || checkComponentPermission('DUEDATE_TASK'),
                                readOnly: true
                            })
                        }

                    }
                }
            }
        }
    }, [auth, checkComponentPermission, roleDetails])

    useEffect(() => {
        let assignRole = !!taskData?.currRole
            ? parseInt(taskData?.currRole)
            : "";
        let assignDept = !!taskData?.currEntity
            ? taskData?.currEntity
            : "";
        let user = !!taskData?.assignedTo
            ? parseInt(taskData?.assignedTo)
            : "";
        grantPermissions(assignRole, user, taskData?.status, assignDept)
    }, [grantPermissions, taskData])

    const contextProvider = {
        data: {
            taskData,
            permissions,
            isModelOpen,
            currentFiles,
            existingFiles,
            refresh
        },
        handlers: {
            setTaskData,
            setPermissions,
            setIsModelOpen,
            handleOnAssignToSelf,
            setCurrentFiles,
            setExistingFiles,
            setRefresh
        }
    }

    return (
        <AppContext.Provider value={contextProvider}>
            <div className="card-skeleton">
                <EditTaskHeaders />
                <ViewTaskDetails />
            </div>
            {<EditTask />}
        </AppContext.Provider>
    )
}

export default EditViewTask;