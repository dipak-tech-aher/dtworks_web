import { useCallback, useEffect, useMemo, useState } from "react"

const InteractionMenu = (props) => {

    const { setIsModelOpen } = props?.stateHandlers
    const { isModelOpen, permissions } = props?.data
    const { handleOnAssignToSelf, handleOnReAssignToSelf, checkComponentPermission } = props?.functionHandlers


    const MenuList = useMemo(() => [
        { module: 'Interaction', permissions: 'Search Customer', flag: 'Cancel Interaction', id: 'isCancelOpen', className: 'skel-btn-cancel', isEnabled: permissions.cancel && checkComponentPermission('CANCEL_BTN') },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'Edit Interaction', id: 'isEditOpen', className: "skel-btn-submit", isEnabled: permissions.edit },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'Assign To Self', id: 'isAssignToSelfOpen', className: "skel-btn-submit", fn: handleOnAssignToSelf, fnIncluded: true, type: 'SELF', isEnabled: permissions.assignToSelf },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'ReAssign To Self', id: 'isReassignOpen', className: "skel-btn-submit", fn: handleOnReAssignToSelf, fnIncluded: true, type: 'REASSIGN_TO_SELF', isEnabled: permissions.reAssignToSelf },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'ReAssign', id: 'isReassignToUserOpen', className: "skel-btn-submit", isEnabled: permissions.reAssign && checkComponentPermission('RE_ASSIGN_BTN') },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'Add Follow-up', id: 'isAddFollowUpOpen', className: "skel-btn-submit", isEnabled: permissions.followup },
        { module: 'Interaction', permissions: 'Search Customer', flag: 'Workflow/Follow-up History', id: 'isWorkflowHistoryOpen', className: "skel-btn-submit", isEnabled: true },

    ], [checkComponentPermission, handleOnAssignToSelf, handleOnReAssignToSelf, permissions])

    const handleOnChange = (e) => {
        const { target } = e
        setIsModelOpen({ ...isModelOpen, [target.id]: true })
    }

    return (
        <div className="skel-flex-card-wrap">
            <div className="skel-btns ml-auto">
                {MenuList &&
                    MenuList?.map((item, index) => (
                        item?.fnIncluded ? (
                            <button className={item?.className} key={index} id={item?.id} onClick={() => item?.fn(item.type)} hidden={!item.isEnabled}>
                                {item?.flag}
                            </button>) : (
                            <button className={item?.className} key={index} id={item?.id} onClick={handleOnChange} hidden={!item.isEnabled}>
                                {item?.flag}
                            </button>
                        )
                    ))}
            </div>
        </div>
    )
}

export default InteractionMenu