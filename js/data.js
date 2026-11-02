/* بيانات تجريبية: العلامات التجارية (الصوالين) وخدماتها ومختصوها.
   كل صالون يحمل ألوان علامته التجارية، ويتلوّن التطبيق بها أثناء الحجز. */
window.ENAYATI_DATA = {
  currency: "ر.س",
  categories: [
    { id: "hair", name: "الشعر", desc: "قص، تدرّج، صبغة، استشوار" },
    { id: "beard", name: "اللحية", desc: "تهذيب وتحديد" },
    { id: "skin", name: "البشرة", desc: "تنظيف وعناية" },
    { id: "nails", name: "الأظافر", desc: "مناكير وبديكير" },
    { id: "makeup", name: "المكياج والحواجب", desc: "مناسبات ورسم حواجب" },
    { id: "kids", name: "الأطفال", desc: "حلاقة الصغار" }
  ],
  salons: [
    {
      id: "sanad",
      name: "صالون سَنَد",
      type: "men",
      tagline: "حلاقة كلاسيكية وتهذيب لحية",
      area: "حي الياسمين",
      rating: 4.8,
      reviews: 312,
      brand: { primary: "#0E4F4A", accent: "#B8893B" },
      hours: { open: 10, close: 23 },
      services: [
        { id: "cut", name: "قص شعر", desc: "قص بالمقص والماكينة مع تصفيف", min: 40, price: 60, cat: "hair" },
        { id: "beard", name: "تهذيب اللحية", desc: "تحديد بالموس وزيت اللحية", min: 25, price: 40, cat: "beard" },
        { id: "combo", name: "شعر ولحية", desc: "الباقة الكاملة مع منشفة ساخنة", min: 60, price: 90, cat: "hair" },
        { id: "kids", name: "حلاقة أطفال", desc: "حتى عمر ١٢ سنة", min: 30, price: 40, cat: "kids" },
        { id: "facial", name: "تنظيف بشرة", desc: "تقشير وقناع طين", min: 35, price: 75, cat: "skin" }
      ],
      staff: [
        { id: "a", name: "أبو فهد", role: "حلاق أول", years: 14 },
        { id: "b", name: "سلمان", role: "مختص لحية", years: 7 },
        { id: "c", name: "يوسف", role: "حلاق", years: 4 }
      ]
    },
    {
      id: "qass",
      name: "القصّاص",
      type: "men",
      tagline: "قصات حديثة وتدرّج",
      area: "حي النرجس",
      rating: 4.6,
      reviews: 188,
      brand: { primary: "#1F2A44", accent: "#C4573A" },
      hours: { open: 13, close: 24 },
      services: [
        { id: "fade", name: "قصة تدرّج", desc: "Fade بجميع درجاته", min: 45, price: 70, cat: "hair" },
        { id: "cut", name: "قص شعر", desc: "قص وتصفيف", min: 35, price: 55, cat: "hair" },
        { id: "beard", name: "تحديد لحية", desc: "خط ناعم بالموس", min: 20, price: 35, cat: "beard" },
        { id: "color", name: "صبغة رجالية", desc: "تغطية الشيب", min: 40, price: 85, cat: "hair" }
      ],
      staff: [
        { id: "a", name: "ماجد", role: "مختص تدرّج", years: 9 },
        { id: "b", name: "عمر", role: "حلاق", years: 5 }
      ]
    },
    {
      id: "maha",
      name: "لمسة مها",
      type: "women",
      tagline: "شعر، أظافر، ومكياج مناسبات",
      area: "حي الملقا",
      rating: 4.9,
      reviews: 421,
      brand: { primary: "#6B2D4A", accent: "#C99A6B" },
      hours: { open: 11, close: 22 },
      services: [
        { id: "blow", name: "استشوار", desc: "غسيل وتجفيف وتصفيف", min: 45, price: 120, cat: "hair" },
        { id: "cut", name: "قص شعر", desc: "قص مع استشارة شكل الوجه", min: 50, price: 150, cat: "hair" },
        { id: "color", name: "صبغة كاملة", desc: "لون واحد مع العناية", min: 120, price: 380, cat: "hair" },
        { id: "nails", name: "مناكير وبديكير", desc: "تنظيف وطلاء جل", min: 75, price: 160, cat: "nails" },
        { id: "makeup", name: "مكياج سهرة", desc: "مكياج كامل مع رموش", min: 60, price: 300, cat: "makeup" }
      ],
      staff: [
        { id: "a", name: "مها", role: "مختصة شعر", years: 12 },
        { id: "b", name: "نوف", role: "مختصة مكياج", years: 6 },
        { id: "c", name: "ريم", role: "مختصة أظافر", years: 5 }
      ]
    },
    {
      id: "lulu",
      name: "ستوديو لؤلؤة",
      type: "women",
      tagline: "عناية بالبشرة والشعر",
      area: "حي الروضة",
      rating: 4.7,
      reviews: 256,
      brand: { primary: "#2F4A3A", accent: "#D1A04C" },
      hours: { open: 10, close: 21 },
      services: [
        { id: "facial", name: "جلسة بشرة", desc: "تنظيف عميق وترطيب", min: 60, price: 220, cat: "skin" },
        { id: "protein", name: "بروتين", desc: "علاج وفرد الشعر", min: 150, price: 550, cat: "hair" },
        { id: "blow", name: "استشوار", desc: "تجفيف وتصفيف", min: 40, price: 100, cat: "hair" },
        { id: "brows", name: "رسم حواجب", desc: "تحديد بالخيط", min: 20, price: 50, cat: "makeup" }
      ],
      staff: [
        { id: "a", name: "لولوة", role: "مختصة بشرة", years: 10 },
        { id: "b", name: "سارة", role: "مختصة شعر", years: 8 }
      ]
    }
  ],
  payments: [
    { id: "applepay", name: "Apple Pay", note: "دفع فوري من جوالك" },
    { id: "mada", name: "مدى / بطاقة ائتمانية", note: "Visa · Mastercard · مدى" },
    { id: "cash", name: "الدفع في الصالون", note: "نقداً أو بالبطاقة عند الحضور" }
  ]
};
