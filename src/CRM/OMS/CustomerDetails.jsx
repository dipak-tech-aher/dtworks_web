import React from 'react'

const CustomerDetails = (props) => {

    const { customerDetails } = props?.data

    return (
        <>
            {/* Customer Details */}
            {/* <div className="form-row">
                <div className="col-12 pl-2 bg-light border mt-2">
                    <h5 className="text-primary">Customer Details</h5>
                </div>
            </div> */}
            <>
                <div className="row cust360 col-12 pt-1">
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Account Name</label>
                            <p>{customerDetails?.accountName ?? '-'}</p>
                        </div>
                    </div>
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Account Number</label>
                            <p>{customerDetails?.accountNo ?? '-'}</p>
                        </div>
                    </div>
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Service Number</label>
                            <p>{customerDetails?.serviceNumber ?? '-'}</p>
                        </div>
                    </div>
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Service Type</label>
                            <p>{customerDetails?.serviceType ?? '-'}</p>
                        </div>
                    </div>
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Primary Contact No</label>
                            <p>{customerDetails?.contactNo ?? '-'}</p>
                        </div>
                    </div>
                    <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Primary Email ID</label>
                            <p>{customerDetails?.emailId ?? '-'}</p>
                        </div>
                    </div>
                    {/* <div className="col-3">
                        <div className="form-group">
                            <label htmlFor="inputName" className="col-form-label">Status</label>
                            <p>{customerDetails?.serviceStatus ?? '-'}</p>
                        </div>
                    </div> */}
                </div>
                {/* Address Details */}
                <div className="col-12">
                    {/* <div className="col-12 pt-2 pr-2">
                        <div className=" bg-light border pr-2">
                            <h5 className="text-primary pl-2">Customer Address</h5>
                        </div>
                    </div> */}
                    <section className="col-md-12">
                            <div className="tit-his row col-md-12">
                                <div className="col-md-8">
                                    <h5 className="pl-1">Customer Address</h5>
                                </div>
                            </div>
                        </section>
                    <div className="row col-12 pt-1">
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="FlatNo" className="col-form-label">Flat/House/Unit No</label>
                                <p>{customerDetails?.addressDetails?.No ?? '-'}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="Simpang" className="col-form-label">Simpang</label>
                                <p>{customerDetails?.addressDetails?.Simpang ?? '-'}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="Bandar" className="col-form-label">Jalan</label>
                                <p>{customerDetails?.addressDetails?.Jalan ?? '-'}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="District" className="col-form-label">Kampung</label>
                                <p>{customerDetails?.Kampung ?? '-'}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="Mukim" className="col-form-label">District</label>
                                <p>{customerDetails?.addressDetails?.District ?? '-'}</p>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-group">
                                <label htmlFor="Postcode" className="col-form-label">Postcode</label>
                                <p>{customerDetails?.addressDetails?.['Post Code'] ?? '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </>
    )
}


export default CustomerDetails