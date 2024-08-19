import React, { useContext, useEffect, useRef, useState } from 'react'
import { useHistory } from '../../common/util/history'
import { properties } from '../../properties';
import { get, post } from '../../common/util/restUtil';
import { nanoid } from 'nanoid';
import { object, string, array } from "yup";
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { unstable_batchedUpdates } from 'react-dom';
import { AppContext } from '../../AppContext';
import ReactQuill from 'react-quill';
export default function (props) {
    const { auth } = useContext(AppContext);
    const history = useHistory();
    const location = useLocation();
    const [faqObj, setFaqObj] = useState({ status: 'AC' });
    const [selectedChannels, SetSelectedChannels] = useState([])
    const [answer, SetAnswer] = useState('')
    const [channels, setChannels] = useState([]);
    const [error, setError] = useState({});
    const reactQuillRef = useRef(null)
    let validationSchema = object().shape({
        question: string().nullable(false).required("Question is required"),
        answer: string().nullable(false).required("Answer is required"),
        status: string().nullable(false).required("Status is required"),
        channels: array().min(1, "Channels is required")
    });
    useEffect(() => {
        get(properties.MASTER_API + '/lookup?searchParam=code_type&valueParam=CONFIG_CHANNEL').then((resp) => {
            if (resp.data) {
                setChannels(resp?.data?.CONFIG_CHANNEL?.map(x => { return { label: x.description, value: x.code } }) || [])
            }
        }).catch(err => console.log(err))
    }, [])
    useEffect(() => {
        const { state } = location || {};
        if (state) {
            const { status, question, answer, channel, faqId } = state;
            unstable_batchedUpdates(() => {
                setFaqObj({ status, question, faqId });
                SetAnswer(answer)
                SetSelectedChannels(channel ?? []);
            })

        }
    }, [location]);
    const onChange = (e) => {
        let { id, value } = e?.target
        setFaqObj({ ...faqObj, [id]: value })
    }
    const onChannelChange = (channel) => {
        let tempChannel = new Set(selectedChannels)
        if (tempChannel.has(channel)) {
            tempChannel.delete(channel);
        } else {
            tempChannel.add(channel);
        }
        SetSelectedChannels([...tempChannel])
    }
    const validate = (data,) => {
        try {
            setError({});
            console.log(data)
            validationSchema.validateSync(data, { abortEarly: false });
        } catch (e) {
            e.inner.forEach((err) => {
                setError((prevState) => {
                    return { ...prevState, [err.params.path]: err.message };
                });
            });
            return e;
        }
    };
    const onSubmit = () => {
        try {
            let validationObj = { ...faqObj, channels: selectedChannels, answer };
            console.log(validationObj)
            if (validate(validationObj)) {
                return;
            }
            faqObj.channel = selectedChannels
            faqObj.answer = answer
            faqObj.userId = auth?.user?.userId
            post(properties.MASTER_API + '/faqs', faqObj).then((res) => {
                if (res.status === 200) {
                    console.log("Faqs ===> ", res);
                    toast.success(res.message ?? '')
                    goToList()
                }
            }).catch(error => {
                console.error(error)
            }).finally(() => {
                // setSaving(false);
            });
        } catch (e) {
            console.log('faqAdd Error', e)
        }
    }

    const goToList = () => {
        history('/faq')
    }
    const OnEditerChange = (e) => {
        const editor = reactQuillRef?.current?.getEditor();
        const unprivilegedEditor = reactQuillRef?.current?.makeUnprivilegedEditor(editor);
    
        const text = unprivilegedEditor?.getText()?.trim() || '';
        SetAnswer(text.length ? e : '');
    }
    let { question = '', status } = faqObj ?? {};
    return (
        <>
            <div id="wrapper">
                <div className="customer-skel">
                    <div className="cmmn-skeleton">
                        <div className="row">
                            <div className="skel-configuration-settings">
                                <div className="col-md-8">
                                    <div className="skel-config-top-sect">
                                        <h2>Add Frequently Asked Questions</h2>
                                        <p>
                                            FAQs are especially useful for addressing recurring
                                            inquiries and helping users find solutions without
                                            needing to contact support.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="skel-config-base">
                            <div className="skel-btn-row mb-3">
                                <button className="skel-btn-submit" onClick={() => goToList()} >
                                    View FAQ
                                </button>
                            </div>
                            <div className="skel-config-data d-block">
                                <div className="row pl-2 pt-2">
                                    <div className="col-md-8">
                                        <div className="col-md-8">
                                            <div className="form-group">
                                                <label htmlFor="fname" className="control-label">
                                                    Question
                                                    <span className="text-danger font-20 pl-1 fld-imp">
                                                        *
                                                    </span>
                                                </label>
                                                <input className="form-control" id="question" value={question} onChange={(e) => onChange(e)}
                                                />
                                                <span className="errormsg">{error?.question ?? ""}</span>
                                            </div>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="form-group">
                                                <label htmlFor="fname" className="control-label">
                                                    Answer
                                                    <span className="text-danger font-20 pl-1 fld-imp">
                                                        *
                                                    </span>
                                                </label>
                                                {/* <textarea className="form-control" id="answer" placeholder="" rows="4" value={answer} onChange={(e) => onChange(e)} />
                                                <span className="errormsg">{error?.answer ?? ""}</span> */}
                                                <ReactQuill theme="snow" ref={reactQuillRef} value={answer} onChange={(e) => OnEditerChange(e)} />
                                                <span className="errormsg">{error?.answer ?? ""}</span>
                                            </div>

                                        </div>
                                    </div>
                                    <div className="col-md-4 skel-faq-add">
                                        <div className="col-md-8">
                                            <div className="form-group">
                                                <label htmlFor="fname" className="control-label">
                                                    Channels
                                                    <span className="text-danger font-20 pl-1 fld-imp">
                                                        *
                                                    </span>
                                                </label>
                                            </div>
                                            {channels?.map((channel) => {
                                                return (
                                                    <div className="form-group form-check form-check-inline" key={nanoid()}>
                                                        <div className="custom-control custom-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                className="custom-control-input"
                                                                id={channel.value}
                                                                onClick={() => onChannelChange(channel.value)}
                                                                checked={selectedChannels.includes(channel.value)}
                                                                onChange={() => { }}
                                                            />
                                                            <label
                                                                className="custom-control-label"
                                                                htmlFor={channel.value}
                                                            >
                                                                {channel.label}
                                                            </label>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                            <span className="errormsg">{error?.channels ?? ""}</span>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label htmlFor="status" className="control-label">
                                                    Status{" "}
                                                    <span className="text-danger font-20 pl-1 fld-imp">
                                                        *
                                                    </span>
                                                </label>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm btn-toggle inter-toggle  ml-0 ${status === 'AC' ? 'active' : ''} `}
                                                    data-toggle="button"
                                                    aria-pressed="true"
                                                    autoComplete="off"
                                                    value={status}
                                                    onChange={() => onChange({ target: { id: 'status', value: status === 'AC' ? 'IN' : 'AC' } })}
                                                >
                                                    <div className="handle" />
                                                </button>
                                            </div>
                                            <span className="errormsg">{error?.status ?? ""}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-12 skel-btn-center-cmmn mt-3">
                                    <button type="button" className="skel-btn-cancel" onClick={() => goToList()}>
                                        Cancel
                                    </button>
                                    <button type="button" className="skel-btn-submit" onClick={() => onSubmit()}>
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </>

    )
}
