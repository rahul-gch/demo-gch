import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
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
import { ALL_COUNTRIES, FEATURED_COUNTRIES } from "@/lib/countries";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select country...",
  disabled = false,
  className,
  id,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const otherCountries = React.useMemo(
    () => ALL_COUNTRIES.filter((c) => !(FEATURED_COUNTRIES as readonly string[]).includes(c)),
    [],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal text-left h-10 px-3",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="h-3.5 w-3.5 shrink-0 opacity-60 text-muted-foreground" />
            <span className="truncate">{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[340px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search country (e.g. Turkey, Egypt)..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-64">
            <CommandEmpty>
              <div className="py-2 text-center text-xs">
                <p className="text-muted-foreground">No matching country.</p>
                {search.trim() && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 text-xs text-primary"
                    onClick={() => {
                      onChange(search.trim());
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    Use &ldquo;{search.trim()}&rdquo;
                  </Button>
                )}
              </div>
            </CommandEmpty>

            <CommandGroup heading="Popular Sourcing Hubs">
              {FEATURED_COUNTRIES.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(currentValue) => {
                    // Match original casing from FEATURED_COUNTRIES
                    const found = FEATURED_COUNTRIES.find(
                      (c) => c.toLowerCase() === currentValue.toLowerCase(),
                    ) ?? currentValue;
                    onChange(found);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <span className="font-medium">{country}</span>
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 text-primary",
                      value?.toLowerCase() === country.toLowerCase() ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="All Countries">
              {otherCountries.map((country) => (
                <CommandItem
                  key={country}
                  value={country}
                  onSelect={(currentValue) => {
                    const found = otherCountries.find(
                      (c) => c.toLowerCase() === currentValue.toLowerCase(),
                    ) ?? currentValue;
                    onChange(found);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <span>{country}</span>
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 text-primary",
                      value?.toLowerCase() === country.toLowerCase() ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
