"use client";

import * as React from "react";
import { Check, ChevronsUpDown, FileText } from "lucide-react";
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
import { Service } from "../_types";

interface ServiceComboboxProps {
  services: Service[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ServiceCombobox({
  services,
  value,
  onValueChange,
  placeholder = "Select a service...",
  disabled = false,
  error = false,
}: ServiceComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number | undefined>(
    undefined
  );

  // Find selected service
  const selectedService = services.find((service) => service.id === value);

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
          {selectedService ? (
            <span className="truncate">
              {selectedService.name}
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
          <CommandInput placeholder="Search services..." />
          <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={`${service.name} ${service.description || ""}`}
                  onSelect={() => {
                    onValueChange(service.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === service.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate">
                        {service.name}
                      </span>
                    </div>
                    {service.description && (
                      <span className="text-xs text-muted-foreground truncate mt-0.5">
                        {service.description}
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

