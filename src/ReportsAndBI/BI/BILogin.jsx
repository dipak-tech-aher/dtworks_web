import React, {useState } from 'react';
import BIEmbed from './BIEmbed';
import Aggregation from './Aggregation';
import imgLeft from '../../assets/images/prameya-left.png';
import imgRight from '../../assets/images/prameya-right.png';

const BILogin = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleOnTabChange = (index) => {
    setActiveTab(index);
  }

  return (
    //  <DashboardEmbed dashboardObj={"8d089ee2-bf34-41c0-a98e-d81e4d949b78"}/>     
    <>
      <div id="pdf-content" className="content">
        <div className="container-fluid">
          <div className="cnt-wrapper" style={{ margin: 'auto', width: '96%', padding: '10px' }}>
            <div className="row mt-2">
              <div className="col-md-6 px-0">
                <img alt="logo" src={imgLeft} width={'250px'} height={'100px'} />
              </div>
              <div className="col-md-6 px-0" style={{ display: "flex", justifyContent: 'flex-end' }}>
                <img alt="logo" src={imgRight} width={'150px'} height={'100px'} />
              </div>
            </div>
            <div className="row mt-1">
              <div className="col-md-12">
                <div className="card-box">
                  <div className="d-flex"></div>

                  <ul className="nav nav-tabs">
                    <li className="nav-item">
                      <button data-target="#helpdesk" role="tab" data-toggle="tab" aria-expanded="true"
                        className={`nav-link ${activeTab === 0 ? 'active' : ''} `} onClick={() => handleOnTabChange(0)}>
                        Summary
                      </button>
                    </li>
                    <li className="nav-item">
                      <button data-target="#interactions" role="tab" data-toggle="tab" aria-expanded="true"
                        className={`nav-link ${activeTab === 1 ? 'active' : ''} `} onClick={() => handleOnTabChange(1)}>
                        Aggregation
                      </button>
                    </li>
                  </ul>
                  <div>
                    {activeTab === 0 && <BIEmbed />}
                  </div>
                  <div>
                    {activeTab === 1 && <Aggregation />}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BILogin;
