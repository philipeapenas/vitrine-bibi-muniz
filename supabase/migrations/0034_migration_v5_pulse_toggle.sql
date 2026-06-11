-- migration_v5_pulse_toggle.sql
-- Adiciona controle de animação pulsante para o primeiro botão

ALTER TABLE public.site_profile 
ADD COLUMN IF NOT EXISTS pulse_enabled boolean DEFAULT true;
