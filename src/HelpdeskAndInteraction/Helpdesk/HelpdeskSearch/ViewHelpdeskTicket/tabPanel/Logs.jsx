import React, { useEffect, useState, useCallback } from 'react'
import { get } from '../../../../../common/util/restUtil';
import { properties } from '../../../../../properties';
import moment from 'moment';

export default function Logs(props) {
    const { detailedViewItem, logList } = props.data
    const { setLogList } = props.handler
    let helpdeskId = detailedViewItem?.helpdeskId;

    const getLogsList = useCallback(() => {
        try {
            get(`${properties.HELPDESK_API}/logs/${helpdeskId}`)
                .then((response) => {
                    const { status, data = [] } = response;
                    if (status === 200) {
                        setLogList(data)
                    }
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally();
        } catch (e) {
            console.log('error', e)
        }
    }, [helpdeskId])

    useEffect(() => {
        if (helpdeskId) {
            getLogsList()
        }
    }, [getLogsList, helpdeskId])

    const getShortName = (fullName) => {
        return fullName.split(' ').map((val) => val.charAt(0)).join("")
    }
    return (
        <ul className="list-unstyled">
            {logList && logList.length > 0 ? <>
                {logList.map((item, i) => {
                    let fullName = item?.createdByDetailsFirstName ?? '-'
                        + ' ' + item?.createdByDetailsLastName ?? '';
                    // console.log(fullName)
                    // let oldStatus = i > 0 ? List[i - 1].statusDescDescription : '-';
                    let newStatus = item.statusDescDescription;
                    return (
                        <li className="media media-loginfo" key={i}>
                            <div className="profile mr-2">{getShortName(fullName)}</div>
                            <div className="media-body">
                                <p className="mb-0">
                                    <span className="badge badge-success px-3 py-1 rounded-pill text-15 font-weight-normal">
                                        {newStatus}
                                    </span>
                                </p>
                                <p className="mb-0">
                                    <strong>{item.remarkDescriptionDescription}</strong> added by {fullName}
                                    <span className="color-light text-12 pl-1">
                                        {moment(item.createdAt).fromNow()}
                                    </span>                                    
                                </p>
                                {item?.helpdeskActionRemark === 'HELPDESK_UPDATE' ? <p>Comments: {item?.helpdeskContent ?? '-'}</p>:<></>}

                                <p className="text-12 color-light">
                                    {moment(item.createdAt).format('DD-MM-YYYY hh:mm A ')}

                                </p>
                                {/* <p className="text-12 color-light">
                                    20-012024 11:50 AM <span>|</span>{" "}
                                    <a href="#">I360.zip</a>
                                </p> */}
                            </div>
                        </li>
                    )
                })}

            </> : <span className="skel-widget-warning">
                No data available yet
            </span>}
            {/* <li className="media media-loginfo">
                <div className="profile mr-2">WS</div>
                <div className="media-body">
                    <p className="mb-0">
                        <strong>Will Smith</strong> added an Attachment
                        <span className="color-light text-12 pl-1">
                            3 hours ago
                        </span>
                    </p>
                    <p className="text-12 color-light">
                        20-012024 11:50 AM <span>|</span>{" "}
                        <a href="#">I360.zip</a>
                    </p>
                </div>
            </li>
            <li className="media media-loginfo">
                <div className="profile mr-2">WS</div>
                <div className="media-body">
                    <p className="mb-0">
                        <strong>Will Smith</strong> added an Attachment
                        <span className="color-light text-12 pl-1">
                            3 hours ago
                        </span>
                    </p>
                    <p className="text-12 color-light">
                        20-012024 11:50 AM <span>|</span>{" "}
                        <a href="#">I360.zip</a>
                    </p>
                </div>
            </li>
            <li className="media media-loginfo">
                <div className="profile mr-2">WS</div>
                <div className="media-body">
                    <p className="mb-0">
                        <strong>Will Smith</strong> added an Attachment
                        <span className="color-light text-12 pl-1">
                            3 hours ago
                        </span>
                    </p>
                    <p className="text-12 color-light">
                        20-012024 11:50 AM <span>|</span>{" "}
                        <a href="#">I360.zip</a>
                    </p>
                </div>
            </li>
            <li className="media media-loginfo">
                <div className="profile mr-2">WS</div>
                <div className="media-body">
                    <p className="mb-0">
                        <strong>Will Smith</strong> added an Attachment
                        <span className="color-light text-12 pl-1">
                            3 hours ago
                        </span>
                    </p>
                    <p className="text-12 color-light">
                        20-012024 11:50 AM <span>|</span>{" "}
                        <a href="#">I360.zip</a>
                    </p>
                </div>
            </li> */}
        </ul>
    )
}
