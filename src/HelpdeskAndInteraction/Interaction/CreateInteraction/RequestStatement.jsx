import { useEffect, useState } from "react";
import DatalistInput from "react-datalist-input";
import ReactSwitch from "react-switch";
import robotIcon from "../../../assets/images/robot.png"


const RequestStatement = (props) => {
    const { switchStatus, withStatement, appsConfig, isSmartOpen, selectedCategory, isExpanded, value, placeholder, items } = props.data
    const { setValue, flushOlderResponse, handleWithStatement, setServiceMsg, setSwitchStatus, handleClearResolution, setIsExpanded, handleKnowledgeSelect
        , handleKnowledgeInteractionChange
    } = props.handler

    const [newItems, setNewItems] = useState(items)
    useEffect(() => {
        let updatedItems = items.map((i) => {
            if (i.triggerType === "A") {
                return {
                    ...i,
                    value: `🤖 ${i.requestStatement}`
                };
            } else {
                return {
                    ...i,
                    value: `🧑 ${i.requestStatement}`
                };
            }
        });

        // Grouping based on trigger type        
        // const filterItems = updatedItems.filter((i)=>{
        //     return switchStatus? i.triggerType==="A": i.triggerType==="M"
        // })
        setNewItems(updatedItems);
    }, [items, robotIcon, switchStatus]);

    return (
        <div>
            {!switchStatus &&
                <div className="col-md-12 mt-3 pl-0" onChange={(e) => {
                    setValue(null);
                    flushOlderResponse();
                    handleWithStatement(e);
                    setServiceMsg();
                }}>
                    <div className="form-check-inline radio radio-primary">
                        <input defaultChecked={withStatement} type="radio" id="radio2" className="form-check-input" name="withStatement" value="YES"
                        // onChange={(e) => {
                        //   setValue(null);
                        //   flushOlderResponse();
                        //   handleWithStatement(e);
                        //   setServiceMsg();
                        // }}
                        />
                        <label htmlFor="radio2" className=" cursor-pointer">With Statement</label>
                    </div>
                    <div className="form-check-inline radio radio-primary">
                        <input type="radio" defaultChecked={!!!withStatement} id="radio1" className="form-check-input" name="withStatement" value="NO"
                        // onChange={(e) => {
                        //   setValue(null);
                        //   flushOlderResponse();
                        //   handleWithStatement(e);
                        //   setServiceMsg();
                        // }} 
                        />
                        <label htmlFor="radio1" className=" cursor-pointer">Without Statement</label>
                    </div>
                </div>
            }
            <hr className="cmmn-hline pt-1 pb-1" />
            <div className="skel-form-heading-bar mt-2">
                <span className="messages-page__title">
                    Smart Assistance
                    {appsConfig?.clientConfig?.interaction?.smartAssistance && isSmartOpen && <ReactSwitch
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
                        }}
                    />}
                </span>
            </div>
            {withStatement ? <div className="cmmn-skeleton mt-2 mb-2">
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
                            flushOlderResponse();
                            setValue("");
                            setTimeout(() => {
                                setValue(item.value);
                                handleKnowledgeSelect(item);
                            }, 500);
                        }}
                        label={false}
                        items={newItems}
                        onChange={(e) => handleKnowledgeInteractionChange(e, null, switchStatus)}
                        placeholder={placeholder}
                    />
                </div>
            </div> : <></>
                // <div className="form-group mt-2">
                //   <label htmlFor="remarks" className="control-label">Type your Statement here<span className="text-danger font-20 pl-1 fld-imp">*</span></label>
                //   <textarea className="form-control undefined" id="requestStatement" name="remarks" rows="4" onChange={(e) => handleInputChange(e)} maxlength="1000"></textarea>
                //   <span>Maximum 1000 characters</span>
                //   <span className="errormsg"></span>
                // </div>
            }</div>
    )
}

export default RequestStatement;