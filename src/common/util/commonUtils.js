import { isEmpty } from 'lodash'

/**
 * Get Full name from FirstName and LastName
 * @param {object} payload payload
 * @param {string} payload.firstName firstName
 * @param {string} payload.lastName lastName
 * @returns
 */
export const getFullName = (payload) => {
    let response = ''
    if (!isEmpty(payload)) {
        response = (payload?.firstName ?? '') + ' ' + (payload?.lastName ?? '')
    }
    return response
}

export const getColorClass = (payload = {}, key = undefined) => {
    let response
    if (!isEmpty(payload) && key) {
        response = payload?.find(x => x.code === key)?.mapping?.colorClass
    }
    return response
}

export const removeDuplicateObjects = (payload, key) => {
    let removedObject = []
    if (!isEmpty(payload) && key) {
        removedObject = payload.filter((arr, index, self) =>
            index === self.findIndex((t) => (t?.[key] === arr?.[key])))
    }
    return removedObject
}