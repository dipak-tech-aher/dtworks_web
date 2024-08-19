import React, { useContext, useEffect, useState } from 'react'
import totalImg from '../../../assets/images/iconamoon_ticket-light-b.svg';
import OpenImg from '../../../assets/images/Union-b.svg';
import ClosedImg from '../../../assets/images/system-uicons_box-b.svg';
import followUpImage from '../../../assets/images/system-uicons_box-b.svg';
import { post } from '../../../common/util/restUtil';
import { properties } from '../../../properties';
import { OmniChannelContext } from '../../../AppContext';
export default function Header2() {
    const { data } = useContext(OmniChannelContext);
    let { channel, searchParams = {}, entity } = data, { fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment } = searchParams;
    const [HelpdeskCount, setHelpdeskCount] = useState({})
    const [InteractionCount, setInteractionCount] = useState({})
    useEffect(() => {
        let requestObj = { ...searchParams }
        if (channel !== 'ALL') requestObj.channel = channel
       if(entity==='Helpdesk') helpdeskfetchData(requestObj);
       if(entity==='Interaction') interactionfetchData(requestObj);
    }, [channel, fromDate, toDate, category, type, status, sla, currentRole, createRole, user, createdDepartment, currentDepartment, entity])
    const helpdeskfetchData = async (data) => {
        try {
            const result = await post(`${properties.HELPDESK_API}/channels-wise`, { searchParams: data });
            if (result?.status === 200) {
                setHelpdeskCount(result?.data)
            }
        } catch (e) {
            console.log('error', e)
        }
    }
    const interactionfetchData = async (data) => {
        try {
            const result = await post(`${properties.INTERACTION_API}/channel-wise-interaction-count`, { searchParams: data });
            if (result?.status === 200) {
                setInteractionCount(result?.data)
            }

        } catch (e) {
            console.log('error', e)
        }
    }

    return (
        <div className="row mx-lg-n1 common-tiles">

            {entity === 'Helpdesk' && <><div className="col px-lg-1">
                <div className="cmmn-skeleton m-0">
                    <div className="icon">
                        <img src={totalImg} />
                    </div>
                    <p className="font-weight-bold mb-0">{HelpdeskCount?.total_helpdesk ?? 0}</p>
                    <p className="mb-0">Total Helpdesk</p>
                </div>
            </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={OpenImg} />
                        </div>
                        <p className="font-weight-bold mb-0">{HelpdeskCount?.open_helpdesk ?? 0}</p>
                        <p className="mb-0">Open Helpdesk</p>
                    </div>
                </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={ClosedImg} />
                        </div>
                        <p className="font-weight-bold mb-0">{HelpdeskCount?.closed_helpdesk ?? 0}</p>
                        <p className="mb-0">Closed Helpdesk</p>
                    </div>
                </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={followUpImage} />
                        </div>
                        <p className="font-weight-bold mb-0">{HelpdeskCount?.helpdesk_followUp_count ?? 0}</p>
                        <p className="mb-0">Follow-up Helpdesk</p>
                    </div>
                </div></>}
            {entity === 'Interaction' && <>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={totalImg} />
                        </div>
                        <p className="font-weight-bold mb-0">{InteractionCount?.total_interaction ?? 0}</p>
                        <p className="mb-0">Total Interaction</p>
                    </div>
                </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={OpenImg} />
                        </div>
                        <p className="font-weight-bold mb-0">{InteractionCount?.open_interaction ?? 0}</p>
                        <p className="mb-0">Open Interaction</p>
                    </div>
                </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={ClosedImg} />
                        </div>
                        <p className="font-weight-bold mb-0">{InteractionCount?.closed_interaction ?? 0}</p>
                        <p className="mb-0">Closed Interaction</p>
                    </div>
                </div>
                <div className="col px-lg-1">
                    <div className="cmmn-skeleton m-0">
                        <div className="icon">
                            <img src={followUpImage} />
                        </div>
                        <p className="font-weight-bold mb-0">{InteractionCount?.interaction_followUp_count ?? 0}</p>
                        <p className="mb-0">Follow-up Interaction</p>
                    </div>
                </div>
            </>}
        </div>
    )
}
