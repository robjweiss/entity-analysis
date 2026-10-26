import { describe, expect, it } from 'vitest'
import {
  countQualifierSchema,
  qualifiedCountSchema,
  riskChangeFactorChangeTypeSchema,
  riskLevelSchema,
} from './sayariSchemas.ts'

describe('BFF Sayari wire schemas', () => {
  it.each([
    { value: 'eq', valid: true },
    { value: 'gte', valid: true },
    { value: 'gt', valid: false },
  ])('validates count qualifier $value', ({ value, valid }) => {
    expect(countQualifierSchema.safeParse(value).success).toBe(valid)
  })

  it.each([
    { value: { count: 2, qualifier: 'eq' }, valid: true },
    { value: { count: 0, qualifier: 'gte' }, valid: true },
    { value: { count: -1, qualifier: 'eq' }, valid: false },
    { value: { count: 1.5, qualifier: 'eq' }, valid: false },
    { value: { count: Number.MAX_SAFE_INTEGER + 1, qualifier: 'eq' }, valid: false },
    { value: { count: '2', qualifier: 'eq' }, valid: false },
    { value: { count: 2, qualifier: 'gt' }, valid: false },
  ])('validates qualified count $value', ({ value, valid }) => {
    expect(qualifiedCountSchema.safeParse(value).success).toBe(valid)
  })

  it.each([
    { value: 'critical', valid: true },
    { value: 'relevant', valid: true },
    { value: 'low', valid: false },
  ])('validates risk level $value', ({ value, valid }) => {
    expect(riskLevelSchema.safeParse(value).success).toBe(valid)
  })

  it.each([
    { value: 'added', valid: true },
    { value: 'removed', valid: true },
    { value: 'updated', valid: false },
  ])('validates risk change type $value', ({ value, valid }) => {
    expect(riskChangeFactorChangeTypeSchema.safeParse(value).success).toBe(valid)
  })
})
