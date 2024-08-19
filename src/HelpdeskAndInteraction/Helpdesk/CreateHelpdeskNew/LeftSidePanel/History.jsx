import React, { useCallback, useEffect, useState } from 'react'
import { properties } from '../../../../properties';
import { get, post } from '../../../../common/util/restUtil';

export default function History(props) {
    const { page = '', consumerNo, interactionCount, helpdeskCount, refresh } = props?.data
    const { setInteractionCount, setHelpdeskCount } = props?.handler
    // console.log(props?.handler)
    // console.log('consumerNo ', consumerNo)
    const getInteractionSummaryData = useCallback((id) => {
        if (consumerNo) {
            get(`${properties.INTERACTION_API}/get-customer-history-count/${consumerNo}`)
                .then((response) => {
                    // console.log(response?.data)
                    if (response?.data) {
                        setInteractionCount({ ...response?.data })
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
        }

    }, [consumerNo, setInteractionCount])
    const getHelpdeskData = useCallback(() => {

        if (consumerNo) {
            const requestBody = {
                "searchParams": {
                    "profileNo": consumerNo,
                    "mode": "COUNT",
                }
            };
            post(`${properties.HELPDESK_API}/profile-wise/helpdesk-summary`, requestBody)
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200) {
                        setHelpdeskCount({ ...data })
                    }

                })
                .catch((error) => {
                    console.error(error);
                })
        }

    }, [consumerNo, setHelpdeskCount])
    useEffect(() => {
        getInteractionSummaryData()
        getHelpdeskData()
    }, [getHelpdeskData, getInteractionSummaryData, refresh])

    return (
        <div className="skel-inter-view-history mb-2">
            <span className="skel-header-title mt-1 text-16">
                {page} History
            </span>
            <div className="skel-tot-inter skel-tot-inter-new w-auto">
                <div className="skel-tot">
                    Total
                    <span>
                        {page === 'Interaction' ? interactionCount?.totalInteractionCount : page === 'Helpdesk' ? helpdeskCount?.total : 0}
                    </span>
                </div>
                <div className="skel-tot">
                    Open
                    <span>{page === 'Interaction' ? interactionCount?.openInteraction : page === 'Helpdesk' ? helpdeskCount?.open : 0}</span>
                </div>
                <div className="skel-tot">
                    Closed
                    <span>{page === 'Interaction' ? interactionCount?.closedInteraction : page === 'Helpdesk' ? helpdeskCount?.closed : 0}</span>
                </div>
            </div>
        </div>
    )
}
