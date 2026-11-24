"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import * as LucideIcons from "lucide-react";
import {
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageCircle,
  Maximize2,
  CalendarCheck,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import { useContent, useLanguage } from "@/components/providers/LanguageProvider";
import { prefersReducedMotion, ANIM } from "@/lib/animations";
import type { Product } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger);

// Rich product specifications and features for the interactive "Learn More" modal
const productSpecs: Record<
  string,
  {
    badge: { en: string; te: string; hi: string };
    suitableFor: { en: string; te: string; hi: string };
    warranty: { en: string; te: string; hi: string };
    specs: {
      title: { en: string; te: string; hi: string };
      desc: { en: string; te: string; hi: string };
    }[];
  }
> = {
  "upvc-windows": {
    badge: { en: "UPVC European Series", te: "UPVC యూరోపియన్ సిరీస్", hi: "UPVC यूरोपियन सीरीज" },
    suitableFor: {
      en: "Bedrooms, living rooms, luxury villas & coastal apartments",
      te: "బెడ్‌రూమ్‌లు, లివింగ్ రూమ్‌లు, విల్లాలు & అపార్ట్‌మెంట్లు",
      hi: "बेडरूम, लिविंग रूम, लक्जरी विला और तटीय अपार्टमेंट",
    },
    warranty: {
      en: "10 Years Profile Warranty | 5 Years Hardware",
      te: "10 సం. ప్రొఫైల్ వారంటీ | 5 సం. హార్డ్‌వేర్",
      hi: "10 साल प्रोफाइल वारंटी | 5 साल हार्डवेयर",
    },
    specs: [
      {
        title: { en: "Soundproof Acoustic Glass", te: "సౌండ్‌ప్రూఫ్ అకౌస్టిక్ గ్లాస్", hi: "साउंडप्रूफ ग्लास" },
        desc: { en: "Up to 40dB noise reduction with DGU double glazing", te: "DGU డబుల్ గ్లేజింగ్‌తో 40dB వరకు శబ్ద నిరోధం", hi: "DGU डबल ग्लेज़िंग के साथ 40dB तक शोर में कमी" },
      },
      {
        title: { en: "Monsoon Cyclone Sealing", te: "తుఫాను & వర్షపు రక్షణ", hi: "तूफान व बारिश सीलिंग" },
        desc: { en: "EPDM weather seals prevent water ingress and dust leaks", te: "నీరు మరియు దుమ్ము లోపలికి రాకుండా EPDM సీల్స్", hi: "पानी और धूल रोकने के लिए ईपीडीएम वेदर सील" },
      },
      {
        title: { en: "Multi-Point Security", te: "మల్టీ-పాయింట్ సెక్యూరిటీ", hi: "मल्टी-पॉइंट सुरक्षा लॉक" },
        desc: { en: "European espagnolette locking at multiple points", te: "యూరోపియన్ ఎస్పాగ్నోలెట్ మల్టీ-పాయింట్ లాకింగ్", hi: "मल्टी-पॉइंट यूरोपीय सुरक्षा लॉकिंग" },
      },
      {
        title: { en: "Thermal Insulation", te: "థర్మల్ ఇన్సులేషన్", hi: "थर्मल इंसुलेशन" },
        desc: { en: "Multi-chamber design reduces heat transfer and saves power", te: "వేడిని తగ్గించి కరెంట్ బిల్లులను ఆదా చేస్తుంది", hi: "गर्मी कम कर बिजली बिलों की बचत करता है" },
      },
    ],
  },
  "aluminium-windows": {
    badge: { en: "Aluminium Architectural Series", te: "అల్యూమినియం ఆర్కిటెక్చరల్ సిరీస్", hi: "एल्युमिनियम आर्किटेक्चरल सीरीज" },
    suitableFor: {
      en: "Modern facades, high-rise apartments, offices & luxury residences",
      te: "ఆధునిక హోమ్స్, అపార్ట్‌మెంట్లు & కార్పొరేట్ ఆఫీసులు",
      hi: "आधुनिक घर, अपार्टमेंट, ऑफिस और लक्जरी प्रोजेक्ट",
    },
    warranty: {
      en: "10 Years Coating & Structural Warranty",
      te: "10 సంవత్సరాల కోటింగ్ & నిర్మాణ వారంటీ",
      hi: "10 साल की कोटिंग और फ्रेम वारंटी",
    },
    specs: [
      {
        title: { en: "Ultra-Slim Sightlines", te: "స్లీక్ అల్ట్రా-స్లిమ్ ఫ్రేమ్స్", hi: "अल्ट्रा-स्लिम फ्रेम" },
        desc: { en: "Minimal frames for maximum natural light and panoramic view", te: "ఎక్కువ వెలుతురు మరియు విశాలమైన వ్యూ కోసం సన్నని ఫ్రేమ్స్", hi: "अधिक प्राकृतिक रोशनी और पैनोरमिक व्यू" },
      },
      {
        title: { en: "High Wind Tolerance", te: "అధిక గాలి ఒత్తిడి నిరోధకత", hi: "उच्च हवा सहने की क्षमता" },
        desc: { en: "Engineered to withstand coastal gales up to 2500 Pascals", te: "2500 పాస్కల్స్ వరకు తీవ్రమైన ఈదురుగాలులను తట్టుకుంటుంది", hi: "2500 पास्कल तक तेज हवाओं को झेलने में सक्षम" },
      },
      {
        title: { en: "AkzoNobel Powder Finish", te: "ప్రీమియం పౌడర్ కోటింగ్", hi: "प्रीमियम पाउडर कोटिंग" },
        desc: { en: "Scratch-resistant anodized and textured matte finishes", te: "స్క్రాచ్-రెసిస్టెంట్ మ్యాట్ & వుడెన్ ఫినిషెస్", hi: "स्क्रैच-प्रतिरोधी मैट और वुडन फिनिश" },
      },
      {
        title: { en: "Precision Heavy Hardware", te: "హెవీ-డ్యూటీ హార్డ్‌వేర్", hi: "हैवी-ड्यूटी हार्डवेयर" },
        desc: { en: "Stainless steel friction hinges and smooth operating handles", te: "స్టెయిన్‌లెస్ స్టీల్ హింజెస్ మరియు స్మూత్ హ్యాండిల్స్", hi: "स्टेनलेस स्टील हिंज और स्मूद हैंडल" },
      },
    ],
  },
  "upvc-doors": {
    badge: { en: "UPVC Security Doors", te: "UPVC సెక్యూరిటీ డోర్స్", hi: "UPVC सुरक्षा डोर्स" },
    suitableFor: {
      en: "Main doors, terrace entries, master bedrooms & patio passages",
      te: "ప్రధాన ప్రవేశ ద్వారాలు, బెడ్‌రూమ్‌లు & బాల్కనీ డోర్స్",
      hi: "मुख्य दरवाजे, बेडरूम, बालकनी और छत के रास्ते",
    },
    warranty: {
      en: "10 Years Profile | 5 Years Lock Mechanism",
      te: "10 సం. ప్రొఫైల్ | 5 సం. లాక్ మెకానిజం",
      hi: "10 साल प्रोफाइल | 5 साल लॉक मैकेनिज्म",
    },
    specs: [
      {
        title: { en: "Steel Core Reinforcement", te: "స్టీల్ కోర్ రీఇన్‌ఫోర్స్‌మెంట్", hi: "स्टील कोर मजबूती" },
        desc: { en: "Heavy galvanized steel core prevents bending and forced entry", te: "గాల్వనైజ్డ్ స్టీల్ కోర్ అధిక భద్రతను అందిస్తుంది", hi: "गैल्वनाइज्ड स्टील कोर जबरन प्रवेश रोकता है" },
      },
      {
        title: { en: "Multi-Point Shoot Bolts", te: "మల్టీ-పాయింట్ షూట్ బోల్ట్స్", hi: "मल्टी-पॉइंट शूट बोल्ट्स" },
        desc: { en: "Locks securely at top, middle, and bottom simultaneously", te: "ఒకేసారి పైన, మధ్యలో మరియు కింద లాక్ అవుతుంది", hi: "ऊपर, मध्य और नीचे एक साथ मजबूत लॉक" },
      },
      {
        title: { en: "Zero Termite & Rust", te: "చెదలు & తుప్పు పట్టదు", hi: "दीमक व जंग से मुक्त" },
        desc: { en: "100% moisture, termite and corrosion proof material", te: "చెదలు పట్టని, తుప్పు లేని 100% నమ్మకమైన మెటీరియల్", hi: "दीमक और जंग से 100% सुरक्षित सामग्री" },
      },
      {
        title: { en: "Acoustic Sealing", te: "అకౌస్టిక్ సీలింగ్", hi: "अकॉस्टिक सीलिंग" },
        desc: { en: "Dual compression gaskets block street sound and dust", te: "రోడ్డు శబ్దాలు మరియు దుమ్ము లోపలికి రాకుండా నిరోధిస్తుంది", hi: "सड़क के शोर और धूल को पूरी तरह रोकता है" },
      },
    ],
  },
  "aluminium-doors": {
    badge: { en: "Aluminium Heavy Duty", te: "అల్యూమినియం హెవీ డ్యూటీ", hi: "एल्युमिनियम हैवी ड्यूटी" },
    suitableFor: {
      en: "Grand villa entrances, commercial showrooms, offices & banquet halls",
      te: "విల్లా ప్రవేశ ద్వారాలు, షోరూమ్‌లు, ఆఫీసులు & బాంక్వెట్ హాళ్ళు",
      hi: "विला प्रवेश द्वार, शोरूम, ऑफिस और बैंक्वेट हॉल",
    },
    warranty: {
      en: "10 Years Frame & Surface Finish Warranty",
      te: "10 సంవత్సరాల ఫ్రేమ్ & ఫినిషింగ్ వారంటీ",
      hi: "10 साल की फ्रेम और कोटिंग वारंटी",
    },
    specs: [
      {
        title: { en: "Commercial Grade Alloy", te: "కమర్షియల్ గ్రేడ్ అల్యూమినియం", hi: "कमर्शियल ग्रेड अलॉय" },
        desc: { en: "Built to endure high foot-traffic and heavy daily usage", te: "అధిక రద్దీని తట్టుకునే కమర్షియల్ గ్రేడ్ బలం", hi: "दैनिक भारी उपयोग और भीड़ को आसानी से झेलने वाला" },
      },
      {
        title: { en: "Toughened Safety Glass", te: "టఫ్ఫెండ్ సేఫ్టీ గ్లాస్", hi: "टफन्ड सुरक्षा ग्लास" },
        desc: { en: "Impact-resistant 10mm-12mm toughened architectural glass", te: "10mm-12mm బలమైన ఇంపాక్ట్ రెసిస్టెంట్ గ్లాస్", hi: "10mm-12mm मजबूत इम्पैक्ट-रेसिस्टेंट ग्लास" },
      },
      {
        title: { en: "Floor Spring Mechanisms", te: "యూరోపియన్ ఫ్లోర్ స్ప్రింగ్స్", hi: "यूरोपीय फ्लोर स्प्रिंग्स" },
        desc: { en: "Concealed smooth closing with hold-open at 90 degrees", te: "స్మూత్ క్లోజింగ్ & 90 డిగ్రీల వద్ద హోల్డ్-ఓపెన్ ఫీచర్", hi: "स्मूद क्लोजिंग और 90 डिग्री होल्ड-ओपन" },
      },
      {
        title: { en: "Luxury Designer Pulls", te: "లగ్జరీ డిజైనర్ హ్యాండిల్స్", hi: "लक्जरी आधुनिक हैंडल" },
        desc: { en: "Full-height stainless steel and brushed brass handles", te: "ఫుల్-హైట్ స్టెయిన్‌లెస్ స్టీల్ మరియు బ్రాస్ హ్యాండిల్స్", hi: "फुल-हाइट स्टेनलेस स्टील और ब्रास हैंडल" },
      },
    ],
  },
  "sliding-windows-doors": {
    badge: { en: "Sliding Systems", te: "స్లైడింగ్ సిస్టమ్స్", hi: "स्लाइडिंग सिस्टम्स" },
    suitableFor: {
      en: "Balconies, sit-outs, wide verandahs & open-concept living rooms",
      te: "బాల్కనీలు, సిట్-అవుట్లు, వరండాలు & లివింగ్ రూమ్‌లు",
      hi: "बालकनी, सिट-आउट, बरामदा और खुले लिविंग रूम",
    },
    warranty: {
      en: "10 Years Profile | 5 Years Roller & Tracks",
      te: "10 సం. ప్రొఫైల్ | 5 సం. రోలర్స్ & ట్రాక్స్",
      hi: "10 साल प्रोफाइल | 5 साल रोलर्स और ट्रैक",
    },
    specs: [
      {
        title: { en: "2, 3 & 4-Track Options", te: "2, 3 & 4-ట్రాక్ ఆప్షన్లు", hi: "2, 3 और 4-ट्रैक विकल्प" },
        desc: { en: "Flexible multi-track designs with dedicated SS mosquito mesh", te: "దోమల నివారణ కోసం ప్రత్యేక స్టెయిన్‌లెస్ స్టీల్ మెష్ ట్రాక్", hi: "मच्छर सुरक्षा के लिए समर्पित एसएस जाली ट्रैक" },
      },
      {
        title: { en: "Silent Glide Rollers", te: "సైలెంట్ గ్లైడ్ రోలర్స్", hi: "साइलेंट ग्लाइड रोलर्स" },
        desc: { en: "Heavy-duty nylon & brass ball-bearings for finger-touch glide", te: "వేలి స్పర్శతో సులభంగా కదిలే నైలాన్/బ్రాస్ బేరింగ్ రోలర్స్", hi: "उंगली के हल्के स्पर्श से सरकने वाले स्मूद रोलर्स" },
      },
      {
        title: { en: "Anti-Lift Interlock", te: "యాంటీ-లిఫ్ట్ ఇంటర్‌లాక్", hi: "एंटी-लिफ्ट इंटरलॉक" },
        desc: { en: "Prevents panel removal from outside for enhanced security", te: "బయటి నుంచి డోర్ తీయకుండా యాంటీ-లిఫ్ట్ భద్రత", hi: "बाहर से पैनल को निकालने से रोकने वाला मजबूत लॉक" },
      },
      {
        title: { en: "Panoramic Glass Width", te: "విశాలమైన పనోరమిక్ వ్యూ", hi: "पैनोरमिक ग्लास व्यू" },
        desc: { en: "Expansive glass panes bring outdoor scenery inside", te: "బయటి అందమైన ప్రకృతి దృశ్యాలను ఇంట్లోకి తెచ్చే పెద్ద గ్లాస్", hi: "सुंदर नजारों को अंदर लाने वाले बड़े ग्लास पैनल" },
      },
    ],
  },
  "casement-windows": {
    badge: { en: "Casement Series", te: "కేస్మెంట్ సిరీస్", hi: "केसमेंट सीरीज" },
    suitableFor: {
      en: "Bedrooms, modern kitchens, study rooms & exterior facades",
      te: "బెడ్‌రూమ్‌లు, కిచెన్, స్టడీ రూమ్‌లు & ఫ్రంట్ ఎలివేషన్",
      hi: "बेडरूम, किचन, स्टडी रूम और सामने का एलिवेशन",
    },
    warranty: {
      en: "10 Years Profile & Compression Seals",
      te: "10 సంవత్సరాల ప్రొఫైల్ & సీల్స్ వారంటీ",
      hi: "10 साल की प्रोफाइल और सील वारंटी",
    },
    specs: [
      {
        title: { en: "Full 90° Ventilation", te: "100% గాలి ప్రసరణ", hi: "100% ताजी हवा वेंटिलेशन" },
        desc: { en: "Opens full 90 degrees outward to capture cooling cross-breezes", te: "స్వచ్ఛమైన గాలి కోసం పూర్తి 90 డిగ్రీలు బయటకు తెరుచుకుంటుంది", hi: "ठंडी हवा के लिए पूरा 90 डिग्री बाहर खुलने वाला" },
      },
      {
        title: { en: "High-Grip Friction Stays", te: "హై-గ్రిప్ ఫ్రిక్షన్ స్టేస్", hi: "हाई-ग्रिप फ्रिक्शन स्टे" },
        desc: { en: "Stays held firmly in any open position against wind gusts", te: "ఈదురుగాలుల్లోనూ కోరుకున్న స్థానంలో నిలకడగా ఉంటుంది", hi: "हवा के झोंकों में भी किसी भी स्थिति में स्थिर रहता है" },
      },
      {
        title: { en: "Double EPDM Compression", te: "డబుల్ EPDM సీలింగ్", hi: "डबल ईपीडीएम सील" },
        desc: { en: "Creates airtight seal blocking rainstorms, insects & noise", te: "తుఫాను వర్షం, కీటకాలు మరియు శబ్దాలను పూర్తిగా అడ్డుకుంటుంది", hi: "बारिश, कीड़े और शोर को रोकने वाली एयरटाइट सील" },
      },
      {
        title: { en: "Inside-Out Cleaning", te: "సులభమైన క్లీనింగ్", hi: "आसान सफाई" },
        desc: { en: "Safe cleaning of outside glass directly from inside your room", te: "గది లోపల నుంచే బయటి గ్లాస్‌ను సులభంగా శుభ్రం చేసుకోవచ్చు", hi: "कमरे के अंदर से ही बाहर के ग्लास की आसान सफाई" },
      },
    ],
  },
  "french-doors": {
    badge: { en: "Classic French Series", te: "క్లాసిక్ ఫ్రెంచ్ సిరీస్", hi: "फ्रेंच सीरीज" },
    suitableFor: {
      en: "Garden exits, master terraces, dining areas & banquet partitions",
      te: "గార్డెన్ డోర్స్, టెర్రస్, డైనింగ్ ఏరియా & హాల్స్",
      hi: "गार्डन, मास्टर छत, डाइनिंग एरिया और बैंक्वेट हॉल",
    },
    warranty: {
      en: "10 Years Profile & Glass Seal Warranty",
      te: "10 సంవత్సరాల ప్రొఫైల్ & గ్లాస్ వారంటీ",
      hi: "10 साल की प्रोफाइल और ग्लास सील वारंटी",
    },
    specs: [
      {
        title: { en: "Double Leaf Elegance", te: "డబుల్ లీఫ్ రాయల్ లుక్", hi: "डबल लीफ रॉयल लुक" },
        desc: { en: "Symmetrical twin-door design adding timeless architectural charm", te: "సహజమైన అందాన్ని మరియు రాయల్ లుక్‌ను ఇచ్చే డబుల్ డోర్స్", hi: "सदाबहार आकर्षण जोड़ने वाला सुंदर ट्विन-डोर डिज़ाइन" },
      },
      {
        title: { en: "Full-Height Natural Light", te: "సమృద్ధిగా సహజ వెలుతురు", hi: "भरपूर प्राकृतिक रोशनी" },
        desc: { en: "Floor-to-ceiling glass panels illuminate large living spaces", te: "గదులను వెలుతురుతో నింపే పొడవైన పూర్తి గ్లాస్ ప్యానెల్స్", hi: "कमरे को रोशनी से भरने वाले फर्श से छत तक ग्लास पैनल" },
      },
      {
        title: { en: "Master-Slave Shoot Bolts", te: "మాస్టర్-స్లేవ్ షూట్ బోల్ట్స్", hi: "मास्टर-स्लेव शूट बोल्ट" },
        desc: { en: "Heavy top and bottom locking pins provide firm rigidity", te: "పైన మరియు కింద గట్టిగా బిగుసుకునే హెవీ లాకింగ్ పిన్స్", hi: "ऊपर और नीचे मजबूत लॉकिंग पिन पूरी सुरक्षा देते हैं" },
      },
      {
        title: { en: "Georgian Bar Options", te: "జార్జియన్ బార్ గ్రిడ్స్", hi: "जॉर्जियन बार ग्रिड विकल्प" },
        desc: { en: "Optional internal grids, frosted borders or tinted glass", te: "అంతర్గత గ్రిడ్లు, ఫ్రాస్టెడ్ లేదా టింటెడ్ గ్లాస్ ఆప్షన్లు", hi: "आंतरिक ग्रिड, फ्रॉस्टेड या टिंटेड ग्लास के विकल्प" },
      },
    ],
  },
  "custom-solutions": {
    badge: { en: "Custom Engineering", te: "కస్టమ్ ఇంజనీరింగ్", hi: "कस्टम इंजीनियरिंग" },
    suitableFor: {
      en: "Architectural residences, penthouses, hotels & bespoke spaces",
      te: "డిజైనర్ విల్లాలు, పెంట్‌హౌస్‌లు, లగ్జరీ హోటళ్ళు",
      hi: "आर्किटेक्चरल विला, पेंटहाउस, होटल और खास प्रोजेक्ट",
    },
    warranty: {
      en: "10 Years Structural & Fabrication Warranty",
      te: "10 సంవత్సరాల కస్టమ్ నిర్మాణ వారంటీ",
      hi: "10 साल की संरचनात्मक और निर्माण वारंटी",
    },
    specs: [
      {
        title: { en: "Arches & Curved Profiles", te: "ఆర్చ్‌లు & కర్వ్‌డ్ ప్రొఫైల్స్", hi: "आर्च व घुमावदार प्रोफाइल" },
        desc: { en: "Precision bended profiles for semicircular and gothic arches", te: "ఖచ్చితమైన ఆర్చ్‌లు మరియు వంపు తిరిగిన ప్రత్యేక డిజైన్లు", hi: "सटीक रूप से मुड़ी हुई आर्च और खास आकृतियां" },
      },
      {
        title: { en: "Bay & Bow Windows", te: "బే & బో విండోస్", hi: "बे और बो विंडोज़" },
        desc: { en: "Multi-angle projecting windows for cozy window seating", te: "విండో సీటింగ్ కోసం బయటకు పొడుచుకు వచ్చే అందమైన బే విండోస్", hi: "बैठने की सुंदर जगह बनाने वाली प्रोजेक्टिंग विंडोज़" },
      },
      {
        title: { en: "Bi-Fold Glass Walls", te: "బై-ఫోల్డ్ గ్లాస్ వాల్స్", hi: "बाई-फोल्ड ग्लास दीवारें" },
        desc: { en: "Concertina folding doors that open entire room walls to outdoors", te: "గది గోడను పూర్తిగా తెరిచే ఆధునిక ఫోల్డింగ్ డోర్స్", hi: "कमरे की पूरी दीवार को बाहर खोलने वाले फोल्डिंग डोर्स" },
      },
      {
        title: { en: "Bespoke RAL Colors", te: "ప్రత్యేక రంగుల ఎంపిక", hi: "कस्टम रंगों का चयन" },
        desc: { en: "Match any interior theme: Golden Oak, Walnut, Slate Grey & more", te: "గోల్డెన్ ఓక్, వాల్‌నట్, చార్‌కోల్ గ్రే మొదలైన ప్రీమియం కలర్స్", hi: "गोल्डन ओक, वॉलनट, स्लेट ग्रे और कस्टम रंग" },
      },
    ],
  },
};

const defaultSpec = {
  badge: { en: "Premium Architecture", te: "ప్రీమియం ఆర్కిటెక్చర్", hi: "प्रीमियम आर्किटेक्चर" },
  suitableFor: {
    en: "Residential homes, commercial villas & modern renovation projects",
    te: "గృహాలు, కమర్షియల్ విల్లాలు & ఆధునిక ప్రాజెక్టులు",
    hi: "घर, कमर्शियल विला और नवीनीकरण प्रोजेक्ट",
  },
  warranty: {
    en: "10 Years Quality & Workmanship Warranty",
    te: "10 సంవత్సరాల క్వాలిటీ & పనితనపు వారంటీ",
    hi: "10 साल की गुणवत्ता और कारीगरी वारंटी",
  },
  specs: [
    {
      title: { en: "Superior Weather Resistance", te: "వాతావరణ రక్షణ", hi: "मौसम से सुरक्षा" },
      desc: { en: "Engineered to withstand heavy rain, coastal salt & high UV sunlight", te: "భారీ వర్షం, ఎండ మరియు తేమను తట్టుకుంటుంది", hi: "भारी बारिश, धूप और नमी से सुरक्षित" },
    },
    {
      title: { en: "Energy & Thermal Insulation", te: "థర్మల్ ఇన్సులేషన్", hi: "थर्मल इंसुलेशन" },
      desc: { en: "Tight multi-chamber profile seals reduce room temperature & power bills", te: "గది ఉష్ణోగ్రతను అదుపులో ఉంచి విద్యుత్ ఆదా చేస్తుంది", hi: "कमरे के तापमान को नियंत्रित कर बिजली की बचत" },
    },
    {
      title: { en: "Soundproof Acoustic Glass", te: "సౌండ్‌ప్రూఫ్ గ్లాస్", hi: "साउंडप्रूफ ग्लास" },
      desc: { en: "Acoustic sealing keeps disturbing exterior traffic noise outside", te: "బయటి ట్రాఫిక్ శబ్దాలు లోపలికి రాకుండా ప్రశాంతతనిస్తుంది", hi: "सड़क के शोर को बाहर रखकर शांति प्रदान करता है" },
    },
    {
      title: { en: "Heavy-Duty Multi-Locking", te: "మల్టీ-పాయింట్ లాకింగ్", hi: "मल्टी-पॉइंट लॉकिंग" },
      desc: { en: "High-grade certified locking mechanisms for maximum family safety", te: "కుటుంబ భద్రత కోసం ధృవీకరించబడిన లాకింగ్ మెకానిజమ్స్", hi: "सुरक्षा के लिए उच्च श्रेणी का प्रमाणित लॉकिंग सिस्टम" },
    },
  ],
};

const modalLabels = {
  keyFeatures: {
    en: "Key Specifications & Features",
    te: "ముఖ్య లక్షణాలు & వివరాలు",
    hi: "मुख्य विशेषताएं और विवरण",
  },
  suitableFor: {
    en: "Ideal For",
    te: "వీటికి అనువైనది",
    hi: "के लिए उपयुक्त",
  },
  warranty: {
    en: "Official Warranty",
    te: "అధికారిక వారంటీ",
    hi: "आधिकारिक वारंटी",
  },
  requestQuote: {
    en: "Get Free Site Quote",
    te: "ఉచిత కొటేషన్ పొందండి",
    hi: "फ్రీ साइट कोट प्राप्त करें",
  },
  whatsappEnquiry: {
    en: "Enquire on WhatsApp",
    te: "వాట్సాప్‌లో సంప్రదించండి",
    hi: "व्हाट्सएप पर संपर्क करें",
  },
  close: {
    en: "Close",
    te: "మూసివేయి",
    hi: "बंद करें",
  },
  viewDetails: {
    en: "Specs & Quote",
    te: "వివరాలు & కొటేషన్",
    hi: "विवरण और कोटेशन",
  },
};

export default function ProductsSection() {
  const { productsContent, contactInfo } = useContent();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!selectedProduct) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedProduct(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  useGSAP(
    () => {
      if (!gridRef.current || prefersReducedMotion()) return;

      const cards = gridRef.current.querySelectorAll(".product-card");
      gsap.fromTo(
        cards,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: ANIM.ease,
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    },
    { scope: gridRef }
  );

  const handleQuoteClick = (productName: string) => {
    setSelectedProduct(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("siri-select-product", { detail: { productName } })
      );
    }
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getWhatsAppUrl = (productName: string) => {
    const rawNumber = contactInfo?.whatsappNumber || "917207458197";
    const cleanNumber = rawNumber.replace(/[^0-9]/g, "");
    const msg = `Hi Siri Windows, I would like to learn more and get a quote for *${productName}*. Please share specifications, pricing and site measurement details.`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
  };

  const activeSpec = selectedProduct ? productSpecs[selectedProduct.slug] || defaultSpec : null;

  return (
    <section id="products" className="section-padding bg-off-white">
      <div className="container-wide">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <Reveal>
            <p className="section-label">{productsContent.sectionLabel}</p>
            <h2
              style={{
                fontSize: "var(--text-h1)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {productsContent.heading}
            </h2>
            <p
              className="text-slate-600 mt-4"
              style={{ fontSize: "var(--text-body)" }}
            >
              {productsContent.subheading}
            </p>
          </Reveal>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6"
        >
          {productsContent.products.map((product) => {
            // Dynamically get the Lucide icon
            const IconComponent =
              (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
                product.icon
              ] || LucideIcons.Box;

            return (
              <div
                key={product.slug}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedProduct(product);
                  }
                }}
                className="product-card group relative bg-white rounded-[var(--radius-md)] overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-52 overflow-hidden shrink-0">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-navy-600">
                        <IconComponent className="w-5 h-5" />
                      </span>
                      <h3
                        className="font-semibold text-navy-950 group-hover:text-gold-600 transition-colors"
                        style={{
                          fontSize: "var(--text-h4)",
                          fontFamily: "var(--font-heading)",
                        }}
                      >
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer - Always visible on mobile & desktop */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gold-600 group-hover:text-gold-700 flex items-center gap-1.5 transition-colors">
                      {productsContent.learnMore}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium group-hover:text-navy-900 transition-colors">
                      {modalLabels.viewDetails[language] || modalLabels.viewDetails.en}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Product Details Modal */}
      {selectedProduct && activeSpec && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-navy-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Hero Image */}
            <div className="relative h-56 sm:h-64 w-full shrink-0 overflow-hidden bg-navy-950">
              <Image
                src={selectedProduct.image}
                alt={selectedProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 680px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-black/25" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label={modalLabels.close[language] || modalLabels.close.en}
                className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Product Title & Badge Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="inline-block text-[11px] font-bold tracking-wider uppercase bg-gold-500/90 text-navy-950 px-2.5 py-1 rounded-md mb-2 shadow-sm">
                  {activeSpec.badge[language] || activeSpec.badge.en}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                  {selectedProduct.name}
                </h3>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Description */}
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Specifications Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  {modalLabels.keyFeatures[language] || modalLabels.keyFeatures.en}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSpec.specs.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-gold-300 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-navy-950">
                            {item.title[language] || item.title.en}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {item.desc[language] || item.desc.en}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suitable For & Warranty Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Maximize2 className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                      {modalLabels.suitableFor[language] || modalLabels.suitableFor.en}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeSpec.suitableFor[language] || activeSpec.suitableFor.en}
                  </p>
                </div>

                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      {modalLabels.warranty[language] || modalLabels.warranty.en}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeSpec.warranty[language] || activeSpec.warranty.en}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 shrink-0">
              {/* WhatsApp Enquiry Button */}
              <a
                href={getWhatsAppUrl(selectedProduct.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                {modalLabels.whatsappEnquiry[language] || modalLabels.whatsappEnquiry.en}
              </a>

              {/* Free Quote Button */}
              <button
                type="button"
                onClick={() => handleQuoteClick(selectedProduct.name)}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-gold-400" />
                {modalLabels.requestQuote[language] || modalLabels.requestQuote.en}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
