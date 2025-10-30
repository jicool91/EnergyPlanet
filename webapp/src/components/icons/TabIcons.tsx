import type { SVGProps } from 'react';

export type TabIconId = 'home' | 'shop' | 'builds' | 'leaderboard' | 'account';

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

const baseProps: Pick<
  SVGProps<SVGSVGElement>,
  'fill' | 'stroke' | 'strokeWidth' | 'strokeLinecap' | 'strokeLinejoin'
> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const frameProps: Pick<SVGProps<SVGSVGElement>, 'width' | 'height' | 'viewBox'> = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
};

function IconFrame({ children, title, ...rest }: IconProps) {
  return (
    <svg {...frameProps} {...baseProps} {...rest} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function getTabIcon(id: TabIconId, title?: string) {
  switch (id) {
    case 'home':
      return (
        <IconFrame title={title}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M5.5 10V20a1.5 1.5 0 0 0 1.5 1.5H10v-6h4v6h3a1.5 1.5 0 0 0 1.5-1.5V10" />
        </IconFrame>
      );
    case 'shop':
      return (
        <IconFrame title={title}>
          <path d="M4.5 9h15l-1.2 9.6a2 2 0 0 1-2 1.7h-8.6a2 2 0 0 1-2-1.7L4.5 9Z" />
          <path d="M8 9 9.5 4.5A1.5 1.5 0 0 1 11 3.5h2a1.5 1.5 0 0 1 1.5 1L16 9" />
          <path d="M10 14.5h4" />
        </IconFrame>
      );
    case 'builds':
      return (
        <IconFrame title={title}>
          <path d="M4.5 20.5h15" />
          <path d="M7 20.5V7.3a1 1 0 0 1 .6-.9l3-1.4a1 1 0 0 1 .8 0l3 1.4a1 1 0 0 1 .6.9v13.2" />
          <path d="M10.5 20.5v-6h3v6" />
        </IconFrame>
      );
    case 'leaderboard':
      return (
        <IconFrame title={title}>
          <path d="M8.5 20.5v-6.5" />
          <path d="M12 20.5V7" />
          <path d="M15.5 20.5v-3.5" />
          <path d="M6 11.5h12" />
          <path d="M9.5 4.5a2.5 2.5 0 1 1 5 0c0 1.4-.8 2.4-2.5 3.5-1.7-1.1-2.5-2.1-2.5-3.5Z" />
        </IconFrame>
      );
    case 'account':
      return (
        <IconFrame title={title}>
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </IconFrame>
      );
    default:
      return null;
  }
}
