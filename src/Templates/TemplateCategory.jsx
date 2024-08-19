import React, { useState, useContext, useEffect } from "react";
import { TemplateContext } from "../AppContext";
import TemplateForm from "./TemplateForm";
import { post, put } from "../common/util/restUtil";
import { properties } from "../properties";
import { toast } from "react-toastify";
import { Modal, CloseButton } from 'react-bootstrap';
// import Modal from 'react-modal'
import DOMPurify from 'dompurify';

const TemplateCategory = () => {
    const { data, handlers } = useContext(TemplateContext);
    const { templateObj, templateData: templateDataProp, leftCatClicked, searchText } = data;
    const { setTemplateObj, selectTCat, getCount } = handlers;
    const { selectedTCat, businessEntities: { templateCategories, templateMapCategories } } = templateObj;

    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [mode, setMode] = useState("NEW");
    const [selectedTemplateData, setSelectedTemplateData] = useState({});
    const [templateData, setTemplateData] = useState([]);
    const [selectedTab, setSelectedTab] = useState("all");

    useEffect(() => {
        setTemplateData(templateDataProp?.length > 0 ? templateDataProp : []);
    }, [templateDataProp])

    useEffect(() => {
        renderTemplates();
    }, [selectedTab])

    useEffect(() => {
        renderTemplates();
    }, [searchText])

    useEffect(() => {
        setShowTemplateForm(false);
    }, [leftCatClicked])

    const tabs = [
        { id: "all", name: "All" },
        { id: "pinned", name: "Pinned" },
        { id: "recent", name: "Recent" }
    ]

    const getSelectedTemplateData = (event, mode) => {
        setTemplateObj({
            ...templateObj,
            selectedTCat: templateCategories.find(x => x.code === event.templateCategory)
        })
        // const { templateno: templateNo, mode: selectedMode } = event.target.dataset;
        const { templateNo: templateNo } = event;
        post(properties.MASTER_API + '/template/search', { templateNo }).then((resp) => {
            if (resp.status === 200) {
                setShowTemplateForm(true);
                setSelectedTemplateData(resp.data[0]);
                setMode(mode);
            }
        }).catch(err => toast.error("Error in fetching template details"))
    }

    const handlePin = (pinStatus, templateId) => {
        let body = { isPinned: pinStatus, entityCode: 'eRAwomq2IF', entityId: templateId };
        put(`${properties.MASTER_API}/template/set-pinned-status`, body).then((res) => {
            if (res.status === 200) {
                let index = templateData.findIndex(x => x.templateId === templateId);
                templateData[index]['isPinned'] = pinStatus;
                templateData[index]['updatedAt'] = new Date();
                setTemplateData([...templateData]);
                toast.success(`Template ${pinStatus ? 'pinned' : 'unpinned'}`);
            } else {
                toast.error("Error occured");
            }
        }).catch(err => {
            toast.error("Error occured");
        })
    }

    const [previewTemplate, setPreviewTemplate] = useState({ show: false, content: "" });
    const previewTemplateContent = (val) => {
        const content = val?.notificationTemplate?.body;
        setPreviewTemplate({ show: true, content: content });
    }

    const closePreview = () => {
        setPreviewTemplate({ show: false, content: "" });
        setShowTemplateForm(false);
    }

    const createMarkup = (html) => {
        return {
            __html: DOMPurify.sanitize(html)
        }
    }

    const renderTemplates = () => {
        let filteredTemplateData = [];

        // console.log(selectedTCat?.code);
        filteredTemplateData = templateData.filter(x => x.templateCategory === selectedTCat?.code);
        // console.log(filteredTemplateData);

        if (selectedTab === "pinned") {
            filteredTemplateData = filteredTemplateData?.filter(x => x.isPinned);
        } else if (selectedTab === "recent") {
            let length = (filteredTemplateData?.length > 10) ? 10 : filteredTemplateData?.length;
            filteredTemplateData?.sort(function (a, b) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
            filteredTemplateData = filteredTemplateData.slice(0, length);
        }

        if (searchText !== "") {
            filteredTemplateData = filteredTemplateData.filter(x =>
                x.templateNo?.toLowerCase()?.includes(searchText.toLowerCase()) ||
                x.templateName?.toLowerCase()?.includes(searchText.toLowerCase())
            );
        }

        return (
            <React.Fragment>
                {filteredTemplateData?.length > 0 ? (
                    filteredTemplateData.map((val, idx) => (
                        <div key={idx} className="col-md-3">
                            <div className="skel-templ">
                                <div className="skel-templ-details">
                                    <div className="skel-templ-id">{val.templateNo} <span onClick={() => handlePin(!(val.isPinned), val.templateId)}>
                                        <a><i className={`fas fa-thumbtack ${val.isPinned ? 'g-color' : ''}`}></i></a></span></div>
                                    <div className="skel-templ-name">{val.templateName}</div>
                                    <div className="">
                                        {/* {val.categoryDesc?.description} */}
                                        {["TC_EMAIL", "TC_SMS", "TC_WHATSAPP"].includes(val?.templateCategory) && (
                                            <React.Fragment>{templateMapCategories.find(x => x.code === val?.entity)?.description}</React.Fragment>
                                        )}
                                    </div>
                                    <div className="skel-templ-status">
                                        <span className="skel-success">{val?.statusDesc?.description}</span>
                                        {["TC_EMAIL", "TC_SMS", "TC_WHATSAPP"].includes(val?.templateCategory) && (
                                            <a className="skel-success ml-1" style={{ background: "#4c5a81", color: "#fff" }} onClick={() => previewTemplateContent(val)}><i className={`fa fa-eye`}></i></a>
                                        )}
                                    </div>
                                    {val.templateCategory === 'TC_APPOINT' && (
                                        <div className="skel-tot-slots">
                                            Total slots {val.appointDetailCount ?? 0}
                                        </div>
                                    )}
                                </div>
                                <hr />
                                <div className="skel-templ-bt">
                                    <p className="apt-footer">
                                        <a data-mode={'COPY'} onClick={() => { getSelectedTemplateData(val, 'COPY') }}>
                                            copy
                                        </a>
                                        <span className="bar">|</span>
                                        <a data-mode={'EDIT'} onClick={() => { getSelectedTemplateData(val, 'EDIT') }}>
                                            edit
                                        </a>
                                        <span className="bar">|</span>
                                        <a data-mode={'VIEW'} onClick={() => { getSelectedTemplateData(val, 'VIEW') }}>
                                            view
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-md-12" style={{ textAlign: 'center' }}>
                        <p className="skel-widget-warning">No Template Found!!!</p>
                    </div>
                )}

            </React.Fragment>
        );
    }

    const contextProvider = {
        data: {
            ...data,
            mode,
            selectedTemplateData
        },
        handlers: {
            ...handlers,
            setShow: setShowTemplateForm,
            setMode: setMode,
            setSelectedTemplateData: setSelectedTemplateData
        }
    }

    return (
        <TemplateContext.Provider value={contextProvider}>
            <React.Fragment>       
                {
                    showTemplateForm ? (
                        <TemplateForm />
                    ) :
                        (
                            <React.Fragment>
                               
                                <div className="tabbable">
                                    <ul className="nav nav-tabs" id="myTab" role="tablist">
                                        {tabs.map((tab, idx) => (
                                            <li key={idx} className="nav-item" onClick={(e) => {
                                                setSelectedTab(tab.id);
                                                document.querySelectorAll(".skel-tabs-templates").forEach(el => el.classList.remove("show", "active"))
                                                document.getElementById(`#${tab.id}templ`)?.classList?.add("show", "active")
                                            }}>
                                                <a className={`nav-link ${idx === 0 ? 'active' : ''}`} id={`${tab.id}-tab`} data-toggle="tab" href={`#${tab.id}templ`}
                                                    role="tab" aria-controls={`${tab.id}tab`} aria-selected="true">{tab.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="tab-content mt-1">
                                    {tabs.map((tab, idx) => (
                                        <div key={idx} className={`tab-pane fade skel-tabs-templates skel-base-height ${idx === 0 ? 'active show' : ''}`} id={`#${tab.id}templ`} role="tabpanel" aria-labelledby={`${tab.id}-tab`}>
                                            <div className="row">
                                                {tab.id === 'all' && (
                                                    <div className="col-md-3">
                                                        <div className="skel-templ">
                                                            <div className="skel-templ-details skel-new-template" onClick={() => { setMode("NEW"); setShowTemplateForm(true); setSelectedTemplateData({}); }}>
                                                                <div className="skel-create">
                                                                    <i className="material-icons">add</i>
                                                                    <span>New Template</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {renderTemplates()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </React.Fragment>
                        )}
            </React.Fragment>
            <Modal show={previewTemplate?.show} onHide={closePreview} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title>Content</Modal.Title>
                    <CloseButton onClick={closePreview} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                        {/* <span>×</span> */}
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <React.Fragment><div dangerouslySetInnerHTML={createMarkup(previewTemplate?.content ?? "")} /></React.Fragment>
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={closePreview}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal>
            {/* <Modal show={showTemplateForm} onHide={closePreview} dialogClassName="wsc-cust-mdl-temp-prev">
                <Modal.Header>
                    <Modal.Title>Content</Modal.Title>
                    <CloseButton onClick={closePreview} style={{ backgroundColor: 'transparent', fontWeight: 700, color: '#373737', fontSize: '1.5rem' }}>
                    </CloseButton>
                </Modal.Header>
                <Modal.Body>
                    <TemplateForm />                
                </Modal.Body>
                <Modal.Footer style={{ display: 'block' }}>
                    <div className="skel-btn-center-cmmn">
                        <button type="button" className="skel-btn-cancel" onClick={closePreview}>Close</button>
                    </div>
                </Modal.Footer>
            </Modal> */}
        </TemplateContext.Provider>
    )
}

export default TemplateCategory