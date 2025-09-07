export type LawId = string & { readonly brand: unique symbol }

export const createLawId = (value: string): LawId => {
    if(!value || value.trim().length === 0) {
        throw new Error('LawId は空にできません')
    }
    return value as LawId
}
