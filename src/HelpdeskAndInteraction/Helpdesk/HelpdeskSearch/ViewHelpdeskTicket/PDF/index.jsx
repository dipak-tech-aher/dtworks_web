import React, { forwardRef, useContext } from 'react'
import ReminderImg from '../../../../../assets/images/reminder-img.svg'
import { AppContext } from '../../../../../AppContext'
import { DefaultDateFormate } from '../../../../../common/util/dateUtil'
import moment from 'moment'
import { Markup } from 'interweave'
import { nanoid } from 'nanoid'
export default forwardRef(function ViewHelpdeskTicketPDF(props, ref) {
    const { appLogo } = useContext(AppContext), { detailedViewItem, logList, pdfData } = props?.data
    const renderRemainingText = () => {
        if (detailedViewItem?.complitionDate) {
            const daysLeft = moment(detailedViewItem?.complitionDate).diff(new Date(), 'days')
            return <span className={daysLeft < 0 ? 'text-danger' : ''}>
                {daysLeft < 0 ? `Helpdesk is overdue for more than ${Math.abs(daysLeft)} days.` : daysLeft === 0 ? `${daysLeft} days remaining. Your completion date is today.` : `${daysLeft} days remaining for completion.`}
            </span>
        }
        return ''
    }
    let userInfo = props.data?.detailedViewItem?.customerDetails, SummaryHeading = (detailedViewItem && detailedViewItem.userCategory === 'CUSTOMER') ? 'Interaction' : 'Helpdesk'
    return (
        <page size="A4" ref={ref} className="skel-print-pdf">
            <div className="page-header">
                <div style={{ backgroundColor: "#fff" }}>
                    <table width="100%">
                        <tbody>
                            <tr>
                                <td>
                                    <div className="print-logo">
                                        <img
                                            src={appLogo}
                                            alt=""
                                            height="60px"
                                        />
                                    </div>
                                </td>
                                <td className="table-border pr-2">
                                    <span className="pdf-title-report">{detailedViewItem?.helpdeskType?.description ?? ''} Report</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <hr className="cmmn-hline mt-1 mb-1" />
            </div>
            <content>
                <div className="page">
                    <table className="pdf-cust-info">
                        <thead>
                            <tr>
                                <td>
                                    <div className="page-header-space" />
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <div className='mt-2 mb-2'>
                                        <table width="100%">
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <table width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{userInfo ? `${userInfo.firstName ?? ""} ${userInfo.lastName ?? ""}` : ' '}</strong>
                                                                            <br />
                                                                            {userInfo && props.consumerFromIsEnabled == "Y" ? `${userInfo?.consumerFrom?.description ?? ""}` : ' '}
                                                                            <br/>
                                                                            {userInfo?.profileNo}
                                                                            <br />
                                                                            {userInfo?.contactDetails?.emailId ? `${userInfo?.contactDetails?.emailId ?? ""}` : '-'}
                                                                            <br />
                                                                            {userInfo
                                                                                ?.contactPreferences
                                                                                ? userInfo?.contactPreferences?.filter(val => val !== null).map(
                                                                                    (e) => {
                                                                                        return " " + e.description;
                                                                                    }
                                                                                )
                                                                                : ""}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                    <td className="pl-1 pr-1">&nbsp;</td>
                                                    <td>
                                                        <table width="100%">
                                                            <tbody>
                                                                <tr>
                                                                    <td>
                                                                        <div className="skel-inter-view-history">
                                                                            <div className="mt-0">
                                                                                <table className="table table-hover mb-0 table-centered table-nowrap text-center">
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th>Total {SummaryHeading}</th>
                                                                                            <th scope="col">Open {SummaryHeading}</th>
                                                                                            <th scope="col">Closed {SummaryHeading}</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        <tr>
                                                                                            <td>{pdfData?.summary_data?.total ?? 0}</td>
                                                                                            <td>{pdfData?.summary_data?.open ?? 0}</td>
                                                                                            <td>{pdfData?.summary_data?.closed ?? 0}</td>
                                                                                        </tr>
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pdf-a4-cnt">
                                        {detailedViewItem?.statementId && <div id="top-block" style={{ margin: "0px 0" }}>
                                            <h2 className="pdf-report-st">
                                                {detailedViewItem?.helpdeskSubject}
                                                {/* <blockquote>{detailedViewItem?.helpdeskSubject}</blockquote> */}
                                            </h2>
                                        </div>}
                                        <div
                                            id="block"
                                            style={{
                                                backgroundColor: "#F9F9FA",
                                                border: "1px solid #ccc",
                                                padding: "15px 20px"
                                            }}
                                        >
                                            <table width="100%">
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                            Helpdesk ID
                                                            <br />
                                                            <b>{detailedViewItem?.helpdeskNo}</b>
                                                        </td>
                                                        <td>
                                                            Helpdesk Type
                                                            <br />
                                                            <b>{detailedViewItem?.helpdeskType?.description ?? '-'}</b>
                                                        </td>
                                                        <td>
                                                            Created Date &amp; Time
                                                            <br />
                                                            <b>{detailedViewItem?.createdAt ? DefaultDateFormate(detailedViewItem?.createdAt, 'DD-MM-YYYY HH:mm:ss A') ?? '-' : '-'}</b>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div
                                            id="block"
                                            style={{
                                                backgroundColor: "#fff",
                                                borderBottomRightRadius: 6,
                                                borderBottomLeftRadius: 6,
                                                border: "1px solid #ccc",
                                                borderTop: 0,
                                                padding: "20px 20px 10px 20px",
                                                marginBottom: 15
                                            }}
                                        >
                                            <table width="100%">
                                                <tbody>
                                                    <tr>
                                                        <td width="70%">
                                                            <table>
                                                                <tbody>
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>Project</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">
                                                                            <b>{detailedViewItem?.project ? detailedViewItem?.project?.description : ''}</b>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>Severity</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">{detailedViewItem?.severity?.description ?? '-'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>From Email</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">{detailedViewItem?.mailId ?? ''}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>CC Email</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">{(detailedViewItem?.helpdeskCcRecipients && Array.isArray(detailedViewItem?.helpdeskCcRecipients)) ? detailedViewItem?.helpdeskCcRecipients?.map((ele) => ele?.emailAddress?.address + "\n") ?? '-' : '-'}</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>Channel</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">{detailedViewItem?.helpdeskSource?.description ?? '-'}</td>
                                                                    </tr>
                                                                    {/* <tr>
                                                                        <td width="40%">
                                                                            <b>Contact Preference</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">Email, WhatsApp</td>
                                                                    </tr> */}
                                                                    <tr>
                                                                        <td width="40%">
                                                                            <b>Solutions Solved by</b>
                                                                        </td>
                                                                        <td width="5%">:</td>
                                                                        <td width="65%">{(detailedViewItem && detailedViewItem.isResolvedBy) ? detailedViewItem.isResolvedBy === 'BOT' ? "Smart Assistance" : 'Human' : '-'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                        {detailedViewItem?.complitionDate && <td width="30%">
                                                            <div className="row align-items-center pdf-days-brd pb-3 pt-2">
                                                                <div className="col-md-12">
                                                                    <img
                                                                        src={ReminderImg}
                                                                        width={170}
                                                                        className="img-fluid"
                                                                        alt=""
                                                                    />
                                                                </div>
                                                                <div className="col-md-12 text-center mt-2">
                                                                    <p className="mb-0 mb-0 d-block p-0 line-height-normal">
                                                                        {renderRemainingText()}
                                                                        {/* No. of days delay
                                                                        <br />
                                                                        <b>13 days</b> */}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>}
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div
                                                id="block"
                                                style={{
                                                    backgroundColor: "#f6f6f6",
                                                    border: "1px solid #d9d9d9",
                                                    marginTop: 20,
                                                    padding: "10px 20px",
                                                    marginBottom: 30,
                                                    borderRadius: 6
                                                }}
                                            >
                                                <table width="100%">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <div className="pdf-est-time">
                                                                    Expected Resolution Date
                                                                    <span>
                                                                        <b> {detailedViewItem?.complitionDate ? moment(detailedViewItem?.complitionDate).format('DD-MM-YYYY HH:mm:ss A') : ' -'}</b>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="pdf-est-time">
                                                                    Expected Response Date and Time
                                                                    <span>
                                                                        <b>{detailedViewItem?.expectedResponseDate ? moment(detailedViewItem?.expectedResponseDate).format('DD-MM-YYYY HH:mm:ss A') : ' -'}</b>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <div className="pdf-est-time">
                                                                    Actual Response Date
                                                                    <span>
                                                                        <b>{detailedViewItem?.responseAt ? moment(detailedViewItem?.responseAt).format('DD-MM-YYYY HH:mm:ss A') : ' -'}</b>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="pdf-est-time">
                                                                    Closed Date
                                                                    <span>
                                                                        <b>{detailedViewItem?.updatedAt ? moment(detailedViewItem?.updatedAt).format('DD-MM-YYYY HH:mm:ss A') : ' -'}</b>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <tr>
                                                            <td>
                                                                <div className="pdf-est-time">
                                                                    Actual Resolution Date & Time
                                                                    <span>
                                                                        <b>{detailedViewItem?.actualResolutionDate ? moment(detailedViewItem?.actualResolutionDate).format('DD-MM-YYYY HH:mm:ss A') : ' -'}</b>
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <hr className="cmmn-hline mt-1 mb-3" />
                                            <h4 style={{ color: "#000", fontWeight: 600 }}>
                                                Incident Details
                                            </h4>
                                            <p dangerouslySetInnerHTML={{ __html: detailedViewItem?.helpdeskContent }} style={{ whiteSpace: 'pre-line' }} className='txt-wrap'>
                                            </p>
                                        </div>
                                        {logList?.[0]?.helpdeskContent &&<div
                                            id="block"
                                            style={{
                                                backgroundColor: "#f6f6f6",
                                                border: "1px solid #d9d9d9",
                                                marginTop: 10,
                                                padding: "10px 20px",
                                                marginBottom: 10,
                                                borderRadius: 6
                                            }}
                                        >
                                            <h4 style={{ color: "#000", fontWeight: 600 }}>
                                                Closure Remarks
                                            </h4>
                                            <p>
                                            {logList?.[0]?.helpdeskContent }
                                            </p>
                                        </div>}
                                        {(detailedViewItem?.conversation &&
                                            !!detailedViewItem?.conversation?.filter((val) => val.isFollowup === 'Y').length) && <div
                                                id="block"
                                                style={{
                                                    backgroundColor: "#4d5a80",
                                                    border: "1px solid #ccc",
                                                    color: "#fff",
                                                    borderRadius: 6,
                                                    padding: "15px 20px 20px"
                                                }}
                                            >
                                                {/* <div style="background-color: #fff;"> */}
                                                <h4 style={{ color: "#fff", fontWeight: 600 }}>
                                                    Follow-up History
                                                </h4>
                                                <table width="100%" className="pdf-logs">
                                                    <thead>
                                                        <tr>
                                                            <th width="25%">Date &amp; Time</th>
                                                            <th width="10%">Channel</th>
                                                            <th width="65%">Comments</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(detailedViewItem?.conversation &&
                                                            !!detailedViewItem?.conversation?.filter((val) => val.isFollowup === 'Y').length) ? <>
                                                            {detailedViewItem?.conversation?.filter((val) => val.isFollowup === 'Y').map((ele, idx) => {
                                                                return (
                                                                    <tr key={idx} >
                                                                        <td width="25%"> {moment(ele?.updatedAt).format('YYYY-MM-DD HH:mm A')}</td>
                                                                        <td width="10%">{ele?.channelDesc?.description ?? '-'}</td>
                                                                        <td width="65%">
                                                                            <Markup content={ele?.helpdeskContent} />
                                                                        </td>
                                                                    </tr>

                                                                );
                                                            })}</> : <tr><td colSpan={2}><span className="skel-widget-warning">
                                                                No records available yet
                                                            </span></td></tr>}
                                                    </tbody>
                                                </table>
                                            </div>}
                                    </div>
                                    <div
                                        id="block"
                                        style={{
                                            backgroundColor: "#f1f1f1",
                                            border: "1px solid #ccc",
                                            color: "#000",
                                            borderRadius: 6,
                                            padding: "15px 20px 20px",
                                            marginTop: 15
                                        }}
                                    >
                                        {/* <div style="background-color: #fff;"> */}
                                        <h4 style={{ color: "#000", fontWeight: 600 }}>Log Info</h4>
                                        <table width="100%" className="pdf-logs">
                                            <thead>
                                                <tr>
                                                    <th width="25%" style={{ color: "#fff" }}>
                                                        Date &amp; Time
                                                    </th>
                                                    <th width="10%" style={{ color: "#fff" }}>
                                                        Status
                                                    </th>
                                                    <th width="65%" style={{ color: "#fff" }}>
                                                        Comments
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logList && logList.length > 0 && logList.map((item) => {
                                                    return (<tr key={nanoid()}>
                                                        <td width="25%">{moment(item.createdAt).format('DD-MM-YYYY hh:mm A ')}</td>
                                                        <td width="10%">{item.statusDescDescription}</td>
                                                        <td width="65%">
                                                            {item?.helpdeskContent ?? '-'}
                                                        </td>
                                                    </tr>)
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </content>
            <div className="page-footer-space" />
        </page>

    )
})
