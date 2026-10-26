# Sayari API contract notes

The local `docs/api/openapi.yml` is ignored by Git and is not available as a tracked source of runtime truth. The BFF therefore treats observed Sayari responses as the runtime contract; this note records known SDK/API differences rather than generating endpoint types from that spec.

With `@sayari/sdk@0.1.44`, observed differences are:

- Risk-factor ontology records can omit `do_not_render_metadata`, which the SDK parser requires.
- Project entity-list attributes contain `values` as `{ value }` objects rather than strings, and pagination uses `next` rather than `next_token`.
- Risk-summary records can contain boolean factor values and incomplete network paths rejected by the SDK parser.
- The OpenAPI spec requires populated `data.risk_changes` for project-level risk changes and `data.risk_factors` for entity-level risk changes; live empty results can be `data: {}`. SDK parsed models use camelCase names.

Reuse SDK-compatible scalar definitions only where helpful (`QualifiedCount`, `CountQualifier`, risk levels, and risk-change types). Endpoint response types remain narrow and based on observed wire shapes; do not generate them from the ignored spec. Upstream failures not mapped to a specific client status are returned by the BFF as HTTP 502.
