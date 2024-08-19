import React, { useContext, useEffect, useState } from 'react'
import 'react-dropzone-uploader/dist/styles.css'
import Dropzone from 'react-dropzone-uploader'
import { properties } from '../../properties';
import { get } from "../../common/util/restUtil";
import { toast } from "react-toastify";

import axios from 'axios'
import { AppContext } from "../../AppContext";
import { hideSpinner, showSpinner } from '../spinner';

const FileUpload = (props) => {
    const { currentFiles = [], existingFiles, entityType, permission = false, isEdit, refresh } = props.data;
    const { setCurrentFiles } = props.handlers;
    const { auth } = useContext(AppContext);
    const [keyLength, setKeyLength] = useState(0)
    let array = []

    useEffect(() => {
        console.log('refresh ', refresh)
        if (refresh) {
            setKeyLength(1)
        }
    }, [refresh])

    // called every time a file's `status` changes
    const handleChangeStatus = ({ meta, file, remove }, status) => {
        if (file.size > 10980000) {
            if (status === "preparing") {
                remove()
                toast.error("Attached file size is larger than 10 MB.")
                return false;
            }
            else {
                return false;
            }
        }
        // let name = file.name
        let arrayObject = {}
        if (status === 'done') {

            (async () => {
                const data = new FormData();
                data.append("file_to_upload", file)
                try {
                    showSpinner()
                    const API_ENDPOINT = properties.API_ENDPOINT + (process.env.NODE_ENV === 'development' ? '' : properties.REACT_APP_BASE)
                    await axios.post(API_ENDPOINT + properties.COMMON_API + '/upload-files/local?entityType=' + entityType, data, {
                        headers: {
                            "x-tenant-id": process.env.NODE_ENV === 'development' ? properties.REACT_APP_TENANT_ID : undefined,
                            //    "x-refresh-token": auth?.refreshToken,
                            Authorization: auth?.accessToken
                        },
                    }).then((resp) => {
                        arrayObject = { entityId: resp?.data?.data?.entityId, metaId: meta?.id }
                        array.push(arrayObject)
                        setCurrentFiles([...currentFiles, ...array])
                        toast.success(`${file.name} Uploaded Successfully`)
                    })
                        .catch((error) => {
                            console.error(error)
                        })
                        .finally(hideSpinner);
                } catch (error) {
                    console.error(error)
                }
            })();
        }
        else if (status === 'removed') {
            let data = currentFiles.filter((item) => item.metaId !== meta.id)
            setCurrentFiles(data)
        }
    }

    const handleFileDownload = (id) => {
        get(`${properties.COMMON_API}/download-files/${id}`)
            .then((resp) => {
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
            })
            .catch((error) => {
                console.error("error", error);
            });
    }
    console.log('currentFiles.length ', keyLength)
    return (
        <div className="col-12 mt-2">
            {permission !== true &&
                <div className="col-lg-12 mt-2 pl-3 pr-3">
                    <span className="errormsg">Each File Size allowed : less than 10 mb</span>
                    <Dropzone
                        key={keyLength}
                        disabled={isEdit}
                        classNames="w-100"
                        onChangeStatus={handleChangeStatus}
                        styles={{ dropzone: { height: "100px" } }}
                        accept="image/*,.pdf,.txt,.docx,.doc,.xlsx,.xls,.csv,audio/mp3, audio/mpeg"
                        submitButtonContent=""
                        maxSizeBytes="10980000"
                        maxFiles={5}
                    />
                </div>
            }
            <div className="col-12">
                {existingFiles?.length > 0 && existingFiles.map((file) => {
                    return (
                        <div className="attach-btn" key={file.attachmentUuid}>
                            <i className="fa fa-paperclip" aria-hidden="true"></i>
                            <span className='a cursor-pointer' key={file.attachmentUuid} onClick={() => handleFileDownload(file.attachmentUuid)}>{file.fileName}</span>
                        </div>
                    );
                })
                }
            </div>
            {permission === true && existingFiles && existingFiles.length === 0 &&
                <div className="col-12 msg-txt pl-2 pr-2 pb-0">
                    <p className="skel-widget-warning">No Attachments Found</p>
                </div>
            }
        </div>
    );
}


export default FileUpload;