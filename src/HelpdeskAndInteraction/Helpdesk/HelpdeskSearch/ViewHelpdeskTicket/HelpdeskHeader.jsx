import moment from 'moment'
import React from 'react'
import { useNavigate } from 'react-router-dom';
import LiveStream from '../../../../assets/images/livestream.svg';
import DashboardIcons from '../../../../assets/images/dashboard-icons.svg';
import { properties } from '../../../../properties';
import { DefaultDateFormate } from '../../../../common/util/dateUtil';
import { getFullName } from '../../../../common/util/commonUtils';
import { nanoid } from 'nanoid';
export default function HelpdeskHeader(props) {
    let { detailedViewItem, PageView } = props.data;
    let { checkComponentPermission,checkReportEnabled } = props.handler;
    const history = useNavigate();
    return (
        <>
            <div className="skel-intcard">
                <div className="skel-flex-card-int">
                    <span className="skel-profile-heading mb-0">
                        {detailedViewItem?.helpdeskNo}
                    </span>
                    {detailedViewItem?.status && <span className="status-new skel-d-status ml-1">{detailedViewItem?.status ? detailedViewItem?.status?.description : ''}</span>}
                </div>
                {detailedViewItem?.interactionDetails?.[0] && <div className="my-1">
                    <i className="fa fa-link" aria-hidden="true" />
                    <span className="txt-underline cursor-pointer" style={{ color: 'rgb(6 88 242)' }} onClick={(e) => {
                        history(`/interaction360`, { state: { data: { intxnNo: detailedViewItem?.interactionDetails?.[0]?.intxnNo, intxnUuid: detailedViewItem?.interactionDetails?.[0]?.intxnUuid, intxnId: detailedViewItem?.interactionDetails?.[0]?.intxnId } } })
                    }}>
                        {detailedViewItem?.interactionDetails?.[0]?.intxnNo}
                    </span>
                </div>}
                <span className="skel-int-cr-date">
                    {/* {detailedViewItem?.currUserInfo ? `${detailedViewItem?.currUserInfo?.firstName ?? ""} ${detailedViewItem?.currUserInfo?.lastName ?? ""}` : ' '} {detailedViewItem?.createdAt ? `| Created Date: ${moment(detailedViewItem?.createdAt).format('DD-MM-YYYY hh:mm A')}` : ''} */}
                    {detailedViewItem?.userName && <span key={nanoid()} className="skel-int-cr-date">{detailedViewItem?.userName ?? ''} | Created Date: {detailedViewItem?.createdAt ? DefaultDateFormate(detailedViewItem?.createdAt, 'DD-MM-YYYY HH:mm:ss A') ?? '-' : '-'}</span>}
                </span>
                <span className="skel-int-statement">
                    {detailedViewItem?.helpdeskSubject && <blockquote>{detailedViewItem?.helpdeskSubject}</blockquote>}
                </span>
            </div>
            <div className="skel-intcard-insight">
                {/* <button
                    className="skel-btn-submit-outline"
                    onClick={() => history(`/helpdesk`)}
                >
                    View Helpdesk Board
                </button> */}
                
                {checkReportEnabled()&& <button type="button" className="skel-btn-submit-outline" onClick={() => props?.handler?.handleGeneratePdf?.()}>Print PDF</button>}
                {/* {checkComponentPermission('HELPDESK_REPORT') && detailedViewItem?.status?.code === statusConstantCode.status.HELPDESK_CLOSED && <button type="button" className="skel-btn-submit-outline" onClick={() => props?.handler?.handleGeneratePdf?.()}>Print PDF</button>} */}
                <div className="db-list mb-0 pl-0">
                    {PageView === 'InsightView' && <div
                        className="list-dashboard db-list-active skel-btn-submit skel-self-normal-view cursor-pointer"
                        id="skel-self-interaction-insight-view"
                        onClick={() => props?.handler?.setPageView?.('Normal')}
                    >
                        <span className="db-title">
                            <img
                                src={LiveStream}
                                className="img-fluid pr-1"
                            />{" "}
                            Switch to Insight View
                        </span>
                    </div>}
                    {PageView === 'Normal' && <div
                        className="list-dashboard db-list-active skel-btn-submit skel-informative-insight-view cursor-pointer"
                        id="skel-informative-interaction-normal-view"
                        onClick={() => props?.handler?.setPageView?.('InsightView')}
                    >
                        <span className="db-title">
                            <img
                                src={DashboardIcons}
                                className="img-fluid pr-1"
                            />{" "}
                            Switch to Normal View
                        </span>
                    </div>}
                </div>
            </div>
        </>

    )
}
