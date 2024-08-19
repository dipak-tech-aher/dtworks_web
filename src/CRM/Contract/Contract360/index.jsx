import React, { useEffect, useState } from 'react'
import { Contract360Context } from '../../../AppContext'
import NormalViewIcon from '../../../assets/images/dashboard-icons.svg';
import InsightViewIcon2 from '../../../assets/images/livestream.svg';
import { useLocation } from 'react-router-dom';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import moment from 'moment';
import ContractInformativeView from './Components/InformativeView';
import ContractInsightView from './Components/InsightView';
export default function Contract360() {
    const { state } = useLocation();
    const viewContractData = JSON.parse(localStorage.getItem('viewContractData'))

    const propsData = state?.data ? state?.data : viewContractData;
    const contractId = propsData.contractId
    const [contractData, setContractData] = useState({});
    // const [currentView, setCurrentView] = useState('insight-view');
    const [currentView, setCurrentView] = useState('informative-view');
    // console.log('contractData', contractData)
    const getContract = () => {
        try {
            let requestBody = {
                contractId,
                contains:['serviceAddress']
            }
            post(`${properties.CONTRACT_API}/search?limit=10`, requestBody).then((resp) => {
                if (Number(resp?.data?.count) > 0) {
                    const { rows } = resp.data;
                    setContractData(rows?.[0])
                }

            }).catch(error => console.log(error))
                .finally(() => { })
        } catch (e) {
            console.log('error', e)
        }
    }
    useEffect(() => {
        if (contractId) getContract();
    }, [contractId])


    const contextProvider = {
        data: {
            contractData,
            customerDetails: contractData?.customer ?? {}
        }
    }
    return (
        <Contract360Context.Provider value={contextProvider}>
            <div className="content">
                <div className="">
                    <div className="cnt-wrapper">
                        <div className="card-skeleton">
                            <div className="cmmn-skeleton mt-2">
                                <div className="skel-i360-base">
                                    <div className="skel-intcard">
                                        <div className="skel-flex-card-int mb-1">
                                            <span className="skel-profile-heading mb-0">
                                                {contractData?.contractNo}
                                            </span>
                                            <span className="status-active ml-1">{contractData?.statusDesc?.description}</span>
                                        </div>
                                        <div>Created at: {contractData?.createdAt ? moment(contractData?.createdAt).format("DD-MM-YYYY HH:mm:ss a") : ""}</div>
                                    </div>
                                    <div className="skel-intcard-insight">
                                        <div className="db-list mb-0 pl-0">
                                            <div onClick={() => setCurrentView(currentView === 'informative-view' ? 'insight-view' : 'informative-view')} className={`list-dashboard db-list-active cursor-pointer`}>
                                                <span className="db-title">
                                                    <img src={currentView === 'informative-view' ? InsightViewIcon2 : NormalViewIcon} className="img-fluid pr-1" /> Switch to {currentView === 'informative-view' ? 'Insight' : 'Informative'} View
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {currentView === 'informative-view' ? (
                        <ContractInformativeView />
                    ) : (
                        <ContractInsightView />
                    )}
                </div>
            </div>
        </Contract360Context.Provider>
    )
}
