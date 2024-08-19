export const SLASearchColumns = [{
    Header: "Action",
    accessor: "Action",
    disableFilters: true,
    id: "Action"
},
{
    Header: "SLA Code",
    accessor: "slaCode",
    disableFilters: true,
    id: "slaCode"
}, {
    Header: "SLA Name",
    accessor: "slaName",
    disableFilters: true,
    id: "slaName"
}, {
    Header: "Type",
    accessor: "slaType.description",
    disableFilters: true,
    id: "slaType"
},
//  {
//     Header: "Description",
//     accessor: "description",
//     disableFilters: true,
//     id: "description"
// }, 
{
    Header: "Status",
    accessor: "status.code",
    disableFilters: true,
    id: "status"
}, {
    Header: "Created Date",
    accessor: "createdAt",
    disableFilters: true
},
{
    Header: "Created By",
    accessor: "createdBy.firstName",
    disableFilters: true
}]

export const SLASearchMappingColumns = [{
    Header: "Action",
    accessor: "Action",
    disableFilters: true,
    id: "Action"
},{
    Header: "Template Name",
    accessor: "templateName",
    disableFilters: true,
    id: "templateName"
}, {
    Header: "SLA Mapping No",
    accessor: "slaMappingNo",
    disableFilters: true,
    id: "slaMappingNo"
}, {
    Header: "SLA Name",
    accessor: "slaDetails.slaName",
    disableFilters: true,
    id: "slaName"
}, {
    Header: "Status",
    accessor: "status.description",
    disableFilters: true,
    id: "status"
}, {
    Header: "Created Date",
    accessor: "createdAt",
    disableFilters: true
},
{
    Header: "Created By",
    accessor: "createdBy.fullName",
    disableFilters: true
}]