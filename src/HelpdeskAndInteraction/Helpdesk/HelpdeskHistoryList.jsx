import React, { useCallback, useEffect, useRef, useState } from 'react';

import moment from 'moment';
import { unstable_batchedUpdates } from 'react-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import DynamicTable from '../../common/table/DynamicTable';
import { get, post } from '../../common/util/restUtil';
import { RegularModalCustomStyles } from '../../common/util/util';
import { properties } from '../../properties';
import { HelpdesHistoryListColumns } from './HelpdeskSearch/HelpdeskSearchColumnLits';
import { statusConstantCode } from '../../AppConstants';
import { useNavigate } from "react-router-dom";

const HelpdeskHistoryList = (props) => {
    const { profileNo } = props.data
    const [helpdeskHistoryList, setHelpdeskHistoryList] = useState([]);
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState('0');
    const [filters, setFilters] = useState([]);
    const [exportBtn, setExportBtn] = useState(false)
    const [listSearch, setListSearch] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [helpdeskDetails, setHelpdeskDetails] = useState();
    const [followupInputs, setFollowupInputs] = useState({
        priority: "",
        source: "",
        remarks: "",
    })
    const [priorityLookup, setPriorityLookup] = useState([]);
    const [sourceLookup, setSourceLookup] = useState([]);
    const isFirstRender = useRef(true);
    let history = useNavigate();

    const getMasterList = useCallback(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=TICKET_SOURCE,FOLLOWUP_PRIORITY")
            .then((resp) => {
                if (resp.data) {
                    setSourceLookup(resp.data["TICKET_SOURCE"]);
                    setPriorityLookup(resp.data["FOLLOWUP_PRIORITY"]);
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, [])

    const getHelpdeskHistory = useCallback(() => {
        if (profileNo) {
            const requestBody = { userCategoryValue: profileNo, contain: ['CUSTOMER'] }
            setListSearch(requestBody);
            post(`${properties.HELPDESK_API}/search?limit=${perPage}&page=${Number(currentPage)}`, requestBody)
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200) {
                        setHelpdeskHistoryList(data?.rows)
                        setTotalCount(data?.count || 0)
                    }
                })
                .catch(error => {
                    console.error(error);
                })
                .finally(() => { isTableFirstRender.current = false })
        }

    }, [currentPage, perPage, profileNo])

    useEffect(() => {
        if (!isFirstRender.current) {
            getHelpdeskHistory();
        } else {
            isFirstRender.current = false
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        }
    }, [currentPage, getHelpdeskHistory, perPage])

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Full Name") {
            return (
                <span>{`${cell?.row?.original?.customerDetails?.firstName || ''} ${cell?.row?.original?.customerDetails?.lastName || ''}`}</span>
            )
        } 
        // else if (cell.column.Header === "Helpdesk ID") {
        //     return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        // }
        else if (['Created On', 'Closed On'].includes(cell.column.Header)) {
            return (<span>{cell.value ? moment(cell.value).format('DD MMM YYYY hh:mm:ss A') : '-'}</span>)
        }
        else if (cell.column.Header === "Action") {
            console.log(cell?.row?.original?.status?.code, [statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(cell?.row?.original?.status?.code))
            return (
                <button type="button" className="skel-btn-submit" disabled={[statusConstantCode.status.HELPDESK_CLOSED, statusConstantCode.status.HELPDESK_CANCEL, statusConstantCode.status.HELPDESK_ESCALATED].includes(cell?.row?.original?.status?.code)} onClick={() => handleOnView(row.original)}>Follow-up</button>
            )
        }
        else {
            return (<span>{cell.value || ''}</span>)
        }
    }

    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleOnView = (row) => {
        unstable_batchedUpdates(() => {
            setIsFollowupOpen(true)
            setHelpdeskDetails(row)
        })
    }

    const handleOnFollowupInputsChange = (e) => {
        const { target } = e;
        setFollowupInputs({
            ...followupInputs,
            [target.id]: target.value,
        });
    };

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
            helpdeskNo: helpdeskDetails?.helpdeskNo,
            is_followup: 'Y',
            channel:statusConstantCode.businessEntity.WEB
        };

        post(`${properties.HELPDESK_API}/followUp`, { ...payload })
            .then((response) => {
                if (response?.status === 200) {
                    toast.success("Follow Up Created Successfully");
                    setIsFollowupOpen(false);
                    setFollowupInputs({
                        priority: "",
                        source: "",
                        remarks: "",
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    };

    useEffect(() => {
        getMasterList()
    }, [getMasterList])

    return (
        <>
            {!!helpdeskHistoryList?.length ?
                <DynamicTable
                    listKey={"Helpdesk History"}
                    row={helpdeskHistoryList}
                    header={HelpdesHistoryListColumns}
                    rowCount={totalCount}
                    listSearch={listSearch}
                    itemsPerPage={perPage}
                    backendPaging={true}
                    columnFilter={true}
                    backendCurrentPage={currentPage}
                    isTableFirstRender={isTableFirstRender}
                    hasExternalSearch={hasExternalSearch}
                    exportBtn={exportBtn}
                    handler={{
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters,
                        handleExportButton: setExportBtn
                    }}
                />
                :
                <span className="msg-txt pt-1">No Heldesk History Available</span>}
            {
                <Modal isOpen={isFollowupOpen} contentLabel="Followup Modal" style={RegularModalCustomStyles}>
                    <div
                        className="modal-center" id="cancelModal" tabIndex="-1" role="dialog" aria-labelledby="cancelModal" aria-hidden="true">
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="cancelModal">
                                        Followup for Helpdesk No {helpdeskDetails?.helpdeskNo}
                                    </h5>
                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close" onClick={() => setIsFollowupOpen(false)}><span aria-hidden="true">&times;</span>
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
                                                    value={followupInputs.priority}
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
                                                    value={followupInputs.source}
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
                                                    value={followupInputs.remarks}
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
                                                    <button type="button" className="skel-btn-cancel" onClick={() => setIsFollowupOpen(false)}>
                                                        Cancel
                                                    </button>
                                                    <button type="button" className="skel-btn-submit" onClick={handleOnAddFollowup}>Submit</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            }
        </>
    )
}

export default HelpdeskHistoryList;