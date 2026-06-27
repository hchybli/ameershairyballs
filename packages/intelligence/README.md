# @backstop/intelligence

Payer intelligence moat: `(tenant, payer, cdt) → outcome stats`.

## Workstream

WS-07

## Write path

On `outcome.received` projector → upsert `payer_intelligence`

## Read path

Scrub agent queries before flagging frequency/history issues
