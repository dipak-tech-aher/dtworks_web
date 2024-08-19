import React, { useRef, useEffect, useContext, useState } from 'react'
import CSATImg from '../../../assets/images/iconamoon_ticket-light.svg';
import FCRImg from '../../../assets/images/system-uicons_box.svg';
import AHT from '../../../assets/images/Vector.svg';
import { OmniChannelContext } from '../../../AppContext';
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
export default function Header1() {
    const { data } = useContext(OmniChannelContext);
    let { channel, searchParams = {}, entity, isPageRefresh } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment } = searchParams;
    const [cardCountList, setCardCountList] = useState({});
    const apiDetails = {
        Helpdesk: {
            endpoint: `${properties.HELPDESK_API}/omni-dashboard`
        },
        Interaction: {
            endpoint: `${properties.INTERACTION_API}/omni-dashboard`
        }
    }

    const getFetchData = (entity) => {
        try {
            let requestObj = { ...searchParams }
            if (channel !== 'ALL') requestObj.channel = channel;
            post(apiDetails[entity].endpoint + '/header-cart-one', { searchParams: requestObj })
                .then((response) => {
                    if (response?.data?.length) {
                        setCardCountList(response?.data?.[0] ?? {})
                    } else {
                        setCardCountList({})
                    }
                }).catch(error => {
                    setCardCountList({})
                    console.log(error)
                })
        } catch (e) {
            console.log('error', e)
        }

    }

    useEffect(() => {
        if (fromDate && toDate) getFetchData(entity);
    }, [channel, entity, channel, fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, isPageRefresh])

    let { oAht = 0, oAhtChat = 0, oArt = 0, oCsat = 0, oFcr = 0 } = cardCountList;
    
    return (
        <div className="row my-2 mx-lg-n1 omc-tiles">
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton tr m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <img src={CSATImg} />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Customer Satisfaction Score (CSAT)
                            </p>
                            <p className="mb-0 font-weight-bold">
                                {oCsat ?? 0}%{" "}
                                <i className="fas fa-arrow-up text-success" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton toa m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <img src={FCRImg} />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                First Contact Resolution (FCR)
                            </p>
                            <p className="mb-0 font-weight-bold">
                                {oFcr ?? 0}%{" "}
                                <i className="fas fa-arrow-up text-success" />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-md px-lg-1">
                <div className="cmmn-skeleton taa m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <img src={AHT} />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Avg. Handling Time (AHT)
                            </p>
                            <p className="mb-0 font-weight-bold txt-underline">
                                {oAht ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {entity === 'Helpdesk' ? <><div className="col-md px-lg-1">
                <div className="cmmn-skeleton oe m-0">
                    <div className="row align-items-center">
                        <div className="col-md-auto">
                            <div className="icon">
                                <img src={AHT} />
                            </div>
                        </div>
                        <div className="col-md pl-0">
                            <p className="mb-0">
                                Avg. Response Time (ART) - Chat
                            </p>
                            <p className="mb-0 font-weight-bold">
                                {oArt ?? 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
                <div className="col-md px-lg-1">
                    <div className="cmmn-skeleton oe m-0">
                        <div className="row align-items-center">
                            <div className="col-md-auto">
                                <div className="icon">
                                    <img src={AHT} />
                                </div>
                            </div>
                            <div className="col-md pl-0">
                                <p className="mb-0">
                                    Avg. Handling Time (AHT) - Chat
                                </p>
                                <p className="mb-0 font-weight-bold">
                                    {oAhtChat ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div></> : <>
                <div className="col-md px-lg-1">
                    <div className="cmmn-skeleton oe m-0">
                        <div className="row align-items-center">
                            <div className="col-md-auto">
                                <div className="icon">
                                    <img src={AHT} />
                                </div>
                            </div>
                            <div className="col-md pl-0">
                                <p className="mb-0">
                                    Avg. Response Time (ART) 
                                </p>
                                <p className="mb-0 font-weight-bold">
                                    {oArt ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md px-lg-1">
                    <div className="cmmn-skeleton oe m-0">
                        <div className="row align-items-center">
                            <div className="col-md-auto">
                                <div className="icon">
                                    <img src={AHT} />
                                </div>
                            </div>
                            <div className="col-md pl-0">
                                <p className="mb-0">
                                    Adherence to SLAs - Agent
                                </p>
                                <p className="mb-0 font-weight-bold">
                                    {oAhtChat ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </>}

        </div>
    )
}
