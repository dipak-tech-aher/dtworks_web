export const FollowupCountColumns = [{
    Header: "S. No.",
    accessor: "sNo",
    disableFilters: true,
    id: "row"
}, {
    Header: "Operation Unit",
    accessor: "operationUnit",
    disableFilters: true,
    id: "operationUnit"
}, {
    Header: "Department",
    accessor: "department",
    disableFilters: true,
    id: "department"
}, {
    Header: "Count",
    accessor: "flwUpCount",
    disableFilters: true,
    id: "flwUpCount"
}]
export const FollowupCountInteractionColumns = [
    {
        Header: "Interaction ID",
        accessor: "intxn_id",
        disableFilters: true,
        id: "intxn_id"
    },
    {
        Header: "Operational Unit",
        accessor: "operational_unit",
        disableFilters: true,
        id: "operational_unit"
    },
    {
        Header: "Entity",
        accessor: "department",
        disableFilters: false,
        id: "department"
    }

]
