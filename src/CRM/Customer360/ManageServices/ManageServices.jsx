import React, { useEffect, useState, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { properties } from '../../../properties';
import { get, post } from '../../../common/util/restUtil';
import { getPermissions } from '../../../common/util/util';
import AddonTabPane from './ManageAddon/AddonTabPane';
import DetailsTabPane from './ManageCatalog/DetailsTabPane';
import TerminateTabPane from './ManageCatalog/TerminateTabPane';
import UpgradeDowngradeTabPane from './ManageCatalog/UpgradeDowngradeTabPane';
import { CloseButton, Modal } from 'react-bootstrap';

const ManageService = (props) => {
    const [permission, setPermission] = useState({})
    const [componentPermission, setComponentPermission] = useState({})
    const { isManageServicesOpen, manageServiceRef, selectedAccount, productBenefitLookup } = props.data;
    const type = manageServiceRef.current?.source ? manageServiceRef.current?.source : ''
    const { setIsManageServicesOpen, pageRefresh } = props.handlers;
    const [serviceBadge, setServiceBadge] = useState("")
    const [interactionTerminationData, setInteractionTerminationData] = useState([])
    const [activeTab, setActiveTab] = useState(0);
    const handleTabChange = (tabIndex) => {
        setActiveTab(tabIndex)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permissions = await getPermissions('VIEW_CUSTOMER');
                setPermission(permissions);
            } catch (error) {
                console.error('Error fetching permissions:', error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (permission && Array.isArray(permission?.components) && permission?.components?.length > 0) {
            if (permission?.accessType === 'allow') {
                let componentPermissions = {}
                permission?.components?.forEach(component => {
                    componentPermissions[component.componentCode] = component.accessType;
                });
                setComponentPermission(componentPermissions)
            }
        }
    }, [permission])


    const checkComponentPermission = useCallback((permission) => {
        if (componentPermission && componentPermission[permission]) {
            return componentPermission[permission] === 'allow'
        }
        return false
    }, [componentPermission])

    // useEffect(() => {

    //     get(`${properties.ACCOUNT_DETAILS_API}/service-badge/${manageServiceRef?.current?.customerUuid}?accountUuid=${manageServiceRef?.current?.accountUuid}&serviceUuid=${manageServiceRef?.current?.serviceUuid}`)
    //         .then((resp) => {
    //             unstable_batchedUpdates(() => {
    //                 setServiceBadge(resp?.data?.badge)
    //             })
    //             if (resp?.data?.badge === "TERMINATE") {

    //                 let reqBody = {
    //                     customerId: selectedAccount?.customerId,
    //                     accountId: selectedAccount?.accountId,
    //                     connectionId: manageServiceRef.current?.serviceObject?.connectionId
    //                 }
    //                 post(properties.INTERACTION_API + "/interaction-detail", reqBody)
    //                     .then((resp) => {
    //                         unstable_batchedUpdates(() => {
    //                             setInteractionTerminationData(resp?.data)
    //                         })
    //                     }).catch((error) => {
    //                         console.log(error)
    //                     })
    //                     .finally()
    //             }
    //         }).catch((error) => {
    //             console.log(error)
    //         })
    //         .finally()
    // }, [])

    return (
        <>
            <Modal.Header>
                <Modal.Title>
                    <h4 className="modal-title">Service Details - {manageServiceRef.current.serviceName}</h4>
                </Modal.Title>
                <CloseButton onClick={() => setIsManageServicesOpen(false)} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    {/* <span>×</span> */}
                </CloseButton>
            </Modal.Header>
            <Modal.Body>

                {/* <Modal isOpen={isManageServicesOpen} contentLabel="Worflow History Modal" style={RegularModalCustomStyles}>
        <div className="modal-dialog modal-lg m-0 mx-w-100">
            <div className="modal-content">
                <div className="modal-header p-2">
                    <h4 className="modal-title">{manageServiceRef.current.accountNo}</h4>
                    <button type="button" className="close" onClick={() => setIsManageServicesOpen(false)}>×</button>
                </div> */}

                <div className="modal-body p-0 mt-1">
                    <ul className="nav nav-tabs">
                        <li className="nav-item ">
                            <a href="#manageCatalog" data-toggle="tab" aria-expanded="false" className="nav-link active"
                                onClick={() => { handleTabChange(0) }}
                            >
                                Manage Service
                            </a>
                        </li>
                        <li className="nav-item">
                            <a href="#manageAddon" data-toggle="tab" aria-expanded="true" className="nav-link"
                                onClick={() => { handleTabChange(4) }}
                            >
                                Manage Addon
                            </a>
                        </li>
                    </ul>
                    <div className="tab-content p-2 panelbg border">
                        <div className="tab-pane active" id="manageCatalog">
                            <div className="row mt-1">
                                <div className="col-lg-12 row pr-0">
                                    <div className="col-lg-2">
                                        <ul className="nav flex-column">
                                            <li className="nav-item">
                                                <a href="#details" data-toggle="tab" aria-expanded="true" className={`nav-link list-group-item list-group-item-action ${activeTab === 0 ? "active" : ""}`}
                                                    onClick={() => { handleTabChange(0) }}
                                                >
                                                    Service Details
                                                </a>
                                            </li>
                                            {/*TODO: Need to allow only postpaid and fixed service for below options */}
                                            {(["PST_POST", "PST_FIXED"].includes(manageServiceRef?.current?.srvcCatDesc?.code) || ["ST_POSTPAID", "ST_FIXED", "ST_HSBB"].includes(manageServiceRef?.current?.srvcTypeDesc?.code)) && (
                                                <React.Fragment>
                                                    <li className="nav-item">
                                                        <a href="#upgrade" data-toggle="tab" aria-expanded="true" className={`nav-link list-group-item list-group-item-action ${activeTab === 1 ? "active" : ""}`}
                                                            onClick={() => { handleTabChange(1) }}
                                                        >
                                                            Upgrade
                                                        </a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a href="#downgrade" data-toggle="tab" aria-expanded="true" className={`nav-link list-group-item list-group-item-action ${activeTab === 2 ? "active" : ""}`}
                                                            onClick={() => { handleTabChange(2) }}
                                                        >
                                                            Downgrade
                                                        </a>
                                                    </li>
                                                    <li className="nav-item">
                                                        <a href="#terminate" data-toggle="tab" aria-expanded="true" className={`nav-link list-group-item list-group-item-action ${activeTab === 3 ? "active" : ""}`}
                                                            onClick={() => { handleTabChange(3) }}
                                                        >
                                                            Terminate
                                                        </a>
                                                    </li>
                                                </React.Fragment>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="col-lg-10 p-0">
                                        <div className="tab-content p-0">
                                            {(() => {
                                                switch (activeTab) {
                                                    case 0:
                                                        return (
                                                            <div className={`tab-pane ${activeTab === 0 ? "active" : ""}`} id="details">
                                                                <DetailsTabPane
                                                                    data={{
                                                                        manageServiceRef,
                                                                        serviceBadge
                                                                    }}
                                                                    handlers={{ checkComponentPermission }}
                                                                />
                                                            </div>
                                                        );
                                                    case 1:
                                                        return (
                                                            <div className={`tab-pane ${activeTab === 1 ? "active" : ""}`} id="upgrade">
                                                                <UpgradeDowngradeTabPane
                                                                    data={{
                                                                        manageServiceRef,
                                                                        upgradeDowngradeType: "UPGRADE",
                                                                        selectedAccount,
                                                                        serviceBadge,
                                                                        productBenefitLookup
                                                                    }}
                                                                    handlers={{
                                                                        setIsManageServicesOpen,
                                                                        pageRefresh
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    case 2:
                                                        return (
                                                            <div className={`tab-pane ${activeTab === 2 ? "active" : ""}`} id="downgrade">
                                                                <UpgradeDowngradeTabPane
                                                                    data={{
                                                                        manageServiceRef,
                                                                        upgradeDowngradeType: "DOWNGRADE",
                                                                        selectedAccount,
                                                                        serviceBadge
                                                                    }}
                                                                    handlers={{
                                                                        setIsManageServicesOpen,
                                                                        pageRefresh
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    case 3:
                                                        return (
                                                            <div className={`tab-pane ${activeTab === 3 ? "active" : ""}`} id="terminate">
                                                                <TerminateTabPane
                                                                    data={{
                                                                        manageServiceRef,
                                                                        selectedAccount,
                                                                        serviceBadge,
                                                                        interactionTerminationData
                                                                    }}
                                                                    handlers={{
                                                                        setIsManageServicesOpen,
                                                                        pageRefresh
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    default:
                                                        return (
                                                            <div className={`tab-pane ${activeTab === 4 ? "active" : ""}`} id="details">
                                                                <DetailsTabPane
                                                                    data={{
                                                                        manageServiceRef,
                                                                        serviceBadge
                                                                    }}
                                                                    handlers={{ checkComponentPermission }}
                                                                />
                                                            </div>
                                                        );
                                                }
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="tab-pane" id="manageAddon">
                            {
                                activeTab === 4 &&
                                <AddonTabPane
                                    data={{
                                        manageServiceRef,
                                        selectedAccount,
                                        serviceBadge
                                    }}
                                    handlers={{
                                        setIsManageServicesOpen,
                                        pageRefresh
                                    }}
                                />
                            }
                        </div>
                    </div>
                </div>
            </Modal.Body>
            {/* </div>
        </div>
        </Modal> */}
        </>
    )
}

export default ManageService;