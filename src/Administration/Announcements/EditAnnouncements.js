import react from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AddEditAnnouncement from './AddEditAnnouncement'

function AddAnnouncements() {
  
    const location = useLocation();
    const { data } = location.state || {};
    const navigate = useNavigate();

    return (
        <div>
            <div className="customer-skel">
                <div className="cmmn-skeleton">
                    <div className="row">
                        <div className="skel-configuration-settings">
                            <div className="col-md-8">
                                <div className="skel-config-top-sect">
                                    <h2>Edit Announcement</h2>
                                    <p>Announcements are typically communicated through various channels
                                        depending on the audience and the nature of the
                                        information.</p>

                                </div>
                            </div>
                            <div className="col-md-4">
                                <img src="./assets/images/store.svg" alt="" className="img-fluid" />
                            </div>
                        </div>
                    </div>
                    <div className="skel-config-base">
                        <div className="skel-btn-row mb-3">
                            <button className="skel-btn-submit"
                                onClick={() => navigate(`/announcements`)}>View
                                Announcement</button>
                        </div>
                        <AddEditAnnouncement data={{
                            type: 'EDIT',announcementDetails:data
                        }} />
                    </div>
                </div>
            </div>

        </div>
    )
}

export default AddAnnouncements;