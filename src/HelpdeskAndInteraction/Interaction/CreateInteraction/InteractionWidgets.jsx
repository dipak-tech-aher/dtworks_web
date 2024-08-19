import React, { useState } from 'react'
import { nanoid } from 'nanoid';

const InteractionWidget = (props) => {

    const { permission, frequentInteraction, frequentCustomerInteraction, frequentDayInteraction, frequentTenInteraction, appsConfig } = props.data
    // console.log("interaction widget ==> ", appsConfig);
    const { handleFrequentInteractionChange, handleKnowledgeBaseInteraction, setSelectedCategory } = props.handler
    const [showWidgets, setShowWidgets] = useState({
        frequent: true,
        frequentCustomer: true,
        frequentDay: true,
        frequent10: true
    })

    const handleWidgetChange = (value) => {
        setShowWidgets({
            ...showWidgets,
            [value]: !showWidgets[value]
        })
    }
    return (

        <div className="">
            {permission.components && permission.components.map((item, i) => (
                item.componentCode === 'TOP_10_CATEGORY_INTXN' && item.accessType === 'allow' && (
                    <div className="mt-2" key={i}>
                        <button className={`accordion-expand ${showWidgets.frequent10 ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('frequent10')}><span className="skel-profile-heading">Top 10 Category</span></button>
                        <div className={`panel-data ${showWidgets.frequent10 ? '' : 'd-none'}`}>
                            <ul className="skel-top-inter">
                                {
                                    frequentTenInteraction && frequentTenInteraction.map((x) => (
                                        // eslint-disable-next-line jsx-a11y/anchor-is-valid
                                        <li key={nanoid()}>
                                            <a onClick={() => {
                                                handleKnowledgeBaseInteraction(x, 'frequent10', 'InteractionWidget'); setSelectedCategory(x?.intxnCategory?.description)
                                            }}>{x?.intxnCategory?.description || ""}</a>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                )
            ))}
            {permission.components && permission.components.map((item, i) => (
                item.componentCode === 'MOST_FREQUENT_INTXN' && item.accessType === 'allow' && (
                    <div className="mt-2" key={i}>
                        <button className={`accordion-expand ${showWidgets.frequent ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('frequent')}>
                            <span className="skel-profile-heading">Most frequent Interaction</span>
                        </button>
                        <div className={`panel-data ${showWidgets.frequent ? '' : 'd-none'}`}>
                            <ul className="skel-rec-inter">
                                {
                                    frequentInteraction && frequentInteraction.map((x) => (
                                        <li key={nanoid()}><a onClick={() => handleFrequentInteractionChange(x, 'frequent')}>{x?.requestStatement || ""}</a></li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>)
            ))}
            {permission.components && permission.components.map((item, i) => (
                item.componentCode === 'FREQ_CONSUMER_INTXN' && item.accessType === 'allow' && (
                    <div className="mt-2" key={i}>
                        <button className={`accordion-expand ${showWidgets.frequentCustomer ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('frequentCustomer')}><span className="skel-profile-heading">Last used Interaction for this {appsConfig?.clientFacingName?.customer?.toLowerCase() ?? "customer"}</span></button>
                        <div className={`panel-data ${showWidgets.frequentCustomer ? '' : 'd-none'}`}>
                            <ul className="skel-rec-inter">
                                {
                                    frequentCustomerInteraction && frequentCustomerInteraction.map((x) => (
                                        <li key={nanoid()}><a onClick={() => handleFrequentInteractionChange(x, 'frequentCustomer')}>{x?.requestStatement || ""}</a></li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>)
            ))}
            {permission.components && permission.components.map((item, i) => (
                item.componentCode === 'FREQ_DAY_INTXN' && item.accessType === 'allow' && (
                    <div className="mt-2" key={i}>
                        <button className={`accordion-expand ${showWidgets.frequentDay ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('frequentDay')}><span className="skel-profile-heading">Most frequent Interaction of the day</span></button>
                        <div className={`panel-data ${showWidgets.frequentDay ? '' : 'd-none'}`}>
                            <ul className="skel-rec-inter">
                                {
                                    frequentDayInteraction && frequentDayInteraction.map((x) => (
                                        <li key={nanoid()}><a onClick={() => handleFrequentInteractionChange(x, 'frequentDay')}>{x?.requestStatement || ""}</a></li>
                                    ))
                                }
                            </ul>
                        </div>
                    </div>
                )
            ))}
        </div >
    )
}

export default InteractionWidget