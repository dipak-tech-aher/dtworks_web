import { formatTimeWithLabels } from "../Utils/helper"

const ImageTitleCard = ({ imageSrc, title, values = {}, iconColor, valueformat }) => {
    const { value = 0 } = values
    return (
        <div className="col-md px-lg-1 omc-tiles">
            <div className="cmmn-skeleton toa m-0 h-100">
                <div className="row align-items-center">
                    <div className="col-md-auto">
                        <div className="icon" style={{ backgroundColor: iconColor }}>
                            <img src={imageSrc} />
                        </div>
                    </div>
                    <div className="col-md pl-0">
                        <p className="mb-0">{title}</p>
                        <p className="mb-0 font-weight-bold">{valueformat === 'timeWithLabel' ? formatTimeWithLabels(value) : value}{(values?.type === 'perUp' || values?.type === 'perDwn') ? '%' : ''}
                            {(values?.type === 'perUp' || values?.type === 'perDwn') && <i className={`fas ${values?.type === 'perUp' ? 'fa-arrow-up text-success' : 'fa-arrow-down text-danger'}`}></i>}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ImageTitleCard