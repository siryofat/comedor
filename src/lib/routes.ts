import type { ISODate, MonthKey } from './menu/dates'

const base = import.meta.env.BASE_URL.replace(/\/$/, '')

export const homeHref = () => `${base}/`
export const dayHref = (date: ISODate) => `${base}/dia/${date}/`
export const weekHref = (start: ISODate) => `${base}/semana/${start}/`
export const monthHref = (month: MonthKey) => `${base}/mes/${month}/`
