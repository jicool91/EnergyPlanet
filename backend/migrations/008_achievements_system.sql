-- Migration: 008_achievements_system
-- Description: Introduce achievements system with tiered rewards
-- Author: Energy Planet Team
-- Date: 2025-10-27

BEGIN;

-- =============================================================================
-- PROGRESS TABLE EXTENSIONS
-- =============================================================================

ALTER TABLE progress
    ADD COLUMN IF NOT EXISTS achievement_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (achievement_multiplier >= 1),
    ADD COLUMN IF NOT EXISTS total_taps BIGINT NOT NULL DEFAULT 0 CHECK (total_taps >= 0),
    ADD COLUMN IF NOT EXISTS total_buildings_purchased BIGINT NOT NULL DEFAULT 0 CHECK (total_buildings_purchased >= 0);

CREATE INDEX IF NOT EXISTS idx_progress_achievement_multiplier ON progress(achievement_multiplier);
CREATE INDEX IF NOT EXISTS idx_progress_total_taps ON progress(total_taps);
CREATE INDEX IF NOT EXISTS idx_progress_total_buildings_purchased ON progress(total_buildings_purchased);

-- =============================================================================
-- ACHIEVEMENT DEFINITIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS achievement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(16),
    metric VARCHAR(50) NOT NULL,
    unit VARCHAR(32) NOT NULL DEFAULT 'count',
    reward_type VARCHAR(32) NOT NULL DEFAULT 'multiplier',
    base_reward DOUBLE PRECISION NOT NULL DEFAULT 1 CHECK (base_reward >= 1),
    max_tier INTEGER NOT NULL CHECK (max_tier >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievement_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    tier INTEGER NOT NULL CHECK (tier >= 1),
    threshold DOUBLE PRECISION NOT NULL CHECK (threshold >= 0),
    reward_multiplier DOUBLE PRECISION NOT NULL CHECK (reward_multiplier >= 1),
    title VARCHAR(255),
    reward_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (achievement_id, tier)
);

CREATE INDEX IF NOT EXISTS idx_achievement_tiers_achievement_id ON achievement_tiers(achievement_id);

-- =============================================================================
-- USER ACHIEVEMENT PROGRESS
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
    progress_value DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (progress_value >= 0),
    current_tier INTEGER NOT NULL DEFAULT 0 CHECK (current_tier >= 0),
    highest_unlocked_tier INTEGER NOT NULL DEFAULT 0 CHECK (highest_unlocked_tier >= 0),
    last_progress_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id),
    CHECK (highest_unlocked_tier >= current_tier)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_user_achievements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_achievements_updated_at ON user_achievements;

CREATE TRIGGER trg_user_achievements_updated_at
BEFORE UPDATE ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION update_user_achievements_updated_at();

-- =============================================================================
-- SEED ACHIEVEMENT DEFINITIONS
-- =============================================================================

INSERT INTO achievement_definitions (slug, name, description, category, icon, metric, unit, reward_type, base_reward, max_tier)
VALUES
    (
        'energy_tycoon',
        'Энергетический магнат',
        'Генерируй колоссальные объёмы энергии в любой сессии.',
        'progression',
        '⚡',
        'total_energy',
        'energy',
        'multiplier',
        1,
        5
    ),
    (
        'tap_maestro',
        'Тап-маэстро',
        'Докажи, что пальцы быстрее света — совершай тысячи тапов.',
        'skill',
        '👆',
        'total_taps',
        'taps',
        'multiplier',
        1,
        5
    ),
    (
        'builder_guild',
        'Гильдия строителей',
        'Расширяй инфраструктуру планеты новыми постройками.',
        'economy',
        '🏗️',
        'buildings_owned',
        'buildings',
        'multiplier',
        1,
        5
    ),
    (
        'prestige_voyager',
        'Путешественник престижа',
        'Повышай престиж и покоряй новые измерения.',
        'meta',
        '🚀',
        'prestige_level',
        'prestige',
        'multiplier',
        1,
        5
    )
ON CONFLICT (slug) DO NOTHING;

WITH energy AS (
    SELECT id FROM achievement_definitions WHERE slug = 'energy_tycoon'
), taps AS (
    SELECT id FROM achievement_definitions WHERE slug = 'tap_maestro'
), build AS (
    SELECT id FROM achievement_definitions WHERE slug = 'builder_guild'
), prestige AS (
    SELECT id FROM achievement_definitions WHERE slug = 'prestige_voyager'
)
INSERT INTO achievement_tiers (achievement_id, tier, threshold, reward_multiplier, title, reward_summary)
VALUES
    ((SELECT id FROM energy), 1, 1e5, 1.02, 'Искра', 'Постоянный бонус ×1.02 к энергии'),
    ((SELECT id FROM energy), 2, 1e7, 1.04, 'Плазменный поток', 'Постоянный бонус ×1.04 к энергии'),
    ((SELECT id FROM energy), 3, 1e9, 1.06, 'Солнечный прилив', 'Постоянный бонус ×1.06 к энергии'),
    ((SELECT id FROM energy), 4, 1e12, 1.08, 'Звёздный шторм', 'Постоянный бонус ×1.08 к энергии'),
    ((SELECT id FROM energy), 5, 1e15, 1.10, 'Квазарный реактор', 'Постоянный бонус ×1.10 к энергии'),

    ((SELECT id FROM taps), 1, 1e3, 1.01, 'Дёрганый старт', 'Постоянный бонус ×1.01 к энергии'),
    ((SELECT id FROM taps), 2, 1e4, 1.02, 'Резонансный тап', 'Постоянный бонус ×1.02 к энергии'),
    ((SELECT id FROM taps), 3, 1e5, 1.03, 'Карманная сингулярность', 'Постоянный бонус ×1.03 к энергии'),
    ((SELECT id FROM taps), 4, 5e5, 1.05, 'Хор планет', 'Постоянный бонус ×1.05 к энергии'),
    ((SELECT id FROM taps), 5, 1e6, 1.07, 'Тактовый взрыв', 'Постоянный бонус ×1.07 к энергии'),

    ((SELECT id FROM build), 1, 10, 1.01, 'Бригадир', 'Постоянный бонус ×1.01 к энергии'),
    ((SELECT id FROM build), 2, 50, 1.02, 'Форс-мажор', 'Постоянный бонус ×1.02 к энергии'),
    ((SELECT id FROM build), 3, 150, 1.03, 'Архитектор', 'Постоянный бонус ×1.03 к энергии'),
    ((SELECT id FROM build), 4, 400, 1.04, 'Мегаструктор', 'Постоянный бонус ×1.04 к энергии'),
    ((SELECT id FROM build), 5, 800, 1.05, 'Галактический девелопер', 'Постоянный бонус ×1.05 к энергии'),

    ((SELECT id FROM prestige), 1, 1, 1.02, 'Первый перелом', 'Постоянный бонус ×1.02 к энергии'),
    ((SELECT id FROM prestige), 2, 3, 1.03, 'Сверхновая решимость', 'Постоянный бонус ×1.03 к энергии'),
    ((SELECT id FROM prestige), 3, 6, 1.04, 'Мультивселенный турист', 'Постоянный бонус ×1.04 к энергии'),
    ((SELECT id FROM prestige), 4, 10, 1.05, 'Покоритель измерений', 'Постоянный бонус ×1.05 к энергии'),
    ((SELECT id FROM prestige), 5, 15, 1.06, 'Владыка континуумов', 'Постоянный бонус ×1.06 к энергии')
ON CONFLICT DO NOTHING;

COMMIT;
