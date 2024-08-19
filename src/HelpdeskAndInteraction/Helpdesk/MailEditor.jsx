import moment from 'moment';
import React, { useState, useEffect, useCallback, memo, useContext, Fragment } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import ReactQuill from 'react-quill';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import * as Yup from "yup";
import FileUpload from '../../common/uploadAttachment/fileUpload';
import { properties } from '../../properties';
import { get, put } from '../../common/util/restUtil';
import { handleOnAttchmentDownload, removeEmptyKey, validate } from '../../common/util/util'
import CannedMessageModal from './CannedMessageModal';
import { Markup } from 'interweave';
import Attachements from './shared/Attachments';
import { AppContext } from '../../AppContext';
import { statusConstantCode } from '../../AppConstants'

const MailEditor = memo((props) => {
    const location = useLocation();
    const currentURL = location?.pathname;
    // console.log('props.match.url-------->', currentURL)
    const { detailedViewItem, isDisabled, refresh } = props.data;
    const { doSoftRefresh, setRefresh } = props.handlers;
    const [text, setText] = useState("");
    const [status, setStatus] = useState("");
    const [conversationIndex, setConversationIndex] = useState(-1);
    const [currentFiles, setCurrentFiles] = useState([]);
    const [mailAttachments, setMailAttachments] = useState([]);
    const [replyAttachments, setReplyAttachments] = useState([]);
    const [isCannedOpen, setIsCannedOpen] = useState(false);
    const [isCust, setIsCust] = useState(false)
    const [helpdeskDetails, setHelpdeskDetails] = useState({});
    const [error, setError] = useState({});

    const [isTruncated, setIsTruncated] = useState(true);

    const toggleTruncate = () => {
        setIsTruncated(!isTruncated);
    };

    const contentStyle = {
        textOverflow: isTruncated ? 'ellipsis' : 'inherit',
        overflow: isTruncated ? 'hidden' : 'visible',
        paddingRight: '10px',
        display: '-webkit-box',
        WebkitLineClamp: isTruncated ? 3 : 300,
        WebkitBoxOrient: 'vertical',
        cursor: 'pointer',
    };

    useEffect(()=>{
        if(refresh){
            setCurrentFiles([])
        }
    },[refresh])
    const getAttachments = useCallback((type) => {

        const isHelpdesk = type === 'HELPDESK' ? true : false;
        get(`${properties.ATTACHMENT_API}/${isHelpdesk ? detailedViewItem?.helpdeskUuid : `${detailedViewItem?.helpdeskUuid}?entityTxnUuid=${detailedViewItem?.conversation[0]?.helpdeskTxnUuid}`}`)
            .then((response) => {
                if (response.data && response.data.length) {
                    isHelpdesk ? setMailAttachments(response.data) : setReplyAttachments(response.data)
                }
            })
            .catch((error) => {
                console.error("error", error)
            })
            .finally()
    }, [])

    const handleOnChange = (e) => {
        const target = e.target;
        setHelpdeskDetails((prevVal) => ({
            ...prevVal,
            [target.id]: target.value
        }));
    };

    useEffect(() => {
        unstable_batchedUpdates(() => {
            setText("<br/>Regards,<br/>Support Team");
            setHelpdeskDetails({
                status: detailedViewItem?.status?.code ?? null,
                helpdeskType: detailedViewItem?.helpdeskType?.code ?? null,
                severity: detailedViewItem?.severity?.code ?? null,
                project: detailedViewItem?.project?.code ?? null,
                complitionDate: detailedViewItem?.complitionDate ?? null
            })
            setCurrentFiles([]);
        })
        // Commented for dtWorks 2.0
        getAttachments('HELPDESK');
        if (detailedViewItem?.conversation && !!detailedViewItem.conversation.length) {
            // Commented for dtWorks 2.0
            getAttachments('HELPDESKTXN');
            for (let idx = 0; idx < detailedViewItem.conversation.length; idx++) {
                if (detailedViewItem.conversation[idx].inOut === 'OUT') {
                    setConversationIndex(idx)
                    break
                }
            }
            setConversationIndex(detailedViewItem.conversation.length - 1)
        }
    }, [detailedViewItem])

    const handleOnRichTextChange = (text) => {
        setText(text)
    }

    const handleOnSubmit = () => {

        if (currentFiles && currentFiles.length > 0 && (!text || text.trim() === '')) {
            toast.info('A reply to customer must be provided along with attachments')
            return false
        }

        let requestBody = {
            ...helpdeskDetails,
            helpdeskId: detailedViewItem?.helpdeskId,
            content: text,
            attachments: currentFiles?.map((file) => file.entityId),
            entityType: statusConstantCode?.entityCategory?.HELPDESKTXN,
        }
        /** Remove the empty keys in given objects */
        requestBody = removeEmptyKey(requestBody)

        put(`${properties.HELPDESK_API}/update/${detailedViewItem?.helpdeskId}/REPLY`, requestBody)
            .then((response) => {
                const { status, message } = response;
                if (status === 200) {
                    doSoftRefresh('UPDATE_DETAILED_VIEW', detailedViewItem?.helpdeskId)
                    doSoftRefresh('CANCEL_VIEW');
                    setRefresh(!refresh)
                    if (status === statusConstantCode?.status?.HELPDESK_CLOSED) {
                        let el = document.querySelector(`li[data-helpdesk-no="${detailedViewItem?.helpdeskNo}"]`);
                        el?.parentNode?.removeChild(el);
                    }

                    toast.success(message);
                }
            })
            .catch(error => {
                console.log(error);
            })
            .finally()
    }

    const handleOnCancel = () => {
        doSoftRefresh('CANCEL_VIEW');
    }

    return (
        <div className="col-12 row pt-2 m-0 helpdesk-padding-left-0 skel-interaction-detail-section">
            {/* <table>
                {(detailedViewItem?.source)?.toUpperCase() !== 'WHATSAPP' && replyAttachments?.length > 0 && <tr>
                    <tr className='form-label'>Attachments</tr>
                    <td width="5%">:</td>
                    <td width="50%"><Attachements
                        data={{
                            attachmentList: replyAttachments?.filter((e) => e?.entityType === "HELPDESK"),
                            // attachmentList: mailAttachments,
                            entityId: detailedViewItem?.helpdeskId,
                            entityType: 'HELPDESK'
                        }}
                    /></td>
                    </tr>}
                 <tr>
                    <td className='form-label'>Last Conversation</td>
                    <td width="5%">:</td>
                    <td width="50%"><div className={`form-vtext col-auto p-0 ml-auto ${isDisabled ? 'd-none' : ''}`}>
                        <button className='badge badge-pill badge-primary p-1' onClick={() => setIsCannedOpen(true)}>Reply from Canned Message</button>
                    </div></td>
                </tr> 
            </table> */}
            <div className='col-12 mb-1'>
                {
                    detailedViewItem?.conversation && !!detailedViewItem?.conversation?.length && (
                        detailedViewItem?.conversation?.map((ele, i) => {
                            const filteredAttachments = replyAttachments.filter(e => e?.entityTxnUuid === ele?.helpdeskTxnUuid);
                            return <Fragment key={i}>
                                <div className="col-12 skel-transcript-conversation">
                                    {/* Date */}
                                    <div className="row">
                                        <div className="col-12 form-vtext skel-form-vtext">
                                            {ele?.sender}
                                            <div className="badge badge-pill badge-success">
                                                {ele?.createdAt ? moment(ele?.createdAt).format('DD-MMM-YYYY HH:mm A') : ''}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    {filteredAttachments.length > 0 && (
                                        <div className="row pt-2">
                                            <div className="col-12 form-vtext">
                                                <label className="col-12 form-vtext">Attachments:</label>
                                                {filteredAttachments?.map((file, idx) => (
                                                    <div className="attach-btn" key={file.entityId}>
                                                        <i className="fa fa-paperclip" aria-hidden="true"></i>
                                                        <span key={file.entityId} onClick={() => handleOnAttchmentDownload(file.attachmentUuid)}>{file.fileName}</span>
                                                    </div>
                                                ))}
                                                {/* <Attachements
                                                    data={{
                                                        attachmentList: filteredAttachments,
                                                        entityType: 'HELPDESKTXN'
                                                    }}
                                                /> */}
                                            </div>
                                        </div>
                                    )}

                                    {/* HTML Content */}
                                    <div className="row">
                                        <div className="col-12 form-vtext skel-form-vtext">
                                            <Markup content={ele?.helpdeskContent} />
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        })
                    )
                }
            </div>
            <div className={`col-12 mt-2 ${isDisabled ? 'd-none' : ''}`}>
                <div className={`mt-2 form-vtext col-auto p-0 ml-auto ${isDisabled ? 'd-none' : ''}`}>
                    <button className='badge badge-pill badge-primary p-1' onClick={() => setIsCannedOpen(true)}>Reply from Canned Message</button>
                </div>
                <ReactQuill
                    placeholder='Write Something...'
                    value={text}
                    modules={MailEditor.modules}
                    formats={MailEditor.formats}
                    onChange={handleOnRichTextChange}
                />
            </div>
            <div className={`col-12 mt-2 ${isDisabled ? 'd-none' : ''}`}>
                <FileUpload
                    data={{
                        currentFiles,
                        entityType: 'HELPDESKTXN',
                        shouldGetExistingFiles: false,
                    }}
                    handlers={{
                        setCurrentFiles
                    }}
                />
            </div>
            <div className={`row col-12 justify-content-center ${detailedViewItem?.laneSource === 'QUEUE' ? 'd-none' : ''}`}>
                <button type="button" className="skel-btn-cancel" onClick={handleOnCancel}>Cancel</button>
                <button type="button" className="skel-btn-submit skel-custom-submit-btn" onClick={handleOnSubmit}>Submit</button>
            </div>
            {
                isCannedOpen &&
                <CannedMessageModal
                    data={{
                        isCannedOpen
                    }}
                    handlers={{
                        setIsCannedOpen,
                        setText
                    }}
                />
            }
        </div>
    )
})

MailEditor.modules = {
    toolbar: [
        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' },
        { 'indent': '-1' }, { 'indent': '+1' }],
        ['link', 'video', { 'color': ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff', '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466', 'custom-color'] }, { 'background': [] }],
        ['clean']
    ],
    clipboard: {
        matchVisual: true,
    }
}

MailEditor.formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'video', 'color', 'background'
]


export default MailEditor;