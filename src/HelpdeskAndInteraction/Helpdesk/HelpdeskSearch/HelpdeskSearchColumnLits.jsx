export const HelpdeskSearchColumns = [
    // {
    //     Header: "Helpdesk ID",
    //     accessor: "helpdeskId",
    //     disableFilters: true,
    //     click: true,
    //     id: "helpdeskId",

    // },
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true,
        click: true,
        id: "helpdeskNo",
    },
    {
        Header: "Profile ID",
        accessor: "customerDetails.profileNo",
        click: true,
        disableFilters: true,
        id: "profileNumber"
    },
    {
        Header: "Full Name",
        accessor: row => row?.customerDetails?.firstName ? (row?.customerDetails?.firstName || "") + " " + (row?.customerDetails?.lastName || "") : row?.userName ?? '',
        disableFilters: true,
        id: "fullName"
    },
    // {
    //     Header: "ID Type",
    //     accessor: "customerDetails.idType.description",
    //     disableFilters: true,
    //     id: 'idType'
    // },
    // {
    //     Header: "ID Value",
    //     accessor: "customerDetails.idValue",
    //     disableFilters: true,
    //     id: 'idValue'
    // },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true,
        id: "source"
    },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true,
        id: "status"
    },
    {
        Header: "Source Reference",
        accessor: "mailId",
        disableFilters: true,
        id: "sourceReference"
    },

   
    // {
    //     Header: "Customer Type",
    //     accessor: "customerDetails.profileCategory.description",
    //     disableFilters: true,
    //     id: "customerType"
    // },
    {
        Header: "Contact Number",
        accessor: "customerDetails.contactDetails.mobileNo",
        disableFilters: true,
        id: "customerNumber"
    },
    {
        Header: "Email",
        accessor: "customerDetails.contactDetails.emailId",
        disableFilters: true,
        id: "email"
    },
    // {
    //     Header: "Contact Preference",
    //     accessor: "customerDetails.contactPreferences.description",
    //     disableFilters: true,
    //     id: 'contactPreference'
    // },
    // {
    //     Header: "Action",
    //     accessor: "",
    //     disableFilters: true,
    //     id: "action"
    // }
    {
        Header: "Created Date",
        accessor: "createdAt",
        disableFilters: true
    }
]

export const HelpdeskHistoryColumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true
    },
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskId",
        disableFilters: true,
        click: true,
        id: "helpdeskId",
    },
    {
        Header: "Customer Name",
        accessor: "contactDetails[0].customerDetails[0].firstName",
        disableFilters: true,
        id: "customerName"
    },
    {
        Header: "Interaction Type",
        accessor: "interactionDetails[0].srType.description",
        disableFilters: true,
        id: 'interactionType'
    },
    {
        Header: "Problem Type",
        accessor: "interactionDetails[0].problemTypeDescription.description",
        disableFilters: true,
        id: 'problemType'
    },
    {
        Header: "Channel Source",
        accessor: "source",
        disableFilters: true,
        id: 'Channel Source'
    },
    {
        Header: "Status",
        accessor: "interactionDetails[0].currStatusDesc.description",
        disableFilters: true,
        id: 'currStatus'
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true,
        id: 'createdAt'
    },
    {
        Header: "Closed On",
        accessor: "updatedAt",
        disableFilters: true,
        id: 'closedAt'
    },

]

export const HelpdesHistoryListColumns = [
    {
        Header: "Action",
        accessor: "action",
        disableFilters: true
    },
    {
        Header: "Helpdesk ID",
        accessor: "helpdeskNo",
        disableFilters: true,
        click: true,
        id: "helpdeskNo",
    },
    {
        Header: "Profile ID",
        accessor: "customerDetails.profileNo",
        disableFilters: true,
        id: "profileNumber"
    }, {
        Header: "Full Name",
        accessor: row => row?.customerDetails?.firstName ? (row?.customerDetails?.firstName || "") + " " + (row?.customerDetails?.lastName || "") : row?.userName ?? '',
        disableFilters: true,
        id: "fullName"
    }, {
        Header: "Helpdesk Type",
        accessor: "helpdeskType.description",
        disableFilters: true,
        id: "helpdeskType"
    }, {
        Header: "Helpdesk Subject",
        accessor: "helpdeskSubject",
        disableFilters: true,
        id: "helpdeskSubject"
    },
    // {
    //     Header: "Contact Number",
    //     accessor: "customerDetails.contactDetails.mobileNo",
    //     disableFilters: true,
    //     id: "customerNumber"
    // }, {
    //     Header: "Email",
    //     accessor: "customerDetails.contactDetails.emailId",
    //     disableFilters: true,
    //     id: "email"
    // },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true,
        id: "source"
    },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true,
        id: "status"
    },
    {
        Header: "Source Reference",
        accessor: "mailId",
        disableFilters: true,
        id: "sourceReference"
    },


    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true,
        id: 'createdAt'
    },
]