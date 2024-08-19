import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Contract360Context } from '../../../../../AppContext'
import { post } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import { convertSecondsToDays } from '../../../../../common/util/util';

export default function ContractKPI(props) {
    const { data: { contractData } } = useContext(Contract360Context);
    const [KPIData, setKPIData] = useState({})
    const type = props.type

    // console.log('contractData', contractData)
    useEffect(() => {
        const getCardDetails = () => {
            try {
                post(`${properties.CONTRACT_API}/insight/over-view`, {
                    searchParams: {
                        contractNo: contractData?.contractNo,
                        customerId: contractData?.customer?.customerId,
                        type
                    }
                }).then(res => {
                    setKPIData(res?.data)

                }).catch(error => console.log(error))
            } catch (error) {

            }
        }
        if (contractData?.contractId) {
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
                                <i className="fa fa-list" />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">Total Contract</p>
                            <p className="mb-0 font-weight-bold">{KPIData?.totalContract ? KPIData?.totalContract : 0}</p>
                        </div>
                    </div>
                </div>
            </div>
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
                            <p className="mb-0 font-weight-bold">${KPIData?.totalContractValue ? Number(KPIData?.totalContractValue).toFixed(2) : 0}</p>
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
                            <p className="mb-0 font-weight-bold">${ KPIData?.remainingOweValue ? Number(KPIData?.remainingOweValue).toFixed(2) : 0}</p>
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
                            <p className="mb-0 font-weight-bold">{KPIData?.averageResolutionTime ?? 0}</p>
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
                            <p className="mb-0 font-weight-bold">{KPIData?.averageResponseTime ?? 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
