"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  toEthiopianDate,
  getEthiopianMonthName,
  ETHIOPIAN_WEEKDAYS_SHORT,
  formatEthiopianDateNumeric,
} from "@/lib/utils/ethiopian-date";
import type { DayPickerProps } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type EthiopianCalendarProps = React.ComponentProps<typeof Calendar> & {
  className?: string;
}

/**
 * Ethiopian Calendar component that displays Ethiopian dates
 * but uses Gregorian dates internally for date selection
 */
export function EthiopianCalendar({
  className,
  classNames,
  ...props
}: EthiopianCalendarProps) {
  // Custom formatters for Ethiopian calendar display
  const formatters = {
    formatMonth: (date: Date | undefined) => {
      if (!date) return "";
      const eth = toEthiopianDate(date);
      const monthName = getEthiopianMonthName(eth.month);
      return `${monthName} ${eth.year}`;
    },
    formatYear: (date: Date | undefined) => {
      if (!date) return "";
      const eth = toEthiopianDate(date);
      return eth.year.toString();
    },
    formatWeekdayName: (date: Date | undefined) => {
      if (!date) return "";
      return ETHIOPIAN_WEEKDAYS_SHORT[date.getDay()] || "";
    },
  };

  return (
    <Calendar
      {...props}
      className={cn(className)}
      captionLayout="dropdown"
      classNames={{
        ...classNames,
        month_caption: cn(
          "text-base sm:text-lg md:text-xl font-semibold mb-4",
          classNames?.month_caption
        ),
        weekday: cn(
          "text-sm sm:text-base font-medium text-muted-foreground",
          classNames?.weekday
        ),
      }}
      formatters={formatters}
      components={{
        ...props.components,
        Day: (dayProps) => {
          if (!dayProps.date) return null;

          const eth = toEthiopianDate(dayProps.date);
          const isCurrentMonth =
            dayProps.displayMonth
              ? dayProps.date.getMonth() === dayProps.displayMonth.getMonth()
              : true;

          return (
            <button
              {...dayProps}
              className={cn(
                "relative flex flex-col items-center justify-center aspect-square h-full w-full",
                dayProps.className
              )}
              title={formatEthiopianDateNumeric(dayProps.date)}
            >
              {/* Ethiopian day number (larger, primary) */}
              <span
                className={cn(
                  "text-base sm:text-lg md:text-xl font-semibold leading-none",
                  !isCurrentMonth && "text-muted-foreground/50"
                )}
              >
                {eth.day}
              </span>
              {/* Gregorian day number (smaller, secondary, optional - you can remove this) */}
              {/* <span className="text-[0.65rem] sm:text-[0.7rem] text-muted-foreground/60 leading-none mt-0.5">
                {dayProps.date.getDate()}
              </span> */}
            </button>
          );
        },
      }}
    />
  );
}

