import { isEmpty } from "lodash"
import moment from "moment"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { CloseButton, Modal } from "react-bootstrap"
import { unstable_batchedUpdates } from "react-dom"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { statusConstantCode } from "../../../../../AppConstants"
import DynamicTable from "../../../../../common/table/DynamicTable"
import { getFullName } from "../../../../../common/util/commonUtils"
import { get, post } from "../../../../../common/util/restUtil"
import { properties } from "../../../../../properties"
import HelpdeskList from "../Modal/HelpdeskList"
import OrderList from "../Modal/OrderList"
import ServiceList from "../Modal/ServiceList"

const CustomerInformation = (props) => {
    let history = useNavigate()
    const { interactionDetails, isPublicService, appConfig } = props?.data
    const { handleOnClick } = props?.stateHandlers
    const { customerDetails = {}, customerUid: customerUuid } = interactionDetails
    let { customerContact = {} } = customerDetails
    const [interactionHistoryCount, setInteractionHistoryCount] = useState({ open: 0, closed: 0, total: 0 })
    const [interactionHistoryDetails, setInteractionHistoryDetails] = useState({ count: 0, rows: [] })

    const [currentPageModal, setCurrentPageModal] = useState(0);
    const [perPageModal, setPerPageModal] = useState(10);
    const [isInteractionModelOpen, setIsInteractionModelOpen] = useState(false)
    const isFirstRender = useRef(true);
    const [modelType, setModalType] = useState()

    const [helpdeskHistoryCount, setHelpdeskHistoryCount] = useState({ open: 0, closed: 0, total: 0 })
    const [helpdeskHistoryDetails, setHelpdeskHistoryDetails] = useState({ count: 0, rows: [] })
    const [currentPage, setCurrentPage] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [isHelpdeskModelOpen, setIsHelpdeskModelOpen] = useState(false)
    const isHelpdeskFirstRender = useRef(true);
    const [helpdeskModelType, setHelpdeskModalType] = useState()

    const [serviceCount, setServiceCount] = useState(0)
    const [serviceCurrentPage, setServiceCurrentPage] = useState(0)
    const [servicePerPage, setServicePerPage] = useState(10)
    const [serviceHistoryDetails, setServiceHistoryDetails] = useState({ count: 0, rows: [] })
    const [isServiceModelOpen, setIsServiceModelOpen] = useState(false)
    const isServiceFirstRender = useRef(true);

    const [orderCount, setOrderCount] = useState(0)
    const [orderHistoryDetails, setOrderHistoryDetails] = useState({ count: 0, rows: [] })
    const [orderCurrentPage, setOrderCurrentPage] = useState(0)
    const [orderPerPage, setOrderPerPage] = useState(10)
    const [isOrderModelOpen, setIsOrderModelOpen] = useState(false)
    const isOrderFirstRender = useRef(true);



    customerContact = useMemo(() => {
        if (customerContact) {
            if (customerContact && customerContact?.length > 1) {
                const response = customerContact?.filter((m) => m?.isPrimary === true)
                if (response?.length === 0) {
                    return customerContact?.[0]
                } else {
                    return response?.[0]
                }
            } else if (customerContact && customerContact?.length === 1) {
                return customerContact?.[0]
            } else {
                console.log('in Else Statement', customerContact)
            }
        }
    }, [customerContact])

    const getCustomerInteractionDetails = useCallback(() => {
        if (interactionDetails?.referenceValue) {
            try {
                get(`${properties.INTERACTION_API}/get-customer-history/${interactionDetails?.referenceValue}?limit=${perPageModal}&page=${currentPageModal}${modelType ? `&status=${modelType}` : ""}`)
                    .then((response) => {
                        if (response?.status === 200) {
                            setInteractionHistoryDetails({
                                count: response?.data?.count,
                                rows: response?.data?.rows
                            })
                        }
                    }).catch((error) => { console.error(error) })
                    .finally();
            } catch (error) { console.error(error) }
        }
    }, [currentPageModal, interactionDetails?.referenceValue, modelType, perPageModal])

    const getCustomerInteractionCount = useCallback(() => {
        if (interactionDetails?.referenceValue) {
            get(properties.INTERACTION_API + "/get-customer-history-count/" + interactionDetails?.referenceValue)
                .then((resp) => {
                    if (resp.status === 200) {
                        setInteractionHistoryCount({
                            open: resp.data?.openInteraction ?? 0,
                            closed: resp.data?.closedInteraction ?? 0,
                            total: (resp.data?.openInteraction ?? 0) + (resp.data?.closedInteraction ?? 0)
                        })
                    }
                })
                .catch((error) => { console.error(error) }).finally()
        }
    }, [interactionDetails?.referenceValue])

    const getHelpdeskCount = useCallback(() => {
        if (interactionDetails?.referenceValue) {
            get(`${properties.HELPDESK_API}/get-history-count/${interactionDetails?.referenceValue}`)
                .then((resp) => {
                    if (resp.status === 200) {
                        setHelpdeskHistoryCount({
                            open: resp.data?.openHelpdesk ?? 0,
                            closed: resp.data?.closedHelpdesk ?? 0,
                            total: (resp.data?.totalHelpdeskCount ?? 0)
                        })
                    }
                }).catch((error) => { console.error(error) }).finally()
        }
    }, [interactionDetails?.referenceValue])

    const getHelpdeskDetails = useCallback(() => {
        if (interactionDetails?.referenceValue) {
            try {
                get(`${properties.HELPDESK_API}/get-history-details/${interactionDetails?.referenceValue}?limit=${perPage}&page=${currentPage}${helpdeskModelType ? `&status=${helpdeskModelType}` : ""}`)
                    .then((response) => {
                        if (response?.status === 200) {
                            setHelpdeskHistoryDetails({
                                count: response?.data?.count,
                                rows: response?.data?.rows
                            })
                        }
                    }).catch((error) => { console.error(error) })
                    .finally();
            } catch (error) { console.error(error) }
        }
    }, [currentPage, helpdeskModelType, interactionDetails?.referenceValue, perPage])

    const getServiceCount = useCallback(() => {
        if (customerUuid && !isPublicService) {
            get(`${properties.ACCOUNT_DETAILS_API}/service/list/${customerUuid}?type=count`)
                .then((resp) => {
                    if (resp?.status === 200) {
                        setServiceCount(resp?.data?.count)
                    }
                }).catch((error) => console.error(error))
        }
    }, [customerUuid, isPublicService])

    const getServiceDetils = useCallback(() => {
        if (customerUuid && !isPublicService && isServiceModelOpen) {
            get(`${properties.ACCOUNT_DETAILS_API}/service/list/${customerUuid}?type=list&limit=${servicePerPage}&page=${serviceCurrentPage}`)
                .then((resp) => {
                    if (resp?.status === 200) {
                        setServiceHistoryDetails(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [customerUuid, isPublicService, isServiceModelOpen, servicePerPage, serviceCurrentPage])


    const getOrderCount = useCallback(() => {
        if (customerUuid && !isPublicService) {
            get(`${properties.ORDER_API}/counts?customerUuid=${customerUuid}`)
                .then((resp) => {
                    if (resp?.status === 200) {
                        setOrderCount(resp?.data?.count)
                    }
                }).catch((error) => console.error(error))
        }
    }, [customerUuid, isPublicService])

    const getOrderDetails = useCallback(() => {
        if (customerUuid && !isPublicService && isOrderModelOpen) {
            post(`${properties.ORDER_API}/search?limit=${orderPerPage}&page=${orderCurrentPage}`,
                { searchParams: { customerUuid: customerUuid, isNotParents: true } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setOrderHistoryDetails(resp?.data)
                    }
                }).catch((error) => console.error(error))
        }
    }, [customerUuid, isOrderModelOpen, isPublicService, orderCurrentPage, orderPerPage])

    useEffect(() => {
        if (!isPublicService) {
            getCustomerInteractionCount()
            getServiceCount()
            getOrderCount()
        } else if (isPublicService) {
            getHelpdeskCount()
        }
    }, [getCustomerInteractionCount, getHelpdeskCount, getOrderCount, getServiceCount, interactionDetails, isPublicService])

    useEffect(() => {
        if (!isFirstRender.current && !isPublicService) {
            getCustomerInteractionDetails();
        }
        else {
            isFirstRender.current = false;
        }
    }, [currentPageModal, getCustomerInteractionDetails, interactionDetails, isPublicService, perPageModal])

    useEffect(() => {
        if (!isHelpdeskFirstRender.current && isPublicService) {
            getHelpdeskDetails()
        }
        else {
            isHelpdeskFirstRender.current = false;
        }
    }, [currentPage, getHelpdeskDetails, interactionDetails, isPublicService, perPage])

    useEffect(() => {
        if (!isServiceFirstRender.current && !isPublicService) {
            getServiceDetils()
        }
        else {
            isServiceFirstRender.current = false;
        }
    }, [serviceCurrentPage, getServiceDetils, interactionDetails, isPublicService, servicePerPage])

    useEffect(() => {
        if (!isOrderFirstRender.current && !isPublicService) {
            getOrderDetails()
        }
        else {
            isOrderFirstRender.current = false;
        }
    }, [orderCurrentPage, getOrderDetails, interactionDetails, isPublicService, orderPerPage])

    const handlePageSelect = (pageNo) => { setCurrentPageModal(pageNo) }
    const handleHelpdeskPageSelect = (pageNo) => { setCurrentPage(pageNo) }
    const handleServicePageSelect = (pageNo) => { setServiceCurrentPage(pageNo) }
    const handleOrderPageSelect = (pageNo) => { setOrderCurrentPage(pageNo) }


    const handleInteractionModal = (type) => {
        unstable_batchedUpdates(() => {
            setIsInteractionModelOpen(true)
            setModalType(type)
            setCurrentPageModal((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
        // getCustomerInteractionDetails('DETAILS', status)
    }

    const handleHelpdeskModal = (type) => {
        unstable_batchedUpdates(() => {
            setIsHelpdeskModelOpen(true)
            setHelpdeskModalType(type)
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
        // getCustomerInteractionDetails('DETAILS', status)
    }

    const handleServiceModal = () => {
        unstable_batchedUpdates(() => {
            setIsServiceModelOpen(true)
            setServiceCurrentPage((serviceCurrentPage) => {
                if (serviceCurrentPage === 0) {
                    return '0'
                }
                return 0
            })
        })
    }

    const handleOrderModal = () => {
        unstable_batchedUpdates(() => {
            setIsOrderModelOpen(true)
            setOrderCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }


    const handleCellRender = (cell, row) => {
        if (cell.column.id === "createdAt") {
            return (<span>{moment(row.original?.createdAt).format("DD-MM-YYYY HH:mm:ss a")}</span>)
        } else if (cell.column.id === 'helpdeskNo') {
            return <span className="text-secondary cursor-pointer" onClick={() => { handleOnClick(statusConstantCode.entityCategory.HELPDESK, row.original) }}>{cell.value}</span>;
        } else if (cell.column.id === 'fullName') {
            return <span>{getFullName(row.original.customerDetails) ?? ''}</span>;
        } else if (cell.column.id === 'intxnNo') {
            return <span className="text-secondary cursor-pointer" onClick={() => { handleOnClick(statusConstantCode.entityCategory.INTERACTION, row.original) }}>{cell.value}</span>;
        } else if (cell.column.id === "orderDate") {
            return (<span>{moment(row.original?.orderDate).format("DD-MM-YYYY HH:mm:ss a")}</span>)
        }
        else {
            return <span>{cell.value}</span>;
        }
    }

    const handleOnClose = () => {
        setIsInteractionModelOpen(false)
    }

    const handleHelpdeskOnClose = () => {
        setIsHelpdeskModelOpen(false)
        setHelpdeskHistoryDetails({ count: 0, rows: [] })
    }

    const handleServiceOnClose = () => {
        setIsServiceModelOpen(false)
        setServiceHistoryDetails({ count: 0, rows: [] })
    }

    const handleOrderOnClose = () => {
        setIsOrderModelOpen(false)
        setOrderHistoryDetails({ count: 0, rows: [] })
    }

    const handleOnClickRedirect = () => {
        let redirectUrl, data;
   
        if (isPublicService) {
            customerDetails?.customerNo && localStorage.setItem("profileNo", customerDetails?.customerNo)
            customerDetails?.customerUuid && localStorage.setItem("profileUuid", customerDetails?.customerUuid)

            redirectUrl = 'view-profile'
            data = { profileData: { profileNo: interactionDetails?.referenceValue ?? '' } }
        } else {
            interactionDetails?.customerUid && localStorage.setItem("customerUuid", interactionDetails.customerUid);
            interactionDetails?.customerId && localStorage.setItem("customerIds", interactionDetails.customerId)
            customerDetails?.customerNo && localStorage.setItem("customerNo", customerDetails?.customerNo)
            console.log("interactionDetails", interactionDetails);
            redirectUrl = 'view-customer'
            data = { customerNo: interactionDetails?.referenceValue ?? '' }
        }

        if (isEmpty(data)) {
            toast.error('No data is defined')
            return false
        }

        history(`/${redirectUrl}`, {state: {data}})
    }

    return (
        <div className="tab-pane fade active show" id="customerinformation" role="tabpanel" aria-labelledby="custtab">
            <div className="view-int-details-key skel-tbl-details">
                <table className="table-responsive dt-responsive nowrap w-100">
                    <tr>
                        <td><span className="font-weight-bold">{appConfig?.clientFacingName?.customer ?? 'Customer'} ID</span></td>
                        <td width="5%">:</td>
                        <td><span onClick={handleOnClickRedirect} style={{ color: 'rgb(6 88 242)' }} className="cursor-pointer">{customerDetails?.customerNo}</span></td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Full Name</span></td>
                        <td width="5%">:</td>
                        <td>{getFullName(customerDetails) ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Contact Number</span></td>
                        <td width="5%">:</td>
                        <td>{customerContact?.mobilePrefix ? (`+${customerContact?.mobilePrefix} `) : ''}{customerContact?.mobileNo ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Email</span></td>
                        <td width="5%">:</td>
                        <td>{customerContact?.emailId ?? '-'}</td>
                    </tr>
                    <tr>
                        <td><span className="font-weight-bold">Contact Preference</span></td>
                        <td width="5%">:</td>
                        <td>{(customerDetails?.contactPreference && customerDetails?.contactPreference?.map((m) => m?.description).join(",")) ?? ""}</td>
                    </tr>
                </table>
                {!isPublicService && <div className="skel-inter-view-history">
                    <span className="skel-header-title">Interaction Details</span>
                    <div className="skel-tot-inter">
                        <div className="skel-tot">
                            Total<span data-toggle="modal" className="cursor-pointer" onClick={() => { handleInteractionModal('TOTAL') }} data-target="#skel-view-modal-interactions">{interactionHistoryCount?.total ?? 0}</span>
                        </div>
                        <div className="skel-tot">
                            Open<span data-toggle="modal" className="cursor-pointer" onClick={() => { handleInteractionModal('OPEN') }} data-target="#skel-view-modal-interactions">{interactionHistoryCount?.open ?? 0}</span>
                        </div>
                        <div className="skel-tot">
                            Closed<span data-toggle="modal" className="cursor-pointer" onClick={() => { handleInteractionModal('CLOSED') }} data-target="#skel-view-modal-interactions">{interactionHistoryCount?.closed ?? 0}</span>
                        </div>
                    </div>
                    <div className="mt-3">
                        <table className="table table-hover mb-0 table-centered table-nowrap text-center">
                            <thead>
                                <tr><th scope="col">Total Service</th>
                                    <th scope="col">Total Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span className="txt-underline cursor-pointer" onClick={(e) => (handleServiceModal())}>{serviceCount ?? 0}</span></td>
                                    <td><span className="txt-underline cursor-pointer" onClick={(e) => (handleOrderModal())}>{orderCount ?? 0}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>}
                {isPublicService && <div className="skel-inter-view-history">
                    <span className="skel-header-title">Helpdesk Summary</span>
                    <div className="skel-tot-inter">
                        <div className="skel-tot">
                            Total<span data-toggle="modal" className="cursor-pointer" data-target="#skel-view-modal-interactions" onClick={() => { handleHelpdeskModal('TOTAL') }}>{helpdeskHistoryCount?.total ?? 0}</span>
                        </div>
                        <div className="skel-tot">
                            Open<span data-toggle="modal" className="cursor-pointer" data-target="#skel-view-modal-interactions" onClick={() => { handleHelpdeskModal('OPEN') }}>{helpdeskHistoryCount?.open ?? 0}</span>
                        </div>
                        <div className="skel-tot">
                            Closed<span data-toggle="modal" className="cursor-pointer" data-target="#skel-view-modal-interactions" onClick={() => { handleHelpdeskModal('CLOSED') }}>{helpdeskHistoryCount?.closed ?? 0}</span>
                        </div>
                    </div>
                </div>}
                {/* Interaction Modal */}
                {<Modal aria-labelledby="contained-modal-title-vcenter" centered show={isInteractionModelOpen} onHide={handleOnClose} dialogClassName="cust-lg-modal">
                    <Modal.Header>
                        <Modal.Title><h5 className="modal-title">Interaction History</h5></Modal.Title>
                        <CloseButton onClick={handleOnClose} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                            {/* <span>×</span> */}
                        </CloseButton>
                    </Modal.Header>
                    <Modal.Body>
                        <DynamicTable
                            listKey={"Interactions"}
                            row={interactionHistoryDetails?.rows}
                            rowCount={interactionHistoryDetails?.count ?? 0}
                            header={interactionListColumns}
                            itemsPerPage={perPageModal}
                            isScroll={true}
                            backendPaging={true}
                            backendCurrentPage={currentPageModal}
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPageModal,
                                handleCurrentPage: setCurrentPageModal,
                            }}
                        />
                    </Modal.Body>
                </Modal>}
                {/* Helpdesk Modal */}
                {<HelpdeskList data={{ helpdeskHistoryDetails, perPage, currentPage, isHelpdeskModelOpen }} stateHandlers={{ handleHelpdeskOnClose, handleCellRender, handleHelpdeskPageSelect, setPerPage, setCurrentPage }} />}
                {<ServiceList data={{ serviceHistoryDetails, servicePerPage, serviceCurrentPage, isServiceModelOpen }} stateHandlers={{ handleServiceOnClose, handleCellRender, handleServicePageSelect, setServicePerPage, setServiceCurrentPage }} />}
                {<OrderList data={{ orderHistoryDetails, orderPerPage, orderCurrentPage, isOrderModelOpen }} stateHandlers={{ handleOrderOnClose, handleCellRender, handleOrderPageSelect, setOrderPerPage, setOrderCurrentPage }} />}
            </div>
        </div>
    )
}

export default CustomerInformation

const interactionListColumns = [
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
        id: "intxnNo"
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategoryDesc.description",
        disableFilters: true,
        id: "intxnCategory"
    },
    {
        Header: "Interaction Type",
        accessor: "srType.description",
        disableFilters: true,
        id: "intxnType"
    },
    {
        Header: "Service Category",
        accessor: "categoryDescription.description",
        disableFilters: true,
        id: "category"
    },
    {
        Header: "Service Type",
        accessor: "serviceTypeDesc.description",
        disableFilters: true,
        id: "serviceType"
    },
    {
        Header: "Status",
        accessor: "currStatusDesc.description",
        disableFilters: true,
        id: "currStatus"
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
        id: "createdAt"
    },
]

