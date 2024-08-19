export const FCRMISColumns = [
    {
        Header: "S. No",
        accessor: "sNo",
        disableFilters: true,
        id: "sNo"
    },
    {
        Header: "Operation Unit",
        accessor: "operationUnit",
        disableFilters: true,
        id: "operationUnit"
    },
    {
        Header: "Department",
        accessor: "department",
        disableFilters: true,
        id: "department"
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType",
        disableFilters: true,
        id: "intxnType"
    },
    {
        Header: "Total Interaction",
        accessor: "totalInteraction",
        disableFilters: true,
        id: "totalInteraction",
        class:'text-center'
    },
    {
        Header: "FCR Compliance",
        accessor: "fcrComplaince",
        disableFilters: true,
        id: "fcrComplaince",
        class:'text-center'
    },
    {
        Header: "FCR Non Compliance",
        accessor: "fcrNonComplaince",
        disableFilters: true,
        id: "fcrNonComplaince",
        class:'text-center'
    },
    {
        Header: "FCR%",
        accessor: "fcrPercentage",
        disableFilters: true,
        id: "fcrPercentage"
    }
]

export const FCRMISHiddenColumns = [
    'guid'
]