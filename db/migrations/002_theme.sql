-- db/migrations/002_theme.sql
-- ────────────────────────────────────────────────────────────
-- KODEO — Part 1c: appearance settings
-- Adds a themeId column to persist the user's chosen theme
-- across devices. Safe to re-run.
-- ────────────────────────────────────────────────────────────

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "themeId" TEXT NOT NULL DEFAULT 'kodeo-dark';