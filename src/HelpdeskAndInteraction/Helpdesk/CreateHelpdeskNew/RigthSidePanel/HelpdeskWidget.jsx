import { nanoid } from 'nanoid'
import React, { useState } from 'react'

export default function HelpdeskWidget(props) {
    const { permission, frequentHelpdesk, topHelpdesk, } = props.data
    const { handleFrequentHelpdeskChange } = props.handler

    const [showWidgets, setShowWidgets] = useState({
        frequent: true,
        Last5: true,
    })

    const handleWidgetChange = (value) => {
        setShowWidgets({
            ...showWidgets,
            [value]: !showWidgets[value]
        })
    }
    return (
        <div>
            <div className="mt-0">
                <button className={`accordion-expand ${showWidgets.Last5 ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('Last5')}>
                    <span className="skel-profile-heading">Last 5 Helpdesk</span>
                </button>
                <div className={`panel-data ${showWidgets.Last5 ? '' : 'd-none'}`}>
                    <ul className="skel-rec-inter">
                        {
                            topHelpdesk && topHelpdesk.map((x) => (
                                <li key={nanoid()}><a onClick={() => handleFrequentHelpdeskChange(x, 'Last5')}>{x?.helpdeskSubject || ""}</a></li>
                            ))
                        }
                    </ul>
                </div>
            </div>
            <div className="mt-2">
                <button className={`accordion-expand ${showWidgets.frequent ? '' : 'active'}`} data-toggle="collapse" aria-expanded="true" onClick={() => handleWidgetChange('frequent')}>
                    <span className="skel-profile-heading">Most frequent Helpdesk</span>
                </button>
                <div className={`panel-data ${showWidgets.frequent ? '' : 'd-none'}`}>
                    <ul className="skel-rec-inter">
                        {
                            frequentHelpdesk && frequentHelpdesk.map((x) => (
                                <li key={nanoid()}><a onClick={() => handleFrequentHelpdeskChange?.(x, 'frequent')}>{x?.helpdeskSubject || ""}</a></li>
                            ))
                        }
                    </ul>
                </div>
            </div>
        </div>
    )
}
