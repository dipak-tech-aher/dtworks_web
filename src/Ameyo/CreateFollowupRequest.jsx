// import AddressPreview from "../customer/addressPreview"
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from 'react-scroll';
import DynamicTable from "../common/table/DynamicTable";
import { properties } from "../properties";
// import CitizenDetailsForm from "./CitizenDetailsForm";
// import FollowupModel from "./followupModel";
import { unstable_batchedUpdates } from "react-dom";
import { toast } from "react-toastify";
import { formatISODateTime } from "../common/util/dateUtil";
import { post } from "../common/util/restUtil";
import FollowupModel from "./followupModel";

const CreateFollowupRequest = (props) => {
    // console.log('props', props)
    // const phone = props.location.state && props.location.state.phone

    // const [customerData, setCustomerData] = useState({
    //     customerType: 'RESIDENTIAL',
    //     contactNo: phone
    // });
    const { customerData, mode, lookupData, departmentRef, installationAddress, installationError, type, customerAddress } = props?.data
    //  const phone = props.location.state && props.location.state.phone
    const { setMode, setInstallationError, setInstallationAddress, setKampongLookup,
        setPostCodeLookup, setMukimLookup, setCustomerAddress, getCustomerDetails, setCustomerData } = props?.handler

    const { countries, districtLookup, kampongLookup, postCodeLookup, priorityLookup, addressLookUpRef, mukimLookup } = props?.lookupData

    const accessToken = localStorage.getItem("accessToken")
    const [interaction, setIteractionList] = useState([])
    // const isFirstRender = useRef(true);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    // const [filters, setFilters] = useState([]);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [exportBtn, setExportBtn] = useState(false)
    // const [listSearch, setListSearch] = useState([])
    const [isFollowupOpen, setIsFollowupOpen] = useState(false);
    const [interactionDetails, setInteractionDetails] = useState()
    const [tableRowData, setTableRowData] = useState([]);

    useEffect(() => {
        if (customerData) {
            // console.log('customerId', customerData?.customerUuid)
            //   setCustomerData(customer)
            getIntractionList(customerData?.customerUuid)
        }
    }, [customerData])


    // const options = [
    //     { value: 'BUSINESS', label: 'Business' },
    //     { value: 'RESIDENTIAL', label: 'Residential' },
    //     { value: 'GOVERNMENT', label: 'Government' },
    // ]

    const getIntractionList = useCallback((customerUuid) => {
        if (customerUuid) {
            const requestBody = {
                searchParams: {
                    customerUuid
                }
            }
            post(`${properties.INTERACTION_API}/search?limit=${perPage}&page=${Number(currentPage)}`, requestBody)
                .then((response) => {
                    if (response.data) {
                        if (Number(response.data.count) > 0) {
                            unstable_batchedUpdates(() => {
                                setTotalCount(response.data.count)
                                setTableRowData(response.data.rows)
                            })
                        }
                        else {
                            setTotalCount(0)
                            setTableRowData([])
                            toast.error("Records not Found")
                        }
                    }
                }).catch((error) => {
                    console.log(error)
                })
                .finally(() => {
                    isTableFirstRender.current = false;
                })
        }
    }, [])

    const handleCellLinkClick = (e, rowData) => {
        setIsFollowupOpen(true)
        setInteractionDetails(rowData)
    }

    const handleCellRender = (cell, row) => {
        if (cell.column.Header === "Interaction No") {
            return (<span className="text-secondary" style={{ cursor: "pointer" }} onClick={(e) => handleCellLinkClick(e, row.original)}>{cell.value}</span>)
        }
        else if (cell.column.Header === "Created At") {
            return (<span>{formatISODateTime(cell.value)}</span>)
        }
        else {
            return (
                <span>{cell.value}</span>
            )
        }

    }

    const handlePageSelect = (pageNo) => {
        //isFirstRender.current = false
        setCurrentPage(pageNo)
    }

    return (
        <>
            {
                <FollowupModel
                    data={{
                        interactionData: interactionDetails,
                        isFollowupOpen,
                        priorityLookup
                    }}
                    handler={{
                        setIsFollowupOpen
                    }}
                />
            }
            <div className="container-fluid">
                <div className="row mt-1">
                    <div className="col-lg-12">
                        <div className="card-box">
                            <div className="testFlex">
                                <div className="col-md-2 sticky">
                                    <nav className="navbar navbar-default navbar-fixed-top">
                                        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                                            <ul className="nav navbar-nav">
                                                {/* <li><Link activeclassName="active" className="test1" to="customerSection" spy={true} offset={-165} smooth={true} duration={100}>Citizen Details</Link></li> */}
                                                <li><Link activeclassName="active" className="test2" to="complaintSection" spy={true} offset={-130} smooth={true} duration={100}>Interaction History</Link></li>
                                            </ul>
                                        </div>
                                    </nav>
                                </div>
                                <div className="new-customer col-md-10">
                                    <div data-spy="scroll" data-target="#scroll-list" data-offset="0" className="scrollspy-div"></div>
                                    { /*<CitizenDetailsForm
                                        data={{
                                            customerData: customerData,
                                            mode: mode,
                                            lookupData,
                                            departmentRef,
                                            installationAddress,
                                            addressLookUpRef,
                                            installationError,
                                            // detailsValidate,
                                            customerAddress,
                                            type
                                        }}
                                        handler={{
                                            setMode,
                                            setInstallationError,
                                            // setDetailsValidate,
                                            // addressChangeHandler,
                                            setInstallationAddress,
                                            setKampongLookup,
                                            setPostCodeLookup,
                                            setMukimLookup,
                                            setCustomerAddress,
                                            setCustomerData,
                                            getCustomerDetails
                                        }}
                                        lookups={{
                                            countries,
                                            districtLookup,
                                            kampongLookup,
                                            mukimLookup,
                                            postCodeLookup
                                        }}
                                    />
                                    */}
                                    <div className="row" style={{ display: 'block' }}>
                                        <div className="title-box col-12 p-0">
                                            <section className="triangle">
                                                <h4 className="pl-2" style={{ alignContent: 'left' }}>Interaction List</h4>
                                            </section>
                                        </div>
                                    </div>
                                    <div>
                                        {
                                            tableRowData.length > 0 &&
                                            <div className="card-body" id="datatable">
                                                <DynamicTable
                                                    listKey={"interaction List"}
                                                    row={tableRowData}
                                                    rowCount={totalCount}
                                                    header={InteractionSearchColumns}
                                                    itemsPerPage={perPage}
                                                    backendPaging={false}
                                                    backendCurrentPage={currentPage}
                                                    isTableFirstRender={isTableFirstRender}
                                                    hasExternalSearch={hasExternalSearch}
                                                    exportBtn={exportBtn}
                                                    handler={{
                                                        handleCellRender: handleCellRender,
                                                        handlePageSelect: handlePageSelect,
                                                        handleItemPerPage: setPerPage,
                                                        handleCurrentPage: setCurrentPage,
                                                        // handleFilters: setFilters,
                                                        handleExportButton: setExportBtn
                                                    }}
                                                />
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )

}

export default CreateFollowupRequest


const InteractionSearchColumns = [
    {
        Header: "Interaction No",
        accessor: "intxnNo",
        disableFilters: true,
    },
    // {
    //   Header: "Remarks",
    //   accessor: "remarks",
    //   disableFilters: true,
    // },
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
        Header: "Service Category",
        accessor: "serviceCategory.description",
        disableFilters: true
    },
    {
        Header: "Service Type",
        accessor: "serviceType.description",
        disableFilters: true
    },
    {
        Header: "Status",
        accessor: "intxnStatus.description",
        disableFilters: true
    },
    {
        Header: "Created At",
        accessor: "createdAt",
        disableFilters: true,
    }
]