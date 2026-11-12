import raw from '../../data/school_menu_2026_2027.json'
import { addDays, monthKey, startOfWeek, type ISODate, type MonthKey } from './dates'
import { DAY_KEYS, schoolMenuSchema, type MenuDay, type SchoolMenu } from './schema'

export * from './schema'
export * from './dates'

export interface SchoolDay {
  date: ISODate
  weekStart: ISODate
  menuWeek: number
  menu: MenuDay
}

export interface CalendarDay {
  date: ISODate
  schoolDay?: SchoolDay
}

export interface CalendarWeek {
  start: ISODate
  end: ISODate
  menuWeek: number
  /** Always five entries, lunes to viernes. */
  days: CalendarDay[]
}

export interface MonthCell extends CalendarDay {
  inMonth: boolean
}

export interface MonthRow {
  weekStart: ISODate
  menuWeek?: number
  cells: MonthCell[]
}

export function createMenuIndex(menu: SchoolMenu) {
  const weeklyMenus = new Map(menu.weekly_menus.map((w) => [w.week, w]))

  const weeks: CalendarWeek[] = menu.rotation_calendar.map((entry) => {
    const weekly = weeklyMenus.get(entry.menu_week)
    if (!weekly) throw new Error(`Semana de menú ${entry.menu_week} no encontrada`)
    const days = DAY_KEYS.map((_, i): CalendarDay => {
      const date = addDays(entry.week_start, i)
      if (date > entry.week_end) return { date }
      return {
        date,
        schoolDay: {
          date,
          weekStart: entry.week_start,
          menuWeek: entry.menu_week,
          menu: weekly.days[i],
        },
      }
    })
    return { start: entry.week_start, end: entry.week_end, menuWeek: entry.menu_week, days }
  })

  const schoolDays = weeks.flatMap((w) => w.days.flatMap((d) => (d.schoolDay ? [d.schoolDay] : [])))
  const dayByDate = new Map(schoolDays.map((d) => [d.date, d]))
  const weekByStart = new Map(weeks.map((w) => [w.start, w]))
  const months: MonthKey[] = [...new Set(schoolDays.map((d) => monthKey(d.date)))]

  function neighbors<T>(list: readonly T[], index: number) {
    return { prev: index > 0 ? list[index - 1] : undefined, next: list[index + 1] }
  }

  return {
    menu,
    weeks,
    schoolDays,
    months,

    getDay: (date: ISODate) => dayByDate.get(date),
    getWeek: (start: ISODate) => weekByStart.get(start),

    dayNeighbors: (date: ISODate) =>
      neighbors(
        schoolDays,
        schoolDays.findIndex((d) => d.date === date)
      ),
    weekNeighbors: (start: ISODate) =>
      neighbors(
        weeks,
        weeks.findIndex((w) => w.start === start)
      ),
    monthNeighbors: (month: MonthKey) => neighbors(months, months.indexOf(month)),

    /** Rows of lunes–viernes cells covering every weekday of the month. */
    monthGrid(month: MonthKey): MonthRow[] {
      const rows: MonthRow[] = []
      let weekStart = startOfWeek(`${month}-01`)
      while (monthKey(weekStart) <= month) {
        const cells = DAY_KEYS.map((_, i): MonthCell => {
          const date = addDays(weekStart, i)
          return { date, inMonth: monthKey(date) === month, schoolDay: dayByDate.get(date) }
        })
        if (cells.some((c) => c.inMonth)) {
          rows.push({ weekStart, menuWeek: weekByStart.get(weekStart)?.menuWeek, cells })
        }
        weekStart = addDays(weekStart, 7)
      }
      return rows
    },
  }
}

export type MenuIndex = ReturnType<typeof createMenuIndex>

/** Validated at import time: a malformed data file fails the build. */
export const schoolMenu = schoolMenuSchema.parse(raw)
export const menuIndex = createMenuIndex(schoolMenu)
