import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import MissionDetail from "./MissionDetail";
import Reminders from "../MissionManagement/Reminder";
import { AppContext } from "../../AppContext";
import { toast } from "react-toastify";
import { useHistory }from "../../common/util/history";
import { getPermissions } from "../../common/util/util";
import { object, string, array, number, date, boolean } from 'yup';
import { Tabs, Tab } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { unstable_batchedUpdates } from "react-dom";
import { getFullName } from "../../common/util/commonUtils";
import { statusConstantCode } from "../../AppConstants";
import { isEmpty } from 'lodash'

const AddEditMission = (props) => {
	const location = useLocation();
	const { auth } = useContext(AppContext);
	const dontRedirectBack = props?.data?.dontRedirectBack;
	const sendDataBack = props?.data?.sendDataBack;
	const closeWindow = props?.handlers?.closeWindow;
	const dataCaptureFunction = props?.handlers?.dataCaptureFunction;
	const source = props?.data?.source
	const history = useHistory()
	const getRandomString = () => Math.random().toString(36).slice(2).toUpperCase();
	const getRandomId = () => Math.floor(100000 + Math.random() * 900000);

	const masterRef = useRef();
	const inputRef = useRef({});
	const logoRef = useRef({});
	const [leadList, setLeadList] = useState([]);
	const [missionData, setMissionData] = useState({
		contactList: [{ contactNo: getRandomString() }],
		engagementList: [{ engagementId: getRandomId() }],
		addressList: [{}],
	});
	const [currentTab, setCurrentTab] = useState('missionDetails');
	const [missionStatusLookup, setmissionStatusLookup] = useState([]);
	const [missionSourceLookup, setmissionSourceLookup] = useState([]);
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
	const [reminderList, setReminderList] = useState([{ leadTaskReminderId: getRandomId() }]);
	const [taskList, setTaskList] = useState([{
		actions: [{}],
	}]);
	const [actionList, setActionList] = useState([{}]);
	const [error, setError] = useState({});
	const [addressData, setAddressData] = useState({});
	const [addressLookUpRef, setAddressLookUpRef] = useState(null);
	const [userLookup, setUserLookup] = useState({});
	const [usersLookup, setUsersLookup] = useState();
	const [roleList, setRoleList] = useState([]);
	const [currentFiles, setCurrentFiles] = useState([]);
	const [missionList, setMissionList] = useState([]);
	const [perPage, setPerPage] = useState(10);
	const [currentPage, setCurrentPage] = useState(0);
	const [formErrors, setFormErrors] = useState({});
	const [permission, setPermission] = useState({})
	const [isEdit, setIsEdit] = useState(location.pathname?.includes('mission-edit') ? true : false);
	const [deletedContacts, setDeletedContacts] = useState([]);
	const [deletedEngagements, setDeletedEngagements] = useState([]);
	const [deletedAddress, setDeletedAddress] = useState([]);
	const [deletedReminders, setDeletedReminders] = useState([]);
	const [existingFiles, setExistingFiles] = useState([])
	const [department, setDepartment] = useState([]);
	const [role, setRole] = useState([]);
	const [renderComponent, setRenderComponent] = useState({ addNewStakeHolder: true })
	const [logoSource, setLogoSource] = useState(null)

	const missionSchema = object({
		leadUuid: string().required().label('Stakeholder'),
		remarks: string().nullable(true).label('Remarks'),
		missionCategory: string().required().label('Mission category'),
		missionType: string().required().label('Mission type'),
		missionName: string().required().label('Mission name'),
		missionLogo: string().nullable(true).label('Mission logo'),
		tags: array().of(string()).nullable(true).label('Mission tags'),
		status: boolean().nullable(true).label('Mission status'),
		contactList: array().of(object({
			contactImage: string().nullable(true).label('Contact image'),
			firstName: string().required().label('Contact name'),
			title: string().nullable(true).label('Designation'),
			emailId: string().email().required().label('Email ID'),
			mobilePrefix: string().required().label('Mobile prefix'),
			mobileNo: number().required().test("is-valid-length", "Mobile number is invalid, else select exact prefix", function (value) {
				const { mobilePrefix } = this.parent;
				let countryDetails = countryLookup.find(x => x.mapping.countryCode == mobilePrefix);
				if (countryDetails) {
					return value?.toString()?.length == countryDetails?.mapping?.phoneNolength;
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
			isPrimary: boolean().required().label('Is primary'),
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
			roleId: string().when("reminderDate", (reminderDate, schema) => {
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
			description: string().nullable(true).when("reminderDate", (reminderDate, schema) => {
				if (!isEmpty(reminderDate) && ![undefined, null].includes(reminderDate?.[0])) {
					return schema.required("Description is required");
				}
				return schema;
			}).label('Description')
		})).label('Reminder list')
	});

	const query = new URLSearchParams(props?.location?.search);
	const missionUuid = query?.get('missionUuid');
	useEffect(() => {
		setRenderComponent({
			addNewStakeHolder: source !== statusConstantCode.entityCategory.TASK
		})
	}, [props, source])


	useEffect(() => {
		if (missionUuid) {
			post(`${properties.LEAD_API}/get-misssion`, { missionUuid }).then((resp) => {
				if (resp.status === 200) {
					const missionDataa = resp.data.rows?.[0] ?? resp.data?.[0];
					missionDataa['contactList'] = missionDataa?.missionContact?.length ? missionDataa?.missionContact : [{ contactNo: getRandomString() }];
					missionDataa['engagementList'] = missionDataa?.missionEngagementDetails?.length ? missionDataa?.missionEngagementDetails : [{ engagementId: getRandomId() }];
					missionDataa['contactList'] = missionDataa?.contactList?.length ? missionDataa?.contactList : [{}];
					const listOfReminders = missionDataa.missionReminderDetails?.length
						? missionDataa.missionReminderDetails.map((reminder) => {
							return {
								leadTaskReminderId: reminder?.leadTaskReminderId,
								reminderDate: reminder?.reminderDate,
								engagementId: reminder?.engagementId,
								departmentId: reminder?.deptDesc?.unitId,
								roleId: reminder?.rolesDesc?.roleId,
								toUser: reminder?.reminderToUser?.userId,
								description: reminder?.description,
								departmentId: reminder?.toDept,
								toRole: reminder?.toRoleId,
								toUser: reminder?.toUserId,
							};
						}) : [{ leadTaskReminderId: getRandomId() }];
					missionDataa['reminderList'] = listOfReminders;
					missionDataa['remarks'] = missionDataa?.missionRemarks;
					missionDataa.status = missionDataa.status === "AC";
					setMissionData(missionDataa);
					if (missionDataa) {
						get(`${properties?.COMMON_API}/attachment/${missionDataa?.missionNo}`).then((response) => {
							if (response?.status === 200 && response?.data && Array?.isArray(response?.data) && response?.data?.length > 0) {
								setExistingFiles(response?.data)
							}
						}).catch((error) => {
							console.error(error)
						})
						setContactList(missionDataa.missionContact?.length ? missionDataa.missionContact : [{ contactNo: getRandomString() }]);
						setEngagementList(missionDataa.missionEngagementDetails?.length ? missionDataa.missionEngagementDetails : [{ engagementId: getRandomId() }]);

						setReminderList((prevReminderList) =>
							listOfReminders
						);

						if (missionDataa.missionTask) {
							const extractedTasks = missionDataa.missionTask.map((missionTask) => missionTask);
							if (extractedTasks.length == 0) {
								setTaskList([{
									taskName: "",
									actions: [{}],
								}]);
							} else {
								setTaskList(extractedTasks);
							}
						}
						if (missionDataa.missionAddressDetails) {
							setAddressList(missionDataa.missionAddressDetails);
						}
					}
				}
			}).catch((error) => {
				console.log(error)
			});
		}
	}, [missionUuid])

	useEffect(() => {
		post(`${properties.LEAD_API}/search`, { withOutAssociations: true, status: 'AC' }).then((resp) => {
			if (resp.status === 200) {
				setLeadList(resp.data.rows.map(x => ({ label: x.leadName, value: x.leadUuid })));
			}
		}).catch((error) => {
			console.log(error)
		});
	}, [])

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
				setmissionStatusLookup(resp.data.LEAD_STATUS);
				setCountryLookup(resp.data.COUNTRY);
				setmissionSourceLookup(resp.data.LEAD_SOURCE);
				setAddressTypeLookup(resp.data.ADDRESS_TYPE);
				setTaskCategoryLookup(resp.data.TASK_CATEGORY);
				setTaskTypeLookup(resp.data.TASK_TYPE);
				setTaskStatusLookup(resp.data.LEAD_TASK_STATUS);
				setTaskPriorityLookup(resp.data.PRIORITY);
			}
		}).catch((error) => console.log(error));

		post(`${properties.LEAD_API}/mission/search?limit=${perPage}&offset=${currentPage}`, {}).then((resp) => {
			if (resp.status === 200) {
				setMissionList(resp.data);
			}
		}).catch((error) => console.log(error));
	}, []);

	const handleOnChange = (e) => {
		const { id, value } = e.target;
		const missionUuid = query?.get('missionUuid');
		if (missionUuid && id === 'status') {
			post(`${properties.LEAD_API}/get-mission-task`, { missionUuid }).then((resp) => {
				if (resp.status === 200) {
					if (resp?.data?.length > 0) {
						toast.error('Please ensure mapped Task should not be Active')
						return
					} else {
						setMissionData({
							...missionData,
							[id]: value,
						});
					}
				}
			}).catch((error) => console.log(error));
		} else {
			if (id == 'missionCategory') {
				setCustomerTypeLookup(masterRef.current.CUSTOMER_TYPE.filter(f => f.mapping.customerCategory.includes(value)))
			}
			setMissionData({
				...missionData,
				[id]: value,
			});
		}
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

	const clearLogoSelection = () => {
		setMissionData({
			...missionData,
			missionLogo: null
		});
		logoRef.current.value = ''
		setLogoSource(null);
	}

	const clearItem = () => {
		logoRef.current.value = ''
		clearLogoSelection();
		const generatedContactNo = getRandomString()
		const generatedRandomId = getRandomId()
		const generatedReminderId = getRandomId()
		unstable_batchedUpdates(() => {
			setMissionData({
				missionLogo: null,
				leadUuid: null,
				contactList: [{ contactNo: generatedContactNo }],
				engagementList: [{ engagementId: generatedRandomId }],
				addressList: [{}],
				reminderList: [{ leadTaskReminderId: generatedReminderId }],
			});
			setEngagementList([{ engagementId: generatedRandomId }])
			setContactList([{ contactNo: generatedContactNo }])
			setReminderList([{ leadTaskReminderId: generatedReminderId }])
			setAddressList([{}])
			const inputFields = ["missionName"];
			inputFields.forEach(field => {
				inputRef.current[field].value = "";
			});
		})
		toast.warning("Filled values got cleared");
	}

	const gotoReminder = async () => {
		if (!missionData.contactList?.length) missionData['contactList'] = [{ contactNo: getRandomString() }];
		if (!missionData.engagementList?.length) missionData['engagementList'] = [{ engagementId: getRandomId() }];
		if (!missionData.addressList?.length) missionData['addressList'] = [{}];
		if (!missionData.reminderList?.length) missionData['reminderList'] = [{ leadTaskReminderId: getRandomId() }];

		const validationResponse = await validateData(missionSchema, missionData);

		if (validationResponse.success) {
			const isPrimaryAddress = missionData?.addressList.find(obj => obj?.isPrimary);
			if (!isPrimaryAddress?.isPrimary) {
				toast.error("At Least one primary address should be selected!")
				return
			}
			setFormErrors({});
			setCurrentTab('reminders');
		} else {
			setFormErrors({ ...validationResponse.failure });
			toast.error("Please fill the mandatory fields");
		}
	}

	const saveItem = async () => {
		setFormErrors({});
		if (!missionData.contactList?.length) missionData['contactList'] = [{ contactNo: getRandomString() }];
		if (!missionData.engagementList?.length) missionData['engagementList'] = [{ engagementId: getRandomId() }];
		if (!missionData.addressList?.length) missionData['addressList'] = [{}];
		if (!missionData.reminderList?.length) missionData['reminderList'] = [{ leadTaskReminderId: getRandomId() }];

		const stakeValidation = await validateData(missionSchema, missionData);
		const reminderValidation = await validateData(reminderSchema, missionData);
		console.log('reminderValidation-------->', JSON.stringify(reminderValidation))
		if (stakeValidation.success && reminderValidation.success) {
			console.log(missionData)
			const isPrimaryAddress = missionData?.addressList.find(obj => obj?.isPrimary);
			if (!isPrimaryAddress?.isPrimary) {
				toast.error("At Least one primary address should be selected!")
				return
			}
			if (!missionData.missionUuid) {
				post(`${properties.LEAD_API}/mission/create`, { ...missionData, attachment: currentFiles }).then((resp) => {
					if (resp.status === 200) {
						closeSavemissionWindow({ missionUuid: resp.data.missionUuid, missionName: resp.data.missionName });
						toast.success(resp.message);
					}
				}).catch((error) => console.log(error));
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
					post(`${properties.LEAD_API}/delete-entity`, { entity: 'REMINDER', leadTaskReminderId: deletedReminders }).then((resp) => {
						if (resp.status === 200) { }
					}).catch(err => {
						console.error(err)
					});
				}
				put(`${properties.LEAD_API}/mission/update/${missionData.missionUuid}`, { ...missionData, attachment: currentFiles }).then((resp) => {
					if (resp.status === 200) {
						closeSavemissionWindow({});
						toast.success(resp.message);
					}
				}).catch((error) => console.log(error));
			}
		} else {
			setFormErrors({ ...stakeValidation.failure ?? {}, ...reminderValidation.failure ?? {} });
			toast.error("Please fill the mandatory fields");
		}
	};

	const closeSavemissionWindow = (data) => {
		if (dontRedirectBack === true) {
			if (typeof closeWindow === 'function') closeWindow();
			if (sendDataBack === true) dataCaptureFunction(data);
		} else {
			history("/mission-list");
		}
	}

	const handleEdit = () => {
		setIsEdit(!isEdit)
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				const permissions = await getPermissions('MISSION_EDIT');
				setPermission(permissions);
			} catch (error) {
				console.error('Error fetching permissions:', error);
			}
		};
		fetchData();
	}, [missionUuid]);

	const getUsers = () => {
		post(`${properties.USER_API}/search?limit=10&page=0`).then((userResponse) => {
			const { data } = userResponse;
			setUsersLookup(data.rows)
		}).catch((error) => console.log(error))
	}

	useEffect(() => {
		getUsers();
	}, [])

	const getUsersBasedOnRole = (roleId, deptId, index) => {
		get(`${properties.USER_API}/by-role?roleId=${roleId}&deptId=${deptId}`)
			.then((userResponse) => {
				const { data } = userResponse
				unstable_batchedUpdates(() => {
					const formattedResponse = data?.sort((a, b) => (a.firstName > b.firstName) ? 1 : ((b.firstName > a.firstName) ? -1 : 0)).map((ele) => ({ ...ele, label: getFullName(ele), value: ele?.userId }));
					setUserLookup((prevUsers) => ({
						...prevUsers,
						[`users_${index}`]: formattedResponse
					}));
				})
			}).catch(error => console.error(error))
			.finally()
	};

	useEffect(() => {
		get(properties.USER_API + "/roles-departments")
			.then((resp) => {
				if (resp?.data) {
					setRole(resp?.data)
				}
			}).catch((error) => {
				console.log(error)
			})
			.finally()
	}, [])

	const contextProvider = {
		data: {
			auth,
			missionData,
			missionStatusLookup,
			missionSourceLookup,
			customerTypeLookup,
			tagsLookup,
			customerCategoryLookup,
			engagementStatusLookup,
			countryLookup,
			addressTypeLookup,
			leadList,
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
			missionList,
			formErrors,
			permission,
			isEdit,
			deletedContacts,
			deletedEngagements,
			deletedAddress,
			deletedReminders,
			existingFiles,
			role,
			department,
			usersLookup,
			renderComponent,
			logoSource,
		},
		refs: {
			inputRef,
			logoRef
		},
		handlers: {
			setLeadList,
			setMissionData,
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
			closeSavemissionWindow,
			handleEdit,
			getRandomId,
			setDeletedContacts,
			setDeletedEngagements,
			setDeletedAddress,
			setDeletedReminders,
			getUsersBasedOnRole,
			clearLogoSelection,
			setLogoSource
		},
	};

	return (
		<AppContext.Provider value={contextProvider}>
			{/* <div className="cnt-wrapper"> */}
			<div className="">
				{/* <div className="col-12"> */}

				<div className="row px-3">
					<div className="col-12">
						<div className="tabbable-responsive">
							<Tabs activeKey={currentTab} className="tabbable" onSelect={(k) => setCurrentTab(k)}>
								<Tab eventKey="missionDetails" title="Detail" disabled={!isEdit}>
									<MissionDetail missionUuid={missionUuid} />
								</Tab>
								<Tab eventKey="reminders" title="Reminders" disabled={!isEdit}>
									<Reminders />
								</Tab>
							</Tabs>
							<div className="d-flex flex-justify-center w-100 mt-2">
								{currentTab === "missionDetails" ? (
									<button disabled={isEdit} type="button" className="skel-btn-cancel" onClick={clearItem}>
										Clear
									</button>
								) : (
									<button type="button" className="skel-btn-cancel" onClick={() => setCurrentTab('missionDetails')}>
										Back
									</button>
								)}
								<button type="button" className="skel-btn-cancel ml-2" onClick={closeSavemissionWindow}>
									Cancel
								</button>
								{currentTab === "missionDetails" ? (
									<button disabled={isEdit} type="button" className="skel-btn-submit ml-2" onClick={gotoReminder}>
										Next
									</button>
								) : (
									<button disabled={isEdit} type="button" className="skel-btn-submit ml-2" onClick={saveItem}>
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

export default AddEditMission;