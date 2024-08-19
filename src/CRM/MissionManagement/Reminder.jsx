import isBefore from 'date-fns/isBefore';
import moment from 'moment';
import React, { useContext, useState } from "react";
import { Button, Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { DatePicker } from 'rsuite';
import { AppContext } from "../../AppContext";

const Reminders = () => {
	const { data, handlers } = useContext(AppContext);
	const { missionData, reminderList, userLookup, engagementList, deletedReminders, isEdit, role, formErrors, usersBasedOnRole } = data;
	const { setMissionData, setReminderList, setDeletedReminders, getUsersBasedOnRole } = handlers;
	const getRandomId = () => Math.floor(100000 + Math.random() * 900000);

	const [selectedReminder, setSelectedReminder] = useState({});
	const [roles, setRoles] = useState([]);
	const [show, setShow] = useState({
		reminderDeleteModal: false
	});

	const handleOnChange = (key, value, index) => {
		if (key === 'departmentId') {
			const roleIds = role?.departments
				?.filter(ele => ele?.unitId === value).map(ele => ele?.mappingPayload?.unitroleMapping);
			const rolesList = role?.roles?.filter((ele) => roleIds?.[0]?.includes(Number(ele?.roleId)));
			setRoles((prevRoles) => ({
				...prevRoles,
				[`roles_${index}`]: rolesList
			}));
		}
		if (key === 'roleId') {
			getUsersBasedOnRole(value, reminderList[index]['departmentId'], index)
		}
		reminderList[index][key] = value;
		setMissionData({
			...missionData,
			reminderList: [...reminderList]
		});
	};

	const handleShowClose = (key) => {
		setShow({
			...show,
			[key]: !show[key]
		});
		setSelectedReminder({ ...{} });
	};

	const handleAddReminder = () => {
		let updatedArray = [...reminderList, { leadTaskReminderId: getRandomId() }];
		setReminderList(updatedArray);
		setMissionData({
			...missionData,
			reminderList: updatedArray
		});
	};

	const deleteReminderRow = (e, index, instantDelete = false, deleteObj) => {
		if (e) { e.preventDefault() }
		if (instantDelete) {
			// console.log('--------deleteing---------', reminderList)
			const updatedReminderList = reminderList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setReminderList(updatedReminderList);
			setMissionData({
				...missionData,
				reminderList: updatedReminderList,
			});
		} else {
			setTimeout(() => {
				var data = reminderList[index];
				setSelectedReminder({ ...data });
			}, 100);
		}
		handleShowClose('reminderDeleteModal');
	};

	const proceedDelete = (modalName) => {
		if (modalName == "reminderDeleteModal") {
			if (selectedReminder?.leadTaskReminderId) {
				setDeletedReminders([...deletedReminders, selectedReminder.leadTaskReminderId])
				deleteReminderRow(null, 0, true, { key: 'leadTaskReminderId', value: selectedReminder?.leadTaskReminderId });
				toast.success("Reminder has been deleted");
			} else {
				deleteReminderRow(null, 0, true, { key: 'leadTaskReminderId', value: selectedReminder?.leadTaskReminderId });
			}
		}
	}

	return (
		<div className="skel-tabs-role-config p-2">
			<div className="row">
				<div className="col-6"></div>
				<div className="col-6 text-right mb-2">
					<button disabled={isEdit} className="btn btn-primary btn-sm" onClick={handleAddReminder}>
						Add New Reminders
					</button>
				</div>
			</div>
			<div className="col-12">
				<div className="col-md-12">
					<table id="employee-table" className="table table-bordered table-striped">
						<tr>
							<th>Reminder Date </th>
							<th>Engagement </th>
							<th>Department </th>
							<th>Role </th>
							<th>Set Reminder To </th>
							<th>Description </th>
							<th>Action</th>
						</tr>
						{reminderList.map((item, index) => (
							<tr>
								<td>
									<DatePicker
										placement='autoVerticalStart'
										// disabled={isEdit}
										readOnly={isEdit}
										format="yyyy-MM-dd"
										placeholder="Select date"
										shouldDisableDate={date => isBefore(date, new Date())}
										showMeridian
										value={item.reminderDate ? new Date(item.reminderDate) : null}
										onChange={(reminderDate) => {
											reminderDate = reminderDate ? moment(reminderDate).format('YYYY-MM-DD') : null;
											handleOnChange("reminderDate", reminderDate ? new Date(reminderDate) : '', index)
										}}
									/><br />
									{formErrors[`reminderList[${index}].reminderDate`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].reminderDate`]}</span>
									)}
								</td>
								<td>
									<select disabled={isEdit} className="form-control" id="engagementId" value={item.engagementId} onChange={(e) => {
										handleOnChange("engagementId", e.target.value, index);
									}}>
										<option selected="">Select Engagement</option>
										{engagementList.map((item) => (
											<option key={item.engagementId} value={item.engagementId}>
												{item.engagementName}
											</option>
										))}
									</select>
									{formErrors[`reminderList[${index}].engagementId`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].engagementId`]}</span>
									)}
								</td>
								<td>
									<select disabled={isEdit} className="form-control" id="departmentId" value={item.departmentId ?? item?.toDept} onChange={(e) => {
										handleOnChange("departmentId", e.target.value, index);
									}}>
										<option selected="">Select Department</option>
										{
											role?.departments && role?.departments?.map((e) => (
												<option key={e.unitId} value={e.unitId} data-object={JSON.stringify(e)}>{e.unitDesc}</option>
											))
										}
									</select>
									{formErrors[`reminderList[${index}].departmentId`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].departmentId`]}</span>
									)}
								</td>
								<td>
									<select disabled={isEdit} className="form-control" id="roleId" value={item?.roleId ?? item?.toRoleId} onChange={(e) => {
										handleOnChange("roleId", e.target.value, index);
									}}>
										<option selected="">Select Role</option>
										{
											roles && role['role_' + index] ? roles['roles_' + index]?.map((e) => (
												<option key={e.roleId} value={e.roleId} data-object={JSON.stringify(e)}>{e.roleDesc}</option>
											)) : role?.roles?.map((e) => (
												<option key={e.roleId} value={e.roleId} data-object={JSON.stringify(e)}>{e.roleDesc}</option>
											))
										}
									</select>
									{formErrors[`reminderList[${index}].roleId`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].roleId`]}</span>
									)}
								</td>
								<td>
									<select disabled={isEdit} className="form-control" id="toUser" value={item?.toUser ?? item?.reminderToUser?.userId} onChange={(e) => {
										handleOnChange("toUser", e.target.value, index);
									}}>
										<option selected="">Select User</option>
										{
											usersBasedOnRole.length > 0 ? usersBasedOnRole['users_' + index]?.map((e) => (
												<option key={e?.userId} value={e?.userId} data-object={JSON.stringify(e)}>{e?.firstName} {e?.lastName}</option>
											)) : userLookup['users_' + index]?.map((e) => (
												<option key={e?.userId} value={e?.userId} data-object={JSON.stringify(e)}>{e?.firstName} {e?.lastName}</option>
											))
										}
									</select>
									{formErrors[`reminderList[${index}].toUser`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].toUser`]}</span>
									)}
								</td>
								<td>
									<input
										disabled={isEdit}
										className="form-control"
										id="description"
										type="text"
										onChange={(e) => {
											handleOnChange("description", e.target.value, index);
										}}
										value={item.description}
									/>
									{formErrors[`reminderList[${index}].description`] && (
										<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`reminderList[${index}].description`]}</span>
									)}
								</td>
								<td>
									<button disabled={isEdit} className="btn btn-danger btn-sm"
										onClick={(e) => deleteReminderRow(e, index)}>
										Delete
									</button>
								</td>
							</tr>
						))}
					</table>
				</div>
			</div>
			<Modal show={show.reminderDeleteModal} className="confirmation-popup" onHide={() => handleShowClose('reminderDeleteModal')} centered>
				<Modal.Header closeButton>
					<Modal.Title>Delete window</Modal.Title>
				</Modal.Header>
				<Modal.Body>Are you sure want to delete this reminder?</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={() => handleShowClose('reminderDeleteModal')}>
						Cancel
					</Button>
					<Button variant="primary" onClick={() => proceedDelete('reminderDeleteModal')}>
						Proceed
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};

export default Reminders;
