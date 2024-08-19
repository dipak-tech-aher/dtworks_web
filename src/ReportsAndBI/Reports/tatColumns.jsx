export const TATColumns = [
    {
        Header: "Date Range",
        accessor: "data_rnge",
        disableFilters: true,
        id: "data_rnge"
    },
    {
        Header: "counts",
        accessor: "counts",
        disableFilters: true,
        id: "counts"
    },
    {
        Header: "Percentage",
        accessor: "percentage",
        disableFilters: true,
        id: "percentage"
    },
    {
        Header: "Total Count",
        accessor: "tot_cnt",
        disableFilters: true,
        id: "tot_cnt"
    },
    {
        Header: "Minimum Value",
        accessor: "min_value",
        disableFilters: true,
        id: "min_value"
    },
    {
        Header: "Average",
        accessor: "average",
        disableFilters: true,
        id: "average"
    },
    {
        Header: "Total",
        accessor: "tot",
        disableFilters: true,
        id: "tot"
    },
    {
        Header: "Order Sequence",
        accessor: "order_seq",
        disableFilters: true,
        id: "order_seq"
    }

]

export const TATHiddenColumns = [
    'order_seq'
]
export const TATReportSummary = [{
    Header: "Day Range",
    accessor: "dayRange",
    disableFilters: true,
    id: "dayRange"
}, {
    Header: "Interaction Created",
    accessor: "intxnCreatedCnt",
    disableFilters: true,
    id: "intxnCreatedCnt"
}, {
    Header: "Interaction Closed",
    accessor: "intxnClosedCnt",
    disableFilters: true,
    id: "intxnClosedCnt"
}, {
    Header: "TAT %",
    accessor: "tatPercentage",
    disableFilters: true,
    id: "tatPercentage",
    type: 'percentage',
    format: 0
}]