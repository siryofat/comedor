import { describe, expect, it } from 'vitest'
import raw from '../../data/school_menu_2026_2027.json'
import { createMenuIndex, menuIndex, schoolMenuSchema } from '.'
import { formatLongDate, formatRange, nearestAtOrBefore, startOfWeek, weekdayIndex } from './dates'

const clone = () => structuredClone(raw) as typeof raw

describe('schoolMenuSchema', () => {
  it('accepts the bundled data file', () => {
    expect(schoolMenuSchema.safeParse(raw).success).toBe(true)
  })

  it('rejects days out of order', () => {
    const data = clone()
    data.weekly_menus[0].days[0].day = 'martes'
    expect(schoolMenuSchema.safeParse(data).success).toBe(false)
  })

  it('rejects unknown fields', () => {
    const data = clone() as Record<string, unknown>
    data.extra = true
    expect(schoolMenuSchema.safeParse(data).success).toBe(false)
  })

  it('rejects rotation entries that reference a missing menu week', () => {
    const data = clone()
    data.rotation_calendar[0].menu_week = 9
    const result = schoolMenuSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['rotation_calendar', 0, 'menu_week'])
  })

  it('rejects rotation weeks that do not start on Monday', () => {
    const data = clone()
    data.rotation_calendar[0].week_start = '2026-09-08'
    expect(schoolMenuSchema.safeParse(data).success).toBe(false)
  })

  it('rejects negative nutrition values', () => {
    const data = clone()
    data.weekly_menus[0].days[0].school_lunch.nutrition.fat_g = -1
    expect(schoolMenuSchema.safeParse(data).success).toBe(false)
  })
})

describe('menuIndex', () => {
  it('maps every weekday of the rotation to a school day', () => {
    // 42 full weeks plus the final Monday–Tuesday of June 2027.
    expect(menuIndex.schoolDays).toHaveLength(42 * 5 + 2)
    expect(menuIndex.schoolDays.at(-1)?.date).toBe('2027-06-29')
  })

  it('resolves the menu for a date', () => {
    expect(menuIndex.getDay('2026-09-07')?.menu.school_lunch.main_course).toBe(
      'Espaguetis con atún'
    )
    const day = menuIndex.getDay('2026-10-14')
    expect(day?.menuWeek).toBe(6)
    expect(day?.menu.day).toBe('miércoles')
    expect(menuIndex.getDay('2026-09-12')).toBeUndefined()
  })

  it('lists the months of the school year', () => {
    expect(menuIndex.months[0]).toBe('2026-09')
    expect(menuIndex.months.at(-1)).toBe('2027-06')
    expect(menuIndex.months).toHaveLength(10)
  })

  it('builds a Monday–Friday month grid', () => {
    const rows = menuIndex.monthGrid('2026-09')
    expect(rows[0].cells.map((c) => c.date)).toEqual([
      '2026-08-31',
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
    ])
    expect(rows[0].cells[0].inMonth).toBe(false)
    expect(rows[0].menuWeek).toBeUndefined()
    expect(rows[1].menuWeek).toBe(1)
    expect(rows.at(-1)?.weekStart).toBe('2026-09-28')
  })

  it('skips grid rows whose weekdays all fall in another month', () => {
    // May 2027 starts on a Saturday: the first row must be the week of 3 May.
    expect(menuIndex.monthGrid('2027-05')[0].weekStart).toBe('2027-05-03')
  })

  it('leaves days past week_end without a menu', () => {
    const last = menuIndex.weeks.at(-1)!
    expect(last.days.map((d) => Boolean(d.schoolDay))).toEqual([true, true, false, false, false])
  })

  it('finds neighbours across weeks', () => {
    const { prev, next } = menuIndex.dayNeighbors('2026-09-14')
    expect(prev?.date).toBe('2026-09-11')
    expect(next?.date).toBe('2026-09-15')
    expect(menuIndex.dayNeighbors('2026-09-07').prev).toBeUndefined()
  })

  it('can be built from any valid menu', () => {
    const index = createMenuIndex(schoolMenuSchema.parse(raw))
    expect(index.weeks).toHaveLength(raw.rotation_calendar.length)
  })
})

describe('dates', () => {
  it('computes weekdays and week starts in UTC', () => {
    expect(weekdayIndex('2026-09-07')).toBe(0)
    expect(weekdayIndex('2026-09-13')).toBe(6)
    expect(startOfWeek('2027-01-01')).toBe('2026-12-28')
  })

  it('formats dates in Spanish', () => {
    expect(formatLongDate('2026-09-07')).toBe('Lunes, 7 de septiembre de 2026')
    expect(formatRange('2026-09-28', '2026-10-02')).toBe('28 sept – 2 oct')
  })

  it('finds the nearest key at or before a value', () => {
    const keys = ['2026-09', '2026-10', '2026-12']
    expect(nearestAtOrBefore(keys, '2026-08')).toBe('2026-09')
    expect(nearestAtOrBefore(keys, '2026-11')).toBe('2026-10')
    expect(nearestAtOrBefore(keys, '2027-07')).toBe('2026-12')
  })
})
