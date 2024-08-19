import React from 'react';
import { handleOnDownload, handleOnAttchmentDownload } from '../../../common/util/util';

const Attachements = (props) => {
    const { attachmentList, entityType, entityId } = props.data;
    return (
        <div className="col-12 d-flex flex-wrap">
            {
                attachmentList?.map((attachment, idx) => (
                    <div className="col-3 form-vtext my-1" key={attachment.id + idx}>
                        <div className="card mb-1 shadow-none border">
                            <div className="p-1">
                                <div className="d-flex align-items-center">
                                    <div className="avatar-sm">
                                        <span className="avatar-title badge-soft-primary text-primary rounded">
                                            {attachment?.fileName ? attachment?.fileName.split('.').pop() : ''}
                                        </span>
                                    </div>
                                    <div className="pl-1 flex-grow-1 text-truncate">
                                        <div className="text-muted font-weight-bold">
                                            {attachment?.fileName}
                                        </div>
                                    </div>
                                    <div className="col-auto">
                                        <div className="btn btn-link font-16 text-muted" onClick={() => handleOnAttchmentDownload(attachment?.attachmentUuid)}>
                                            <i className="dripicons-download"></i>
                                        </div>
                                    </div>
                                    {/* Uncomment if needed */}
                                    {/* <div className="col-auto">
                                        <div className="btn btn-link font-16 text-muted" onClick={() => handleOnDownload(entityId, entityType, attachment.attachmentId)}>
                                            <i className="dripicons-download"></i>
                                        </div>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    )
}

export default Attachements;