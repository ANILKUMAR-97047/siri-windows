// ============================================================
// Siri Windows - Centralized multilingual content
// ============================================================

export type LanguageCode = "en" | "te" | "hi";

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export interface Product {
  slug: string;
  name: string;
  description: string;
  image: string;
  icon: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  quote: string;
}

export interface GalleryImage {
  src: string;
  alt: string;
  category: "windows" | "doors" | "residential" | "commercial";
  width: number;
  height: number;
}

export interface ContactInfo {
  phones: string[];
  address: string;
  businessHours: string;
  mapEmbedUrl: string;
  whatsappNumber: string;
}

export interface ContactLabels {
  name: string;
  phone: string;
  email: string;
  product: string;
  productPlaceholder: string;
  message: string;
  sending: string;
  success: string;
  submit: string;
  error: string;
  getInTouch: string;
  showroom: string;
  call: string;
  hours: string;
  emailTitle: string;
  mapTitle: string;
  requiredName: string;
  requiredPhone: string;
  invalidPhone: string;
  invalidEmail: string;
  requiredMessage: string;
}

export interface FooterContent {
  description: string;
  quickLinks: string;
  products: string;
  contact: string;
  rights: string;
}

export interface WebsiteContent {
  siteMeta: typeof siteMeta;
  navLinks: NavLink[];
  contactInfo: ContactInfo;
  heroContent: typeof heroContent;
  aboutContent: typeof aboutContent;
  productsContent: typeof productsContent;
  whyUsContent: typeof whyUsContent;
  processContent: typeof processContent;
  galleryContent: {
    sectionLabel: string;
    heading: string;
    filters: string[];
    images: GalleryImage[];
    view: string;
    lightboxLabel: string;
    close: string;
    previous: string;
    next: string;
  };
  testimonialsContent: typeof testimonialsContent;
  ctaBannerContent: typeof ctaBannerContent;
  contactFormContent: typeof contactFormContent;
  contactLabels: ContactLabels;
  footerContent: FooterContent;
  whatsappMessage: string;
  languageLabel: string;
}

export const languages: { code: LanguageCode; label: string; shortLabel: string }[] = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "te", label: "తెలుగు", shortLabel: "తె" },
  { code: "hi", label: "हिन्दी", shortLabel: "हि" },
];

export const siteMeta = {
  name: "Siri Windows",
  parentBrand: "Siri Enterprises",
  tagline: "Windows, Better View.",
  description:
    "Premium UPVC & Aluminium Windows and Doors by Siri Enterprises. Expert craftsmanship, energy efficiency, and unmatched durability for homes and businesses in Tanuku, Andhra Pradesh.",
  url: "https://siriwindows.in",
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Products", href: "#products" },
  { label: "Why Us", href: "#why-us" },
  { label: "Process", href: "#process" },
  { label: "Gallery", href: "#gallery" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export const contactInfo: ContactInfo = {
  phones: ["9985168003", "7780127475"],
  address: "Bus Stand Road, Flyover Bridge, Pydiparru - Tanuku, Andhra Pradesh, India",
  businessHours: "Mon - Sat: 9:00 AM - 7:00 PM | Sun: By Appointment",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15303.!2d81.68!3d16.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sTanuku!5e0!3m2!1sen!2sin!4v1700000000000",
  whatsappNumber: "919985168003",
};

export const heroContent = {
  headline: "Windows, Better View.",
  subheadline:
    "Premium UPVC & Aluminium Windows and Doors - engineered for elegance, built for endurance.",
  ctaPrimary: "Get Free Quote",
  ctaSecondary: "View Our Work",
  badges: [
    { icon: "Award", label: "Premium Windows" },
    { icon: "Shield", label: "Durability & Security" },
    { icon: "Zap", label: "Energy Efficiency" },
  ],
};

export const aboutContent = {
  sectionLabel: "About Us",
  heading: "Crafting Better Views Since Day One",
  paragraphs: [
    "Siri Enterprises, based in Pydiparru-Tanuku, is a trusted name in premium UPVC and Aluminium windows and doors. We combine advanced European technology with careful Indian craftsmanship to deliver products that transform spaces.",
    "Every window and door we create is tailored to your home's architecture, ensuring a perfect fit, superior insulation, and lasting beauty. Our commitment to quality and customer satisfaction has made us a preferred choice across West Godavari district.",
  ],
  stats: [
    { value: 10, suffix: "+", label: "Years Experience" },
    { value: 500, suffix: "+", label: "Projects Completed" },
    { value: 450, suffix: "+", label: "Happy Clients" },
    { value: 2000, suffix: "+", label: "Products Installed" },
  ] as Stat[],
};

export const productsContent = {
  sectionLabel: "Our Products",
  heading: "Windows & Doors, Perfected",
  subheading: "Explore our range of premium UPVC and Aluminium solutions designed for modern living.",
  products: [
    { slug: "upvc-windows", name: "UPVC Windows", description: "Multi-chambered profiles with superior thermal insulation and weatherproof seals for year-round comfort.", image: "/images/products/upvc-windows.jpg", icon: "LayoutGrid" },
    { slug: "aluminium-windows", name: "Aluminium Windows", description: "Sleek aluminium frames with powder-coated finishes for a clean contemporary look.", image: "/images/products/aluminium-windows.jpg", icon: "Maximize2" },
    { slug: "upvc-doors", name: "UPVC Doors", description: "Strong multi-point locking doors with reinforced cores for better security and insulation.", image: "/images/products/upvc-doors.jpg", icon: "DoorOpen" },
    { slug: "aluminium-doors", name: "Aluminium Doors", description: "Durable aluminium doors with anodized or wood-grain finishes, built for high-traffic areas.", image: "/images/products/aluminium-doors.jpg", icon: "DoorClosed" },
    { slug: "sliding-windows-doors", name: "Sliding Windows & Doors", description: "Smooth-glide tracks with wide glass panels, perfect for balconies and patios.", image: "/images/products/sliding.jpg", icon: "PanelLeftOpen" },
    { slug: "casement-windows", name: "Casement Windows", description: "Outward-opening hinged windows with wide ventilation and multi-point locking.", image: "/images/products/casement.jpg", icon: "PanelTop" },
    { slug: "french-doors", name: "French Doors", description: "Elegant double-leaf doors with full-length glass panels that brighten interiors.", image: "/images/products/french-doors.jpg", icon: "Columns2" },
    { slug: "custom-solutions", name: "Custom Solutions", description: "Bespoke designs tailored to your architecture, including arches, bay windows, bi-folds, and more.", image: "/images/products/custom.jpg", icon: "Wrench" },
  ] as Product[],
  learnMore: "Learn More",
};

export const whyUsContent = {
  sectionLabel: "Why Choose Us",
  heading: "The Siri Windows Advantage",
  features: [
    { title: "Premium Quality Materials", description: "We use certified UPVC profiles and aluminium alloys for lasting performance.", icon: "Gem" },
    { title: "Durability & Security", description: "Multi-point locking systems and weatherproof seals help keep your home safe and sound.", icon: "ShieldCheck" },
    { title: "Energy Efficiency", description: "Superior insulation reduces heat transfer and can help lower electricity bills.", icon: "Leaf" },
    { title: "Custom Fit & Installation", description: "Every product is precision-measured and installed by trained professionals.", icon: "Ruler" },
    { title: "Low Maintenance", description: "UV-resistant and corrosion-proof materials keep your windows beautiful with minimal care.", icon: "Sparkles" },
    { title: "Noise Reduction", description: "Sealed chambers and glass options reduce outside noise for peaceful interiors.", icon: "VolumeX" },
  ] as Feature[],
};

export const processContent = {
  sectionLabel: "Our Process",
  heading: "From Vision to Reality",
  steps: [
    { number: 1, title: "Consultation", description: "Share your needs and we will help you choose the right window and door solutions.", icon: "MessageSquare" },
    { number: 2, title: "Measurement", description: "Our team visits your site for precise measurements and a proper custom fit.", icon: "Ruler" },
    { number: 3, title: "Custom Fabrication", description: "Your products are manufactured to exact specifications using quality materials.", icon: "Factory" },
    { number: 4, title: "Installation", description: "Professionals install your windows and doors with care and precision.", icon: "Hammer" },
    { number: 5, title: "After-Sales Support", description: "We support you after installation with responsive service and warranty help.", icon: "HeadphonesIcon" },
  ] as ProcessStep[],
};

export const galleryContent = {
  sectionLabel: "Gallery",
  heading: "Our Craftsmanship",
  filters: ["All", "Windows", "Doors"],
  images: [
    { src: "/images/gallery/gallery-1.jpg", alt: "Modern UPVC window installation in a residential villa", category: "windows" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-2.jpg", alt: "Aluminium sliding door for a contemporary living room", category: "doors" as const, width: 600, height: 800 },
    { src: "/images/gallery/gallery-3.jpg", alt: "Casement windows in a modern apartment bedroom", category: "windows" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-4.jpg", alt: "French doors opening to a garden patio", category: "doors" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-5.jpg", alt: "Large bay window installation in a luxury home", category: "windows" as const, width: 600, height: 800 },
    { src: "/images/gallery/gallery-6.jpg", alt: "UPVC entrance door with decorative glass panels", category: "doors" as const, width: 800, height: 600 },
    { src: "/images/gallery/gallery-7.jpg", alt: "Panoramic sliding windows overlooking a garden", category: "windows" as const, width: 800, height: 500 },
    { src: "/images/gallery/gallery-8.jpg", alt: "Modern aluminium folding doors in an open-plan home", category: "doors" as const, width: 800, height: 600 },
  ] satisfies GalleryImage[],
  view: "View",
  lightboxLabel: "Image lightbox",
  close: "Close lightbox",
  previous: "Previous image",
  next: "Next image",
};

export const testimonialsContent = {
  sectionLabel: "Testimonials",
  heading: "What Our Clients Say",
  testimonials: [
    { name: "Rajesh Kumar", location: "Tanuku", rating: 5, quote: "Siri Enterprises transformed our home with their UPVC windows. The noise reduction is remarkable and the service was excellent." },
    { name: "Priya Devi", location: "Bhimavaram", rating: 5, quote: "We chose Siri Windows for our new construction. The aluminium sliding doors look beautiful and the installation was flawless." },
    { name: "Venkata Rao", location: "Eluru", rating: 5, quote: "Professional service from start to finish. The team measured everything precisely and the windows fit perfectly." },
    { name: "Lakshmi Narayana", location: "Tadepalligudem", rating: 4, quote: "Excellent craftsmanship and durable products. The French doors bring so much natural light into our living room." },
    { name: "Suresh Babu", location: "Narsapuram", rating: 5, quote: "Siri Enterprises offered great quality at competitive prices. The UPVC doors are sturdy and look premium." },
  ] as Testimonial[],
};

export const ctaBannerContent = {
  heading: "Ready to Upgrade Your View?",
  subheading: "Get a free, no-obligation quote for your home or commercial project. Our experts will guide you to the perfect solution.",
  cta: "Get Your Free Quote",
};

export const contactFormContent = {
  sectionLabel: "Contact Us",
  heading: "Let's Start Your Project",
  productOptions: ["UPVC Windows", "Aluminium Windows", "UPVC Doors", "Aluminium Doors", "Sliding Windows & Doors", "Casement Windows", "French Doors", "Custom Solution", "Other / Not Sure"],
};

const englishContent = {
  siteMeta,
  navLinks,
  contactInfo,
  heroContent,
  aboutContent,
  productsContent,
  whyUsContent,
  processContent,
  galleryContent,
  testimonialsContent,
  ctaBannerContent,
  contactFormContent,
  contactLabels: {
    name: "Full Name *",
    phone: "Phone Number *",
    email: "Email (Optional)",
    product: "Product Interest",
    productPlaceholder: "Select a product",
    message: "Your Message / Requirements *",
    sending: "Sending...",
    success: "Sent Successfully!",
    submit: "Send Message",
    error: "Something went wrong. Please try again or call us directly.",
    getInTouch: "Get in Touch",
    showroom: "Visit Our Showroom",
    call: "Call Us",
    hours: "Business Hours",
    emailTitle: "Email",
    mapTitle: "Siri Enterprises location - Tanuku, Andhra Pradesh",
    requiredName: "Name is required",
    requiredPhone: "Phone number is required",
    invalidPhone: "Enter a valid 10-digit phone number",
    invalidEmail: "Enter a valid email address",
    requiredMessage: "Message is required",
  },
  footerContent: {
    description: "Premium UPVC & Aluminium Windows and Doors - engineered for elegance, built for endurance. Serving homes and businesses across West Godavari and beyond.",
    quickLinks: "Quick Links",
    products: "Products",
    contact: "Contact Us",
    rights: "All rights reserved.",
  },
  whatsappMessage: "Hi Siri Windows, I'm interested in UPVC/Aluminium windows and doors. Please share more details.",
  languageLabel: "Language",
} satisfies WebsiteContent;

const teluguContent: WebsiteContent = {
  ...englishContent,
  siteMeta: { ...siteMeta, tagline: "కిటికీలు, మెరుగైన వీక్షణ.", description: "సిరి ఎంటర్‌ప్రైజెస్ నుండి ప్రీమియం UPVC మరియు అల్యూమినియం కిటికీలు, తలుపులు. తనుకు మరియు ఆంధ్రప్రదేశ్‌లోని గృహాలు, వ్యాపారాల కోసం నాణ్యమైన పనితనం, శక్తి సామర్థ్యం మరియు దీర్ఘకాల మన్నిక." },
  navLinks: [
    { label: "హోమ్", href: "#home" }, { label: "గురించి", href: "#about" }, { label: "ఉత్పత్తులు", href: "#products" }, { label: "ఎందుకు మేము", href: "#why-us" }, { label: "ప్రక్రియ", href: "#process" }, { label: "గ్యాలరీ", href: "#gallery" }, { label: "అభిప్రాయాలు", href: "#testimonials" }, { label: "సంప్రదించండి", href: "#contact" },
  ],
  contactInfo: { ...contactInfo, address: "బస్ స్టాండ్ రోడ్, ఫ్లైఓవర్ బ్రిడ్జ్, పైడిపర్రు - తనుకు, ఆంధ్రప్రదేశ్, ఇండియా", businessHours: "సోమ - శని: ఉదయం 9:00 - సాయంత్రం 7:00 | ఆదివారం: అపాయింట్‌మెంట్ ద్వారా" },
  heroContent: { headline: "కిటికీలు, మెరుగైన వీక్షణ.", subheadline: "ప్రేమియం UPVC మరియు అల్యూమినియం కిటికీలు, తలుపులు - అందం కోసం డిజైన్, మన్నిక కోసం నిర్మాణం.", ctaPrimary: "ఉచిత కోట్ పొందండి", ctaSecondary: "మా పనిని చూడండి", badges: [{ icon: "Award", label: "ప్రీమియం కిటికీలు" }, { icon: "Shield", label: "మన్నిక & భద్రత" }, { icon: "Zap", label: "శక్తి సామర్థ్యం" }] },
  aboutContent: { sectionLabel: "మా గురించి", heading: "ప్రారంభం నుంచే మెరుగైన వీక్షణలు", paragraphs: ["పైడిపర్రు-తనుకులో ఉన్న సిరి ఎంటర్‌ప్రైజెస్, ప్రీమియం UPVC మరియు అల్యూమినియం కిటికీలు, తలుపులలో నమ్మకమైన పేరు. ఆధునిక టెక్నాలజీని జాగ్రత్తైన పనితనంతో కలిపి మీ స్థలాన్ని అందంగా మార్చే ఉత్పత్తులు అందిస్తాము.", "మేము తయారు చేసే ప్రతి కిటికీ మరియు తలుపు మీ ఇంటి నిర్మాణానికి సరిపోయేలా రూపొందించబడుతుంది. సరైన ఫిట్, మెరుగైన ఇన్సులేషన్ మరియు దీర్ఘకాల అందం కోసం మేము నాణ్యతకు ప్రాధాన్యం ఇస్తాము."], stats: [{ value: 10, suffix: "+", label: "సంవత్సరాల అనుభవం" }, { value: 500, suffix: "+", label: "పూర్తైన ప్రాజెక్టులు" }, { value: 450, suffix: "+", label: "సంతోషకర కస్టమర్లు" }, { value: 2000, suffix: "+", label: "ఇన్‌స్టాల్ చేసిన ఉత్పత్తులు" }] },
  productsContent: { ...productsContent, sectionLabel: "మా ఉత్పత్తులు", heading: "పూర్తిగా రూపొందించిన కిటికీలు & తలుపులు", subheading: "ఆధునిక జీవనానికి సరిపోయే ప్రీమియం UPVC మరియు అల్యూమినియం సొల్యూషన్లు చూడండి.", learnMore: "ఇంకా తెలుసుకోండి", products: productsContent.products.map((product, index) => ({ ...product, name: ["UPVC కిటికీలు", "అల్యూమినియం కిటికీలు", "UPVC తలుపులు", "అల్యూమినియం తలుపులు", "స్లైడింగ్ కిటికీలు & తలుపులు", "కేస్మెంట్ కిటికీలు", "ఫ్రెంచ్ తలుపులు", "కస్టమ్ సొల్యూషన్లు"][index], description: ["మెరుగైన థర్మల్ ఇన్సులేషన్ మరియు వాతావరణ రక్షణ సీల్స్‌తో అన్ని కాలాలకు సౌకర్యం.", "ఆధునిక లుక్ కోసం స్లీక్ అల్యూమినియం ఫ్రేమ్స్ మరియు పౌడర్ కోటెడ్ ఫినిషెస్.", "మెరుగైన భద్రత మరియు ఇన్సులేషన్ కోసం బలమైన మల్టీ-పాయింట్ లాకింగ్ తలుపులు.", "అధిక వినియోగ ప్రాంతాలకు సరిపోయే మన్నికైన అల్యూమినియం తలుపులు.", "బాల్కనీలు మరియు పాటియోలకు సరిపోయే స్మూత్ గ్లైడ్ ట్రాక్స్ మరియు పెద్ద గ్లాస్ ప్యానెల్స్.", "విస్తృత గాలి ప్రసరణ మరియు మల్టీ-పాయింట్ లాకింగ్‌తో బయటకు తెరుచుకునే కిటికీలు.", "ఇంటీరియర్స్‌లో సహజ కాంతిని పెంచే అందమైన డబుల్ లీఫ్ గ్లాస్ తలుపులు.", "మీ నిర్మాణానికి సరిపోయే ఆర్చ్‌లు, బే విండోస్, బై-ఫోల్డ్స్ వంటి ప్రత్యేక డిజైన్లు."][index] })) },
  whyUsContent: { sectionLabel: "ఎందుకు మమ్మల్ని ఎంచుకోవాలి", heading: "సిరి విండోస్ ప్రయోజనం", features: whyUsContent.features.map((feature, index) => ({ ...feature, title: ["ప్రీమియం నాణ్యత మెటీరియల్స్", "మన్నిక & భద్రత", "శక్తి సామర్థ్యం", "కస్టమ్ ఫిట్ & ఇన్‌స్టాలేషన్", "తక్కువ నిర్వహణ", "శబ్దం తగ్గింపు"][index], description: ["దీర్ఘకాల పనితనం కోసం సర్టిఫైడ్ UPVC ప్రొఫైల్స్ మరియు అల్యూమినియం అలాయ్స్ ఉపయోగిస్తాము.", "మల్టీ-పాయింట్ లాకింగ్ మరియు వాతావరణ రక్షణ సీల్స్ మీ ఇంటిని భద్రంగా ఉంచుతాయి.", "మెరుగైన ఇన్సులేషన్ వేడి ప్రభావాన్ని తగ్గించి విద్యుత్ బిల్లులను తగ్గించడంలో సహాయపడుతుంది.", "ప్రతి ఉత్పత్తిని ఖచ్చితంగా కొలిచి నిపుణుల ద్వారా అమర్చుతాము.", "UV-resistant మరియు corrosion-proof మెటీరియల్స్‌తో తక్కువ నిర్వహణలో అందంగా ఉంటాయి.", "సీల్డ్ చాంబర్లు మరియు గ్లాస్ ఎంపికలు బయట శబ్దాన్ని తగ్గిస్తాయి."][index] })) },
  processContent: { sectionLabel: "మా ప్రక్రియ", heading: "ఆలోచన నుండి అమలు వరకు", steps: processContent.steps.map((step, index) => ({ ...step, title: ["సలహా", "కొలత", "కస్టమ్ తయారీ", "ఇన్‌స్టాలేషన్", "అమ్మకాల తర్వాత సహాయం"][index], description: ["మీ అవసరాలు చెప్పండి, సరైన కిటికీ మరియు తలుపు సొల్యూషన్లు ఎంచుకోవడంలో మేము సహాయపడతాము.", "సరైన కస్టమ్ ఫిట్ కోసం మా టీమ్ మీ సైట్‌కు వచ్చి ఖచ్చితమైన కొలతలు తీసుకుంటుంది.", "నాణ్యమైన మెటీరియల్స్‌తో మీ ఉత్పత్తులు అవసరాలకు అనుగుణంగా తయారు చేస్తాము.", "నిపుణులు జాగ్రత్తగా మరియు ఖచ్చితంగా కిటికీలు, తలుపులు అమర్చుతారు.", "ఇన్‌స్టాలేషన్ తర్వాత కూడా వారంటీ మరియు సర్వీస్ సహాయం అందిస్తాము."][index] })) },
  galleryContent: { ...galleryContent, sectionLabel: "గ్యాలరీ", heading: "మా పనితనం", filters: ["అన్నీ", "కిటికీలు", "తలుపులు"], view: "చూడండి", lightboxLabel: "చిత్రం", close: "మూసివేయండి", previous: "మునుపటి చిత్రం", next: "తదుపరి చిత్రం" },
  testimonialsContent: { ...testimonialsContent, sectionLabel: "కస్టమర్ అభిప్రాయాలు", heading: "మా కస్టమర్లు ఏమంటున్నారు", testimonials: testimonialsContent.testimonials.map((item, index) => ({ ...item, quote: ["సిరి ఎంటర్‌ప్రైజెస్ మా ఇంటిని UPVC కిటికీలతో అందంగా మార్చింది. శబ్దం చాలా తగ్గింది, సేవ కూడా చాలా బాగుంది.", "మా కొత్త ఇంటికి సిరి విండోస్ ఎంచుకున్నాము. అల్యూమినియం స్లైడింగ్ తలుపులు చాలా అందంగా ఉన్నాయి.", "ప్రారంభం నుండి ముగింపు వరకు ప్రొఫెషనల్ సర్వీస్. కొలతలు ఖచ్చితంగా తీసుకుని కిటికీలు బాగా అమర్చారు.", "అద్భుతమైన పనితనం మరియు మన్నికైన ఉత్పత్తులు. ఫ్రెంచ్ తలుపుల వల్ల మా లివింగ్ రూమ్‌లో సహజ కాంతి పెరిగింది.", "సిరి ఎంటర్‌ప్రైజెస్ మంచి నాణ్యతను సరైన ధరలో ఇచ్చింది. UPVC తలుపులు బలంగా మరియు ప్రీమియంగా ఉన్నాయి."][index] })) },
  ctaBannerContent: { heading: "మీ వీక్షణను అప్‌గ్రేడ్ చేయడానికి సిద్ధమా?", subheading: "మీ ఇల్లు లేదా కమర్షియల్ ప్రాజెక్ట్ కోసం ఉచిత కోట్ పొందండి. మా నిపుణులు సరైన సొల్యూషన్‌ను సూచిస్తారు.", cta: "మీ ఉచిత కోట్ పొందండి" },
  contactFormContent: { sectionLabel: "సంప్రదించండి", heading: "మీ ప్రాజెక్ట్‌ను ప్రారంభిద్దాం", productOptions: ["UPVC కిటికీలు", "అల్యూమినియం కిటికీలు", "UPVC తలుపులు", "అల్యూమినియం తలుపులు", "స్లైడింగ్ కిటికీలు & తలుపులు", "కేస్మెంట్ కిటికీలు", "ఫ్రెంచ్ తలుపులు", "కస్టమ్ సొల్యూషన్", "ఇతర / తెలియదు"] },
  contactLabels: { name: "పూర్తి పేరు *", phone: "ఫోన్ నంబర్ *", email: "ఇమెయిల్ (ఐచ్చికం)", product: "ఉత్పత్తి ఆసక్తి", productPlaceholder: "ఉత్పత్తిని ఎంచుకోండి", message: "మీ సందేశం / అవసరాలు *", sending: "పంపుతోంది...", success: "విజయవంతంగా పంపబడింది!", submit: "సందేశం పంపండి", error: "ఏదో తప్పు జరిగింది. దయచేసి మళ్లీ ప్రయత్నించండి లేదా నేరుగా కాల్ చేయండి.", getInTouch: "సంప్రదించండి", showroom: "మా షోరూమ్‌కు రండి", call: "మాకు కాల్ చేయండి", hours: "పని సమయాలు", emailTitle: "ఇమెయిల్", mapTitle: "సిరి ఎంటర్‌ప్రైజెస్ స్థానం - తనుకు, ఆంధ్రప్రదేశ్", requiredName: "పేరు అవసరం", requiredPhone: "ఫోన్ నంబర్ అవసరం", invalidPhone: "చెల్లుబాటు అయ్యే 10 అంకెల ఫోన్ నంబర్ ఇవ్వండి", invalidEmail: "చెల్లుబాటు అయ్యే ఇమెయిల్ ఇవ్వండి", requiredMessage: "సందేశం అవసరం" },
  footerContent: { description: "అందం కోసం డిజైన్ చేయబడిన, మన్నిక కోసం నిర్మించబడిన ప్రీమియం UPVC & అల్యూమినియం కిటికీలు మరియు తలుపులు. వెస్ట్ గోదావరి మరియు పరిసర ప్రాంతాల్లో సేవలు.", quickLinks: "త్వరిత లింకులు", products: "ఉత్పత్తులు", contact: "సంప్రదించండి", rights: "అన్ని హక్కులు రిజర్వ్ చేయబడ్డాయి." },
  whatsappMessage: "హాయ్ సిరి విండోస్, UPVC/అల్యూమినియం కిటికీలు మరియు తలుపుల గురించి మరిన్ని వివరాలు కావాలి.",
  languageLabel: "భాష",
};

const hindiContent: WebsiteContent = {
  ...englishContent,
  siteMeta: { ...siteMeta, tagline: "Windows, Better View.", description: "सिरी एंटरप्राइजेज़ के प्रीमियम UPVC और एल्युमिनियम विंडोज़ व डोर्स। तनुकु और आंध्र प्रदेश में घरों और व्यवसायों के लिए बेहतरीन कारीगरी, ऊर्जा दक्षता और टिकाऊपन." },
  navLinks: [
    { label: "होम", href: "#home" }, { label: "हमारे बारे में", href: "#about" }, { label: "उत्पाद", href: "#products" }, { label: "क्यों हम", href: "#why-us" }, { label: "प्रक्रिया", href: "#process" }, { label: "गैलरी", href: "#gallery" }, { label: "प्रशंसापत्र", href: "#testimonials" }, { label: "संपर्क", href: "#contact" },
  ],
  contactInfo: { ...contactInfo, address: "बस स्टैंड रोड, फ्लाईओवर ब्रिज, पायडिपर्रु - तनुकु, आंध्र प्रदेश, इंडिया", businessHours: "सोम - शनि: सुबह 9:00 - शाम 7:00 | रविवार: अपॉइंटमेंट पर" },
  heroContent: { headline: "Windows, Better View.", subheadline: "प्रीमियम UPVC और एल्युमिनियम विंडोज़ व डोर्स - सुंदरता के लिए डिज़ाइन, टिकाऊपन के लिए निर्मित.", ctaPrimary: "मुफ्त कोट पाएं", ctaSecondary: "हमारा काम देखें", badges: [{ icon: "Award", label: "प्रीमियम विंडोज़" }, { icon: "Shield", label: "टिकाऊपन और सुरक्षा" }, { icon: "Zap", label: "ऊर्जा दक्षता" }] },
  aboutContent: { sectionLabel: "हमारे बारे में", heading: "पहले दिन से बेहतर व्यू बनाते हुए", paragraphs: ["पायडिपर्रु-तनुकु स्थित सिरी एंटरप्राइजेज़ प्रीमियम UPVC और एल्युमिनियम विंडोज़ व डोर्स में एक भरोसेमंद नाम है। हम आधुनिक तकनीक और सावधानीपूर्ण कारीगरी से आपके स्पेस को बेहतर बनाते हैं.", "हम हर विंडो और डोर को आपके घर की बनावट के अनुसार तैयार करते हैं, ताकि सही फिट, बेहतर इंसुलेशन और लंबे समय तक सुंदरता मिले."], stats: [{ value: 10, suffix: "+", label: "वर्षों का अनुभव" }, { value: 500, suffix: "+", label: "पूरे प्रोजेक्ट" }, { value: 450, suffix: "+", label: "खुश ग्राहक" }, { value: 2000, suffix: "+", label: "इंस्टॉल उत्पाद" }] },
  productsContent: { ...productsContent, sectionLabel: "हमारे उत्पाद", heading: "बेहतर विंडोज़ और डोर्स", subheading: "आधुनिक जीवन के लिए बने प्रीमियम UPVC और एल्युमिनियम समाधान देखें.", learnMore: "और जानें", products: productsContent.products.map((product, index) => ({ ...product, name: ["UPVC विंडोज़", "एल्युमिनियम विंडोज़", "UPVC डोर्स", "एल्युमिनियम डोर्स", "स्लाइडिंग विंडोज़ और डोर्स", "केसमेंट विंडोज़", "फ्रेंच डोर्स", "कस्टम समाधान"][index], description: ["बेहतर थर्मल इंसुलेशन और मौसमरोधी सील के साथ पूरे साल आराम.", "आधुनिक लुक के लिए स्लीक एल्युमिनियम फ्रेम और पाउडर-कोटेड फिनिश.", "बेहतर सुरक्षा और इंसुलेशन के लिए मजबूत मल्टी-पॉइंट लॉकिंग डोर्स.", "अधिक उपयोग वाली जगहों के लिए टिकाऊ एल्युमिनियम डोर्स.", "बालकनी और पैटियो के लिए स्मूद ग्लाइड ट्रैक और बड़े ग्लास पैनल.", "अच्छे वेंटिलेशन और मल्टी-पॉइंट लॉकिंग वाली बाहर खुलने वाली विंडोज़.", "इंटीरियर में प्राकृतिक रोशनी लाने वाले सुंदर डबल-लीफ ग्लास डोर्स.", "आपकी वास्तुकला के अनुसार आर्च, बे विंडोज़, बाई-फोल्ड्स और अधिक डिज़ाइन."][index] })) },
  whyUsContent: { sectionLabel: "हमें क्यों चुनें", heading: "सिरी विंडोज़ का फायदा", features: whyUsContent.features.map((feature, index) => ({ ...feature, title: ["प्रीमियम क्वालिटी मटेरियल", "टिकाऊपन और सुरक्षा", "ऊर्जा दक्षता", "कस्टम फिट और इंस्टॉलेशन", "कम रखरखाव", "शोर में कमी"][index], description: ["लंबे प्रदर्शन के लिए सर्टिफाइड UPVC प्रोफाइल और एल्युमिनियम अलॉय का उपयोग.", "मल्टी-पॉइंट लॉकिंग और मौसमरोधी सील आपके घर को सुरक्षित रखते हैं.", "बेहतर इंसुलेशन गर्मी का असर कम कर बिजली बिल घटाने में मदद करता है.", "हर उत्पाद को सटीक नापकर प्रशिक्षित प्रोफेशनल्स इंस्टॉल करते हैं.", "UV-resistant और corrosion-proof मटेरियल कम देखभाल में सुंदर रहते हैं.", "सील्ड चैंबर और ग्लास विकल्प बाहरी शोर कम करते हैं."][index] })) },
  processContent: { sectionLabel: "हमारी प्रक्रिया", heading: "विचार से वास्तविकता तक", steps: processContent.steps.map((step, index) => ({ ...step, title: ["सलाह", "माप", "कस्टम निर्माण", "इंस्टॉलेशन", "बाद की सहायता"][index], description: ["अपनी जरूरत बताएं, हम सही विंडो और डोर समाधान चुनने में मदद करेंगे.", "हमारी टीम सही कस्टम फिट के लिए साइट पर जाकर सटीक माप लेती है.", "आपके उत्पाद गुणवत्ता वाले मटेरियल से आपकी जरूरत के अनुसार बनाए जाते हैं.", "प्रोफेशनल्स सावधानी और सटीकता से विंडोज़ और डोर्स इंस्टॉल करते हैं.", "इंस्टॉलेशन के बाद भी वारंटी और सर्विस सहायता देते हैं."][index] })) },
  galleryContent: { ...galleryContent, sectionLabel: "गैलरी", heading: "हमारी कारीगरी", filters: ["सभी", "विंडोज़", "डोर्स"], view: "देखें", lightboxLabel: "इमेज", close: "बंद करें", previous: "पिछली इमेज", next: "अगली इमेज" },
  testimonialsContent: { ...testimonialsContent, sectionLabel: "प्रशंसापत्र", heading: "हमारे ग्राहक क्या कहते हैं", testimonials: testimonialsContent.testimonials.map((item, index) => ({ ...item, quote: ["सिरी एंटरप्राइजेज़ ने हमारे घर को UPVC विंडोज़ से बदल दिया। शोर काफी कम हुआ और सेवा बहुत अच्छी रही.", "नई कंस्ट्रक्शन के लिए हमने सिरी विंडोज़ चुना। एल्युमिनियम स्लाइडिंग डोर्स सुंदर हैं और इंस्टॉलेशन बेहतरीन था.", "शुरू से अंत तक प्रोफेशनल सर्विस। टीम ने सही माप लिया और विंडोज़ बिल्कुल फिट हुईं.", "बेहतरीन कारीगरी और टिकाऊ उत्पाद। फ्रेंच डोर्स से हमारे लिविंग रूम में बहुत प्राकृतिक रोशनी आती है.", "सिरी एंटरप्राइजेज़ ने सही कीमत पर अच्छी क्वालिटी दी। UPVC डोर्स मजबूत और प्रीमियम दिखते हैं."][index] })) },
  ctaBannerContent: { heading: "अपना व्यू अपग्रेड करने के लिए तैयार हैं?", subheading: "अपने घर या कमर्शियल प्रोजेक्ट के लिए मुफ्त कोट पाएं। हमारे विशेषज्ञ सही समाधान चुनने में मदद करेंगे.", cta: "अपना मुफ्त कोट पाएं" },
  contactFormContent: { sectionLabel: "संपर्क करें", heading: "अपना प्रोजेक्ट शुरू करें", productOptions: ["UPVC विंडोज़", "एल्युमिनियम विंडोज़", "UPVC डोर्स", "एल्युमिनियम डोर्स", "स्लाइडिंग विंडोज़ और डोर्स", "केसमेंट विंडोज़", "फ्रेंच डोर्स", "कस्टम समाधान", "अन्य / निश्चित नहीं"] },
  contactLabels: { name: "पूरा नाम *", phone: "फोन नंबर *", email: "ईमेल (वैकल्पिक)", product: "उत्पाद रुचि", productPlaceholder: "उत्पाद चुनें", message: "आपका संदेश / जरूरतें *", sending: "भेजा जा रहा है...", success: "सफलतापूर्वक भेजा गया!", submit: "संदेश भेजें", error: "कुछ गलत हुआ। कृपया फिर कोशिश करें या हमें सीधे कॉल करें.", getInTouch: "संपर्क में रहें", showroom: "हमारे शोरूम आएं", call: "हमें कॉल करें", hours: "व्यावसायिक समय", emailTitle: "ईमेल", mapTitle: "सिरी एंटरप्राइजेज़ लोकेशन - तनुकु, आंध्र प्रदेश", requiredName: "नाम जरूरी है", requiredPhone: "फोन नंबर जरूरी है", invalidPhone: "मान्य 10 अंकों का फोन नंबर दर्ज करें", invalidEmail: "मान्य ईमेल पता दर्ज करें", requiredMessage: "संदेश जरूरी है" },
  footerContent: { description: "सुंदरता के लिए डिज़ाइन और टिकाऊपन के लिए निर्मित प्रीमियम UPVC व एल्युमिनियम विंडोज़ और डोर्स। वेस्ट गोदावरी और आसपास सेवा.", quickLinks: "क्विक लिंक्स", products: "उत्पाद", contact: "संपर्क करें", rights: "सर्वाधिकार सुरक्षित." },
  whatsappMessage: "हाय सिरी विंडोज़, मुझे UPVC/एल्युमिनियम विंडोज़ और डोर्स के बारे में जानकारी चाहिए.",
  languageLabel: "भाषा",
};

export const contentByLanguage: Record<LanguageCode, WebsiteContent> = {
  en: englishContent,
  te: teluguContent,
  hi: hindiContent,
};
