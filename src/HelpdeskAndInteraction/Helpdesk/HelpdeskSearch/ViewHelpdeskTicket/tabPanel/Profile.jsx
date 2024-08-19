import React, { useCallback, useEffect, useRef, useState } from 'react'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { RegularModalCustomStyles } from '../../../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';
import Modal from 'react-modal';
import DynamicTable from '../../../../../common/table/DynamicTable';
import { HelpdeskColumns } from '../Columns';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useHistory }from '../../../../../common/util/history';

export default function Profile(props) {
    const history = useHistory()

    let customerDetails = props.data?.detailedViewItem?.customerDetails;
    const [helpdeskSummary, setHelpdeskSummary] = useState({ closed: 0, open: 0, total: 0 })
    const [list, SetList] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [status, setStatus] = useState('')
    useEffect(() => {
        if (customerDetails?.profileNo) {
            getHelpdeskData(customerDetails?.profileNo)
        }
    }, [customerDetails?.profileNo])
    const getHelpdeskData = useCallback((id) => {
        const requestBody = {
            "searchParams": {
                "profileNo": customerDetails?.profileNo,
                "mode": "COUNT",
            }
        };
        post(`${properties.HELPDESK_API}/profile-wise/helpdesk-summary`, requestBody)
            .then((response) => {
                const { status, data } = response;
                console.log(response)
                if (status === 200) {
                    props?.handler?.setExportData?.('summary_data',data)
                    setHelpdeskSummary(data)
                }

            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, []);
    const FetchHelpdeskList = async () => {
        try {
            const requestBody = {
                "searchParams": {
                    "profileNo": customerDetails?.profileNo,
                    "mode": "LIST",
                    "status": status,
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
                            setIsOpen(true)
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
    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }
    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Helpdesk Number") {
            return (<span className="text-secondary cursor-pointer" title={row?.original?.helpdeskSubject ?? ''} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        }else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const redirectToRespectivePages = () => {
        const data = {
            ...customerDetails,
            sourceName: 'view-helpdesk-ticket'
        }
        localStorage.setItem("profileUuid", customerDetails.profileUuid)
        localStorage.setItem("profileIds", customerDetails.profileId)
        localStorage.setItem("profileNo", customerDetails.profileNo)
        history(`/view-profile`, { state: {data} })
    }
    const HelpdeskToggle = (count, type) => {
        if (!count) {
            toast.warn('No records found')
            return
        }
        setStatus(type);
    }
    useEffect(() => {
        if (status) {
            FetchHelpdeskList()
        }
    }, [status, perPage, currentPage])
    const onClose = () => {
        unstable_batchedUpdates(() => {
            SetList([])
            setTotalCount(0)
            setIsOpen(!isOpen)
            setCurrentPage(0)
            setPerPage(10)
            setStatus('')
        })
    }
    return (
        <div className="view-int-details-key skel-tbl-details">
            <table className="table-responsive dt-responsive nowrap w-100">
                <tbody>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Profile ID</span>
                        </td>
                        <td width="5%">:</td>
                        <td>
                            <a className="txt-underline text-secondary" onClick={() => redirectToRespectivePages()}>
                                {customerDetails?.profileNo}
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Full Name</span>
                        </td>
                        <td width="5%">:</td>
                        <td>{customerDetails ? `${customerDetails.firstName ?? ""} ${customerDetails.lastName ?? ""}` : ' '}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">
                                Contact Number
                            </span>
                        </td>
                        <td width="5%">:</td>
                        <td>{customerDetails && customerDetails.contactDetails && Object.values(customerDetails.contactDetails).length > 0 ? `+${customerDetails?.contactDetails?.mobilePrefix ?? ""} ${customerDetails?.contactDetails?.mobileNo ?? ""}` : ' '}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Email</span>
                        </td>
                        <td width="5%">:</td>
                        <td>{customerDetails?.contactDetails?.emailId ? `${customerDetails?.contactDetails?.emailId ?? ""}` : '-'}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">
                                Contact Preference
                            </span>
                        </td>
                        <td width="5%">:</td>
                        <td>{customerDetails
                            ?.contactPreferences
                            ? customerDetails?.contactPreferences?.filter(val => val !== null).map(
                                (e) => {
                                    return " " + e.description;
                                }
                            )
                            : ""}</td>
                    </tr>
                </tbody>
            </table>
            <div className="skel-inter-view-history">
                <span className="skel-header-title">
                    Helpdesk Summary
                </span>
                <div className="skel-tot-inter">
                    <div className="skel-tot">
                        Total
                        <span>
                            <a
                                onClick={() => HelpdeskToggle(helpdeskSummary.total ?? 0, 'ALL')}
                            >
                                {helpdeskSummary.total || 0}
                            </a>
                        </span>
                    </div>
                    <div className="skel-tot">
                        Open
                        <span>
                            <a
                                onClick={() => HelpdeskToggle(helpdeskSummary.open ?? 0, 'Open')}
                                data-toggle="modal"
                                data-target="#skel-view-modal-interactions"
                            >
                                {helpdeskSummary.open || 0}
                            </a>
                        </span>
                    </div>
                    <div className="skel-tot">
                        Closed
                        <span>
                            <a
                                onClick={() => HelpdeskToggle(helpdeskSummary.closed ?? 0, 'Closed')}
                                data-toggle="modal"
                                data-target="#skel-view-modal-interactions"
                            >
                                {helpdeskSummary.closed || 0}
                            </a>
                        </span>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isOpen}
                contentLabel="View Followup Modal"
                style={RegularModalCustomStyles}
            >
                <div className="modal-header">
                    <h4 className="modal-title"> Helpdesk List</h4>
                    <button type="button" className="close" onClick={() => onClose()}>×</button>
                </div>
                <DynamicTable
                    listKey={"Helpdesk Summary"}
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
            </Modal>
        </div>
    )
}
