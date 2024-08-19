import DynamicTable from "../../common/table/DynamicTable";
import { useHistory }from "../../common/util/history";
import React, { useState, useEffect, useRef } from "react";
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from "../../properties";
import { get, post } from "../../common/util/restUtil";
import moment from "moment";
import ReactSelect from 'react-select';
import { formFilterObject } from "../../common/util/util";
import Swal from "sweetalert2";
const countryFlags = require("../../assets/files/country_flags.json");

const MissionList = (props) => {
	const [missionList, setMissionList] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [perPage, setPerPage] = useState(10);
	const [currentPage, setCurrentPage] = useState(0);
	const [filters, setFilters] = useState([]);
	const [listSearch, setListSearch] = useState([]);
	const isTableFirstRender = useRef(true);
	const masterRef = useRef();
	const inputRef = useRef({});
	const [customerTypeLookup, setCustomerTypeLookup] = useState([]);
	const [tagsLookup, setTagsLookup] = useState([]);
	const [customerCategoryLookup, setCustomerCategoryLookup] = useState([]);
	const [countryLookup, setCountryLookup] = useState([]);
	const [searchData, setSearchData] = useState({});
	const [showForm, setShowForm] = useState(false);
	const hasExternalSearch = useRef(false);
	const history = useHistory()
	useEffect(() => {
		get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=TAGS,COUNTRY,CUSTOMER_TYPE,CUSTOMER_CATEGORY,LEAD_STATUS").then((resp) => {
			if (resp.data) {
				masterRef.current = resp.data
				setCustomerTypeLookup(resp.data.CUSTOMER_TYPE);
				setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })));
				setCustomerCategoryLookup(resp.data.CUSTOMER_CATEGORY);
				setCountryLookup(resp.data.COUNTRY);
			}
		}).catch((error) => console.log(error));
	}, []);

	const handleCellRender = (cell, row) => {
		if (cell.column.id == "createdAt") {
			return (<span>{moment(row.original?.createdAt).format("YYYY-MM-DD hh:mm A")}</span>);
		}
		else if (cell.column.id == "missionName") {
			return (
				<a style={{ color: '#1675e0' }} onClick={() => {
					history("/mission-edit?missionUuid=" + row?.original?.missionUuid, { state: {data: row.original} })
				}}>{row.original.missionName}</a>
			);
		}
		else if (cell.column.id == "StakeholderName") {
			return (
				<a style={{ color: '#1675e0' }} onClick={() => {
					history("/leads-edit?leadUuid=" + row?.original?.leadDesc?.leadUuid, { state: {data: row?.original?.leadDesc?.leadName }})
				}}>{row?.original?.leadDesc?.leadName}</a>
			);
		}
		else {
			return (<span>{cell.value}</span>);
		}
	}

	const handlePageSelect = (pageNo) => {
		setCurrentPage(pageNo)
	}

	useEffect(() => {
		const requestBody = {
			filters: formFilterObject(filters)
		}
		setListSearch(requestBody);
		post(`${properties.LEAD_API}/get-missions?limit=${perPage}&offset=${currentPage}`, { ...searchData }).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp?.data?.count);
					setMissionList(resp?.data?.rows);
				})
			}
		}).catch((error) => {
			console.log(error)
		});
	}, [currentPage, perPage, filters])

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		if (id == 'missionCategory') {
			setCustomerTypeLookup(masterRef.current.CUSTOMER_TYPE.filter(f => f.mapping.customerCategory.includes(value)));
		}
		setSearchData({
			...searchData,
			[id]: value
		})
	};

	const clearSearch = () => {
		setSearchData({ ...{} });
		const inputFields = ["missionName", "taskName", "stakeholderName"];
		inputFields.forEach(field => {
			inputRef.current[field].value = "";
		});
		// searchMissions({});
	}

	const searchMissions = (searchData) => {
		if (
			!searchData?.country &&
			!searchData?.missionCategory &&
			!searchData?.missionName &&
			!searchData?.missionType &&
			!searchData?.stakeholderName &&
			!searchData?.tags &&
			!searchData?.taskName) {
			Swal.fire({
				text: "Enter at least single search criteria",
				icon: 'warning',
				showCancelButton: false,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: 'Ok',
				allowOutsideClick: false
			}).then((result) => {
				if (result.isConfirmed) {

				}
			}).catch((error) => {
				console.log(error)
			})
			return
		}
		const requestBody = {
			filters: Object.keys(searchData).map(x => ({ id: x, value: searchData[x], filter: 'contains' }))
		}
		setListSearch(requestBody);
		post(`${properties.LEAD_API}/get-missions?limit=${perPage}&offset=${currentPage}`, { ...searchData }).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp?.data?.count);
					setMissionList(resp?.data?.rows);
				})
			}
		}).catch((error) => {
			console.log(error)
		});
	}

	return (
		<div className="customer-skel">

			<div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-2">
				<div className="d-flex justify-content-end">
					<button className="skel-btn-submit" style={{ color: "#142cb1", cursor: "pointer" }} onClick={() => { setShowForm(!showForm) }}>Search</button>
					<button className="skel-btn-submit" onClick={() => { history("/mission-add") }}>
						Add Mission
					</button>
				</div>
				{showForm && <form className="">
					<div className="row">
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">StakeHolder Name</label>
								<input className="form-control" type="text" id="stakeholderName" onChange={handleOnChange}
									ref={el => inputRef.current['stakeholderName'] = el}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Mission Name</label>
								<input className="form-control" type="text" id="missionName" onChange={handleOnChange}
									ref={el => inputRef.current['missionName'] = el}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Mission Category</label>
								<select className="form-control" id="missionCategory" onChange={handleOnChange} value={searchData.missionCategory ?? ''}>
									<option selected="">Choose Category</option>
									{customerCategoryLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Mission Type</label>
								<select className="form-control" id="missionType" onChange={handleOnChange} value={searchData.missionType ?? ''}>
									<option selected="">Choose Type</option>
									{customerTypeLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Task Name</label>
								<input className="form-control" id="taskName" type="text" onChange={handleOnChange}
									ref={el => inputRef.current['taskName'] = el}
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
							<div className="form-group mb-0">
								<label htmlFor="" className="control-label">Country</label>
								<ReactSelect
									id='country'
									placeholder="Select Country"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
									options={countryLookup.map(e => ({ value: e.code, label: e.description }))}
									formatOptionLabel={country => {
										let countryImage = countryFlags.find(e => e.name == country.label)?.image;
										return (
											<div className="country-option">
												<img src={countryImage} height={25} width={40} />
												<span>{country.label}</span>
											</div>
										)
									}}
									onChange={(selected) => {
										handleOnChange({
											target: { id: 'country', value: selected.value }
										});
									}}
									value={searchData.country ? countryLookup.map(e => ({ value: e.code, label: e.description }))?.find(x => searchData.country == x.value) : null}
								/>
							</div>
						</div>
					</div>
					<div className="col-md-12 skel-btn-center-cmmn mt-2">
						<button type="button" className="skel-btn-cancel" onClick={clearSearch}>Clear</button>
						<button type="button" className="skel-btn-cancel ml-1" onClick={() => setShowForm(!showForm)}>Cancel</button>
						<button type="button" className="skel-btn-submit" onClick={() => searchMissions(searchData)}>Search</button>
					</div>
				</form>}
			</div>
			<div className="cmmn-skeleton">
				<div className="col-md-12 mt-1">
					<div className="skel-btn-row">
						{/* <button className="skel-btn-submit" onClick={() => { history("/mission-add") }}>
							Add Mission
						</button> */}
					</div>
					<div className="cust-table">
						<DynamicTable
							listSearch={listSearch}
							row={missionList}
							rowCount={totalCount}
							header={columns}
							itemsPerPage={perPage}
							backendPaging={true}
							isScroll={false}
							isTableFirstRender={isTableFirstRender}
							hasExternalSearch={hasExternalSearch}
							backendCurrentPage={currentPage}
							customClassName={'table-sticky-header'}
							url={properties.LEAD_API + `/get-missions?limit=${perPage}&offset=${currentPage}`}
							method='POST'
							handler={{
								handleCellRender: handleCellRender,
								handlePageSelect: handlePageSelect,
								handleItemPerPage: setPerPage,
								handleCurrentPage: setCurrentPage,
								handleFilters: setFilters
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MissionList;

const columns = [
	{
		Header: "Stakeholder Name",
		accessor: row => {
			return row?.leadDesc?.leadName ?? "";
		},
		disableFilters: true,
		id: "StakeholderName",
	},
	{
		Header: "Mission Name",
		accessor: row => {
			return row?.missionName ?? "";
		},
		disableFilters: true,
		id: "missionName",
	},
	{
		Header: "Mission Category",
		accessor: row => {
			return row?.missionCategoryDesc?.description ?? "";
		},
		disableFilters: true,
		id: "missionCategory",
	},
	{
		Header: "Mission Type",
		accessor: row => {
			return row?.missionTypeDesc?.description ?? "";
		},
		disableFilters: true,
		id: "missionTypeDesc",
	},
	{
		Header: "Country",
		accessor: row => {
			return row?.missionAddressDetails?.[0]?.countryDesc?.description ?? "";
		},
		disableFilters: true,
		id: "Country",
	},
	{
		Header: "City",
		accessor: row => {
			return row?.missionAddressDetails?.[0]?.city ?? "";
		},
		disableFilters: true,
		id: "City",
	},
	{
		Header: "Task Name",
		accessor: row => {
			const tasks = row?.missionTask?.map((ele) => ele?.taskName)
			return tasks?.join(", ")
		},
		disableFilters: true,
		id: "taskName",
	},
	{
		Header: "Task Description",
		accessor: row => {
			return row?.missionTask?.[0]?.taskDescription ?? "";
		},
		disableFilters: true,
		id: "taskDescription",
	},
	{
		Header: "Created By",
		accessor: row => {
			return `${row?.createdByName?.firstName || ''} ${row?.createdByName?.lastName || ""}`;
		},
		disableFilters: true,
		id: "createdByName",
	},
	{
		Header: "Created At",
		accessor: row => {
			return row?.createdAt ?? "";
		},
		disableFilters: true,
		id: "createdAt",
	},
	{
		Header: "Tags",
		accessor: row => {
			return row?.missionTags?.length > 0 && row?.missionTags?.map((ele) => ele)?.join(', ');
		},
		disableFilters: true,
		id: "missionTags",
	},
	{
		Header: "Status",
		accessor: row => {
			return row?.statusDesc?.description ?? "";
		},
		disableFilters: true,
		id: "statusDesc",
	}
]