'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { SelectGroup, SelectOption } from './select-options';

export type { SelectGroup, SelectOption } from './select-options';

const SIZES = {
  sm: 'h-8 rounded-[8px] px-2.5 text-[13px]',
  md: 'h-10 rounded-[10px] px-3 text-[13px]',
  lg: 'h-12 rounded-[10px] px-3.5 text-[15px]',
} as const;

/**
 * A dropdown that matches the inputs, open and closed, in both themes. Built on
 * Radix Select: arrow keys, typeahead and screen readers work, and with `name`
 * it posts its value with the surrounding form like a native select.
 */
export function Select({
  options,
  groups,
  value,
  defaultValue,
  onValueChange,
  name,
  id,
  placeholder,
  size = 'md',
  disabled,
  required,
  className,
  contentClassName,
  columns,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: {
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  size?: keyof typeof SIZES;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  contentClassName?: string;
  /** Lay options out as tiles, this many to a row (for short values like semesters). */
  columns?: number;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
}) {
  const all = options ?? groups?.flatMap((group) => group.options) ?? [];
  const selected = value === undefined ? undefined : all.find((option) => option.value === value);

  return (
    <SelectPrimitive.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
      required={required}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        className={cn(
          'group flex w-full items-center justify-between gap-2 border border-input bg-card text-left text-foreground shadow-[inset_0_1px_2px_rgb(var(--ink)/0.03)] transition-colors',
          'hover:border-primary/50 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
          'data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive data-[placeholder]:text-faint',
          SIZES[size],
          className,
        )}
      >
        <span className="min-w-0 truncate">
          <SelectPrimitive.Value placeholder={placeholder}>{selected?.selectedLabel ?? selected?.label}</SelectPrimitive.Value>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-faint transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'relative z-50 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-[min(var(--radix-select-content-available-height),340px)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border bg-card text-foreground shadow-raised',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
            contentClassName,
          )}
        >
          <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-faint">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport
            className={cn('p-1.5', columns && 'grid gap-1')}
            style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
          >
            {options?.map((option) =>
              columns ? <SelectTile key={option.value} option={option} columns={columns} /> : <SelectItem key={option.value} option={option} />,
            )}
            {groups?.map((group, index) => (
              <SelectPrimitive.Group key={group.label}>
                {index > 0 ? <SelectPrimitive.Separator className="mx-1 my-1.5 h-px bg-border" /> : null}
                <SelectPrimitive.Label className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
                  {group.label}
                </SelectPrimitive.Label>
                {group.options.map((option) => (
                  <SelectItem key={option.value} option={option} />
                ))}
              </SelectPrimitive.Group>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-faint">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectItem({ option }: { option: SelectOption }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      textValue={option.textValue}
      className={cn(
        'relative flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 text-[13px] outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        'data-[highlighted]:bg-muted data-[state=checked]:font-semibold data-[state=checked]:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      )}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      {option.hint ? <span className="ml-auto pl-3 text-xs font-normal text-muted-foreground">{option.hint}</span> : null}
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex">
        <Check className="size-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

/** A grid cell: centred, the picked one filled. */
function SelectTile({ option, columns }: { option: SelectOption; columns: number }) {
  return (
    <SelectPrimitive.Item
      value={option.value}
      textValue={option.textValue}
      style={option.wide ? { gridColumn: `span ${columns} / span ${columns}` } : undefined}
      className={cn(
        'flex h-10 cursor-pointer select-none items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-[14px] font-medium tabular outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        option.wide ? 'justify-between px-3' : '',
        'data-[highlighted]:border-primary/40 data-[highlighted]:bg-muted',
        'data-[state=checked]:bg-primary data-[state=checked]:font-semibold data-[state=checked]:text-primary-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
      )}
    >
      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
      {option.hint ? <span className="text-xs font-normal opacity-75">{option.hint}</span> : null}
    </SelectPrimitive.Item>
  );
}
