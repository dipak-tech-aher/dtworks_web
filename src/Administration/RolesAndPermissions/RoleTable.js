import React, { useEffect, useState, useRef } from 'react';
import Modal from 'react-modal';
import { properties } from "../../properties";
import { get, post, put } from "../../common/util/restUtil";
import Switch from "react-switch";
import NewRole from './NewRole';
import UpdateRole from './UpdateRole';
import { toast } from 'react-toastify';
import { RoleTableColumns } from './roleTableColumns';
import DynamicTable from '../../common/table/DynamicTable';
import { formFilterObject, RegularModalCustomStyles } from '../../common/util/util';

const RoleTable = () => {
    const [userPermission, setUserPermission] = useState({ createRole: true, editRole: true, viewRole: true, viewRoleList: true })
    const [display, setDisplay] = useState(false);
    const [update, setUpdate] = useState(false);
    const [data, setData] = useState({});
    const [roleDetails, setroleDetails] = useState([]);
    const [roleCount, setRoleCount] = useState(0);
    const [exportBtn, setExportBtn] = useState(true);
    const [roleFamilies, setRoleFamilies] = useState([]);
    const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);

    useEffect(() => {
        get(properties.ROLE_API + '/role-family')
            .then((resp) => {
                if (resp.data) {
                    // console.log(resp.data);
                    setRoleFamilies(resp.data?.map(x => ({ label: x.roleFamilyName, value: x.roleFamilyId })))
                }
            }).catch((error) => {
                console.log(error)
            })
            .finally()
    }, [])

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    useEffect(() => {
        if (display === false && update === false) {
            const requestBody = {
                filters: formFilterObject(filters)
            }
            // setListSearch(requestBody);
            post(properties.ROLE_API + `?page=${currentPage}&limit=${perPage}`, requestBody).then(resp => {
                if (resp?.data?.count > 0) {
                    let arrayCopy = resp?.data?.rows;
                    arrayCopy.sort(compareBy("roleId"));
                    setroleDetails(arrayCopy);
                    setRoleCount(resp?.data?.count ?? 0)
                }
            }).catch((error) => {
                console.log(error)
            }).finally(() => {
                isTableFirstRender.current = false;
            })
        }
    }, [display, update, perPage, currentPage]);

    const compareBy = (key) => {
        return function (a, b) {
            if (a[key] < b[key]) return -1;
            if (a[key] > b[key]) return 1;
            return 0;
        };
    }

    const sortBy = (key) => {
        let arrayCopy = roleDetails
        arrayCopy.sort(compareBy(key));
        setroleDetails(arrayCopy);
    }

    console.log("rolesDetails", roleDetails)
    console.log("roleCount", roleCount)
    // const switchChange = (key) => {
    //     let array = roleDetails;
    //     array.map((role) => {
    //         if (role.roleId === key) {
    //             if (role["isAdmin"] === true) {
    //                 role["isAdmin"] = false
    //             }
    //             else {
    //                 role["isAdmin"] = true
    //             }
    //         }
    //     })
    //     setroleDetails([...array])
    // };

    const switchChange = (key) => {
        const roleTempDetails = structuredClone(roleDetails)
        let index = roleTempDetails.findIndex(x => x.roleId == key);
        roleTempDetails[index]['status'] = roleTempDetails[index]['status'] === 'AC' ? 'IN' : 'AC';

        // setroleDetails([...roleDetails]);

        let obj = roleTempDetails[index];
        delete obj.roleFamily;

        // toast.dismiss("role_update_toast");

        let success = true;
        put(properties.ROLE_API + "/update/" + key, obj).then((resp) => {
            success = (resp.status === 200);
        }).catch((err) => {
            success = false;
        }).finally(e => {
            toast[success ? "success" : "error"](success ? 'Role status updated' : 'Error while updating role');
            if (!success) {
                roleDetails[index]['status'] = roleTempDetails[index]['status'] === 'AC' ? 'IN' : 'AC';
                setroleDetails([...roleDetails]);
            } else {
                roleDetails[index]['status'] = roleTempDetails[index]['status']
                setroleDetails([...roleDetails]);
            }
        });
    };

    const handleSubmit = (role, id) => {
        setData(role);
        setUpdate(true)
    }

    const all = (arr, fn = Boolean) => arr.every(fn);

    const handleCellRender = (cell, row) => {
        if (cell.column.id === "status") {
            return (<Switch onChange={(e) => switchChange(row.original.roleId)} checked={row?.original?.status === 'AC' ? true : false} />)

        }
        else
            if (cell.column.Header === "Edit Role") {
                return (
                    <button type="button" className="skel-btn-submit" onClick={(e) => handleSubmit(row.original, row.original.roleId)}><span><i className="mdi mdi-file-document-edit-outline font20"></i></span> Edit</button>
                )
            }
            else {
                return (<span>{cell.value}</span>)
            }
    }
    return (
        <>
            {(display) ?

                <Modal style={RegularModalCustomStyles} isOpen={display}>
                    <NewRole
                        setDisplay={setDisplay}
                        roleFamilies={roleFamilies}
                    />
                    {/* <button className="close-btn" onClick={() => setDisplay(false)} >&times;</button> */}
                </Modal>
                : <></>}

            <div className="col-lg-12">
                <div>
                    <div className="card-body">
                        <div className="card">
                            <div className="card-body" id="datatable">
                                {roleDetails?.length > 0 &&
                                    <DynamicTable
                                        listKey={"Admin View User-Roles Setup"}
                                        row={roleDetails ?? []}
                                        rowCount={roleCount ?? 0}
                                        header={RoleTableColumns}
                                        itemsPerPage={10}
                                        exportBtn={exportBtn}
                                        backendPaging={true}
                                        isTableFirstRender={isTableFirstRender}
                                        hasExternalSearch={hasExternalSearch}
                                        backendCurrentPage={currentPage}
                                        handler={{
                                            handleCellRender: handleCellRender,
                                            handleExportButton: setExportBtn,
                                            handleFilters: setFilters,
                                            handlePageSelect: handlePageSelect,
                                            handleItemPerPage: setPerPage,
                                            handleCurrentPage: setCurrentPage,
                                        }}
                                        customButtons={(
                                            <button type="button" className="skel-btn-submit" onClick={() => setDisplay(true)}>
                                                Create Role
                                            </button>
                                        )}
                                    />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div >
            {(update === true) && (
                <UpdateRole
                    Data={data}
                    setUpdate={setUpdate}
                    isOpen={update}
                    roleFamilies={roleFamilies}
                />
            )}
        </>

    )
}


export default RoleTable;