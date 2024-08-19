import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import Switch from "react-switch";
import { get, post, put } from "../../common/util/restUtil";
import { properties } from "../../properties";

import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import { MultiSelect } from "react-multi-select-component";
import { NumberFormatBase } from "react-number-format";
import Select, { components } from 'react-select';
import { toast } from "react-toastify";
import Swal from 'sweetalert2';
import { array, object, string } from "yup";
import warningSmiley from '../../assets/images/icons/warning_emoji.png';
import { useHistory } from '../../common/util/history';
import { formFilterObject } from '../../common/util/util';
import { isObjectEmpty } from '../../common/util/validateUtil';
import SelectCountry from '../../common/components/countryList';
// import ScreenMapping from './ScreenMapping';
Modal.setAppElement('body');
const { Option, GroupHeading } = components;

const UserManagementForm = (props) => {
    const history = useHistory()
    const { appsConfig } = props;
    // console.log("UserManagementForm ===> ", appsConfig)
    const data = props?.location?.state?.data
    // console.log(data, "dadasd =>>>>>>>>>>>>>>>>>>>")
    const isNewForm = props?.location?.state?.isNewForm
    const isApprovalForm = props?.location?.state?.isApprovalForm
    const from = isApprovalForm ? 'newUserRequest' : 'userManagement';
    // console.log('isNewForm===', isNewForm, from)
    const entityRef = useRef()
    // const [error, setError] = useState({});
    const [phoneNolength, setPhoneNolength] = useState()
    const [rolesData, setRolesData] = useState([])
    const [rolesDataCopy, setRolesDataCopy] = useState([])
    // const [projects, setProjects] = useState([]);
    const departments = useRef()
    const [selectedRoles, setSelectedRoles] = useState();
    const [selectedProjects, setSelectedProjects] = useState();
    const [selectedSkills, setSelectedSkills] = useState();
    const [locations, setLocations] = useState([]);
    const [countries, setCountries] = useState([]);
    const [userTypes, setUserTypes] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [userCategories, setUserCategories] = useState([]);
    const [userFamilies, setUserFamilies] = useState([]);
    const [userSources, setUserSources] = useState([]);
    const [managerIds, setManagerIds] = useState([]);
    const [filters, setFilters] = useState([]);
    const [notificationTypes, setNotificationTypes] = useState([])
    const [selectedCountryCode, setSelectedCountryCode] = useState("00");
    const [selectedMappingRoles, setSelectedMappingRoles] = useState()
    const [userStatus, setUserStatus] = useState(false)
    const [isValidLoginId, setIsValidLoginId] = useState()
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    // const [selectedUserFamily, setSelectedUserFamily] = useState();
    const [selectedNotificationType, setSelectedNotificationType] = useState();
    const [genderOptions, setGenderOptions] = useState([])
    const roleDetails = useRef()
    const [mappedCountry, setMappedCountry] = useState([])
    const [mappedLocation, setMappedLocation] = useState([])
    const [mappedUserGroup, setMappedUserGroup] = useState([])
    const [mappedUserCategory, setMappedUserCategory] = useState([])
    const [mappedUserType, setMappedUserType] = useState([])
    const [mappedManager, setMappedManager] = useState([])
    const [skills, setSkills] = useState([])
    const [statusReasons, setStatusReasons] = useState({})
    const [projectLookUp, setProjectLookUp] = useState([])
    const [selectedUserFamily, setSelectedUserFamily] = useState();
    const [error, setError] = useState({});
    const [selectedDepts, setDepartments] = useState([]);
    const [mappedDepts, setMappedDepts] = useState([]);
    const initVal = {
        title: null,
        firstName: "",
        lastName: "",
        gender: "",
        email: "",
        dob: "",
        userType: "UT_BUSINESS",
        userGroup: "UG_BUSINESS",
        userCategory: "UC_FULLTIME",
        userFamily: [],
        userSource: "US_WEBAPP",
        userSkills: [],
        notificationType: [],
        country: "",
        loc: "",
        extn: "00",
        contactNo: "",
        status: userStatus === true ? 'AC' : 'IN'
    }
    const [userInfo, setUserInfo] = useState(initVal)

    const validationSchema = object().shape({
        loginid: string().required().label("Login ID"),
        userFamily: array().required().label("User Family"),
        firstName: string().required().label("First name"),
        lastName: string().required().label("Last name"),
        gender: string().required().label("Gender name"),
        // managerId: string().required().label("Manager"),
        email: string().required().email("Email is not in correct format").label("Email"),
        dob: string().required().label("Date of Birth"),
        userType: string().required().label(`${appsConfig?.clientFacingName?.user ?? "User"} type`),
        userGroup: string().required().label(`${appsConfig?.clientFacingName?.user ?? "User"} group`),
        userCategory: userInfo?.userGroup === 'UG_BUSINESS' ? string().required().label(`${appsConfig?.clientFacingName?.user ?? "User"} category`) : '',
        country: string().required().label("Country"),
        extn: string().required().label("Extension"),
        contactNo: string().required().label("Contact no"),
        activationDate: userInfo?.userGroup === 'UG_BUSINESS' ? string().required().label("Activation date") : '',
    })

    useEffect(() => {
        if (props?.location?.state?.data && projectLookUp) {
            let selectedProjects = [];
            props?.location?.state?.data?.projectMapping?.project?.forEach((item) => {
                projectLookUp?.forEach((project) => {
                    if (item === project.value) {
                        selectedProjects.push(project);
                    }
                })
            })
            setSelectedProjects([...selectedProjects]);
        }
    }, [props?.location?.state?.data, projectLookUp])

    useEffect(() => {
        let temp = []

        get(properties.ORGANIZATION + '/search')
            .then((resp) => {
                if (resp.data && resp.data.length > 0) {
                    departments.current = resp.data
                    resp.data.map((e) => {
                        temp.push({ "unitId": e?.unitId, "unitName": e?.unitName, "unitDesc": e?.unitDesc, "roles": e?.mappingPayload?.unitroleMapping || [] })
                    })
                    get(`${properties.ROLE_API}`).then(resp => {
                        if (resp.data) {
                            if ((!isObjectEmpty(data)) && isNewForm === false) {
                                let array = []
                                data?.mappingPayload && data?.mappingPayload?.userDeptRoleMapping.map((e) => {
                                    temp.map((unit) => {
                                        if (unit.unitId === e.unitId) {
                                            e.roleId.map((id) => {
                                                resp.data.map((r) => {
                                                    if (id === r.roleId) {
                                                        array.push({
                                                            label: unit.unitName + '-' + r.roleDesc, value: { "id": r.roleId, "dept": e.unitId }, unitId: e.unitId
                                                        })
                                                    }
                                                })

                                            })
                                        }
                                    })

                                })
                                // setSelectedMappingRoles(array)
                                setSelectedRoles(array)
                                setUserStatus(['AC', 'ACTIVE', 'PENDING'].includes(data.status) ? true : false)
                                setUserInfo({ ...data })
                            }
                            roleDetails.current = resp.data;

                            get(properties.BUSINESS_ENTITY_API + '?searchParam=code_type&valueParam=PROJECT,USER_STATUS_REASON,CONTACT_PREFERENCE,GENDER,COUNTRY,LOCATION,USER_TYPE,USER_GROUP,USER_CATEGORY,USER_FAMILY,USER_SOURCE,PROJECT')
                                .then((resp) => {
                                    if (resp.data) {
                                        entityRef.current = resp.data

                                        let countryVals = resp.data.COUNTRY.map((e) => {
                                            return { id: 'country', value: e.code, label: e.description, countryCode: e.mapping.countryCode, phoneNolength: e.mapping.phoneNolength }
                                        })
                                        // setLocations(resp.data.LOCATION)
                                        let projectsList = resp?.data?.PROJECT?.map(x => ({ label: x.description, value: x.code }))
                                        setProjectLookUp(projectsList)

                                        setCountries(countryVals)
                                        setUserTypes(resp.data.USER_TYPE.map((col, i) => (
                                            {
                                                label: col.description,
                                                value: col.code,
                                                id: 'userType',
                                                mapping: col.mapping
                                            }
                                        )))
                                        setUserGroups(resp.data.USER_GROUP.map((col, i) => (
                                            {
                                                label: col.description,
                                                value: col.code,
                                                id: 'userGroup',
                                                mapping: col.mapping
                                            }
                                        )))
                                        setUserCategories(resp.data.USER_CATEGORY.map((col, i) => (
                                            {
                                                label: col.description,
                                                value: col.code,
                                                id: 'userCategory',
                                                mapping: col.mapping
                                            }
                                        )))
                                        let reasons = {};
                                        resp.data?.USER_STATUS_REASON?.map((e) => {
                                            reasons[e.code] = e.description;
                                        })
                                        setStatusReasons({ ...reasons })
                                        setUserFamilies(resp.data.USER_FAMILY)
                                        //setUserSources(resp.data.USER_SOURCE)
                                        setNotificationTypes(resp.data.CONTACT_PREFERENCE)
                                        setGenderOptions(resp.data.GENDER)
                                        if (resp.data.CONTACT_PREFERENCE.length > 0) {
                                            const val = []
                                            resp.data.CONTACT_PREFERENCE.map((col, i) => {
                                                const obj = {
                                                    label: col.description,
                                                    value: col.code
                                                }
                                                val.push(obj)
                                            })
                                            setNotificationTypes(val)
                                        }
                                        if ((!isObjectEmpty(data)) && isNewForm === false) {
                                            const familyArray = [], notiArray = []
                                            data?.userFamily && data?.userFamily.map((e) => {
                                                entityRef.current.USER_FAMILY.map((f) => {
                                                    if (f.code === e) {
                                                        familyArray.push({
                                                            label: f.description, value: f.code
                                                        })
                                                    }
                                                })
                                            })

                                            data?.notificationType && data?.notificationType.map((e) => {
                                                entityRef.current.CONTACT_PREFERENCE.map((f) => {
                                                    if (f.code === e) {
                                                        notiArray.push({
                                                            label: f.description, value: f.code
                                                        })
                                                    }
                                                })

                                            })
                                            setSelectedUserFamily(familyArray)
                                            setSelectedNotificationType(notiArray)
                                            setPhoneNolength(entityRef.current.COUNTRY.find(ele => ele.code === data?.country)?.mapping.phoneNolength)
                                            if (data?.country) {
                                                //const extn =resp.data.COUNTRY.find(e=> e.code?.toLowerCase() === data?.country.toLowerCase()).mapping?.countryCode
                                                //  setUserInfo({ ...userInfo, extn})
                                                const locationList = resp.data.LOCATION.filter(e => e.mapping?.country?.toLowerCase() === data?.country.toLowerCase())
                                                setLocations(locationList.map(e => (
                                                    {
                                                        label: e.description,
                                                        value: e.code,
                                                        mapping: e.mapping,
                                                        id: 'location'
                                                    }
                                                )))
                                            }
                                        }
                                        // let arr = []
                                        // entityRef.current.USER_SOURCE.filter(ele => {
                                        //     if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(data.userGroup || 'UG_BUSINESS'))
                                        //         return ele
                                        // }).map((col, i) => {
                                        //     const obj = {
                                        //         label: col.description,
                                        //         value: col.code
                                        //     }
                                        //     arr.push(obj)
                                        // })
                                        // setUserSources(arr)
                                        const catArr = entityRef.current.USER_CATEGORY.filter(ele => {
                                            if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(data.userGroup || 'UG_BUSINESS'))
                                                return ele
                                        }).map((col, i) => (
                                            {
                                                label: col.description,
                                                value: col.code,
                                                id: 'userCategory',
                                                mapping: col.mapping
                                            }
                                        ))
                                        setUserCategories(catArr)

                                        const typeArr = entityRef.current.USER_TYPE.filter(ele => {
                                            if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(data.userGroup || 'UG_BUSINESS'))
                                                return ele
                                        }).map((col, i) => (
                                            {
                                                label: col.description,
                                                value: col.code,
                                                id: 'userType',
                                                mapping: col.mapping
                                            }
                                        ))
                                        if (typeArr.length === 1) {
                                            // setUserInfo({...userInfo, userType: typeArr[0].code})   
                                            loadRoles(typeArr[0].value)
                                        } else {
                                            loadRoles("UT_BUSINESS")
                                        }
                                        setUserTypes(typeArr)

                                        const val = []
                                        entityRef.current.USER_FAMILY.filter(ele => {
                                            if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(data.userGroup || 'UG_BUSINESS'))
                                                return ele
                                        }).map((col, i) => {
                                            const obj = {
                                                label: col.description,
                                                value: col.code
                                            }
                                            val.push(obj)
                                        })
                                        // console.log('val==', val)
                                        setUserFamilies(val)

                                    }

                                }).catch((error) => {
                                    console.log(error)
                                }).finally();
                        }
                    }).catch((error) => {
                        console.log(error)
                    }).finally()


                }
            }).catch((error) => {
                console.log(error)
            }).finally()

        get(`${properties.USER_API}/get-skills-list`)
            .then(resp => {
                if (resp.status === 200) {
                    unstable_batchedUpdates(() => {
                        setSkills(resp.data.map(
                            e => ({
                                label: e.skillDesc,
                                value: e.skillId
                            })
                        ))

                        setSelectedSkills(data?.userSkills?.map(x => ({ value: x.skillId, label: x.skillDesc })))
                    })
                }
            }).catch((error) => {
                console.log(error)
            }).finally();

        // get(`${properties.USER_API}/get-managerlist`)
        //     .then(resp => {
        //         if (resp.status === 200) {
        //             unstable_batchedUpdates(() => {
        //                 setManagerIds(resp.data.map(
        //                     e => ({
        //                         label: e.firstName + " " + e.lastName,
        //                         value: e.userId,
        //                         id: 'managerId',
        //                     })
        //                 ))
        //             })
        //         }
        //     }).catch((error) => {
        //         console.log(error)
        //     }).finally();


    }, []);

    const loadRoles = (input) => {
        const roles = [], temp = []
        departments.current && departments.current.length > 0 && departments.current.map((e) => {
            temp.push({ "unitId": e?.unitId, "unitName": e?.unitName, "unitDesc": e?.unitDesc, "roles": e?.mappingPayload?.unitroleMapping, "unitType": e?.unitType || [] })
        })
        roleDetails.current && roleDetails.current.length > 0 && roleDetails.current.map((role) => {
            if (role?.roleFamily?.roleFamilyCode === input)
                roles.push({ "roleId": role.roleId, "roleName": role.roleName, "roleDesc": role.roleDesc })
        })
        let departmentList = []
        temp.length > 0 && temp.map((t) => {
            let rolesArray = []
            t && t?.roles && t?.roles.map((r) => {
                roles.map((role) => {
                    if (Number(r) === Number(role.roleId)) {
                        rolesArray.push(role)
                    }
                })
            })

            departmentList.push({ ...t, roles: rolesArray })
        })

        let mappingList = []
        departmentList.length > 0 && departmentList.map((d) => {
            let obj = { "label": d.unitDesc, "value": d.unitId }
            let options = []
            d.roles.map((r) => {
                options.push(
                    { "label": d.unitType + "-" + d.unitName + "-" + r.roleDesc, "value": { "id": r.roleId, "dept": d.unitId }, "unitId": d.unitId }
                )
            })
            obj.options = options
            mappingList.push(obj)
        })
        mappingList.sort((a, b) => (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0))
        setRolesData(mappingList)
        setRolesDataCopy(mappingList)
    }

    useEffect(() => {
        if (userTypes && userTypes.length === 1) {
            setUserInfo({ ...userInfo, userType: userTypes[0].value })
        }
        if (userCategories && userCategories.length === 1) {
            setUserInfo({ ...userInfo, userCategory: userCategories[0].value })
        }
    }, [userTypes, userCategories])

    const handleOnChangeDropDown = (e) => {
        if (e.id === 'userGroup') {
            let arr = [], catArr = [], typeArr = []
            // entityRef.current.USER_SOURCE.filter(ele => {
            //     if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(e.value))
            //         return ele
            // }).map((col, i) => {
            //     const obj = {
            //         label: col.description,
            //         value: col.code,
            //         id: 'userSource',
            //         mapping: col.mapping
            //     }
            //     arr.push(obj)
            // })
            // setUserSources(arr)

            entityRef.current.USER_CATEGORY.filter(ele => {
                if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(e.value))
                    return ele
            }).map((col, i) => {
                const obj = {
                    label: col.description,
                    value: col.code,
                    id: 'userCategory',
                    mapping: col.mapping
                }
                catArr.push(obj)
            })
            setUserCategories(catArr)


            entityRef.current.USER_TYPE.filter(ele => {
                if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(e.value))
                    return ele
            }).map((col, i) => {
                const obj = {
                    label: col.description,
                    value: col.code,
                    id: 'userType',
                    mapping: col.mapping
                }
                typeArr.push(obj)
            })
            if (typeArr.length === 1) {
                loadRoles(typeArr[0].value)
                setSelectedMappingRoles()
                setSelectedRoles()
                // setSelectedProjects()
            } else {
                loadRoles("UT_BUSINESS")
                setSelectedMappingRoles()
                setSelectedRoles()
                // setSelectedProjects()
            }
            setUserTypes(typeArr)

            const val = []
            entityRef.current.USER_FAMILY.filter(ele => {
                if (ele.mapping?.hasOwnProperty("userGroup") && ele.mapping?.userGroup.includes(e.value))
                    return ele
            }).map((col, i) => {
                const obj = {
                    label: col.description,
                    value: col.code
                }
                val.push(obj)
            })
            setUserFamilies(val)

        }

        if (e.id === 'userType') {
            setSelectedMappingRoles()
            setSelectedRoles()
            // setSelectedProjects()
            loadRoles(e.value)
        }

        if (e.id === 'country') {
            const locationList = entityRef.current.LOCATION.filter(f => f.mapping?.country?.toLowerCase() === e.value.toLowerCase())
            setLocations(locationList.map(e => (
                {
                    label: e.description,
                    value: e.code,
                    mapping: e.mapping,
                    id: 'location'
                }
            )))
        }


    }

    const loadOptions = async (search, loadedOptions, { page }) => {
        const requestBody = {
            //                ...userSearchParams,
            /**
             * [
                            {
                                id: 'firstName',
                                value: search || null
                            }
                        ]
             */
            filters: formFilterObject(filters)
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        };
        const response = await fetch(`${properties.USER_API}/search?limit=10&page=${page}`, requestOptions);
        const responseJSON = await response.json();
        // console.log('responseJSON==', responseJSON)
        const list = [
            ...loadedOptions,
            ...Array.from(responseJSON.data.rows).map((r) => ({
                value: r.userId,
                label: r.firstName
            }))
        ]
        // return {
        //     options: list,
        //     hasMore: responseJSON.data.rows >= 1,
        //     additional: {
        //     page: page + 1,
        //     }
        // }
    }

    const validate = (schema, form) => {
        try {
            schema.validateSync(form, { abortEarly: false });
        } catch (e) {
            console.log('e------------>', e)
            e?.inner?.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };

    const handleSubmit = () => {

        // console.log('selectedUserFamily ', selectedUserFamily)

        let userObject = userInfo

        delete userObject.statusDesc
        delete userObject.userCategoryDesc
        delete userObject.userFamilyDesc
        delete userObject.userTypeDesc
        delete userObject.userGroupDesc
        delete userObject.userSourceDesc
        delete userObject.createdBy
        delete userObject.createdAt
        delete userObject.updatedBy
        delete userObject.updatedAt
        delete userObject.locationDesc
        // delete userObject.projectMapping
        delete userObject.fullName

        if (isApprovalForm) {
            delete userObject.profilePicture;
        }
        // console.log(isNewForm , userInfo.userGroup)

        userObject.userSource = "US_WEBAPP"
        userInfo.userFamily = selectedUserFamily;
        let error = validate(validationSchema, userInfo);
        if (isNewForm === true && userInfo.userGroup === 'UG_BUSINESS' && (selectedUserFamily === undefined || isObjectEmpty(selectedUserFamily))) {
            setError((prevErrr) => ({ ...prevErrr, selectedUserFamily: `Please select ${appsConfig?.clientFacingName?.user?.toLowerCase() ?? "user"} family` }))
        }

        if (error || !selectedUserFamily?.length) {
            toast.error("Validation errors found. Please check highlighted fields")
            return
        }

        if (Number(userInfo?.contactNo?.length) !== Number(phoneNolength)) {
            toast.error("Phone Number length should be " + phoneNolength)
            return;
        }

        // if (userInfo.userGroup === 'UG_BUSINESS' && ["UC_CONTRACT", "UC_FULLTIME"].includes(userInfo.userCategory) && isObjectEmpty(selectedSkills)) {
        //     toast.error("Please select skills")
        //     return;
        // }

        if (isObjectEmpty(selectedRoles)) {
            toast.error("Please select roles")
            return;
        }

        // if (isObjectEmpty(selectedProjects)) {
        //     toast.error("Please select projects")
        //     return;
        // }

        // if (!isObjectEmpty(selectedProjects)) {
        //     userObject.projectMapping = selectedProjects?.map(x => x.value);
        // }

        let dobYears = moment().diff(userInfo.dob, 'years', false);
        if (dobYears < 18) {
            toast.error("Date of birth must be greater than or equal to 18 years");
            return;
        }

        let units

        if (!isObjectEmpty(selectedRoles)) {
            units = selectedRoles.map(item => item.unitId).filter((value, index, self) => self.indexOf(value) === index)
            let mapping = []
            units.map((u) => {
                let roles = []

                selectedRoles.map((s) => {
                    if (s.unitId === u) {
                        roles.push(s.value.id)
                    }
                })
                mapping.push({
                    "roleId": roles,
                    "unitId": u
                })
            })

            let mappingPayloadFinal = {
                "userDeptRoleMapping": mapping
            }
            userObject.mappingPayload = mappingPayloadFinal

        }

        if (!isObjectEmpty(selectedSkills)) {
            userObject.userSkills = selectedSkills.map(x => x.value);
        }

        if (!isObjectEmpty(selectedUserFamily)) {
            const arr = []
            selectedUserFamily.map((u) => {
                if (u.value) {
                    arr.push(u.value)
                    userObject.userFamily = arr
                }
            })
        }

        if (!isObjectEmpty(selectedNotificationType)) {
            const arr = []
            selectedNotificationType.map((u) => {
                if (u.value) {
                    arr.push(u.value)
                    userObject.notificationType = arr
                }
            })
        } else if (isObjectEmpty(selectedNotificationType)) {
            userObject.notificationType = []
        }


        if (userObject.activationDate === '' || !userObject.activationDate)
            userObject.activationDate = moment(new Date()).format('YYYY-MM-DD')
        // if (selectedDepts?.length) {
        //     const deptPremission = selectedDepts.flatMap(dept =>
        //         dept.screens
        //             .filter(screen => screen.checked)
        //             .map(screen => ({
        //                 deptId: dept.unitId,
        //                 screenCode: screen.screenCode
        //             }))
        //     );
        //     userObject.deptPermisson = deptPremission;
        //     userObject.removedDeptPermisson = mappedDepts.filter((elem) => !deptPremission.find(({ deptId }) => elem.deptId === deptId))
        // }
        
        // console.log('userObject', userObject);
        // return false
        if (isNewForm === true && !isApprovalForm) {
            post(properties.USER_API + '/create', userObject)
                .then((resp) => {
                    if (resp.data) {
                        toast.success(resp.message);
                        history(`/admin-user-view`, { state: { from } });
                        setUserInfo({})
                    } else {
                        toast.error("Failed, Please try again");
                    }
                }).catch((error) => {
                    console.log(error)
                }).finally();
        } else if (isApprovalForm === true && !isNewForm) {
            if (userObject.status === "PENDING") userObject.status = "AC"
            put(properties.USER_API + "/approve", userObject).then((resp) => {
                if (resp.status === 200) {
                    toast.success(`${appsConfig?.clientFacingName?.user ?? "User"} approved successfully`)
                    history(`/admin-user-view`, { state: { from } });
                    setUserInfo({})
                }
                else {
                    toast.error("Error while approving user")
                }
            }).catch((error) => {
                console.log(error)
            }).finally()
        } else {
            if (userObject?.notificationType?.length === 0) {
                delete userObject.notificationType
            }
            put(properties.USER_API + "/update/" + userInfo?.userId, userObject)
                .then((resp) => {
                    if (resp.status === 200) {
                        toast.success(resp.message);
                        history(`/admin-user-view`, { state: { from } });
                        setUserInfo({})
                    } else {
                        toast.error("Failed, Please try again");
                    }
                }).catch((error) => {
                    console.log(error)
                }).finally();
        }


    }

    const handleReject = () => {
        Swal.fire({
            text: `Alert..! you are trying to reject this ${appsConfig?.clientFacingName?.user?.toLowerCase() ?? "user"} request. Please proceed with caution.`,
            width: 600,
            input: "select",
            inputPlaceholder: "Reason for rejection",
            showCancelButton: true,
            imageUrl: warningSmiley,
            confirmButtonColor: '#4C5A81',
            confirmButtonText: 'Proceed for Rejection',
            allowOutsideClick: false,
            inputOptions: statusReasons,
            inputPlaceholder: 'Select a reason',
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to provide reason for rejection'
                }
            }
        }).then((result) => {
            // console.log({ result })
            if (result.isConfirmed) {
                put(properties.USER_API + "/update-status/" + userInfo?.userId, { status: 'RJ', statusReason: result.value })
                    .then((resp) => {
                        if (resp.status === 200) {
                            toast.success(resp.message);
                            setUserInfo({})
                            history(`/admin-user-view`, { state: { from } });
                        } else {
                            toast.error("Failed, Please try again");
                        }
                    }).catch((error) => {
                        console.log(error)
                    }).finally();
            }
        }).catch((error) => {
            console.log(error)
        })
    }

    const handleUserFamilyChange = (selectedValues) => {
        setSelectedUserFamily(selectedValues);
        setError({ ...error, selectedUserFamily: selectedValues.length === 0 ? "User Family is required" : "" });
    };

    const handleValidateGetLoginId = async () => {
        try {
            if (userInfo.loginid) {
                const response = await get(`${properties.USER_API}/validate-get-loginid?loginid=${userInfo.loginid}&email=${userInfo.email}`);
                setIsValidLoginId(response.data.valid)
                console.log(response.data)
            } else {
                toast.error("Login ID is required")
            }
        } catch (err) {
            console.log('error------>', err)
        }
    }

    const handleOnChangeCountry = (e) => {
        setUserInfo({ ...userInfo, extn: e.mapping.countryCode });
        setError({ ...error, extn: "" })
        setPhoneNolength(e.mapping.phoneNolength)
    }

    const handleOnchangeMultiSelect = (e, type) => {
        console.log(e, type)
        if (type === 'skillMap') {
            setSelectedSkills(e);
        }
        else if (type === 'roleMap') {
            setSelectedRoles(e);
        }
        else if (type === 'projectMap') {
            setSelectedProjects(e);
        }
    }


    //RnD for bringing multiselect using checkbox and optgroup by srini

    // const renderOptions = (options) => {
    //     return options.map((option) => {
    //         if (option.options && option.options.length > 0) {
    //             return {
    //                 label: option.label,
    //                 options: renderOptions(option.options),
    //             };
    //         } else {
    //             return {
    //                 label: option.label,
    //                 value: option.value,
    //             };
    //         }
    //     });
    // };

    // const transformedOptions = renderOptions(rolesData);

    // const options = [
    //     {
    //         label: 'Leafy and Salad',
    //         options: [
    //             { label: 'Cabbage', value: 'item1' },
    //             { label: 'Spinach', value: 'item2' },
    //             { label: 'Wheat grass', value: 'item3' },
    //             { label: 'Yarrow', value: 'item4' },
    //             { label: 'Pumpkins', value: 'item5' },
    //         ],
    //     },
    //     {
    //         label: 'Beans',
    //         options: [
    //             { label: 'Chickpea', value: 'item6' },
    //             { label: 'Green bean', value: 'item7' },
    //             { label: 'Horse gram', value: 'item8' },
    //         ],
    //     },
    //     {
    //         label: 'Bulb and Stem',
    //         options: [
    //             { label: 'Garlic', value: 'item9' },
    //             { label: 'Nopal', value: 'item10' },
    //             { label: 'Onion', value: 'item11' },
    //         ],
    //     },
    // ];

    // const [selectedOptions, setSelectedOptions] = useState([]);

    // const handleChange = (selected) => {
    //     setSelectedOptions(selected);
    // };

    // const CustomOption = ({ children, ...props }) => {
    //     return (
    //         <div style={{ display: 'flex', alignItems: 'center' }}>
    //             <input type="checkbox" style={{ marginRight: '8px' }} />
    //             <label>{children}</label>
    //         </div>
    //     );
    // };

    // const CustomGroupHeading = ({ children, ...props }) => {
    //     return (
    //         <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
    //             <input type="checkbox" disabled style={{ marginRight: '8px' }} />
    //             <label style={{ fontWeight: 'bold' }}>{children}</label>
    //         </div>
    //     );
    // };


    const [filteredOption, setFilteredOption] = useState([])
    const filterOptions = (options, rolelist) => {
        return options.filter(option => !rolelist.some(roleOption =>
            option.value.id === roleOption.value.id && option.value.dept === roleOption.value.dept
        ));
    };

    useEffect(() => {
        if (rolesDataCopy?.length > 0 && selectedRoles?.length > 0) {
            const filteredRoleList = rolesDataCopy?.map(item => ({
                ...item,
                options: filterOptions(item.options, selectedRoles)
            }));
            setFilteredOption(filteredRoleList)
        } else {
            setFilteredOption(rolesDataCopy)
        }
    }, [rolesDataCopy, selectedRoles])

    return (
        <div>
            <div className="container-fluid mt-2">
                <div className="card-box row">
                    <fieldset className="scheduler-border">
                        <div className="row">
                            {/* <div className="col-md-3">
                                <div className="form-group" >
                                    <label className="control-label">Title</label>
                                    <select className={`form-control ${(error?.title ? "input-error" : "")}`}
                                        disabled={isNewForm === false ? true : false}
                                        value={userInfo?.title || ""}
                                        onChange={(e) => {
                                            setUserInfo({ ...userInfo, title: e.target.value });
                                            setError({ ...error, title: "" })
                                        }}>
                                        <option value="">Select title...</option>
                                        {titleOptions.map((e) => (
                                            <option key={e.label} value={e.value}>{e.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div> */}
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">First Name&nbsp;<span>*</span></label>
                                    <input className={`form-control ${(error?.firstName ? "input-error" : "")}`} placeholder="Enter First Name"
                                        value={userInfo?.firstName || ""}
                                        disabled={isNewForm === false ? true : false}
                                        type="text"
                                        maxLength={100}
                                        onChange={(e) => {
                                            setUserInfo({
                                                ...userInfo,
                                                firstName: e.target.value,
                                            });
                                            setError({ ...error, firstName: "" })
                                        }} />
                                    {error?.firstName ? <span className="errormsg">{error?.firstName}</span> : ""}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Last Name&nbsp;<span>*</span></label>
                                    <input className={`form-control ${(error?.lastName ? "input-error" : "")}`} placeholder="Enter Last Name"
                                        value={userInfo?.lastName || ""}
                                        disabled={isNewForm === false ? true : false}
                                        type="text"
                                        maxLength={100}
                                        onChange={(e) => {
                                            setUserInfo({
                                                ...userInfo,
                                                lastName: e.target.value,
                                            });
                                            setError({ ...error, lastName: "" })
                                        }} />
                                    {error?.lastName ? <span className="errormsg">{error?.lastName}</span> : ""}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Email Id&nbsp;<span>*</span></label>
                                    <input className={`form-control ${(error?.email ? "input-error" : "")}`} placeholder="Enter Email"
                                        type="email"
                                        maxLength={100}
                                        disabled={!isNewForm || userInfo.status === 'RJ'}
                                        value={userInfo?.email || ""}
                                        onChange={(e) => {
                                            setUserInfo({
                                                ...userInfo,
                                                email: e.target.value,
                                            });
                                            setError({ ...error, email: "" })
                                        }} />
                                    {error?.email ? <span className="errormsg">{error?.email}</span> : ""}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <div style={{ display: "flex" }}>
                                        <div style={{ width: "75%" }}>
                                            <label className="control-label">Login Id&nbsp;<span>*</span></label>
                                            <input className={`form-control ${(error?.loginid ? "input-error" : "")}`} placeholder="Enter your preferred login ID"
                                                style={{ width: "90%" }}
                                                value={userInfo?.loginid || ""}
                                                disabled={isNewForm === false ? true : false}
                                                type="text"
                                                maxLength={10}
                                                onChange={(e) => {
                                                    setUserInfo({
                                                        ...userInfo,
                                                        loginid: e.target.value,
                                                    });
                                                    setError({ ...error, loginid: "" })
                                                }} />

                                            {error?.loginid ? <span className="errormsg">{error?.loginid}</span> : ""}
                                        </div>
                                        <div style={{ width: "25%" }}>
                                            <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center' }}>
                                                <button className='form-control' onClick={handleValidateGetLoginId}>Validate</button>
                                                {isValidLoginId ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" viewBox="0 0 16 16">
                                                        <path d="M12.707 3.293a1 1 0 1 1 1.414 1.414l-7 7a1 1 0 0 1-1.414 0l-3-3a1 1 0 1 1 1.414-1.414L6 10.586l6.293-6.293z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" viewBox="0 0 16 16">
                                                        <path d="M13.657 4.343a1 1 0 0 1 1.414 1.414L9.414 8l5.657 5.657a1 1 0 1 1-1.414 1.414L8 9.414l-5.657 5.657a1 1 0 1 1-1.414-1.414L6.586 8 1.929 2.343a1 1 0 0 1 1.414-1.414L8 6.586l5.657-5.657a1 1 0 0 1 1.414 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <div style={{ display: "flex" }}>
                                        <div style={{ width: "25%" }}>
                                            <label className="control-label">Prefix</label>
                                            {/* <Select
                                                isDisabled={!isNewForm || userInfo.status === 'RJ'}
                                                id="extn"

                                                menuPortalTarget={document.body}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                                options={phoneNoPrefix}
                                                isMulti={false}
                                                value={[{ label: userInfo?.extn, value: userInfo?.extn }] || mappedExtn}
                                                onChange={(e) => {
                                                    setMappedExtn(e)
                                                    let phoneNoLen
                                                    phoneNoPrefix.filter((s) => {
                                                        if (s.value === e.value) {
                                                            phoneNoLen = s.phoneNolength
                                                        }
                                                    })
                                                    setPhoneNolength(phoneNoLen)
                                                    setUserInfo({ ...userInfo, extn: e.value });
                                                    setError({ ...error, extn: "" })
                                                    handleOnChangeDropDown(e)
                                                }}>
                                            </Select> */}
                                            <SelectCountry
                                                disabled={!isNewForm || userInfo.status === 'RJ'}
                                                value={userInfo?.extn}
                                                onChange={handleOnChangeCountry}
                                            />
                                            {/* {error?.country ? <span className="errormsg">{error?.country}</span> : ""} */}
                                            {/* <input className="form-control" type="text" value={userInfo?.extn ? "+" + userInfo?.extn : "+" + selectedCountryCode} readOnly="true" /> */}
                                        </div>
                                        &nbsp;
                                        <div style={{ width: "75%" }}>
                                            <label className="control-label">Contact Number&nbsp;<span>*</span></label>
                                            {/* <NumberFormatBase className={`form-control ${(error?.contactNo ? "input-error" : "")} `}
                                                placeholder="Enter Contact Number"
                                                value={userInfo?.contactNo}
                                                disabled={!isNewForm || userInfo.status === 'RJ'}
                                                maxLength={phoneNolength}
                                                minLength={phoneNolength}
                                                pattern={phoneNolength && `.{${phoneNolength},}`}
                                                // required
                                                title={phoneNolength ? `Required ${phoneNolength} digit number` : ''}
                                                onChange={(e) => {
                                                    setUserInfo({
                                                        ...userInfo,
                                                        contactNo: e.target.value,
                                                    });
                                                    setError({ ...error, contactNo: "" })
                                                }} /> */}
                                            {console.log('phoneNolength--------->', phoneNolength)}
                                            <NumberFormatBase
                                                className={`form-control ${(error?.contactNo ? "input-error" : "")}`}
                                                placeholder="Enter Contact Number"
                                                value={userInfo?.contactNo}
                                                disabled={!isNewForm || userInfo.status === 'RJ'}
                                                maxLength={phoneNolength}
                                                minLength={phoneNolength}
                                                pattern={phoneNolength && `.{${phoneNolength},}`}
                                                title={phoneNolength ? `Required ${phoneNolength} digit number` : ''}
                                                onChange={(e) => {
                                                    console.log('e.target.value------>', e.target.value)
                                                    console.log('phoneNolength------>', phoneNolength)
                                                    setUserInfo({
                                                        ...userInfo,
                                                        contactNo: e.target.value,
                                                    });
                                                    setError({ ...error, contactNo: "" })
                                                }}
                                            />
                                            {error?.contactNo ? <span className="errormsg">{error?.contactNo}</span> : ""}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">Gender&nbsp;<span>*</span></label>
                                    <select className={`form-control ${(error?.gender ? "input-error" : "")}`}
                                        disabled={isNewForm === false ? true : false}
                                        value={userInfo?.gender || ""}
                                        onChange={(e) => {
                                            setUserInfo({ ...userInfo, gender: e.target.value });
                                            setError({ ...error, gender: "" })
                                        }}>
                                        <option value="">Select Gender</option>
                                        {genderOptions.map((e) => (
                                            <option key={e.code} value={e.code}>{e.description}</option>
                                        ))}
                                    </select>
                                    {error?.gender ? <span className="errormsg">{error?.gender}</span> : ""}

                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">DOB&nbsp;<span>*</span></label>
                                    <input className={`form-control ${(error?.dob ? "input-error" : "")}`} placeholder="Enter date of birth"
                                        disabled={userInfo.status === 'RJ' ? true : false}
                                        type="date"
                                        value={userInfo?.dob || ""}
                                        min={moment(new Date()).subtract(100, "years").format('YYYY-MM-DD')}
                                        max={moment(new Date()).subtract(18, "years").format('YYYY-MM-DD')}
                                        // max={moment(new Date()).format('YYYY-MM-DD')}
                                        onChange={(e) => {
                                            setUserInfo({
                                                ...userInfo,
                                                dob: e.target.value,
                                            });
                                            setError({ ...error, dob: "" })
                                        }} />
                                    {error?.dob ? <span className="errormsg">{error?.dob}</span> : ""}
                                </div>
                            </div>
                            {/* <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">{appsConfig?.clientFacingName?.user ?? "User"} Group&nbsp;<span>*</span></label>
                                    <Select
                                        isDisabled={userInfo.status === 'RJ' || (isApprovalForm === true || isNewForm === false)}
                                        id="userGroup"

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        options={userGroups}
                                        isMulti={false}
                                        value={[{ label: userGroups.find(ele => ele.value === userInfo?.userGroup)?.label, value: userInfo?.userGroup }] || mappedUserGroup}
                                        onChange={(e) => {
                                            setMappedUserGroup(e)
                                            setUserInfo({ ...userInfo, userGroup: e.value });
                                            setError({ ...error, userGroup: "" })
                                            handleOnChangeDropDown(e)
                                        }}>

                                    </Select>
                                    {error?.userGroup ? <span className="errormsg">{error?.userGroup}</span> : ""}
                                </div>
                            </div> */}
                            {userCategories && userCategories.length > 0 &&
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label className="control-label">{appsConfig?.clientFacingName?.user ?? "User"} Category&nbsp;<span>*</span></label>
                                        <Select
                                            isDisabled={userInfo.userGroup === 'UG_CONSUMER' || userInfo.status === 'RJ'}
                                            id="userCategory"

                                            menuPortalTarget={document.body}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                            options={userCategories}
                                            isMulti={false}
                                            value={[{ label: userCategories.find(ele => ele.value === userInfo?.userCategory)?.label, value: userInfo?.userCategory }] || mappedUserCategory}
                                            onChange={(e) => {
                                                setMappedUserCategory(e)
                                                setUserInfo({ ...userInfo, userCategory: e.value });
                                                setError({ ...error, userCategory: "" })
                                                handleOnChangeDropDown(e)
                                            }}>

                                        </Select>
                                        {error?.userCategory ? <span className="errormsg">{error?.userCategory}</span> : ""}
                                    </div>
                                </div>
                            }
                            {/* {console.log('userType==', userInfo?.userType)} */}
                            {/* {console.log('userTypes==', userTypes)} */}
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">{appsConfig?.clientFacingName?.user ?? "User"} Type&nbsp;<span>*</span></label>
                                    <Select
                                        isDisabled={userInfo.userGroup === 'UG_CONSUMER' || userInfo.status === 'RJ'}
                                        id="userType"

                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                        options={userTypes}
                                        isMulti={false}
                                        value={[{ label: userTypes.find(ele => ele.value === userInfo?.userType)?.label, value: userInfo?.userType }] || mappedUserType}
                                        onChange={(e) => {
                                            setMappedUserType(e)
                                            setUserInfo({ ...userInfo, userType: e.value });
                                            setError({ ...error, userType: "" })
                                            handleOnChangeDropDown(e)
                                        }}>
                                    </Select>

                                    {error?.userType ? <span className="errormsg">{error?.userType}</span> : ""}
                                </div>
                            </div>
                            {/*<div className="col-md-3">
                                <div className="form-group">
                                    <label className="control-label">User Source&nbsp;<span>*</span></label>
                                    
                                        <select className={`form-control ${(error?.userSource ? "input-error" : "")}`}
                                        value={userInfo?.userSource}
                                        onChange={(e) => {
                                            setUserInfo({ ...userInfo, userSource: e.target.value });
                                            setError({ ...error, userSource: "" })
                                        }}>
                                        <option value="">Select user source...</option>
                                        {userSources && userSources.map((e) => (
                                            <option key={e.code} value={e.code}>{e.description}</option>
                                        ))}
                                    </select> 
                                    {error?.userSource ? <span className="errormsg">{error?.userSource}</span> : ""}
                                </div>
                            </div> */}
                            <div className="col-md-3">
                                <div className="">
                                    <label className="control-label">{appsConfig?.clientFacingName?.user ?? "User"} Family&nbsp;<span className="text-danger">*</span></label>
                                    <MultiSelect
                                        disabled={userInfo.status === 'RJ'}
                                        options={userFamilies}
                                        value={selectedUserFamily ? selectedUserFamily : []}
                                        onChange={handleUserFamilyChange}
                                        //     onChange={(e)=>{setSelectedUserFamily(e)
                                        //     }
                                        // }
                                        labelledBy="Select Columns"
                                        style={error?.selectedUserFamily ? { border: '10px' } : { border: '1px solid #ccc' }}
                                        className={`skel-z-index-s1 ${(error?.selectedUserFamily ? "input-error" : "")}`}
                                    // onChange={(e) => {
                                    //     setUserInfo({
                                    //         ...userInfo,
                                    //         selectedUserFamily: e.target.value,
                                    //     });
                                    //     setError({ ...error, selectedUserFamily: "" })
                                    // }}



                                    />
                                    {error?.selectedUserFamily ? <span className="errormsg">{error?.selectedUserFamily}</span> : ""}
                                </div>
                            </div>
                            {
                                userInfo.userGroup !== 'UG_CONSUMER' ?
                                    <>
                                        <div className="col-md-3">
                                            <div className="">
                                                <label className="control-label"> Contact Preference&nbsp;</label>
                                                <MultiSelect
                                                    disabled={userInfo.status === 'RJ'}
                                                    options={notificationTypes}
                                                    value={selectedNotificationType ? selectedNotificationType : []}
                                                    onChange={setSelectedNotificationType}
                                                    labelledBy="Select Columns"
                                                    className="skel-z-index-s1"
                                                />
                                                {error?.notificationType ? <span className="errormsg">{error?.notificationType}</span> : ""}


                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">Country&nbsp;<span>*</span></label>
                                                <Select
                                                    id="country"

                                                    menuPortalTarget={document.body}
                                                    styles={{
                                                        container: base => ({ ...base, border: error?.country ? '1px solid red' : '0px solid #ccc' }),
                                                        menuPortal: base => ({ ...base, zIndex: 9999 })
                                                    }}

                                                    className='skel-z-index-s1'
                                                    isDisabled={userInfo.status === 'RJ'}
                                                    options={countries}
                                                    isMulti={false}
                                                    value={[{ label: userInfo?.country, value: userInfo?.country }] || mappedCountry}
                                                    onChange={(e) => {
                                                        setMappedCountry(e)
                                                        let a
                                                        countries.filter((s) => {
                                                            if (s.code === e.value) {
                                                                a = s.countryCode
                                                            }
                                                        })
                                                        setSelectedCountryCode(a)
                                                        setUserInfo({ ...userInfo, country: e.value });
                                                        setError({ ...error, country: "" })
                                                        handleOnChangeDropDown(e)
                                                    }}>

                                                </Select>
                                                {error?.country ? <span className="errormsg">{error?.country}</span> : ""}
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">Location</label>
                                                <Select
                                                    isDisabled={userInfo.status === 'RJ'}
                                                    id="location"

                                                    menuPortalTarget={document.body}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}

                                                    options={locations}
                                                    isMulti={false}
                                                    value={[{ label: locations.find(ele => ele.value === userInfo?.loc)?.label, value: userInfo?.loc }] || mappedLocation}
                                                    onChange={(e) => {
                                                        setMappedLocation(e)
                                                        setUserInfo({ ...userInfo, loc: e.value });
                                                        setError({ ...error, loc: "" })

                                                    }}>
                                                </Select>

                                                {error?.loc ? <span className="errormsg">{error?.loc}</span> : ""}

                                            </div>
                                        </div>
                                        {/* <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">Manager&nbsp;<span>*</span></label>
                                                <Select
                                                    id="managerId"

                                                    menuPortalTarget={document.body}
                                                    styles={{
                                                        container: base => ({ ...base, border: error?.managerId ? '1px solid red' : '1px solid #ccc' }),
                                                        menuPortal: base => ({
                                                            ...base, zIndex: 9999
                                                        })
                                                    }}
                                                    options={managerIds}
                                                    isDisabled={userInfo.status === 'RJ'}
                                                    isMulti={false}
                                                    value={[{ label: managerIds.find(ele => ele.value === userInfo?.managerId)?.label, value: userInfo?.managerId }] || mappedManager}
                                                    onChange={(e) => {
                                                        setMappedManager(e)
                                                        setUserInfo({ ...userInfo, managerId: e.value });
                                                        setError({ ...error, managerId: "" })

                                                    }}>
                                                </Select>
                                                {error?.managerId ? <span className="errormsg">{error?.managerId}</span> : ""}
                                            </div>
                                        </div> */}
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">Activation Date&nbsp;<span>*</span></label>
                                                <input className={`form-control ${(error?.activationDate ? "input-error" : "")}`} placeholder="Enter activation date"
                                                    type="date"
                                                    disabled={userInfo.status === 'RJ'}
                                                    value={userInfo?.activationDate ? moment(userInfo?.activationDate).format('YYYY-MM-DD') : ""}
                                                    min={props?.isNewForm === true ? moment(new Date()).format('YYYY-MM-DD') : moment(userInfo?.activationDate).format('YYYY-MM-DD')}
                                                    max={moment(new Date()).add(2, 'year').format('YYYY-MM-DD')}
                                                    onChange={(e) => {
                                                        setUserInfo({
                                                            ...userInfo,
                                                            activationDate: e.target.value,
                                                        });
                                                        setError({ ...error, activationDate: "" })
                                                    }} />
                                                {error?.activationDate ? <span className="errormsg">{error?.activationDate}</span> : ""}

                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">Expiry Date</label>
                                                <input className="form-control" placeholder="Enter date of expiry date"
                                                    type="date"
                                                    disabled={userInfo.status === 'RJ'}
                                                    value={userInfo?.expiryDate ? moment(new Date(userInfo?.expiryDate)).format('YYYY-MM-DD') : ""}
                                                    min={(userInfo?.activationDate) ? moment(new Date(userInfo?.activationDate)).format('YYYY-MM-DD') : moment(new Date()).format('YYYY-MM-DD')}
                                                    onChange={(e) => {
                                                        setUserInfo({
                                                            ...userInfo,
                                                            expiryDate: e.target.value,
                                                        });

                                                    }} />


                                            </div>
                                        </div>
                                        {/* {biAccessStatus &&
                                            <div className="col-md-3">
                                                <div className="form-group">
                                                    <label className="control-label">BI Access Key&nbsp;<span>*</span></label>
                                                    <input className="form-control" placeholder="Enter Access Key"
                                                        value={userInfo?.biAccessKey || ""}
                                                        disabled={userInfo.status === 'RJ'}
                                                        type="text"
                                                        onChange={(e) => {
                                                            setUserInfo({
                                                                ...userInfo,
                                                                biAccessKey: e.target.value
                                                            })
                                                        }} />
                                                </div>
                                            </div>
                                        }
                                        <div className="col-md-3">
                                            <div className="form-group">
                                                <label className="control-label">BI Access</label>
                                                <Switch checked={biAccessStatus}
                                                    disabled={userInfo.status === 'RJ'}
                                                    onChange={(e) => {
                                                        setBiAccessStatus(!biAccessStatus)
                                                        setUserInfo({
                                                            ...userInfo,
                                                            biAccess: e === false ? 'N' : 'Y'
                                                        });

                                                    }} />


                                            </div>
                                        </div> */}
                                    </>
                                    : <></>
                            }

                            {userInfo.status !== 'RJ' ?
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label className="control-label">Status</label>
                                        <Switch checked={userStatus}
                                            onChange={(e) => {
                                                setUserStatus(!userStatus)
                                                setUserInfo({
                                                    ...userInfo,
                                                    status: e === false ? 'IN' : 'AC'
                                                });

                                            }} />
                                    </div>
                                </div>
                                : <div className="col-md-3">
                                    <div className="form-group">
                                        <label className="control-label">Status</label>
                                        <input className="form-control" placeholder="Enter Access Key"
                                            value={userInfo?.statusDesc?.description || ""}
                                            disabled={true}
                                        />
                                    </div>
                                </div>
                            }

                        </div>

                        {userInfo.status !== 'RJ' &&
                            <React.Fragment>
                                <div className='row'>
                                    {userInfo.userGroup === 'UG_BUSINESS' && (
                                        <React.Fragment>

                                            <div className="col-4" >
                                                <div className="pl-2 bg-light border" > <h5 className="text-primary" >Skill Sets</h5 > </div >
                                                {skills &&
                                                    <div className='mt-2' style={{ width: "100%" }}>
                                                        {/* <MultiSelect
                                                            options={skills}
                                                            value={selectedSkills ? selectedSkills : []}
                                                            onChange={(e) => handleOnchangeMultiSelect(e, 'skillMap')}
                                                        /> 
                                                                  {/* <Select
                                                    options={options}
                                                    value={selectedOptions}
                                                    onChange={handleChange}
                                                    isMulti
                                                    closeMenuOnSelect={false}
                                                    components={{
                                                        Option: CustomOption,
                                                        GroupHeading: CustomGroupHeading,
                                                    }}
                                                /> 
                                                        */}
                                                        <Select
                                                            closeMenuOnSelect={false}
                                                            value={selectedSkills ? selectedSkills : null}
                                                            options={skills}
                                                            onChange={setSelectedSkills}
                                                            isMulti
                                                            isClearable
                                                            name="skills"
                                                            menuPortalTarget={document.Modal}
                                                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                        />
                                                        {error?.selectedSkills ? <span className="errormsg">{error?.selectedSkills}</span> : ""}

                                                    </div>
                                                }
                                            </div>
                                            <br />
                                        </React.Fragment>
                                    )}

                                    <div className="col-4" >
                                        <div className="pl-2 bg-light border" > <h5 className="text-primary" >Map Role</h5 > </div >
                                        {rolesData &&
                                            <div className='mt-2' style={{ width: "100%" }}>
                                                {/* <MultiSelect
                                                    options={transformedOptions}
                                                    value={selectedRoles ? selectedRoles : []}
                                                    onChange={(e) => handleOnchangeMultiSelect(e, 'roleMap')}
                                                /> */}
                                                <Select
                                                    // menuIsOpen={true}
                                                    closeMenuOnSelect={false}
                                                    value={selectedRoles ? selectedRoles : null}
                                                    options={filteredOption}
                                                    // options={rolesData}
                                                    getOptionLabel={option => `${option.label}`}
                                                    onChange={setSelectedRoles}
                                                    isMulti
                                                    isClearable
                                                    name="roles"
                                                    menuPortalTarget={document.Modal}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                                {error?.selectedRoles ? <span className="errormsg">{error?.selectedRoles}</span> : ""}
                                            </div>
                                        }
                                    </div>
                                    <br />



                                    <div className="col-4" >
                                        <div className="pl-2 bg-light border" > <h5 className="text-primary" >Map Projects</h5 > </div >
                                        {projectLookUp?.length &&
                                            <div className='mt-2' style={{ width: "100%" }}>
                                                {/* <MultiSelect
                                                    options={projectLookUp}
                                                    value={selectedProjects ? selectedProjects : []}
                                                    onChange={(e) => handleOnchangeMultiSelect(e, 'projectMap')}
                                                /> */}
                                                <Select
                                                    closeMenuOnSelect={false}
                                                    value={selectedProjects ? selectedProjects : null}
                                                    options={projectLookUp}
                                                    getOptionLabel={option => `${option.label}`}
                                                    onChange={(e) => {
                                                        const projectList = e?.map((item) => item.value)
                                                        setSelectedProjects(e)
                                                        console.log("projectList ==> ", projectList);
                                                        setUserInfo({ ...userInfo, projectMapping: { project: projectList } ?? null })
                                                    }}
                                                    isMulti
                                                    isClearable
                                                    name="projects"
                                                    menuPortalTarget={document.Modal}
                                                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                                />
                                            </div>
                                        }
                                    </div>
                                </div>
                                <br />
                                <br />
                                <br />
                                {/* Screen Level Mapping */}
                                {/* {selectedRoles?.length && <ScreenMapping data={{ selectedRoles, userId: userInfo?.userId, selectedDepts, departments }} handler={{ setDepartments, setMappedDepts }} />} */}
                                {/* Screen Level Mapping Ends */}
                                <div className="col-md-12 pl-2">
                                    <div className="form-group pb-1">
                                        {isApprovalForm === false ?
                                            <div className="d-flex justify-content-center">
                                                {/* <button type="button" className="skel-btn-cancel" onClick={closeModal} >Close</button> */}
                                                <button type="submit" className="skel-btn-submit" onClick={handleSubmit}>{isNewForm ? 'Submit' : 'Save Changes'}</button>
                                            </div> :
                                            <div className="d-flex justify-content-center">
                                                <button type="button" className="skel-btn-submit" onClick={handleSubmit} >Approve</button>
                                                <button type="button" className="skel-btn-submit" onClick={handleReject}>Reject</button>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </React.Fragment>
                        }
                    </fieldset>

                </div>
            </div>
        </div >
    );
};

export default UserManagementForm;
