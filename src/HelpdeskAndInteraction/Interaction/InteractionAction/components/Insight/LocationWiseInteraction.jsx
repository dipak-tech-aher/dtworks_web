import LeafletControlGeocoder from "../Map/LeafletControlGeocoder"

const LocationWiseInteraction = () => {

    return (
        <div className="cmmn-skeleton mt-2">
            <div className="skel-dashboard-title-base">
                <span className="skel-header-title">Location wise Interaction</span>
            </div>
            <hr className="cmmn-hline" />
            <div className="map-responsive">
                {/* <iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyA0s1a7phLN0iaD6-UE7m4qP-z21pH0eSc&q=Eiffel+Tower+Paris+France" width="600" height="450" frameBorder="0" style={{ border: '0' }} allowFullScreen></iframe> */}
                <LeafletControlGeocoder />
            </div>
        </div>
    )
}

export default LocationWiseInteraction