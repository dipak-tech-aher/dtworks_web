import moment from 'moment';
import React from 'react';
import { useNavigate } from "react-router-dom";
import { getReleventHelpdeskDetailedData } from '../../common/util/util';
import { properties } from '../../properties';

const ListItem = (props) => {
    const { item, source, handleOnIdSelection, handleOnAssignForMobile = () => { } } = props;
    const history = useNavigate();
    const viewItem = getReleventHelpdeskDetailedData(item?.source, item);

    const handleCellLinkClick = (rowData) => {
        history(`/view-helpdesk`, {
            state: {data: rowData}
        })
    }

    return (
        <li data-helpdesk-no={viewItem?.helpdeskNo} key={`${viewItem?.source || "id"}-${viewItem?.helpdeskId || item?.helpdeskId}`} id={`${viewItem?.source || "id"}-${viewItem?.helpdeskId || item?.helpdeskId}`} draggable="false" className="">
            <div className="status-card skel-helpdesk-profile-qu" id="mail">
                <div className="skel-status-detail-subject">
                    <div className="skel-qu-helpdesk">
                        <div className="status-num">
                            <h5>
                                <a className='text-primary cursor-pointer txt-underline' onClick={() => handleOnIdSelection(item, source)}>
                                    #{viewItem?.helpdeskNo || item?.helpdeskNo} <i title='click here to view in Helpdesk 360' className="fa fa-external-link-alt" aria-hidden="true" style={{ color: '#000', margin: '10px', fontSize: 'x-small', fontWeight: '700', cursor: 'pointer' }} onClick={(e) => handleCellLinkClick(item)}></i>
                                </a>
                            </h5>
                            <h5 className="">{item?.helpdeskSubject}</h5>
                        </div>
                    </div>
                    {/* <div className='skel-qu-helpdesk'>
                        {
                            source === 'QUEUE' &&
                            <div className="" onClick={() => handleOnAssignForMobile(viewItem)}>
                                <i className="fa fa-arrow-circle-right arrow1" aria-hidden="true"></i>
                            </div>
                        }
                    </div> */}
                </div>
                <hr />
                <div className="col-12 pl-2 pr-2">
                    <div className="col-12">
                        <div>
                            <i className="fa fa-clock text-muted pr-1" />
                            {viewItem?.createdAt ? moment(viewItem.createdAt).format('DD/MM/YYYY HH:mm') : '-'}
                        </div>
                    </div>
                    <div className="col-12">
                        <div className='text-capitalize'>
                            <i className="fa fa-arrow-right text-muted pr-2 " />
                            {viewItem?.source?.toLowerCase()}
                        </div>
                    </div>
                </div>

                <div className="status-card-btm m-1 px-2">
                    <div className="skel-helpdesk-status-card-qu">
                        <i className="fas fa-user text-secondary pr-1"></i>
                        <span>{viewItem?.name ?? viewItem?.customerName ?? item?.userName ? item?.userName?.replace(' null', '') : ((viewItem?.customerDetails?.firstName ?? "") + ' ' + (viewItem?.customerDetails?.lastName ?? ""))}</span>
                    </div>
                    <div className="skel-helpdesk-status-card-qu">
                        <i className="fas fa-phone text-secondary pr-1"></i>
                        <span>{(item && item?.customerDetails?.contactDetails && item?.customerDetails?.contactDetails.length > 0
                            && item?.customerDetails?.contactDetails[0]?.mobileNo && item?.customerDetails?.contactDetails[0]?.mobileNo !== '') ?
                            item?.customerDetails?.contactDetails[0]?.mobileNo
                            : item.contactNo ?
                                item.contactNo :
                                viewItem?.customerDetails?.contactDetails?.mobileNo
                                    ? viewItem?.customerDetails?.contactDetails?.mobileNo
                                    : item?.phoneNo ? item?.phoneNo : '-'}</span>
                    </div>

                    <div className="skel-helpdesk-status-card-qu">
                        <i className="fas fa-envelope text-secondary pr-1"></i>
                        <span>{(item && item?.customerDetails?.contactDetails && item?.customerDetails?.contactDetails.length > 0
                            && item?.customerDetails?.contactDetails[0]?.emailId && item?.customerDetails?.contactDetails[0]?.emailId !== '') ?
                            item?.customerDetails?.contactDetails[0]?.emailId
                            : item.mailId ?
                                item.mailId :
                                viewItem?.customerDetails?.contactDetails?.emailId
                                    ? viewItem?.customerDetails?.contactDetails?.emailId
                                    : item?.email ? item?.email : '-'}</span>
                        {/* <span className='text-break'>{viewItem?.email || viewItem?.emailId || viewItem?.mailId}</span> */}
                    </div>

                </div>
            </div>
        </li>
    )
}

export default ListItem;