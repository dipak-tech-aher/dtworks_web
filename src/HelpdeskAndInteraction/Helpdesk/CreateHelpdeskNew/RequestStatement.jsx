import { useEffect, useState } from "react";
import DatalistInput from "react-datalist-input";
import ReactSwitch from "react-switch";

const RequestStatement = (props) => {
    const { switchStatus, withStatement, appsConfig, isSmartOpen, selectedCategory, isExpanded, value, placeholder, items = [] } = props.data
    const { setValue, flushOlderResponse, handleWithStatement, setServiceMsg, setSwitchStatus, handleClearResolution, setIsExpanded, handleKnowledgeSelect, handleClear, handleOnChange, handleStatementOnChange, resetAllFormValues, checkComponentPermission } = props.handler
    const [newItems, setNewItems] = useState(items)
    useEffect(() => {
        let updatedItems = items?.map((i) => {
            if (i.triggerType === "A") {
                return {
                    ...i,
                    // value: `${i.helpdeskStatement}`
                    value: `🤖 ${i.helpdeskStatement}`
                };
            } else {
                return {
                    ...i,
                    // value: `${i.helpdeskStatement}`
                    value: `🧑 ${i.helpdeskStatement}`
                };
            }
        });
        setNewItems(updatedItems ?? []);
    }, [items, switchStatus]);

    return (
        <div>

            {!switchStatus && checkComponentPermission('REQ_STATEMENT_KEYWORD_SWITCH') &&
                <>
                    <div className="mt-1" onChange={(e) => {
                        setValue(null);
                        flushOlderResponse();
                        handleWithStatement(e);
                        setServiceMsg();
                    }}>
                        <span><strong>Would you like to use it with a keyword?</strong></span>
                        <div className="ml-3 form-check-inline radio radio-primary">
                            <input defaultChecked={withStatement} type="radio" id="radio2" className="form-check-input" name="withStatement" value="YES" onClick={() => resetAllFormValues()} />
                            <label htmlFor="radio2" className=" cursor-pointer">Yes</label>
                        </div>
                        <div className="form-check-inline radio radio-primary">
                            <input type="radio" defaultChecked={!!!withStatement} id="radio1" className="form-check-input" name="withStatement" value="NO" onClick={() => resetAllFormValues()} />
                            <label htmlFor="radio1" className=" cursor-pointer">No</label>
                        </div>
                        <hr className="cmmn-hline pt-1 pb-1" />
                    </div>
                </>
            }

            {(withStatement && checkComponentPermission('REQ_STATEMENT_SMART_ASSISTANCE')) ?
                <div className="skel-form-heading-bar mt-3">
                    <span className="messages-page__title p-0">
                        Smart Assistance
                        {isSmartOpen && <ReactSwitch
                            onColor="#4C5A81"
                            offColor="#6c757d"
                            activeBoxShadow="0px 0px 1px 5px rgba(245, 133, 33, 0.7)"
                            height={20}
                            width={48}
                            className="inter-toggle skel-inter-toggle ml-2"
                            id="smartSwitch"
                            checked={switchStatus}
                            onChange={(e) => {
                                setValue(null);
                                flushOlderResponse();
                                setSwitchStatus(!switchStatus);
                                setServiceMsg();
                                handleClear();
                            }}
                        />}
                    </span>


                </div>
                : <></>
            }

            {withStatement ?
                <div className="mt-2 mb-2">
                    {selectedCategory && <ul className="skel-top-inter">
                        <li><a href="javascript:void(null)">{selectedCategory}</a><a href="javascript:void(null)"><i className="fas fa-times" onClick={() => { handleClearResolution() }}></i></a></li>
                    </ul>}
                    <div className="skel-inter-search-st">
                        <i className="fa fa-search"></i>
                        <DatalistInput
                            className=""
                            isExpanded={isExpanded}
                            setIsExpanded={setIsExpanded}
                            value={value}
                            setValue={setValue}
                            inputProps={{
                                'auto-complete': "new-password",
                                id: 'knowledgeBase',
                                name: 'knowledgeBase'
                            }}
                            onSelect={(item) => {
                                setValue(item.value);
                                handleKnowledgeSelect(item);
                                flushOlderResponse();
                            }}
                            label={false}
                            items={newItems}
                            onChange={(e) => handleStatementOnChange(e, null, switchStatus)}
                            placeholder={placeholder}
                        />
                    </div>
                </div> : <></>
                // <div className="form-group mt-2">
                //     <label htmlFor="remarks" className="control-label">Type your Statement here<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                //     <textarea className="form-control undefined" id="helpdeskSubject" name="remarks" rows="4" onChange={(e) => handleOnChange(e)} maxlength="1000"></textarea>
                //     <span>Maximum 1000 characters</span>
                //     <span className="errormsg"></span>
                // </div>
            }
            <hr className="cmmn-hline pt-1 pb-1" />
        </div>
    )
}

export default RequestStatement;