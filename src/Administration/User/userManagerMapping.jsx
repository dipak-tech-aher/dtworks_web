import moment from 'moment';
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseButton, Form, Modal } from "react-bootstrap";
import { unstable_batchedUpdates } from "react-dom";
import { useForm } from 'react-hook-form';
import { toast } from "react-toastify";
import DynamicTable from "../../common/table/DynamicTable";
import { get, post, put } from "../../common/util/restUtil";
import { formFilterObject, getPermissions } from "../../common/util/util";
import { properties } from "../../properties";
import CustomAsyncSelect from '../../common/AsyncSelect';
import jsonata from 'jsonata'
import { array, boolean, number, object, string } from 'yup';
import Switch from "react-switch";

const UserManagerMapping = (props) => {
    const { appsConfig } = props;

    const [userList, setUserList] = useState([])
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [listSearch, setListSearch] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [exportBtn, setExportBtn] = useState(false);
    const [filters, setFilters] = useState([]);
    const [permission, setPermission] = useState({})
    const [isOpenModal, setIsOpen] = useState(false);
    const { register, handleSubmit, setValue } = useForm()
    const [userMappingInputs, setUserMappingInputs] = useState({})
    const [formErrors, setFormErrors] = useState({})
    const [managerUserLookUp, setManagerUserLookUp] = useState([])
    const roleLookupRef = useRef()
    const [roleLookUp, setRoleLookUp] = useState([])
    const roleDepartmentRef = useRef()

    const userMappingSchema = object({
        userId: string().required().label('User Name'),
        roleId: string().required().label('User Role'),
        parentUserId: string().required().label('Manager Name'),
    })

    const userSearchAPI = `${properties.ROLE_API}/role-manager/search`

    const handleCellRender = (cell, row) => {
        if (["userDetails", "managerDetails", "createdUser"].includes(cell.column.id)) {
            return (<span>{(cell?.value?.firstName ?? '') + " " + (cell?.value?.lastName ?? '')}</span>)
        } else if (["managerRoleDetails", "roleDetails"].includes(cell.column.id)) {
            return (<span>{cell?.value?.roleDesc ?? ''}</span>)
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(cell.value).format('DD MMM YYYY, h:mm a')}</span>)
        } else if (cell.column.id === "statusDescription") {
            return (<>
                {<Switch onChange={(e) => switchChange(row.original.userId)} checked={row.original.statusDescription.code === 'AC' ? true : false} />}
            </>)
        }
        return (<span>{cell.value}</span>)
    }

    const switchChange = (key) => {
        let index = 0
        let obj = {}
        userList.map((user, i) => {
            if (user.userId === key) {
                obj.status = user.status === 'AC' ? 'IN' : 'AC'
                index = i
            }
        })

        setUserList((previousState) => {
            previousState[index]['status'] = (previousState[index]['status'] === 'AC') ? 'IN' : 'AC';

            put(`${properties.USER_API}/map/manager/update-status/${key}`, obj)
                .then((resp) => {
                    if (resp.status === 200) {
                        getUserList()
                        toast.success(resp.message);
                    } else {
                        toast.error("Failed, Please try again");
                    }
                }

                ).catch((error) => {
                    console.log(error)
                })
                .finally();
            return [...previousState];

        })

    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('USER_MANAGER');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };
        fetchData();

        get(`${properties.ROLE_API}`).then((resp) => {
            if (resp.status === 200) {
                roleLookupRef.current = resp.data
            }
        }).catch((error) => { console.error(error) })

        get(`${properties.USER_API}/roles-departments`).then((resp) => {
            if (resp.status === 200) {
                roleDepartmentRef.current = resp.data
            }
        }).catch(error => console.error(error))
    }, [])

    const getUserList = useCallback(() => {
        const requestBody = {
            filters: formFilterObject(filters)
        }
        setListSearch(requestBody);

        post(userSearchAPI + `?limit=${perPage}&pageNo=${currentPage}`, requestBody)
            .then(resp => {
                if (resp?.status === 200) {
                    const { data } = resp;
                    if (data.count.length === 0) {
                        toast.error("Records Not found")
                        setFilters([]);
                    } else {
                        unstable_batchedUpdates(() => {
                            setTotalCount(data.count)
                            setUserList(data.rows)
                        })
                    }
                }
            }).catch((error) => {
                console.error(error)
            }).finally(() => {
                isTableFirstRender.current = false
            })
    }, [currentPage, filters, perPage, userSearchAPI])

    useEffect(() => {
        getUserList()
    }, [getUserList])


    const handleOnClose = () => {
        unstable_batchedUpdates(() => {
            setIsOpen(false)
            setUserMappingInputs({})
            setFormErrors({})
        })
    }

    const handleOnChange = (e) => {
        const { target } = e
        if (target.id === 'userId') {
            userMappingInputs['userName'] = target?.value?.label ?? ''
            userMappingInputs['userId'] = target?.value?.value ?? ''
            userMappingInputs['roleId'] = null
            const roleMappings = target?.selected?.extraInfo?.userDeptRoleMapping ?? [];
            const selectedUserRole = []

            // Create a map for role lookup
            const roleMap = new Map();
            roleLookupRef.current.forEach(role => {
                roleMap.set(role.roleId, role);
            });

            // Iterate over roleMappings
            roleMappings?.forEach(mapping => {
                const roleSet = new Set();

                // Filter department based on unitId
                const department = roleDepartmentRef?.current?.departments?.find(dept => dept?.unitId === mapping?.unitId);

                // Iterate roleId and add to roleSet
                mapping.roleId.forEach(roleId => {
                    const role = roleMap.get(roleId);
                    if (role && !role?.isManagerialRole) {
                        roleSet.add(role);
                    }
                });

                // Convert roleSet to array
                const distinctRoles = Array.from(roleSet);

                // Push entity and roles to selectedUserRole array
                if (distinctRoles && distinctRoles.length > 0) {
                    selectedUserRole.push({ entity: department, roles: distinctRoles });
                }
            });

            setRoleLookUp(selectedUserRole)
        } else if (target.id === 'roleId') {
            const { unitId = "" } = target.value && JSON.parse(target.options[target.selectedIndex].dataset.entity)
            userMappingInputs["departmentId"] = unitId
            userMappingInputs["roleId"] = target.value
            getManagerUserList(unitId, target.value)
        } else {
            userMappingInputs[target.id] = target.value
        }
        unstable_batchedUpdates(() => {
            setUserMappingInputs({ ...userMappingInputs })
            setFormErrors({
                ...formErrors,
                [target.id]: ''
            })
        })
    }

    const getManagerUserList = (department, role) => {
        if (department && role) {
            try {
                get(`${properties.USER_API}/get-manager-list?department=${department}`)
                    .then((resp) => {
                        if (resp.status === 200) {
                            setManagerUserLookUp(resp.data ?? [])
                        }
                    }).catch({
                        error: (error) => { console.error(error) }
                    })
            } catch (error) {
                console.log(error)
                setManagerUserLookUp([])
            }
        }
    }

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

    const onSubmit = async () => {
        const validationResponse = await validateData(userMappingSchema, userMappingInputs)
        if (validationResponse.success) {
            const requestBody = {
                userId: userMappingInputs?.userId ?? null,
                roleId: userMappingInputs?.roleId ?? null,
                parentUserId: userMappingInputs?.parentUserId ?? null
            }
            post(`${properties.USER_API}/map/manager`, requestBody).then((resp) => {
                if (resp.status === 200) {
                    toast.success("Mapping created successfully")
                    handleOnClose()
                    getUserList()
                }
            }).catch((error) => {
                console.error(error)
            })
        }
        else {
            setFormErrors({ ...validationResponse.failure ?? {} });
            toast.error("Please fill the mandatory fields");
        }
    }

    return (
        <div>
            <div className="col-lg-12">
                <div className="card-body">
                    <div className="card">
                        <div className="card-body" id="datatable">
                            {/* && permission.accessType !== "allow" && */}
                            {
                                // !!userList.length &&
                                <DynamicTable
                                    listSearch={listSearch}
                                    listKey={`Admin View ${appsConfig?.clientFacingName?.user ?? "User"} Management`}
                                    row={userList}
                                    isScroll={true}
                                    rowCount={totalCount}
                                    header={UserManagementColumns}
                                    itemsPerPage={perPage}
                                    columnFilter={true}
                                    backendPaging={true}
                                    isTableFirstRender={isTableFirstRender}
                                    hasExternalSearch={hasExternalSearch}
                                    backendCurrentPage={currentPage}
                                    exportBtn={exportBtn}
                                    url={userSearchAPI + `?limit=${totalCount}&page=0`}
                                    method='POST'
                                    handler={{
                                        handleCellRender: handleCellRender,
                                        handlePageSelect: handlePageSelect,
                                        handleItemPerPage: setPerPage,
                                        handleCurrentPage: setCurrentPage,
                                        handleExportButton: setExportBtn,
                                        handleFilters: setFilters
                                    }}
                                    customButtons={(
                                        // disabled={permission.accessType === "allow"}
                                        <button onClick={() => setIsOpen(true)} type="button" className="skel-btn-submit">
                                            Add Mapping {appsConfig?.clientFacingName?.user ?? "User"}
                                        </button>
                                    )}
                                />
                            }
                        </div>
                    </div>
                </div>
            </div >
            <Modal size="lg" aria-labelledby="contained-modal-title-vcenter" centered show={isOpenModal} onHide={handleOnClose} dialogClassName="cust-lg-modal">
                <Modal.Header>
                    <Modal.Title><h5 className="modal-title">Add User Manager Mapping</h5></Modal.Title>
                    <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <div className="mx-2">
                        <Form onSubmit={handleSubmit(onSubmit)}>
                            <div className="clearfix"></div>
                            <div className="row pt-2">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="userId" className="control-label">User Name<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <CustomAsyncSelect
                                            url={`${properties.USER_API}/search?limit=10&page=0`}
                                            id={'userId'}
                                            menuPortalTarget={document.body}
                                            value={{ label: userMappingInputs?.userName ?? '', value: userMappingInputs?.userId ?? '' }}
                                            handleOnChange={handleOnChange}
                                        />
                                        {formErrors?.userId && <span className="errormsg">{formErrors.userId}</span>}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="roleId" className="control-label">User Role<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <select className="form-control" id="roleId" value={userMappingInputs?.roleId ?? ''} onChange={handleOnChange}>
                                            <option value="">Select</option>
                                            {roleLookUp &&
                                                roleLookUp?.map((dept, key) => (
                                                    // console.log('dept', dept)
                                                    <optgroup key={key} label={dept?.entity?.unitDesc}>

                                                        {!!dept.roles.length &&
                                                            dept.roles.map((data, childKey) => (
                                                                <option key={childKey} value={data.roleId} data-entity={JSON.stringify(dept.entity)}>{data.roleDesc}</option>
                                                            ))}
                                                    </optgroup>
                                                ))}
                                        </select>
                                        {formErrors?.roleId && <span className="errormsg">{formErrors.roleId}</span>}
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="parentUserId" className="control-label">Manager name<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <select className="form-control" id="parentUserId" value={userMappingInputs?.parentUserId ?? ''} onChange={(e) => { handleOnChange(e) }}>
                                            <option value="">Select</option>
                                            {managerUserLookUp &&
                                                managerUserLookUp?.map((user, index) => (
                                                    <option key={index} value={user?.userId}>{user?.firstName}</option>
                                                ))}
                                        </select>
                                        {formErrors?.parentUserId && <span className="errormsg">{formErrors.parentUserId}</span>}
                                    </div>
                                </div>
                                {/* <div className="col-md-3">
                                    <div className="form-group">
                                        <label htmlFor="currStatus" className="control-label">Manager Role<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                                        <select className="form-control" id="currStatus" value={userMappingInputs?.currStatus ?? ''} {...register("currStatus", { required: 'This is required' })} onChange={(e) => { handleOnChange(e) }}>
                                            <option value="">Select</option>
                                            {userLookUp &&
                                                userLookUp?.map((user, index) => (
                                                    <option key={index} value={user?.userId}>{user?.firstName}</option>
                                                ))}
                                        </select>
                                        {errors?.currStatus && <span className="errormsg">{errors.currStatus.message}</span>}
                                    </div>
                                </div> */}
                            </div>
                            <div className="col-md-12 pl-2">
                                <div className="form-group pb-1">
                                    <div className="d-flex justify-content-center">
                                        <button type="button" className="skel-btn-cancel" onClick={handleOnClose}>Cancel</button>
                                        <button type="submit" className="skel-btn-submit">Add</button>
                                    </div>
                                </div>
                            </div>
                        </Form>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default UserManagerMapping;

const UserManagementColumns = [
    {
        Header: "User Name",
        accessor: "userDetails",
        id: "userDetails",
        disableFilters: true
    }, {
        Header: "User Role",
        id: "roleDetails",
        accessor: "roleDetails",
        disableFilters: true
    }, {
        Header: "Manager Name",
        id: "managerDetails",
        accessor: "managerDetails",
        disableFilters: true
    },
    {
        Header: "Status",
        id: "statusDescription",
        accessor: "statusDescription.description",
        disableFilters: true
    },
    //  {
    //     Header: "Manager Role",
    //     id: "managerRoleDetails",
    //     accessor: "managerRoleDetails",
    //     disableFilters: true
    // },
    {
        Header: "Created At",
        id: "createdAt",
        accessor: "createdAt",
        disableFilters: true
    }, {
        Header: "Created By",
        id: "createdUser",
        accessor: "createdUser",
        disableFilters: true
    }
]