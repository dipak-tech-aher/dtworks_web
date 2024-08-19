const ViewAddress = (props) => {
    const { addressDetails = {} } = props?.data
    return (
        <div className="col-md-12 mt-3">
            <div className="row col-md-12 pl-0">
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="address1" className="col-form-label">Address Line 1</label>
                        <span>{addressDetails?.address1 ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="address2" className="col-form-label">Address Line 2</label>
                        <span>{addressDetails?.address2 ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="simpang" className="col-form-label">Address Line 3</label>
                        <span>{addressDetails?.address3 ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="postcode" className="col-form-label">Post code/Zip Code</label>
                        <span>{addressDetails?.postcode ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="country" className="col-form-label">Country</label>
                        <span>{addressDetails?.country ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="state" className="col-form-label">State</label>
                        <span>{addressDetails?.state ?? ''}</span>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="city" className="col-form-label">City</label>
                        <span>{addressDetails?.city}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewAddress