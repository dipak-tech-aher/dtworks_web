export const UserManagementColumns = [
    {
        Header: "Edit",
        accessor: "action",
        disableFilters: true,
        id: "editUser",
    },
    {
        Header: "Id",
        accessor: "userId",
        disableFilters: false,
        id: "userId",
    },
    {
        Header: "First Name",
        accessor: "firstName",
        disableFilters: false,
        id: "firstName",
    },
    {
        Header: "Last Name",
        accessor: "lastName",
        disableFilters: false,
        id: "lastName",
    },
    {
        Header: "Email Id",
        accessor: "email",
        disableFilters: false,
        id: "email",
    },
    {
        Header: "Contact No",
        accessor: "contactNo",
        disableFilters: false,
        id: "contactNo",
    },
    {
        Header: "Type",
        accessor: "userTypeDesc.description",
        disableFilters: false,
        id: "userType",
    },
    {
        Header: "Status",
        accessor: "status",
        disableFilters: true,
        id: "userStatus"
    },
   
    // {
    //     Header: "Map Roles",
    //     accessor: "action1",
    //     disableFilters: true
    // }
];

export const RoleTableHiddenColumns = [
    'Status Code'
];