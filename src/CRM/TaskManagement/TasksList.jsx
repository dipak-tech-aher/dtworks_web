import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { unstable_batchedUpdates } from 'react-dom';
import ReactSelect from 'react-select';
import { toast } from "react-toastify";
import { DatePicker } from 'rsuite';
import DynamicTable from "../../common/table/DynamicTable";
import { useHistory }from "../../common/util/history";
import { get, post } from "../../common/util/restUtil";
import { properties } from "../../properties";

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
	const [displayForm, setDisplayForm] = useState(false)
	const history = useHistory()
	const handleCellRender = (cell, row) => {
		if (cell.column.id === "createdAt") {
			return (<span>{row.original?.createdAt ? moment(row.original?.createdAt).format("YYYY-MM-DD hh:mm A") : ''}</span>);
		} else if (cell.column.id === "dueDate") {
			return (<span>{row.original?.dueDate ? moment(row.original?.dueDate).format("YYYY-MM-DD") : ''}</span>);
		} else if (cell.column.id === "taskName") {
			return (
				<span className="text-secondary cursor-pointer" onClick={() => {
					history("/tasks-edit?taskUuid=" + row?.original?.taskUuid)
				}}>{row.original.taskName}</span>
			)
		} else if (cell.column.id === "leadName") {
			return (
				<span className="text-secondary cursor-pointer" onClick={() => {
					history("/leads-edit?leadUuid=" + row?.original?.leadDetails?.leadUuid)
				}}>{row?.original?.leadDetails?.leadName}</span>
			);
		} else if (cell.column.id === "missionName") {
			return (
				<span className="text-secondary cursor-pointer" onClick={() => {
					history("/mission-edit?missionUuid=" + row?.original?.missionDetails?.missionUuid)
				}}>{row?.original?.missionDetails?.missionName}</span>
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
		// ?limit=${perPage}&offset=${currentPage}
		post(`${properties.LEAD_API}/get-missions`, {}).then((resp) => {
			if (resp.status === 200) {
				setMissionList(resp.data?.rows?.map(x => ({ label: x.missionName, value: x.missionUuid })));
			}
		}).catch((error) => console.error(error));
	}, [])

	useEffect(() => {
		const requestBody = {
			filters: Object.keys(searchData).map(x => ({ id: x, value: searchData[x], filter: 'contains' }))
		}
		post(`${properties.LEAD_API}/tasks/search?limit=${perPage}&offset=${currentPage}`, requestBody).then((resp) => {
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

	const handleOnClickSearch = (e) => {
		e.preventDefault()
		if (!isEmpty(searchData)) {
			searchTasks(searchData)
			setCurrentPage(0)
		} else {
			toast.warn('Please enter at least single search criteria')
		}
	}

	return (
		<div className="customer-skel">
			<div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-2">
				<div className="d-flex justify-content-end">
					{!displayForm && <button className="skel-btn-submit" style={{ color: "#142cb1", cursor: "pointer" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Search"}</button>
					}<button className="skel-btn-submit" onClick={() => { history("/tasks-add") }}>
						Add Task
					</button>
				</div>
				{/* <div className="skel-btn-row mb-3">
				
				</div> */}
				<hr className="cmmn-hline mt-2" />
				{displayForm && <form className="">
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
									isClearable
									placeholder="Select Stakeholder"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									options={leadList}
									onChange={(selected) => {
										handleOnChange({ target: { id: 'leadUuid', value: selected?.value ?? null } })
									}}
									value={searchData.leadUuid ? leadList.find(x => x.value === searchData.leadUuid) : null}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Mission Name</label>
								<ReactSelect
									id='missionName'
									isClearable
									placeholder="Select Mission"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									options={missionList}
									onChange={(selected) => {
										handleOnChange({ target: { id: 'missionUuid', value: selected?.value ?? null } })
									}}
									value={searchData.missionUuid ? missionList.find(x => x.value === searchData.missionUuid) : null}
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
									format="yyyy-MM-dd"
									placeholder="Select date"
									value={searchData.dueDate ? new Date(searchData.dueDate) : null}
									showMeridian
									onChange={(dateTime) => {
										dateTime = dateTime ? new Date(moment(dateTime).format('YYYY-MM-DD')) : null;
										handleOnChange({ target: { id: 'dueDate', value: dateTime } })
									}}
								/>
							</div>
						</div>
					</div>
					<div className="col-md-12 skel-btn-center-cmmn">
						<button type="button" className="skel-btn-cancel" onClick={clearSearch}>Clear</button>
						<button type="button" className="skel-btn-cancel ml-1" onClick={() => { setDisplayForm(false); clearSearch() }}>Cancel</button>
						<button type="button" className="skel-btn-submit" onClick={handleOnClickSearch}>Search</button>
					</div>
				</form>}
				{/* </div>
			<div className="cmmn-skeleton"> */}
				<div className="col-md-12 mt-1">
					{/* <div className="skel-btn-row mb-3">
						<button className="skel-btn-submit" onClick={() => { history("/tasks-add") }}>
							Add Task
						</button>
					</div> */}
					<div className="cust-table">
						<DynamicTable
							row={taskList}
							rowCount={totalCount}
							header={columns}
							itemsPerPage={perPage}
							backendPaging={true}
							isScroll={true}
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
		Header: "Task Name",
		accessor: "taskName",
		disableFilters: true,
		id: "taskName"
	},
	{
		Header: "Stakeholder Name",
		accessor: "leadDetails.leadName",
		disableFilters: true,
		id: "leadName"
	},
	{
		Header: "Mission Name",
		accessor: "missionDetails.missionName",
		disableFilters: true,
		id: "missionName"
	},
	{
		Header: "Task Description",
		accessor: "taskDescription",
		disableFilters: true,
		id: "taskDescription",
	},
	{
		Header: "Priority",
		accessor: "priorityDesc.description",
		disableFilters: true,
		id: "priorityDesc"
	},
	{
		Header: "Assigned To",
		accessor: "assignedToDetails.fullName",
		disableFilters: true,
		id: "assignedToDetails"
	},
	{
		Header: "Due Date",
		accessor: "dueDate",
		disableFilters: true,
		id: "dueDate"
	},
	{
		Header: "Status",
		accessor: "statusDesc.description",
		disableFilters: true,
		id: "statusDesc"
	},
	{
		Header: "Tags",
		accessor: row => {
			return row?.tags?.length > 0 && row?.tags?.map((ele) => ele)?.join(', ');
		},
		disableFilters: true,
		id: "tags"
	},
	{
		Header: "Created By",
		accessor: "createdUserDetails.fullName",
		disableFilters: true,
		id: "taskCreatedBy"
	},
	{
		Header: "Created At",
		accessor: "createdAt",
		disableFilters: true,
		id: "createdAt"
	}
]