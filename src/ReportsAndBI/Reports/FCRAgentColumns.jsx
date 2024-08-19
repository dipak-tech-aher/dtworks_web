export const FCRAgentColumns = [
    {
        Header: "S. No",
        accessor: "sNo",
        disableFilters: true,
        id: "sNo"
    },
    {
        Header: "Agent ID",
        accessor: "agentId",
        disableFilters: true,
        id: "agentId"
    },
    // {
    //     Header: "Agent Name",
    //     accessor: "agentName",
    //     disableFilters: true,
    //     id: "agentName"
    // },
    {
        Header: "Total Interaction",
        accessor: "totalInteraction",
        disableFilters: true,
        id: "totalInteraction",
        class:'text-center'
    },
    {
        Header: "FCR Complaince",
        accessor: "fcrComplaince",
        disableFilters: true,
        id: "fcrComplaince",
        class:'text-center'
    },
    {
        Header: "FCR Non-Complaince",
        accessor: "fcrNonComplaince",
        disableFilters: true,
        id: "fcrNonComplaince",
        class:'text-center'
    },
    {
        Header: "FCR%",
        accessor: "fcrPercentage",
        disableFilters: true,
        id: "fcrPercentage",
    },
    
]

export const FCRAgentHiddenColumns = []
