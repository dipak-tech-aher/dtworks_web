import { formatTimeWithLabels } from "../Utils/helper"

const StatisticCard = ({ imageSrc, title, values = {}, iconColor, valueformat }) => {
    const { value = 0, trend = 'perUp' } = values

    return (
        <div className="col-md px-lg-1 omc-tiles">
            <div className="cmmn-skeleton tr m-0">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon" style={{ backgroundColor: iconColor }}>
                            <img src={imageSrc} />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0">{title}</p>
                        <p className="mb-0 font-weight-bold">{ valueformat === 'timeWithLabel' ? formatTimeWithLabels(value) : value}{(trend === 'perUp' || trend === 'perDwn') ? '%' : ''}
                            {(trend === 'perUp' || trend === 'perDwn') && <i className={`fas ${trend === 'perUp' ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}`}></i>}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatisticCard