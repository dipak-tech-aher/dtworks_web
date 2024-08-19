import { useCallback, useEffect, useState } from "react";
import DynamicTable from "../../common/table/DynamicTable";
import { formatISODateTime } from "../../common/util/dateUtil";
import { post } from "../../common/util/restUtil";
import { properties } from "../../properties";
// import { HelpdeskSearchColumns } from "./HelpdeskSearch/HelpdeskSearchColumnLits";
import { useRef } from "react";
import { useNavigate } from 'react-router-dom';


const WorkflowHistory = (props) => {
    const { detailedViewItem } = props.data
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);

    const [interactionPerPage, setInteractionPerPage] = useState(10);
    const [interactionCurrentPage, setInteractionCurrentPage] = useState(0);

    const [helpdeskHistory, setHelpdeskHistory] = useState([])
    const [interactionHistory, setInteractionHistory] = useState({})

    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);

    const interactionIsTableFirstRender = useRef(true);
    const interactionHasExternalSearch = useRef(false);

    const [filters, setFilters] = useState([]);
    const isFirstRender = useRef(true);
    const interactionIsFirstRender = useRef(true);

    const history = useNavigate();

    const getHelpdeskDetails = useCallback((payload) => {
        if (payload?.profileNo) {
            const requestBody = {
                userCategoryValue: payload?.profileNo,
                contain: ['CUSTOMER']
            }

            post(`${properties.HELPDESK_API}/search?limit=${perPage}&page=${currentPage}`, requestBody)
                .then((response) => {
                    if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                        setHelpdeskHistory(response?.data)
                    }
                })
                .catch(error => {
                    console.log(error);
                })
                .finally(
                    isTableFirstRender.current = false
                )
        }
    }, [currentPage, perPage])

    const getInteractionDetails = useCallback((payload) => {
        if (payload?.customerId) {
            const requestBody = {
                searchParams: {
                    customerId: payload?.customerId && Number(payload?.customerId)
                }
            }

            post(`${properties.INTERACTION_API}/search?limit=${interactionPerPage}&page=${interactionCurrentPage}`, requestBody)
                .then((response) => {
                    if (response && response?.data && response?.data?.rows && response?.data?.rows.length > 0) {
                        // console.log('response :::::::::::::', response)
                        setInteractionHistory(response?.data)
                    }
                })
                .catch(error => {
                    console.log(error);
                })
                .finally(
                    interactionIsTableFirstRender.current = false
                )
        }

    }, [interactionCurrentPage, interactionPerPage])

    useEffect(() => {
        if (!isFirstRender.current) {
            getHelpdeskDetails({ profileNo: detailedViewItem?.profileNo });
        }
        else {
            isFirstRender.current = false
            // getEntityLookup();
        }
    }, [currentPage, perPage])

    useEffect(() => {
        if (!interactionIsFirstRender.current) {
            getInteractionDetails({ customerId: detailedViewItem?.customerDetails?.profileId });
        }
        else {
            interactionIsFirstRender.current = false
            // getEntityLookup();
        }
    }, [interactionCurrentPage, interactionPerPage])

    useEffect(() => {
        if (detailedViewItem?.profileNo) {
            getHelpdeskDetails({ profileNo: detailedViewItem?.profileNo })
        }
    }, [getHelpdeskDetails, detailedViewItem?.profileNo])

    useEffect(() => {
        if (detailedViewItem?.customerDetails?.profileId) {
            getInteractionDetails({ customerId: detailedViewItem?.customerDetails?.profileId })
        }
    }, [detailedViewItem?.customerDetails?.profileId, getInteractionDetails])

    const handleCellRender = (cell, row) => {
        if (cell?.column?.Header === "Created Date") {
            return (<span>{formatISODateTime(cell?.value)}</span>)
        } else if (cell?.column?.Header === "Helpdesk NO") {
            return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        }
        else if (cell?.column?.Header === "Interaction Number") {
            return (<span className="text-secondary" style={{ cursor: "pointer" }} onClick={(e) => redirectToRespectivePages(e, row.original)}>{cell.value}</span>)
        }
        else {
            return (<span>{!cell?.value ? '-' : cell?.value}</span>)
        }
    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    const handleInteractionPageSelect = (pageNo) => {
        setInteractionCurrentPage(pageNo)
    }

    const handleCellLinkClick = (event, rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }

    const redirectToRespectivePages = (e, rows) => {
        const data = {
            intxnNo: rows?.intxnNo,
            customerUid: rows?.customerUid,
            sourceName: 'customer360'
        }
        history(`/interaction360`, { state: {data} })
    }


    return (
        <>
            <div>
                <div className="row">
                    <div className="col-12 pl-2 mt-2">
                        <h6>{props?.appsConfig?.clientFacingName?.customer ?? "Customer"} Helpdesk History</h6>
                    </div>
                    {helpdeskHistory?.count > 0 ? <div>
                        <DynamicTable
                            listKey={"Helpdesk Interactions"}
                            row={helpdeskHistory?.rows ?? []}
                            rowCount={helpdeskHistory?.count ?? 0}
                            header={HelpdeskSearchColumns}
                            fixedHeader={false}
                            columnFilter={false}
                            customClassName={'table-sticky-header'}
                            itemsPerPage={perPage}
                            isScroll={true}
                            backendPaging={true}
                            isTableFirstRender={isTableFirstRender}
                            hasExternalSearch={hasExternalSearch}
                            backendCurrentPage={currentPage}
                            // url={intxnSearchAPI + `? limit = ${ perPage } & page=${ currentPage }`}
                            method='POST'
                            handler={{
                                handleCellRender: handleCellRender,
                                handlePageSelect: handlePageSelect,
                                handleItemPerPage: setPerPage,
                                handleCurrentPage: setCurrentPage,
                                handleFilters: setFilters
                            }}
                        />
                    </div>
                        :
                        <span className="skel-widget-warning">No Helpdesk History available yet</span>
                    }
                </div>
            </div>
            <div>
                <div className="row">
                    <div className="col-12 pl-2 mt-2">
                        <h6>Interaction History</h6>
                    </div>
                    {/*                                 header={CustomerDetailsViewColumns}
 */}
                    <div className="col-12 pl-2 mt-2">
                        {(interactionHistory?.count > 0) ?
                            <DynamicTable
                                listKey={"Helpdesk Interactions"}
                                row={interactionHistory?.rows ?? []}
                                rowCount={interactionHistory?.count ?? 0}
                                header={InteractionColumns}
                                fixedHeader={false}
                                columnFilter={false}
                                customClassName={'table-sticky-header'}
                                itemsPerPage={interactionPerPage}
                                isScroll={true}
                                backendPaging={true}
                                isTableFirstRender={interactionIsTableFirstRender}
                                hasExternalSearch={hasExternalSearch}
                                backendCurrentPage={interactionCurrentPage}
                                // url={intxnSearchAPI + `? limit = ${ perPage } & page=${ currentPage }`}
                                method='POST'
                                handler={{
                                    handleCellRender: handleCellRender,
                                    handlePageSelect: handleInteractionPageSelect,
                                    handleItemPerPage: setInteractionPerPage,
                                    handleCurrentPage: setInteractionCurrentPage,
                                    handleFilters: setFilters
                                }}
                            />
                            :
                            <span className="skel-widget-warning">No Interactions History available yet</span>
                        }
                    </div>
                </div>
            </div>
        </>
    )

}

const HelpdeskSearchColumns = [
    // {
    //     Header: "Helpdesk ID",
    //     accessor: "helpdeskId",
    //     disableFilters: true,
    //     click: true,
    //     id: "helpdeskId",

    // },
    {
        Header: "Helpdesk NO",
        accessor: "helpdeskNo",
        disableFilters: true,
        click: true,
        id: "helpdeskNo",
    },
    {
        Header: "Source",
        accessor: "helpdeskSource.description",
        disableFilters: true,
        id: "source"
    },
    {
        Header: "Status",
        accessor: "status.description",
        disableFilters: true,
        id: "status"
    },
    {
        Header: "Source Reference",
        accessor: "mailId",
        disableFilters: true,
        id: "sourceReference"
    },
    {
        Header: "Profile ID",
        accessor: "customerDetails.profileId",
        disableFilters: true,
        id: "profileNumber"
    },
    {
        Header: "First Name",
        accessor: "customerDetails.firstName",
        disableFilters: true,
        id: "firstName"
    },
    {
        Header: "Last Name",
        accessor: "customerDetails.lastName",
        disableFilters: true,
        id: "fullName"
    },
    {
        Header: "Contact Number",
        accessor: "customerDetails.contactDetails.mobileNo",
        disableFilters: true,
        id: "customerNumber"
    },
    {
        Header: "Email",
        accessor: "customerDetails.contactDetails.emailId",
        disableFilters: true,
        id: "email"
    }
]

const InteractionColumns = [
    {
        Header: "Interaction Number",
        accessor: "intxnNo",
        disableFilters: true
    },
    {
        Header: "Request Statement",
        accessor: "requestStatement",
        disableFilters: true
    },
    {
        Header: "Interaction Category",
        accessor: "intxnCategory.description",
        disableFilters: true
    },
    {
        Header: "Interaction Type",
        accessor: "intxnType.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true
    },
    {
        Header: "Created On",
        accessor: "createdAt",
        disableFilters: true
    },
    {
        Header: "Updated On",
        accessor: "updatedAt",
        disableFilters: true
    }
]

export default WorkflowHistory

