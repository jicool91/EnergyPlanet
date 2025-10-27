const TRUE_LITERAL = 'true';
const FALSE_LITERAL = 'false';

type TmaMigrationFeature = 'safeArea' | 'theme' | 'backButton';

type FlagValue = boolean | undefined;

function readFlagValue(rawValue: string | undefined): FlagValue {
  if (rawValue === TRUE_LITERAL) {
    return true;
  }
  if (rawValue === FALSE_LITERAL) {
    return false;
  }
  return undefined;
}

const globalFlag = readFlagValue(import.meta.env.VITE_TMA_MIGRATION_ENABLED) ?? false;

const featureOverrides: Partial<Record<TmaMigrationFeature, FlagValue>> = {
  safeArea: readFlagValue(import.meta.env.VITE_TMA_MIGRATION_SAFE_AREA),
  theme: readFlagValue(import.meta.env.VITE_TMA_MIGRATION_THEME),
  backButton: readFlagValue(import.meta.env.VITE_TMA_MIGRATION_BACK_BUTTON),
};

export function isTmaFeatureEnabled(feature: TmaMigrationFeature): boolean {
  const override = featureOverrides[feature];
  if (override !== undefined) {
    return override;
  }
  return globalFlag;
}

export function isTmaMigrationGloballyEnabled(): boolean {
  return globalFlag;
}
