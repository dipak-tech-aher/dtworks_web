import { v4 as uuidv4 } from 'uuid';


export const InteractionHistoryColumns = [ 
    {
        Header: "#ID",
        accessor: row => {
            return row?.oIntxnNo ?? row?.intxnNo ?? "";
        },
        disableFilters: true,
        id: "oIntxnNo",
       
    },
    {
        Header: "Name",
        accessor: row => {
            return row?.oUserDesc ?? (row?.userId?.firstName ?? '') + ' ' + (row?.userId?.lastName ?? '') ?? "";
        },
        disableFilters: true,
        id: "oUserDesc",
       
    },
    {
        Header: "Category",
        accessor: row => {
            return row?.oIntxnCategory ?? row?.intxnCategoryDesc ?? "";
        },
        disableFilters: true,
        id: "oIntxnCategory",
       
    },
    {
        Header: "Type",
        accessor: row => {
            return row?.oIntxnType ?? row?.intxnTypeDesc ?? "";
        },
        disableFilters: true,
        id: "oIntxnType",
       
    },
    {
        Header: "Service Type",
        accessor: row => {
            return row?.oServiceType ?? row?.serviceTypeDesc ?? "";
        },
        disableFilters: true,
        id: "oServiceType",
       
    },
    {
        Header: "Service Category",
        accessor: row => {
            return row?.oServiceCategory ?? row?.categoryDescription ?? "";
        },
        disableFilters: true,
        id: "oServiceCategory",
       
    },
    {
        Header: "Current User",
        accessor: row => {
            return row?.oCurrUser ?? (row?.currUserDetails?.firstName ?? '') + ' ' + (row?.currUserDetails?.lastName ?? '') ?? "";
        },
        disableFilters: true,
        id: "oCurrUser",
       
    },
    {
        Header: "Status",
        accessor: row => {
            return row?.oIntxnStatus ?? row?.currStatusDesc ?? "";
        },
        disableFilters: true,
        id: "oIntxnStatus",
       
    },
    {
        Header: "Current Dept",
        accessor: row => {
            return row?.oCurrEntity ?? row?.intDepartmentDetails?.unitDesc ?? "";
        },
        disableFilters: true,
        id: "oCurrEntity",
       
    },
    {
        Header: "Current Role",
        accessor: row => {
            return row?.oCurrRole ?? row?.roleDetails?.roleDesc ?? "";
        },
        disableFilters: true,
        id: "oCurrRole",
       
    },
    {
        Header: "Generated At",
        accessor: row => {
            return row?.oCreatedAt ?? row?.createdAt ?? "";
        },
        disableFilters: true,
        id: "oCreatedAt",
       
    }
]

// export const InteractionHistoryColumns = [
//     {
//         Header: "#ID",
//         accessor: "oIntxnId",
//         disableFilters: true,
//         id: "oIntxnId",
//        
//     },
// {
//     Header: "Interaction No",
//     accessor: "oIntxnNo",
//     disableFilters: true,
//     id: "oIntxnNo",
//    
// },
// {
//     Header: "Name",
//     accessor: "oUserDesc",
//     disableFilters: true,
//     id: "oUserDesc",
//    
// },
// {
//     Header: "Category",
//     accessor: "oIntxnCategory",
//     disableFilters: true,
//     id: "oIntxnCategory",
//    
// },
// {
//     Header: "Type",
//     accessor: "oIntxnType",
//     disableFilters: true,
//     id: "oIntxnType",
//    
// },
// {
//     Header: "Service Type",
//     accessor: "oServiceType",
//     disableFilters: true,
//     id: "oServiceType",
//    
// },
// {
//     Header: "Service Category",
//     accessor: "oServiceCategory",
//     disableFilters: true,
//     id: "oServiceCategory",
//    
// },
// {
//     Header: "Current User",
//     accessor: "oCurrUser",
//     disableFilters: true,
//     id: "oCurrUser",
//    
// },
// {
//     Header: "Status",
//     accessor: "oIntxnStatus",
//     disableFilters: true,
//     id: "oIntxnStatus",
//    
// },
// {
//     Header: "Current Dept",
//     accessor: "oCurrEntity",
//     disableFilters: true,
//     id: "oCurrEntity",
//    
// },
// {
//     Header: "Current Role",
//     accessor: "oCurrRole",
//     disableFilters: true,
//     id: "oCurrRole",
//    
// },
// {
//     Header: "Generated At",
//     accessor: "oCreatedAt",
//     disableFilters: true,
//     id: "oCreatedAt",
//    
// }
// ];


export const AssignedOperationsColumns = [
    {
        Header: "",
        accessor: "",
        disableFilters: true,
        id: "aging-color",
       
    },
    {
        Header: "Action",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-ID",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Status",
        accessor: "oIntxnStatusDesc",
        disableFilters: true,
        id: "oIntxnStatusDesc",
        class: "d-flex align-items-center w-100 justify-content-center"
       
    },
    {
        Header: "Priority",
        accessor: "oIntxnSeverityDesc",
        disableFilters: true,
        id: "oIntxnSeverityDesc",
       
    },
    {
        Header: "Type",
        accessor: "oIntxnTypeDesc",
        disableFilters: true,
        id: "oIntxnTypeDesc",
       
    },
    {
        Header: "Category",
        accessor: "oIntxnCategoryDesc",
        disableFilters: true,
        id: "oIntxnCategoryDesc",
       
    },
    {
        Header: "Service Type",
        accessor: "oServiceTypeDesc",
        disableFilters: true,
        id: "oServiceTypeDesc",
       
    },
    {
        Header: "Service Category",
        accessor: "oServiceCategoryDesc",
        disableFilters: true,
        id: "oServiceCategoryDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const PooledInteractionsColumns = [
    {
        Header: "Action",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-ID",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Status",
        accessor: "oIntxnStatusDesc",
        disableFilters: true,
        id: "oIntxnStatusDesc",
        class: "d-flex align-items-center w-100 justify-content-center"
       
    },
    {
        Header: "Type",
        accessor: "oIntxnTypeDesc",
        disableFilters: true,
        id: "oIntxnTypeDesc",
       
    },
    {
        Header: "Category",
        accessor: "oIntxnCategoryDesc",
        disableFilters: true,
        id: "oIntxnCategoryDesc",
       
    },
    {
        Header: "Service Type",
        accessor: "oServiceTypeDesc",
        disableFilters: true,
        id: "oServiceTypeDesc",
       
    },
    {
        Header: "Service Category",
        accessor: "oServiceCategoryDesc",
        disableFilters: true,
        id: "oServiceCategoryDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];
export const AssignedInteractionsColumns = [
    {
        Header: "Action",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-ID",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Status",
        accessor: "oIntxnStatusDesc",
        disableFilters: true,
        id: "oIntxnStatusDesc",
        class: "d-flex align-items-center w-100 justify-content-center"
       
    },
    {
        Header: "Type",
        accessor: "oIntxnTypeDesc",
        disableFilters: true,
        id: "oIntxnTypeDesc",
       
    },
    {
        Header: "Category",
        accessor: "oIntxnCategoryDesc",
        disableFilters: true,
        id: "oIntxnCategoryDesc",
       
    },
    {
        Header: "Service Type",
        accessor: "oServiceTypeDesc",
        disableFilters: true,
        id: "oServiceTypeDesc",
       
    },
    {
        Header: "Service Category",
        accessor: "oServiceCategoryDesc",
        disableFilters: true,
        id: "oServiceCategoryDesc",
       
    },
    {
        Header: "Assigned to",
        accessor: "oCurrUserDesc",
        disableFilters: true,
        id: "oCurrUserDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const PooledOrdersColumns = [
    {
        Header: "Action",
        accessor: "oOrderNo",
        disableFilters: true,
        id: "oOrderNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oOrderNo",
        disableFilters: true,
        id: "oOrderNo-ID",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Status",
        accessor: "oOrderStatusDesc",
        disableFilters: true,
        id: "oOrderStatusDesc",
        class: "d-flex align-items-center"
       
    },
    {
        Header: "Order Category",
        accessor: "oOrderCategoryDesc",
        disableFilters: true,
        id: "oOrderCategoryDesc",
       
    },
    {
        Header: "Order Type",
        accessor: "oOrderTypeDesc",
        disableFilters: true,
        id: "oOrderTypeDesc",
       
    },
    {
        Header: "Service Category",
        accessor: "oServiceCategoryDesc",
        disableFilters: true,
        id: "oServiceCategoryDesc",
       
    },
    {
        Header: "Service Type",
        accessor: "oServiceTypeDesc",
        disableFilters: true,
        id: "oServiceTypeDesc",
       
    },
    {
        Header: "Assigned to",
        accessor: "oCurrUserDesc",
        disableFilters: true,
        id: "oCurrUserDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const AssignedOrdersColumns = [
    {
        Header: "Action",
        accessor: "oOrderNo",
        disableFilters: true,
        id: "oOrderNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oOrderNo",
        disableFilters: true,
        id: "oOrderNo-ID",
       
    },
    {
        Header: "#Child ID",
        accessor: "oChildOrderNo",
        disableFilters: true,
        id: "oChildOrderNo-ID",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Status",
        accessor: "oOrderStatusDesc",
        disableFilters: true,
        id: "oOrderStatusDesc",
       
    },
    {
        Header: "Order Category",
        accessor: "oOrderCategoryDesc",
        disableFilters: true,
        id: "oOrderCategoryDesc",
       
    },
    {
        Header: "Order Type",
        accessor: "oOrderTypeDesc",
        disableFilters: true,
        id: "oOrderTypeDesc",
       
    },
    {
        Header: "Service Category",
        accessor: "oServiceCategoryDesc",
        disableFilters: true,
        id: "oServiceCategoryDesc",
       
    },
    {
        Header: "Service Type",
        accessor: "oServiceTypeDesc",
        disableFilters: true,
        id: "oServiceTypeDesc",
       
    },
    {
        Header: "Assigned to",
        accessor: "oCurrUserDesc",
        disableFilters: true,
        id: "oCurrUserDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

// export const UpcomingAppointmentColumns = [
//     {
//         Header: "#ID",
//         accessor: "oAppointId",
//         disableFilters: true,
//         id: "oAppointId-ID",
//     },
//     {
//         Header: "Name",
//         accessor: "oAppointName",
//         disableFilters: true,
//         id: "oAppointName",
//     },
//     {
//         Header: "Type",
//         accessor: "oAppointType",
//         disableFilters: true,
//         id: "oAppointType",
//     },
//     {
//         Header: "Meeting Point",
//         accessor: "oAppointModeValue",
//         disableFilters: true,
//         id: "oAppointModeValue",
//     },
//     {
//         Header: "Date",
//         accessor: "oAppointDate",
//         disableFilters: true,
//         id: "oAppointDate",
//     },
//     {
//         Header: "Time",
//         accessor: "oAppointStartTime",
//         disableFilters: true,
//         id: "oAppointStartTime",
//     },
//     {
//         Header: "Duration",
//         accessor: "oAppointIntervalDesc",
//         disableFilters: true,
//         id: "oAppointIntervalDesc",
//     },
//     {
//         Header: "Generated At",
//         accessor: "oCreatedAt",
//         disableFilters: true,
//         id: "oCreatedAt",
//     }
// ];

export const UpcomingAppointmentColumns = [
    {
        Header: "#ID",
        accessor: "appointTxnId",
        disableFilters: true,
        id: "appointTxnId-ID",
       
    },
    {
        Header: "Name",
        accessor: "tranCategoryType",
        disableFilters: true,
        id: "tranCategoryType",
       
    },
    {
        Header: "Type",
        accessor: "appointMode",
        disableFilters: true,
        id: "appointMode",
       
    },
    {
        Header: "Meeting Point",
        accessor: "appointModeValue",
        disableFilters: true,
        id: "appointModeValue",
       
    },
    {
        Header: "Date",
        accessor: "appointDate",
        disableFilters: true,
        id: "appointDate",
       
    },
    {
        Header: "Time",
        accessor: "appointStartTime",
        disableFilters: true,
        id: "appointStartTime",
       
    },
    {
        Header: "Duration",
        accessor: "appointStartTime",
        disableFilters: true,
        id: "duration",
       
    },
    {
        Header: "Assigned to",
        accessor: row => `${row.appointAgentDesc?.firstName} ${row.appointAgentDesc?.lastName ?? row.appointAgentDesc?.lastName}`,
        disableFilters: true,
        id: "oCurrUserDesc",
       
    },
    {
        Header: "Generated At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
       
    }
];

export const AssignedTasksColumns = [
    {
        Header: "Stakeholder Name",
        accessor: "leadName",
        disableFilters: true,
        id: "leadName",
    },
    {
        Header: "Task Name",
        accessor: "taskName",
        id: "taskName",
        disableFilters: true,
    },
    {
        Header: "Task Description",
        accessor: "taskDescription",
        id: "taskDescription",
        disableFilters: true,
    },
    {
        Header: "Priority",
        accessor: row => {
            return row?.taskPriority?.description;
        },
        id: "taskPriority",
        disableFilters: true,
    },
    {
        Header: "Status",
        accessor: row => {
            return row?.taskStatus?.description;
        },
        id: "taskStatus",
        disableFilters: true,
    },
    {
        Header: "Assigned",
        accessor: row => {
            let taskAssignedTo = row?.taskAssignedTo;
            return taskAssignedTo ? taskAssignedTo?.fullName : '';
        },
        id: "taskAssignedTo",
        disableFilters: true,
    },
    {
        Header: "Task Created By",
        accessor: row => {
            let taskCreatedBy = row?.taskCreatedBy;
            return taskCreatedBy ? taskCreatedBy?.fullName : '';
        },
        id: "taskCreatedBy",
        disableFilters: true,
    },
    {
        Header: "Created Time",
        accessor: "taskCreatedAt",
        id: "taskCreatedAt",
        disableFilters: true,
    },
    {
        Header: "Due Date",
        accessor: "taskDueDate",
        id: "taskDueDate",
        disableFilters: true,
    }
];
// Ramesh 
export const AssignedHelpdeskColumns = [
    {
        Header: "",
        accessor: "",
        disableFilters: true,
        id: "aging-color",
       
    },
    {
        Header: "Action",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oHelpdeskNo",
        disableFilters: true,
        id: "oHelpdeskNo-ID",
       
    },
    {
        Header: "User Name",
        accessor: "oUserName",
        disableFilters: true,
        id: "oUserName",
       
    },
    {
        Header: "Status",
        accessor: "oStatusDesc",
        disableFilters: true,
        id: "oStatusDesc",
       
    },
    {
        Header: "Channel",
        accessor: "oHelpdeskSource",
        disableFilters: true,
        id: "oHelpdeskSource",
       
    },
    {
        Header: "Severity",
        accessor: "oSeverity",
        disableFilters: true,
        id: "oSeverity",
       
    },
    {
        Header: "Type",
        accessor: "oHelpdeskType",
        disableFilters: true,
        id: "oHelpdeskType",
       
    },
    // {
    //     Header: "Category",
    //     accessor: "oIntxnCategoryDesc",
    //     disableFilters: true,
    //     id: "oIntxnCategoryDesc",
    //    
    // },
    // {
    //     Header: "Service Type",
    //     accessor: "oServiceType",
    //     disableFilters: true,
    //     id: "oServiceType",
    //    
    // },
    // {
    //     Header: "Service Category",
    //     accessor: "oServiceCategory",
    //     disableFilters: true,
    //     id: "oServiceCategory",
    //    
    // },
    {
        Header: "Ageing",
        accessor: "oHelpdeskAge",
        disableFilters: true,
        id: "oAging",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const PooledHelpdesksColumns = [
    {
        Header: "Action",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oHelpdeskNo",
        disableFilters: true,
        id: "oHelpdeskNo-ID",
       
    },
    {
        Header: "User Name",
        accessor: "oUserName",
        disableFilters: true,
        id: "oUserName",
       
    },
    {
        Header: "Status",
        accessor: "oStatusDesc",
        disableFilters: true,
        id: "oStatusDesc",
       
    },
    {
        Header: "Channel",
        accessor: "oHelpdeskSource",
        disableFilters: true,
        id: "oHelpdeskSource",
       
    },
    {
        Header: "Severity",
        accessor: "oSeverity",
        disableFilters: true,
        id: "oSeverity",
       
    },
    {
        Header: "Type",
        accessor: "oHelpdeskType",
        disableFilters: true,
        id: "oHelpdeskType",
       
    },
    {
        Header: "Ageing",
        accessor: "oHelpdeskAge",
        disableFilters: true,
        id: "oAging",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const AssignedHelpdesksColumns = [
    {
        Header: "Action",
        accessor: "oIntxnNo",
        disableFilters: true,
        id: "oIntxnNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oHelpdeskNo",
        disableFilters: true,
        id: "oHelpdeskNo-ID",
       
    },
    {
        Header: "User Name",
        accessor: "oUserName",
        disableFilters: true,
        id: "oUserName",
       
    },
    {
        Header: "Status",
        accessor: "oStatusDesc",
        disableFilters: true,
        id: "oStatusDesc",
       
    },
    {
        Header: "Channel",
        accessor: "oHelpdeskSource",
        disableFilters: true,
        id: "oHelpdeskSource",
       
    },
    {
        Header: "Severity",
        accessor: "oSeverity",
        disableFilters: true,
        id: "oSeverity",
       
    },
    {
        Header: "Type",
        accessor: "oHelpdeskType",
        disableFilters: true,
        id: "oHelpdeskType",
       
    },
    // {
    //     Header: "Category",
    //     accessor: "oIntxnCategoryDesc",
    //     disableFilters: true,
    //     id: "oIntxnCategoryDesc",
    //    
    // },
    // {
    //     Header: "Service Type",
    //     accessor: "oServiceTypeDesc",
    //     disableFilters: true,
    //     id: "oServiceTypeDesc",
    //    
    // },
    // {
    //     Header: "Service Category",
    //     accessor: "oServiceCategoryDesc",
    //     disableFilters: true,
    //     id: "oServiceCategoryDesc",
    //    
    // },
    {
        Header: "Assigned to",
        accessor: "oCurrUser",
        disableFilters: true,
        id: "oCurrUser",
       
    },
    {
        Header: "Ageing",
        accessor: "oHelpdeskAge",
        disableFilters: true,
        id: "oAging",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

export const AssignedTaskColumns = [
    {
        Header: "Action",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oReferenceValue",
        disableFilters: true,
        id: "oReferenceValue",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Task Name",
        accessor: "oTaskName",
        disableFilters: true,
        id: "oTaskName",
       
    },
    
    {
        Header: "Status",
        accessor: "oTaskStatusDesc",
        disableFilters: true,
        id: "oTaskStatusDesc",
       
    },
    {
        Header: "Priority",
        accessor: "oTaskPriority",
        disableFilters: true,
        id: "oTaskPriority",
       
    },
    {
        Header: "Estimated Time",
        accessor: "oEstimatedTime",
        disableFilters: true,
        id: "oEstimatedTime",
       
    },
    {
        Header: "Actual Time",
        accessor: "oActualtime",
        disableFilters: true,
        id: "oActualtime",
       
    },
    {
        Header: "Progress",
        accessor: "oProgress",
        disableFilters: true,
        id: "oProgress",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];
export const PooledTaskColumns = [
    {
        Header: "Action",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oReferenceValue",
        disableFilters: true,
        id: "oReferenceValue",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Task Name",
        accessor: "oTaskName",
        disableFilters: true,
        id: "oTaskName",
       
    },
    
    {
        Header: "Status",
        accessor: "oTaskStatusDesc",
        disableFilters: true,
        id: "oTaskStatusDesc",
       
    },
    {
        Header: "Priority",
        accessor: "oTaskPriority",
        disableFilters: true,
        id: "oTaskPriority",
       
    },
    {
        Header: "Estimated Time",
        accessor: "oEstimatedTime",
        disableFilters: true,
        id: "oEstimatedTime",
       
    },
    {
        Header: "Actual Time",
        accessor: "oActualtime",
        disableFilters: true,
        id: "oActualtime",
       
    },
    {
        Header: "Progress",
        accessor: "oProgress",
        disableFilters: true,
        id: "oProgress",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];
export const AssignedTaskToOtherColumns = [
    {
        Header: "Action",
        accessor: "oNo",
        disableFilters: true,
        id: "oNo-Action",
       
    },
    {
        Header: "#ID",
        accessor: "oReferenceValue",
        disableFilters: true,
        id: "oReferenceValue",
       
    },
    {
        Header: "Name",
        accessor: "oCustomerName",
        disableFilters: true,
        id: "oCustomerName",
       
    },
    {
        Header: "Task Name",
        accessor: "oTaskName",
        disableFilters: true,
        id: "oTaskName",
       
    },
    
    {
        Header: "Status",
        accessor: "oTaskStatusDesc",
        disableFilters: true,
        id: "oTaskStatusDesc",
       
    },
    {
        Header: "Priority",
        accessor: "oTaskPriority",
        disableFilters: true,
        id: "oTaskPriority",
       
    },
    {
        Header: "Estimated Time",
        accessor: "oEstimatedTime",
        disableFilters: true,
        id: "oEstimatedTime",
       
    },
    {
        Header: "Actual Time",
        accessor: "oActualtime",
        disableFilters: true,
        id: "oActualtime",
       
    },
    {
        Header: "Progress",
        accessor: "oProgress",
        disableFilters: true,
        id: "oProgress",
       
    },
    {
        Header: "Generated At",
        accessor: "oCreatedAt",
        disableFilters: true,
        id: "oCreatedAt",
       
    }
];

