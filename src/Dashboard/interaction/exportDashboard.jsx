import React, { useContext } from 'react'
import { AppContext } from '../../AppContext';
import Overview from './overview';
import SuspenseFallbackLoader from '../../common/components/SuspenseFallbackLoader';
import AgeingVsFollowups from './ageing-vs-followups';
import StatusWise from './status-wise';
import TypeWise from './type-wise';
import Priority from './by-priority';
import CategoryType from './category-and-type';
import ProjectWise from './project-wise';
import AgentWise from './agent-wise';
import DeptVsRole from './dept-vs-role';
import CustomerWise from './customer-wise';
import StatementWise from './statement-wise';
import ChannelWise from './channel-wise';
import BlankExpectedDateCompletionInteraction from './BlankExpectedDateCompletionInteraction';
import ExpectedDateOfCompletionBreachSLA from './ExpectedDateOfCompletionBreachSLA';
const ExportDashboard = React.forwardRef((props, ref) => {
    const { appLogo } = useContext(AppContext), { pdf = false, data } = props

    return (
        <div className="visible-print-export" id='teszz' ref={ref}>
            <div className="page-header">
                <div className=''>
                    <div className="row col-12 p-0 m-0">
                        <table width='100%' className='pr-5'>
                            <tr>
                                <td width='100%' className='pl-2'>
                                    <div className="logo logo-light">
                                        <span className="logo-lg">
                                            <img src={appLogo} alt="" height="60px" />
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <td>

                            <div className="page-header-space"></div>
                        </td>
                    </tr>
                </thead>

                {pdf && <tbody>
                    <tr>
                        <td>
                            <div className="page">
                                <div className="col-12 conatainer p-2">
                                    <div className="row px-0 mx-0">
                                        <table width="100%">
                                            <tr>
                                                <td width="50%">
                                                    <div className="row m-1">
                                                    <div class="col-md-12 col-sm-12 h-100">
                                                    <Overview
                                                        data={{ apicall: false, exportData: data?.overview }}
                                                        // data={{ apicall: false, exportData: stateRef?.current?.overview }}
                                                        loader={SuspenseFallbackLoader}
                                                        />
                                                        </div></div>
                                                </td>
                                                <td width="50%">
                                                    <div className="row m-1">
                                                        <div class="col-md-12 col-sm-12 h-100">
                                                    <AgeingVsFollowups
                                                        data={{ apicall: false, exportData: data?.ageingVSfollow }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                            </tr>
                                            <tr>
                                                {/* <td>
                                                    <StatusWise
                                                        data={{ apicall: false, exportData: data?.statusWise }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td>
                                                <td>
                                                    <TypeWise
                                                        data={{ apicall: false, exportData: data?.typeWise }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td> */}
                                                <td width="50%">
                                                    <div className="row m-1">
                                                        <div class="col-md-12 col-sm-12">
                                                    <Priority
                                                        data={{ apicall: false, exportData: data?.priorityWise }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                                        <td width="50%">
                                                    <div className="row m-1">
                                                                <div class="col-md-12 col-sm-12">
                                                    <CategoryType
                                                        data={{
                                                            height: "350px",
                                                            mode: "interaction",
                                                            level: "category",
                                                            color: "#5470c6",
                                                            apicall: false,
                                                            exportData: data['interaction-category'] ?? {}
                                                        }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                            </tr>
                                            <tr>
                                               
                                                                <td width="50%">
                                                    <div className="row m-1">
                                                                        <div class="col-md-12 col-sm-12">
                                                    <CategoryType
                                                        data={{
                                                            height: "350px",
                                                            mode: "interaction",
                                                            level: "type",
                                                            color: "#26a0fc",
                                                            apicall: false,
                                                            exportData: data[`interaction-type`] ?? {}
                                                        }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                                                        <td width="50%">
                                                    <div className="row m-1">
                                                                                <div class="col-md-12 col-sm-12">
                                                    <CategoryType
                                                        data={{
                                                            height: "350px",
                                                            mode: "service",
                                                            level: "category",
                                                            color: "#5470c6",
                                                            apicall: false,
                                                            exportData: data[`service-category`] ?? {}
                                                        }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                               
                                            </tr>
                                            <tr>
                                                                                <td width="50%">
                                                    <div className="row m-1">
                                                                                        <div class="col-md-12 col-sm-12">
                                                    <CategoryType
                                                        data={{
                                                            height: "240px",
                                                            mode: "service",
                                                            level: "type",
                                                            color: "#26a0fc",
                                                            apicall: false,
                                                            exportData: data[`service-type`] ?? {}
                                                        }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>
                                                {/* <td>
                                                    <ProjectWise
                                                        data={{ apicall: false, exportData: data?.projectWise }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td>
                                                <td>
                                                    <AgentWise
                                                        data={{ apicall: false, exportData: data?.agentWise }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td> */}
                                                {/* <td>
                                                    <DeptVsRole
                                                        data={{ apicall: false, exportData: data?.deptRole }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td> */}
                                                                                        <td width="50%">
                                                    <div className="row m-1">
                                                                                                <div class="col-md-12 col-sm-12">
                                                    <CustomerWise
                                                        data={{
                                                            apicall: false, exportData: data?.customerWiseData
                                                        }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>

                                            </tr>

                                           
                                            <tr>

                                                                                                <td width="50%">
                                                    <div className="row m-1">
                                                                                                        <div class="col-md-12 col-sm-12">
                                                    <StatementWise
                                                        data={{ apicall: false, exportData: data?.statementWiseData }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>


                                                                                                        <td width="50%">
                                                    <div className="row m-1">
                                                                                                                <div class="col-md-12 col-sm-12">
                                                    <ChannelWise
                                                        data={{ apicall: false, exportData: data?.channelWiseData }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>

                                            </tr>
                                            <tr>

                                                {/* <td>
                                                    <BlankExpectedDateCompletionInteraction
                                                        data={{ apicall: false, exportData: data?.blankExpectedDateComplietionInteraction }}
                                                        loader={SuspenseFallbackLoader}
                                                    />
                                                </td> */}

                                                                                                                <td width="50%">
                                                    <div className="row">
                                                                                                                        <div class="col-md-12 col-sm-12">
                                                    <ExpectedDateOfCompletionBreachSLA
                                                        data={{ apicall: false, exportData: data?.blankExpectedDateComplietionBreachSLA }}
                                                        loader={SuspenseFallbackLoader}
                                                            />
                                                        </div></div>
                                                </td>

                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                        </td>
                    </tr>
                </tbody>}
            </table>
        </div >


    )
});
export default ExportDashboard;
