import React, { useEffect, useState } from 'react';
import ImgLiveStream from "../../assets/images/livestream.svg";
import ImgDashIcon from "../../assets/images/dashboard-icons.svg";
import Service360Informative from './sections/s360-informative';
import Service360Insight from './sections/s360-insight';
import { Service360Context } from '../../AppContext';
import { post, get } from '../../common/util/restUtil';
import { properties } from '../../properties';
import moment from 'moment'
const Service360 = (props) => {

    const viewServiceData = JSON.parse(localStorage.getItem('viewServiceData'))
    const subscriptionData = props?.location?.state?.data ? props?.location?.state?.data : viewServiceData;
    // console.log(subscriptionData)
    const [currentView, setCurrentView] = useState('informative-view');
    const [masterDataLookup, setMasterDataLookup] = useState({});
    const [activeAppointments, setActiveAppointments] = useState([]);
    const [apptPopup, setApptPopup] = useState(false)

    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOutstanding: 0,
        totalActiveAppoints: 0,
        latestBillDate: '-'
    })
    const serviceStatus = subscriptionData?.serviceStatus;
    const accountStatus = subscriptionData?.accountDetails?.accountStatus;
    const [refreshPage, setRefreshPage] = useState(true);

    const pageRefresh = () => {
        setRefreshPage(!refreshPage);
    };

    useEffect(() => {
        if (subscriptionData?.serviceUuid) {
            post(`${properties.INVOICE_API}/invoice-count`, { serviceUuid: subscriptionData?.serviceUuid })
                .then((resp) => {
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalRevenue: resp.data?.rows?.[0].totalRevenue ? Number(resp.data?.rows?.[0].totalRevenue).toFixed(2) : 0,
                        totalOutstanding: resp.data?.rows?.[0].totalOutstanding ? Number(resp.data?.rows?.[0].totalOutstanding).toFixed(2) : 0,
                    }));
                })
                .catch((error) => {
                    console.error("Error fetching invoice data:", error);
                });
            post(`${properties.INVOICE_API}/search?limit=${10}&page=${0}`, { serviceUuid: subscriptionData?.serviceUuid })
                .then((response) => {
                    if (Number(response?.data?.count) > 0) {
                        const { rows, count } = response?.data
                        setStats((prevStats) => ({
                            ...prevStats,
                            latestBillDate: rows?.[0].dueDate && rows?.[0].invoiceStatus === 'OPEN' ? moment(rows?.[0].dueDate).format('YYYY-MM-DD') : null
                        }));

                    }
                })
                .catch((error) => {
                    console.error("Error while getting Invoice List:", error)
                })
        }
        if (subscriptionData?.customerDetails) {
            get(`${properties.APPOINTMENT_API}/customer/${subscriptionData?.customerDetails?.customerId}`)
                .then((resp) => {
                    const activeAppoints = resp.data?.filter(appointment => appointment.status.code === 'AS_SCHED' && appointment.serviceUuid === subscriptionData?.serviceUuid);
                    setActiveAppointments(activeAppoints)
                    setStats((prevStats) => ({
                        ...prevStats,
                        totalActiveAppoints: activeAppoints?.length || 0
                    }));
                })
                .catch((error) => {
                    console.error("Error fetching appointments data:", error);
                });
        }

    }, [refreshPage]);

    const contextProvider = {
        data: {
            masterDataLookup,
            subscriptionDetails: subscriptionData,
            stats,
            activeAppointments,
            apptPopup,
        },
        handlers: {
            pageRefresh,
            setApptPopup

        }
    }

    useEffect(() => {
        get(properties.MASTER_API + "/lookup?searchParam=code_type&valueParam=PRODUCT_BENEFIT,HELPDESK_TYPE,INTXN_TYPE,ORDER_TYPE").then((response) => {
            if (response.data) {
                setMasterDataLookup({
                    PRODUCT_BENEFIT: response.data.PRODUCT_BENEFIT,
                    HELPDESK_TYPE: response.data.HELPDESK_TYPE,
                    INTXN_TYPE: response.data.INTXN_TYPE,
                    ORDER_TYPE: response.data.ORDER_TYPE
                })
            }
        }).catch((error) => {
            console.error(error);
        });
    }, [])

    return (
        <Service360Context.Provider value={contextProvider}>
            <div className="cmmn-skeleton mt-2">
                <div className="skel-i360-base">
                    <div className="skel-intcard">
                        <div className="skel-flex-card-int mb-1">
                            <span className="skel-profile-heading mb-1">{subscriptionData?.serviceNo}</span>
                            <span style={{ backgroundColor: serviceStatus?.mappingPayload?.iconColor }} className="status-active ml-1">{serviceStatus?.description}</span>
                        </div>
                        <div> Account ID: {subscriptionData?.accountDetails?.accountNo} <i className={`fas ${accountStatus?.mappingPayload?.icon} ml-1`} style={{ color: accountStatus?.mappingPayload?.iconColor }} /></div>
                    </div>
                    <div className="skel-intcard-insight">
                        <div className="db-list mb-0 pl-0">
                            <div onClick={() => setCurrentView(currentView === 'informative-view' ? 'insight-view' : 'informative-view')} className={`list-dashboard db-list-active cursor-pointer`}>
                                <span className="db-title">
                                    <img src={currentView === 'informative-view' ? ImgLiveStream : ImgDashIcon} className="img-fluid pr-1" /> Switch to {currentView === 'informative-view' ? 'Insight' : 'Informative'} View
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {currentView === 'informative-view' ? (
                <Service360Informative />
            ) : (
                <Service360Insight />
            )}
        </Service360Context.Provider>
    )
}

export default Service360;