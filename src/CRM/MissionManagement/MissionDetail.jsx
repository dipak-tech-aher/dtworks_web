import { useLocation } from 'react-router-dom';
import { properties } from "../../properties";
import { post } from "../../common/util/restUtil";
import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../AppContext";
import AddressComponent from "../LeadManagement/AddressComponent";
import { toast } from "react-toastify";
import ChooseImagePlaceholder from '../../assets/images/choose_image_placeholder.png';
import axios from 'axios'
import { Modal, Button } from 'react-bootstrap';
import ReactSelect from 'react-select';
import { DatePicker } from 'rsuite';
import moment from 'moment';
import AddEditLead from "../LeadManagement/AddEditLead";
import FileUpload from '../../common/uploadAttachment/fileUpload';
const countryFlags = require("../../assets/files/country_flags.json");

const MissionDetail = (props) => {
	const location = useLocation();
	const { missionUuid } = props;
	const { data, handlers, refs } = useContext(AppContext);
	const logoSize = 100; // is in KB;
	const enagementAttachmentSize = 20; // is in MB;

	const [show, setShow] = useState({
		engagementDeleteModal: false,
		contactDeleteModal: false,
		addressDeleteModal: false,
		addLeadModal: false
	});
	const [selectedContact, setSelectedContact] = useState({});
	const [selectedEngagement, setSelectedEngagement] = useState({});
	const [selectedAddress, setSelectedAddress] = useState({});
	const [tagTextSearch, setTagTextSearch] = useState();


	const handleShowClose = (key) => {
		setShow({
			...show,
			[key]: !show[key]
		});
		setSelectedContact({ ...{} });
		setSelectedEngagement({ ...{} });
		setSelectedAddress({ ...{} });
	};

	const {
		auth,
		leadList,
		missionData,
		customerTypeLookup,
		tagsLookup,
		engagementStatusLookup,
		customerCategoryLookup,
		countryLookup,
		addressList,
		contactList,
		engagementList,
		currentFiles,
		formErrors,
		userLookup,
		usersLookup,
		permission,
		isEdit,
		reminderList,
		deletedContacts,
		deletedEngagements,
		deletedAddress,
		existingFiles,
		renderComponent,
		logoSource
	} = data;

	const {
		setMissionData,
		handleOnChange,
		setAddressList,
		setContactList,
		setEngagementList,
		setTagsLookup,
		setCurrentFiles,
		closeSavemissionWindow,
		handleEdit,
		getRandomId,
		setDeletedContacts,
		setDeletedEngagements,
		setDeletedAddress,
		clearLogoSelection,
		setLogoSource
	} = handlers;

	const {
		inputRef,
		logoRef
	} = refs;

	useEffect(() => {
		missionData.tags = missionData?.tags ?? missionData?.missionTags
	}, [missionData])

	const getRandomString = () => Math.random().toString(36).slice(2).toUpperCase();

	const isAvailableInSearch = (obj) => {
		return tagTextSearch && tagTextSearch != "" ? JSON.stringify(obj).toLowerCase().includes(tagTextSearch?.toLowerCase()) : true;
	}

	const containSpecialCharacter = (string) => {
		var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
		return format?.test(string);
	}

	const generateRandomString = (length) => {
		const characters = '0123456789';
		let result = '';
		for (let i = 0; i < length; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length);
			result += characters[randomIndex];
		}
		return result;
	}

	const addNewTag = () => {
		if (containSpecialCharacter(tagTextSearch)) {
			toast.error("Tags cannot be contain special characters");
		}
		else if (tagTextSearch?.length > 20) {
			toast.error("Tags cannot be more than 20 characters");
		} else {
			let newTag = { value: tagTextSearch, label: tagTextSearch };
			// let newTag = { value: `MISSION_${generateRandomString(6)}`, label: tagTextSearch };
			setTagsLookup([
				...tagsLookup, newTag
			]);
			let tags = missionData?.tags ?? [];
			let uniqueTags = [...new Set([...tags, newTag.value])];
			handleOnChange({ target: { id: 'tags', value: uniqueTags } });
			setTagTextSearch("");
		}
	}

	const encodeImageFileAsURL = (file, callback) => {
		var reader = new FileReader();
		reader.onloadend = function () {
			callback(reader.result);
		}
		reader.readAsDataURL(file);
	}

	const onImageChange = async (event) => {
		if (event.target.files && event.target.files[0]) {
			const file = event.target.files[0];

			const fileSize = file.size;
			const fileSizeInKB = (fileSize / 1024); // this would be in kilobytes defaults to bytes

			if (fileSizeInKB < logoSize) {
				setLogoSource(URL.createObjectURL(file));
				encodeImageFileAsURL(file, function (base64) {
					setMissionData({
						...missionData,
						missionLogo: base64
					});
				});
			} else {
				toast.error(`File size is greater than ${logoSize}KB.`)
			}
		}
	}

	const handleAddAddress = (e) => {
		e.preventDefault()
		let updatedArray = [...addressList, { addressId: getRandomId(), isPrimary: false }];
		setAddressList(updatedArray);
		setMissionData({
			...missionData,
			addressList: updatedArray
		});
	};

	const handleAddContact = (e) => {
		e.preventDefault()
		let updatedArray = [...contactList, { contactNo: getRandomString() }];
		setContactList(updatedArray);
		setMissionData({
			...missionData,
			contactList: updatedArray
		});
	};

	const handleAddEngagement = (e) => {
		e.preventDefault()
		let updatedArray = [...engagementList, { engagementId: getRandomId() }];
		setEngagementList(updatedArray);
		setMissionData({
			...missionData,
			engagementList: updatedArray
		});
	};

	const deleteContactRow = (e, index, instantDelete = false, deleteObj) => {
		if (e) { e.preventDefault() }
		if (instantDelete) {
			const updatedContactList = contactList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setContactList(updatedContactList);
			setMissionData({
				...missionData,
				contactList: updatedContactList,
			});
		} else {
			setTimeout(() => {
				var data = contactList[index];
				console.log('data-------->', data)
				setSelectedContact({ ...data });
			}, 100);
		}
		handleShowClose('contactDeleteModal');
	};

	const deleteEngagementRow = (e, index, instantDelete = false, deleteObj) => {
		if (e) { e.preventDefault() }
		if (instantDelete) {
			const updatedEngagementList = engagementList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setEngagementList(updatedEngagementList);
			setMissionData({
				...missionData,
				engagementList: updatedEngagementList,
			});
		} else {
			setTimeout(() => {
				var data = engagementList[index];
				console.log('data-x---------->', data)
				setSelectedEngagement({ ...data });
			}, 100);
		}
		handleShowClose('engagementDeleteModal');
	};

	const deleteAddressRow = (e, index, instantDelete = false, deleteObj) => {
		console.log('index', index, 'instantDelete', instantDelete, deleteObj)

		if (e) { e.preventDefault() }
		if (instantDelete) {
			const updatedAddressList = addressList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setAddressList(updatedAddressList);
			setMissionData({
				...missionData,
				addressList: updatedAddressList,
			});
		} else {
			setTimeout(() => {
				var data = addressList[index];
				console.log('data-----vvvvvv------->', data)
				setSelectedAddress({ ...data });
			}, 100);
		}
		handleShowClose('addressDeleteModal');
	};

	const proceedDelete = (modalName) => {
		if (modalName === "contactDeleteModal") {
			if (selectedContact.contactId) {
				setDeletedContacts([...deletedContacts, selectedContact?.contactNo])
				deleteContactRow(null, 0, true, { key: 'contactNo', value: selectedContact.contactNo });
				toast.success("Contact has been deleted");
			} else {
				deleteContactRow(null, 0, true, { key: 'contactNo', value: selectedContact.contactNo });
			}
		} else if (modalName === "engagementDeleteModal") {
			const checkMappedReminder = reminderList.find(item => item.engagementId === selectedEngagement.engagementId)
			if (checkMappedReminder) {
				toast.warn('There is an active reminder mapped for this engagement.')
				return false
			}
			if (selectedEngagement.engagementUuid) {
				setDeletedEngagements([...deletedEngagements, selectedEngagement?.engagementUuid])
				deleteEngagementRow(null, 0, true, { key: 'engagementUuid', value: selectedEngagement.engagementUuid })
				toast.success("Engagement has been deleted");
			} else {
				deleteEngagementRow(null, 0, true, { key: 'engagementId', value: selectedEngagement.engagementId });
			}
		} else if (modalName === "addressDeleteModal") {
			if (selectedAddress.addressNo) {
				setDeletedAddress([...deletedAddress, selectedAddress?.addressNo])
				deleteAddressRow(null, 0, true, { key: 'addressNo', value: selectedAddress.addressNo });
				toast.success("Address has been deleted");
			} else {
				deleteAddressRow(null, 0, true, { key: 'addressId', value: selectedAddress.addressId });
			}
		}
	}

	const handleContactChange = (index, field, value) => {
		const updatedContactList = contactList.map((item, i) => {
			if (i === index) {
				return {
					...item, [field]: value,
				};
			}
			return item;
		});
		setContactList(updatedContactList);
		setMissionData({
			...missionData,
			contactList: updatedContactList,
		})
	};

	const handleEngagementChange = (index, field, value) => {
		const updatedEngagementList = engagementList.map((item, i) => {
			if (i === index) {
				return {
					...item, [field]: value,
				};
			}
			return item;
		});
		setEngagementList(updatedEngagementList);
		setMissionData({
			...missionData,
			engagementList: updatedEngagementList,
		})
	};

	const clearEngagementAttachment = (index, attachmentUuid) => {
		engagementList[index]['attachmentsDetails'] = { attachmentUuid: attachmentUuid };
		setEngagementList([...engagementList]);
	}

	const downloadFile = async (attachObj) => {
		const filename = attachObj.fileName;
		if (attachObj.attachmentId && attachObj.attachmentUuid) {
			const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)
			await axios.get(`${API_ENDPOINT}${properties.LEAD_API}/download-file/${attachObj.attachmentUuid}`, {
				headers: {
					"x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
					Authorization: auth?.accessToken
				},
				responseType: 'blob'
			}).then(res => {
				const url = window.URL.createObjectURL(new Blob([res.data]));
				const link = document.createElement('a');
				link.href = url;
				if (typeof window.navigator.msSaveBlob === 'function') {
					window.navigator.msSaveBlob(
						res.data,
						filename
					);
				} else {
					link.setAttribute('download', filename);
					document.body.appendChild(link);
					link.click();
				}
			}).catch((error) => {
				console.log('error---------->', error)
			});
		} else {
			const linkSource = attachObj.attachedContent;
			const downloadLink = document.createElement('a');
			document.body.appendChild(downloadLink);

			downloadLink.href = linkSource;
			downloadLink.target = '_self';
			downloadLink.download = filename;
			downloadLink.click();
		}
	}

	useEffect(() => {
		setMissionData({
			...missionData,
			addressList,
		})
	}, [addressList])

	return (
		<div className="skel-tabs-role-config p-2">
			<div className="row">
				<div className="col-6"></div>
				{permission && !location.pathname?.includes('mission-add') && <div className="col-6 text-right mb-2">
					<button className="btn btn-primary btn-sm" onClick={() => handleEdit()}>
						{isEdit ? 'Edit' : 'View'}
					</button>
					<button type="button" style={{ backgroundColor: "#D5D5D5", color: "black", border: "1px solid #D5D5D5" }} className="btn btn-info btn-sm" onClick={() => closeSavemissionWindow()}>
						Cancel
					</button>
				</div>}
			</div>
			<div className="col-12">
				<div className="row">
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="stakeholder" className="control-label">
								Stakeholder Name
								<span className="text-danger font-20 pl-1 fld-imp">
									*
								</span>
								{renderComponent.addNewStakeHolder && <a onClick={() => location.pathname?.includes('mission-add') ? handleShowClose('addLeadModal') : ''} className="add-new-stake-link">add new?</a>}
							</label>
							<div className="">
								<ReactSelect
									isDisabled={location.pathname?.includes('mission-edit') ? true : false}
									id='stakeholder'
									placeholder="Select Stakeholder"
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
									options={leadList}
									onChange={(selected) => {
										handleOnChange({ target: { id: 'leadUuid', value: selected.value } });
									}}
									value={leadList.find(x => x.value == missionData.leadUuid) || null}
								/>
								{formErrors.leadUuid && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.leadUuid}</span>
								)}
							</div>
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="missionName" className="control-label">
								Mission Name
								<span className="text-danger font-20 pl-1 fld-imp">*</span>
							</label>
							<input
								className="form-control"
								id="missionName"
								type="text"
								ref={el => inputRef.current['missionName'] = el}
								defaultValue={missionData.missionName ?? ""}
								onChange={handleOnChange}
								disabled={isEdit}
							/>
							{formErrors.missionName && (
								<span className="text-danger font-20 pl-1 fld-imp">{formErrors.missionName}</span>
							)}
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="missionCategory" className="control-label">
								Mission Category
								<span className="text-danger font-20 pl-1 fld-imp">*</span>
							</label>
							<div className="custselect">
								<select
									disabled={isEdit}
									className="form-control"
									id="missionCategory"
									required=""
									onChange={handleOnChange}
									value={missionData?.missionCategory ?? ""}
								>
									<option selected="">Choose Category</option>
									{customerCategoryLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
							{formErrors.missionCategory && (
								<span className="text-danger font-20 pl-1 fld-imp">{formErrors.missionCategory}</span>
							)}
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="missionType" className="control-label">
								Mission Type
								<span className="text-danger font-20 pl-1 fld-imp">*</span>
							</label>
							<div className="custselect">
								<select
									disabled={isEdit}
									className="form-control"
									id="missionType"
									required=""
									onChange={handleOnChange}
									value={missionData.missionType ?? ''}
								>
									<option selected="">Choose Type</option>
									{customerTypeLookup.map((item) => (
										<option key={item.code} value={item.code}>
											{item.description}
										</option>
									))}
								</select>
							</div>
							{formErrors.missionType && (
								<span className="text-danger font-20 pl-1 fld-imp">{formErrors.missionType}</span>
							)}
						</div>
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="missionLogo" className="control-label">
								Mission Logo
							</label>
							<input
								ref={logoRef}
								disabled={isEdit}
								className="form-control"
								id="missionLogo"
								type="file"
								accept="image/png, image/jpeg"
								onChange={onImageChange}
							/>
							<span style={{ fontSize: '12px' }}>(Logo size should be less than {logoSize} KB)</span>
						</div>
					</div>
					{(logoSource || missionData?.missionLogo) && (
						<div className="col-md-2 mt-2">
							<span style={{ marginLeft: '5px' }}>
								<img alt="preview image" src={logoSource || missionData?.missionLogo} height={100} width={100} />
								<a href="javascript:void(0)" className="clear-logo" onClick={clearLogoSelection}>clear</a>
							</span>
						</div>
					)}
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="tags" className="control-label">
								Tags
							</label>
							<ReactSelect
								isDisabled={isEdit}
								id='tags'
								placeholder="Choose Tags"
								menuPortalTarget={document.body}
								styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
								isMulti
								options={tagsLookup}
								onChange={(selected) => {
									handleOnChange({ target: { id: 'tags', value: selected.map(x => x.value) } });
								}}
								value={tagsLookup.filter(e => missionData?.tags?.includes(e.value))}
							/>

						</div>
						{!isEdit && <div className="row mt-1">
							<div className="col-md">
								<ul className="skel-top-inter doh-tags mb-0 mt-0">
									{tagsLookup.map((x, i) => (
										!missionData?.tags?.includes(x.value) && (i <= 2) && <li key={x.value} onClick={() => {
											let tags = missionData?.tags ?? [];
											let uniqueTags = [...new Set([...tags, x.value])];
											handleOnChange({ target: { id: 'tags', value: uniqueTags } })
										}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
									))}
								</ul>
							</div>
							<div className="col-md-auto ml-auto pl-0 text-right">
								<div className="dropdown d-inline-block mt-1">
									<a className="view-tags text-13" href="#" role="button" data-toggle="dropdown" aria-expanded="false">
										View more
									</a>
									<div className="dropdown-menu dropdown-menu-right dropdown-menu-tags">
										<span className="dropdown-menu-arrow"></span>
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
												<ul className="skel-top-inter doh-tags">
													{tagsLookup.map(x => (
														(!missionData?.tags?.includes(x.value) && isAvailableInSearch(x)) && <li key={x.value} onClick={() => {
															let tags = missionData?.tags ?? [];
															let uniqueTags = [...new Set([...tags, x.value])];
															handleOnChange({ target: { id: 'tags', value: uniqueTags } })
														}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
													))}
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>}
					</div>
					<div className="col-md-3">
						<div className="form-group">
							<label htmlFor="tags" className="control-label invisible">Active</label>
							<div className="form-inline pt-1">
								<span className="mr-2 font-weight-bold">Active <span className="text-danger font-20 pl-1 fld-imp">*</span></span>
								<div className="switchToggle switchToggle-new">
									<input disabled={isEdit} type="checkbox" id="missionStatus" checked={missionData?.status} onChange={(e) => {
										handleOnChange({ target: { id: 'status', value: e.target.checked } })
									}} />
									<label htmlFor="missionStatus">Active</label>
								</div>
							</div>
							{formErrors.status && (
								<span className="text-danger font-20 pl-1 fld-imp">{formErrors.status}</span>
							)}
						</div>
					</div>
				</div>
				<div className="row mt-3">
					<div className="col-12 text-right mb-2">
						<button disabled={isEdit} onClick={handleAddContact} className="skel-btn-submit">
							Add Contact
						</button>
					</div>
					<table id="contact-table" className="table table-bordered table-striped">
						<tbody>
							<tr>
								<th>Contact Image</th>
								<th>Contact Person <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Designation</th>
								<th>Email <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Prefix <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Phone <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Action</th>
							</tr>
							{contactList.map((item, index) => (
								<tr key={index}>
									<td>
										<label htmlFor={`contactImage${index}`}>
											<img src={item.contactImage || ChooseImagePlaceholder} width={100} height={73} />
										</label>
										<input
											disabled={isEdit}
											type="file"
											id={`contactImage${index}`}
											style={{ display: 'none' }}
											accept="image/png, image/jpeg"
											onChange={(event) => {
												if (event.target.files && event.target.files[0]) {
													const file = event.target.files[0];

													const fileSize = file.size;
													const fileSizeInKB = (fileSize / 1024); // this would be in kilobytes defaults to bytes

													if (fileSizeInKB < logoSize) {
														encodeImageFileAsURL(file, function (base64) {
															handleContactChange(index, "contactImage", base64)
														});
													} else {
														toast.error(`File size is greater than ${logoSize}KB.`)
													}
												}
											}}
										/>
										{formErrors[`contactList[${index}].contactImage`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].contactImage`]}</span>
										)}
									</td>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`firstName${index}`}
											placeholder=""
											type="text"
											value={item.firstName || ""}
											onChange={(e) =>
												handleContactChange(index, "firstName", e.target.value)
											}
										/>
										{formErrors[`contactList[${index}].firstName`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].firstName`]}</span>
										)}
									</td>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`title${index}`}
											placeholder=""
											type="text"
											value={item.title || ""}
											onChange={(e) =>
												handleContactChange(index, "title", e.target.value)
											}
										/>
										{formErrors[`contactList[${index}].title`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].title`]}</span>
										)}
									</td>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`emailId${index}`}
											placeholder=""
											type="email"
											value={item.emailId || ""}
											onChange={(e) =>
												handleContactChange(index, "emailId", e.target.value)
											}
										/>
										{formErrors[`contactList[${index}].emailId`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].emailId`]}</span>
										)}
									</td>
									<td>
										<ReactSelect
											isDisabled={isEdit}

											id={`mobilePrefix${index}`}

											menuPortalTarget={document.body}
											styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}

											options={countryLookup.map(x => ({ value: x.mapping.countryCode, label: x.mapping.countryCode, name: x.value }))}
											formatOptionLabel={country => {
												let countryImage = countryFlags.find(e => e.name == country.name)?.image;
												return (
													<div className="country-option">
														<img src={countryImage} height={25} width={40} />
														<span className="ml-1">({country.label})</span>
													</div>
												)
											}}
											isMulti={false}
											value={countryLookup.map(x => ({ value: x.mapping.countryCode, label: x.mapping.countryCode, name: x.value })).find(x => x.value == item.mobilePrefix) ?? null}
											onChange={(obj) => {
												handleContactChange(index, "mobilePrefix", obj.value)
											}}
										/>
										{formErrors[`contactList[${index}].mobilePrefix`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].mobilePrefix`]}</span>
										)}
									</td>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`mobileNo${index}`}
											placeholder=""
											type="text"
											value={item.mobileNo || ""}
											onChange={(e) =>
												handleContactChange(index, "mobileNo", e.target.value)
											}
										/>
										{formErrors[`contactList[${index}].mobileNo`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].mobileNo`]}</span>
										)}
									</td>
									<td align="center">
										<button disabled={isEdit} onClick={(e) => deleteContactRow(e, index)} className="btn btn-danger btn-sm">
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="row mt-3">
					<div className="col-12 text-right mb-2">
						<button disabled={isEdit} onClick={handleAddEngagement} className="skel-btn-submit">
							Add Engagement
						</button>
					</div>
					<table id="engagement-table" className="table table-bordered table-striped">
						<tbody>
							<tr>
								<th>Engagement Name</th>
								<th>Engagement Description</th>
								<th>Contact Person</th>
								<th>Date & Time</th>
								<th>Assign To</th>
								<th>Status</th>
								<th>Attachment</th>
								<th>Action</th>
							</tr>
							{engagementList.map((item, index) => (
								<tr key={index}>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`engagementName${index}`}
											placeholder=""
											type="text"
											value={item.engagementName || ""}
											onChange={(e) =>
												handleEngagementChange(index, "engagementName", e.target.value)
											}
										/>
										{formErrors[`engagementList[${index}].engagementName`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].engagementName`]}</span>
										)}
									</td>
									<td>
										<textarea
											disabled={isEdit}
											className="form-control"
											id={`engagementDescription${index}`}
											placeholder=""
											type="text"
											value={item.engagementDescription || ""}
											onChange={(e) =>
												handleEngagementChange(index, "engagementDescription", e.target.value)
											}
										/>
										{formErrors[`engagementList[${index}].engagementDescription`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].engagementDescription`]}</span>
										)}
									</td>
									<td>
										<input
											disabled={isEdit}
											className="form-control"
											id={`contactPerson${index}`}
											placeholder=""
											type="text"
											value={item.contactPerson || ""}
											onChange={(e) =>
												handleEngagementChange(index, "contactPerson", e.target.value)
											}
										/>
										{formErrors[`engagementList[${index}].contactPerson`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].contactPerson`]}</span>
										)}
									</td>
									<td>
										<DatePicker
											placement='autoVerticalStart'
											// disabled={isEdit}
											readOnly={isEdit}
											// closeOnScroll={true}
											// popperPlacement="top-end"
											format="yyyy-MM-dd hh:mm a"
											placeholder="Select date & time"
											showMeridian
											value={item.dateTime ? new Date(item.dateTime) : null}
											onChange={(dateTime) => {
												dateTime = dateTime ? moment(dateTime).format('YYYY-MM-DD hh:mm a') : null;
												handleEngagementChange(index, "dateTime", dateTime ? new Date(dateTime) : '');
											}}

										/>
										{formErrors[`engagementList[${index}].dateTime`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].dateTime`]}</span>
										)}
									</td>
									<td>
										<select
											disabled={isEdit}
											className="form-control"
											id={`assignedTo${index}`}
											onChange={(e) =>
												handleEngagementChange(index, "assignedTo", e.target.value)
											}
											value={item.assignedTo ?? ""}
										>
											<option>Select User</option>
											{usersLookup?.map((user) => (
												<option key={user.userId} value={user.userId}>
													{user.firstName} {user.lastName}
												</option>
											))}
										</select>
										{formErrors[`engagementList[${index}].assignedTo`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].assignedTo`]}</span>
										)}
									</td>
									<td>
										<select
											disabled={isEdit}
											className="form-control"
											id={`status${index}`}
											required=""
											onChange={(e) =>
												handleEngagementChange(index, "status", e.target.value)
											}
											value={item.status ?? ""}
										>
											<option selected="">Choose Status</option>
											{engagementStatusLookup.map((item) => (
												<option key={item.code} value={item.code}>
													{item.description}
												</option>
											))}
										</select>
										{formErrors[`engagementList[${index}].status`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].status`]}</span>
										)}
									</td>
									<td>
										{item?.attachmentsDetails?.fileName ? (
											<span>
												{/* <a className="files-link" id={item?.attachmentsDetails?.attachmentUuid} onClick={() => downloadFile(item?.attachmentsDetails)}>{item?.attachmentsDetails?.fileName}</a> */}
												<span className="engmt-clear-attach" onClick={() => clearEngagementAttachment(index, item?.attachmentsDetails?.attachmentUuid)}>X</span>
												<br />
											</span>
										) : (
											<label htmlFor={`attachmentsDetails${index}`}>
												<a className="files-link">Choose file</a>
											</label>
										)}
										<input
											disabled={isEdit}
											type="file"
											id={`attachmentsDetails${index}`}
											style={{ display: 'none' }}
											onChange={(event) => {
												if (event.target.files && event.target.files[0]) {
													const file = event.target.files[0];

													const fileSize = file.size;
													const fileSizeInMB = (fileSize / (1024 * 1024)); // this would be in kilobytes defaults to bytes

													if (fileSizeInMB < enagementAttachmentSize) {
														encodeImageFileAsURL(file, function (base64) {
															handleEngagementChange(index, "attachmentsDetails", {
																fileName: file.name,
																attachedContent: base64,
																attachmentUuid: item?.attachmentsDetails?.attachmentUuid
															})
														});
													} else {
														toast.error(`File size is greater than ${enagementAttachmentSize}MB.`)
													}
												}
											}}
										/>
										<span style={{ fontSize: '12px' }}>(Max size of 20MB files)</span>
										{formErrors[`engagementList[${index}].attachmentsDetails`] && (
											<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`engagementList[${index}].attachmentsDetails`]}</span>
										)}
									</td>
									<td align="center">
										<button disabled={isEdit} onClick={(e) => deleteEngagementRow(e, index)} className="btn btn-danger btn-sm">
											Delete
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="row mt-3">
					<div className="col-12 text-right mb-2">
						<button disabled={isEdit} onClick={handleAddAddress} className="skel-btn-submit">
							Add Address
						</button>
					</div>
					<table id="address-table" className="table table-bordered table-striped">
						<tbody>
							<tr>
								<th>Is Primary<span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Address line 1 <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>Address line 2</th>
								<th>Address line 3</th>
								<th>Post code</th>
								<th>Country <span className="text-danger font-20 pl-1 fld-imp">*</span></th>
								<th>State</th>
								<th>City</th>
								<th>Action</th>
							</tr>
							{addressList.map((item, index) => (
								<AddressComponent
									index={index}
									countryLookup={countryLookup}
									addressList={addressList}
									setAddressList={setAddressList}
									formErrors={formErrors}
									deleteAddressRow={deleteAddressRow}
									isEdit={isEdit}
								/>
							))}
						</tbody>
					</table>
				</div>
				<div className="row">
					<label htmlFor="leadCategory" className="control-label">
						Attachment
					</label>
					<FileUpload
						data={{
							currentFiles,
							entityType: "MISSION",
							shouldGetExistingFiles: false,
							existingFiles: existingFiles,
							permission: isEdit,
						}}
						handlers={{
							setCurrentFiles,
						}}
					/>
				</div>
				{missionUuid && (
					<div className="row mt-2">
						<textarea
							disabled={isEdit}
							className="form-control"
							id='remarks'
							defaultValue={missionData?.remarks ?? ""}
							onChange={handleOnChange}
							placeholder="Remarks..."
							type="text"
							rows={5}
						/>
					</div>
				)}

				<Modal show={show.engagementDeleteModal} className="confirmation-popup" onHide={() => handleShowClose('engagementDeleteModal')} centered>
					<Modal.Header closeButton>
						<Modal.Title>Delete window</Modal.Title>
					</Modal.Header>
					<Modal.Body>Are you sure want to delete the engagement?</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => handleShowClose('engagementDeleteModal')}>
							Cancel
						</Button>
						<Button variant="primary" onClick={() => proceedDelete('engagementDeleteModal')}>
							Proceed
						</Button>
					</Modal.Footer>
				</Modal>

				<Modal show={show.contactDeleteModal} className="confirmation-popup" onHide={() => handleShowClose('contactDeleteModal')} centered>
					<Modal.Header closeButton>
						<Modal.Title>Delete window</Modal.Title>
					</Modal.Header>
					<Modal.Body>Are you sure want to delete the contact?</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => handleShowClose('contactDeleteModal')}>
							Cancel
						</Button>
						<Button variant="primary" onClick={() => proceedDelete('contactDeleteModal')}>
							Proceed
						</Button>
					</Modal.Footer>
				</Modal>


				<Modal show={show.addressDeleteModal} className="confirmation-popup" onHide={() => handleShowClose('addressDeleteModal')} centered>
					<Modal.Header closeButton>
						<Modal.Title>Delete window</Modal.Title>
					</Modal.Header>
					<Modal.Body>Are you sure want to delete the address?</Modal.Body>
					<Modal.Footer>
						<Button variant="secondary" onClick={() => handleShowClose('addressDeleteModal')}>
							Cancel
						</Button>
						<Button variant="primary" onClick={() => proceedDelete('addressDeleteModal')}>
							Proceed
						</Button>
					</Modal.Footer>
				</Modal>

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
								dataCaptureFunction: setMissionData
							}}
						/>
					</Modal.Body>
				</Modal>
			</div>
		</div>
	);
};

export default MissionDetail;
