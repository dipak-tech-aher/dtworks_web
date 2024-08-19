import React from 'react'
import { formatTimeWithLabels } from '../Utils/helper'

const IconCard = ({ key, imageSrc, title, values = {}, valueformat }) => {
    const { value = 0 } = values
    return (
        <div className="col px-lg-1" key={key}>
            <div className="cmmn-skeleton m-0">
                <div className="icon">
                    <img src={imageSrc} alt={title} />
                </div>
                <p className="font-weight-bold mb-0">{valueformat === 'timeWithLabel' ? formatTimeWithLabels(value) : value}</p>
                <p className="mb-0">{title}</p>
            </div>
        </div>
    )
}

export default IconCard
