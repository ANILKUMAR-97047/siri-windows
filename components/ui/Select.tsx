"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  name?: string;
  id?: string;
  error?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "admin" | "public";
  dark?: boolean;
}

export function CustomSelect({
  value: controlledValue,
  defaultValue = "",
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  contentClassName = "",
  name,
  id,
  error = false,
  size = "md",
  variant = "admin",
  dark,
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = React.useState<string>(
    controlledValue !== undefined ? controlledValue : defaultValue
  );
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = normalizedOptions.find(
    (opt) => opt.value === internalValue
  );

  const handleSelect = (val: string) => {
    setInternalValue(val);
    onChange?.(val);
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg min-h-[34px]",
    md: "px-3.5 py-2.5 text-xs md:text-sm rounded-xl min-h-[42px]",
    lg: "px-4 py-3 text-sm md:text-base rounded-2xl min-h-[48px]",
  }[size];

  // Base theme classes
  const isPublic = variant === "public";
  const isExplicitDark = dark === true;

  const triggerTheme = isPublic
    ? "bg-off-white text-navy-950 border-blue-200 hover:border-navy-400 focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10"
    : isExplicitDark
    ? "bg-slate-800 text-white border-slate-700 hover:border-slate-600 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className={`relative w-full ${className}`}>
      {name && <input type="hidden" name={name} value={internalValue} />}

      <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
        <DropdownMenuPrimitive.Trigger
          id={id}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 transition-all duration-200 select-none text-left cursor-pointer outline-none border shadow-xs ${sizeClasses} ${triggerTheme} ${
            error
              ? "!border-red-400 bg-red-50/20 ring-2 ring-red-400/20"
              : ""
          } ${
            disabled
              ? "opacity-50 cursor-not-allowed hover:border-slate-200"
              : ""
          } ${triggerClassName}`}
        >
          <span
            className={`truncate flex-1 font-medium ${
              !selectedOption || selectedOption.value === ""
                ? "text-slate-400 font-normal"
                : ""
            }`}
          >
            {selectedOption && selectedOption.value !== ""
              ? selectedOption.label
              : placeholder}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
              open ? "rotate-180 text-amber-500" : ""
            }`}
          />
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            sideOffset={4}
            align="start"
            style={{
              width: "var(--radix-dropdown-menu-trigger-width)",
              minWidth: "var(--radix-dropdown-menu-trigger-width)",
              maxHeight: "320px",
            }}
            className={`dropdown-menu-content z-[100] overflow-y-auto rounded-2xl border p-1 shadow-2xl backdrop-blur-xl focus:outline-none scrollbar-thin ${
              isPublic
                ? "bg-white/95 border-slate-200 text-slate-900 shadow-xl shadow-navy-950/10"
                : isExplicitDark
                ? "bg-slate-900/98 border-slate-800 text-slate-100 shadow-slate-950/80"
                : "bg-white/98 dark:bg-slate-900/98 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl dark:shadow-slate-950/80"
            } ${contentClassName}`}
          >
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === internalValue;
              const isPlaceholderOption = opt.value === "";

              return (
                <DropdownMenuPrimitive.Item
                  key={opt.value || "__empty__"}
                  disabled={opt.disabled}
                  onSelect={() => handleSelect(opt.value)}
                  className={`relative flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm cursor-pointer select-none outline-none transition-colors duration-150 ${
                    opt.disabled ? "opacity-40 cursor-not-allowed" : ""
                  } ${
                    isSelected
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  } ${isPlaceholderOption ? "italic text-slate-400" : ""}`}
                >
                  <div className="flex flex-col pr-2 truncate">
                    <span className="truncate">{opt.label}</span>
                    {opt.description && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && opt.value !== "" && (
                    <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5] text-amber-500" />
                  )}
                </DropdownMenuPrimitive.Item>
              );
            })}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </div>
  );
}

export default CustomSelect;
