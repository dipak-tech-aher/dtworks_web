
import { v4 as uuidv4 } from 'uuid';
export const HelpdeskColumns = [
    {
        Header: "Helpdesk Number",
        accessor: "helpdeskNo",
        disableFilters: true,
        id: "helpdeskNo",
        uid: uuidv4()
    },
    {
        Header: "Current User",
        accessor: row => {
           return `${row?.assignedAgentDetailsFirstName??''} ${row?.assignedAgentDetailsLastName??''}`
        },
        disableFilters: true,
        id: "currUser",
        uid: uuidv4()
    },
    {
        Header: "Status",
        accessor: "statusDescDescription",
        disableFilters: true,
        id: "status",
        uid: uuidv4()
    },
    {
        Header: "Channel",
        accessor: "helpdeskSourceDescDescription",
        disableFilters: true,
        id: "helpdeskSource",
        uid: uuidv4()
    },
    {
        Header: "Severity",
        accessor: "severityDescDescription",
        disableFilters: true,
        id: "severity",
        uid: uuidv4()
    },
    {
        Header: "Type",
        accessor: "helpdeskTypeDescDescription",
        disableFilters: true,
        id: "helpdeskType",
        uid: uuidv4()
    },
    {
        Header: "Created By",
        accessor: "userName",
        disableFilters: true,
        id: "userName",
        uid: uuidv4()
    },
    {
        Header: "Generated At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
        uid: uuidv4()
    }
];

export const InteractionHistoryColumns = [
    {
        Header: "#ID",
        accessor: "intxnId",
        disableFilters: true,
        id: "intxnId",
        uid: uuidv4()
    },
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
        id: "intxnNo",
        uid: uuidv4()
    },
    {
        Header: "Category",
        accessor: "intxnCategoryDescDescription",
        disableFilters: true,
        id: "intxnCategoryDescDescription",
        uid: uuidv4()
    },
    {
        Header: "Type",
        accessor: "srTypeDescription",
        disableFilters: true,
        id: "srTypeDescription",
        uid: uuidv4()
    },
    {
        Header: "Service Type",
        accessor: "serviceTypeDescDescription",
        disableFilters: true,
        id: "serviceTypeDescDescription",
        uid: uuidv4()
    },
    {
        Header: "Service Category",
        accessor: "categoryDescriptionDescription",
        disableFilters: true,
        id: "categoryDescriptionDescription",
        uid: uuidv4()
    },
    {
        Header: "Status",
        accessor: "currStatusDescDescription",
        disableFilters: true,
        id: "currStatusDescDescription",
        uid: uuidv4()
    },
    {
        Header: "Generated At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
        uid: uuidv4()
    }
];
export const AssignedOrdersColumns = [
    {
        Header: "#ID",
        accessor: "orderNo",
        disableFilters: true,
        id: "oOrderNo-ID",
        uid: uuidv4()
    },
    {
        Header: "#Child ID",
        accessor: "childOrder",
        disableFilters: true,
        id: "oChildOrderNo-ID",
        uid: uuidv4()
    },
    {
        Header: "Name",
        accessor: "orderDescription",
        disableFilters: true,
        id: "orderDescription",
        uid: uuidv4()
    },
    {
        Header: "Status",
        accessor: "orderStatus",
        disableFilters: true,
        id: "oOrderStatusDesc",
        uid: uuidv4()
    },
    {
        Header: "Order Category",
        accessor: "orderCategory",
        disableFilters: true,
        id: "oOrderCategoryDesc",
        uid: uuidv4()
    },
    {
        Header: "Order Type",
        accessor: "orderType",
        disableFilters: true,
        id: "oOrderTypeDesc",
        uid: uuidv4()
    },
    // {
    //     Header: "Service Type",
    //     accessor: "serviceType",
    //     disableFilters: true,
    //     id: "oServiceTypeDesc",
    //     uid: uuidv4()
    // },
    {
        Header: "Assigned to",
        accessor: row => {
            return `${row?.currUserInfo?.firstName} ${row?.currUserInfo?.lastName??''}`
        },
        disableFilters: true,
        id: "oCurrUserDesc",
        uid: uuidv4()
    },
    {
        Header: "Generated At",
        accessor: "orderDate",
        disableFilters: true,
        id: "oCreatedAt",
        uid: uuidv4()
    }
];

export const ServiceColumns = [
    {
        Header: "ID",
        accessor: "serviceNo",
        disableFilters: true,
        id: "serviceNo",
        uid: uuidv4()
    },
    {
        Header: "Name",
        accessor: "serviceName",
        disableFilters: true,
        id: "serviceName",
        uid: uuidv4()
    },
    {
        Header: "Status",
        accessor: "srvcTypeDesc",
        disableFilters: true,
        id: "oOrderStatusDesc",
        uid: uuidv4()
    },
    {
        Header: "Service Category",
        accessor: "srvcCatDesc",
        disableFilters: true,
        id: "srvcCatDesc",
        uid: uuidv4()
    }
];