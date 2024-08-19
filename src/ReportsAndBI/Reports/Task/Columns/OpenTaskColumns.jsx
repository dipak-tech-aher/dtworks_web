const openTaskColumns = [
   {
        Header: "Stakeholder Name",
        accessor: "leadName",
        disableFilters: true,
        id: "leadName"
    }, {
        Header: "Mission Name",
        accessor: "missionName",
        disableFilters: true,
        id: "missionName"
    }, {
        Header: "Task Name",
        accessor: "taskName",
        disableFilters: true,
        id: "taskName"
    }, {
        Header: "Task Description",
        accessor: "taskDescription",
        disableFilters: true,
        id: "taskDescription"
    }, {
        Header: "Priority",
        accessor: "priority",
        disableFilters: true,
        id: "priority"
    }, {
        Header: "Assigned To",
        accessor: "assignedTo",
        disableFilters: true,
        id: "assignedTo"
    }, {
        Header: "Due Date ",
        accessor: "dueDate",
        disableFilters: true,
        id: "dueDate"
    }, {
        Header: "Status",
        accessor: "status",
        disableFilters: true,
        id: "status"
    }, {
        Header: "Tags",
        accessor: "tags",
        disableFilters: true,
        id: "tags"
    }, {
        Header: "Created By",
        accessor: "createdBy",
        disableFilters: true,
        id: "createdBy"
    }, {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
        type:'taskDate',
        id: "createdAt"
    }
]

export default openTaskColumns;
