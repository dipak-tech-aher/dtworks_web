
export const InteractionListColumns = [
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true,
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true,
    },
    {
        Header: "Service Category",
        accessor: "serviceCategory.description",
        disableFilters: true,
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true,
    },
    {
        Header: "Project",
        accessor: "projectDesc.description",
        disableFilters: true,
    },
    {
        Header: "Helpdesk Number",
        accessor: "helpdeskNo",
        disableFilters: true,
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true,
    },
    {
        Header: "Created Date & Time",
        accessor: "createdAt",
        disableFilters: true,
    },
];

export const HelpdeskListColumns = [
    // {
    //     Header: "Helpdesk ID",
    //     accessor: "helpdeskId",
    //     disableFilters: true
    // },
    {
        Header: "Helpdesk Number",
        accessor: "helpdeskNo",
        disableFilters: true
    },
    {
        Header: "Email",
        accessor: "mailId",
        disableFilters: true
    },
    {
        Header: "Phone Number",
        accessor: "phoneNo",
        disableFilters: true
    },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true
    },
    {
        Header: "Created Date",
        accessor: "createdAt",
        disableFilters: true
    },
    // {
    //     Header: "Created By",
    //     accessor: "createdBy",
    //     disableFilters: true
    // },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true
    },
    // {
    //     Header: "Action",
    //     accessor: "action",
    //     disableFilters: true
    // },
];

export const WorkOrdersListColumns = [
    {
        Header: "Order No",
        accessor: "orderNo",
        disableFilters: true
    },
    {
        Header: "Customer Number",
        accessor: "customerDetails.customerNo",
        disableFilters: true
    },
    {
        Header: "Order Channel",
        accessor: "orderChannel.description",
        disableFilters: true
    },
    {
        Header: "Priority",
        accessor: "orderPriority.description",
        disableFilters: true
    },
    {
        Header: "Source",
        accessor: "orderSource.description",
        disableFilters: true
    },
    {
        Header: "Order Type",
        accessor: "orderType.description",
        disableFilters: true
    },
    {
        Header: "Order Category",
        accessor: "orderCategory.description",
        disableFilters: true
    },
    {
        Header: "Delivery Location",
        accessor: "deliveryLocation",
        disableFilters: true
    },
    {
        Header: "Created Date",
        accessor: "orderDate",
        disableFilters: true
    },
    {
        Header: "Created By",
        accessor: "createdBy",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "orderStatus.description",
        disableFilters: true
    }
];

export const PaymentListColumns = [
    {
        Header: "Contract Id",
        accessor: "contractId",
        disableFilters: false,
        id: "contractId"
    },
    {
        Header: "Status",
        accessor: "status",
        disableFilters: false,
        id: "cstatus"
    },
    {
        Header: "RC",
        accessor: "rcAmount",
        disableFilters: true
    },
    {
        Header: "OTC",
        accessor: "otcAmount",
        disableFilters: true
    },
    {
        Header: "Usage",
        accessor: "usageAmount",
        disableFilters: true
    },
    {
        Header: "Total Charge",
        accessor: "totalCharge",
        disableFilters: true
    },
    {
        Header: "Next Payment",
        accessor: "nextBillPeriod",
        disableFilters: true
    },
    {
        Header: "Advance Payment Allocation",
        accessor: "isAdvanceAllowed",
        disableFilters: true
    }
]

export const FollowUpListColumns = [{
    Header: "Interaction No",
    accessor: "intxnDetails.intxnNo",
    disableFilters: true,
}, {
    Header: "From Entity",
    accessor: "fromEntityName.unitDesc",
    disableFilters: true,
}, {
    Header: "From Role",
    accessor: "fromRoleName.roleDesc",
    disableFilters: true,
}, {
    Header: "From User Name",
    accessor: "fromUserName.fromUser",
    disableFilters: true,
}, {
    Header: "To Entity Name",
    accessor: "toEntityName.unitDesc",
    disableFilters: true,
}, {
    Header: "To Role Name",
    accessor: "toRoleName.roleDesc",
    disableFilters: true,
}, {
    Header: "To User Name",
    accessor: "toUserName.toUser",
    disableFilters: true,
}, {
    Header: "Priority",
    accessor: "priorityCodeDesc.description",
    disableFilters: true,
}, {
    Header: "Remarks",
    accessor: "remarks",
    disableFilters: true,
}, {
    Header: "Created At",
    accessor: "intxnCreatedDate",
    disableFilters: true,
}, {
    Header: "Created By",
    accessor: "flwCreatedby.flwCreatedBy",
    disableFilters: true,
}]

export const HiddenColumns = [
    // 'currStatus'
]
export const Order360PageHelpdeskListColumns = [
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true
    },
    {
        Header: "Customer ID",
        accessor: "userCategoryValue",
        disableFilters: true
    },
    {
        Header: "Customer Name",
        accessor: "userName",
        disableFilters: true
    },
    {
        Header: "Customer Email ID ",
        accessor: "mailId",
        disableFilters: true
    },
    {
        Header: "Customer Contact Number",
        accessor: "phoneNo",
        disableFilters: true
    },
    {
        Header: "Helpdesk Source",
        accessor: "helpdeskSource.description",
        disableFilters: true
    },
    {
        Header: "Helpdesk Status",
        accessor: "status.description",
        disableFilters: true
    },
    {
        Header: "Created Date",
        accessor: "createdAt",
        disableFilters: true
    }
];
export const Order360PageInteractionListColumns = [
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true,
    },
    {
        Header: "Interaction ID",
        accessor: "intxnNo",
        disableFilters: true,
    },
    {
        Header: "Customer ID",
        accessor: "referenceValue",
        disableFilters: true,
    },
    {
        Header: "Customer Name",
        accessor: "customerDetails.firstName",
        disableFilters: true,
    },
    {
        Header: "Customer Email ID",
        accessor: "intxnContact.emailId",
        disableFilters: true,
    },
    {
        Header: "Customer Contact Number",
        accessor: "intxnContact.mobileNo",
        disableFilters: true,
    },
    {
        Header: "Interaction Source",
        accessor: "intxnChannel.description",
        disableFilters: true,
    },
    {
        Header: "Interaction Status",
        accessor: "intxnStatus.description",
        disableFilters: true,
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true,
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true,
    },
    {
        Header: "Created Date",
        accessor: "createdAt",
        disableFilters: true,
    },
    {
        Header: "Created by",
        accessor: "createdBy.firstName",
        disableFilters: true,
    },
    {
        Header: "Subscription ID",
        accessor: "serviceDetails.serviceNo",
        disableFilters: true,
    },
];
//Contract360
export const Contract360PageHelpdeskListColumns = [
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true
    },
    {
        Header: "Customer ID",
        accessor: "userCategoryValue",
        disableFilters: true
    },
    {
        Header: "Full Name",
        accessor: "userName",
        disableFilters: true
    },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true
    },
    {
        Header: "Contact Number",
        accessor: "phoneNo",
        disableFilters: true
    },
    {
        Header: "Email ID ",
        accessor: "mailId",
        disableFilters: true
    },
    {
        Header: "Date",
        accessor: "createdAt",
        disableFilters: true
    }
];
