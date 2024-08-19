import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import React, { useEffect, useState, useContext } from "react";
import ReactSelect from 'react-select';
import { AppContext } from "../../AppContext";
import moment from "moment";
import { Modal, Button } from 'react-bootstrap';
import AddEditLead from "./AddEditLead";

const TaskDetail = () => {
	const { data, handlers } = useContext(AppContext);
	const {
		taskData,
		taskCategoryLookup,
		taskTypeLookup,
		taskStatusLookup,
		error,
		tagsLookup,
		taskPriorityLookup,
		userLookup,
		leadList
	} = data;

	const { setTaskData, setLeadList } = handlers;

	const [leadData, setLeadData] = useState({});

	useEffect(() => {
		if (leadData.leadUuid && leadData.leadName) {
			leadList.push({ label: leadData.leadName, value: leadData.leadUuid });
			setLeadList([...leadList]);
			handleTaskChange('leadUuid', leadData.leadUuid);
		}
	}, [leadData])

	const [show, setShow] = useState({
		addLeadModal: false
	});

	const handleShowClose = (key) => {
		setShow({ ...show, [key]: !show[key] });
	};

	const handleAddAction = () => {
		if (!taskData.actions) taskData.actions = [];
		taskData.actions.push({});
		setTaskData({ ...taskData });
	};

	const deleteAction = (actionIndex) => {
		if (taskData.actions && taskData.actions.length > 0) {
			taskData.actions = taskData.actions.filter((item, i) => i !== actionIndex);
		}
		setTaskData({ ...taskData });
	};

	const handleTaskChange = (field, value) => {
		taskData[field] = value;
		setTaskData({ ...taskData });
	};

	const handleActionChange = (actionIndex, field, value) => {
		taskData.actions = taskData.actions.map((item, i) => {
			if (i === actionIndex) return { ...item, [field]: value };
			return item;
		});

		setTaskData({ ...taskData });
	};

	return (
		<React.Fragment>
			<div className="skel-tabs-role-config p-2">
				<div className="col-md-12 row">
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
									value={leadList.find(x => x.value == taskData.leadUuid)}
								/>
							</div>
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
								value={taskData.taskName}
							/>
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
								value={taskData.taskDescription}
							/>
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
								value={taskData.taskPriority}
							>
								<option>Select Priority</option>
								{taskPriorityLookup.map((item) => (
									<option key={item.code} value={item.code}>
										{item.description}
									</option>
								))}
							</select>
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="taskAssignedTo" className="control-label">
								Assign To
								<span className="text-danger font-20 pl-1 fld-imp">
									*
								</span>
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
									value={taskData.taskAssignedTo}
								>
									<option>Select Person</option>
									{userLookup &&
										userLookup.map((user) => (
											<option key={user.userId} value={user.userId}>
												{user.firstName} {user.lastName}
											</option>
										))}
								</select>
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
								value={taskData.taskDueDate}
							/>
						</div>
					</div>
					{/* <div className="col-md-3">
						<div className="form-group">
							<label htmlFor="taskCategory" className="control-label">
								Task Category
								<span className="text-danger font-20 pl-1 fld-imp">
									*
								</span>
							</label>
							<div className="">
								<select
									className="form-control"
									id="taskCategory"
									required=""
									onChange={(e) =>
										handleTaskChange(
											e.target.id,
											e.target.value
										)
									}
									value={taskData?.taskCategory}
								>
									<option>Select Category</option>
									{taskCategoryLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="taskType" className="control-label">
								Task Type
								<span className="text-danger font-20 pl-1 fld-imp">
									*
								</span>
							</label>
							<div className="">
								<select
									className="form-control"
									id="taskType"
									required=""
									onChange={(e) =>
										handleTaskChange(
											e.target.id,
											e.target.value
										)
									}
									value={taskData.taskType}
								>
									<option>Select Type</option>
									{taskTypeLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
						</div>
					</div> */}
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
									value={taskData.taskStatus}
								>
									<option>Select Status</option>
									{taskStatusLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="taskTags" className="control-label">
								Tags
								<span className="text-danger font-20 pl-1 fld-imp">*</span>
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
						</div>
						<div style={{ marginTop: '5px' }}>
							<ul className="skel-top-inter doh-tags">
								{tagsLookup.map(x => (
									!taskData?.taskTags?.includes(x.value) && <li key={x.value} onClick={() => {
										let taskTags = taskData?.taskTags ?? [];
										let uniqueTags = [...new Set([...taskTags, x.value])];
										handleTaskChange("taskTags", uniqueTags)
									}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
								))}
							</ul>
						</div>
					</div>

					{/* <div className="col-md-3 mt-2">
						<div className="form-group">
							<label htmlFor="taskStatus" className="control-label">
								File Upload
							</label>
							<div className="">
								<input type="file" />
							</div>
						</div>
					</div> */}
					<div className="col-md-12 mt-3">
						<div className="row">
							<div className="col-md-9">
								<h5>Actions</h5>
							</div>
							<div className="col-md-3 pull-right">
								<button
									className="skel-btn-submit"
									onClick={() => handleAddAction()}
								>
									Add Action
								</button>
							</div>
						</div>
						{taskData?.actions?.map((action, actionIndex) => (
							<div className="row col-12 border p-2 bg-light mt-2" key={actionIndex}>
								<div className="col-md-3">
									<div className="form-group">
										<label htmlFor="actionName" className="control-label">
											Description
										</label>
										<textarea
											className="form-control"
											id="actionName"
											rows="3"
											onChange={(e) =>
												handleActionChange(
													actionIndex,
													e.target.id,
													e.target.value
												)
											}
											value={action.actionName}
										></textarea>
									</div>
								</div>
								<div className="col-md-3">
									<div className="form-group">
										<label htmlFor="actionStatus" className="control-label">
											Action Status
											<span className="text-danger font-20 pl-1 fld-imp">
												*
											</span>
										</label>
										<div className="">
											<select
												className="form-control"
												id="actionStatus"
												required=""
												onChange={(e) =>
													handleActionChange(
														actionIndex,
														e.target.id,
														e.target.value
													)
												}
												value={action.actionStatus}
											>
												<option>Select Status</option>
												{taskStatusLookup.map((item) => (
													<option key={item.code} value={item.code}>
														{item.description}
													</option>
												))}
											</select>
										</div>
									</div>
								</div>
								<div className="col-md-3">
									<div className="form-group">
										<label htmlFor="actionDueDate" className="control-label">
											Action Due Date
											<span className="text-danger font-20 pl-1 fld-imp">
												*
											</span>
										</label>
										<input
											className="form-control"
											id="actionDueDate"
											placeholder=""
											type="date"
											onChange={(e) =>
												handleActionChange(
													actionIndex,
													e.target.id,
													e.target.value
												)
											}
											value={action.actionDueDate}
										/>{" "}
									</div>
								</div>
								<div className="col-md-3">
									<div className="form-group">
										<label htmlFor="actionPerson" className="control-label">
											Person
											<span className="text-danger font-20 pl-1 fld-imp">
												*
											</span>
										</label>
										<div className="">
											<select
												className="form-control"
												id="actionPerson"
												required=""
												onChange={(e) =>
													handleActionChange(
														actionIndex,
														e.target.id,
														e.target.value
													)
												}
												value={action.actionPerson}
											>
												<option>Select Person</option>
												{userLookup &&
													userLookup.map((user) => (
														<option key={user.userId} value={user.userId}>
															{user.firstName} {user.lastName}
														</option>
													))}
											</select>
										</div>
									</div>
								</div>
								{actionIndex != 0 && <div className="col-md-12 mt-2">
									<button
										onClick={() => deleteAction(actionIndex)}
										className="btn btn-danger btn-sm"
									>
										Remove Action
									</button>
								</div>
								}
							</div>
						))}
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
		</React.Fragment>
	);
};

export default TaskDetail;
