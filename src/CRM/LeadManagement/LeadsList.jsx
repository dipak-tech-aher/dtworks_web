import { isEmpty } from 'lodash';
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { unstable_batchedUpdates } from 'react-dom';
import ReactSelect from 'react-select';
import { toast } from "react-toastify";
import DynamicTable from "../../common/table/DynamicTable";
import { useHistory }from "../../common/util/history";
import { get, post } from "../../common/util/restUtil";
import { formFilterObject } from "../../common/util/util";
import { properties } from "../../properties";

const countryFlags = require("../../assets/files/country_flags.json");

const LeadsList = (props) => {
	const [leadList, setLeadList] = useState([]);
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
	const [displayForm, setDisplayForm] = useState(false)
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
		}).catch((error) => console.error(error));
	}, []);

	const handleCellRender = (cell, row) => {
		const filtered = row.original.leadAddress && row?.original?.leadAddress
			.filter((ele) => ele?.isPrimary)
			.sort((a, b) => (a?.addressNo > b?.addressNo) ? 1 : ((b.addressNo > a.addressNo) ? -1 : 0))

		if (cell.column.id === "createdAt" || cell.column.id === 'taskCreatedAt') {
			return (<span>{row.original?.createdAt ? moment(row.original?.createdAt).format("YYYY-MM-DD hh:mm A") : '-'}</span>);
		} else if (cell.column.id === "country") {
			// const filtered = row.original.leadAddress && row?.original?.leadAddress
			// 	.filter((ele) => ele?.isPrimary)
			// 	.sort((a, b) => (a?.addressNo > b?.addressNo) ? 1 : ((b.addressNo > a.addressNo) ? -1 : 0))
			return (<span>{filtered?.[0]?.country ?? ''}</span>)
		} else if (cell.column.id === "leadName") {
			return (
				<span style={{ color: '#1675e0' }} className="cursor-pointer" onClick={() => {
					history("/leads-edit?leadUuid=" + row?.original?.leadUuid, { state: {data: row.original} })
				}}>{row.original.leadName}</span>
			);
		} else if (cell.column.id === "city") {
			return (<span>{filtered?.[0]?.city ?? ''}</span>)
		} else {
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
		post(`${properties.LEAD_API}/search?limit=${perPage}&page=${currentPage}`, requestBody).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp.data.count);
					setLeadList(resp.data.rows);
				})
			}
		}).catch((error) => {
			console.error(error)
		});
	}, [filters])

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		if (id === 'leadCategory') {
			setCustomerTypeLookup(masterRef.current.CUSTOMER_TYPE.filter(f => f.mapping.customerCategory.includes(value)));
		}
		setSearchData({
			...searchData,
			[id]: value
		})
	};

	const clearSearch = () => {
		unstable_batchedUpdates(() => {
			searchLeads({})
			setPerPage(10)
			setCurrentPage(0)
			setTotalCount(0)
			setSearchData({ ...{} });
			const inputFields = ["leadName", "taskName"];
			inputFields.forEach(field => {
				inputRef.current[field].value = "";
			});

		})
	}

	const searchLeads = (searchData) => {
		const requestBody = {
			filters: Object.keys(searchData)?.map(x => ({ id: x, value: searchData?.[x] ?? null, filter: 'contains' }))
		}
		setListSearch(requestBody);
		post(`${properties.LEAD_API}/search?limit=${perPage}&offset=${currentPage}`, requestBody).then((resp) => {
			if (resp.status === 200) {
				unstable_batchedUpdates(() => {
					setTotalCount(resp.data.count);
					setLeadList(resp.data.rows);
				})
			}
		}).catch((error) => {
			console.error(error)
		});
	}

	const handleOnClickSearch = (e) => {
		e.preventDefault()
		if (!isEmpty(searchData)) {
			searchLeads(searchData)
		} else {
			toast.warn('Please enter at least single search criteria')
		}
	}

	return (
		<div className="customer-skel">
			<div className="container-fluid cust-skeleton cmmn-skeleton mt-2 mb-2">
				<div className="d-flex justify-content-end">
					{!displayForm && <button className="skel-btn-submit" style={{ color: "#142cb1", cursor: "pointer" }} onClick={() => { setDisplayForm(!displayForm) }}>{displayForm ? "Hide Search" : "Search"}</button>}
					<button className="skel-btn-submit" onClick={() => { history("/leads-add") }}>
						Add Stakeholder
					</button>
				</div>
				{displayForm && <form className="">
					<div className="row">
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Stakeholder Name</label>
								<input className="form-control" type="text" id="leadName" onChange={handleOnChange}
									ref={el => inputRef.current['leadName'] = el}
								/>
							</div>
						</div>
						<div className="col-md-4">
							<div className="form-group">
								<label htmlFor="" className="control-label">Stakeholder Category</label>
								<select className="form-control" id="leadCategory" onChange={handleOnChange} value={searchData.leadCategory ?? ''}>
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
								<label htmlFor="" className="control-label">Stakeholder Type</label>
								<select className="form-control" id="leadType" onChange={handleOnChange} value={searchData.leadType ?? ''}>
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
						<button type="button" className="skel-btn-cancel ml-1" onClick={() => { setDisplayForm(false); clearSearch() }}>Cancel</button>
						<button type="button" className="skel-btn-submit" onClick={handleOnClickSearch}>Search</button>
					</div>
				</form>}
				{/* </div>
			<div className="cmmn-skeleton"> */}
				<div className="col-md-12 mt-1">
					{/* <div className="skel-btn-row">
						<button className="skel-btn-submit" onClick={() => { history("/leads-add") }}>
							Add Stakeholder
						</button>
					</div> */}
					<div className="cust-table">
						<DynamicTable
							listSearch={listSearch}
							row={leadList}
							rowCount={totalCount}
							header={columns}
							itemsPerPage={perPage}
							// backendPaging={true}
							isScroll={true}
							isTableFirstRender={isTableFirstRender}
							// hasExternalSearch={hasExternalSearch}
							// backendCurrentPage={currentPage}
							customClassName={'table-sticky-header'}
							url={properties.LEAD_API + `/search?limit=${perPage}&offset=${currentPage}`}
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

export default LeadsList;

const columns = [
	{
		Header: "Stakeholder Name",
		accessor: "leadName",
		disableFilters: true,
		id: "leadName",
	},
	{
		Header: "Stakeholder Category",
		accessor: "leadCatDesc.description",
		disableFilters: true,
		id: "stakeholderCategory",
	},
	{
		Header: "Stakeholder Type",
		accessor: "leadTypeDesc.description",
		disableFilters: true,
		id: "stakeholderType",
	},
	{
		Header: "Country",
		accessor: "country",
		disableFilters: true,
		id: "country",
	},
	{
		Header: "City",
		accessor: "city",
		disableFilters: true,
		id: "city",
	},
	{
		Header: "Task Name",
		accessor: "taskName",
		disableFilters: true,
		id: "taskName",
	},
	{
		Header: "Task Description",
		accessor: "taskDescription",
		disableFilters: true,
		id: "taskDescription",
	},
	{
		Header: "Tags",
		accessor: row => {
			return row?.tags?.length > 0 && row?.tags?.map((ele) => ele)?.join(', ');
		},
		disableFilters: true,
		id: "tags",
	},
	{
		Header: "Created At",
		accessor: "createdAt",
		disableFilters: true,
		id: "createdAt"
	},
	{
		Header: "Created By",
		accessor: row => {
			return ((row?.createdByName?.firstName ?? '') + '' + (row?.createdByName?.lastName ?? ''));
		},
		disableFilters: true,
		id: "createdByName"
	}, {
		Header: "Active",
		accessor: "statusDesc.description",
		disableFilters: true,
		id: "taskDueDate"
	}
]