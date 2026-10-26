import type { Sayari } from '@sayari/sdk'
import { z } from 'zod'

export const countQualifierSchema = z.enum(['eq', 'gte']) satisfies z.ZodType<Sayari.CountQualifier>

export const qualifiedCountSchema = z.object({
  count: z.number().int().nonnegative().safe(),
  qualifier: countQualifierSchema,
}) satisfies z.ZodType<Sayari.QualifiedCount>

export const riskLevelSchema = z.enum([
  'critical',
  'high',
  'elevated',
  'relevant',
]) satisfies z.ZodType<Sayari.RiskLevel>

export const riskChangeFactorChangeTypeSchema = z.enum([
  'added',
  'removed',
]) satisfies z.ZodType<Sayari.RiskChangeFactorChangeType>
