import React, { useContext } from 'react'
import { AppContext } from '../../../../AppContext';
import SuspenseFallbackLoader from '../../../../common/components/SuspenseFallbackLoader';
import OrderOverview from '../OrderOverview';
import SignupsVsSignouts from '../SignupsVsSignouts';
import TotalCustomers from '../TotalCustomers';
import OrderDeliveryTime from '../OrderDeliveryTime';
import OverallAgeing from '../OverallAgeing';
import OnTimeDeliveryRate from '../OnTimeDeliveryRate';
import OrderAccuracyRate from '../OrderAccuracyRate';
import ServiceActivationSuccessRate from '../ServiceActivationSuccessRate';
import AverageHandlingTime from '../AverageHandlingTime';
import AverageOrderValue from '../AverageOrderValue';
import ChurnRate from '../ChurnRate';
import OrderByRevenue from '../OrderByRevenue';
import CustomersByOrderValueVsOrderCount from '../CustomersByOrderValueVsOrderCount';
import ProductsByOrderValueVsOrderCount from '../ProductsByOrderValueVsOrderCount';
import TotalStats from '../TotalStats';
import SlaAgeing from '../SlaAgeing';
import OrderFulfillmentTime from '../OrderFulfillmentTime';

const ExportOmsDashboard = React.forwardRef((props, ref) => {
    const { appConfig } = useContext(AppContext), { pdf = false, data } = props
    return (
        <>
            <div className="visible-print-export" ref={ref}>
                <div className="page-header">
                    <div className="">
                        <div className="row col-12 p-0 m-0">
                            <table width="100%" className="pr-5">
                                {pdf && <tbody>
                                    <tr>
                                        <td width="100%" className="pl-2">
                                            <div className="logo logo-light">
                                                <span className="logo-lg">
                                                    <img
                                                        src={appConfig?.appLogo}
                                                        alt=""
                                                        height="60px"
                                                    />
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                                }
                            </table>
                        </div>
                    </div>
                </div>
                <table className="w-100">
                    <thead>
                        <tr>
                            <td>
                                <div className="page-header-space" />
                            </td>
                        </tr>
                    </thead>
                    {pdf && <tbody>
                        <tr>
                            <td>
                                <div className="page">
                                    <div className="col-12 conatainer p-2">
                                        <div className="row px-0 mx-0">
                                            <div className="w-100">
                                                <table className="w-100 mb-3">
                                                    <tbody>
                                                        <tr>
                                                            <td colSpan={2}>
                                                                <div className="row mx-lg-n1">
                                                                    <TotalStats
                                                                        data={{ apiCall: false }}
                                                                        loader={SuspenseFallbackLoader}
                                                                    />
                                                                    <OrderOverview
                                                                        data={{ apiCall: false }}
                                                                        loader={SuspenseFallbackLoader}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <SignupsVsSignouts
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <TotalCustomers
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <OverallAgeing
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <SlaAgeing
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <OrderFulfillmentTime
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <OrderDeliveryTime
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                        {/* <tr>
                                                            <td>
                                                                <OnTimeDeliveryRate
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                 <OrderAccuracyRate
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                /> 
                                                            </td>
                                                        </tr> */}
                                                        {/* <tr>
                                                            <td>
                                                                <ServiceActivationSuccessRate
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <AverageHandlingTime
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr> */}
                                                        <tr>
                                                            <td>
                                                                <AverageOrderValue
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <ChurnRate
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <OrderByRevenue
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <CustomersByOrderValueVsOrderCount
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <ProductsByOrderValueVsOrderCount
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                            <td>
                                                                <AverageHandlingTime
                                                                    data={{ apiCall: false }}
                                                                    loader={SuspenseFallbackLoader}
                                                                />
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>}
                </table>
            </div>
        </>
    )
});

export default ExportOmsDashboard;
