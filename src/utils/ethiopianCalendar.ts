export const ETHIOPIAN_MONTHS_EN = [
  "",
  "Mäskäräm",
  "Ṭeqemt",
  "Ḥedar",
  "Taḫśaś",
  "Ṭer",
  "Yekatit",
  "Meggabit",
  "Miyazya",
  "Ginbot",
  "Sene",
  "Ḥamle",
  "Nehasa",
  "Pagumē"
];

export const ETHIOPIAN_MONTHS_AM = [
  "",
  "መስከረም",
  "ጥቅምት",
  "ህዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜ"
];

const startDayOfEthiopian = (year: number): number => {
  const newYearDay = Math.floor(year / 100) - Math.floor(year / 400) - 4;
  // if the prev ethiopian year is a leap year, new-year occurs on 12th
  return ((year - 1) % 4 === 3) ? newYearDay + 1 : newYearDay;
};

export const toGregorian = (ethiopianYear: number, ethiopianMonth: number, ethiopianDay: number): [number, number, number] => {
  // Ethiopian new year in Gregorian calendar
  const newYearDay = startDayOfEthiopian(ethiopianYear);

  // September (Ethiopian) sees 7y difference
  let gregorianYear = ethiopianYear + 7;

  let gregorianMonths = [0.0, 30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31, 31, 30];

  // if next gregorian year is leap year, February has 29 days.
  const nextYear = gregorianYear + 1;
  if ((nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0) {
    gregorianMonths[6] = 29;
  }

  // calculate number of days up to that date
  let until = ((ethiopianMonth - 1) * 30.0) + ethiopianDay;
  if (until <= 37 && ethiopianYear <= 1575) {
    until += 28;
    gregorianMonths[0] = 31;
  } else {
    until += newYearDay - 1;
  }

  // if ethiopian year is leap year, pagumain has six days
  if ((ethiopianYear - 1) % 4 === 3) {
    until += 1;
  }

  // calculate month and date incrementally
  let m = 0;
  let gregorianDate = 0;
  for (let i = 0; i < gregorianMonths.length; i++) {
    if (until <= gregorianMonths[i]) {
      m = i;
      gregorianDate = until;
      break;
    } else {
      m = i;
      until -= gregorianMonths[i];
    }
  }

  if (m > 4) {
    gregorianYear += 1;
  }

  const order = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const gregorianMonth = order[m];
  return [gregorianYear, gregorianMonth, Math.floor(gregorianDate)];
};

export const toEthiopian = (gregorianYear: number, gregorianMonth: number, gregorianDay: number): [number, number, number] => {
  const gregorianMonths = [0.0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const ethiopianMonths = [0.0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5, 30, 30, 30, 30];

  // if gregorian leap year, February has 29 days.
  if ((gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || gregorianYear % 400 === 0) {
    gregorianMonths[2] = 29;
  }

  // September sees 8y difference
  let ethiopianYear = gregorianYear - 8;

  // if ethiopian leap year pagumain has 6 days
  if (ethiopianYear % 4 === 3) {
    ethiopianMonths[10] = 6;
  }

  // Ethiopian new year in Gregorian calendar
  const newYearDay = startDayOfEthiopian(gregorianYear - 8);

  // calculate number of days up to that date
  let until = 0;
  for (let i = 1; i < gregorianMonth; i++) {
    until += gregorianMonths[i];
  }
  until += gregorianDay;

  // update tahissas (december) to match january 1st
  let tahissas = (ethiopianYear % 4) === 0 ? 26 : 25;

  if (gregorianYear < 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else if (until <= 277 && gregorianYear === 1582) {
    ethiopianMonths[1] = 0;
    ethiopianMonths[2] = tahissas;
  } else {
    tahissas = newYearDay - 3;
    ethiopianMonths[1] = tahissas;
  }

  // calculate month and date incrementally
  let m = 1;
  let ethiopianDate = 0;
  for (m = 1; m < ethiopianMonths.length; m++) {
    if (until <= ethiopianMonths[m]) {
      ethiopianDate = (m === 1 || ethiopianMonths[m] === 0) ? until + (30 - tahissas) : until;
      break;
    } else {
      until -= ethiopianMonths[m];
    }
  }

  if (m > 10) {
    ethiopianYear += 1;
  }

  const order = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4];
  const ethiopianMonth = order[m];
  return [ethiopianYear, ethiopianMonth, Math.floor(ethiopianDate)];
};

// Helper to convert Gregorian Date string YYYY-MM-DD to Ethiopian Formatted Date
export function formatGregorianToEthiopian(gregorianStr: string, format: 'long' | 'short' | 'amharic' = 'long'): string {
  if (!gregorianStr) return "";
  try {
    const parts = gregorianStr.split('T')[0].split('-');
    if (parts.length < 3) return gregorianStr;
    const gYear = parseInt(parts[0], 10);
    const gMonth = parseInt(parts[1], 10);
    const gDay = parseInt(parts[2], 10);
    const [eYear, eMonth, eDay] = toEthiopian(gYear, gMonth, gDay);

    if (format === 'amharic') {
      return `${ETHIOPIAN_MONTHS_AM[eMonth]} ${eDay}, ${eYear}`;
    } else if (format === 'short') {
      const padDay = String(eDay).padStart(2, '0');
      const padMonth = String(eMonth).padStart(2, '0');
      return `${padDay}/${padMonth}/${eYear}`;
    } else {
      return `${ETHIOPIAN_MONTHS_EN[eMonth]} ${eDay}, ${eYear}`;
    }
  } catch (err) {
    return gregorianStr;
  }
}

// Convert Today's date to Gregorian string YYYY-MM-DD
export function getTodayGregorianStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert Ethiopian date to Gregorian string YYYY-MM-DD
export function ethiopianToGregorianStr(eYear: number, eMonth: number, eDay: number): string {
  const [gYear, gMonth, gDay] = toGregorian(eYear, eMonth, eDay);
  const padMonth = String(gMonth).padStart(2, '0');
  const padDay = String(gDay).padStart(2, '0');
  return `${gYear}-${padMonth}-${padDay}`;
}

// Get Today as Ethiopian parts
export function getTodayEthiopian(): { year: number, month: number, day: number } {
  const d = new Date();
  const [eYear, eMonth, eDay] = toEthiopian(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { year: eYear, month: eMonth, day: eDay };
}
