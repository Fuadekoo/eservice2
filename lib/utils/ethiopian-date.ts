/**
 * Utility functions for Ethiopian date conversion and formatting
 * Uses ethiopic-date library which requires moment-timezone
 */

// Ethiopian month names in Amharic
export const ETHIOPIAN_MONTHS = [
  "መስከረም", // Meskerem
  "ጥቅምት", // Tikimt
  "ሕዳር", // Hedar
  "ታኅሣሥ", // Tahsas
  "ጥር", // Tir
  "የካቲት", // Yekatit
  "መጋቢት", // Megabit
  "ሚያዝያ", // Miazia
  "ግንቦት", // Ginbot
  "ሰኔ", // Sene
  "ሐምሌ", // Hamle
  "ነሐሴ", // Nehase
  "ጳጉሜን", // Pagumen (13th month - 5 or 6 days)
];

// Ethiopian weekday names (short)
export const ETHIOPIAN_WEEKDAYS_SHORT = ["እ", "ሰ", "ማ", "ረ", "ሐ", "አ", "ቅ"];

// Ethiopian weekday names (full)
export const ETHIOPIAN_WEEKDAYS = [
  "እሁድ", // Sunday - Ihud
  "ሰኞ", // Monday - Segno
  "ማክሰኞ", // Tuesday - Maksegno
  "ረቡዕ", // Wednesday - Rabu
  "ሐሙስ", // Thursday - Hamus
  "አርብ", // Friday - Arb
  "ቅዳሜ", // Saturday - Kidame
];

let ethiopicCalendarInstance: any = null;
let momentInstance: any = null;

/**
 * Get or create Ethiopian calendar instance
 */
function getEthiopicCalendar() {
  if (!ethiopicCalendarInstance) {
    try {
      ethiopicCalendarInstance = require("ethiopic-date");
    } catch (error) {
      console.error("Error loading ethiopic-date:", error);
    }
  }
  return ethiopicCalendarInstance;
}

/**
 * Get moment instance
 */
function getMoment() {
  if (!momentInstance) {
    try {
      momentInstance = require("moment-timezone");
    } catch (error) {
      console.error("Error loading moment-timezone:", error);
    }
  }
  return momentInstance;
}

/**
 * Convert Gregorian date to Ethiopian date
 * Implements the same algorithm as ethiopic-date library
 */
export function toEthiopianDate(date: Date | null | undefined): {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekdayName: string;
  weekdayNameShort: string;
} {
  // Validate input
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const today = new Date();
    date = today;
  }

  try {
    const calendar = getEthiopicCalendar();
    const moment = getMoment();

    if (calendar && moment) {
      // Use the library's convert method which uses moment
      const momentDate = moment(date);
      // Access internal convertDate through the calendar structure
      // The library structure: calendar has convertDate internally
      try {
        // Try to use the library's internal convertDate
        // We'll use a workaround by calling convert and parsing, or use the algorithm
        const calendarAny = calendar as any;
        
        // Check if convertDate is accessible (it's a closure, so we'll implement our own)
        // Use the algorithm from the library
        const offset = 79372;
        const daymillisecond = 1000 * 60 * 60 * 24;
        
        const timeStampMinute = Math.floor(date.getTime() / 1000) * 1000;
        let days = Math.floor((timeStampMinute / daymillisecond) + offset);
        
        let eyear = 1745;
        let check = 0;
        
        while (check === 0) {
          if (eyear % 4 === 3) {
            if (days >= 366) {
              days -= 366;
              eyear++;
            } else {
              check = 1;
            }
          } else {
            if (days >= 365) {
              days -= 365;
              eyear++;
            } else {
              check = 1;
            }
          }
        }
        
        let emonth: number;
        let eday: number;
        
        if (days === 0) {
          eyear -= 1;
          emonth = 13;
          eday = 5 + ((eyear % 4 === 3) ? 1 : 0);
        } else {
          emonth = Math.ceil(days / 30);
          if (days % 30 === 0) {
            eday = 30;
          } else {
            eday = days % 30;
          }
        }
        
        // Get month name from library
        let monthName: string;
        try {
          monthName = calendar.month(emonth, "wide") || ETHIOPIAN_MONTHS[emonth - 1];
        } catch {
          monthName = ETHIOPIAN_MONTHS[emonth - 1] || `Month ${emonth}`;
        }
        
        return {
          year: eyear,
          month: emonth,
          day: eday,
          monthName: monthName,
          weekdayName: ETHIOPIAN_WEEKDAYS[date.getDay()] || `Day ${date.getDay()}`,
          weekdayNameShort: ETHIOPIAN_WEEKDAYS_SHORT[date.getDay()] || "",
        };
      } catch (error) {
        console.error("Error in conversion:", error);
      }
    }
  } catch (error) {
    console.error("Error converting to Ethiopian date:", error);
  }

  // Fallback: Simple approximation
  const ethYear = date.getFullYear() - 8;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return {
    year: ethYear,
    month: month > 12 ? 13 : month,
    day: day,
    monthName: ETHIOPIAN_MONTHS[month > 12 ? 12 : month - 1] || `Month ${month}`,
    weekdayName: ETHIOPIAN_WEEKDAYS[date.getDay()] || `Day ${date.getDay()}`,
    weekdayNameShort: ETHIOPIAN_WEEKDAYS_SHORT[date.getDay()] || "",
  };
}

/**
 * Get Ethiopian month name
 */
export function getEthiopianMonthName(month: number): string {
  try {
    const calendar = getEthiopicCalendar();
    if (calendar) {
      return calendar.month(month, "wide") || ETHIOPIAN_MONTHS[month - 1];
    }
  } catch (error) {
    console.error("Error getting month name:", error);
  }
  return ETHIOPIAN_MONTHS[month - 1] || `Month ${month}`;
}

/**
 * Format Ethiopian date for display (e.g., "27 ሚያዝያ 2018")
 */
export function formatEthiopianDate(date: Date | null | undefined): string {
  if (!date) return "";
  const eth = toEthiopianDate(date);
  return `${eth.day} ${eth.monthName} ${eth.year}`;
}

/**
 * Format Ethiopian date in numeric format (e.g., "27/3/2018")
 */
export function formatEthiopianDateNumeric(date: Date | null | undefined): string {
  if (!date) return "";
  const eth = toEthiopianDate(date);
  return `${eth.day}/${eth.month}/${eth.year}`;
}

/**
 * Format Ethiopian date with weekday
 */
export function formatEthiopianDateWithWeekday(date: Date | null | undefined): string {
  if (!date) return "";
  const eth = toEthiopianDate(date);
  return `${eth.weekdayName}, ${eth.day} ${eth.monthName} ${eth.year}`;
}

