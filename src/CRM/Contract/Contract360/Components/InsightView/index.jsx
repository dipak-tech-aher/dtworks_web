import { useContext, useEffect, useState } from "react"
import { Contract360Context } from "../../../../../AppContext"
import ContractKPI from "./ContractKPI"
import ContractOriginalVsAmendmentValue from "./Components/ContractOriginalVsAmendmentValue"
import BilledVsUnbilledContract from "./Components/BilledVsUnbilledContract"
import TotalinteractionsWithinSLAVsOutsideSLA from "./Components/TotalinteractionsWithinSLAVsOutsideSLA"
import SLATargetTimeVsAchievedTime from "./Components/SLATargetTimeVsAchievedTime"
import SLAAverageResolAndRespTime from "./Components/SLAAverageResolAndRespTime"
import TotalContractVsRemainingOwe from "./Components/TotalContractVsRemainingOwe"
import TotalTermsVsRemainingTerms from "./Components/TotalTermsVsRemainingTerms"

const ContractInsightView = (props) => {
    const { data: { customerDetails, contractData } } = useContext(Contract360Context);

    const [tabType, setTabType] = useState('CURRENT');

    return (
        <div class="skel-informative-data mt-2 mb-2" >
            <div className="row mx-lg-n1" >
                <ContractKPI type={tabType} />
                <div className="row mx-auto my-2">
                    <div className="btn-group btn-group-tab btn-group-sm" role="group" aria-label="">
                        <button type="button" className={`btn btn-light  p-2 ${tabType == 'CURRENT' ? 'active' : ''}`} id="overall-contract" onClick={() => setTabType('CURRENT')}><span className="h5">Current Contract</span></button>
                        <button type="button" className={`btn btn-light  p-2 ${tabType == 'OVERALL' ? 'active' : ''}`} id="current-contract" onClick={() => setTabType('OVERALL')}><span className="h5">Overall Contract</span></button>
                    </div>
                </div>
                <div class="row overall-contract">
                    <ContractOriginalVsAmendmentValue type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <TotalContractVsRemainingOwe type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <SLATargetTimeVsAchievedTime type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <TotalTermsVsRemainingTerms type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <TotalinteractionsWithinSLAVsOutsideSLA type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <SLAAverageResolAndRespTime type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    <BilledVsUnbilledContract type={tabType} contractData={contractData} customerDetails={customerDetails} />

                    {/* <div class="col-md-12 mb-2 px-lg-1">
                    <div class="cmmn-skeleton h-100">
                        <div class="skel-dashboard-title-base">
                            <span class="skel-header-title">Download Contracts</span>
                        </div>
                        <hr class="cmmn-hline" />
                        <div class="skel-graph-sect mt-2">
                            <div class="row mb-0">
                                <div class="col-md-auto ml-auto">
                                    <a href="Orderprint.html" target="_blank"> <i class="fa fa-file-pdf mr-2"></i>Download PDF</a>
                                </div>
                            </div>
                            <div class="cust-table">
                                <table role="table" class="table table-responsive table-striped dt-responsive nowrap w-100"
                                    style={{ textAlign: "center", marginLeft: "0px" }}>
                                    <thead>
                                        <tr role="row">
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", flexDirection: "row" }} className="font-weight-bold">
                                                    <input type="checkbox" /><span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Contract ID<span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Contract Name<span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Customer ID<span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Customer Name<span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Contract Start Date<span></span></div>
                                            </th>
                                            <th colspan="1" role="columnheader">
                                                <div style={{ display: "flex", justifyContent: "center", flexDirection: "row" }} class="font-weight-bold">Contract End Date<span></span></div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr role="row" class="">
                                            <td colspan="1" role="columnheader">
                                                <div style={{ display: "flex", flexDirection: "row" }} className="font-weight-bold">
                                                    <input type="checkbox" /><span></span></div>
                                            </td>
                                            <td><span>CONT0000001</span></td>
                                            <td><span>Contract Name</span></td>
                                            <td><span>CUST0000001</span></td>
                                            <td><span>Will Smith</span></td>
                                            <td><span>24-01-2024</span></td>
                                            <td><span>24-01-2026</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div> */}
                </div>
            </div>
        </div>
    )
}

export default ContractInsightView