import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { Modal } from 'react-bootstrap';
import ReactSelect from 'react-select';
import { AppContext } from "../../AppContext";
import AddEditLead from "../LeadManagement/AddEditLead";
import AddEditMission from "../MissionManagement/AddEditMission";
import { unstable_batchedUpdates } from "react-dom";
import { statusConstantCode } from "../../AppConstants";
import { containSpecialCharacter, generateRandomString } from "../../common/util/util";
import { toast } from "react-toastify";

const TaskDetail = () => {
	const { data, handlers } = useContext(AppContext);
	const {
		taskData,
		taskStatusLookup,
		formErrors,
		tagsLookup,
		taskPriorityLookup,
		userLookup,
		leadList,
		missionList,
		taskWorkflowRef,
		departmentLookup,
		userLookupRef,
	} = data;

	const { setTaskData, setLeadList, handleOnChange, setMissionList, getMissionList, setDepartmentLookup, getUsersBasedOnRole, setUserLookup, setTagsLookup } = handlers;

	const [leadData, setLeadData] = useState({});
	const [missionData, setMissionData] = useState({});
	const [tagTextSearch, setTagTextSearch] = useState();

	const isAvailableInSearch = (obj) => {
		return tagTextSearch && tagTextSearch !== "" ? JSON.stringify(obj).toLowerCase().includes(tagTextSearch?.toLowerCase()) : true;
	}

	useEffect(() => {
		if (leadData?.leadUuid && leadData.leadName) {
			leadList.push({ label: leadData.leadName, value: leadData.leadUuid });
			setLeadList([...leadList]);
			handleTaskChange('leadUuid', leadData.leadUuid);
		}
	}, [leadData])

	useEffect(() => {
		if (missionData?.missionUuid && missionData.missionName) {
			missionList.push({ label: missionData.missionName, value: missionData?.missionUuid });
			setMissionList([...missionList]);
			handleTaskChange('missionUuid', missionData?.missionUuid);
		}
	}, [missionData])

	const [show, setShow] = useState({
		addLeadModal: false,
		addMissionModal: false
	});

	const handleShowClose = (key) => {
		setShow({ ...show, [key]: !show[key] });
	};

	// const handleAddAction = () => {
	// 	if (!taskData?.actions) taskData.actions = [];
	// 	taskData.actions.push({});
	// 	setTaskData({ ...taskData });
	// };

	// const deleteAction = (actionIndex) => {
	// 	if (taskData.actions && taskData.actions.length > 0) {
	// 		taskData.actions = taskData.actions.filter((item, i) => i !== actionIndex);
	// 	}
	// 	setTaskData({ ...taskData });
	// };

	const handleTaskChange = (field, value, e) => {
		if (field === 'leadUuid') {
			getMissionList(value)
			taskData['missionUuid'] = null
		} else if (field === 'taskStatus') {
			const entity = []
			taskWorkflowRef?.current && taskWorkflowRef?.current?.workflow.entities?.forEach((unit) => {
				for (const property in unit?.status) {
					if (unit.status[property].code === value) {
						entity.push(unit);
						break
					}
				}
			})
			taskData['taskAssignedRole'] = null
			taskData['taskAssignedDept'] = null
			taskData['taskAssignedTo'] = null
			unstable_batchedUpdates(() => {
				setUserLookup([])
				setDepartmentLookup(entity)
			})
		} else if (field === 'taskAssignedRole') {
			const { unitId = '' } = (value && e?.target?.options[e?.target?.selectedIndex]?.dataset?.entity) ? JSON.parse(e?.target?.options[e?.target?.selectedIndex]?.dataset?.entity) : { unitId: '' }
			userLookupRef.current = undefined
			taskData['taskAssignedDept'] = unitId
			taskData['taskAssignedTo'] = null
			setUserLookup([])
			getUsersBasedOnRole(unitId, value)
		}
		taskData[field] = value;
		setTaskData({ ...taskData });
	};

	// const handleActionChange = (actionIndex, field, value) => {
	// 	taskData.actions = taskData.actions.map((item, i) => {
	// 		if (i === actionIndex) return { ...item, [field]: value };
	// 		return item;
	// 	});

	// 	setTaskData({ ...taskData });
	// };

	const addNewTag = () => {
		if (containSpecialCharacter(tagTextSearch)) {
			toast.error("Tags cannot be contain special characters");
		}
		else if (tagTextSearch?.length > 20) {
			toast.error("Tags cannot be more than 20 characters");
		} else {
			let newTag = { value: tagTextSearch, label: tagTextSearch };
			// let newTag = { value: `TASK_${generateRandomString(6)}`, label: tagTextSearch };
			setTagsLookup([
				...tagsLookup, newTag
			]);
			let tags = taskData?.taskTags ?? [];
			let uniqueTags = [...new Set([...tags, newTag.value])];
			handleTaskChange("taskTags", uniqueTags)
			setTagTextSearch("");
		}
	}

	return (
		<React.Fragment>
			<div className="skel-tabs-role-config p-2">
				<div className="col-md-12">
					<div className="row">
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="stakeholder" className="control-label">
									Stakeholder Name
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
									<a onClick={() => handleShowClose('addLeadModal')} className="add-new-stake-link">add new?</a>
								</label>
								<div className="">
									<ReactSelect
										id='stakeholder'
										placeholder="Select Stakeholder"
										menuPortalTarget={document.body}
										styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
										options={leadList}
										onChange={(selected) => {
											handleTaskChange('leadUuid', selected.value)
										}}
										value={taskData.leadUuid ? leadList?.find(x => x.value === taskData.leadUuid) : null}
									/>
								</div>
								{formErrors.leadUuid && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.leadUuid}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="mission" className="control-label">
									Mission Name
									<a onClick={() => handleShowClose('addMissionModal')} className="add-new-stake-link">add new?</a>
								</label>
								<div className="">
									<ReactSelect
										id='Mission'
										placeholder="Select Mission"
										menuPortalTarget={document.body}
										styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
										options={missionList}
										onChange={(selected) => {
											handleTaskChange('missionUuid', selected.value)
										}}
										value={taskData?.missionUuid ? missionList?.find(x => x?.value === taskData?.missionUuid) : null}
									/>
								</div>
								{formErrors.missionUuid && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.missionUuid}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskName" className="control-label">
									Task Name
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								<input
									className="form-control"
									id="taskName"
									placeholder=""
									type="text"
									onChange={(e) =>
										handleTaskChange(e.target.id, e.target.value)
									}
									value={taskData?.taskName ?? ''}
								/>
								{formErrors.taskName && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskName}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskDescription" className="control-label">
									Task Description
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								<textarea
									className="form-control"
									id="taskDescription"
									placeholder=""
									type="text"
									onChange={(e) =>
										handleTaskChange(e.target.id, e.target.value)
									}
									value={taskData?.taskDescription ?? ''}
								/>
								{formErrors.taskDescription && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskDescription}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskPriority" className="control-label">
									Priority
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								<select
									className="form-control"
									id="taskPriority"
									required=""
									onChange={(e) =>
										handleTaskChange(e.target.id, e.target.value)
									}
									value={taskData?.taskPriority ?? ''}
								>
									<option value=''>Select Priority</option>
									{taskPriorityLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
								{formErrors.taskPriority && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskPriority}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskStatus" className="control-label">
									Status
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								<div className="">
									<select
										className="form-control"
										id="taskStatus"
										required=""
										onChange={(e) =>
											handleTaskChange(
												e.target.id,
												e.target.value
											)
										}
										value={taskData?.taskStatus ?? ''}>
										<option value=''>Select Status</option>
										{taskStatusLookup.map((item) => (
											<option key={item.code} value={item.code}>
												{item.description}
											</option>
										))}
									</select>
									{formErrors.taskStatus && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskStatus}</span>
									)}
								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskAssignedRole" className="control-label">
									Department/Role
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								{/* && permissions['readOnly'] */}
								<div className="">
									<select
										className="form-control"
										id="taskAssignedRole"
										required
										onChange={(e) =>
											handleTaskChange(
												e.target.id,
												e.target.value,
												e
											)
										}
										value={taskData?.taskAssignedRole ?? ''}>
										<option value=''>Select Department</option>
										{departmentLookup &&
											departmentLookup.map((dept, key) => (
												<optgroup key={key} label={dept?.entity?.[0]?.unitDesc}>
													{!!dept.roles.length &&
														dept.roles.map((data, childKey) => (
															<option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity[0])}>{data.roleDesc}</option>
														))}
												</optgroup>
											))}
									</select>
									{(formErrors.taskAssignedRole || formErrors.taskAssignedDept) && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskAssignedRole ?? formErrors.taskAssignedDept ?? ''}</span>
									)}
								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskAssignedTo" className="control-label">
									Assign To
								</label>
								<div className="">
									<select
										className="form-control"
										id="taskAssignedTo"
										required=""
										onChange={(e) =>
											handleTaskChange(
												e.target.id,
												e.target.value
											)
										}
										value={taskData?.taskAssignedTo ?? ''}>
										<option value=''>Select Person</option>
										{userLookup &&
											userLookup.map((user) => (
												<option key={user.userId} value={user.userId}>
													{user.firstName} {user.lastName}
												</option>
											))}
									</select>
									{formErrors.taskAssignedTo && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskAssignedTo}</span>
									)}
								</div>
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskDueDate" className="control-label">
									Due Date
									<span className="text-danger font-20 pl-1 fld-imp">
										*
									</span>
								</label>
								<input
									className="form-control"
									id="taskDueDate"
									placeholder=""
									type="date"
									min={moment().format('YYYY-MM-DD')}
									onChange={(e) =>
										handleTaskChange(e.target.id, e.target.value)
									}
									value={taskData?.taskDueDate ?? ''}
								/>
								{formErrors.taskDueDate && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskDueDate}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="taskTags" className="control-label">
									Tags
									{/* <span className="text-danger font-20 pl-1 fld-imp">*</span> */}
								</label>
								<ReactSelect
									id='taskTags'
									placeholder="Choose Tags"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									isMulti
									options={tagsLookup}
									onChange={(selected) => {
										let taskTags = selected.map(x => x.value)
										handleTaskChange("taskTags", taskTags)
									}}
									value={tagsLookup.filter(e => taskData?.taskTags?.includes(e.value))}
								/>
								{formErrors.taskTags && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.taskTags}</span>
								)}
							</div>
							{<div className="row mt-1">
								<div className="col-md" >
									<ul className="skel-top-inter doh-tags mb-0 mt-0">
										{tagsLookup.map((x, i) => (
											!taskData?.taskTags?.includes(x.value) && (i <= 2) && <li key={x.value} onClick={() => {
												let taskTags = taskData?.taskTags ?? [];
												let uniqueTags = [...new Set([...taskTags, x.value])];
												handleTaskChange("taskTags", uniqueTags)
											}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
										))}

									</ul>
								</div>
								<div className="col-md-auto ml-auto pl-0 text-right">
									<div className="dropdown d-inline-block mt-1">
										<a className="view-tags dropup text-13" href="#" role="button" data-toggle="dropdown" aria-expanded="false">
											View more
										</a>
										<div className="dropdown-menu dropdown-menu-right drop-up dropdown-menu-tags">
											<span className="dropdown-menu-arrow up"></span>
											<div className="p-1">
												<div className="form-group right-inner-addon input-container">
													{isAvailableInSearch(tagsLookup) ? (
														<i className={`fa fa-search`} style={{ pointerEvents: 'none' }}></i>
													) : (
														<i className={`fa fa-plus cursor-pointer`} onClick={addNewTag}></i>
													)}
													<input type="text" className="form-control" placeholder="Search" value={tagTextSearch} onChange={(e) => setTagTextSearch(e.target.value)} />
												</div>
												<div>
													{/* <ul className="skel-top-inter doh-tags">
													{tagsLookup.map(x => (
														(!missionData?.tags?.includes(x.value) && isAvailableInSearch(x)) && <li key={x.value} onClick={() => {
															let tags = missionData?.tags ?? [];
															let uniqueTags = [...new Set([...tags, x.value])];
															handleOnChange({ target: { id: 'tags', value: uniqueTags } })
														}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
													))}
												</ul> */}
													<ul className="skel-top-inter doh-tags">
														{tagsLookup.map(x => (
															(!taskData?.taskTags?.includes(x.value) && isAvailableInSearch(x)) && <li key={x.value} onClick={() => {
																let tags = taskData?.taskTags ?? [];
																let uniqueTags = [...new Set([...tags, x.value])];
																handleTaskChange("taskTags", uniqueTags)
															}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
														))}
													</ul>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>}
							{/* <div style={{ marginTop: '5px' }}>
							<ul className="skel-top-inter doh-tags">
								{tagsLookup.map((x, i) => (
									!taskData?.taskTags?.includes(x.value) && (i <= 8) && <li key={x.value} onClick={() => {
										let taskTags = taskData?.taskTags ?? [];
										let uniqueTags = [...new Set([...taskTags, x.value])];
										handleTaskChange("taskTags", uniqueTags)
									}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
								))}
							</ul>
						</div> */}
							{/* <div className="col-md-auto ml-auto pl-0 text-right" >
							<div className="dropdown d-inline-block mt-1">
								<a className="view-tags text-13" href="#" role="button" data-toggle="dropdown" aria-expanded="false">
									View more
								</a>
								<div className="dropdown-menu dropup-menu-right dropdown-menu-tags">
									<span className="dropdown-menu-arrow"></span>
									<div className="p-1">
										<div className="form-group right-inner-addon input-container">
											<i className={`fa fa-search`} style={{ pointerEvents: 'none' }}></i>
											<input type="text" className="form-control" placeholder="Search" value={tagTextSearch} onChange={(e) => setTagTextSearch(e.target.value)} />
										</div>
										<div>
											<ul className="skel-top-inter doh-tags">
												{tagsLookup.map(x => (
													(!leadData?.tags?.includes(x.value) && isAvailableInSearch(x)) && <li key={x.value} onClick={() => {
														let tags = leadData?.tags ?? [];
														let uniqueTags = [...new Set([...tags, x.value])];
														handleTaskChange('taskTags', uniqueTags)
													}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
												))}
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div> */}
						</div>
					</div>
				</div>
			</div>
			<Modal show={show.addLeadModal} onHide={() => handleShowClose('addLeadModal')} centered>
				<Modal.Header closeButton>
					<Modal.Title>Add New Stakeholder</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<AddEditLead
						data={{
							dontRedirectBack: true,
							sendDataBack: true
						}}
						handlers={{
							closeWindow: () => handleShowClose('addLeadModal'),
							dataCaptureFunction: setLeadData
						}}
					/>
				</Modal.Body>
			</Modal>
			<Modal show={show.addMissionModal} onHide={() => handleShowClose('addMissionModal')} centered>
				<Modal.Header closeButton>
					<Modal.Title>Add New Mission</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<AddEditMission
						data={{
							dontRedirectBack: true,
							sendDataBack: true,
							source: statusConstantCode.entityCategory.TASK
						}}
						handlers={{
							closeWindow: () => handleShowClose('addMissionModal'),
							dataCaptureFunction: setMissionData
						}}
					/>
				</Modal.Body>
			</Modal>
		</React.Fragment>
	);
};

export default TaskDetail;
