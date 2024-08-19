import React, { useEffect, useState } from 'react'
import { get, post } from '../../../common/util/restUtil';
import { useHistory }from '../../../common/util/history';
import { formatISODateTime } from '../../../common/util/dateUtil';
import DynamicTable from '../../../common/table/DynamicTable';
import { properties } from '../../../properties';
import { toast } from 'react-toastify';
import AddFollowUp from '../../Interaction/InteractionAction/components/Modal/AddFollowup';
import InteractionFlowHistory from '../../Interaction/InteractionAction/components/Modal/InteractionFlowHistory';

export default function InteractionTab(props) {
    const [interactions, setInteractions] = useState([])
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [lookupData, setlookupData] = useState({ current: {} });
    const [totalCount, setTotalCount] = useState();
    const [interactionDetails, setinteractionDetails] = useState()
    const [isModelOpen, setIsModelOpen] = useState({ isWorkflowHistoryOpen: false, isAddFollowUpOpen: false })
    const history = useHistory()
    useEffect(() => {

        if (props?.consumerNo) {
            post(`${properties?.INTERACTION_API}/search?limit=${perPage}&page=${currentPage}`,
                { searchParams: { profileNo: props?.consumerNo } })
                .then((resp) => {
                    if (resp && resp?.data) {
                        setTotalCount(resp?.data?.count)
                        setInteractions(resp?.data?.rows)

                    } else {
                        toast.error("Failed to fetch complaints - " + resp?.status);
                    }
                }).catch((error) => {
                    console.error(error)
                })
        }
    }, [currentPage, perPage]);

    useEffect(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY")
            .then((resp) => {
                if (resp.data) {
                    setlookupData({ current: resp.data })
                } else {
                    setlookupData({ current: {} })
                }
            })
            .catch((error) => {
                console.error(error);
            })
    }, []);
    const onHandleModalClose = (data) => {
        setinteractionDetails()
    }
    const redirectToInteractionPage = (data) => {
        history(`/interaction360`, { state: {data: { intxnNo: data?.intxnNo, intxnUuid: data?.intxnUuid, intxnId: data?.intxnId }} })
    }
    const handleCellLinkClick = (rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Interaction No") {
            return (<span className="text-secondary cursor-pointer" onClick={() => redirectToInteractionPage(cell?.row?.original)}>{cell.value}</span>)
        } else if (cell.column.Header === "Helpdesk No") {
            return (<span className="text-secondary cursor-pointer" onClick={() => handleCellLinkClick(cell?.row?.original)}>{cell.value}</span>)
        }
        else if (cell?.column?.Header === "Created Date & Time") {
            return (<span>{formatISODateTime(cell?.value)}</span>)
        }
        else if (cell?.column?.Header === "Created By") {
            return (<span>{row?.original?.createdBy?.firstName + " " + row?.original?.createdBy?.lastName}</span>)
        } else if (cell.column.id === "Action") {
            return (
                <div className="skel-action-btn">
                    <div title="Add Follow-up" onClick={() => { setinteractionDetails(row.original); setIsModelOpen({ ...isModelOpen, isAddFollowUpOpen: true }) }} className="action-edit"><i className="material-icons">edit</i></div>
                    <div title="View-History" className="action-view" onClick={() => { setinteractionDetails(row.original); setIsModelOpen({ ...isModelOpen, isWorkflowHistoryOpen: true }) }} data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                </div>
                // <div className='d-flex'>
                //     <button type="button" className="skel-btn-submit" onClick={() => setinteractionDetails(row.original)}>Add Follow-up</button>
                //     <button type="button" className="skel-btn-submit" onClick={() => setinteractionDetails(row.original)}>View History</button>
                // </div>
            )
        }
        else {
            return (<span>{!cell?.value ? '-' : cell?.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    return (
        <>
            <DynamicTable
                row={interactions}
                rowCount={totalCount}
                itemsPerPage={perPage}
                backendPaging={true}
                columnFilter={false}
                backendCurrentPage={currentPage}
                header={InteractionListColumns}
                handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handlePageSelect,
                    handleItemPerPage: setPerPage,
                    handleCurrentPage: setCurrentPage,
                }}
            />
            <AddFollowUp
                stateHandlers={{ setIsModelOpen }}
                data={{
                    isModelOpen,
                    lookupData,
                    interactionDetails
                }}
            />
            <InteractionFlowHistory
                stateHandlers={{ setIsModelOpen }}
                data={{
                    isModelOpen,
                    lookupData,
                    interactionDetails
                }}
            />

        </>
    );
}
const InteractionListColumns = [
    {
        Header: "Action",
        accessor: "createdAt",
        disableFilters: true,
        id: "Action",
    },
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
    },
    {
        Header: "Helpdesk No",
        accessor: "helpdeskNo",
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
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true,
    },

    {
        Header: "Channel",
        accessor: "intxnChannel.description",
        disableFilters: true,
    },
    {
        Header: "Created Date & Time",
        accessor: "createdAt",
        disableFilters: true,
    }
];