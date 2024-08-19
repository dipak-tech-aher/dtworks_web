import React from "react";

const HeaderCount = (props) => {
    let {
        iss,
        issueResolvedWalkin,
        InteractionChannel,
        corner,
        OrderChannel,
        order,
        AppointmentChannel,
        totalAppointment,
        SalesChannel,
        Averagechannel,
        viewType,
        totalRevenueByChannel,
        liveSupport,
        liveSupportData,
        topCustomersByChannel,
        prospect,
        averagePerformanceByChannel,
        appsConfig
    } = props?.data

    const { setIsInteractionByDynamicChannelPopupOpen, setIsOrderByDynamicChannelPopupOpen, setIsAppointmentByChannelPopupOpen,
        filterTopCustomerByChannel,
        setIsTopCustomerByChannelPopupOpen,
        setIsLiveSupportByChannelPopupOpen, filterAppointmentsByChannel, filterLiveSupportByChannel,
        filterProspectByChannel,
        setIsProspectByChannelPopupOpen,
        filterInteractionsByChannelAndBotOrHuman,
        setIsInteractionByChannelPopupOpen,
        filterLiveSupportDataByChannel
    } = props?.handlers;

    let viewTypes = viewType;
    // console.log('viewTypes------>', viewTypes)
    switch (viewTypes) {
        case "WHATSAPP-LIVECHAT":
            viewTypes = 'Whatsapp Live Chat';
            break;
        case "FB-LIVECHAT":
            viewTypes = 'Facebook Live Chat';
            break;
        case "EMAIL":
            viewTypes = 'Email';
            break;
        case "MOBILEAPP":
            viewTypes = 'Mobile APP';
            break;
        case "SELFCARE":
            viewTypes = 'SelfCare';
            break;
        case "TELEGRAM":
            viewTypes = 'Telegram';
            break;
        case "INSTAGRAM":
            viewTypes = 'Instagram';
            break;

        default:
            viewTypes = viewType;
            break;
    }
    const onAppinmentToggle = () => {
        filterAppointmentsByChannel(viewTypes)
        setIsAppointmentByChannelPopupOpen(true);
    }

    return (
        <>

            <div class="wa-detail-list-1">
                <div class="wa-detail-list">
                    <div className="row row-cols-5 mx-lg-n1 mt-2">
                        {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.Interaction?.isActive && <div className="col px-lg-1">
                            <div className="card wa-interaction">
                                <div className="card-body">
                                    <img src={InteractionChannel} alt='' />
                                    <p className="wa-title">Interaction</p>
                                    <p className="wa-value cursor-pointer" onClick={e => { setIsInteractionByDynamicChannelPopupOpen(true); }}>{corner?.length}</p>
                                </div>
                            </div>
                        </div>}
                        {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.Order?.isActive && <div className="col px-lg-1">
                            <div className="card wa-order">
                                <div className="card-body">
                                    <img src={OrderChannel} alt='' />
                                    <p className="wa-title">Order</p>
                                    <p className="wa-value cursor-pointer" onClick={e => { setIsOrderByDynamicChannelPopupOpen(true); }}>{order?.length}</p>
                                </div>
                            </div>
                        </div>}
                        {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.Appointment?.isActive && <div className="col px-lg-1">
                            <div className="card wa-appointment">
                                <div className="card-body">
                                    <img src={AppointmentChannel} alt='' />
                                    <p className="wa-title">Appointment</p>
                                    <p className="wa-value cursor-pointer" onClick={() => onAppinmentToggle()}>{totalAppointment && totalAppointment?.length > 0 && totalAppointment?.filter((ele) => ele?.appointment_channel?.toUpperCase() === viewTypes?.toUpperCase())[0]?.count || 0}</p>
                                </div>
                            </div>
                        </div>}
                        {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.totalSales?.isActive && <div className="col px-lg-1">
                            <div className="card wa-sales">
                                <div className="card-body">
                                    <img src={SalesChannel} alt='' />
                                    <p className="wa-title">Total Sales</p>
                                    <p className="wa-value cursor-pointer">{
                                        totalRevenueByChannel && totalRevenueByChannel?.length > 0 && totalRevenueByChannel?.filter((ele) => ele?.channel?.toUpperCase() === viewTypes?.toUpperCase())[0]?.count || 0
                                    }</p>
                                </div>
                            </div>
                        </div>}
                        {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.avgPerformance?.isActive && <div className="col px-lg-1">
                            <div className="card wa-performance">
                                <div className="card-body">
                                    <img src={Averagechannel} alt='' />
                                    <p className="wa-title">Avg. Performance</p>
                                    <p className="wa-value cursor-pointer">{averagePerformanceByChannel && averagePerformanceByChannel?.length > 0 ? averagePerformanceByChannel[0]?.average ??0 : 0}%</p>
                                </div>
                            </div>
                        </div>}
                    </div>
                </div>
                <div className="row mx-lg-n1 mt-2">
                    {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.prospectGenerated?.isActive && <div className="col px-lg-1">
                        <div className="card pg">
                            <div className="card-body">
                                <p className="wa-title">Prospect Generated</p>
                                <p className="wa-value" onClick={e => {
                                    filterProspectByChannel(viewTypes); setIsProspectByChannelPopupOpen(true);
                                }}>{prospect?.filter((ele) => ele?.prospect_channel?.toUpperCase() === viewTypes?.toUpperCase())[0]?.count || 0}</p>
                            </div>
                        </div>
                    </div>}
                    {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.totalCustomersBy?.isActive && <div className="col px-lg-1">
                        <div className="card tc">
                            <div className="card-body">
                                <p className="wa-title">Total {`${appsConfig?.clientFacingName?.customer}s`}</p>
                                <p className="wa-value cursor-pointer"> {
                                    topCustomersByChannel && topCustomersByChannel?.length > 0 &&
                                        topCustomersByChannel?.filter((ele) => ele?.topCustomer_channel?.toUpperCase() === viewTypes?.toUpperCase())?.length > 0 ?

                                        topCustomersByChannel?.filter((ele) => ele?.topCustomer_channel?.toUpperCase() === viewTypes?.toUpperCase())?.map((x) => (
                                            <span className="font-21" onClick={e => {
                                                filterTopCustomerByChannel(x?.topCustomer_channel);
                                                setIsTopCustomerByChannelPopupOpen(true);
                                            }}>
                                                {x?.count || 0}
                                            </span>))
                                        : <span className="font-21">0</span>
                                }</p>
                            </div>
                        </div>
                    </div>}
                    {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.liveSupportBy?.isActive && <div className="col px-lg-1">
                        <div className="card ls">
                            <div className="card-body">
                                <p className="wa-title">Live Support</p>
                                <p className="wa-value cursor-pointer">
                                    <p className="font-21" onClick={e => {
                                        filterLiveSupportDataByChannel(viewTypes);
                                        setIsLiveSupportByChannelPopupOpen(true);
                                    }}>
                                        {liveSupportData?.filter((ele) => ele?.channel_desc?.toUpperCase() === viewTypes?.toUpperCase()).length}
                                    </p>
                                </p>
                                {/* <p className="wa-value">{
                                    liveSupportData?.filter((ele) => ele?.channel_desc?.toUpperCase() === viewTypes?.toUpperCase())?.map((x) => (
                                        <span className="font-21" onClick={e => {
                                            filterLiveSupportDataByChannel(x?.channel_desc);
                                            setIsLiveSupportByChannelPopupOpen(true);
                                        }}>
                                            {liveSupportData && liveSupportData?.length > 0 && liveSupportData?.filter((ele) => ele?.channel_desc?.toUpperCase() === viewTypes?.toUpperCase())?.length || 0}
                                        </span>)
                                    )
                                }</p> */}
                            </div>
                        </div>
                    </div>}
                    {appsConfig?.clientConfig?.omniChannelDashboard?.headerCount?.issueResolvedBy?.isActive && <div className="col-4 px-lg-1 col-with-5">
                        <div className="card isb">
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-4 align-content-center border-r">
                                        <p className="wa-title">Issues Solved By</p>
                                    </div>
                                    <div className="col-md">
                                        {Object.keys(issueResolvedWalkin)?.length > 0 ? <>{Object.keys(issueResolvedWalkin)?.map((x) => (
                                            <>
                                                <p className="wa-value pl-3" onClick={e => {
                                                    filterInteractionsByChannelAndBotOrHuman(x, 'BOT');
                                                    setIsInteractionByChannelPopupOpen(true);
                                                }}><span className="font-weight-normal w-25 d-inline-block mr-3" >BOTS</span> {issueResolvedWalkin[x]?.bot || 0}%
                                                </p>
                                                <p className="wa-value pl-3" onClick={e => {
                                                    filterInteractionsByChannelAndBotOrHuman(x, 'BOT');
                                                    setIsInteractionByChannelPopupOpen(true);
                                                }}><span className="font-weight-normal w-25 d-inline-block mr-3" >Humans</span>{issueResolvedWalkin[x]?.human || 0}%</p>
                                            </>
                                        ))}</> : <>
                                            <p className="wa-value pl-3"><span className="font-weight-normal w-25 d-inline-block mr-3">BOTS</span> 0%</p>
                                            <p className="wa-value pl-3"><span className="font-weight-normal w-25 d-inline-block mr-3">Humans</span> 0%</p>
                                        </>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
                </div>
            </div>

        </>
    )
}

export default HeaderCount;