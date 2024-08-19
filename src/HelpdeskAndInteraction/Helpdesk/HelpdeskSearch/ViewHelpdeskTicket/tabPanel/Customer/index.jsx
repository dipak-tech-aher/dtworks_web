import React, { useCallback, useEffect, useRef, useState } from 'react'
import { properties } from '../../../../../../properties';
import { post, slowPost } from '../../../../../../common/util/restUtil';
import { unstable_batchedUpdates } from 'react-dom';
import { toast } from 'react-toastify';
import { RegularModalCustomStyles } from '../../../../../../common/util/util';
import DynamicTable from '../../../../../../common/table/DynamicTable';
import { InteractionHistoryColumns } from '../../Columns';
import moment from 'moment';
import Modal from 'react-modal';
import OrderList from './OrderList';
import ServiceList from './ServiceList';
import { useHistory } from '../../../../../../common/util/history';

export default function Customer(props) {
    const history = useHistory()
    console.log("in customer tab", props.data?.detailedViewItem)
    let detailedViewItem = props.data?.detailedViewItem;
    let customerDetails = detailedViewItem?.customerDetails;
    const contactDetails = customerDetails?.contactDetails ? customerDetails?.contactDetails : customerDetails?.customerContact?.[0]
    const [InteractionSummary, setInteractionSummary] = useState({ closed: 0, open: 0, total: 0 });
    const [list, SetList] = useState([])
    const [isOpen, setIsOpen] = useState(false)
    const [Type, setType] = useState('')
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const tableRef = useRef(true);
    const [filters, setFilters] = useState([]);
    const consumerUuid = customerDetails?.profileUuid ? customerDetails?.profileUuid : customerDetails?.customerUuid
    const consumerId = customerDetails?.profileId ? customerDetails?.profileId : customerDetails?.customerId
    useEffect(() => {
        if (consumerId) {
            getInteractionSummaryData(consumerId)
        }
    }, [consumerId])

    const SummaryAPI = `${properties.INTERACTION_API}/customer-wise/interaction-summary`
    const getInteractionSummaryData = useCallback((id) => {
        const requestBody = {
            "searchParams": {
                "cust_id": consumerId,
                "mode": "COUNT",
            }
        };
        post(SummaryAPI, requestBody)
            .then((response) => {
                const { status, data } = response;
                if (status === 200) {
                    props?.handler?.setExportData?.('summary_data', data)
                    setInteractionSummary(data)
                }

            })
            .catch((error) => {
                console.error(error);
            })
            .finally();
    }, []);
    const FetchInteractionList = async () => {
        try {
            const requestBody = {
                "searchParams": {
                    "cust_id": consumerId,
                    "mode": "LIST",
                    "status": Type,
                    'limit': perPage,
                    page: currentPage
                }
            };
            post(SummaryAPI, requestBody)
                .then((response) => {
                    const { status, data = {} } = response;
                    if (status === 200) {
                        unstable_batchedUpdates(() => {
                            SetList(data.rows || [])
                            setTotalCount(data?.count ?? 0)
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
    const handleCellRender = (cell, row) => {
        if (cell.column.id === "oNo-Action") {
            return (
                <>
                    <div className="skel-action-btn">
                        <div title="Edit" className="action-edit"><i className="material-icons">edit</i></div>
                        <div title="View" className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                </>
            )
        } else if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>)
        }
        return (<span>{cell.value}</span>)
    }
    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }
    useEffect(() => {
        if (Type) {
            FetchInteractionList()
        }
    }, [Type, perPage, currentPage])
    const InteractionToggle = (count, type) => {
        if (!count) {
            toast.warn('No records found')
            return
        }
        setType(type);
    }
    const handleOnCellActionsOrLink = () => {
        if (customerDetails?.profileNo || customerDetails?.customerNo) {
            const { accountUuid } = customerDetails;
            localStorage.setItem("customerUuid", consumerUuid)
            localStorage.setItem("accountUuid", accountUuid)
            const data = {
                ...customerDetails,
                sourceName: 'helpdesk360'
            }
            history(`/view-customer`, { state: { data } })
        }
    }
    return (
        <div className="view-int-details-key skel-tbl-details">
            <table className="table-responsive dt-responsive nowrap w-100">
                <tbody>
                    <tr>
                        <td>
                            <span className="font-weight-bold">
                                Customer ID
                            </span>
                        </td>
                        <td width="5%">:</td>
                        <td>
                            <span onClick={() => handleOnCellActionsOrLink()} className={customerDetails?.profileNo || customerDetails?.customerNo ? `txt-underline cursor-pointer` : ''}>
                                {customerDetails?.profileNo ? customerDetails?.profileNo : customerDetails?.customerNo ?? 'N/A'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Full Name</span>
                        </td>
                        <td width="5%">:</td>
                        <td>{customerDetails?.firstName ? `${customerDetails.firstName ?? ""} ${customerDetails.lastName ?? ""}` : detailedViewItem?.userName ?? ''}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">
                                Contact Number
                            </span>
                        </td>
                        <td width="5%">:</td>
                        <td>{contactDetails && Object.values(contactDetails).length > 0 ? `+${contactDetails?.mobilePrefix ?? ""} ${contactDetails?.mobileNo ?? ""}` : detailedViewItem?.phoneNo ?? 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Email</span>
                        </td>
                        <td width="5%">:</td>
                        <td>{contactDetails?.emailId ? `${contactDetails?.emailId ?? ""}` : detailedViewItem?.mailId ?? 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>
                            <span className="font-weight-bold">Status</span>
                        </td>
                        <td width="5%">:</td>
                        <td className={`status-${customerDetails?.statusDesc ? customerDetails?.statusDesc?.description.toLowerCase() : customerDetails?.status?.description.toLowerCase()} ml-1`}>{customerDetails?.statusDesc ? `${customerDetails?.statusDesc?.description ?? "N/A"}` : customerDetails?.status?.description ?? "N/A"}</td>
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
                            ? customerDetails?.contactPreferences.map(
                                (e) => {
                                    return " " + e.description;
                                }
                            )
                            : "N/A"}</td>
                    </tr>
                </tbody>
            </table>
            <div className="skel-inter-view-history">
                <span className="skel-header-title">
                    Interaction Details
                </span>
                <div className="skel-tot-inter">
                    <div className="skel-tot">
                        Total
                        <span>
                            <a
                                data-toggle="modal"
                                data-target="#skel-view-modal-interactions"
                                onClick={() => InteractionToggle(InteractionSummary.total, 'ALL')}
                            >
                                {InteractionSummary.total || 0}
                            </a>
                        </span>
                    </div>
                    <div className="skel-tot">
                        Open
                        <span>
                            <a
                                data-toggle="modal"
                                data-target="#skel-view-modal-interactions"
                                onClick={() => InteractionToggle(InteractionSummary.open, 'NEW')}
                            >
                                {InteractionSummary.open || 0}
                            </a>
                        </span>
                    </div>
                    <div className="skel-tot">
                        Closed
                        <span>
                            <a
                                data-toggle="modal"
                                data-target="#skel-view-modal-interactions"
                                onClick={() => InteractionToggle(InteractionSummary.closed, 'CLOSED')}
                            >
                                {InteractionSummary.closed || 0}
                            </a>
                        </span>
                    </div>
                    <Modal
                        isOpen={isOpen}
                        contentLabel="View Interaction"
                        style={RegularModalCustomStyles}
                    >
                        <div className="modal-header">
                            <h4 className="modal-title">Interaction List</h4>
                            <button type="button" className="close" onClick={() => { setIsOpen(!isOpen); setType('') }}>×</button>
                        </div>
                        <DynamicTable
                            listKey={"Interaction Summary"}
                            row={list}
                            rowCount={totalCount}
                            header={InteractionHistoryColumns}
                            fixedHeader={true}
                            columnFilter={false}
                            customClassName={'table-sticky-header'}
                            itemsPerPage={perPage}
                            isScroll={false}
                            backendPaging={true}
                            isTableFirstRender={tableRef}
                            backendCurrentPage={currentPage}
                            searchParams={{
                                "searchParams": {
                                    "cust_id": customerDetails?.profileId,
                                    "mode": "LIST",
                                    "status": Type,
                                    'limit': perPage,
                                    page: currentPage
                                }
                            }}
                            url={SummaryAPI}
                            method='POST'
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
                <div className="mt-3">
                    <table className="table table-hover mb-0 table-centered table-nowrap text-center">
                        <thead>
                            <tr>
                                <th scope="col">Total Service</th>
                                <th scope="col">Total Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <ServiceList data={customerDetails} />
                                <OrderList data={customerDetails} />
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
