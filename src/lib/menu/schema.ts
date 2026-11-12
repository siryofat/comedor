import { z } from 'zod'
import { addDays, weekdayIndex } from './dates'

/** School days, in order, as they appear in the source data. */
export const DAY_KEYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'] as const
export const dayKeySchema = z.enum(DAY_KEYS)

const text = z.string().trim().min(1)
const grams = z.number().nonnegative()
// Percentages are transcribed as printed and are not guaranteed to add up to 100.
const percent = z.number().min(0).max(100)
const isoDate = z.iso.date()

export const nutritionSchema = z.strictObject({
  energy_kcal: z.number().positive(),
  energy_percent: percent,
  carbohydrates_g: grams,
  carbohydrates_percent: percent,
  protein_g: grams,
  protein_percent: percent,
  fat_g: grams,
  fat_percent: percent,
  fiber_g: grams,
})

export const schoolLunchSchema = z.strictObject({
  first_course: text,
  main_course: text,
  bread: text,
  dessert: text,
  nutrition: nutritionSchema,
})

const mealItems = z.array(text).min(1)

export const suggestedMealsSchema = z.strictObject({
  breakfast: mealItems,
  afternoon_snack: mealItems,
  dinner: mealItems,
})

export const menuDaySchema = z.strictObject({
  day: dayKeySchema,
  school_lunch: schoolLunchSchema,
  suggested_meals: suggestedMealsSchema,
})

export const weeklyMenuSchema = z
  .strictObject({
    week: z.int().positive(),
    days: z.array(menuDaySchema).length(DAY_KEYS.length),
  })
  .superRefine((week, ctx) => {
    week.days.forEach((day, i) => {
      if (day.day !== DAY_KEYS[i]) {
        ctx.addIssue({
          code: 'custom',
          path: ['days', i, 'day'],
          message: `Se esperaba "${DAY_KEYS[i]}" en la posición ${i}, se encontró "${day.day}"`,
        })
      }
    })
  })

export const rotationEntrySchema = z
  .strictObject({
    week_start: isoDate,
    week_end: isoDate,
    menu_week: z.int().positive(),
  })
  .superRefine((entry, ctx) => {
    if (weekdayIndex(entry.week_start) !== 0) {
      ctx.addIssue({ code: 'custom', path: ['week_start'], message: 'Debe ser un lunes' })
    }
    if (entry.week_end < entry.week_start || entry.week_end > addDays(entry.week_start, 6)) {
      ctx.addIssue({
        code: 'custom',
        path: ['week_end'],
        message: 'Debe caer entre week_start y el domingo de esa semana',
      })
    }
  })

export const schoolMenuSchema = z
  .strictObject({
    title: text,
    school_year: z.string().regex(/^\d{4}-\d{4}$/),
    language: z.string().min(2),
    source_pages: z.record(z.string(), z.int().positive()),
    notes: z.array(text),
    weekly_menus: z.array(weeklyMenuSchema).min(1),
    rotation_calendar: z.array(rotationEntrySchema).min(1),
  })
  .superRefine((menu, ctx) => {
    menu.weekly_menus.forEach((w, i) => {
      if (w.week !== i + 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['weekly_menus', i, 'week'],
          message: `Las semanas deben numerarse de forma consecutiva desde 1 (se esperaba ${i + 1})`,
        })
      }
    })

    const known = new Set(menu.weekly_menus.map((w) => w.week))
    menu.rotation_calendar.forEach((entry, i) => {
      if (!known.has(entry.menu_week)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rotation_calendar', i, 'menu_week'],
          message: `La semana de menú ${entry.menu_week} no existe`,
        })
      }
      const prev = menu.rotation_calendar[i - 1]
      if (prev && entry.week_start !== addDays(prev.week_start, 7)) {
        ctx.addIssue({
          code: 'custom',
          path: ['rotation_calendar', i, 'week_start'],
          message: 'Las semanas del calendario deben ser consecutivas',
        })
      }
    })
  })

export type DayKey = z.infer<typeof dayKeySchema>
export type Nutrition = z.infer<typeof nutritionSchema>
export type SchoolLunch = z.infer<typeof schoolLunchSchema>
export type SuggestedMeals = z.infer<typeof suggestedMealsSchema>
export type MenuDay = z.infer<typeof menuDaySchema>
export type WeeklyMenu = z.infer<typeof weeklyMenuSchema>
export type RotationEntry = z.infer<typeof rotationEntrySchema>
export type SchoolMenu = z.infer<typeof schoolMenuSchema>
