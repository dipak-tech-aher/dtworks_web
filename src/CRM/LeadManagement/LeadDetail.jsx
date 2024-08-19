import axios from 'axios';
import moment from 'moment';
import React, { useContext, useEffect, useRef, useState } from "react";
import { Button, Modal } from 'react-bootstrap';
import ReactSelect from 'react-select';
import { toast } from "react-toastify";
import { DatePicker } from 'rsuite';
import { AppContext } from "../../AppContext";
import ChooseImagePlaceholder from '../../assets/images/choose_image_placeholder.png';
import FileUpload from '../../common/uploadAttachment/fileUpload';
import { post } from "../../common/util/restUtil";
import { properties } from "../../properties";
import AddressComponent from "./AddressComponent";
import { containSpecialCharacter, generateRandomString } from '../../common/util/util';
import { useHistory }from '../../common/util/history';
const countryFlags = require("../../assets/files/country_flags.json");

const LeadDetail = (props) => {
	const { leadUuid } = props;
	const { data, handlers, refs } = useContext(AppContext);
	const history = useHistory()
	const logoSize = 100; // is in KB;
	const enagementAttachmentSize = 20; // is in MB;
	const [show, setShow] = useState({
		// const {register , handleSubmit} = useForm();
		engagementDeleteModal: false,
		contactDeleteModal: false,
		addressDeleteModal: false
	});
	const [selectedContact, setSelectedContact] = useState({});
	const [selectedEngagement, setSelectedEngagement] = useState({});
	const [selectedAddress, setSelectedAddress] = useState({});
	const [tagTextSearch, setTagTextSearch] = useState();
	const getRandomId = () => Math.floor(100000 + Math.random() * 900000);
	const leadLogoref = useRef()

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
		leadData,
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
		reminderList,
		isRead,
		permission,
		deletedContacts,
		deletedEngagements,
		deletedAddress,
		existingFiles,
		leadAssociate,
		logoSource
	} = data;
	const {
		setLeadData,
		handleOnChange,
		setAddressList,
		setContactList,
		setEngagementList,
		setTagsLookup,
		setCurrentFiles,
		closeSaveLeadWindow,
		setIsRead,
		setDeletedContacts,
		setDeletedEngagements,
		setDeletedAddress,
		getRandomString,
		setLogoSource
	} = handlers;

	const {
		inputRef
	} = refs;

	const isAvailableInSearch = (obj) => {
		return tagTextSearch && tagTextSearch !== "" ? JSON.stringify(obj).toLowerCase().includes(tagTextSearch?.toLowerCase()) : true;
	}

	// const containSpecialCharacter = (string) => {
	// 	var format = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>/?]+/;
	// 	return format?.test(string);
	// }

	// const generateRandomString = (length) => {
	// 	const characters = '0123456789';
	// 	let result = '';
	// 	for (let i = 0; i < length; i++) {
	// 		const randomIndex = Math.floor(Math.random() * characters.length);
	// 		result += characters[randomIndex];
	// 	}
	// 	return result;
	// }

	const addNewTag = () => {
		if (containSpecialCharacter(tagTextSearch)) {
			toast.error("Tags cannot be contain special characters");
		}
		else if (tagTextSearch?.length > 20) {
			toast.error("Tags cannot be more than 20 characters");
		} else {
			let newTag = { value: tagTextSearch, label: tagTextSearch };
			// let newTag = { value: `STAKEHOLDER_${generateRandomString(6)}`, label: tagTextSearch };
			setTagsLookup([
				...tagsLookup, newTag
			]);
			let tags = leadData?.tags ?? [];
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
					setLeadData({
						...leadData,
						leadLogo: base64
					});
				});
			} else {
				toast.error(`File size is greater than ${logoSize}KB.`)
			}
		}
	}

	const clearLogoSelection = () => {
		setLeadData({
			...leadData,
			leadLogo: null
		});
		setLogoSource(null);
		const element = document.getElementById('leadLogo');
		element.value = null;
	}

	const handleAddAddress = (e) => {
		e.preventDefault()
		let updatedArray = [...addressList, { addressId: getRandomId(), isPrimary: false }];
		setAddressList(updatedArray);
		setLeadData({
			...leadData,
			addressList: updatedArray
		});
	};

	const handleAddContact = (e) => {
		e.preventDefault()
		let updatedArray = [...contactList, { contactNo: getRandomString() }];
		setContactList(updatedArray);
		setLeadData({
			...leadData,
			contactList: updatedArray
		});
	};

	const handleAddEngagement = (e) => {
		e.preventDefault()
		let updatedArray = [...engagementList, { engagementId: getRandomId() }];
		setEngagementList(updatedArray);
		setLeadData({
			...leadData,
			engagementList: updatedArray
		});
	};

	const deleteContactRow = (e, index, instantDelete = false, deleteObj) => {
		if (e) { e.preventDefault() }
		if (instantDelete) {
			const updatedContactList = contactList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setContactList(updatedContactList);
			setLeadData({
				...leadData,
				contactList: updatedContactList,
			});
		} else {
			setTimeout(() => {
				var data = contactList[index];
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
			setLeadData({
				...leadData,
				engagementList: updatedEngagementList,
			});
		} else {
			setTimeout(() => {
				var data = engagementList[index];
				setSelectedEngagement({ ...data });
			}, 100);
		}
		handleShowClose('engagementDeleteModal');
	};

	const deleteAddressRow = (e, index, instantDelete = false, deleteObj) => {
		if (e) { e.preventDefault() }
		if (instantDelete) {
			const updatedAddressList = addressList.filter(item => item[deleteObj.key] !== deleteObj.value);
			setAddressList(updatedAddressList);
			setLeadData({
				...leadData,
				addressList: updatedAddressList,
			});
		} else {
			setTimeout(() => {
				var data = addressList[index];
				setSelectedAddress({ ...data });
			}, 100);
		}
		handleShowClose('addressDeleteModal');
	};

	const proceedDelete = (modalName) => {
		if (modalName === "contactDeleteModal") {
			if (selectedContact.contactId) {
				// post(`${properties.LEAD_API}/delete-entity`, { entity: 'CONTACT', contactNo: selectedContact.contactNo }).then((resp) => {
				// 	if (resp.status === 200) {
				// 		deleteContactRow(null, 0, true, { key: 'contactNo', value: selectedContact.contactNo });
				// 		toast.success(resp.message);
				// 	}
				// }).catch(err => {
				// 	toast.error("Error in deleting contact");
				// });
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
				// post(`${properties.LEAD_API}/delete-entity`, { entity: 'ENGAGEMENT', engagementUuid: selectedEngagement.engagementUuid }).then((resp) => {
				// 	if (resp.status === 200) {
				// 		deleteEngagementRow(null, 0, true, { key: 'engagementUuid', value: selectedEngagement.engagementUuid })
				// 		toast.success(resp.message);
				// 	}
				// }).catch(err => {
				// 	console.error(err)
				// 	// toast.error("Error in deleting engagement");
				// });
				setDeletedEngagements([...deletedEngagements, selectedEngagement?.engagementUuid])
				deleteEngagementRow(null, 0, true, { key: 'engagementUuid', value: selectedEngagement.engagementUuid })
				toast.success("Engagement has been deleted");
			} else {
				deleteEngagementRow(null, 0, true, { key: 'engagementId', value: selectedEngagement.engagementId });
			}
		} else if (modalName === "addressDeleteModal") {
			if (selectedAddress.addressNo) {
				// post(`${properties.LEAD_API}/delete-entity`, { entity: 'ADDRESS', addressNo: selectedAddress.addressNo }).then((resp) => {
				// 	if (resp.status === 200) {
				// 		deleteAddressRow(null, 0, true, { key: 'addressNo', value: selectedAddress.addressNo });
				// 		toast.success(resp.message);
				// 	}
				// }).catch(err => {
				// 	toast.error("Error in deleting contact");
				// });
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

				return deleteEmptyProperties({ ...item, [field]: value, });
			}
			return deleteEmptyProperties(item);
		});

		setContactList(updatedContactList);
		setLeadData({
			...leadData,
			contactList: updatedContactList,
		})
	};

	function deleteEmptyProperties(obj) {
		for (let prop in obj) {
			if (obj.hasOwnProperty(prop) && obj[prop] === '') {
				delete obj['contactNo'];
				delete obj[prop];
			}
		}

		return obj
	}


	const handleEngagementChange = (index, field, value) => {
		const updatedEngagementList = engagementList.map((item, i) => {
			if (i === index) {
				return deleteEmptyProperties({ ...item, [field]: value, });
			}
			return deleteEmptyProperties(item);;
		});
		setEngagementList(updatedEngagementList);
		setLeadData({
			...leadData,
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
				console.error(error)
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
		setLeadData({
			...leadData,
			addressList,
		})
	}, [addressList])


	const handleOnClickEdit = (e) => {
		e.preventDefault()
		setIsRead(!isRead)
	}

	const isCancelButton = () => {
		history("/leads-edit?leadUuid=" + leadUuid, { state: {data: { leadUuid} } })
	}

	return (
		<form
		//onSubmit={handleSubmit(onSubmit)}
		>
			<div className="skel-tabs-role-config p-2">
				<div className="col-12">
					<div className="row">
						<div className="col-6"></div>
						{permission && <div className="col-6 text-right mb-2">
							{isRead && <button className="btn btn-primary btn-sm" onClick={handleOnClickEdit}>
								Edit
							</button>}
							{!isRead && <button type="button" style={{ backgroundColor: "#D5D5D5", color: "black", border: "1px solid #D5D5D5" }} className="btn btn-info btn-sm" onClick={() => isCancelButton()}>
								Cancel
							</button>}
						</div>}
					</div>
					<div className="row">
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="leadCategory" className="control-label">
									Stakeholder Category
									<span className="text-danger font-20 pl-1 fld-imp">*</span>
								</label>
								<div className="custselect">
									<select
										className="form-control"
										id="leadCategory"
										required=""
										disabled={isRead}
										onChange={handleOnChange}
										value={leadData?.leadCategory ?? ""}
									>
										<option selected="">Choose Category</option>
										{customerCategoryLookup.map((item) => (
											<option key={item.code} value={item.code}>
												{item.description}
											</option>
										))}
									</select>
								</div>
								{formErrors.leadCategory && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.leadCategory}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="leadType" className="control-label">
									Stakeholder Type
									<span className="text-danger font-20 pl-1 fld-imp">*</span>
								</label>
								<div className="custselect">
									<select
										className="form-control"
										id="leadType"
										required=""
										disabled={isRead}
										onChange={handleOnChange}
										value={leadData.leadType ?? ''}
									>
										<option selected="">Choose Type</option>
										{customerTypeLookup.map((item) => (
											<option key={item.code} value={item.code}>
												{item.description}
											</option>
										))}
									</select>
								</div>
								{formErrors.leadType && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.leadType}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="leadName" className="control-label">
									Stakeholder Name
									<span className="text-danger font-20 pl-1 fld-imp">*</span>
								</label>
								<input
									className="form-control"
									id="leadName"
									type="text"
									maxLength={100}
									disabled={isRead}
									ref={el => inputRef.current['leadName'] = el}
									defaultValue={leadData.leadName ?? ""}
									onChange={handleOnChange}
								/>
								{formErrors.leadName && (
									<span className="text-danger font-20 pl-1 fld-imp">{formErrors.leadName}</span>
								)}
							</div>
						</div>
						<div className="col-md-3">
							<div className="form-group">
								<label htmlFor="leadLogo" className="control-label">
									Stakeholder Logo
								</label>
								<input
									className="form-control"
									id="leadLogo"
									type="file"
									disabled={isRead}
									accept="image/png, image/jpeg"
									onChange={onImageChange}
								/>
								<span style={{ fontSize: '12px' }}>(Logo size should be less than {logoSize} KB)</span>
							</div>
						</div>
						{(logoSource || leadData?.leadLogo) && (
							<div className="col-md-2 mt-2">
								<span style={{ marginLeft: '5px' }}>
									<img alt="preview image" src={logoSource || leadData?.leadLogo} height={100} width={100} />
									<a href="javascript:void(0)" hidden={isRead} className="clear-logo" onClick={clearLogoSelection}>clear</a>
								</span>
							</div>
						)}
						<div className="col-md-3 mt-2">
							<div className="form-group">
								<label htmlFor="tags" className="control-label">
									Tags
								</label>
								<ReactSelect
									id='tags'
									placeholder="Choose Tags"
									isDisabled={isRead}
									menuPortalTarget={document.body}
									styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
									isMulti
									options={tagsLookup}
									onChange={(selected) => {
										handleOnChange({ target: { id: 'tags', value: selected.map(x => x.value) } })
									}}
									value={tagsLookup.filter(e => leadData?.tags?.includes(e.value))}
								/>
							</div>
							<div className="row mt-1">
								<div className="col-md">
									<ul className="skel-top-inter doh-tags mb-0 mt-0" hidden={isRead}>
										{tagsLookup.map((x, i) => (
											!leadData?.tags?.includes(x.value) && (i <= 2) && <li key={x.value} onClick={() => {
												let tags = leadData?.tags ?? [];
												let uniqueTags = [...new Set([...tags, x.value])];
												handleOnChange({ target: { id: 'tags', value: uniqueTags } })
											}}><a>{x.label} <i className="fa fa-plus"></i></a></li>
										))}
									</ul>
								</div>
								<div className="col-md-auto ml-auto pl-0 text-right" >
									<div className="dropdown d-inline-block mt-1">
										<a className="view-tags text-13" href="#" role="button" data-toggle="dropdown" aria-expanded="false" hidden={isRead}>
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
															(!leadData?.tags?.includes(x.value) && isAvailableInSearch(x)) && <li key={x.value} onClick={() => {
																let tags = leadData?.tags ?? [];
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
							</div>
						</div>
						<div className="col-md-3 mt-2">
							<div className="form-group">
								<label htmlFor="tags" className="control-label invisible">Active</label>
								<div className="form-inline pt-1">
									<span className="mr-2 font-weight-bold">Active <span className="text-danger font-20 pl-1 fld-imp">*</span></span>
									<div className="switchToggle switchToggle-new">
										<input type="checkbox" id="leadStatus" checked={leadData?.status} disabled={isRead && (leadAssociate?.mission > 0 || leadAssociate.task > 0)} onChange={(e) => {
											handleOnChange({ target: { id: 'status', value: e.target.checked } })
										}} />
										<label htmlFor="leadStatus">Active</label>
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
							<button onClick={handleAddContact} className="skel-btn-submit" hidden={isRead}>
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
									<th hidden={isRead}>Action</th>
								</tr>
								{contactList.map((item, index) => (
									<tr key={index}>
										<td>
											<label htmlFor={`contactImage${index}`}>
												<img src={item.contactImage || ChooseImagePlaceholder} width={100} height={73} />
											</label>
											<input
												type="file"
												id={`contactImage${index}`}
												disabled={isRead}
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
												className="form-control"
												id={`firstName${index}`}
												placeholder=""
												disabled={isRead}
												type="text"
												maxLength={100}
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
												className="form-control"
												id={`title${index}`}
												placeholder=""
												disabled={isRead}
												type="text"
												maxLength={100}
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
												className="form-control"
												id={`emailId${index}`}
												placeholder=""
												disabled={isRead}
												type="email"
												maxLength={100}
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
												id={`mobilePrefix${index}`}
												isDisabled={isRead}
												menuPortalTarget={document.body}
												styles={{ menuPortal: base => ({ ...base, zIndex: 999999 }) }}
												options={countryLookup.map(x => ({ value: x.mapping.countryCode, label: x.mapping.countryCode, name: x.value }))}
												formatOptionLabel={country => {
													let countryImage = countryFlags.find(e => e.name === country.name)?.image;
													return (
														<div className="country-option">
															<img src={countryImage} height={25} width={40} />
															<span className="ml-1">({country.label})</span>
														</div>
													)
												}}
												isMulti={false}
												value={countryLookup.map(x => ({ value: x.mapping.countryCode, label: x.mapping.countryCode, name: x.value })).find(x => x.value === item.mobilePrefix) || []}
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
												className="form-control"
												id={`mobileNo${index}`}
												placeholder=""
												disabled={isRead}
												type="text"
												maxLength={15}
												value={item.mobileNo || ""}
												onChange={(e) =>
													handleContactChange(index, "mobileNo", e.target.value)
												}
											/>
											{formErrors[`contactList[${index}].mobileNo`] && (
												<span className="text-danger font-20 pl-1 fld-imp">{formErrors[`contactList[${index}].mobileNo`]}</span>
											)}
										</td>
										<td align="center" hidden={isRead}>
											<button onClick={(e) => deleteContactRow(e, index)} className="btn btn-danger btn-sm">
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
							<button onClick={handleAddEngagement} hidden={isRead} className="skel-btn-submit">
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
									<th hidden={isRead}>Action</th>
								</tr>
								{engagementList.map((item, index) => (
									<tr key={index}>
										<td>
											<input
												className="form-control"
												id={`engagementName${index}`}
												placeholder=""
												type="text"
												disabled={isRead}
												maxLength={100}
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
												className="form-control"
												id={`engagementDescription${index}`}
												placeholder=""
												maxLength={100}
												disabled={isRead}
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
												className="form-control"
												id={`contactPerson${index}`}
												placeholder=""
												maxLength={100}
												disabled={isRead}
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
												format="yyyy-MM-dd hh:mm aa"
												placeholder="Select date & time"
												showMeridian
												readOnly={isRead}
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
												className="form-control"
												id={`assignedTo${index}`}
												disabled={isRead}
												onChange={(e) =>
													handleEngagementChange(index, "assignedTo", e.target.value)
												}
												value={item.assignedTo ?? ""}>
												<option>Select User</option>
												{userLookup?.map((user) => (
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
												className="form-control"
												id={`status${index}`}
												required=""
												disabled={isRead}
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
													<a className="files-link" id={item?.attachmentsDetails?.attachmentUuid} onClick={() => downloadFile(item?.attachmentsDetails)}>{item?.attachmentsDetails?.fileName}</a>
													<span className="engmt-clear-attach" hidden={isRead} onClick={() => clearEngagementAttachment(index, item?.attachmentsDetails?.attachmentUuid)}>X</span>
													<br />
												</span>
											) : (
												<label htmlFor={`attachmentsDetails${index}`} disabled={isRead}>
													<a className="files-link" hidden={isRead}>Choose file</a>
												</label>
											)}
											<input
												type="file"
												id={`attachmentsDetails${index}`}
												style={{ display: 'none' }}
												disabled={isRead}
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
										<td align="center" hidden={isRead}>
											<button onClick={(e) => deleteEngagementRow(e, index)} className="btn btn-danger btn-sm">
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
							<button onClick={handleAddAddress} hidden={isRead} className="skel-btn-submit">
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
									<th hidden={isRead}>Action</th>
								</tr>
								{addressList.map((item, index) => (
									<AddressComponent
										index={index}
										countryLookup={countryLookup}
										addressList={addressList}
										setAddressList={setAddressList}
										formErrors={formErrors}
										deleteAddressRow={deleteAddressRow}
										isRead={isRead}
									/>
								))}
							</tbody>
						</table>
					</div>

					{leadUuid && (
						<div className="row mt-2">
							<div className="col-md-12">
								<div className="form-group">
									<label htmlFor="leadCategory" className="control-label">
										Remarks
									</label>
									{!isRead ? <>
										<textarea
											// className="form-control"
											disabled={isRead}
											id='remarks'
											defaultValue={leadData?.remarks ?? leadData?.remarks ?? ""}
											placeholder="Remarks..."
											onChange={handleOnChange}
											type="text"
											rows={2}
										/><span style={{ fontSize: '12px' }}>Maximum 2500 characters</span></>
										: <span className="data-cnt" style={{ whiteSpace: 'pre-wrap' }}>
											{leadData?.remarkList?.[0]?.remarksContent ?? ''}
										</span>}
								</div>
							</div>
						</div>
					)}
					<div className="row mt-2">
						<div className="col-md-12">
							<div className="form-group">
								<label htmlFor="leadCategory" className="control-label">
									Attachment
								</label>
								<FileUpload
									data={{
										currentFiles,
										entityType: "LEAD",
										shouldGetExistingFiles: false,
										existingFiles: existingFiles,
										permission: isRead,
									}}
									handlers={{
										setCurrentFiles,
									}}
								/>
							</div>
						</div>
					</div>


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
				</div>
			</div>
		</form >
	);
};

export default LeadDetail;
