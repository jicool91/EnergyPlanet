import React, { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  icon,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1">
          <h3 className="m-0 text-base font-semibold text-token-primary">{title}</h3>
          {description && <p className="m-0 mt-1 text-xs text-token-secondary">{description}</p>}
        </div>
      </div>
      <div
        className="flex flex-col gap-3 pt-3"
        style={{
          borderTop: '1px solid color-mix(in srgb, var(--color-border-subtle) 40%, transparent)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
