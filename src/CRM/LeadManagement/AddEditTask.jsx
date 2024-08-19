import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";
import React, { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../AppContext";
import { toast } from "react-toastify";
import { useHistory }from "../../common/util/history";
import TaskDetail from "./TaskDetail";

const AddEditTask = (props) => {
	const { auth } = useContext(AppContext);
	const history = useHistory()
	const masterRef = useRef()
	const [taskData, setTaskData] = useState({
		actions: [{}]
	});
	const [leadList, setLeadList] = useState([]);
	const [taskCategoryLookup, setTaskCategoryLookup] = useState([]);
	const [taskTypeLookup, setTaskTypeLookup] = useState([]);
	const [taskStatusLookup, setTaskStatusLookup] = useState([]);
	const [taskPriorityLookup, setTaskPriorityLookup] = useState([]);
	const [tagsLookup, setTagsLookup] = useState([]);
	const [error, setError] = useState({});
	const [userLookup, setUserLookup] = useState();
	const [roleList, setRoleList] = useState([]);

	useEffect(() => {
		const query = new URLSearchParams(props?.location?.search);
		const taskUuid = query?.get('taskUuid');
		if (taskUuid) {
			post(`${properties.LEAD_API}/tasks/search`, { taskUuid }).then((resp) => {
				if (resp.status === 200) {
					const taskDataa = resp.data.rows[0];
					if (!taskDataa.actions?.length) taskDataa.actions = [{}]
					taskDataa['taskPriority'] = taskDataa.taskPriority.code;
					taskDataa['taskStatus'] = taskDataa.taskStatus.code;
					taskDataa['taskAssignedTo'] = taskDataa.taskAssignedTo.userId;
					setTaskData(taskDataa);
				}
			}).catch((error) => {
				console.error(error)
			});
		}

		post(`${properties.LEAD_API}/search`, { withOutAssociations: true }).then((resp) => {
			if (resp.status === 200) {
				setLeadList(resp.data.rows.map(x => ({ label: x.leadName, value: x.leadUuid })));
			}
		}).catch((error) => {
			console.error(error)
		});
	}, [])

	const getUsersBasedOnRole = (source = undefined) => {
		let roles = []
		post(`${properties.USER_API}/search?limit=10&page=0`).then((userResponse) => {
			const { data } = userResponse;
			setUserLookup(data.rows);
		}).catch((error) => console.error(error))

		get(`${properties.ROLE_API}`).then((resp) => {
			if (resp.data) {
				resp.data.map((role) => {
					roles.push({
						id: role.roleId,
						label: role.roleName,
						value: role.roleDesc,
					});
				});
				const val = [];
				roles.map((col, i) => {
					const obj = {
						label: col.label,
						value: col.id,
					};
					val.push(obj);
				});
				setRoleList(roles);
			}
		}).catch((error) => console.error(error))
	};

	useEffect(() => {
		getUsersBasedOnRole();
		get(
			properties.MASTER_API +
			"/lookup?searchParam=code_type&valueParam=TAGS,ENGAGEMENT_STATUS,PRIORITY,COUNTRY,CONTACT_TYPE,EMAIL_DOMAIN,CONTACT_PREFERENCE,LOCATION,CUSTOMER_TYPE,CUSTOMER_CATEGORY,LEAD_STATUS,LEAD_SOURCE,ADDRESS_TYPE,TASK_CATEGORY,TASK_TYPE,LEAD_TASK_STATUS"
		).then((resp) => {
			if (resp.data) {
				masterRef.current = resp.data
				setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })));
				setTaskCategoryLookup(resp.data.TASK_CATEGORY);
				setTaskTypeLookup(resp.data.TASK_TYPE);
				setTaskStatusLookup(resp.data.LEAD_TASK_STATUS);
				setTaskPriorityLookup(resp.data.PRIORITY);
			}
		});
	}, []);

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		setTaskData({
			...taskData,
			[id]: value,
		});
	};

	const saveItem = () => {
		const reqBody = {
			...taskData,
		};
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
			}).catch(e => console.error(e));
		}
	};

	const closeSaveTaskWindow = () => {
		history("/tasks-list");
	}

	const contextProvider = {
		data: {
			auth,
			taskData,
			leadList,
			tagsLookup,
			error,
			taskCategoryLookup,
			taskTypeLookup,
			taskStatusLookup,
			taskPriorityLookup,
			userLookup,
			roleList
		},
		handlers: {
			setTaskData,
			handleOnChange,
			setError,
			setLeadList
		},
	};

	return (
		<AppContext.Provider value={contextProvider}>
			<div className="cnt-wrapper">
				<div className="cmmn-skeleton mt-2">
					<div className="tabbable-responsive">
						<div className="card-body">
							<TaskDetail />
							<div className="col-md-12 text-center my-2">
								<button type="button" className="skel-btn-cancel" onClick={closeSaveTaskWindow}>
									Cancel
								</button>
								<button type="button" className="skel-btn-submit" onClick={saveItem}>
									Save
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
