import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Contract360Context } from '../../../../../AppContext'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { convertSecondsToDays } from '../../../../../common/util/util';
import { unstable_batchedUpdates } from 'react-dom';

export default function ContractKPI() {
    const { data: { contractData } } = useContext(Contract360Context);
    const [KPIData, setKPIData] = useState({})
    const [isHovered, setIsHovered] = useState(false);
    const [OweValue, setOweValue] = useState(0)
    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);
    const [totalBillingContractValue, setTotalBillingContractValue] = useState(0);

    const getOweValue = useCallback(() => {
        if (contractData?.contractId) {
            post(`${properties.CONTRACT_API}/360/getOweValue`, { searchParams: { contractId: contractData?.contractId } })
                .then((resp) => {
                    if (resp?.status === 200) {
                        setOweValue(resp?.data)
                    }
                }).catch((error) => console.error(error))


            let contractValue = 0;

            const duration = contractData?.contractDetail?.find(c => c.chargeType === 'CC_RC')?.durationMonth || 1;
            let productQuantity = contractData?.contractDetail?.find(c => c.chargeType === 'CC_RC')?.quantity || 1
            let rcAmount = Number(contractData?.rcAmount).toFixed(2) * Number(duration)
            let nrcAmount = Number(contractData?.otcAmount).toFixed(2)
            contractValue = (Number(rcAmount || 0) + Number(nrcAmount || 0)) * Number(productQuantity)

            // for (const cd of contractData.contractDetail) {
            //     contractValue += Number(cd.chargeAmt) * Number(cd.durationMonth);
            // }
            unstable_batchedUpdates(() => {
                //     // setScheduleContract(response?.data);
                setTotalBillingContractValue(contractValue);
                //     // setSliderDetails(response?.data?.rows?.[0]?.billing?.[0])
            })
        }
    }, [contractData?.contractId])

    useEffect(() => {
        const getCardDetails = () => {
            try {
                post(`${properties.CONTRACT_API}/360/kpi`, {
                    searchParams: {
                        contractId: contractData?.contractId
                    }
                }).then(res => {
                    setKPIData(res?.data)

                }).catch(error => console.log(error))
            } catch (error) {

            }
        }
        if (contractData?.contractId) {
            getOweValue();
            getCardDetails();
        }
    }, [contractData?.contractId])

    return (
        <div className="row my-2 mx-lg-n1 service-360-tiles">
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton top m-0 h-100">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">Total Contract Value</p>
                            <p className="mb-0 font-weight-bold">${totalBillingContractValue || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton tr m-0 h-100">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="fa fa-dollar-sign" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">Remaining Owe Value</p>
                            <p className="mb-0 font-weight-bold">${OweValue ? OweValue.toFixed(2) : 0}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton toa m-0 h-100">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="far fa-chart-bar" />
                                <i className="fa-solid fa-chart-simple" />
                            </div>
                        </div>
                        <div className="col-md pl-0 d-flex flex-row position-relative">
                            <div>
                                <p className="mb-0">Performace</p>
                                <p className="mb-0 font-weight-bold">
                                    {KPIData?.performance_rate?.o_rate ?? 0}%
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width={16}
                                        height={16}
                                        fill="#f00"
                                        className="bi bi-arrow-down"
                                        viewBox="0 0 16 16"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"
                                        />
                                    </svg>
                                </p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-secondary performance-info ml-3 bg-white text-primary"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={16}
                                    height={16}
                                    fill="currentColor"
                                    className="bi bi-info-circle"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
                                </svg>
                            </button>
                            <div
                                className={`"erformance-impact-history position-absolute bg-white p-3 border-radius shadow mt-4 ${isHovered ? '' : 'd-none'}`}
                                style={{ width: 400, zIndex: 1 }}
                            >
                                <h4>Performace Impact History</h4>
                                <ul className="list-group list-group-numbered">
                                    <li>Payment impacted</li>
                                    <li>Billing impacted</li>
                                    <li>Benefits impacted</li>
                                    <li>Service impacted</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton taa m-0 h-100">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="far fa-clock" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">Average Resolution Time</p>
                            <p className="mb-0 font-weight-bold">{convertSecondsToDays(Number(KPIData?.resolution_time?.o_round_off ?? 0))}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton oe m-0 h-100">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <i className="far fa-clock" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">Average Response Time</p>
                            <p className="mb-0 font-weight-bold">{convertSecondsToDays(Number(KPIData?.response_time?.o_round_off ?? 0))}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
