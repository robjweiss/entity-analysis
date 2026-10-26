import { z } from 'zod'
import {
  qualifiedCountSchema,
  riskChangeFactorChangeTypeSchema,
  riskLevelSchema,
} from './sayariSchemas.ts'

const idLabelSchema = z.object({ id: z.string(), label: z.string() })

export const projectEntityListSchema = z.object({
  data: z.array(
    z.object({
      project_entity_id: z.string(),
      label: z.string(),
      countries: z.array(z.string()),
      risk_categories: z.array(idLabelSchema),
      risk_factors: z.array(z.object({ id: z.string() })),
      // Some records contain unusable matches; they are filtered independently by the mapper.
      matches: z.unknown().optional(),
    }),
  ),
  next: z.string().nullable().optional(),
  prev: z.string().nullable().optional(),
})

const shareSchema = z.object({
  percentage: z.number().nullable().optional(),
  num_shares: z.number().nullable().optional(),
  monetary_value: z.number().nullable().optional(),
})

const networkEntitySchema = z.object({
  sayari_entity_id: z.string(),
  sayari_entity_label: z.string(),
  relationship_type: z.string(),
  relationship_status: z.string().optional(),
  former: z.boolean().optional(),
  first_observed: z.string().optional(),
  last_observed: z.string().optional(),
  start_date: z.string().optional(),
  shares: shareSchema.nullable().optional(),
})

export const projectEntityRiskSummarySchema = z.object({
  data: z
    .object({
      risk_factors: z
        .array(
          z.object({
            id: z.string(),
            label: z.string(),
            level: riskLevelSchema,
            risk_categories: z.array(idLabelSchema).optional(),
            source_entity_ids: z.array(z.string()).optional(),
            network_paths: z.array(z.array(networkEntitySchema)).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
})

export const projectEntityRiskChangesSchema = z.object({
  data: z
    .object({
      risk_factors: z
        .array(
          z.object({
            id: z.string(),
            timestamp: z.string(),
            change_type: riskChangeFactorChangeTypeSchema,
          }),
        )
        .optional(),
    })
    .optional(),
  next: z.string().nullable().optional(),
})

export const projectExposureCountResponseSchema = z.object({
  size: qualifiedCountSchema,
})

const projectRiskFactorChangeSchema = z.object({
  id: z.string(),
  timestamp: z.string().refine((timestamp) => Number.isFinite(Date.parse(timestamp))),
  change_type: riskChangeFactorChangeTypeSchema,
})

export const projectWideRiskChangesSchema = z.object({
  data: z
    .object({
      risk_changes: z
        .array(
          z.object({
            project_entity_id: z.string(),
            label: z.string().optional(),
            risk_factors: z.array(projectRiskFactorChangeSchema),
          }),
        )
        .optional(),
    })
    .passthrough(),
  next: z.string().nullable().optional(),
})
