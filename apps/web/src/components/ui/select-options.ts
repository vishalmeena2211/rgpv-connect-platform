import type { ReactNode } from 'react';

// Option shapes and builders for ./select. They live outside the client
// component so server components can build options too.

export interface SelectOption {
  value: string;
  label: ReactNode;
  /** Quieter text after the label, e.g. "latest declared". */
  hint?: ReactNode;
  /** What typeahead matches when the label is not plain text. */
  textValue?: string;
  /** Shown in the closed box when this option is picked, if the label is too terse (a grid tile's "3"). */
  selectedLabel?: ReactNode;
  /** In a grid, take the whole row. */
  wide?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

/** "Semester 1" … "Semester n" as options. */
export function semesterOptions(from: number, to: number): SelectOption[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i).map((n) => ({ value: String(n), label: `Semester ${n}` }));
}

/**
 * The semester picker's options: "Latest" across the top, then 1–n as tiles.
 * Use with `columns={4}`.
 */
export function semesterTiles(count: number, latest: number | null, latestLabel = 'Latest'): SelectOption[] {
  return [
    {
      value: 'auto',
      label: latestLabel,
      hint: latest ? `semester ${latest}` : undefined,
      selectedLabel: latest ? `${latestLabel} · sem ${latest}` : latestLabel,
      wide: true,
    },
    ...Array.from({ length: count }, (_, i) => i + 1).map((n) => ({
      value: String(n),
      label: String(n),
      textValue: String(n),
      selectedLabel: `Semester ${n}`,
    })),
  ];
}
