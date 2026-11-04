/* بيانات تجريبية: العلامات التجارية (الصوالين) وخدماتها ومختصوها.
   كل صالون يحمل ألوان علامته التجارية، ويتلوّن التطبيق بها أثناء الحجز. */
window.ENAYATI_DATA = {
  currency: "ر.س",
  salons: [
    {
      id: "sanad",
      name: "صالون سَنَد",
      type: "men",
      tagline: "حلاقة كلاسيكية وتهذيب لحية",
      area: "حي الياسمين",
      slogan: "حلاقتك بيد تعرفك",
      about: "صالون رجالي يجمع الحلاقة الكلاسيكية بالموس والمنشفة الساخنة مع لمسة عصرية. نهتم بالتفاصيل الصغيرة: التحديد، والنظافة، والقهوة وأنت تنتظر.",
      address: "الرياض، حي الياسمين، طريق الملك عبدالعزيز",
      location: { lat: 24.8235, lng: 46.642 },
      /* أرقام تجريبية للعرض فقط (صالون وهمي) */
      seed: { visits: 1240, ratings: { very: 268, ok: 38, no: 6 } },
      brand: { primary: "#0E4F4A", accent: "#B8893B" },
      hours: { open: 10, close: 23 },
      services: [
        { id: "cut", name: "قص شعر", desc: "قص بالمقص والماكينة مع تصفيف", min: 40, price: 60 },
        { id: "beard", name: "تهذيب اللحية", desc: "تحديد بالموس وزيت اللحية", min: 25, price: 40 },
        { id: "combo", name: "شعر ولحية", desc: "الباقة الكاملة مع منشفة ساخنة", min: 60, price: 90 },
        { id: "kids", name: "حلاقة أطفال", desc: "حتى عمر ١٢ سنة", min: 30, price: 40 },
        { id: "facial", name: "تنظيف بشرة", desc: "تقشير وقناع طين", min: 35, price: 75 }
      ],
      productsEnabled: true,
      products: [
        { id: "beard-oil", name: "زيت اللحية بخلاصة الأرغان", category: "عناية باللحية", price: 45, desc: "30 مل · يرطّب ويلمّع", inStock: true },
        { id: "pomade", name: "شمع تصفيف لامع", category: "تصفيف الشعر", price: 38, desc: "ثبات قوي طوال اليوم", inStock: true },
        { id: "aftershave", name: "بلسم ما بعد الحلاقة", category: "كريمات وزيوت", price: 32, desc: "يهدّئ البشرة بعد الموس", inStock: true },
        { id: "comb", name: "مشط خشب للّحية", category: "أدوات حلاقة", price: 25, desc: "خشب الصندل", inStock: false }
      ],
      staff: [
        { id: "a", name: "أبو فهد", role: "حلاق أول", years: 14, seedCuts: 612 },
        { id: "b", name: "سلمان", role: "مختص لحية", years: 7, seedCuts: 401 },
        { id: "c", name: "يوسف", role: "حلاق", years: 4, seedCuts: 227 }
      ]
    },
    {
      id: "qass",
      name: "القصّاص",
      type: "men",
      tagline: "قصات حديثة وتدرّج",
      area: "حي النرجس",
      slogan: "القصة اللي تشبهك",
      about: "متخصصون في قصات التدرّج الحديثة وتحديد اللحية بدقة. فريق شاب يتابع أحدث الصيحات ويختار معك ما يناسب شكل وجهك.",
      address: "الرياض، حي النرجس، شارع أنس بن مالك",
      location: { lat: 24.878, lng: 46.656 },
      /* أرقام تجريبية للعرض فقط (صالون وهمي) */
      seed: { visits: 760, ratings: { very: 141, ok: 36, no: 11 } },
      brand: { primary: "#1F2A44", accent: "#C4573A" },
      hours: { open: 13, close: 24 },
      services: [
        { id: "fade", name: "قصة تدرّج", desc: "Fade بجميع درجاته", min: 45, price: 70 },
        { id: "cut", name: "قص شعر", desc: "قص وتصفيف", min: 35, price: 55 },
        { id: "beard", name: "تحديد لحية", desc: "خط ناعم بالموس", min: 20, price: 35 },
        { id: "color", name: "صبغة رجالية", desc: "تغطية الشيب", min: 40, price: 85 }
      ],
      productsEnabled: true,
      products: [
        { id: "clay", name: "طين تصفيف مطفي", category: "تصفيف الشعر", price: 42, desc: "مظهر طبيعي بدون لمعة", inStock: true },
        { id: "trimmer", name: "ماكينة تحديد لاسلكية", category: "أدوات حلاقة", price: 189, desc: "للاستخدام المنزلي", inStock: true }
      ],
      staff: [
        { id: "a", name: "ماجد", role: "مختص تدرّج", years: 9, seedCuts: 455 },
        { id: "b", name: "عمر", role: "حلاق", years: 5, seedCuts: 305 }
      ]
    },
    {
      id: "maha",
      name: "لمسة مها",
      type: "women",
      tagline: "شعر، أظافر، ومكياج مناسبات",
      area: "حي الملقا",
      slogan: "جمالك يبدأ من هنا",
      about: "صالون نسائي متكامل للشعر والأظافر ومكياج المناسبات، بأيدي مختصات بخبرة طويلة ومنتجات عالية الجودة.",
      address: "الرياض، حي الملقا، طريق الأمير محمد بن سعد",
      location: { lat: 24.804, lng: 46.6 },
      /* أرقام تجريبية للعرض فقط (صالون وهمي) */
      seed: { visits: 1630, ratings: { very: 372, ok: 41, no: 8 } },
      brand: { primary: "#6B2D4A", accent: "#C99A6B" },
      hours: { open: 11, close: 22 },
      services: [
        { id: "blow", name: "استشوار", desc: "غسيل وتجفيف وتصفيف", min: 45, price: 120 },
        { id: "cut", name: "قص شعر", desc: "قص مع استشارة شكل الوجه", min: 50, price: 150 },
        { id: "color", name: "صبغة كاملة", desc: "لون واحد مع العناية", min: 120, price: 380 },
        { id: "nails", name: "مناكير وبديكير", desc: "تنظيف وطلاء جل", min: 75, price: 160 },
        { id: "makeup", name: "مكياج سهرة", desc: "مكياج كامل مع رموش", min: 60, price: 300 }
      ],
      productsEnabled: true,
      products: [
        { id: "lashes", name: "رموش طبيعية (٣ أزواج)", category: "الرموش", price: 55, desc: "قابلة لإعادة الاستخدام", inStock: true },
        { id: "gel-polish", name: "طلاء أظافر جل", category: "الأظافر", price: 48, desc: "١٢ لوناً متوفراً", inStock: true },
        { id: "pedicure-kit", name: "مجموعة البديكير المنزلية", category: "أدوات البديكير والمناكير", price: 120, desc: "مبرد، دافع جلد، مقص", inStock: true },
        { id: "hair-mask", name: "ماسك ترميم الشعر", category: "العناية بالشعر", price: 85, desc: "للشعر المصبوغ", inStock: false }
      ],
      staff: [
        { id: "a", name: "مها", role: "مختصة شعر", years: 12, seedCuts: 820 },
        { id: "b", name: "نوف", role: "مختصة مكياج", years: 6, seedCuts: 480 },
        { id: "c", name: "ريم", role: "مختصة أظافر", years: 5, seedCuts: 330 }
      ]
    },
    {
      id: "lulu",
      name: "ستوديو لؤلؤة",
      type: "women",
      tagline: "عناية بالبشرة والشعر",
      area: "حي الروضة",
      slogan: "عناية تليق بك",
      about: "ستوديو هادئ للعناية بالبشرة والشعر، بجلسات مخصصة حسب نوع بشرتك وشعرك، في أجواء مريحة وخاصة.",
      address: "الرياض، حي الروضة، شارع خالد بن الوليد",
      location: { lat: 24.735, lng: 46.765 },
      /* أرقام تجريبية للعرض فقط (صالون وهمي) */
      seed: { visits: 905, ratings: { very: 201, ok: 44, no: 11 } },
      brand: { primary: "#2F4A3A", accent: "#D1A04C" },
      hours: { open: 10, close: 21 },
      services: [
        { id: "facial", name: "جلسة بشرة", desc: "تنظيف عميق وترطيب", min: 60, price: 220 },
        { id: "protein", name: "بروتين", desc: "علاج وفرد الشعر", min: 150, price: 550 },
        { id: "blow", name: "استشوار", desc: "تجفيف وتصفيف", min: 40, price: 100 },
        { id: "brows", name: "رسم حواجب", desc: "تحديد بالخيط", min: 20, price: 50 }
      ],
      productsEnabled: true,
      products: [
        { id: "serum", name: "سيروم فيتامين سي", category: "العناية بالبشرة", price: 95, desc: "30 مل · لنضارة البشرة", inStock: true },
        { id: "brow-kit", name: "مجموعة تحديد الحواجب", category: "الرموش والحواجب", price: 60, desc: "قلم + جل + فرشاة", inStock: true }
      ],
      staff: [
        { id: "a", name: "لولوة", role: "مختصة بشرة", years: 10, seedCuts: 530 },
        { id: "b", name: "سارة", role: "مختصة شعر", years: 8, seedCuts: 375 }
      ]
    },
    {
      id: "asrar",
      unlisted: true, /* للتجربة: لا يظهر في قائمة المنصة، ويفتح من رابطه فقط */
      name: "صالون أسرار العناية",
      type: "men",
      tagline: "حلاقة، صبغة، وعناية بالوجه والشعر",
      area: "",
      slogan: "سرّ أناقتك عندنا",
      about: "صالون رجالي يقدّم الحلاقة بأنواعها، والصبغة، والعناية بالوجه والبشرة والشعر، بأيدي فريق من الحلاقين ذوي الخبرة.",
      address: "",
      brand: { primary: "#2F5233", accent: "#D98A2B" },
      hours: { open: 14, close: 24 },
      services: [
        { id: "beard", name: "حلاقة دقن", min: 20, price: 25, group: "الحلاقة" },
        { id: "cut", name: "حلاقة شعر رجال", min: 30, price: 30, group: "الحلاقة" },
        { id: "machine", name: "حلاقة شعر مكينة", min: 20, price: 20, group: "الحلاقة" },
        { id: "razor", name: "حلاقة شعر موس", min: 25, price: 25, group: "الحلاقة" },
        { id: "kids", name: "حلاقة شعر أطفال", min: 25, price: 25, group: "الحلاقة" },
        { id: "dye-short", name: "صبغة شعر رأس قصير", min: 40, price: 70, group: "الصبغة" },
        { id: "dye-long", name: "صبغة شعر رأس طويل", min: 60, price: 100, group: "الصبغة" },
        { id: "dye-beard-short", name: "صبغة دقن قصيرة", min: 20, price: 30, group: "الصبغة" },
        { id: "dye-beard-long", name: "صبغة دقن طويل", min: 30, price: 50, group: "الصبغة" },
        { id: "dye-goatee", name: "صبغة سكسوكة", min: 15, price: 20, group: "الصبغة" },
        { id: "dye-mustache", name: "صبغة شنب", min: 10, price: 10, group: "الصبغة" },
        { id: "mask-cashmere", name: "قناع وجه كاسمرا", min: 25, price: 50, group: "العناية بالوجه والبشرة" },
        { id: "mask-whitening", name: "قناع وجه مبيض", min: 20, price: 15, group: "العناية بالوجه والبشرة" },
        { id: "mask-tunisian", name: "قناع وجه تونسي", min: 20, price: 10, group: "العناية بالوجه والبشرة" },
        { id: "wax", name: "إزالة شعر الوجه بالشمع", min: 15, price: 10, group: "العناية بالوجه والبشرة" },
        { id: "facial", name: "تنظيف بشرة", min: 45, price: 120, group: "العناية بالوجه والبشرة" },
        { id: "scrub", name: "سنفرة وجه مع بخار", min: 20, price: 15, group: "العناية بالوجه والبشرة" },
        { id: "wash", name: "غسيل شعر", min: 10, price: 10, group: "العناية بالشعر" },
        { id: "oil-short", name: "حمام زيت شعر قصير", min: 30, price: 60, group: "العناية بالشعر" },
        { id: "oil-long", name: "حمام زيت شعر طويل", min: 45, price: 80, group: "العناية بالشعر" },
        { id: "straight-short", name: "فرد شعر قصير", min: 60, price: 100, group: "العناية بالشعر" },
        { id: "straight-long", name: "فرد شعر طويل", min: 90, price: 120, group: "العناية بالشعر" },
        { id: "ceramic", name: "تسريحة سراميك", min: 30, price: 40, group: "العناية بالشعر" },
        { id: "blow-short", name: "سشوار شعر قصير", min: 20, price: 30, group: "العناية بالشعر" },
        { id: "blow-long", name: "سشوار شعر طويل", min: 30, price: 40, group: "العناية بالشعر" }
      ],
      staff: [
        { id: "a", name: "عبدالقادر", role: "حلاق" },
        { id: "b", name: "ياسر", role: "حلاق" },
        { id: "c", name: "رمزي", role: "حلاق" },
        { id: "d", name: "زياد", role: "حلاق" }
      ]
    }
  ],
  /* أقسام مقترحة للمنتجات حسب نوع الصالون (يستطيع الصالون كتابة قسم آخر) */
  productCategories: {
    men: ["أدوات حلاقة", "عناية باللحية", "كريمات وزيوت", "تصفيف الشعر", "العناية بالبشرة"],
    women: ["أدوات البديكير والمناكير", "الأظافر", "الرموش والحواجب", "الرموش", "العناية بالبشرة", "العناية بالشعر", "المكياج"]
  },
  payments: [
    { id: "applepay", name: "Apple Pay", note: "دفع فوري من جوالك" },
    { id: "mada", name: "مدى / بطاقة ائتمانية", note: "Visa · Mastercard · مدى" },
    { id: "cash", name: "الدفع في الصالون", note: "نقداً أو بالبطاقة عند الحضور" }
  ]
};
