import { useEffect, useRef, useState, useContext } from "react";
import DatalistInput, { useComboboxControls } from "react-datalist-input";
import { post, get, slowPost } from "../common/util/restUtil";
import { properties } from "../properties";
import { unstable_batchedUpdates } from "react-dom";
import clone from "clone";
import ResolutionCorner from "./ResolutionCorner";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { AppContext } from "../AppContext";

const KBStatement = () => {
    const { auth } = useContext(AppContext);
    const [items, setItems] = useState([]);
    const [first2Items, setFirst2Items] = useState([]);
    const [remainingItems, setRemainingItems] = useState([]);
    const [historyTxnId, setHistoryTxnId] = useState(null);
    const [frequentStatement, setFrequentStatement] = useState([]);
    const [isQuickResolution, setIsQuickResolution] = useState(true);
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [isThumbsDown, setIsThumbsDown] = useState(false);
    const [isHistory, setIsHistory] = useState(false);
    let initialResponseData = [];
    const [resolutionData, setResolutionData] = useState(initialResponseData);
    let initialWorkflowResponse = [];
    const [workflowResponse, setWorkflowResponse] = useState(
        initialWorkflowResponse
    );
    const [formDetails, setFormDetails] = useState([]);
    const [values, setValues] = useState([]);
    const lookupData = useRef({});
    const formRef = useRef(null);
    const [displayResponse, setDisplayResponse] = useState("");
    const [isCompletedTyping, setIsCompletedTyping] = useState(false);
    const [stopTyping, setStopTyping] = useState(false);
    let newArray = clone(resolutionData);
    const { isExpanded, setIsExpanded, setValue, value } = useComboboxControls({
        isExpanded: false,
    });

    const saveHistory = async (history) => {
        slowPost(`${properties.KNOWLEDGE_API}/save-resolution-history`, {
            history,
            txnId: historyTxnId,
        })
            .then(async (resp) => {
                console.log("resp-------->", resp);
            })
            .catch((err) => {
                console.log("err------>", err);
            });
    };

    const getKnowledgeBase = async () => {
        const resp = await get(
            `${properties.KNOWLEDGE_API}/get-knowledgebase-list`
        );
        if (resp?.data) {
            const arr = resp?.data?.map((i) => ({
                id: i.kbId,
                value: i.questions,
                ...i,
            }));
            unstable_batchedUpdates(() => {
                setItems(arr);
            });
        }
        const freqResp = await get(
            `${properties.KNOWLEDGE_API}/get-frequent-kb-list/${auth?.user?.userId}`
        );
        if (freqResp?.data) {
            unstable_batchedUpdates(() => {
                setFrequentStatement(freqResp?.data);
            });
        }
    };

    useEffect(() => {
        getKnowledgeBase();
    }, []);

    const [workflowPaylod, setWorkflowPaylod] = useState({
        flowId: "",
        conversationUid: "",
        data: {
            source: "SmartAssistance",
        },
    });

    const workflowApiCall = (reqBody, data) => {
        unstable_batchedUpdates(() => {
            setIsHistory(false);
            if (data && data?.length > 0) {
                reqBody.data.resolutionData = JSON.stringify(data);
            }
            slowPost(`${properties.WORKFLOW_API}/resolution`, reqBody)
                .then(async (resp) => {
                    let messageObject = {
                        from: "bot",
                        msg: resp.data,
                    };
                    setWorkflowResponse([...workflowResponse, messageObject]);
                    newArray.push(messageObject);
                    setResolutionData(newArray);
                    await saveHistory(
                        newArray?.filter(
                            (ele) => ele?.msg?.conversation?.actionType !== "COLLECTINPUT"
                        )
                    );
                })
                .catch((error) => {
                    // console.log(error)
                });
        });
    };

    const getResolution = async (payload) => {
        console.log("payload---------->", payload);
        const reqBody = {
            kbId: payload?.kbId,
            userId: auth?.user?.userId,
            departmentId: auth?.currDeptId,
            roleId: auth?.currRoleId,
        };
        post(`${properties.KNOWLEDGE_API}/get-knowledgebase-resolution`, reqBody)
            .then((resp) => {
                setHistoryTxnId(resp?.data?.txnId);
                if (resp?.data?.kbId) {
                    setWorkflowPaylod({
                        flowId: resp?.data?.flwId,
                        conversationUid: resp?.data?.conversationUid,
                        data: {
                            source: "knowledgeBase",
                        },
                    });

                    const messageObject = {
                        from: "user",
                        msg: { callAgain: false, description: payload?.value },
                    };
                    let data = [...resolutionData, messageObject];
                    newArray.push(messageObject);
                    setResolutionData(newArray);

                    workflowApiCall(
                        {
                            flowId: resp?.data?.flwId,
                            conversationUid: resp?.data?.conversationUid,
                            data: {
                                source: "knowledgeBase",
                                reqBody,
                            },
                        },
                        data
                    );
                    setValue(resp.data.kbStatement);
                } else {
                    setIsCompletedTyping(false);
                    let i = 0;
                    const intervalId = setInterval(() => {
                        setDisplayResponse(resp.message.slice(0, i));
                        i++;
                        if (i > resp.message.length) {
                            clearInterval(intervalId);
                            setIsCompletedTyping(true);
                        }
                    }, 20);
                    return () => clearInterval(intervalId);
                }
            })
            .catch((error) => {
                console.error(error);
            });
    };

    const handleKnowledgeSelect = async (item) => {
        console.log("item---------->", item);
        unstable_batchedUpdates(() => {
            setIsHistory(false);
            setResolutionData([]);
            setWorkflowResponse([]);
            setIsFormDisabled(false);
            setIsQuickResolution(false);
            setFormDetails([]);
            setValues([]);
            setDisplayResponse("");
        });
        await getResolution({ kbId: item?.kbId ?? null, value: item?.value });
    };

    function isBase64(str) {
        const finalString = str.split("base64,")?.[1] || "";
        const isBase64 =
            /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(
                finalString
            );
        return isBase64;
    }

    const clickToProceed = (
        ele,
        selectedService,
        resolutionPayload,
        idx,
        description
    ) => {
        if (ele === "SELECTED_INTXN") {
            resolutionPayload.data.inputType = "MESSAGE";
            resolutionPayload.data.inputValue = description;
            // // console.log('description---------->', description)
            if (description?.includes("_")) {
                description = description.split("_")[0];
            }
            const messageObject = {
                from: "user",
                msg: { callAgain: false, description },
            };
            let data = [...resolutionData, messageObject];
            newArray.push(messageObject);
            setResolutionData(newArray);
            workflowApiCall(resolutionPayload, data);
            document.getElementById("hide" + idx).style.display = "none";

            // document.getElementById("hide" + idx).innerHTML = "";
        } else if (ele === "SUBMIT_REMARKS") {
            if (!description || description === null || description === "") {
                toast.error("Please type remarks");
            } else {
                resolutionPayload.data.inputType = "MESSAGE";
                resolutionPayload.data.inputValue = description;
                const messageObject = {
                    from: "user",
                    msg: { callAgain: false, description },
                };
                let data = [...resolutionData, messageObject];
                newArray.push(messageObject);
                setResolutionData(newArray);
                workflowApiCall(resolutionPayload, data);
                document.getElementById("hide" + idx).style.display = "none";

                // document.getElementById("hide" + idx).innerHTML = "";
            }
        } else if (ele === "FORM_SUBMIT") {
            Swal.fire({
                title: "Confirm",
                text: `Are you sure ?`,
                icon: "info",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: `Yes!`,
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    if (!description || description === null || description === "") {
                        toast.error("Please Fill the Form");
                    } else if (
                        typeof description === "object" &&
                        Object.keys(description)?.length < 2
                    ) {
                        toast.error("Please Fill the Form");
                        return;
                    } else {
                        resolutionPayload.data.inputType = "FORMDATA";
                        resolutionPayload.data.inputValue = description;
                        // // console.log('description-------->', description)
                        // // console.log('self_submit ------------->',)
                        let descriptionValue;

                        if (selectedService === "self_submit") {
                            descriptionValue =
                                description["Department"] + "," + description["role"];
                            // document.getElementById("hide" + idx).innerHTML = "";
                        } else if (selectedService === "selfSubmit") {
                            let arr = [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec",
                            ];
                            description["month"] = Number(description["month"]);
                            description["year"] = Number(description["year"]);

                            let m;
                            if (description["month"] >= 1 && description["month"] <= 12) {
                                m = arr[description["month"] - 1];
                            } else {
                                m = "Invalid Month";
                            }
                            descriptionValue = m + "-" + description["year"];
                        } else if (selectedService === " Others_submit") {
                            descriptionValue = "Form Details Submitted.";
                        } else {
                            if (typeof description === "object") {
                                let keyArray =
                                    Object.keys(description)[Object.keys(description).length - 1];
                                if (
                                    typeof description[keyArray] === "array" ||
                                    typeof description[keyArray] === "object"
                                ) {
                                    const valuesArray = description[keyArray]?.map(
                                        (ele) => ele?.value || ele?.calendarShortName
                                    );
                                    descriptionValue = valuesArray.join(", ");
                                } else if (
                                    isBase64(description[keyArray]) ||
                                    description[keyArray].includes(`<form id="dynamicForm">`)
                                ) {
                                    descriptionValue = "Form Details Submitted.";
                                } else if (description[keyArray].includes(`id="hide`)) {
                                    descriptionValue = "Form Details Submitted.";
                                } else {
                                    descriptionValue = description[keyArray];
                                }
                            } else {
                                descriptionValue = description;
                            }
                        }
                        const messageObject = {
                            from: "user",
                            msg: { callAgain: false, description: descriptionValue },
                        };
                        let data = [...resolutionData, messageObject];
                        newArray.push(messageObject);
                        setResolutionData(newArray);
                        workflowApiCall(resolutionPayload, data);
                        document.getElementById("hide" + idx).style.display = "none";

                        // document.getElementById("hide" + idx).innerHTML = "";
                    }
                } else {
                    // document.getElementById("hide" + idx).innerHTML = "";
                    setIsFormDisabled(false);
                }
            });
        } else {
            if (ele?.name === "NO") {
                Swal.fire({
                    title: ele?.popup,
                    text: ``,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: `Yes!`,
                    allowOutsideClick: false,
                }).then((result) => {
                    if (result.isConfirmed) {
                        const messageObject = {
                            from: "user",
                            msg: { callAgain: false, description: ele?.name },
                        };
                        let data = [...resolutionData, messageObject];
                        newArray.push(messageObject);
                        setResolutionData(newArray);
                        resolutionPayload.data.inputType = "MESSAGE";
                        resolutionPayload.data.inputValue = ele?.name;
                        workflowApiCall(resolutionPayload, data);
                        document.getElementById("hide" + idx).style.display = "none";

                        // document.getElementById("hide" + idx).innerHTML = "";
                    }
                });
            } else {
                Swal.fire({
                    title: ele?.popup,
                    type: "info",
                    //html: '<h1 height="42" width="42">🙂</h1>',
                    showCloseButton: true,
                    showCancelButton: true,
                    focusConfirm: false,
                    cancelButtonText: "Cancel",
                    confirmButtonText: "Ok",
                    confirmButtonAriaLabel: "Thumbs up, great!",
                    customClass: {
                        cancelButton: "skel-btn-cancel",
                        confirmButton: "skel-btn-submit mr-2",
                    },
                    buttonsStyling: false,
                    cancelButtonAriaLabel: "Thumbs down",
                    allowOutsideClick: false,
                }).then((result) => {
                    if (result.isConfirmed) {
                        const messageObject = {
                            from: "user",
                            msg: { callAgain: false, description: ele?.name },
                        };
                        let data = [...resolutionData, messageObject];
                        newArray.push(messageObject);
                        setResolutionData(newArray);
                        resolutionPayload.data.inputType = "MESSAGE";
                        resolutionPayload.data.inputValue = {
                            ...formDetails,
                            description: ele?.name,
                        };
                        workflowApiCall(resolutionPayload, data);
                        document.getElementById("hide" + idx).style.display = "none";

                        // document.getElementById("hide" + idx).innerHTML = "";
                    }
                });
            }
        }
    };

    const handleStopConversation = () => {
        console.log("calling stop----");
        setStopTyping(true);
        setIsCompletedTyping(true);
    };

    const flushOlderResponse = async () => {
        console.log("Flushing the older responses");
        newArray = [];
        setResolutionData(initialResponseData);
        setWorkflowResponse(initialWorkflowResponse);
    };

    const showHistory = async (history) => {
        setIsQuickResolution(false);
        await flushOlderResponse();
        setIsHistory(true);
        setResolutionData(history?.kbHistory);
    };

    useEffect(() => {
        const defaultItems = items?.filter((ele) => ele?.isDefault === "Y") || [];
        const firstTwoItems = defaultItems.slice(0, 2);
        const remainingItems = defaultItems.slice(2);
        setFirst2Items(firstTwoItems);
        setRemainingItems(remainingItems);
    }, [items]);

    const handleRedirect = () => {
        setIsThumbsDown(true);
        // handlePopupClick({
        //     screenCode: "HELPDESK_CREATE",
        //     url: "create-helpdesk",
        // });
    };

    const sendDtSurvey = () => {
        slowPost(`${properties.EXTERNAL_API}/get-survey-link`, {
            userId: auth?.user?.userId,
            uuid:historyTxnId
        })
            .then(async (resp) => {
                console.log("resp-------->", resp);
                Swal.fire({
                    title: "Confirm",
                    text: `Thanks for you feedback. Your feedback is highly valuable.`,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: `Yes!`,
                    allowOutsideClick: false,
                }).then((result) => {
                    if (result?.isConfirmed) { }
                })
            })
            .catch((err) => {
                console.log("err------>", err);
            });
    }
    return (
        <div className="cnt-wrapper">
            <div className="card-skeleton">
                <div className="skel-cr-interaction">
                    <div className="form-row">
                        <div className="col-lg-3 col-md-12 col-xs-12">
                            <div className="cmmn-skeleton mt-2 frequent-kb">
                                <div className="mt-2">
                                    <span className="skel-profile-heading mb-2">
                                        Most Frequent Searches
                                    </span>

                                    <div className={`panel-data `}>
                                        Today
                                        <ul className="skel-rec-inter">
                                            {
                                                frequentStatement && frequentStatement?.today?.map((x, k) => (
                                                    <li key={k} onClick={() => showHistory(x)}><a >{x?.kbDetails?.questions || ""}</a></li>
                                                ))
                                            }
                                        </ul>
                                        Yesterday
                                        <ul className="skel-rec-inter">
                                            {
                                                frequentStatement && frequentStatement?.yesterday?.map((x, k) => (
                                                    <li key={k} onClick={() => showHistory(x)}><a >{x?.kbDetails?.questions || ""}</a></li>
                                                ))
                                            }
                                        </ul>
                                        Previous 7 Days
                                        <ul className="skel-rec-inter">
                                            {
                                                frequentStatement && frequentStatement?.previous_7_Days?.map((x, k) => (
                                                    <li key={k} onClick={() => showHistory(x)}><a >{x?.kbDetails?.questions || ""}</a></li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-9 col-md-12 col-xs-12">
                            <div className="cmmn-skeleton mt-2">
                                {/* {console.log('displayResponse ', displayResponse)} */}
                                {/* <hr className="cmmn-hline pt-1 pb-1" /> */}
                                <div className="skel-kn-ai-base skel-aichat-base">
                                    {/*** knowledge AI User ***/}
                                    {/* <div className="skel-kn-ai-user">
                                        <span className="skel-user-icon"><i class="fa fa-user-circle" aria-hidden="true"></i></span>
                                        <div className="skel-ai-user-st">
                                            I want New ID/Access Card
                                        </div>
                                    </div> */}
                                    <div className="skel-smart-assist">
                                        {displayResponse && <span> {displayResponse}</span>}
                                        {resolutionData &&
                                            resolutionData.length > 0 &&
                                            resolutionData.map((val, idx) => (
                                                <div key={idx}>
                                                    <ResolutionCorner
                                                        data={{
                                                            val,
                                                            idx,
                                                            resolutionPayload: workflowPaylod,
                                                            resolutionData,
                                                            formRef,
                                                            formDetails,
                                                            isFormDisabled,
                                                            values,
                                                            lookupData,
                                                            isCompletedTyping,
                                                            stopTyping,
                                                            isHistory,
                                                            isThumbsDown,
                                                        }}
                                                        handler={{
                                                            clickToProceed,
                                                            workflowApiCall,
                                                            setFormDetails,
                                                            setIsFormDisabled,
                                                            setValues,
                                                            setIsCompletedTyping,
                                                            handleRedirect,
                                                            sendDtSurvey
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        {isQuickResolution && (
                                            <div className="skel-knbase-helptips">
                                                <div className="row">
                                                    <div className="col">
                                                        <span className="skel-knowbase-heading">
                                                            How can I help you Today?
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="form-row skel-knowtips">
                                                    {first2Items?.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="col skel-knowtip-sect"
                                                            onClick={async () => {
                                                                await flushOlderResponse();
                                                                setValue(item?.value);
                                                                setStopTyping(false);
                                                                await handleKnowledgeSelect(item);
                                                            }}
                                                        >
                                                            <h5>{item?.questions}</h5>
                                                            <span>{item?.value}</span>
                                                            <span className="skel-fontawesome">
                                                                <i
                                                                    className="fa fa-arrow-circle-up"
                                                                    aria-hidden="true"
                                                                ></i>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="form-row skel-knowtips">
                                                    {remainingItems?.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="col skel-knowtip-sect"
                                                            onClick={async () => {
                                                                await flushOlderResponse();
                                                                setValue(item?.value);
                                                                setStopTyping(false);
                                                                await handleKnowledgeSelect(item);
                                                            }}
                                                        >
                                                            <h5>{item?.questions}</h5>
                                                            <span>{item?.value}</span>
                                                            <span className="skel-fontawesome">
                                                                <i
                                                                    className="fa fa-arrow-circle-up"
                                                                    aria-hidden="true"
                                                                ></i>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2 mb-2">
                                    <div className="skel-inter-search-st skel-ai-search">
                                        {/* <i className="fa fa-search"></i> */}

                                        {!isCompletedTyping && (
                                            <i
                                                className="fa fa-arrow-circle-up"
                                                aria-hidden="true"
                                            ></i>
                                        )}
                                        {isCompletedTyping && (
                                            <i
                                                onClick={handleStopConversation}
                                                className="fa fa-stop-circle"
                                                aria-hidden="true"
                                            ></i>
                                        )}

                                        <DatalistInput
                                            className=""
                                            isExpanded={isExpanded}
                                            setIsExpanded={setIsExpanded}
                                            value={value}
                                            setValue={setValue}
                                            placeholder="Type here.."
                                            inputProps={{
                                                "auto-complete": "new-password",
                                                id: "knowledgeBase",
                                                name: "knowledgeBase",
                                            }}
                                            onSelect={async (item) => {
                                                await flushOlderResponse();
                                                setValue(item.value);
                                                setStopTyping(false);
                                                await handleKnowledgeSelect(item);
                                            }}
                                            label={false}
                                            items={items}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KBStatement;
