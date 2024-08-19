import React, { useCallback, useEffect, useState } from 'react'
import HelpdeskWidget from './HelpdeskWidget'
import { get, post } from '../../../../common/util/restUtil';
import { properties } from '../../../../properties';

export default function RightSidePanel(props) {
    let { consumerNo, refresh } = props.data
    let { handleFrequentHelpdeskChange } = props.handler
    let [frequentHelpdesk, setFrequentHelpdesk] = useState([])
    let [topHelpdesk, setTopHelpdesk] = useState([])
    const getFrequentHelpdesk = useCallback(() => {
        get(`${properties.HELPDESK_API}/frequent`)
            .then((response) => {
                const { status, data } = response;
                if (status === 200) {
                    setFrequentHelpdesk(data || [])
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }, [])
    
    const getTop5Helpdesk = useCallback(() => {
        if (consumerNo) {
            post(`${properties.HELPDESK_API}/top5`, { consumerNo })
                .then((response) => {
                    const { status, data } = response;
                    if (status === 200) {
                        setTopHelpdesk(data || [])
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
        }
    }, [consumerNo])

    useEffect(() => {
        getFrequentHelpdesk()
        getTop5Helpdesk()
    }, [getFrequentHelpdesk, getTop5Helpdesk, refresh])

    return (
        <>
            <HelpdeskWidget
                data={{ frequentHelpdesk, topHelpdesk }}
                handler={{
                    handleFrequentHelpdeskChange
                }}
            />
        </>
    )
}
