import React, { useEffect, useRef, useState } from 'react'
import { useHistory }from '../../../common/util/history';
import { get, post } from '../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import DynamicTable from '../../../common/table/DynamicTable';
import { v4 as uuidv4 } from 'uuid';
import { properties } from '../../../properties';
import moment from 'moment';
import { RegularModalCustomStyles } from '../../../common/util/util';
import { toast } from 'react-toastify';
import Modal from 'react-modal';
import { Markup } from 'interweave';
import { statusConstantCode } from '../../../AppConstants';
export default function HelpdeskTab(props) {
    const history = useHistory()
    // console.log(props.consumerNo)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState([]);
    const [list, SetList] = useState([])
    const [followUplist, SetfollowUplist] = useState([])
    const tableRef = useRef(true);
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [IsViewFollowup, setIsViewFollowup] = useState(false);
    const [followupInputs, setFollowupInputs] = useState({
        priority: "",
        source: "",
        remarks: "",
    });
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [sourceLookup, setSourceLookup] = useState([]);
    useEffect(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY")
            .then((resp) => {
                if (resp.data) {
                    setSourceLookup(resp.data["TICKET_SOURCE"]);
                    setPriorityLookup(resp.data["FOLLOWUP_PRIORITY"]);
                } else {
                    // toast.error("Error while fetching address details");
                }
            })
            .catch((error) => {
                console.error(error);
            })
    }, []);
    useEffect(() => {
        if (props?.consumerNo) {
            FetchHelpdeskList()
        }
    }, [perPage, currentPage])

    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk No") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        } else if (cell.column.id === "Action") {
            return (
                <div className="skel-action-btn">
                    <div title="Add Follow-up" onClick={() => setIsFollowupOpen(cell?.row?.original?.helpdeskNo)} className="action-edit"><i className="material-icons">edit</i></div>
                    <div title="View-Follow-up" onClick={() => setIsViewFollowup(cell?.row?.original?.helpdeskId)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                </div>
                // <div className='d-flex'>
                //     <button type="button" className="skel-btn-submit" onClick={() => setIsFollowupOpen(cell?.row?.original?.helpdeskNo)}>Add Follow-up</button>
                //     <button type="button" className="skel-btn-submit" onClick={() => setIsViewFollowup(cell?.row?.original?.helpdeskId)}>View Follow-up</button>
                // </div>
            )
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        else if (cell.column.id === "Escalate") {
            return (<div className="form-group row justify-content-center">
                <div className="custom-control custom-checkbox">
                    <input type="checkbox" className="custom-control-input" id="proceedChecks" checked={cell?.value === "Escalated"} onChange={() => { }} />
                    <label className="custom-control-label" htmlFor="proceedChecks"></label>
                </div>
            </div>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    const FetchHelpdeskList = async () => {
        try {
            const requestBody = {
                "searchParams": {
                    "profileNo": props?.consumerNo,
                    "mode": "LIST",
                    "status": 'ALL',
                    'limit': perPage,
                    "page": currentPage
                }
            };
            post(`${properties.HELPDESK_API}/profile-wise/helpdesk-summary`, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetList(data?.rows || [])
                            setTotalCount(data?.count || [])
                        })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();
        } catch (e) {
            console.log('error', e)
        }
    }
    const handleOnAddFollowup = (e) => {
        e.preventDefault();
        const { priority, source, remarks } = followupInputs;
        if (!priority || !source || !remarks) {
            toast.error("Please provide mandatory fields");
            return;
        }
        let payload = {
            priorityCode: priority,
            source,
            remarks,
            helpdeskNo: isFollowupOpen,
            is_followup: 'Y',
            channel:statusConstantCode.businessEntity.WEB
        };

        post(`${properties.HELPDESK_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    unstable_batchedUpdates(() => {
                        setIsFollowupOpen(false);
                        setFollowupInputs({
                            priority: "",
                            source: "",
                            remarks: "",
                        });
                    })

                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    };
    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({
            ...followupInputs,
            [target.id]: target.value,
        });
    };
    const getFlowUpList = () => {
        try {
            get(`${properties.HELPDESK_API}/get/followup?helpdeskId=${IsViewFollowup}&getFollowUp=true`)
                .then((response) => {
                    if (response?.status === 200) {
                        SetfollowUplist(response?.data?.rows)
                    } else {
                        SetfollowUplist([])
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (IsViewFollowup) getFlowUpList();
    }, [IsViewFollowup])
    const IsOpen = Boolean(isFollowupOpen), FollowUpOpn = Boolean(IsViewFollowup);

    return (
        <>
            <DynamicTable
                listKey={"Helpdesk List"}
                row={list}
                rowCount={totalCount}
                header={HelpdeskColumns}
                fixedHeader={true}
                columnFilter={false}
                customClassName={'table-sticky-header'}
                itemsPerPage={perPage}
                isScroll={false}
                backendPaging={true}
                isTableFirstRender={tableRef}
                backendCurrentPage={currentPage}
                handler={{
                    handleCellRender: handleCellRender,
                    handlePageSelect: handlePageSelect,
                    handleItemPerPage: setPerPage,
                    handleCurrentPage: setCurrentPage,
                    handleFilters: setFilters
                }}
            />

            <Modal
                isOpen={IsOpen}
                contentLabel="Followup Modal"
                style={RegularModalCustomStyles}
            >
                <div
                    className="modal-center"
                    id="cancelModal"
                    tabIndex="-1"
                    role="dialog"
                    aria-labelledby="cancelModal"
                    aria-hidden="true"
                >
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title" id="cancelModal">
                                    Followup for Helpdesk No {isFollowupOpen}
                                </h5>
                                <button
                                    type="button"
                                    className="close"
                                    data-dismiss="modal"
                                    aria-label="Close"
                                    onClick={() => { setIsFollowupOpen(false); setFollowupInputs({}) }}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="row pt-3">
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="priority" className="col-form-label">
                                                FollowUp Priority{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                value={followupInputs?.priority ?? ''}
                                                id="priority"
                                                className="form-control"
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="priority" value="">
                                                    Select Priority
                                                </option>
                                                {priorityLookup &&
                                                    priorityLookup.map((e) => (
                                                        <option key={e.code} value={e?.code}>
                                                            {e?.description}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="form-group">
                                            <label htmlFor="source" className="col-form-label">
                                                Source{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                required
                                                id="source"
                                                className="form-control"
                                                value={followupInputs?.source ?? ''}
                                                onChange={handleOnFollowupInputsChange}
                                            >
                                                <option key="source" value="">
                                                    Select Source
                                                </option>
                                                {sourceLookup &&
                                                    sourceLookup.map((e) => (
                                                        <option key={e.code} value={e.code}>
                                                            {e.description}
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-12 ">
                                        <div className="form-group ">
                                            <label
                                                htmlFor="inputState"
                                                className="col-form-label pt-0"
                                            >
                                                Remarks{" "}
                                                <span className="text-danger font-20 pl-1 fld-imp">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                required
                                                className="form-control"
                                                maxLength="2500"
                                                id="remarks"
                                                value={followupInputs?.remarks ?? ''}
                                                onChange={handleOnFollowupInputsChange}
                                                name="remarks"
                                                rows="4"
                                            ></textarea>
                                            <span>Maximum 2500 characters</span>
                                        </div>
                                    </div>
                                    <div className="col-md-12 pl-2">
                                        <div className="form-group pb-1">
                                            <div className="d-flex justify-content-center">
                                                <button
                                                    type="button"
                                                    className="skel-btn-cancel"
                                                    onClick={() => { setIsFollowupOpen(false); setFollowupInputs({}) }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="skel-btn-submit"
                                                    onClick={handleOnAddFollowup}
                                                >
                                                    Submit
                                                </button>

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal >
            <Modal
                isOpen={FollowUpOpn}
                contentLabel="View Followup Modal"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title">FollowUp History</h4>
                    <button type="button" className="close" onClick={() => setIsViewFollowup(false)}>×</button>
                </div>
                {(followUplist?.length) ? <>
                    {followUplist.map((ele, idx) => {
                        return (
                            <>

                            <div className="timeline-workflow">
                            <ul>
                                {/* {followUpHistory?.count > 0 && followUpHistory?.rows.map((data) => ( */}
                                    <li>
                                        <div className="content">
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Created By</label>
                                                        <span className="data-cnt">
                                                        {ele?.updatedByDetails?.firstName ?? ''} {ele?.updatedByDetails?.lastName ?? ''}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-md-8">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Comments</label>
                                                        <span className="data-cnt"><Markup content={ele?.helpdeskContent} /></span>
                                                    </div>
                                                </div>
                                                <div className="col-md-8">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Channel</label>
                                                        <span className="data-cnt">{ele?.channelDesc?.description ?? '-'}</span>
                                                    </div>
                                                </div>
                                                {/* <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Servicetype" className="control-label">To Department/Role</label>
                                                        <span className="data-cnt">-</span>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-group">
                                                        <label htmlFor="Channel" className="control-label">User</label>
                                                        <span className="data-cnt">-</span>
                                                    </div>
                                                </div> */}
                                            </div>
                                            
                                            {/* <div className="row">
                                                <div className="col-md-12">
                                                    <div className="form-group">
                                                        <label htmlFor="Interactiontype" className="control-label">Comments</label>
                                                        <span className="data-cnt"><Markup content={ele?.helpdeskContent} /></span>
                                                    </div>
                                                </div>
                                            </div> */}
                                        </div>
                                        <div className="time"><h4> {moment(ele?.updatedAt).format('YYYY-MM-DD HH:mm A')}</h4></div>
                                    </li>
                                {/* ))} */}
                            </ul>
                        </div>
                                {/* <div key={idx} className="skel-transcript-conversation">
                                    <div className="form-vtext skel-form-vtext">
                                        <div className='row'>
                                            <div className='col'>
                                                <b>By: </b> {ele?.updatedByDetails?.firstName ?? ''} {ele?.updatedByDetails?.lastName ?? ''}
                                            </div>
                                            <div className='col-4 text-right'>
                                                <div className="badge badge-pill badge-success">
                                                    {moment(ele?.updatedAt).format('YYYY-MM-DD HH:mm A')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-vtext skel-form-vtext">
                                        <p><b>Comments: </b> <Markup content={ele?.helpdeskContent} /> </p>
                                    </div>
                                </div> */}
                            </>
                        );
                    })}</> : <span className="skel-widget-warning">
                    No records available yet
                </span>}
            </Modal>
        </>
    )
}
const HelpdeskColumns = [
    {
        Header: "Action",
        accessor: "createdAt",
        disableFilters: true,
        id: "Action",
        uid: uuidv4()
    },
    {
        Header: "Helpdesk No",
        accessor: "helpdeskNo",
        disableFilters: true,
        id: "helpdeskNo",
        uid: uuidv4()
    },
    /****Srini made changes for helpdesk category and commented due to functionality yet to confirm 3-Mar-2024 ***/
    // {
    //     Header: "Helpdesk Category",
    //     accessor: "helpdeskCategoryDescDescription",
    //     disableFilters: true,
    //     id: "helpdeskCategory",
    //     uid: uuidv4()
    // },
    {
        Header: "Helpdesk Type",
        accessor: "helpdeskTypeDescDescription",
        disableFilters: true,
        id: "helpdeskType",
        uid: uuidv4()
    },
    {
        Header: "Helpdesk Subject",
        accessor: "helpdeskSubject",
        disableFilters: true,
        id: "helpdeskSubject",
        uid: uuidv4()
    },

    {
        Header: "Source",
        accessor: "helpdeskSourceDescDescription",
        disableFilters: true,
        id: "helpdeskSource",
        uid: uuidv4()
    },
    {
        Header: "Status",
        accessor: "statusDescDescription",
        disableFilters: true,
        id: "status",
        uid: uuidv4()
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt",
        uid: uuidv4()
    },
    {
        Header: "Escalated",
        accessor: "statusDescDescription",
        disableFilters: true,
        id: "Escalate",
        uid: uuidv4()
    }
]
