"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Office } from "../_types";

interface OfficeComboboxProps {
  offices: Office[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function OfficeCombobox({
  offices,
  value,
  onValueChange,
  placeholder = "Select an office...",
  disabled = false,
  error = false,
}: OfficeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(
    undefined
  );

  // Filter active offices only
  const activeOffices = offices.filter((office) => office.status);

  // Find selected office
  const selectedOffice = activeOffices.find((office) => office.id === value);

  // Update popover width when trigger is rendered
  React.useEffect(() => {
    if (triggerRef.current) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled}
        >
          {selectedOffice ? (
            <span className="truncate">
              {selectedOffice.name}
              {selectedOffice.roomNumber && ` (${selectedOffice.roomNumber})`}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={
          popoverWidth
            ? { width: `${popoverWidth}px`, maxHeight: "400px" }
            : { maxHeight: "400px" }
        }
      >
        <Command shouldFilter={true} className="h-full">
          <CommandInput placeholder="Search offices..." />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No office found.</CommandEmpty>
            <CommandGroup>
              {activeOffices.map((office) => (
                <CommandItem
                  key={office.id}
                  value={`${office.name} ${office.roomNumber || ""} ${
                    office.address || ""
                  }`}
                  onSelect={() => {
                    onValueChange(office.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === office.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">
                        {office.name}
                      </span>
                      {office.roomNumber && (
                        <span className="text-sm text-muted-foreground shrink-0">
                          ({office.roomNumber})
                        </span>
                      )}
                    </div>
                    {office.address && (
                      <span className="text-xs text-muted-foreground truncate">
                        {office.address}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
