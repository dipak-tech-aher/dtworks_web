import React, { Fragment } from 'react'
import { handleOnAttchmentDownload } from '../../../../../common/util/util';
import moment from 'moment';

export default function Attachment(props) {

    let { data } = props;
    return (
        <div className="skel-attach-hsitory">
            {data && data.length > 0 ? <>{data.map((attachment, index) => {
                let { fileName = false, attachmentUuid, updatedAt } = attachment;
                return (
                    <Fragment key={index}>
                        <div  >
                            <p className="mb-0">Attached by {attachment?.createdByDetails?.firstName ?? ''} {attachment?.createdByDetails?.lastName ?? ''}</p>
                            <span className="skel-int-cr-date">
                                Updated On: {moment(updatedAt).format('DD-MM-YYYY hh:mm A')}
                            </span>
                            <div className="attachment-details">
                                <span className="img-attachment cursor-pointer" onClick={() => handleOnAttchmentDownload(attachmentUuid)}>
                                    <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                                    {fileName ? fileName : ''}
                                </span>
                            </div>
                        </div>
                        <hr className="cmmn-hline mt-2 mb-2" />
                    </Fragment>
                )
            })}</> : <span className="skel-widget-warning">
                No attachement found!
            </span>}
            {/* <div>
                <p className="mb-0">Attached by "Will Smith"</p>
                <span className="skel-int-cr-date">
                    Updated On: 18-01-2024 11:30 AM
                </span>
                <div className="attachment-details">
                    <span className="img-attachment">
                        <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                        Screenshot.png
                    </span>
                </div>
            </div>
            <hr className="cmmn-hline mt-2 mb-2" />
            <div>
                <p className="mb-0">Attached by "Will Smith"</p>
                <span className="skel-int-cr-date">
                    Updated On: 17-01-2024 11:30 AM
                </span>
                <div className="attachment-details">
                    <span className="img-attachment">
                        <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                        Screenshot.png
                    </span>
                    <span className="img-attachment">
                        <i className="fa fa-paperclip" aria-hidden="true" />{" "}
                        Screenshot .png
                    </span>
                </div>
            </div> */}
        </div>
    )
}
