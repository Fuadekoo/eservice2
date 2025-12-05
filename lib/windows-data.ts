// Government Windows data
export interface Service {
  id: number;
  name: string;
  nameAm?: string;
  nameOr?: string;
}

export interface GovernmentWindow {
  id: number;
  name: string;
  nameAm?: string;
  nameOr?: string;
  services: Service[];
}

export const governmentWindows: GovernmentWindow[] = [
  {
    id: 1,
    name: "Basic Registration & Certification",
    nameAm: "መሰረታዊ ምዝገባ እና የምስክር ወረቀት",
    nameOr: "Galmee Dhuunfaa fi Ragaa",
    services: [
      { id: 1, name: "Birth Certificate", nameAm: "የልደት ወረቀት", nameOr: "Ragaa Dhaloota" },
      { id: 2, name: "ID Card", nameAm: "የመለያ ካርድ", nameOr: "Kaardii Agarsiisa" },
      { id: 3, name: "Marriage Certificate", nameAm: "የጋብቻ ወረቀት", nameOr: "Ragaa Fuudhii" },
    ],
  },
  {
    id: 2,
    name: "Support Letters",
    nameAm: "የድጋፍ ደብዳቤዎች",
    nameOr: "Xalayaa Tumsa",
    services: [
      { id: 4, name: "Residence Letter", nameAm: "የኖር ማረጋገጫ ደብዳቤ", nameOr: "Xalayaa Teessoo" },
      { id: 5, name: "Character Certificate", nameAm: "የአንድነት ወረቀት", nameOr: "Ragaa Amala" },
    ],
  },
  {
    id: 3,
    name: "Administrative Services",
    nameAm: "የአስተዳደር አገልግሎቶች",
    nameOr: "Tajaajila Bulchiinsaa",
    services: [
      { id: 6, name: "Document Authentication", nameAm: "የሰነድ ማረጋገጫ", nameOr: "Mirkaneessuu Kaayyoo" },
    ],
  },
  {
    id: 4,
    name: "Professional Licenses",
    nameAm: "የሙያ ፍቃዶች",
    nameOr: "Hayyama Ogummaa",
    services: [
      { id: 7, name: "Teaching License", nameAm: "የአስተማሪ ፍቃድ", nameOr: "Hayyama Barsiisaa" },
    ],
  },
  {
    id: 5,
    name: "Competency Certification",
    nameAm: "የዕውቀት ምስክር ወረቀት",
    nameOr: "Ragaa Dandeettii",
    services: [
      { id: 8, name: "Skill Assessment", nameAm: "የክህሎት ምዘና", nameOr: "Qorannoo Dandeettii" },
    ],
  },
  {
    id: 6,
    name: "Business Licenses",
    nameAm: "የንግድ ፍቃዶች",
    nameOr: "Hayyama Daldalaa",
    services: [
      { id: 9, name: "Trade License", nameAm: "የንግድ ፍቃድ", nameOr: "Hayyama Daldalaa" },
    ],
  },
  {
    id: 7,
    name: "Registration & Verification",
    nameAm: "ምዝገባ እና ማረጋገጫ",
    nameOr: "Galmee fi Mirkaneessuu",
    services: [
      { id: 10, name: "Company Registration", nameAm: "የኩባንያ ምዝገባ", nameOr: "Galmee Kampaanii" },
    ],
  },
  {
    id: 8,
    name: "Investment Services",
    nameAm: "የኢንቨስትመንት አገልግሎቶች",
    nameOr: "Tajaajila Ijaarsa",
    services: [
      { id: 11, name: "Investment Permit", nameAm: "የኢንቨስትመንት ፍቃድ", nameOr: "Hayyama Ijaarsa" },
    ],
  },
  {
    id: 9,
    name: "Land Services",
    nameAm: "የመሬት አገልግሎቶች",
    nameOr: "Tajaajila Lafti",
    services: [
      { id: 12, name: "Land Certificate", nameAm: "የመሬት ወረቀት", nameOr: "Ragaa Lafti" },
    ],
  },
  {
    id: 10,
    name: "Revenue Collection",
    nameAm: "የገቢ ስብስብ",
    nameOr: "Hordofuu Galataa",
    services: [
      { id: 13, name: "Tax Payment", nameAm: "የግብር ክፍያ", nameOr: "Kaffalti Kaffaltii" },
    ],
  },
  {
    id: 11,
    name: "Government Payments",
    nameAm: "የመንግስት ክፍያዎች",
    nameOr: "Kaffalti Mootummaa",
    services: [
      { id: 14, name: "Fee Payment", nameAm: "የክፍያ ክፍያ", nameOr: "Kaffalti Kaffaltii" },
    ],
  },
  {
    id: 12,
    name: "Banking Services",
    nameAm: "የባንክ አገልግሎቶች",
    nameOr: "Tajaajila Baankii",
    services: [
      { id: 15, name: "Bank Statement", nameAm: "የባንክ መግለጫ", nameOr: "Odeeffannoo Baankii" },
    ],
  },
];
