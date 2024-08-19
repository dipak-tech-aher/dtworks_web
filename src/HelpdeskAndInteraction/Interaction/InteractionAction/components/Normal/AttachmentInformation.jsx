import React, { useMemo } from "react";
import { DefaultDateFormate } from "../../../../../common/util/dateUtil";
import { getFullName } from "../../../../../common/util/commonUtils";
import { properties } from "../../../../../properties";
import { get } from "../../../../../common/util/restUtil";

const AttachmentInformation = (props) => {
    const groupBy = (items, key) => items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [
                ...(result[item[key]] || []),
                item,
            ],
        }),
        {},
    )

    const { existingFiles } = props?.data
    const finalAttachmentList = useMemo(() => {
        let response = {}
        if (existingFiles) {
            response = groupBy(existingFiles, 'entityTxnUuid')
        }
        return response
    }, [existingFiles])

    const handleFileDownload = (id) => {
        get(`${properties.COMMON_API}/download-files/${id}`).then((resp) => {
            if (resp?.data?.url) {
                if (resp?.data?.provider === 'DATABASE') {
                    const downloadLink = document.createElement("a");
                    downloadLink.href = `data:application/octet-stream;base64,${resp?.data?.url}`;
                    downloadLink.download = resp?.data?.fileName; // Specify the file name here
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                } else {
                    const downloadLink = document.createElement("a");
                    downloadLink.href = resp?.data?.url;
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }
            }
        }).catch((error) => {
            console.error("error", error);
        });
    }

    const renderAttachmentList = (attachments) => {
        return (
            <div>
                <div className="attachment-details">
                    {attachments.map((attachment, index) => (
                        <span className="img-attachment cursor-pointer" key={attachment?.attachmentUuid} onClick={() => handleFileDownload(attachment.attachmentUuid)}><i className="fa fa-paperclip" aria-hidden="true" key={index}></i> {attachment.fileName}</span>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div> {existingFiles && existingFiles.length > 0 ? <div className="skel-attach-hsitory">
            <div>
                {Object.keys(finalAttachmentList).map((txnUuid, index) => (
                    <div key={index}>
                        <p className="mb-0">{`Attached by "${getFullName(finalAttachmentList[txnUuid]?.[0]?.createdByDetails ?? '-')}"`}</p>
                        <span className="skel-int-cr-date">Updated On: {DefaultDateFormate(finalAttachmentList[txnUuid]?.[0]?.createdAt, 'DD-MM-YYYY hh:mm A')}</span>
                        {renderAttachmentList(finalAttachmentList[txnUuid])}
                        <hr className="cmmn-hline mt-2 mb-2" />
                    </div>
                ))}
            </div>
        </div> :
            <div className="col-12 msg-txt pl-2 pr-2 pb-0">
                <p className="skel-widget-warning">No Attachments Found</p>
            </div>
        }
        </div>
    )
}
export default AttachmentInformation;