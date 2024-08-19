import { useEffect, useState } from "react"
import { Dropdown } from 'react-bootstrap';

const HeaderActionsMenu = (props) => {

    const { setIsModelOpen, setShowTaskModal } = props?.stateHandlers
    const { isModelOpen, permissions, module } = props?.data;
    const { handleOnAssignToSelf, handleOnReAssignToSelf, checkComponentPermission, getCustomerDataForComplaint } = props?.functionHandlers
    const [menuList, setMenuList] = useState([])
    useEffect(() => {
        const MenuList = [
            { module: 'INTERACTION', flag: 'Cancel Interaction', id: 'isCancelOpen', className: 'skel-btn-cancel', isEnabled: permissions?.cancel && checkComponentPermission('CANCEL_BTN') },
            { module: 'INTERACTION', flag: 'Edit Interaction', id: 'isEditOpen', className: "skel-btn-edit", isEnabled: permissions?.edit },
            { module: 'INTERACTION', flag: 'Assign To Self', id: 'isAssignToSelfOpen', className: "skel-btn-submit", fn: handleOnAssignToSelf, fnIncluded: true, type: 'SELF', isEnabled: permissions?.assignToSelf },
            { module: 'INTERACTION', flag: 'ReAssign To Self', id: 'isReassignOpen', className: "skel-btn-submit", fn: handleOnReAssignToSelf, fnIncluded: true, type: 'REASSIGN_TO_SELF', isEnabled: permissions?.reAssignToSelf },
            { module: 'INTERACTION', flag: 'ReAssign', id: 'isReassignToUserOpen', className: "skel-btn-submit", isEnabled: permissions?.reAssign && checkComponentPermission('RE_ASSIGN_BTN') },
            { module: 'INTERACTION', flag: 'Add Follow-up', id: 'isAddFollowUpOpen', className: "skel-btn-submit", isEnabled: permissions?.followup },
            { module: 'HELPDESK', flag: 'Cancel Helpdesk', id: 'isCancelOpen', className: 'skel-btn-cancel', isEnabled: permissions?.cancel && checkComponentPermission('CANCEL_BTN') },
            { module: 'HELPDESK', flag: 'Edit Helpdesk', id: 'isEditOpen', className: "skel-btn-edit", isEnabled: permissions?.edit },
            { module: 'HELPDESK', flag: 'Escalate', id: 'isCreateOpen', className: "skel-btn-submit", isEnabled: permissions?.create, fnIncluded: true, fn: getCustomerDataForComplaint, type: '' },
            { module: 'HELPDESK', flag: 'Assign To Self', id: 'isAssignToSelfOpen', className: "skel-btn-submit", fn: handleOnAssignToSelf, fnIncluded: true, type: 'SELF', isEnabled: permissions?.assignToSelf },
            { module: 'HELPDESK', flag: 'ReAssign To Self', id: 'isReassignOpen', className: "skel-btn-submit", fn: handleOnReAssignToSelf, fnIncluded: true, type: 'REASSIGN_TO_SELF', isEnabled: permissions?.reAssignToSelf },
            { module: 'HELPDESK', flag: 'ReAssign', id: 'isReassignToUserOpen', className: "skel-btn-submit", isEnabled: permissions?.reAssign && checkComponentPermission('RE_ASSIGN_BTN') },
            { module: 'HELPDESK', flag: 'Add Follow-up', id: 'isAddFollowUpOpen', className: "skel-btn-submit", isEnabled: permissions?.followup },

            // { module: 'Interaction', flag: 'Workflow/Follow-up History', id: 'isWorkflowHistoryOpen', className: "skel-btn-submit", isEnabled: true },
        ]
        setMenuList(MenuList.filter(item => item.isEnabled));
    }, [checkComponentPermission, getCustomerDataForComplaint, handleOnAssignToSelf, handleOnReAssignToSelf, permissions])
    
    const handleOnChange = (e) => {
        const { target } = e
        setIsModelOpen({ ...isModelOpen, [target.id]: true })
    }

    const handleOnTaskModal = (e) => {
        setShowTaskModal(true)
    }

    return (
        <div className="skel-flex-card-wrap">
            <div className="skel-btns ml-auto">
                
                {menuList?.length > 0 && (menuList?.map((item, index) => (
                    item?.fnIncluded ? (
                        <button style={item.style} className={item.module === module ? item.className + ' mt-1' : 'd-none'} key={index} id={item?.id} onClick={() => item?.fn(item.type)}>
                            {item?.flag}
                        </button>
                    ) : (
                            <button style={item.style} className={item.module === module ? item.className + ' mt-1' : 'd-none'} key={index} id={item?.id} onClick={handleOnChange}>
                            {item?.flag}
                        </button>
                    )
                )))}
                <button className="skel-btn-submit" id="isWorkflowHistoryOpen" style={{ marginTop: '5px' }} onClick={handleOnChange}>
                    {module === 'INTERACTION' ? 'Workflow/' : ''} Follow-up History
                </button>
                {(module === 'INTERACTION' &&  permissions?.edit) && <button className="skel-btn-submit" id="isNewTaskOpen" style={{ marginTop: '5px' }} onClick={handleOnTaskModal}>
                    Add New Task
                </button>}
                
            </div>
        </div>
    )
}

export default HeaderActionsMenu