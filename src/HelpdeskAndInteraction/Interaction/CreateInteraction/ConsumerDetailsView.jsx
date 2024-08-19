import React from 'react'
import { statusConstantCode } from "../../../AppConstants";
import profileLogo from '../../../assets/images/profile.png'

const ConsumerDetailsView = ({appsConfig, screenSource, helpdeskDetails, 
    handleHelpdeskModal, customerData, customerUuid, customerEmailId,
    customerMobileNo, handleOpenMinimalInfo, dtWorksProductType,
    customerNo, selectedService, serviceList, setOpenServiceModal,
    handleInteractionModal, totalInteractionsCount, openInteractionCount,
    closedInteractionCount, permission, userResolutionList, from = 'INTERACTION'
})=>{

    return (
        <div className="col-lg-3 col-md-12 col-xs-12">
              {/* Helpdesk details here */}
              {screenSource === statusConstantCode.entityCategory.HELPDESK &&
                helpdeskDetails && (
                  <div className="cmmn-skeleton mt-2 mt-1 mb-1">
                    <span className="skel-profile-heading mb-3">
                      Helpdesk Details
                    </span>
                    <span>Heldpesk No: <span onClick={() => handleHelpdeskModal()} className="cursor-pointer text-primary">{helpdeskDetails?.helpdeskNo}</span></span>
                  </div>
                )}
              <div className="cmmn-skeleton mt-2 skel-br-bt-r0">
                <div className="card-styl-profile">
                  <div className="user-profile__wrapper pt-1">
                    <div className="user-profile__avatar">
                      <img
                        src={customerData?.customerPhoto || profileLogo}
                        alt=""
                      // loading="lazy"
                      />
                    </div>
                    <div className="user-profile__details mt-1 mb-1">
                      <span className="user-profile__name">
                        {`${customerData?.firstName ?? ''} ${customerData?.lastName ?? ''}` ||
                          customerData?.customerName ? customerData?.customerName : ''}
                      </span>
                      {customerUuid && <span className="user-profile__location">
                        {appsConfig?.clientFacingName?.customer ?? 'Customer'} Number: <span className="text-primary cursor-pointer" onClick={() => { handleOpenMinimalInfo() }}>{customerNo}</span>
                      </span>}
                      <span className="user-profile__location">
                        <a className="text-primary cursor-pointer"
                          href={`mailto:${customerEmailId ||
                            customerData?.customerContact?.[0]?.emailId
                            }`}
                        >
                          {customerEmailId ||
                            customerData?.customerContact?.[0]?.emailId ||
                            "NA"}
                        </a>
                      </span>
                      <span className="user-profile__location">
                        {customerMobileNo ||
                          customerData?.customerContact?.[0]?.mobileNo ||
                          "NA"}
                      </span>
                      {/* <a href="view-customer.html">View Full Profile</a>                                                    */}
                    </div>
                    <hr className="cmmn-hline" />
                    {appsConfig?.clientConfig?.accounts?.enabled && appsConfig?.clientConfig?.services?.enabled && (
                      <div className="user-profile__description mt-0">
                        <div className="container-label">
                          <span className="label-container-style">
                            {appsConfig?.clientFacingName?.customer ?? 'Customer'} Category
                          </span>
                          <span>
                            {customerData?.customerCatDesc?.description || "-"}
                          </span>
                        </div>
                        <div className="container-label">
                          <span className="label-container-style">ID Type</span>
                          <span>
                            {customerData?.idType?.description || "-"}
                          </span>
                        </div>
                        <div className="container-label">
                          <span className="label-container-style">ID Value</span>
                          <span>{customerData?.idValue || "-"}</span>
                        </div>
                        {/* {// console.log("serviceList ", serviceList[0]?.serviceNo)}
                        {// console.log(
                          "selectedService ",
                          selectedService?.serviceNo
                        )} */}
                        {[statusConstantCode.type.CUSTOMER_SERVICE].includes(dtWorksProductType) && (
                          <React.Fragment>
                            <div className="container-label">
                              <span className="label-container-style">
                                Service Number
                              </span>
                              {
                                <span>
                                  {(selectedService?.serviceNo
                                    ? selectedService?.serviceNo
                                    : serviceList?.[0]?.serviceNo) || "-"}
                                  &nbsp;
                                  {serviceList.length > 1 && (
                                    <span                                      
                                      onClick={() => {
                                        setOpenServiceModal(true);
                                      }}
                                    >
                                      more
                                    </span>
                                  )}
                                </span>
                              }
                            </div>
                            <div className="container-label">
                              <span className="label-container-style">
                                Service Type
                              </span>
                              <span>
                                {(selectedService && selectedService?.srvcTypeDesc?.description
                                  ? selectedService?.srvcTypeDesc?.description
                                  : selectedService?.serviceTypeDesc?.description
                                    ? selectedService?.serviceTypeDesc?.description
                                    : serviceList?.[0]?.srvcTypeDesc?.description) ||
                                  "-"}
                              </span>
                            </div>
                            <div className="container-label">
                              <span className="label-container-style">Plan</span>
                              <span>
                                {(selectedService && selectedService?.productDetails
                                  ? selectedService?.productDetails?.[0]?.productName
                                  : serviceList?.[0]?.productDetails?.[0]?.productName) ||
                                  "-"}
                              </span>
                            </div>
                          </React.Fragment>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {from === 'INTERACTION' && <div className="inter-section skel-inter-pro-sect2 clearfix">
                <h4>Interaction History</h4>
                <div className="total-inter clearfix">
                  <div className="total-his">
                    <span style={{ color: '#fff' }}>Total</span>
                    <span
                      className="cursor-pointer-under-line"
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      style={{ color: '#fff' }} onClick={() => {
                        handleInteractionModal("TOTAL");
                      }}
                    >
                      {totalInteractionsCount?.current || 0}
                    </span>
                  </div>
                  <div className="total-his">
                    <span style={{ color: '#fff' }}>Open</span>
                    <span
                      className="cursor-pointer-under-line"
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      style={{ color: '#fff' }} onClick={() => {
                        handleInteractionModal("OPEN");
                      }}
                    >
                      {openInteractionCount?.current || 0}
                    </span>
                  </div>
                  <div className="total-his">
                    <span style={{ color: '#fff' }}>Closed</span>
                    <span
                      className="cursor-pointer-under-line"
                      data-toggle="modal"
                      data-target="#skel-view-modal-interactions"
                      style={{ color: '#fff' }} onClick={() => {
                        handleInteractionModal("CLOSED");
                      }}
                    >
                      {closedInteractionCount?.current || 0}
                    </span>
                  </div>
                </div>
              </div>}
              {permission && permission?.components && permission?.components?.map(item => (
                item.componentCode === 'MOST_FREQUENT_INTXN' && item.accessType === 'allow' && (
                  <div className="mt-2">
                    <button className={`accordion-expand  active`} data-toggle="collapse" aria-expanded="true">
                      <span className="skel-profile-heading">Top 5 Resolution Provided by Others</span>
                    </button>
                    <div className="panel-data">
                      <div className="">
                        {userResolutionList && userResolutionList?.length > 0 && userResolutionList?.map((v, i) => (
                          <ul className="skel-rec-inter">
                            <li key={i}><a>{v}</a></li>
                          </ul>
                        ))
                        }
                      </div>
                    </div>
                  </div>)
              ))}
            </div>
    )
}

export default ConsumerDetailsView;