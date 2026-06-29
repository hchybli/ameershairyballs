-- WS-AGENTS-02: prediction flywheel columns on payer_intelligence

alter table payer_intelligence
  add column if not exists prediction_count integer not null default 0;
