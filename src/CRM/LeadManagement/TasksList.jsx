import DynamicTable from "../../common/table/DynamicTable";
import { useHistory }from "../../common/util/history";
import React, { useState, useEffect, useRef } from "react";
import ReactSelect from 'react-select';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";
import moment from "moment";
import { DatePicker } from 'rsuite';

const TasksList = (props) => {
	const [taskList, setTaskList] = useState([]);
	const [missionList, setMissionList] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [perPage, setPerPage] = useState(10);
	const [currentPage, setCurrentPage] = useState(0);
	const inputRef = useRef({});
	const [leadList, setLeadList] = useState([]);
	const [userLookup, setUserLookup] = useState([]);
	const [tagsLookup, setTagsLookup] = useState([]);
	const [taskStatusLookup, setTaskStatusLookup] = useState([]);
	const [taskPriorityLookup, setTaskPriorityLookup] = useState([]);
	const [searchData, setSearchData] = useState({});
	const [listSearch, setListSearch] = useState([]);
	const history = useHistory()
	const handleCellRender = (cell, row) => {
		if (cell.column.id == "taskCreatedAt") {
			return (<span>{moment(row.original?.taskCreatedAt).format("YYYY-MM-DD hh:mm A")}</span>);
		} else if (cell.column.id == "taskName") {
			return (
				<a style={{ color: '#1675e0' }} onClick={() => {
					history("/tasks-edit?taskUuid=" + row?.original?.taskUuid)
				}}>{row.original.taskName}</a>
			);
		} else if (cell.column.id == "leadName") {
			return (
				<a style={{ color: '#1675e0' }} onClick={() => {
					history("/leads-edit?leadUuid=" + row?.original?.leadDetails?.leadUuid)
				}}>{row?.original?.leadDetails?.leadName}</a>
			);
		} else {
			return (<span>{cell.value}</span>);
		}
	}

	const handlePageSelect = (pageNo) => {
		setCurrentPage(pageNo)
	}

	useEffect(() => {
		get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=TAGS,PRIORITY,LEAD_TASK_STATUS").then((resp) => {
			if (resp.data) {
				setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })));
				setTaskStatusLookup(resp.data.LEAD_TASK_STATUS?.map(x => ({ value: x.code, label: x.description })));
				setTaskPriorityLookup(resp.data.PRIORITY?.map(x => ({ value: x.code, label: x.description })));
			}
		}).catch((error) => console.error(error));
		post(`${properties.USER_API}/search?limit=10&page=0`).then((userResponse) => {
			const { data } = userResponse;
			setUserLookup(data.rows);
		}).catch((error) => console.error(error));
		post(`${properties.LEAD_API}/search`, { withOutAssociations: true }).then((resp) => {
			if (resp.status === 200) {
				setLeadList(resp.data.rows.map(x => ({ label: x.leadName, value: x.leadUuid })));
			}
		}).catch((error) => console.error(error));
		post(`${properties.LEAD_API}/mission/search?limit=${perPage}&offset=${currentPage}`, {}).then((resp) => {
			if (resp.status === 200) {
				setMissionList(resp.data.map(x => ({ label: x.missionName, value: x.missionUuid })));
			}
		}).catch((error) => console.error(error));
	}, [])

	useEffect(() => {
		post(`${properties.LEAD_API}/tasks/search?limit=${perPage}&offset=${currentPage}`).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp.data.count);
					setTaskList(resp.data.rows);
				})
			}
		}).catch(err => console.error(err))
	}, [currentPage, perPage])

	const clearSearch = () => {
		setSearchData({ ...{} });
		const inputFields = ["taskName", "taskName"];
		inputFields.forEach(field => {
			inputRef.current[field].value = "";
		});
		searchTasks({});
	}

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		setSearchData({
			...searchData,
			[id]: value
		})
	};

	const searchTasks = (searchData) => {
		const requestBody = {
			filters: Object.keys(searchData).map(x => ({ id: x, value: searchData[x], filter: 'contains' }))
		}
		setListSearch(requestBody);
		post(`${properties.LEAD_API}/tasks/search?limit=${perPage}&offset=${currentPage}`, requestBody).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp.data.count);
					setTaskList(resp.data.rows);
				})
			}
		}).catch((error) => {
			console.error(error)
		});
	}

	return (
		<div className="customer-skel">
			<div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-2">
				<form className="">
					<div className="row">
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Task Name</label>
								<input className="form-control" type="text" id="taskName" onChange={handleOnChange}
									ref={el => inputRef.current['taskName'] = el}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Priority</label>
								<select className="form-control" id="priority" onChange={handleOnChange} value={searchData.priority ?? ''}>
									<option selected="">Choose Priority</option>
									{taskPriorityLookup.map((item) => (
										<option key={item.value} value={item.value}>
											{item.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Assigned To</label>
								<select className="form-control" id="assignedTo" onChange={handleOnChange} value={searchData.assignedTo ?? ''}>
									<option selected="">Choose User</option>
									{userLookup.map((item) => (
										<option key={item.userId} value={item.userId}>
											{item.firstName} {item.lastName ?? ''}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Status</label>
								<select className="form-control" id="status" onChange={handleOnChange} value={searchData.status ?? ''}>
									<option selected="">Choose Status</option>
									{taskStatusLookup.map((item) => (
										<option key={item.value} value={item.value}>
											{item.label}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Stakeholder Name</label>
								<ReactSelect
									id='stakeholder'
									placeholder="Select Stakeholder"

									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

									options={leadList}

									onChange={(selected) => {
										handleOnChange({ target: { id: 'leadUuid', value: selected.value } })
									}}
									value={leadList.find(x => x.value == searchData.leadUuid)}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Mission Name</label>
								<ReactSelect
									id='stakeholder'
									placeholder="Select Mission"

									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

									options={missionList}

									onChange={(selected) => {
										handleOnChange({ target: { id: 'missionUuid', value: selected.value } })
									}}
									value={missionList.find(x => x.value == searchData.missionUuid)}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group mb-0">
								<label htmlFor="" className="control-label">Tags</label>
								<ReactSelect
									id='tags'
									placeholder="Choose Tags"

									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									isMulti

									options={tagsLookup}

									onChange={(selected) => {
										handleOnChange({ target: { id: 'tags', value: selected.map(x => x.value) } })
									}}
									value={tagsLookup.filter(e => searchData?.tags?.includes(e.value))}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Due Date</label>
								<DatePicker
									format="yyyy-MM-dd hh:mm aa"
									placeholder="Select date & time"
									showMeridian
									oneTap
									onChange={(dateTime) => {
										dateTime = dateTime ? new Date(moment(dateTime).format('YYYY-MM-DD hh:mm:ss')) : null;
										handleOnChange({ target: { id: 'dueDate', value: dateTime } })
									}}
								/>
							</div>
						</div>
					</div>
					<div className="col-md-12 skel-btn-center-cmmn mt-2">
						<button type="button" className="skel-btn-cancel" onClick={clearSearch}>Clear</button>
						<button type="button" className="skel-btn-cancel ml-1">Cancel</button>
						<button type="button" className="skel-btn-submit" onClick={() => searchTasks(searchData)}>Search</button>
					</div>
				</form>
			</div>
			<div className="cmmn-skeleton">
				<div className="col-md-12 mt-1">
					<div className="skel-btn-row mb-3">
						<button className="skel-btn-submit" onClick={() => { history("/tasks-add") }}>
							Add Task
						</button>
					</div>
					<div className="cust-table">
						<DynamicTable
							row={taskList}
							rowCount={totalCount}
							header={columns}
							itemsPerPage={perPage}
							backendPaging={true}
							isScroll={false}
							backendCurrentPage={currentPage}
							customClassName={'table-sticky-header'}
							url={properties.LEAD_API + `/tasks/search?limit=${perPage}&offset=${currentPage}`}
							method='POST'
							handler={{
								handleCellRender: handleCellRender,
								handlePageSelect: handlePageSelect,
								handleItemPerPage: setPerPage,
								handleCurrentPage: setCurrentPage,
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TasksList;

const columns = [
	{
		Header: "Stakeholder Name",
		accessor: "leadDetails.leadName",
		disableFilters: false,
		id: "leadName"
	},
	{
		Header: "Task Name",
		accessor: "taskName",
		disableFilters: false,
		id: "taskName"
	},
	{
		Header: "Task Description",
		accessor: "taskDescription",
		disableFilters: false,
		id: "taskDescription",
	},
	{
		Header: "Priority",
		accessor: "taskPriority.description",
		disableFilters: false,
		id: "taskPriority"
	},
	{
		Header: "Status",
		accessor: "taskStatus.description",
		disableFilters: false,
		id: "taskStatus"
	},
	{
		Header: "Assigned To",
		accessor: "taskAssignedTo.fullName",
		disableFilters: false,
		id: "taskAssignedTo"
	},
	{
		Header: "Created By",
		accessor: "taskCreatedBy.fullName",
		disableFilters: false,
		id: "taskCreatedBy"
	},
	{
		Header: "Due Date",
		accessor: "taskDueDate",
		disableFilters: false,
		id: "taskDueDate"
	},
	{
		Header: "Created At",
		accessor: "taskCreatedAt",
		disableFilters: false,
		id: "taskCreatedAt"
	}
]