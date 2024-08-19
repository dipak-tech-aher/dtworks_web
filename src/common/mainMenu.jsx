import React, { useContext, useRef, useState, useEffect, useCallback } from "react";
import { AppContext } from "../AppContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { post, get } from "../common/util/restUtil";
import { properties } from "../properties";
import { CustomerSearchColumns, ComplaintCustomerSearchHiddenColumns, ProfileSearchColumns } from "../CRM/Customer/customerSearchColumns";
import SearchModal from "./SearchModal";
import { unstable_batchedUpdates } from "react-dom";
import { statusConstantCode } from "../AppConstants";
import { NavDropdown } from 'react-bootstrap';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { get as getObj } from 'lodash'
const MainMenu = (props) => {

    const { auth } = useContext(AppContext)
    const { appsConfig } = props;

    // console.log("appsConfig ===> ", appsConfig);
    const homeMenu = appsConfig?.clientConfig?.menu?.homeMenu;
    const thirdPartyCall = appsConfig?.clientConfig?.interaction?.createInteraction?.thirdPartyCall
    const dtWorksProductType = appsConfig?.businessSetup?.[0];
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [anonymous, setAnonymous] = useState(false)
    const [type, setType] = useState('CREATE')
    const [searchData, setSearchData] = useState([]);
    const [searchInput, setSearchInput] = useState({});
    const [source, setSource] = useState('')
    const [path, setPath] = useState()
    // const CREATE_INTERACTION = "Create Interaction";
    // const OTHERS_INTERACTION = "Interaction For Others"
    // const INVENTORY_ASSIGNMENT = "Inventory Assignment"

    // const menuCollapse = props?.data?.menuCollapse
    const history = useNavigate();
    // let requestParam;
    const [totalCount, setTotalCount] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState([]);
    const [addressList, setAddressList] = useState([{}]);
    const isFirstRender = useRef(true);
    const isTableFirstRender = useRef(true);
    const hasExternalSearch = useRef(false);
    const [openAddress, setOpenAddress] = useState(false)
    const [refresh, setRefresh] = useState(false)
    const [mainMenuData, setMainMenuData] = useState([])
    // const [dashboards, setDashboards] = useState([])
    // const [isContractModalOpen, setIsContractModalOpen] = useState({ openModal: false });
    const [selectedConsumerNo, setSelectedConsumerNo] = useState();
    const [dataError, setDataError] = useState({})

    const handlePopupClick = (screen) => {
        console.log('clicked on this-------------', screen)
        setIsModalOpen(true);
        setAnonymous(false)
        setType('CREATE')
        setSearchData([]);
        setSearchInput("");
        setSource(screen?.screenCode)
        setPath(screen.url)
    }

    const NavLink = React.forwardRef((props, ref) => {
        const { href, as, ...rest } = props;
        return (
            <Link to={{ pathname: href, data: { sourceName: rest.data } }} as={as}>
                <span ref={ref} {...rest} />
            </Link>
        );
    });

    const callToDst = async (msisdnNo) => {
        return await post(properties.CUSTOMER_API + "/quick-search-customer", { msisdnNo })
            .then((resp) => {
                return resp
            }).catch((error) => {
                console.log('error------>', error)
            })
    }

    const searchInformation = useCallback(async () => {
        let httpUrl;
        let requestParam = {
            // searchType: 'QUICK_SEARCH',
            //customerQuickSearchInput: searchInput,
            // filters: formFilterObject(filters),
            // source: 'COMPLAINT'
            // checkIsPrimary: false,
            mobileNo: searchInput.mobileNo,
            emailId: searchInput.emailId,
        };

        if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {

            requestParam.customerName = searchInput.consumerName
            requestParam.customerNo = selectedConsumerNo ? selectedConsumerNo : searchInput.consumerNo
            requestParam.serviceNo = searchInput.subscriptionNumber
            // requestParam.type = 'list'
            // requestParam.checkIsPrimary = false
            //   setSearchInput((prevState) => ({
            //     ...prevState,
            //     checkIsPrimary: false,
            //     // status: ['AC', 'CS_ACTIVE', 'CS_PEND', 'CS_PROSPECT'],
            //   }));

            // httpUrl = `${properties.CUSTOMER_API}/get-customer?limit=${perPage}&page=${currentPage}`;
            httpUrl = `${properties.ACCOUNT_DETAILS_API}/get-service-list?limit=${perPage}&page=${currentPage}&type=list`;
        }
        if (dtWorksProductType === statusConstantCode.type.PUBLIC_SERVICE || dtWorksProductType === statusConstantCode.type.HELPDESK_SERVICE) {
            //   setSearchInput((prevState) => ({
            //     ...prevState,            
            //       profileName: searchInput.consumerName,
            //       profileNo: searchInput.consumerNo,
            //     // status: ['AC', 'PS_ACTIVE'],
            //   }));
            requestParam.profileName = searchInput.consumerName
            requestParam.profileNo = selectedConsumerNo ? selectedConsumerNo : searchInput.consumerNo


            httpUrl = `${properties.PROFILE_API}/search?limit=${perPage}&page=${currentPage}`;
        }

        if (httpUrl) {
            try {

                if (thirdPartyCall && thirdPartyCall?.callTo === "DST") {
                    const resp = await callToDst(requestParam?.subscriptionNumber);
                    // console.log('resp-------->', resp)
                    requestParam.crmCustomerNo = resp?.data?.crmCustomerNo
                }
                // console.log('requestParam--------->', requestParam)
                const resp = await post(httpUrl, requestParam);

                if (resp.status === 200) {
                    if (resp?.data) {
                        const { rows, count } = resp?.data;
                        unstable_batchedUpdates(() => {
                            setTotalCount(count);

                            // const customerRows = rows.map(customer => {
                            //     const { customerDetails, accountDetails, ...serviceDetails } = customer
                            //     return {
                            //         customerDetails,
                            //         accountDetails,
                            //         serviceDetails
                            //     }
                            // });

                            // console.log('customerDetails ', customerRows)

                            setSearchData(rows);

                            if (anonymous && selectedConsumerNo) {
                                handleCellLinkClick("", rows?.[0], "");
                                setSelectedConsumerNo()
                                setAnonymous(false)
                            }
                        });
                    }
                }

            } catch (error) {
                console.error(error);
            }
        }
    }, [perPage, currentPage, setTotalCount, setSearchData, dtWorksProductType, selectedConsumerNo]);


    useEffect(() => {
        if (!isFirstRender.current) {
            searchInformation()
        }
        else {
            isFirstRender.current = false;
        }
    }, [perPage, currentPage, searchInformation, selectedConsumerNo])

    useEffect(() => {
        get(properties.MAINMENU_API + '/getMenu').then((resp) => {
            if (resp.data) {
                // console.log('resp.data---->', resp.data)
                resp.data.sort((a, b) => a?.sortOrder - b?.sortOrder);
                setMainMenuData(resp.data)
                // setDashboards(resp.data.filter((e) => e.moduleName === 'Dashboard'))
            }
        }).catch((error) => {
            console.log(error)
        })
    }, [auth])

    const handleOnCustomerSearch = (e) => {
        console.log(searchInput)
        if (Object.keys(searchInput).length === 0 || searchInput === '') {
            toast.error("Validation errors found. Please provide any one field");
            return false
        }
        if (!searchInput.consumerName && !searchInput.mobileNo && !searchInput.consumerNo && !searchInput.emailId && (!searchInput.subscriptionNumber && dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE)) {
            toast.error("Validation errors found. Please provide any one field");
            return false
        } else if (!searchInput.consumerName && !searchInput.mobileNo && !searchInput.consumerNo && !searchInput.emailId && (!dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE)) {
            toast.error("Validation errors found. Please provide any one field");
            return false
        }
        e.preventDefault();
        isTableFirstRender.current = true;
        unstable_batchedUpdates(() => {
            setFilters([])
            setCurrentPage((currentPage) => {
                if (currentPage === 0) {
                    return '0'
                }
                return 0
            });
        })
    }

    const handleCellLinkClick = (e, rowData, popUpstatus) => {
        console.log('rowData--->', path)
        const data = {
            ...rowData,
            type: 'EDIT',
            dtWorksProductType
        }
        setIsModalOpen(false);
        setSearchData([]);
        setSearchInput("");
        setTimeout(() => {
            history(`/${path}`, { state: { data: data } })
        }, 500);
    }

    const OnEdit = (data) => {
        setType('EDIT')
        let { firstName, customerCatDesc, lastName, profileContact, projectMapping, contactPreferencesDesc = [], profileNo, customerNo } = data
        // / Address value field
        let { address1, address2, address3, postcode, country, state, city, addressNo, district, addressType = '' } = getObj(data, 'profileAddress[0]', {}),
            valueObj = {
                address1, address2, address3, postcode, country, state, city, addressNo, addressType: addressType?.code ?? '', district
            }
        const consumerNo = dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? customerNo : profileNo
        unstable_batchedUpdates(() => {
            setAddressList([valueObj])

            setSearchInput({
                ...searchInput,
                ...data,
                consumerNo
            })
        })
    }

    const handleCellRender = (cell, row) => {

        if (dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE) {
            if (cell.column.id === "customerName") {
                const firstName = row?.original?.customerDetails?.firstName || row?.original?.firstName
                const lastName = row?.original?.customerDetails?.lastName || row?.original?.lastName
                let name = ((firstName ?? "") + " " + (lastName ?? ""))
                return (<span>{name}</span>);
            }
            else if ((source !== 'SEARCH_CUST' && cell.column.id === 'serviceNo')) {
                return (
                    <span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original, isModalOpen)}>
                        {cell.value}
                    </span>
                );
            } else if ((source === 'SEARCH_CUST' && cell.column.id === 'customerNo')) {
                return (
                    <span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original, isModalOpen)}>
                        {cell.value}
                    </span>
                );

            } else {
                return (<span>{cell.value}</span>)
            }
        } else {
            if (cell.column.id === "profileName") {
                const firstName = row?.original?.customerDetails?.firstName || row?.original?.firstName
                const lastName = row?.original?.customerDetails?.lastName || row?.original?.lastName
                let name = ((firstName ?? "") + " " + (lastName ?? ""))
                return (<span>{name}</span>);
            } else if (cell.column.id === 'action') {
                return (
                    <div className="skel-action-btn">
                        <div title="Edit" onClick={() => OnEdit(cell?.row?.original)} className="action-edit"><i className="material-icons">edit</i></div>
                        <div title="View" onClick={(e) => handleCellLinkClick(e, row.original, isModalOpen)} className="action-view" data-toggle="modal" data-target="#view-right-modal"><a><i className="material-icons">visibility</i></a></div>
                    </div>
                )
            } else {
                return (<span>{cell.value}</span>)
            }
            // else  if (cell.column.id === "customerNo" || cell.column.id === "profileNo") {
            //     return (<span className="text-secondary cursor-pointer" onClick={(e) => handleCellLinkClick(e, row.original, isModalOpen)}>{cell.value}</span>)
            // } 
        }




    }

    const handlePageSelect = (pageNo) => {
        setCurrentPage(pageNo)
    }

    // const handleItemCreate = (formId) => {
    //     history(`/formdata-addedit`, {
    //         data: {
    //             formId: formId
    //         }
    //     })
    // }

    // const handleItemsList = (formId) => {
    //     history(`/formdata-list`, {
    //         data: {
    //             formId: formId
    //         }
    //     })
    // }
    const [expanded, setExpanded] = useState(false);

    // const handleToggle = () => {
    //     setExpanded(!expanded);
    // };

    const openSelfInteraction = () => {
        post(`${properties.CUSTOMER_API}/get-customer?limit=1&page=0`, { emailId: auth?.user?.email }).then((resp) => {
            if (resp?.data) {
                handleCellLinkClick("", resp?.data?.rows?.[0], "");
            }
        }).catch((error) => {
            console.error(error);
        }).finally();
    }


    // const createInteraction = () => {
    //     let permissions = auth?.permissions ?? [];
    //     let interactionPermissions;
    //     for (let index = 0; index < permissions.length; index++) {
    //         console.log('permissions[index]?.moduleName---------->', permissions[index]?.moduleName)
    //         if (permissions[index]?.moduleName === 'Interaction') {
    //             interactionPermissions = permissions[index]?.moduleScreenMap;
    //             break;
    //         }
    //     }
    //     let othersInteractionAllowed = interactionPermissions?.find(x => x.screenName === OTHERS_INTERACTION || x.screenName === CREATE_INTERACTION)?.accessType === "allow";
    //     if (othersInteractionAllowed) {
    //         setIsModalOpen(true);
    //     } else {
    //         openSelfInteraction();
    //     }
    // }

    const renderMenuItems = (menus) => {
        if (menus) {
            menus.sort((a, b) => a?.menuOrder - b?.menuOrder);

            return menus.map((menu, index) => {
                const hasSubMenus = menu.modules && menu.modules.length > 0;
                const hasScreenItems = menu.moduleScreenMap && menu.moduleScreenMap.length > 0;

                if (hasSubMenus) {
                    const subMenuItems = renderMenuItems(menu.modules);

                    return (
                        <NavDropdown
                            title={
                                <div className="menu-title">
                                    {menu.moduleName}
                                    <ArrowRightIcon className="submenu-arrow" size={16} />
                                </div>
                            }
                            id={`menu-${index}`}
                            key={index}
                            onClick={() => setExpanded(!expanded)}
                        >
                            {subMenuItems}
                            {hasScreenItems && <NavDropdown.Divider />}
                            {hasScreenItems && (
                                <React.Fragment>
                                    {menu.moduleScreenMap
                                        .filter((screen) => screen.accessType !== 'deny')
                                        .map((screen, screenIndex) => {

                                            if (screen.props && screen.props.isPopupSearchEnabled !== undefined) {
                                                return (
                                                    <NavDropdown.Item
                                                        key={screenIndex}
                                                        onClick={() => {
                                                            if (screen.props.isPopupSearchEnabled) {
                                                                handlePopupClick(screen)
                                                            } else {
                                                                openSelfInteraction();
                                                            }
                                                        }}
                                                    >
                                                        {screen.displayName}
                                                    </NavDropdown.Item>
                                                );
                                            }

                                            return (
                                                <NavDropdown.Item
                                                    key={screenIndex}
                                                    as={NavLink}
                                                // href={`/${screen.url}`}
                                                // data={screen.props?.sourceName}
                                                >
                                                    <Link
                                                        to={`/${screen.url}`}
                                                        state={{ sourceName: screen.props?.sourceName }}
                                                    >
                                                        {screen.displayName}

                                                    </Link>
                                                </NavDropdown.Item>
                                            );
                                        })}
                                </React.Fragment>
                            )}
                        </NavDropdown>
                    );
                }

                if (hasScreenItems) {
                    const screenItems = menu.moduleScreenMap
                        .filter((screen) => screen.accessType !== 'deny')
                        .map((screen, screenIndex) => {

                            if (screen.props && screen.props.isPopupSearchEnabled !== undefined) {
                                return (
                                    <NavDropdown.Item
                                        key={screenIndex}
                                        onClick={() => {
                                            if (screen.props.isPopupSearchEnabled) {
                                                handlePopupClick(screen)
                                            } else {
                                                openSelfInteraction();
                                            }
                                        }}
                                    >
                                        {screen.displayName}
                                    </NavDropdown.Item>
                                );
                            }

                            return (
                                <NavDropdown.Item
                                    key={screenIndex}
                                    as={NavLink}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        localStorage.setItem("myWorkspaceTab", null);
                                    }}
                                // data={screen.props?.sourceName}
                                >
                                    <Link
                                        to={`/${screen.url}`}
                                        state={{ sourceName: screen.props?.sourceName }}

                                    >
                                        {screen.displayName}

                                    </Link>
                                </NavDropdown.Item>
                            );
                        });

                    return (
                        <React.Fragment key={index}>
                            <NavDropdown title={<>{menu.moduleName}<ArrowRightIcon className="submenu-arrow" size={36} /></>} id={`menu-${index}`}>
                                {screenItems}
                            </NavDropdown>
                        </React.Fragment>
                    );
                }

                return null;
            });
        }
    };
    const onSetSearchData = (val) => {
        history('/')
    }
    return (
        auth && auth.user ?
            <>
                {/* <Navbar expand="lg">
                    <Navbar.Toggle aria-controls="main-menu" />
                    <Navbar.Collapse id="main-menu"> */}
                {/* <Nav className="mr-auto"> */}
                <div className="navbar-nav mr-auto">
                    {/* <li className="nav-item"> */}
                    {homeMenu?.required && (
                        <a href={`/${homeMenu?.url}`}>
                            <span style={{ display: 'block', width: '100%', padding: '8px 8px', clear: 'both', fontWeight: '400', color: '#fff', textAlign: 'inherit', whiteSpace: 'nowrap', backgroundColor: 'transparent', border: '0' }} title={homeMenu?.name}>{homeMenu?.name}</span>
                        </a>
                    )}
                    {renderMenuItems(mainMenuData)}
                    {/* </li> */}
                </div>
                {/* </Nav>
                    </Navbar.Collapse>
                </Navbar> */}
                <SearchModal
                    data={{
                        addressList,
                        isOpen: isModalOpen,
                        searchInput: searchInput,
                        tableRowData: searchData,
                        tableHeaderColumns: dtWorksProductType === statusConstantCode.type.CUSTOMER_SERVICE ? CustomerSearchColumns : ProfileSearchColumns,
                        tableHiddenColumns: ComplaintCustomerSearchHiddenColumns,
                        currentPage,
                        perPage,
                        totalCount,
                        isTableFirstRender,
                        filters,
                        hasExternalSearch,
                        dataError,
                        appsConfig,
                        openAddress,
                        selectedConsumerNo,
                        anonymous,
                        refresh,
                        type,
                        source
                    }}
                    modalStateHandlers={{
                        setAddressList,
                        setIsOpen: setIsModalOpen,
                        setSearchInput: setSearchInput,
                        onSetSearchData: onSetSearchData,
                        setSearchData: setSearchData,
                        handleSearch: handleOnCustomerSearch,
                        setDataError,
                        setOpenAddress,
                        setSelectedConsumerNo,
                        setAnonymous,
                        setRefresh,
                        setType
                    }}
                    tableStateHandlers={{
                        handleCellLinkClick: handleCellLinkClick,
                        handleCellRender: handleCellRender,
                        handlePageSelect: handlePageSelect,
                        handleItemPerPage: setPerPage,
                        handleCurrentPage: setCurrentPage,
                        handleFilters: setFilters
                    }}
                />

            </> : <></>

    );
};

export default MainMenu;
