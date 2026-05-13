function IconBase({ className = "h-4 w-4", children, ...props }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BookIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5.5 4.75H15a3 3 0 0 1 3 3v10.5H8.5a3 3 0 0 0-3 3V4.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 18.25H8.5a3 3 0 0 0-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function GridIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="4" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="4" y="14" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
      <rect x="14" y="14" width="6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function UsersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8.25 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.75 12.75a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.75 19.25c0-2.62 2.13-4.75 4.75-4.75h.5c2.62 0 4.75 2.13 4.75 4.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.25 19.25c0-1.91 1.55-3.46 3.46-3.46h.04c1.91 0 3.46 1.55 3.46 3.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function SparkIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 3.75 13.57 8.43 18.25 10 13.57 11.57 12 16.25 10.43 11.57 5.75 10 10.43 8.43 12 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m18.25 4.75.58 1.67 1.67.58-1.67.58-.58 1.67-.58-1.67-1.67-.58 1.67-.58.58-1.67Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ChartIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4.75 19.25h14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 16.25V11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16.25V7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16.5 16.25V5.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function BrainIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M9 5.25a2.75 2.75 0 0 0-5.5 0v.5a2.75 2.75 0 0 0 .78 1.92A3.22 3.22 0 0 0 3.5 10a3.23 3.23 0 0 0 1.15 2.47A2.99 2.99 0 0 0 7.5 17.25H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 5.25a2.75 2.75 0 1 1 5.5 0v.5a2.75 2.75 0 0 1-.78 1.92A3.22 3.22 0 0 1 20.5 10a3.23 3.23 0 0 1-1.15 2.47A2.99 2.99 0 0 1 16.5 17.25H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 4.25v15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 8.25h1.5M8.25 12h2.25M9 15.75h1.5M13.5 8.25H15M13.5 12h2.25M13.5 15.75H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function FileIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8 3.75h5.75l4.5 4.5v11a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5v-14A1.5 1.5 0 0 1 8 3.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M13.75 3.75v4.5h4.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 12h5M9.5 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function PlusIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 5.25v13.5M5.25 12h13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function ArrowRightIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M5.25 12h13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m13.25 7.5 5 4.5-5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.75v4.5l3 1.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="m19 19-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function MoreIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="6.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="17.5" cy="12" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function SunIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.75v2.5M12 18.75v2.5M21.25 12h-2.5M5.25 12h-2.5M18.54 5.46l-1.77 1.77M7.23 16.77l-1.77 1.77M18.54 18.54l-1.77-1.77M7.23 7.23 5.46 5.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function MoonIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M18.2 14.73A7.4 7.4 0 0 1 9.27 5.8a8.15 8.15 0 1 0 8.93 8.93Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function LogoutIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M10 4.75H7.75A2.75 2.75 0 0 0 5 7.5v9a2.75 2.75 0 0 0 2.75 2.75H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 8.25 19 12l-4.5 3.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.75 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <IconBase {...props}>
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}

export function EditIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M14.75 4.75 19.25 9.25 8.75 19.75H4.25v-4.5L14.75 4.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </IconBase>
  );
}
