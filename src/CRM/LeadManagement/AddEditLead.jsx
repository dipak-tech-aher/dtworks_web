import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Tab, Tabs } from 'react-bootstrap';
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import { array, boolean, number, object, string } from 'yup';
import { AppContext } from "../../AppContext";
import { useHistory }from "../../common/util/history";
import { get, post, put } from "../../common/util/restUtil";
import { properties } from "../../properties";
import LeadDetail from "./LeadDetail";
import Reminders from "./Reminder";
import { getPermissions } from "../../common/util/util";
import { getFullName } from "../../common/util/commonUtils"
import { isEmpty } from 'lodash'

const AddEditLead = (props) => {
	const { auth } = useContext(AppContext);
	const history = useHistory()
	const dontRedirectBack = props?.data?.dontRedirectBack;
	const sendDataBack = props?.data?.sendDataBack;
	const closeWindow = props?.handlers?.closeWindow;
	const dataCaptureFunction = props?.handlers?.dataCaptureFunction;

	const getRandomString = () => Math.random().toString(36).slice(2).toUpperCase();
	const getRandomId = () => Math.floor(100000 + Math.random() * 900000);
	const sortByKey = (payload, key) => payload.sort((prev, curr) => (prev[key] > curr[key]) ? 1 : ((curr[key] > prev[key]) ? -1 : 0))


	const masterRef = useRef();
	const inputRef = useRef({});
	const [leadData, setLeadData] = useState({
		contactList: [{ contactNo: getRandomString() }],
		engagementList: [{ engagementId: getRandomId() }],
		addressList: [{}],
	});
	const [currentTab, setCurrentTab] = useState('leadDetails');
	const [leadStatusLookup, setLeadStatusLookup] = useState([]);
	const [leadSourceLookup, setLeadSourceLookup] = useState([]);
	const [taskCategoryLookup, setTaskCategoryLookup] = useState([]);
	const [taskTypeLookup, setTaskTypeLookup] = useState([]);
	const [taskStatusLookup, setTaskStatusLookup] = useState([]);
	const [taskPriorityLookup, setTaskPriorityLookup] = useState([]);
	const [customerTypeLookup, setCustomerTypeLookup] = useState([]);
	const [tagsLookup, setTagsLookup] = useState([]);
	const [customerCategoryLookup, setCustomerCategoryLookup] = useState([]);
	const [engagementStatusLookup, setEngagementStatusLookup] = useState([]);
	const [countryLookup, setCountryLookup] = useState([]);
	const [addressTypeLookup, setAddressTypeLookup] = useState([]);
	const [addressList, setAddressList] = useState([{}]);
	const [contactList, setContactList] = useState([{ contactNo: getRandomString() }]);
	const [engagementList, setEngagementList] = useState([{ engagementId: getRandomId() }]);
	const [reminderList, setReminderList] = useState([{ reminderId: getRandomId() }]);
	const [taskList, setTaskList] = useState([{
		actions: [{}],
	}]);
	const [actionList, setActionList] = useState([{}]);
	const [error, setError] = useState({});
	const [addressData, setAddressData] = useState({});
	const [addressLookUpRef, setAddressLookUpRef] = useState(null);
	const [userLookup, setUserLookup] = useState();
	const [roleList, setRoleList] = useState([]);
	const [currentFiles, setCurrentFiles] = useState([]);
	// const [missionList, setMissionList] = useState([]);
	const [perPage, setPerPage] = useState(10);
	const [currentPage, setCurrentPage] = useState(0);
	const [formErrors, setFormErrors] = useState({});
	const screenMode = props?.props?.screenAction ?? 'Add'
	const [isRead, setIsRead] = useState(screenMode !== 'Add')
	const [permission, setPermission] = useState({})
	const [deletedContacts, setDeletedContacts] = useState([]);
	const [deletedEngagements, setDeletedEngagements] = useState([]);
	const [deletedAddress, setDeletedAddress] = useState([]);
	const [deletedReminders, setDeletedReminders] = useState([]);
	const [existingFiles, setExistingFiles] = useState([])
	const [logoSource, setLogoSource] = useState(null)
	const [role, setRoles] = useState()
	const [usersBasedOnRole, setUsersBasedOnRole] = useState({})


	const stakeholderSchema = object({
		leadCategory: string().required().label('Stakeholder category'),
		leadType: string().required().label('Stakeholder type'),
		leadName: string().required().label('Stakeholder name'),
		leadLogo: string().nullable(true).label('Stakeholder logo'),
		tags: array().of(string()).nullable(true).label('Stakeholder tags'),
		status: boolean().nullable(true).label('Stakeholder status'),
		contactList: array().of(object({
			contactImage: string().nullable(true).label('Contact image'),
			firstName: string().required().label('Contact name'),
			title: string().nullable(true).label('Designation'),
			emailId: string().email().required().label('Email ID'),
			mobilePrefix: string().required().label('Mobile prefix'),
			mobileNo: number().required().test("is-valid-length", "Mobile number is invalid, else select exact prefix", function (value) {
				const { mobilePrefix } = this.parent;
				let countryDetails = countryLookup.find(x => x.mapping.countryCode === mobilePrefix);
				if (countryDetails) {
					return Number(value?.toString()?.length) === Number(countryDetails?.mapping?.phoneNolength);
				}
				return !mobilePrefix && value ? false : true;
			}).typeError("Mobile number is must be a `number`").label('Mobile number')
		})).label('Contact list'),
		engagementList: array().of(object({
			engagementName: string().nullable(true).label('Engagement name'),
			engagementDescription: string().nullable(true).label('Engagement description'),
			contactPerson: string().nullable(true).label('Contact person'),
			dateTime: string().nullable(true).label('Date time'),
			assignedTo: string().nullable(true).label('Assign person'),
			status: string().nullable(true).label('Engagement status'),
			attachment: string().nullable(true).label('Engagement attachment')
		})).label('Engagement list'),
		addressList: array().of(object({
			isPrimary: boolean().required().label('Primary address'),
			address1: string().required().label('Address line 1'),
			address2: string().nullable(true).label('Address line 2'),
			address3: string().nullable(true).label('Address line 3'),
			postcode: string().nullable(true).label('Postcode'),
			country: string().required().label('Country'),
			state: string().nullable(true).label('State'),
			city: string().nullable(true).label('City')
		})).label('Address list').test(
			'at-least-one-primary',
			'At least one item must be primary',
			value => value.some(item => item.isPrimary === true)
		)
	});

	const reminderSchema = object({
		reminderList: array().of(object({
			reminderDate: string().nullable().label('Reminder date'),
			engagementId: number().when("reminderDate", (reminderDate, schema) => {
				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("Engagement is required");
				}
				return schema;
			}).label('Engagement'),
			departmentId: string().when("reminderDate", (reminderDate, schema) => {

				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("Department is required");
				}
				return schema;
			}).label('Department'),
			toRole: string().when("reminderDate", (reminderDate, schema) => {
				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("Role is required");
				}
				return schema;
			}).label('Role'),
			toUser: string().when("reminderDate", (reminderDate, schema) => {
				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("User is required");
				}
				return schema;
			}).label('User'),
			description: string().when("reminderDate", (reminderDate, schema) => {
				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("Description is required");
				}
				return schema;
			}).label('Description')
		})).label('Reminder list')
	});

	const query = new URLSearchParams(props?.location?.search);
	const leadUuid = query?.get('leadUuid');
	useEffect(() => {
		if (leadUuid) {
			post(`${properties.LEAD_API}/search`, { leadUuid }).then((resp) => {
				if (resp.status === 200) {
					const leadDataa = resp.data.rows[0];
					leadDataa['contactList'] = leadDataa?.leadContact?.length ? leadDataa?.leadContact : [{ contactNo: getRandomString() }];
					leadDataa['engagementList'] = leadDataa?.engagementList?.length ? leadDataa?.engagementList : [{ engagementId: getRandomId() }];
					// leadDataa['contactList'] = leadDataa?.contactList?.length ? leadDataa?.contactList : [{}];
					leadDataa['reminderList'] = leadDataa?.leadReminderDetails?.length ? leadDataa?.leadReminderDetails : [{ reminderId: getRandomId() }];
					leadDataa['remarkList'] = leadDataa?.leadRemarksDetails?.length ? sortByKey(leadDataa?.leadRemarksDetails, 'remarksId') : [{}];
					leadDataa.status = leadDataa.status === "AC";

					setLeadData(leadDataa);
					if (leadDataa) {
						setContactList(leadDataa.leadContact?.length ? leadDataa.leadContact : [{ contactNo: getRandomString() }]);
						setEngagementList(leadDataa.engagementList?.length ? leadDataa.engagementList : [{ engagementId: getRandomId() }]);
						console.log('leadDataa.reminderList',leadDataa.reminderList)
						// Reminder 
						let tempRemainderList = []
						if (leadDataa.reminderList?.length) {
							leadDataa.reminderList.map((item)=>{
								tempRemainderList.push({
									...item,
									departmentId:item.toDept,
									toRole:item.toRoleId,
									toUser:item.toUserId,
								})
							})
						} else {
							tempRemainderList.push({ reminderId: getRandomId() })
						}
						setReminderList(tempRemainderList);
						if (leadDataa.leadTask) {
							const extractedTasks = leadDataa.leadTask.map((leadTask) => leadTask);
							if (extractedTasks.length === 0) {
								setTaskList([{
									taskName: "",
									actions: [{}],
								}]);
							} else {
								setTaskList(extractedTasks);
							}
						}
						if (leadDataa.leadAddress) {
							setAddressList(leadDataa.leadAddress);
						}
					}
				}
			}).catch((error) => {
				console.error(error)
			});
		}
	}, [leadUuid])

	const getUsersBasedOnRole = (roleId, deptId, index) => {
		if (roleId && deptId) {
			get(`${properties.USER_API}/by-role?roleId=${roleId}&deptId=${deptId}`)
				.then((userResponse) => {
					const { data } = userResponse
					unstable_batchedUpdates(() => {
						const formattedResponse = data?.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }));
						setUsersBasedOnRole((prevUsers) => ({
							...prevUsers,
							[`users_${index}`]: formattedResponse
						}));
					})
				}).catch(error => console.error(error))
				.finally()
		} else {
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
			}).catch((error) => console.error(error));
		}
	};

	const handleAddTask = () => {
		setTaskList([
			...taskList,
			{
				taskName: "",
				actions: [{}],
			},
		]);
	};

	useEffect(() => {
		getUsersBasedOnRole();
		get(
			properties.MASTER_API +
			"/lookup?searchParam=code_type&valueParam=TAGS,ENGAGEMENT_STATUS,PRIORITY,COUNTRY,CONTACT_TYPE,EMAIL_DOMAIN,CONTACT_PREFERENCE,LOCATION,CUSTOMER_TYPE,CUSTOMER_CATEGORY,LEAD_STATUS,LEAD_SOURCE,ADDRESS_TYPE,TASK_CATEGORY,TASK_TYPE,LEAD_TASK_STATUS"
		).then((resp) => {
			if (resp.data) {
				masterRef.current = resp.data
				setCustomerTypeLookup(resp.data.CUSTOMER_TYPE);
				setTagsLookup(resp?.data?.TAGS?.map(x => ({ value: x.code, label: x.description })));
				setCustomerCategoryLookup(resp.data.CUSTOMER_CATEGORY);
				setEngagementStatusLookup(resp.data.ENGAGEMENT_STATUS);
				setLeadStatusLookup(resp.data.LEAD_STATUS);
				setCountryLookup(resp.data.COUNTRY);
				setLeadSourceLookup(resp.data.LEAD_SOURCE);
				setAddressTypeLookup(resp.data.ADDRESS_TYPE);
				setTaskCategoryLookup(resp.data.TASK_CATEGORY);
				setTaskTypeLookup(resp.data.TASK_TYPE);
				setTaskStatusLookup(resp.data.LEAD_TASK_STATUS);
				setTaskPriorityLookup(resp.data.PRIORITY);
			}
		}).catch((error) => console.error(error));
	}, [])

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		if (id === 'leadCategory') {
			setCustomerTypeLookup(masterRef.current.CUSTOMER_TYPE.filter(f => f.mapping.customerCategory.includes(value)))
		}
		setLeadData({
			...leadData,
			[id]: value,
		});
	};

	const validateData = async (schema, data) => {
		return new Promise((resolve, reject) => {
			schema.validate(data, { abortEarly: false }).then(function () {
				resolve({ success: true });
			}).catch(function (err) {
				let errors = {};
				err.inner.forEach(e => {
					errors[e.path] = e.message;
				});
				resolve({ failure: errors });
			});
		});
	}

	const clearItem = () => {
		const generatedContactNo = getRandomString()
		const generatedRandomId = getRandomId()
		const generatedReminderId = getRandomId()
		unstable_batchedUpdates(() => {
			setLeadData({
				contactList: [{ contactNo: generatedContactNo }],
				engagementList: [{ engagementId: generatedRandomId }],
				addressList: [{}],
				reminderList: [{ reminderId: generatedReminderId }],
				leadLogo: null
			});
			setEngagementList([{ engagementId: generatedRandomId }])
			setContactList([{ contactNo: generatedContactNo }])
			setReminderList([{ reminderId: generatedReminderId }])
			setAddressList([{}])
			setLogoSource(null);
			const inputFields = ["leadName"];
			inputFields.forEach(field => {
				inputRef.current[field].value = "";
			})
			const element = document.getElementById('leadLogo');
			element.value = null;
			setCurrentFiles([...[]])
			setExistingFiles([...[]])
		})
		toast.warning("Filled values got cleared");
	}

	const gotoReminder = async () => {
		if (!leadData.contactList?.length) leadData['contactList'] = [{ contactNo: getRandomString() }];
		if (!leadData.engagementList?.length) leadData['engagementList'] = [{ engagementId: getRandomId() }];
		if (!leadData.addressList?.length) leadData['addressList'] = [{}];
		if (!leadData.reminderList?.length) leadData['reminderList'] = [{ reminderId: getRandomId() }];

		const validationResponse = await validateData(stakeholderSchema, leadData);

		if (validationResponse.success) {
			setFormErrors({});
			setCurrentTab('reminders');
		} else {
			setFormErrors({ ...validationResponse.failure });
			toast.error("Please fill the mandatory fields");
		}
	}

	const saveItem = async () => {
		setFormErrors({});
		if (!leadData.contactList?.length) leadData['contactList'] = [{ contactNo: getRandomString() }];
		if (!leadData.engagementList?.length) leadData['engagementList'] = [{ engagementId: getRandomId() }];
		if (!leadData.addressList?.length) leadData['addressList'] = [{}];
		if (!leadData.reminderList?.length) leadData['reminderList'] = [{ reminderId: getRandomId() }];
		if (!leadData.attachment?.length) leadData['attachment'] = currentFiles

		console.log('reminderSchema, leadData', reminderSchema, leadData)
		const stakeValidation = await validateData(stakeholderSchema, leadData);
		const reminderValidation = await validateData(reminderSchema, leadData);

		if (stakeValidation.success && reminderValidation.success) {
			const filteredReminderList = leadData.reminderList.filter((e) => e.engagementId)

			leadData.reminderList = filteredReminderList
			if (!leadData.leadUuid) {
				post(`${properties.LEAD_API}/create`, leadData).then((resp) => {
					if (resp.status === 200) {
						closeSaveLeadWindow({ leadUuid: resp.data.leadUuid, leadName: resp.data.leadName });
						toast.success(resp.message);
					}
				}).catch((error) => console.error(error));
			} else {
				if (deletedAddress && deletedAddress?.length > 0) {
					post(`${properties.LEAD_API}/delete-entity`, { entity: 'ADDRESS', addressNo: deletedAddress }).then((resp) => {
						if (resp.status === 200) { }
					}).catch(err => {
						console.error(err)
					});
				}

				if (deletedContacts && deletedContacts?.length > 0) {
					post(`${properties.LEAD_API}/delete-entity`, { entity: 'CONTACT', contactNo: deletedContacts }).then((resp) => {
						if (resp.status === 200) { }
					}).catch(err => {
						console.error(err)
					});
				}

				if (deletedEngagements && deletedEngagements?.length > 0) {
					post(`${properties.LEAD_API}/delete-entity`, { entity: 'ENGAGEMENT', engagementUuid: deletedEngagements }).then((resp) => {
						if (resp.status === 200) { }
					}).catch(err => {
						console.error(err)
					});
				}

				if (deletedReminders && deletedReminders?.length > 0) {
					post(`${properties.LEAD_API}/delete-entity`, { entity: 'REMINDER', reminderId: deletedReminders }).then((resp) => {
						if (resp.status === 200) { }
					}).catch(err => {
						console.error(err)
					});
				}

				put(`${properties.LEAD_API}/update/${leadData.leadUuid}`, leadData).then((resp) => {
					if (resp.status === 200) {
						closeSaveLeadWindow({});
						toast.success(resp.message);
					}
				}).catch((error) => console.error(error));
			}
		} else {
			setFormErrors({ ...stakeValidation.failure ?? {}, ...reminderValidation.failure ?? {} });
			toast.error("Please fill the mandatory fields");
		}
	};

	const closeSaveLeadWindow = (data) => {
		if (dontRedirectBack === true) {
			if (typeof closeWindow === 'function') closeWindow();
			if (sendDataBack === true) dataCaptureFunction(data);
		} else {
			// if (screenMode !== 'Add') {
			// 	history("/leads-edit?leadUuid=" + leadUuid)
			// } else {
			history("/leads-list")
			// }
		}
	}

	const [leadAssociate, setLeadAssociate] = useState({})
	const getLeadAssociateCount = useCallback(() => {
		if (leadUuid) {
			get(`${properties.LEAD_API}/get-lead-associate-count/${leadUuid}`).then((resp) => {
				if (resp.status === 200) {
					setLeadAssociate(resp.data)
				}
			}).catch((error) => console.error(error));
		}
	}, [leadUuid])

	useEffect(() => {
		getLeadAssociateCount()
	}, [getLeadAssociateCount])

	const contextProvider = {
		data: {
			auth,
			leadData,
			leadStatusLookup,
			leadSourceLookup,
			customerTypeLookup,
			tagsLookup,
			customerCategoryLookup,
			engagementStatusLookup,
			countryLookup,
			addressTypeLookup,
			addressList,
			contactList,
			engagementList,
			reminderList,
			error,
			addressLookUpRef,
			addressData,
			actionList,
			taskCategoryLookup,
			taskTypeLookup,
			taskStatusLookup,
			taskPriorityLookup,
			userLookup,
			taskList,
			roleList,
			currentFiles,
			// missionList,
			formErrors,
			screenMode,
			isRead,
			permission,
			deletedContacts,
			deletedEngagements,
			deletedAddress,
			deletedReminders,
			existingFiles,
			leadAssociate,
			logoSource,
			role,
			usersBasedOnRole
		},
		refs: {
			inputRef
		},
		handlers: {
			setLeadData,
			handleOnChange,
			setAddressList,
			setContactList,
			setEngagementList,
			setReminderList,
			setAddressLookUpRef,
			setError,
			setAddressData,
			setActionList,
			setTaskList,
			handleAddTask,
			setCurrentFiles,
			setTagsLookup,
			setIsRead,
			closeSaveLeadWindow,
			getRandomString,
			setDeletedContacts,
			setDeletedEngagements,
			setDeletedAddress,
			setDeletedReminders,
			setLogoSource,
			setRoles,
			getUsersBasedOnRole,
			setFormErrors
		},
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const permissions = await getPermissions('STAKEHOLDER_EDIT');
				setPermission(permissions);
			} catch (error) {
				console.error('Error fetching permissions:', error);
			}
		};
		fetchData();
	}, []);

	const getAttachmentList = useCallback(() => {
		if (leadUuid) {
			get(`${properties?.COMMON_API}/attachment/${leadUuid}`).then((response) => {
				if (response?.status === 200 && response?.data && Array?.isArray(response?.data) && response?.data?.length > 0) {
					setExistingFiles(response?.data)
				}
			}).catch((error) => {
				console.error(error)
			})
		}
	}, [leadUuid])

	useEffect(() => {
		getAttachmentList()
	}, [getAttachmentList, leadUuid])

	useEffect(() => {
		get(properties.USER_API + "/roles-departments")
			.then((resp) => {
				if (resp?.data) {
					setRoles(resp?.data)
				}
			}).catch((error) => {
				console.error(error)
			})
			.finally()
	}, [])

	return (
		<AppContext.Provider value={contextProvider}>
			{/* <div className="cnt-wrapper"> */}
			<div className="">
				{/* <div className="col-12"> */}

				<div className="row px-3">
					<div className="col-12">
						<div className="tabbable-responsive">
							<Tabs activeKey={currentTab} className="tabbable" onSelect={(k) => setCurrentTab(k)}>
								<Tab eventKey="leadDetails" title="Detail" disabled={!isRead} >
									<LeadDetail leadUuid={leadUuid} />
								</Tab>
								<Tab eventKey="reminders" title="Reminders" disabled={!isRead}>
									<Reminders />
								</Tab>
							</Tabs>
							<div className="d-flex flex-justify-center w-100 mt-2">
								{currentTab === "leadDetails" ? (
									<button type="button" className="skel-btn-cancel" hidden={isRead} onClick={clearItem}>
										Clear
									</button>
								) : (
									<button type="button" className="skel-btn-cancel" hidden={isRead} onClick={() => setCurrentTab('leadDetails')}>
										Back
									</button>
								)}
								<button type="button" className="skel-btn-cancel ml-2" hidden={isRead} onClick={closeSaveLeadWindow}>
									Cancel
								</button>
								{currentTab === "leadDetails" ? (
									<button type="button" className="skel-btn-submit ml-2" hidden={isRead} onClick={gotoReminder}>
										Next
									</button>
								) : (
									<button type="button" className="skel-btn-submit ml-2" hidden={isRead} onClick={saveItem}>
										Submit
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* </div> */}
			{/* </div> */}
		</AppContext.Provider>
	);
};

export default AddEditLead;
