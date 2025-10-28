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
    <div className="flex flex-col gap-sm-plus rounded-2xl border border-[rgba(0,217,255,0.28)] bg-[rgba(12,18,40,0.82)] shadow-elevation-2 p-md">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <div className="flex-1">
          <h3 className="m-0 text-subheading font-semibold text-token-primary">{title}</h3>
          {description && (
            <p className="m-0 mt-xs text-caption text-token-secondary">{description}</p>
          )}
        </div>
      </div>
      <div
        className="flex flex-col gap-sm-plus pt-sm-plus"
        style={{
          borderTop: '1px solid color-mix(in srgb, var(--color-border-subtle) 40%, transparent)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
