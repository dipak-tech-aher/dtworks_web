import { useContext, useEffect, useState } from "react";
import DatalistInput from "react-datalist-input";
import ReactSwitch from "react-switch";
import robotIcon from "../../../assets/images/robot.png"

const RequestStatement = (props) => {
    const { appsConfig, selectedCategory, isExpanded, value, placeholder, statementList } = props?.data
    const { setValue, flushOlderResponse, handleClearResolution, setIsExpanded, handleKnowledgeSelect, handleStatementChange } = props?.handler
    const [newItems, setNewItems] = useState(statementList.filter(f=> f.isOrder))
    useEffect(() => {
        let updatedItems = statementList.filter(f=> f.isOrder).map((i) => {
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
    }, [statementList]);

    console.log('newItems ', newItems)
    return (
        <div>
            <div className="cmmn-skeleton mt-2 mb-2">
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
                        onChange={(e) => handleStatementChange(e)}
                        placeholder={placeholder}
                    />
                </div>
            </div>
        </div>
    )
}

export default RequestStatement;