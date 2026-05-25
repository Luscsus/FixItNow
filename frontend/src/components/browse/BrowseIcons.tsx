const svg = (d: string, s = 13) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: d }}
  />
);

export function IconSearch({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export function IconChevron({ size = 11 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconPin({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function IconDrop({ size = 13 }: { size?: number }) {
  return svg(`<path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>`, size);
}

export function IconBolt({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M13 2L4.09 12.26A2 2 0 005.62 15.5h4.72L9 22l9.53-10.26A2 2 0 0016.9 8.5h-4.72L13 2z"/>`,
    size,
  );
}

export function IconSpark({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`,
    size,
  );
}

export function IconWrench({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>`,
    size,
  );
}

export function IconCmd({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z"/>`,
    size,
  );
}

export function IconHammer({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 00-3.94-1.64H9l.92.82A6.18 6.18 0 0112 8.4v1.56l2 2h2.47l2.26 1.91"/>`,
    size,
  );
}

export function IconKey({ size = 13 }: { size?: number }) {
  return svg(
    `<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6"/><path d="M15.5 7.5l3 3L22 7l-3-3"/>`,
    size,
  );
}

export function IconBook({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>`,
    size,
  );
}

export function IconLeaf({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M11 20A7 7 0 015 13V5a7 7 0 0114 0v8a7 7 0 01-7 7z"/><path d="M11 20v-9"/>`,
    size,
  );
}

export function IconHome({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
    size,
  );
}

export function IconBrush({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 114.03 4.03l-8.06 8.08"/><path d="M7 15c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z"/>`,
    size,
  );
}

export function IconSparkles({ size = 13 }: { size?: number }) {
  return svg(
    `<path d="M12 3l1.5 3.5L17 8l-3.5 1.5L12 13l-1.5-3.5L7 8l3.5-1.5z"/><path d="M5 14l.8 1.7L7.5 16.5l-1.7.8L5 19l-.8-1.7L2 16.5l1.7-.8z"/><path d="M19 14l.8 1.7L21.5 16.5l-1.7.8L19 19l-.8-1.7L16 16.5l1.7-.8z"/>`,
    size,
  );
}

export function IconTruck({ size = 13 }: { size?: number }) {
  return svg(
    `<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
    size,
  );
}

export function IconBug({ size = 13 }: { size?: number }) {
  return svg(
    `<ellipse cx="12" cy="13" rx="4" ry="5"/><path d="M12 8a3 3 0 100-6 3 3 0 000 6z"/><path d="M6 13H2M22 13h-4M4.93 7.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 18.07l2.83-2.83M16.24 7.76l2.83-2.83"/>`,
    size,
  );
}

export function IconDots({ size = 13 }: { size?: number }) {
  return svg(
    `<circle cx="12" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>`,
    size,
  );
}
