import React, { useCallback, useContext, useEffect, useRef, useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import { toast } from "react-toastify"
import { array, object, string } from 'yup'
import { AppContext } from "../../AppContext"
import { getFullName } from "../../common/util/commonUtils"
import { useHistory }from "../../common/util/history"
import { get, post, put } from "../../common/util/restUtil"
import { properties } from "../../properties"
import TaskDetail from "./TaskDetail"
import { removeEmptyKey } from "../../common/util/util"

const AddEditTask = (props) => {
	const { auth } = useContext(AppContext)
	const masterRef = useRef()
	const [taskData, setTaskData] = useState({
		// actions: [{}]
	});
	const [leadList, setLeadList] = useState([])
	const [taskCategoryLookup, setTaskCategoryLookup] = useState([])
	const [taskTypeLookup, setTaskTypeLookup] = useState([])
	const [taskStatusLookup, setTaskStatusLookup] = useState([])
	const [taskPriorityLookup, setTaskPriorityLookup] = useState([])
	const [tagsLookup, setTagsLookup] = useState([])
	const [formErrors, setFormErrors] = useState({})
	const [userLookup, setUserLookup] = useState()
	const [missionList, setMissionList] = useState()
	const taskWorkflowRef = useRef()
	const [departmentLookup, setDepartmentLookup] = useState()
	const userLookupRef = useRef()
	const screenMode = props?.props?.screenAction ?? 'Add'
	const history = useHistory()
	const taskSchema = object({
		leadUuid: string().required().label('Stakeholder Name'),
		missionUuid: string().nullable(true).label('Mission Name'),
		taskName: string().required().label('Task Name'),
		taskDescription: string().required().label('Task Description'),
		taskPriority: string().required().label('Priority'),
		taskStatus: string().required().label('Status'),
		taskAssignedRole: string().required().label('Department / Role'),
		taskAssignedTo: string().nullable(true).label('Assign To'),
		taskAssignedDept: string().required().label('Department / Role'),
		taskDueDate: string().required().label('Due Date'),
		taskTags: array().of(string()).nullable(true).label('Tags'),
		workflowUuid: string().required().label('Workflow Configuration'),
	})

	const query = new URLSearchParams(props?.location?.search)
	const taskUuid = query?.get('taskUuid')
	useEffect(() => {
		if (taskUuid) {
			post(`${properties.LEAD_API}/tasks/search`, { taskUuid }).then((resp) => {
				if (resp.status === 200) {
					const taskData = resp.data.rows[0];
					// if (!taskData?.actions?.length) taskData.actions = [{}]
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
	}, [screenMode, taskUuid])


	const getTaskLeadDetails = useCallback((leadUuid) => {
		let requestBody = {
			withOutAssociations: true
		}
		if (screenMode !== 'Add') {
			requestBody = { ...requestBody, leadUuid }
		}
		post(`${properties.LEAD_API}/search`, { ...requestBody }).then((resp) => {
			if (resp.status === 200) {
				setLeadList(resp.data.rows.map(x => ({ label: x.leadName, value: x.leadUuid })))
			}
		}).catch((error) => {
			console.error(error)
		})
	}, [screenMode])


	useEffect(() => {
		getTaskLeadDetails(taskData.leadUuid ?? '')
		getMissionList(taskData.leadUuid)
	}, [getTaskLeadDetails, taskData.leadUuid])


	const getMissionList = (leadUuid) => {
		if (leadUuid) {
			post(`${properties.LEAD_API}/get-missions`, { withOutAssociations: true, leadUuid: leadUuid })
				.then((resp) => {
					if (resp.status === 200) {
						setMissionList(resp.data?.rows?.map(x => ({ label: x.missionName, value: x.missionUuid })))
					}
				}).catch((error) => { console.error(error) })
		}
	}

	// const getUsersBasedOnRole = (source = undefined) => {
	// 	let roles = []
	// 	post(`${properties.USER_API}/search?limit=10&page=0`).then((userResponse) => {
	// 		const { data } = userResponse;
	// 		setUserLookup(data.rows);
	// 	}).catch((error) => console.error(error))

	// 	get(`${properties.ROLE_API}`).then((resp) => {
	// 		if (resp.data) {
	// 			resp.data.map((role) => {
	// 				roles.push({
	// 					id: role.roleId,
	// 					label: role.roleName,
	// 					value: role.roleDesc,
	// 				});
	// 			});
	// 			const val = [];
	// 			roles.map((col, i) => {
	// 				const obj = {
	// 					label: col.label,
	// 					value: col.id,
	// 				};
	// 				val.push(obj);
	// 			});
	// 			setRoleList(roles);
	// 		}
	// 	}).catch((error) => console.error(error))
	// };

	const getUsersBasedOnRole = (deptId, roleId) => {
		if (deptId && roleId) {
			const data = {
				roleId: roleId,
				deptId: deptId
			}

			get(`${properties.USER_API}/by-role?roleId=${data.roleId}&deptId=${data.deptId}`)
				.then((userResponse) => {
					const { data } = userResponse
					unstable_batchedUpdates(() => {
						const formattedResponse = data.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }))
						userLookupRef.current = formattedResponse
						setUserLookup(formattedResponse)
						// if (isRoleChangedByUserRef.current) {
						//     if (data?.length === 1) {
						//         setInteractionInputs({
						//             ...interactionInputs,
						//             user: data?.[0].userId,
						//         })
						//     }
						// }
					})
				}).catch(error => console.error(error))
				.finally()
		}
	}

	const getTaskWorkflow = () => {
		post(`${properties.WORKFLOW_API}/task/get-workflow`, {})
			.then((resp) => {
				if (resp.status === 200) {
					const statusArray = [];
					resp.data?.workflow?.entities?.forEach(node => {
						node.status?.forEach(status => {
							statusArray.push(status);
						})
					})
					let statusLookup = [
						...new Map(
							statusArray.map((item) => [item["code"], item])
						).values(),
					];
					unstable_batchedUpdates(() => {
						taskWorkflowRef.current = resp.data?.workflowUuid ? { ...resp.data } : {}
						setTaskStatusLookup(statusLookup)
					})
				}
			}).catch(error => console.error(error))
	}

	useEffect(() => {
		// getUsersBasedOnRole();
		get(
			properties.MASTER_API +
			"/lookup?searchParam=code_type&valueParam=TAGS,ENGAGEMENT_STATUS,PRIORITY,COUNTRY,CONTACT_TYPE,EMAIL_DOMAIN,CONTACT_PREFERENCE,LOCATION,CUSTOMER_TYPE,CUSTOMER_CATEGORY,LEAD_STATUS,LEAD_SOURCE,ADDRESS_TYPE,TASK_CATEGORY,TASK_TYPE,LEAD_TASK_STATUS"
		).then((resp) => {
			if (resp.data) {
				unstable_batchedUpdates(() => {
					masterRef.current = resp.data
					setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })))
					setTaskCategoryLookup(resp.data.TASK_CATEGORY)
					setTaskTypeLookup(resp.data.TASK_TYPE)
					// setTaskStatusLookup(resp.data.LEAD_TASK_STATUS);
					setTaskPriorityLookup(resp.data.PRIORITY)
				})

			}
		}).catch(error => console.error(error))
		getTaskWorkflow()
	}, [])

	const handleOnChange = (e) => {
		const { id, value } = e.target
		setTaskData({
			...taskData,
			[id]: value
		})
	}

	const validateData = async (schema, data) => {
		return new Promise((resolve, reject) => {
			schema.validate(data, { abortEarly: false }).then(function () {
				resolve({ success: true });
			}).catch(function (err) {
				let errors = {};
				err.inner.forEach(e => {
					errors[e.path] = e.message;
				});
				resolve({ failure: errors });
			});
		});
	}

	const saveItem = async () => {
		setFormErrors({});
		taskData['workflowUuid'] = taskWorkflowRef.current.workflowUuid ?? ''
		const validationResponse = await validateData(taskSchema, taskData);
		if (validationResponse.success) {
			let reqBody = Object.fromEntries(
				Object.entries(taskData).filter(([k, v]) => v)  
			  );
			  
			if (!reqBody.taskUuid) {
				post(`${properties.LEAD_API}/task/create`, reqBody).then((resp) => {
					if (resp.status === 200) {
						history("/tasks-list");
						toast.success(resp.message);
					}
				}).catch(e => console.error());
			} else {
				put(`${properties.LEAD_API}/task/update/${reqBody.taskUuid}`, reqBody).then((resp) => {
					if (resp.status === 200) {
						history("/tasks-list");
						toast.success(resp.message);
					}
				}).catch(e => console.error());
			}
		} else {
			setFormErrors({ ...validationResponse?.failure ?? {} })
			toast.error("Please fill the mandatory fields")
		}
	}

	const closeSaveTaskWindow = () => {
		history("/tasks-list");
	}

	const clearItem = () => {
		unstable_batchedUpdates(() => {
			setFormErrors({})
			setUserLookup([])
			setMissionList([])
			setDepartmentLookup([])
			userLookupRef.current = {}
			setTaskData({})
		})
		toast.warning("Filled values got cleared")
	}

	const contextProvider = {
		data: {
			auth,
			taskData,
			leadList,
			tagsLookup,
			formErrors,
			taskCategoryLookup,
			taskTypeLookup,
			taskStatusLookup,
			taskPriorityLookup,
			userLookup,
			missionList,
			taskWorkflowRef,
			departmentLookup,
			userLookupRef,
		},
		handlers: {
			setTaskData,
			handleOnChange,
			setFormErrors,
			setLeadList,
			setMissionList,
			getMissionList,
			setDepartmentLookup,
			getUsersBasedOnRole,
			setUserLookup,
			setTagsLookup
		}
	}

	return (
		<AppContext.Provider value={contextProvider}>
			<div className="cnt-wrapper">
				<div className="cmmn-skeleton mt-2">
					<div className="tabbable-responsive">
						<div className="card-body">
							<TaskDetail />
							<div className="d-flex flex-justify-center w-100 mt-2">
								<button type="button" className="skel-btn-cancel" onClick={closeSaveTaskWindow}>
									Cancel
								</button>
								<button type="button" className="skel-btn-cancel ml-2" onClick={clearItem}>
									Clear
								</button>
								<button type="button" className="skel-btn-submit" onClick={saveItem}>
									Submit
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppContext.Provider>
	);
};

export default AddEditTask;
