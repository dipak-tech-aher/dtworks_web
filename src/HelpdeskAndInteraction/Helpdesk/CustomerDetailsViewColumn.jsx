export const CustomerDetailsViewColumns = [
    {
        Header: "Interaction Number",
        accessor: "intxnNo",
        disableFilters: true
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true
    },
    {
        Header: "Tech Completion",
        accessor: row => {
            return row.techCompletionDate;
        },
        disableFilters: true
    },
    {
        Header: "DB Completion",
        accessor: row => {
            // console.log(row);
            return row.dbCompletionDate;
        },
        disableFilters: true
    },
    // {
    //     Header: "QA Completion",
    //     accessor: row => {
    //         return row.qaCompletionDate;
    //     },
    //     disableFilters: true
    // },
    // {
    //     Header: "BI Completion",
    //     accessor: row => {
    //         return row.biCompletionDate;
    //     },
    //     disableFilters: true
    // },
    {
        Header: "Deployment Completion",
        accessor: row => {
            return row.deployementDate;
        },
        disableFilters: true
    },
    // {
    //     Header: "About",
    //     accessor: "intxnCause.description",
    //     disableFilters: true
    // },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Updated On",
        accessor: "updatedAt",
        disableFilters: true
    }
]

export const CustomerDetailsInteractionViewColumns = [
    {
        Header: "Interaction Number",
        accessor: "intxnNo",
        disableFilters: true
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Updated On",
        accessor: "updatedAt",
        disableFilters: true
    }
]