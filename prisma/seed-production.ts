/**
 * Grand Food Fest 2026 — Production Database Bootstrap
 * 
 * Sets up the authoritative event structure, festival days, administrator credentials,
 * official vendors across stadium zones, and award categories with ZERO synthetic
 * attendee passes or fake ratings.
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { createISTMidnightDate } from "../src/lib/date-utils";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

const foodVendorTemplates = [
  // Biryani & Pulao
  { name: "Spice Route", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Legendary slow-dum Zafrani Mutton Biryani steeped in royal Nizami aromatics." },
  { name: "Hyderabad House", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Signature fragrant Basmati Biryani paired with rich Mirchi ka Salan." },
  { name: "Shadab Express", category: "Biryani & Pulao", cuisine: "Nizami", desc: "Old City heritage dum biryani served with spicy Bagara Baingan." },
  { name: "Nawab's Kitchen", category: "Biryani & Pulao", cuisine: "Mughlai", desc: "Potli Biryani layered with tender spiced lamb and saffron caramelized onions." },
  { name: "Rayalaseema Ruchulu", category: "Biryani & Pulao", cuisine: "Andhra", desc: "Fiery spicy country chicken Gongura Biryani loaded with regional chilies." },
  { name: "Bawarchi Legacy", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Traditional coal-dum chicken biryani with classic spice blend." },
  { name: "Deccan Darbar", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Royal Shahi mutton biryani with aromatic saffron ghee." },
  { name: "Dakhni Flavors", category: "Biryani & Pulao", cuisine: "Deccani", desc: "Subtle Deccani herbs, tender meat cuts and slow roasted whole spices." },
  { name: "Kolkata Biryani Co.", category: "Biryani & Pulao", cuisine: "Bengali", desc: "Aromatic light biryani with golden spiced potato and boiled egg." },
  { name: "Malabar Dum House", category: "Biryani & Pulao", cuisine: "Kerala", desc: "Khaima rice dum biryani with Kerala spices and crisp fried shallots." },
  { name: "Sufi Biryani Lounge", category: "Biryani & Pulao", cuisine: "Awadhi", desc: "Delicate Lucknowi yakhni biryani finished with rose water essence." },
  { name: "Banjara Pulao Stop", category: "Biryani & Pulao", cuisine: "Telangana", desc: "Rustic country-style mutton pulao spiced with stone-ground masalas." },

  // Kebabs & Tandoor
  { name: "Tandoor Theory", category: "Kebabs & Tandoor", cuisine: "North Indian", desc: "Smoked Bhatti Murgh, tender Galouti kebabs and charcoal-blistered naans." },
  { name: "Charcoal & Clay", category: "Kebabs & Tandoor", cuisine: "Mughlai", desc: "Melt-in-mouth Kakori skewers and succulent Malai Seekh kebabs." },
  { name: "Peshawari Grill", category: "Kebabs & Tandoor", cuisine: "Frontier", desc: "Woodfire-cooked Chapli kebabs and juicy spice-crusted lamb chops." },
  { name: "Sigdi Nights", category: "Kebabs & Tandoor", cuisine: "Lucknowi", desc: "Silky soft Boti kebabs served on crisp flaky parathas with mint relish." },
  { name: "Smoke & Skewer", category: "Kebabs & Tandoor", cuisine: "Fusion", desc: "Smoky peri-peri paneer tikka and grilled rosemary lamb skewers." },
  { name: "Afghan Royal Grill", category: "Kebabs & Tandoor", cuisine: "Afghan", desc: "Mild garlic-yogurt marinated chicken skewers with pickled onions." },
  { name: "Frontier Barbeque", category: "Kebabs & Tandoor", cuisine: "Frontier", desc: "Clay-pot smoked paneer and tandoori prawns seasoned with carom seeds." },
  { name: "Dastarkhwan Kebabs", category: "Kebabs & Tandoor", cuisine: "Hyderabadi", desc: "Traditional Tala Hua Gosht and spicy Shikampuri mutton patties." },
  { name: "Gaddi Grillers", category: "Kebabs & Tandoor", cuisine: "Punjabi", desc: "Amritsari fish tikka and highway-style chicken tikka with spiced butter." },
  { name: "The Kebab Syndicate", category: "Kebabs & Tandoor", cuisine: "Middle Eastern", desc: "Turkish Adana kebabs and Sumac spiced grilled vegetables." },

  // Shawarma & Wraps
  { name: "Shawarma King", category: "Shawarma & Wraps", cuisine: "Lebanese", desc: "Authentic vertical spit-roasted spiced chicken wrapped in saj bread with toum." },
  { name: "Levant Rollers", category: "Shawarma & Wraps", cuisine: "Middle Eastern", desc: "Lamb shawarma with crunchy pickles, tahini garlic drizzle and crispy fries inside." },
  { name: "Beirut Bites", category: "Shawarma & Wraps", cuisine: "Lebanese", desc: "Charcoal-kissed chicken shawarma with charred jalapeño garlic sauce." },
  { name: "Al-Taza Express", category: "Shawarma & Wraps", cuisine: "Arabian", desc: "Loaded meat shawarma with zero cabbage filler and secret spice blend." },
  { name: "Wrap Lab", category: "Shawarma & Wraps", cuisine: "Fusion", desc: "Butter chicken rolls, smoky paneer kathi wraps and ghost-pepper rolls." },
  { name: "Arabian Nights Shawarma", category: "Shawarma & Wraps", cuisine: "Arabian", desc: "Rumali rolled juicy chicken shawarma with melted cheese crust." },
  { name: "The Saj Station", category: "Shawarma & Wraps", cuisine: "Mediterranean", desc: "Fresh saj bread rolled with falafel, pomegranate molasses, and crisp greens." },
  { name: "Kathi & Co.", category: "Shawarma & Wraps", cuisine: "Bengali", desc: "Crispy egg paratha roll stuffed with spicy tawa chicken and lime onions." },
  { name: "Gourmet Pita Bar", category: "Shawarma & Wraps", cuisine: "Greek", desc: "Greek chicken gyro with fresh tzatziki and oregano tossed chips." },
  { name: "Fire & Roll", category: "Shawarma & Wraps", cuisine: "Tex-Mex", desc: "Chipotle steak burrito wrap with guacamole and roasted corn salsa." },

  // Desserts, Sweets & Ice Cream
  { name: "The Dessert Lab", category: "Desserts & Ice Cream", cuisine: "Continental", desc: "Artisanal nitro-churned gelato, warm Belgian waffles, and molten lava pots." },
  { name: "Sweet Bengal", category: "Desserts & Ice Cream", cuisine: "Bengali", desc: "Spongy warm Rasgullas, baked Mishti Doi, and melt-in-mouth Nolen Gur Sandesh." },
  { name: "Pistachio Creamery", category: "Desserts & Ice Cream", cuisine: "Modern", desc: "Handcrafted saffron pistachio rolls and charcoal black vanilla cones." },
  { name: "Churros & Co.", category: "Desserts & Ice Cream", cuisine: "Spanish", desc: "Golden Spanish churros dusted in cinnamon sugar with hot Valrhona chocolate dip." },
  { name: "Shahi Tukda Corner", category: "Desserts & Ice Cream", cuisine: "Hyderabadi", desc: "Deep-fried bread soaked in cardamom saffron milk topped with thick rabri." },
  { name: "Milan Mithai", category: "Desserts & Ice Cream", cuisine: "Traditional", desc: "Freshly pressed Malai Chaap, Motichoor bowls, and Kaju Katli shakes." },
  { name: "Old City Kulfi Hub", category: "Desserts & Ice Cream", cuisine: "Hyderabadi", desc: "Earthen matka kulfi loaded with dried figs, almonds, and rose falooda." },
  { name: "Cookie Dough Dream", category: "Desserts & Ice Cream", cuisine: "American", desc: "Warm cast-iron cookie skillets served with cold honeycomb ice cream." },
  { name: "Bakers Boulevard", category: "Desserts & Ice Cream", cuisine: "French", desc: "Crisp Parisian macarons, pistachio éclairs, and flaky mille-feuille." },
  { name: "Baklava Bazaar", category: "Desserts & Ice Cream", cuisine: "Turkish", desc: "Flaky Turkish baklava sheets drenched in honey syrup and crushed pistachios." },
  { name: "Crepe Couture", category: "Desserts & Ice Cream", cuisine: "French", desc: "Nutella strawberry crepes prepared fresh on rotating French griddles." },
  { name: "Jalebi Junction", category: "Desserts & Ice Cream", cuisine: "North Indian", desc: "Crisp spiraled saffron jalebis fried in pure desi ghee served with cold rabdi." },

  // Street Food & Chaats
  { name: "Chaat Junction", category: "Street Food & Chaats", cuisine: "North Indian", desc: "Tangy Lucknowi Pani Puri, crunchy Papdi Chaat, and loaded Raj Kachori." },
  { name: "Bombay Sandwich Co.", category: "Street Food & Chaats", cuisine: "Maharashtrian", desc: "Toasted 3-layer vegetable club sandwich packed with spicy mint chutney." },
  { name: "Old City Chaat Bhandar", category: "Street Food & Chaats", cuisine: "Hyderabadi", desc: "Spicy ragda patties, savory mirchi bajji, and spiced aloo toast." },
  { name: "Dahi Puri Express", category: "Street Food & Chaats", cuisine: "Street", desc: "Crisp puris bursting with potato, sweet curd, tamarind, and sev." },
  { name: "Sindhi Pakwan", category: "Street Food & Chaats", cuisine: "Sindhi", desc: "Crispy fried maida puris paired with hot spiced chana dal and green chutney." },
  { name: "Amritsari Kulcha Hut", category: "Street Food & Chaats", cuisine: "Punjabi", desc: "Crispy multi-layered tandoori kulcha stuffed with spicy potato and onion." },
  { name: "Dilli 6 Corner", category: "Street Food & Chaats", cuisine: "Delhi Street", desc: "Crispy fried Aloo Tikki smothered in sweet saunth chutney and coriander curd." },
  { name: "Mirchi Bajji House", category: "Street Food & Chaats", cuisine: "Telangana", desc: "Famous stuffed bhavnagri chili bajjis served with crushed roasted peanuts." },
  { name: "Samosa Factory", category: "Street Food & Chaats", cuisine: "Street", desc: "Gourmet samosas stuffed with tandoori paneer, corn cheese, and keema." },
  { name: "Pav Bhaji Central", category: "Street Food & Chaats", cuisine: "Mumbai", desc: "Buttery slow-mashed vegetable gravy served with warm toasted pav." },

  // South Indian & Tiffins
  { name: "Dosa District", category: "South Indian", cuisine: "South Indian", desc: "Ghee roast paper dosas, Benne dosas, and spicy Podi stuffed crisps." },
  { name: "Idli Factory", category: "South Indian", cuisine: "Tamil", desc: "Steaming hot button idlis dunked in piping hot drumstick sambar." },
  { name: "Guntur Gongura Hub", category: "South Indian", cuisine: "Andhra", desc: "Pesarattu upma with fiery ginger allam chutney and gongura pachadi." },
  { name: "Udupi Rasoi", category: "South Indian", cuisine: "Karnataka", desc: "Traditional Mangalore buns, crisp medu vadas, and Mysore masala dosa." },
  { name: "Rayalaseema Tiffins", category: "South Indian", cuisine: "Rayalaseema", desc: "Karam dosa, Ragi sankati with country chicken gravy, and uggani." },
  { name: "Chettinad Kitchen", category: "South Indian", cuisine: "Tamil", desc: "Black pepper chicken fry served with soft flaky Malabar parottas." },
  { name: "Kerala Coastal Tiffins", category: "South Indian", cuisine: "Kerala", desc: "Fluffy appams paired with aromatic coconut milk vegetable stew." },
  { name: "Filter Coffee & Tiffin Co.", category: "South Indian", cuisine: "South Indian", desc: "Frothy brass tumbler filter coffee paired with hot ghee pongal." },
  { name: "Bheemavaram Ruchulu", category: "South Indian", cuisine: "Godavari", desc: "Special Godavari Royyala (prawn) fry dosa and avakaya tiffins." },
  { name: "Madras Tiffin Box", category: "South Indian", cuisine: "Tamil", desc: "Crispy rava masala dosa with three freshly ground coastal chutneys." },

  // Asian & Momos
  { name: "Korean Street", category: "Asian & Momos", cuisine: "Korean", desc: "Crispy double-fried Yangnyeom chicken wings and cheesy Tteokbokki." },
  { name: "Momo District", category: "Asian & Momos", cuisine: "Tibetan", desc: "Steamed, pan-fried, and chili-tossed Himalayan dumplings with spicy sesame dip." },
  { name: "Dragon Wok", category: "Asian & Momos", cuisine: "Indo-Chinese", desc: "Fiery Schezwan Hakka noodles, crispy honey chili lotus stem, and Manchurian." },
  { name: "Dim Sum Heaven", category: "Asian & Momos", cuisine: "Cantonese", desc: "Translucent crystal dumplings, prawn Har Gow, and wok-seared potstickers." },
  { name: "Tokyo Teriyaki", category: "Asian & Momos", cuisine: "Japanese", desc: "Glazed teriyaki chicken rice bowls and crispy vegetable tempura baskets." },
  { name: "Bao Wow", category: "Asian & Momos", cuisine: "Taiwanese", desc: "Steamed lotus-leaf fluffy buns stuffed with braised mushrooms and spicy chicken." },
  { name: "Bangkok Street Food", category: "Asian & Momos", cuisine: "Thai", desc: "Classic Pad Thai noodles with crushed peanuts, lime, and Green Curry bowls." },
  { name: "Chowringhee Tangra", category: "Asian & Momos", cuisine: "Kolkata Chinese", desc: "Tangra-style chili garlic noodles and golden fried wontons." },
  { name: "Seoul Bites", category: "Asian & Momos", cuisine: "Korean", desc: "Korean corn dogs rolled in crispy potato cubes and melted mozzarella." },
  { name: "Wok & Toss", category: "Asian & Momos", cuisine: "Indo-Chinese", desc: "Live wok tossed burnt garlic fried rice with spicy gravy bowls." },

  // Continental & Burgers
  { name: "Grill Republic", category: "Continental & Burgers", cuisine: "American", desc: "Smash burgers with melted cheddar, brioche buns, and house truffle sauce." },
  { name: "Gourmet Patty Co.", category: "Continental & Burgers", cuisine: "American", desc: "Thick double-beef style lamb smash patties with crispy onion rings." },
  { name: "Crust & Crumb", category: "Continental & Burgers", cuisine: "Italian", desc: "Wood-fired Neapolitan sourdough pizzas blistered with san marzano sauce." },
  { name: "Artisan Fries Bar", category: "Continental & Burgers", cuisine: "Belgian", desc: "Double-cooked Belgian fries loaded with melted cheese curd and beef chili." },
  { name: "The Pasta Workshop", category: "Continental & Burgers", cuisine: "Italian", desc: "Fresh handmade fettuccine tossed in rich white truffle Alfredo cream." },
  { name: "Cheesy Crusts", category: "Continental & Burgers", cuisine: "Italian", desc: "Deep dish Chicago style pizza slices oozing with mozzarella and basil." },
  { name: "Smokin' Dogs", category: "Continental & Burgers", cuisine: "American", desc: "Grilled artisanal frankfurters with relish, honey mustard, and crispy bacon bits." },
  { name: "Slider Station", category: "Continental & Burgers", cuisine: "American", desc: "Trio of mini gourmet sliders: pulled chicken, mushroom melt, and barbecue." },
  { name: "Taco Libre", category: "Continental & Burgers", cuisine: "Mexican", desc: "Crisp corn tacos with guacamole, slow-braised chipotle meat, and lime crema." },
  { name: "Nacho Fiesta", category: "Continental & Burgers", cuisine: "Mexican", desc: "Giant tray of warm tortilla chips drowned in queso, jalapeños, and salsa." },

  // Beverages & Chai
  { name: "The Chai Stand", category: "Beverages & Chai", cuisine: "Hyderabadi", desc: "Authentic slow-brewed Dum Irani Chai paired with crisp Osmania biscuits." },
  { name: "Irani Chai Bar", category: "Beverages & Chai", cuisine: "Irani", desc: "Creamy Malai Irani Chai served hot in traditional porcelain cups with lukhmi." },
  { name: "Mango Craze", category: "Beverages & Chai", cuisine: "Seasonal", desc: "Rich Alphonso and Banganapalli thick mango milkshakes topped with mango chunks." },
  { name: "Boba Hub", category: "Beverages & Chai", cuisine: "Taiwanese", desc: "Iced brown sugar milk tea with chewy tapioca pearls and matcha lattes." },
  { name: "Sugarcane Express", category: "Beverages & Chai", cuisine: "Fresh", desc: "Cold-pressed sugarcane juice infused with ginger, lemon, and mint sprigs." },
  { name: "Brewed Awakenings", category: "Beverages & Chai", cuisine: "Specialty Coffee", desc: "Single-origin cold brews, nitro coffees, and iced caramel macchiatos." },
  { name: "Nimbu Soda Works", category: "Beverages & Chai", cuisine: "Indian Street", desc: "Pop-bottle Goli Soda in flavors: Masala Jeera, Lemon, and Blueberry." },
  { name: "Lassi King", category: "Beverages & Chai", cuisine: "Punjabi", desc: "Thick clay-pot sweet lassi topped with pure clotted cream and pistachios." },
  { name: "Coconut Island", category: "Beverages & Chai", cuisine: "Coastal", desc: "Tender coconut shakes and refreshing pineapple coconut coolers." },
  { name: "Berry Good Shakes", category: "Beverages & Chai", cuisine: "Modern", desc: "Fresh mixed berry smoothies with Greek yogurt and chia seeds." },

  // Additional Food Stalls
  { name: "Charminar Haleem Co.", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Rich, slow-cooked mutton Haleem pounded with pure desi ghee and fried cashews." },
  { name: "Nizam's Haleem Ghar", category: "Biryani & Pulao", cuisine: "Hyderabadi", desc: "Piping hot authentic Haleem garnished with fried onions, lemon, and boiled eggs." },
  { name: "Old City Lukhmi Corner", category: "Street Food & Chaats", cuisine: "Hyderabadi", desc: "Flaky square pastry stuffed with spiced minced meat, a true Nizam tea staple." },
  { name: "Barkas Mandi House", category: "Biryani & Pulao", cuisine: "Arabian", desc: "Traditional Arab-style mutton and chicken Mandi over aromatic long-grain rice." },
  { name: "Al-Bait Mandi & Grill", category: "Biryani & Pulao", cuisine: "Arabian", desc: "Barkas secret spice roasted chicken served on family-sized mandi platters." },
  { name: "Zaatar & Olive", category: "Shawarma & Wraps", cuisine: "Mediterranean", desc: "Warm zaatar flatbreads, fresh hummus platters, and marinated kalamata olives." },
  { name: "Falafel Corner", category: "Shawarma & Wraps", cuisine: "Middle Eastern", desc: "Crispy green herb falafel balls wrapped in fluffy pita with pickled turnips." },
  { name: "Gongura Mutton Kitchen", category: "South Indian", cuisine: "Andhra", desc: "Tangy sorrel leaf spicy mutton curry with piping hot steamed rice and ghee." },
  { name: "Nellore Chepala Pulusu", category: "South Indian", cuisine: "Andhra", desc: "Authentic clay-pot sour fish curry made with raw mango and country spices." },
  { name: "Telangana Kodi Vepudu", category: "South Indian", cuisine: "Telangana", desc: "Dry-roasted country chicken fry packed with black pepper and curry leaves." },
  { name: "Pesarattu Point", category: "South Indian", cuisine: "Andhra", desc: "Crisp green gram dosas stuffed with spicy upma and ginger allam chutney." },
  { name: "Mysore Pak Hub", category: "Desserts & Ice Cream", cuisine: "Karnataka", desc: "Melt-in-your-mouth ghee Mysore Pak straight from hot copper cauldrons." },
  { name: "Double Ka Meetha Stall", category: "Desserts & Ice Cream", cuisine: "Hyderabadi", desc: "Classic Hyderabadi wedding dessert of fried bread soaked in saffron cream." },
  { name: "Khubani Ka Meetha Co.", category: "Desserts & Ice Cream", cuisine: "Hyderabadi", desc: "Stewed dried apricots with apricot kernels served with thick fresh cream." },
  { name: "Rajasthani Ghevar House", category: "Desserts & Ice Cream", cuisine: "Rajasthani", desc: "Honeycomb shaped crisp Ghevar topped with saffron rabri and silver vark." },
  { name: "Chilled Matka Falooda", category: "Desserts & Ice Cream", cuisine: "Hyderabadi", desc: "Layers of rose syrup, basil seeds, vermicelli, and rich kulfi scoops." },
  { name: "Paan Paradise", category: "Desserts & Ice Cream", cuisine: "Banarasi", desc: "Fire paan, chocolate coated meetha paan, and iced banarasi paan." },
  { name: "Chaat Gali", category: "Street Food & Chaats", cuisine: "North Indian", desc: "Sev batata puri, crisp bhel puri, and spicy ragda patties." },
  { name: "Kachori Junction", category: "Street Food & Chaats", cuisine: "Rajasthani", desc: "Flaky Pyaaz Kachori and Dal Kachori served with sweet-sour tamarind dip." },
  { name: "Bao Buns & Co.", category: "Asian & Momos", cuisine: "Asian", desc: "Fluffy steamed bao buns filled with spicy glazed crispy paneer." },
  { name: "Thai Curry Express", category: "Asian & Momos", cuisine: "Thai", desc: "Fragrant lemongrass green and red curries served over jasmine rice." },
  { name: "Hot Pot Alley", category: "Asian & Momos", cuisine: "Chinese", desc: "Simmering spicy broths with noodles, mushrooms, and dumplings." },
  { name: "Smoked Brisket Cart", category: "Continental & Burgers", cuisine: "American BBQ", desc: "Slow smoked 12-hour barbecue brisket with honey mustard glaze." },
  { name: "Truffle & Parmesan Fries", category: "Continental & Burgers", cuisine: "Gourmet", desc: "Golden fries tossed in aromatic white truffle oil and aged parmesan shavings." },
  { name: "Wood Oven Calzones", category: "Continental & Burgers", cuisine: "Italian", desc: "Folded pizza pockets stuffed with mozzarella, ricotta, and roasted garlic." },
  { name: "Ginger Masala Soda", category: "Beverages & Chai", cuisine: "Street", desc: "Fiery spicy masala soda made with fresh crushed ginger and rock salt." },
  { name: "Sulaimani Tea House", category: "Beverages & Chai", cuisine: "Malabar", desc: "Golden spiced black tea brewed with cardamom, mint, and a touch of lemon." },
  { name: "Kashmiri Kahwa Bar", category: "Beverages & Chai", cuisine: "Kashmiri", desc: "Green tea simmered with saffron strands, whole cinnamon, and slivered almonds." },
  { name: "Matka Badam Milk", category: "Beverages & Chai", cuisine: "Traditional", desc: "Steaming hot saffron almond milk boiled with crushed cardamom and pistachios." },
  { name: "Raw Cold Pressed Juices", category: "Beverages & Chai", cuisine: "Healthy", desc: "Immunity boosters: Valencia orange, Beet-Pomegranate, and Green Detox." },
];

const lifestyleVendorTemplates = [
  { name: "Deccan Handlooms", category: "Lifestyle & Apparel", cuisine: null, desc: "Pure Pochampally Ikat sarees, stoles, and handwoven organic cotton dupattas." },
  { name: "Hyderabad Pearl Mart", category: "Lifestyle & Jewelry", cuisine: null, desc: "Certified natural Basra and cultured freshwater pearls handcrafted into jewelry." },
  { name: "Kalamkari Tales", category: "Lifestyle & Art", cuisine: null, desc: "Hand-painted organic dye Kalamkari wall hangings, cushion covers, and bags." },
  { name: "Brass & Clay Creations", category: "Lifestyle & Crafts", cuisine: null, desc: "Traditional Dokra bell metal craft and terracotta home decor sculptures." },
  { name: "Banjara Mirror Works", category: "Lifestyle & Accessories", cuisine: null, desc: "Vibrant ethnic embroidery, mirror-studded tote bags, and festive jackets." },
  { name: "Organic Spices of Telangana", category: "Lifestyle & Gourmet", cuisine: null, desc: "Single-origin farm turmeric, Guntur red chilies, and cold-pressed sesame oil." },
  { name: "Artisanal Herb Soaps", category: "Lifestyle & Wellness", cuisine: null, desc: "Handmade goat milk soaps, pure essential oils, and vetiver body mists." },
  { name: "Charminar Ittar Emporium", category: "Lifestyle & Fragrance", cuisine: null, desc: "Traditional non-alcoholic pure floral attar perfumes: Gulab, Shamama, and Oudh." },
  { name: "Nizami Silver Filigree", category: "Lifestyle & Jewelry", cuisine: null, desc: "Karimnagar Tarkashi intricate silver filigree earrings, trays, and pendants." },
  { name: "Bidri Crafts Hub", category: "Lifestyle & Art", cuisine: null, desc: "Ancient Bidri metalware with pure silver inlay on blackened zinc alloy." },
  { name: "Earthy Pots & Planters", category: "Lifestyle & Home", cuisine: null, desc: "Glazed ceramic studio pottery, bonsai trays, and earthen cookware." },
  { name: "Bamboo Craft Collective", category: "Lifestyle & Eco", cuisine: null, desc: "Sustainable bamboo kitchenware, organic lanterns, and picnic hampers." },
  { name: "Handmade Paper Guild", category: "Lifestyle & Stationery", cuisine: null, desc: "Recycled cotton paper journals, botanical letter sets, and wax seal kits." },
  { name: "Channapatna Wooden Toys", category: "Lifestyle & Toys", cuisine: null, desc: "Traditional non-toxic lacquered wooden toys, spin tops, and puzzle games." },
  { name: "Leathercraft Studio", category: "Lifestyle & Accessories", cuisine: null, desc: "Full-grain vegetable-tanned leather wallets, journal covers, and belts." },
  { name: "Vintage Hyderabad Prints", category: "Lifestyle & Art", cuisine: null, desc: "Framed archival photography of Old Hyderabad, Charminar, and Golconda Fort." },
  { name: "Khadi Revival Co.", category: "Lifestyle & Apparel", cuisine: null, desc: "Modern cut breathable Khadi shirts, summer dresses, and relaxed trousers." },
  { name: "Ayurvedic Botanicals", category: "Lifestyle & Wellness", cuisine: null, desc: "Cold-pressed Kumkumadi face oils, herbal hair masks, and copper drinkware." },
  { name: "Gourmet Honey Harvest", category: "Lifestyle & Gourmet", cuisine: null, desc: "Raw unprocessed forest honey collected from Eastern Ghats wild beehives." },
  { name: "Handmade Candle Studio", category: "Lifestyle & Home", cuisine: null, desc: "Soy wax scented candles with notes of Mogra, Cardamom, Amber, and Teakwood." },
  { name: "Silver Leaf Jewelry", category: "Lifestyle & Jewelry", cuisine: null, desc: "Contemporary 925 sterling silver jewelry with semi-precious stone settings." },
  { name: "Festive Linen & Weaves", category: "Lifestyle & Home", cuisine: null, desc: "Pure linen table runners, napkins, and block-printed cotton bedspreads." },
  { name: "Terracotta Jewelry Box", category: "Lifestyle & Accessories", cuisine: null, desc: "Hand-painted terracotta necklaces, jhumkas, and temple jewelry sets." },
  { name: "Cast Iron Heritage Cookware", category: "Lifestyle & Gourmet", cuisine: null, desc: "Pre-seasoned heavy cast iron skillets, dosa tawas, and kuzhi paniyaram pans." },
  { name: "Indie T-Shirt Project", category: "Lifestyle & Apparel", cuisine: null, desc: "Hyderabad-themed graphic tees, quirky slang hoodies, and canvas bucket hats." },
  { name: "Natural Incense Craft", category: "Lifestyle & Wellness", cuisine: null, desc: "Charcoal-free temple flower incense sticks, dhoop cones, and brass burners." },
  { name: "Handcrafted Mosaic Lamps", category: "Lifestyle & Home", cuisine: null, desc: "Turkish and Moroccan stained-glass mosaic bedside lamps and hanging lanterns." },
  { name: "Artisanal Pickles of Andhra", category: "Lifestyle & Gourmet", cuisine: null, desc: "Traditional Avakaya, Gongura pachadi, and fiery Boneless Mutton pickle jars." },
  { name: "Macrame Garden Decor", category: "Lifestyle & Home", cuisine: null, desc: "Boho cotton macrame wall tapestries, plant hangers, and woven coasters." },
  { name: "Tribal Loom Textiles", category: "Lifestyle & Apparel", cuisine: null, desc: "Handspun sheep wool rugs, durries, and rustic shawls from northern Telangana." },
  { name: "Clay Tea Cup Studio", category: "Lifestyle & Crafts", cuisine: null, desc: "Reusable glazed terracotta kulhads and rustic ceramic coffee mugs." },
  { name: "Pure Silk Scarves Co.", category: "Lifestyle & Apparel", cuisine: null, desc: "Mulberry silk printed stoles and pocket squares with Mughal motifs." },
  { name: "Eco Friendly Bags Collective", category: "Lifestyle & Eco", cuisine: null, desc: "Jute and canvas shopping totes, canvas backpacks, and pouch organizers." },
  { name: "Copper Wellness Vessels", category: "Lifestyle & Wellness", cuisine: null, desc: "Hammered pure copper water bottles, jugs, and engraved tumblers." },
  { name: "Artisanal Chocolate Crafters", category: "Lifestyle & Gourmet", cuisine: null, desc: "Bean-to-bar dark chocolates made with South Indian cacao and spices." },
  { name: "Miniature Clay Art", category: "Lifestyle & Art", cuisine: null, desc: "Hand-sculpted miniature food magnets: Hyderabadi biryani handi, chai cup, and dosa." },
  { name: "Handmade Wooden Combs", category: "Lifestyle & Wellness", cuisine: null, desc: "Pure Neem wood wide-tooth combs, beard brushes, and massage rollers." },
  { name: "Deccani Brassware", category: "Lifestyle & Crafts", cuisine: null, desc: "Engraved brass spice boxes (masala dabbas), paan daan, and pooja thalis." },
  { name: "Organic Cotton Robes", category: "Lifestyle & Apparel", cuisine: null, desc: "Waffle weave bathrobes, kimono lounge jackets, and organic towels." },
  { name: "Plant-Based Resin Art", category: "Lifestyle & Crafts", cuisine: null, desc: "Preserved real flower resin coasters, bookmarks, and wooden cheese boards." },
];

async function main() {
  console.log("🚀 Starting Grand Food Fest Production Bootstrap...");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || adminPassword === "admin123") {
    console.warn("⚠️ WARNING: Strong production ADMIN_EMAIL and ADMIN_PASSWORD environment variables should be set!");
  }

  const cleanEmail = (adminEmail || "admin@grandfoodfest.com").toLowerCase().trim();
  const rawPassword = adminPassword || "GFF2026-SuperSecure-Pass!";

  // 1. Upsert Production Admin User
  const admin = await prisma.adminUser.upsert({
    where: { email: cleanEmail },
    update: {
      name: "Festival Administrator",
      role: "SUPERADMIN",
    },
    create: {
      email: cleanEmail,
      passwordHash: hashPassword(rawPassword),
      name: "Festival Administrator",
      role: "SUPERADMIN",
    },
  });
  console.log(`👤 Configured Administrator Account: ${admin.email}`);

  // 2. Upsert Production Event
  const eventSlug = "grand-food-fest-hyd-2026";
  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    update: {
      status: "LIVE",
      ratingLimitPerAttendeePerDay: 5,
      minimumRatingsForLeaderboard: 20,
    },
    create: {
      name: "Grand Food Fest Hyderabad 2026",
      slug: eventSlug,
      startDate: new Date("2026-10-09T09:30:00.000Z"), // 15:00 IST
      endDate: new Date("2026-10-11T18:29:59.999Z"),   // 23:59:59 IST
      status: "LIVE",
      ratingLimitPerAttendeePerDay: 5,
      minimumRatingsForLeaderboard: 20,
    },
  });
  console.log(`🎪 Configured Production Event: ${event.name}`);

  // 3. Configure 3 Festival Days (Oct 9, 10, 11 2026 in IST)
  const dayDates = [
    { day: 1, date: createISTMidnightDate(2026, 10, 9), status: "LIVE" },
    { day: 2, date: createISTMidnightDate(2026, 10, 10), status: "UPCOMING" },
    { day: 3, date: createISTMidnightDate(2026, 10, 11), status: "UPCOMING" },
  ];

  for (const item of dayDates) {
    await prisma.eventDay.upsert({
      where: {
        eventId_date: {
          eventId: event.id,
          date: item.date,
        },
      },
      update: {
        status: item.status,
      },
      create: {
        eventId: event.id,
        dayNumber: item.day,
        date: item.date,
        status: item.status,
      },
    });
  }
  console.log("📅 Configured 3 Official Event Days (Day 1: LIVE, Days 2 & 3: UPCOMING)");

  // 4. Upsert Official Food Vendors (110 stalls)
  let foodStallIndex = 1;
  for (const v of foodVendorTemplates) {
    const stall = `A-${String(foodStallIndex).padStart(2, "0")}`;
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await prisma.vendor.upsert({
      where: { slug },
      update: {
        name: v.name,
        description: v.desc,
        category: v.category,
        cuisine: v.cuisine,
        stallNumber: stall,
        vendorType: "FOOD",
        status: "ACTIVE",
      },
      create: {
        eventId: event.id,
        name: v.name,
        slug,
        description: v.desc,
        category: v.category,
        cuisine: v.cuisine,
        stallNumber: stall,
        vendorType: "FOOD",
        status: "ACTIVE",
      },
    });
    foodStallIndex++;
  }
  console.log(`🍲 Configured ${foodVendorTemplates.length} Official Food Vendors.`);

  // 5. Upsert Official Lifestyle Vendors (40 stalls)
  let lifeStallIndex = 1;
  for (const v of lifestyleVendorTemplates) {
    const stall = `L-${String(lifeStallIndex).padStart(2, "0")}`;
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    await prisma.vendor.upsert({
      where: { slug },
      update: {
        name: v.name,
        description: v.desc,
        category: v.category,
        cuisine: v.cuisine,
        stallNumber: stall,
        vendorType: "LIFESTYLE",
        status: "ACTIVE",
      },
      create: {
        eventId: event.id,
        name: v.name,
        slug,
        description: v.desc,
        category: v.category,
        cuisine: v.cuisine,
        stallNumber: stall,
        vendorType: "LIFESTYLE",
        status: "ACTIVE",
      },
    });
    lifeStallIndex++;
  }
  console.log(`🛍️ Configured ${lifestyleVendorTemplates.length} Official Lifestyle Vendors.`);

  // 6. Configure Official Award Categories in DRAFT state
  const officialAwards = [
    { name: "Best Biryani of the Festival", category: "Biryani & Pulao", desc: "Awarded to the top rated traditional or artisanal Biryani stall." },
    { name: "People's Choice: Best Street Food", category: "Street Food & Chaats", desc: "Highest attendee acclaim for street flavors and chaats." },
    { name: "Sweet Sensation: Best Dessert", category: "Desserts & Ice Cream", desc: "Most delicious dessert, ice cream, or traditional mithai." },
    { name: "Festival Favorite: Beverage & Chai", category: "Beverages & Chai", desc: "Top crowd favorite tea, coffee, or refreshing drink." },
    { name: "Grand Champion: Best Food Stall 2026", category: "All", desc: "The highest overall festival honor for culinary excellence." },
  ];

  for (const award of officialAwards) {
    const existing = await prisma.award.findFirst({
      where: { eventId: event.id, name: award.name },
    });
    if (!existing) {
      await prisma.award.create({
        data: {
          eventId: event.id,
          name: award.name,
          category: award.category,
          description: award.desc,
          status: "DRAFT",
        },
      });
    }
  }
  console.log(`🏆 Initialized ${officialAwards.length} Official Festival Honors in DRAFT status.`);
  console.log("✨ Production bootstrap complete. ZERO synthetic sessions, ZERO fake votes, ZERO fake snapshots.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
