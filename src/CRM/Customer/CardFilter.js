import { memo } from 'react'
const CardFilter = (props) => {
    const {cardName}=props
    const { handleFilter } = props?.hanlder
    return <select className="form-control w-150" onChange={(e) => handleFilter(e?.target?.value, cardName)}>
        <option value="All">All</option>
        <option value="Helpdesk">Helpdesk</option>
        <option value="Interaction">Interaction</option>
    </select>
}

export default memo(CardFilter)