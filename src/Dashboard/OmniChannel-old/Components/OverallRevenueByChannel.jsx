import React, { useContext, useEffect, useState } from 'react'
import { properties } from '../../../properties';
import { post } from '../../../common/util/restUtil';
import { AppContext } from '../../../AppContext';

export default function OverallRevenueByChannel(props) {
    const { appConfig: { clientConfig: { defaultCurrency } } } = useContext(AppContext);
    const { searchParams = {} } = props.data;
    const { getChannelIcon, getChannelNewClassName } = props.handler;
    let formatter = Intl.NumberFormat('en', { notation: 'compact' });
    const [revenueList, setRevenueList] = useState([])
    useEffect(() => {
        if (searchParams) getOverallRevenue();
    }, [searchParams])
    const getOverallRevenue = () => {

        post(properties.ORDER_API + "/overall-revenue-by-channel ", searchParams)
            .then((response) => {
                setRevenueList(response?.data)
            })
            .catch((error) => {
                console.error("error", error);
            })
            .finally();
    };
    return (
        <div class="skel-rc-list mt-2">
            <div className={`row row-cols-7 mx-lg-n1 mt-2`}>
                {revenueList && revenueList.length > 0 && revenueList.map((revenue, i) => {
                    return (<div className="col px-lg-1" key={i}>
                        <div className={`card ${getChannelNewClassName(revenue.channel)}`}>
                            <div className="card-body">
                                {getChannelIcon(revenue.orderChannel)}
                                <p>{defaultCurrency} {formatter.format(revenue.sum)}</p>
                            </div>
                        </div>
                    </div>)
                })}
            </div>
        </div>
    )
}
