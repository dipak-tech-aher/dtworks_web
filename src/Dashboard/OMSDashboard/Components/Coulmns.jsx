import { v4 as uuidv4 } from 'uuid';

export const TotalCustomersColumns = [
    {
        Header: "Customer Number",
        accessor: "customerId",
        disableFilters: true,
        id: "oCustomerNo",
        uid: uuidv4()
    },
    // {
    //     Header: "Account Id",
    //     accessor: "accountId",
    //     disableFilters: true,
    //     id: "oAccountId",
    //     uid: uuidv4()
    // },
    {
        Header: "Customer Name",
        accessor: "customerName",
        disableFilters: true,
        id: "oCustomerName",
        uid: uuidv4()
    },
    {
        Header: "Customer Type",
        accessor: "customerType",
        disableFilters: true,
        id: "oCustomerType",
        uid: uuidv4()
    },
    {
        Header: "Primary Contact Number",
        accessor: "mobileNo",
        disableFilters: true,
        id: "oPrimaryContactNumber",
        uid: uuidv4()
    },
    {
        Header: "Customer Email",
        accessor: "emailId",
        disableFilters: true,
        id: "oCustomerEmail",
        uid: uuidv4()
    },
    {
        Header: "Customer Status",
        accessor: "status",
        disableFilters: true,
        id: "oCustomerStatus",
        uid: uuidv4()
    },
    {
        Header: "Created By",
        accessor: "createdBy",
        disableFilters: true,
        id: "oCreatedBy",
        uid: uuidv4()
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
        uid: uuidv4()
    },
    {
        Header: "Updated By",
        accessor: "updatedBy",
        disableFilters: true,
        id: "oUpdatedBy",
        uid: uuidv4()
    },
    {
        Header: "Updated At",
        accessor: "updatedAt",
        disableFilters: true,
        id: "updatedAt",
        uid: uuidv4()
    },
]