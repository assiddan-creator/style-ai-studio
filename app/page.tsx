"use client";

import { useRef, useState, useCallback, useEffect, ChangeEvent } from "react";

type InputMode = "camera" | "upload";
type AppStep = "capture" | "analyzing" | "pick-preset" | "generating" | "result";
type CategoryKey = "beauty" | "accessories" | "tops" | "bottoms" | "men" | "women";
type Engine = "nano-banana" | "nano-pro" | "nano-2" | "flux-pro" | "seedream";

const CATEGORIES: Record<CategoryKey, { label: string; emoji: string }> = {
  beauty:      { label: "ביוטי & איפור",    emoji: "💄" },
  accessories: { label: "אקססוריז",          emoji: "👜" },
  tops:        { label: "עליוניות",           emoji: "🧥" },
  bottoms:     { label: "תחתוניות & ג'ינס", emoji: "👖" },
  men:         { label: "סטייל גברים",       emoji: "👔" },
  women:       { label: "סטייל נשים",        emoji: "👗" },
};

// ─── NANO BANANA PRESETS ──────────────────────────────────────────────────────
const NANO_PREFIX =
  "[Image-to-Image Edit] STRICT IDENTITY PRESERVATION. Retain the exact same person, original facial features, bone structure, eye shape, and skin tone. DO NOT airbrush or smooth the skin. Change ONLY the requested makeup, styling, and accessories to: ";
const NANO_SUFFIX =
  ". Shot on ARRI Alexa 65 with ARRI Prime DNA 50mm lens. High-end beauty editorial photography, exquisite studio lighting, hyper-realistic, unretouched RAW photo look, vivid details.";

const PRESETS_NANO = {
  beauty: [
    { id: "B1",  label: "Bloom Skin Glow",    emoji: "🌸", prompt: "Using the reference image, give the subject a deeply hydrated, radiant 'bloom skin' complexion. Keep the facial identity and background exactly the same. Soft studio beauty lighting, ultra-realistic skin texture." },
    { id: "B2",  label: "Pimple Patches",      emoji: "⭐", prompt: "Using the reference image, seamlessly add cute, small star-shaped hydrocolloid pimple patches to the subject's cheeks. Make the surrounding skin look clear and fresh. Keep the facial identity exact." },
    { id: "B3",  label: "Mob Wife Glam",       emoji: "🖤", prompt: "Using the reference image, apply bold luxury makeup: dark burgundy lipstick, heavy contour, and sharp eyeliner. Keep the person's identity identical. Direct flash photography style, high contrast." },
    { id: "B4",  label: "Clean Girl Morning",  emoji: "🤍", prompt: "Using the reference image, apply minimal 'clean girl' makeup: brushed-up fluffy eyebrows, glossy clear lips, and a subtle pink flush on the cheeks. Keep the facial identity exact. Soft natural daylight." },
    { id: "B5",  label: "Rockstar Smudge",     emoji: "🎸", prompt: "Using the reference image, apply messy, deliberately smudged black eyeliner and smoky eyeshadow for an edgy rockstar look. Keep the rest of the face natural and maintain exact identity." },
    { id: "B6",  label: "Coquette Flush",      emoji: "🎀", prompt: "Using the reference image, apply heavy pastel pink blush across the cheeks and nose. Keep the facial identity exact. Add a soft romantic, dreamy pastel glow to the lighting." },
    { id: "B7",  label: "Sun-Kissed",          emoji: "☀️", prompt: "Using the reference image, add a warm, sun-kissed bronzer effect and delicate faux freckles across the nose and cheeks. Keep the identity exact. Golden hour sunlight aesthetic." },
    { id: "B8",  label: "Y2K Frost",           emoji: "💎", prompt: "Using the reference image, apply retro Y2K makeup featuring frosty metallic silver eyeshadow and high-shine lip gloss. Maintain the facial identity. Vintage digital camera aesthetic." },
    { id: "B9",  label: "Librarian Glasses",   emoji: "🤓", prompt: "Using the reference image, add a pair of stylish, thick-rimmed tortoiseshell glasses to the subject's face. Ensure the glasses fit naturally and keep the facial identity completely identical." },
    { id: "B10", label: "90s Editorial",        emoji: "📷", prompt: "Using the reference image, apply 90s editorial makeup with visible brown lip liner and matte skin. Keep the identity exact. Shoot with a harsh direct camera flash for a vintage magazine look." },
    { id: "B11", label: "Golden Hour Skin",     emoji: "✨", prompt: NANO_PREFIX + "Give her luminous golden-hour skin with Armani Luminous Silk style foundation, Charlotte Tilbury Hollywood Flawless Filter glow, soft bronzed cheeks, and naturally enhanced features. Keep it realistic and premium." },
    { id: "B12", label: "Cool Blush Flush",     emoji: "🌷", prompt: NANO_PREFIX + "Give her fresh cool pink blush inspired by Dior Rosy Glow or Rare Beauty Soft Pinch, with natural skin and soft lashes. Keep it realistic and youthful." },
    { id: "B13", label: "Watercolor Blush",     emoji: "🎨", prompt: NANO_PREFIX + "Give her a soft watercolor blush look inspired by Patrick Ta or Rhode Pocket Blush with clean luminous skin. Keep it realistic and modern." },
    { id: "B14", label: "Blurred Matte Lip",    emoji: "💋", prompt: NANO_PREFIX + "Give her a blurred matte lip inspired by MAC Powder Kiss or Dior Addict Lip Tint, with soft skin and subtle lashes. Keep it realistic and fashionable." },
    { id: "B15", label: "Ballet Slipper Lips",  emoji: "🩰", prompt: NANO_PREFIX + "Give her ballet-slipper pink lips inspired by Dior Addict or MAC Lustreglass, with natural skin and fresh cheeks. Keep it realistic and delicate." },
    { id: "B16", label: "Glossy Red Lip",       emoji: "❤️", prompt: NANO_PREFIX + "Give her luminous skin, soft lashes, subtle eyeliner, and glossy red lips inspired by Chanel Rouge Coco. Keep it realistic, elegant, and premium." },
    { id: "B17", label: "Maroon Bordeaux Lip",  emoji: "🍷", prompt: NANO_PREFIX + "Give her soft skin, minimal eye makeup, and a rich maroon lip inspired by MAC Diva or NARS deep berry shades. Keep it realistic and elegant." },
    { id: "B18", label: "Micro Liner",          emoji: "✏️", prompt: NANO_PREFIX + "Give her ultra-thin precise eyeliner inspired by KVD Tattoo Liner or NYX Epic Ink, with natural skin and subtle lips. Keep it realistic and clean." },
    { id: "B19", label: "Brown Tightline Soft", emoji: "🤎", prompt: NANO_PREFIX + "Give her soft brown tightline eyeliner inspired by Victoria Beckham Satin Kajal, with natural skin and neutral lips. Keep it realistic and flattering." },
    { id: "B20", label: "Colorwash Lids",       emoji: "🌈", prompt: NANO_PREFIX + "Give her a soft colorwash eye look inspired by Half Magic or Ilia liquid shadow, with clean skin and subtle lips. Keep it realistic and modern." },
    { id: "B21", label: "Soft Taupe Eye",       emoji: "🪶", prompt: NANO_PREFIX + "Give her a soft taupe eye look inspired by Natasha Denona or Makeup by Mario nude tones, with natural skin and understated lips. Keep it realistic and elegant." },
    { id: "B22", label: "Icy Blue Wash",        emoji: "🧊", prompt: NANO_PREFIX + "Give her an icy blue eye wash inspired by Chanel blue shadow or About-Face, with clean skin and soft lips. Keep it realistic and stylish." },
    { id: "B23", label: "Lavender Lid",         emoji: "💜", prompt: NANO_PREFIX + "Give her pastel lavender eyelids inspired by Dior Backstage or Huda Beauty pastel tones, with fresh cheeks and soft lashes. Keep it realistic and premium." },
    { id: "B24", label: "Gold Fleck Eye",       emoji: "✨", prompt: NANO_PREFIX + "Give her subtle gold-fleck eye makeup inspired by Pat McGrath or Stila liquid shadow, with luminous skin and neutral lips. Keep it realistic and elegant." },
    { id: "B25", label: "Pearl Inner Corner",   emoji: "🤍", prompt: NANO_PREFIX + "Give her pearl inner-corner highlights inspired by Rare Beauty or Fenty, with clean skin and light lashes. Keep it realistic and fresh." },
    { id: "B26", label: "High-Shine Skin",      emoji: "💫", prompt: NANO_PREFIX + "Give her high-shine luminous skin inspired by Dior Forever Glow, Saie Glowy Super Gel, or Merit Great Skin. Keep it realistic and glossy." },
    { id: "B27", label: "Soft Peach Glow",      emoji: "🍑", prompt: NANO_PREFIX + "Give her soft peach blush and matching lips inspired by NARS Orgasm style tones or Tower 28. Keep it realistic and flattering." },
    { id: "B28", label: "Underpainting Sculpt", emoji: "🎭", prompt: NANO_PREFIX + "Give her softly sculpted makeup inspired by Makeup by Mario SoftSculpt or Charlotte Tilbury contour wand, with natural skin and subtle blush. Keep it realistic." },
    { id: "B29", label: "Clean Brow Lift",      emoji: "⬆️", prompt: NANO_PREFIX + "Give her lifted clean brows inspired by Benefit 24-HR Brow Setter or Anastasia Brow Freeze, with natural skin and minimal makeup. Keep it realistic and fresh." },
    { id: "B30", label: "No-Makeup Filter",     emoji: "🫧", prompt: NANO_PREFIX + "Give her a no-makeup beauty look with light NARS or Kosas style concealer, subtle mascara, healthy skin, and a Clinique Black Honey style lip balm. Keep it realistic and effortless." },
    { id: "B31", label: "Pink Monochrome Face", emoji: "🌸", prompt: NANO_PREFIX + "Give her matching pink tones on eyes, cheeks, and lips inspired by Dior Rosy Glow or Rare Beauty pink shades. Keep it realistic and youthful." },
    { id: "B32", label: "Soft Coral Summer",    emoji: "🪸", prompt: NANO_PREFIX + "Give her fresh coral cheeks and lips inspired by Benefit tint or Fenty coral shades. Keep it realistic and sun-kissed." },
    { id: "B33", label: "Cool Neutral Contour", emoji: "🌫️", prompt: NANO_PREFIX + "Give her cool-toned contour inspired by Fenty Match Stix Amber or Westman Atelier Biscuit, with clean skin and understated lips. Keep it realistic." },
    { id: "B34", label: "Glossed Nude Lip",     emoji: "🫦", prompt: NANO_PREFIX + "Give her a polished nude lip inspired by Charlotte Tilbury Pillow Talk with Fenty Gloss Bomb shine, plus soft skin and subtle lashes. Keep it realistic and premium." },
    { id: "B35", label: "Diffused Berry Stain", emoji: "🫐", prompt: NANO_PREFIX + "Give her a diffused berry lip stain inspired by Dior Lip Tint, Benefit Benetint, or Rom&nd, with clean skin and subtle eye makeup. Keep it realistic and modern." },
    { id: "B36", label: "Feathered Red Lip",    emoji: "🌹", prompt: NANO_PREFIX + "Give her a feathered red lip inspired by MAC Ruby Woo or Dior red lipstick tones, with minimal eye makeup and polished skin. Keep it realistic and editorial." },
    { id: "B37", label: "Face Gems Light",      emoji: "💎", prompt: NANO_PREFIX + "Give her very delicate Half Magic style face gems near the eyes, soft luminous skin, and fresh lips. Keep it realistic and playful." },
    { id: "B38", label: "Glossy Lid Nude",      emoji: "🫙", prompt: NANO_PREFIX + "Give her glossy nude eyelids inspired by Danessa Myricks or RMS, with clean skin and nude lips. Keep it realistic and modern." },
    { id: "B39", label: "Sunburn Blush",        emoji: "🌞", prompt: NANO_PREFIX + "Give her blush across the cheeks and nose inspired by Rhode Pocket Blush or Rare Beauty, with soft skin and natural lips. Keep it realistic and trendy." },
    { id: "B40", label: "Soft Bronze Eye",      emoji: "🥉", prompt: NANO_PREFIX + "Give her a soft bronze eye look inspired by Chanel Les Beiges or Armani Eye Tint, with warm skin and neutral lips. Keep it realistic and elegant." },
    { id: "B41", label: "Bare Lash Bold Lip",   emoji: "👄", prompt: NANO_PREFIX + "Give her minimal lashes, clean elegant skin, and a strong premium lipstick color inspired by Dior or Chanel. Keep it realistic and high-end." },
    { id: "B42", label: "White Waterline",      emoji: "👁️", prompt: NANO_PREFIX + "Give her a bright fresh-eyed look with white or nude waterline eyeliner inspired by MAKE UP FOR EVER or NYX, soft skin, and natural lips. Keep it realistic and awake-looking." },
    { id: "B43", label: "Rosy Concealed Skin",  emoji: "🌺", prompt: NANO_PREFIX + "Give her rosy concealed skin with light NARS, Kosas, or Dior style concealer, fresh pink tones, and minimal eye makeup. Keep it realistic and naturally perfected." },
    { id: "B44", label: "Subtle Lash Lift",     emoji: "🦋", prompt: NANO_PREFIX + "Give her separated lifted lashes inspired by Lancôme Lash Idôle or Maybelline Sky High, with clean skin and soft lips. Keep it realistic and flattering." },
    { id: "B45", label: "Dopamine Pastel Lip",  emoji: "🍬", prompt: NANO_PREFIX + "Give her a playful pastel lip inspired by Dior Addict, YSL Candy Glaze, or MAC pastel tones, with quiet skin and minimal eye makeup. Keep it realistic and youthful." },
  ],
  accessories: [
    { id: "A1",  label: "Statement Belt",      emoji: "🪢", prompt: "Using the reference image, seamlessly add a thick black leather belt with a large, chunky gold buckle to the subject's waist area. Keep the face, body shape, and background exactly the same." },
    { id: "A2",  label: "Charms Bag",          emoji: "🎒", prompt: "Using the reference image, add a trendy shoulder bag covered in colorful metal charms and keychains hanging from the strap. Keep the subject's identity and posture intact." },
    { id: "A3",  label: "Kangol Hat",          emoji: "🧢", prompt: "Using the reference image, place a stylish black Kangol-style flat cap naturally on the subject's head. Keep the facial features and the rest of the outfit completely unchanged." },
    { id: "A4",  label: "Silk Headscarf",      emoji: "🧣", prompt: "Using the reference image, wrap a luxurious printed silk scarf elegantly around the subject's head or neck in a retro 60s style. Maintain exact facial identity." },
    { id: "A5",  label: "Big Sunnies",         emoji: "🕶️", prompt: "Using the reference image, seamlessly add oversized, vintage 1970s tinted sunglasses to the subject's face. Keep the hair, outfit, and background exactly the same." },
    { id: "A6",  label: "Edgy Studs",          emoji: "⚡", prompt: "Using the reference image, modify the existing clothing to include edgy silver metal studs and spikes along the shoulders or collar. Keep the facial identity and background untouched." },
    { id: "A7",  label: "Coquette Bows",       emoji: "🎀", prompt: "Using the reference image, weave several small, delicate pink satin bows into the subject's hair and attach a few to their clothing. Maintain the exact facial identity." },
    { id: "A8",  label: "Statement Socks",     emoji: "🧦", prompt: "Using the reference image, change the subject's lower leg area to feature bright, colorful patterned statement socks peeking out of their shoes. Keep the face and upper body exact." },
    { id: "A9",  label: "Luxe Tote",           emoji: "👝", prompt: "Using the reference image, add an elegant, minimalist beige leather tote bag carried naturally over the subject's shoulder or in hand. Keep the face and background identical." },
    { id: "A10", label: "Wedge Revival",        emoji: "👡", prompt: "Using the reference image, change the subject's footwear to trendy, chunky platform wedge sandals, keeping the rest of the body, face, and background perfectly identical." },
  ],
  tops: [
    { id: "T1",  label: "Burgundy Bomber",     emoji: "🍷", prompt: "Using the reference image, change the subject's top layer to a trendy burgundy-colored bomber jacket with a slight nylon sheen. Keep the facial identity, pants, and background exactly the same." },
    { id: "T2",  label: "Multi-Layer Vibe",    emoji: "👕", prompt: "Using the reference image, change the subject's top to a trendy layered look featuring a white t-shirt peeking out from under a loose dark long-sleeve shirt. Maintain exact facial identity." },
    { id: "T3",  label: "Poetcore Cardigan",   emoji: "🧶", prompt: "Using the reference image, change the subject's top to a chunky, oversized knit cardigan in a soft oatmeal color, draped slightly off one shoulder. Keep the face and background identical." },
    { id: "T4",  label: "Faux Fur Extra",      emoji: "🐻", prompt: "Using the reference image, change the subject's outerwear to a massive, luxurious faux fur coat in dark brown. Keep the facial identity, lighting, and background completely unchanged." },
    { id: "T5",  label: "Soft Prep Polo",      emoji: "🎽", prompt: "Using the reference image, change the subject's top to a fine-knit, elegant polo sweater with a contrasting collar. Keep the face, lower body, and background perfectly consistent." },
    { id: "T6",  label: "Sheer & Lace",        emoji: "🤍", prompt: "Using the reference image, change the subject's top to a delicate, semi-sheer black lace long-sleeve shirt over a bralette. Keep the facial identity exact." },
    { id: "T7",  label: "Utility Cargo Vest",  emoji: "🪖", prompt: "Using the reference image, add a tactical, multi-pocket cargo vest in olive green over the subject's current outfit. Keep the face, body proportions, and background exact." },
    { id: "T8",  label: "Napoleon Edge",       emoji: "🎖️", prompt: "Using the reference image, change the subject's top to a structured, tailored blazer featuring prominent military-style gold brass buttons. Maintain exact facial identity." },
    { id: "T9",  label: "Crochet Summer",      emoji: "🌊", prompt: "Using the reference image, change the subject's top to an artisanal, open-weave crochet shirt in natural cream tones. Keep the face and background identical. Warm summer lighting." },
    { id: "T10", label: "Boho Kimono",         emoji: "🌸", prompt: "Using the reference image, add a flowing, sheer dark kimono with moody floral prints worn openly over the subject's outfit. Maintain the exact face and body posture." },
  ],
  bottoms: [
    { id: "D1",  label: "Barrel Fit Jeans",    emoji: "🛢️", prompt: "Using the reference image, change the subject's pants to trendy 'barrel-fit' blue jeans that curve outward at the knees and taper at the ankle. Keep the face, top, and background exactly the same." },
    { id: "D2",  label: "Clean Straight Denim",emoji: "👖", prompt: "Using the reference image, change the subject's pants to classic, crisp, straight-leg dark wash denim jeans. Keep the face, top garment, and background completely identical." },
    { id: "D3",  label: "Wide-Leg Culottes",   emoji: "🌬️", prompt: "Using the reference image, change the subject's lower garment to wide-leg, tailored wool culottes that end just above the ankle. Maintain the exact facial identity and upper body." },
    { id: "D4",  label: "90s Jorts",           emoji: "✂️", prompt: "Using the reference image, change the subject's pants to baggy, knee-length denim shorts (jorts) in a vintage light blue wash. Keep the face, upper body, and background exact." },
    { id: "D5",  label: "Plaid Mini/Midi",     emoji: "🏴", prompt: "Using the reference image, change the subject's lower garment to a pleated, tartan plaid skirt in red and black. Keep the face, top, and background completely unchanged." },
    { id: "D6",  label: "Retro Low-Rise",      emoji: "💿", prompt: "Using the reference image, change the subject's pants to low-rise, slightly flared jeans revealing the midriff, matching a Y2K aesthetic. Keep the facial identity exact." },
    { id: "D7",  label: "Satin Slip Skirt",    emoji: "🥂", prompt: "Using the reference image, change the subject's lower garment to an elegant, flowing silk slip midi skirt in champagne color. Keep the face, top, and background identical." },
    { id: "D8",  label: "Tailored Trackpants", emoji: "🏃", prompt: "Using the reference image, change the subject's pants to elevated, sporty trackpants with a sleek white side stripe down the leg. Maintain exact facial identity." },
    { id: "D9",  label: "Parachute Pants",     emoji: "🪂", prompt: "Using the reference image, change the subject's pants to baggy, lightweight nylon parachute pants with drawstrings at the ankles. Keep the face, upper body, and background the same." },
    { id: "D10", label: "Sheer Maxi Skirt",    emoji: "🌑", prompt: "Using the reference image, change the subject's lower garment to a trendy, semi-sheer black lace maxi skirt worn over dark shorts. Keep the facial identity and top exact." },
  ],
  men: [
    { id: "M1",  label: "Denim Clean Hero",       emoji: "👖", prompt: NANO_PREFIX + "Dress him in Levi's 501 or Levi's 568 jeans, a premium white t-shirt, New Balance 550 sneakers, and Ray-Ban Wayfarer sunglasses. Make it realistic, clean, fashionable, and commercially appealing." },
    { id: "M2",  label: "Tel Aviv Minimal Linen",  emoji: "🌿", prompt: NANO_PREFIX + "Dress him in light linen pants, an open linen shirt, a white rib tank top, and Birkenstock Arizona leather sandals in a premium COS or Massimo Dutti style. Make it realistic, stylish, and suitable for a Tel Aviv summer." },
    { id: "M3",  label: "Retro Football Street",   emoji: "⚽", prompt: NANO_PREFIX + "Dress him in an Adidas football-style jersey, slim track pants, Adidas Samba or Adidas Tokyo sneakers, and a small crossbody bag. Make the look realistic, trendy, and street-fashion driven." },
    { id: "M4",  label: "Silver Accessories Guy",  emoji: "🥈", prompt: NANO_PREFIX + "Style him in a clean monochrome outfit with Tom Wood style silver rings, a Vitaly silver chain necklace, and a silver metal watch. Make the result realistic, modern, and commercially attractive." },
    { id: "M5",  label: "Israeli Smart Casual",    emoji: "✨", prompt: NANO_PREFIX + "Dress him in relaxed tailored trousers, a premium knit polo in a Reiss or Zara Studio style, and elegant loafers. Make the result polished, realistic, and stylish." },
    { id: "M6",  label: "Relaxed Barrel Denim",    emoji: "🛢️", prompt: NANO_PREFIX + "Dress him in relaxed barrel-fit jeans inspired by Levi's loose denim, a short-sleeve button shirt, a slim leather belt, and low-profile sneakers. Make it realistic and fashionable." },
    { id: "M7",  label: "Wraparound Tech Boy",     emoji: "🔭", prompt: NANO_PREFIX + "Style him with technical pants, a lightweight overshirt, Salomon sneakers, and Oakley wraparound sunglasses. Make the result realistic, sporty, and fashion-forward." },
    { id: "M8",  label: "Beach-to-City Luxe",      emoji: "🏖️", prompt: NANO_PREFIX + "Dress him in relaxed trousers, a white rib tank top, an open lightweight shirt, and premium Hermès-style leather sandals. Make it realistic, polished, and effortless." },
    { id: "M9",  label: "Grandpa Sneaker Cool",    emoji: "👟", prompt: NANO_PREFIX + "Dress him in straight pants, a premium sweatshirt, and New Balance 990 sneakers. Make it look realistic, relaxed, and stylish." },
    { id: "M10", label: "Monochrome Sand",          emoji: "🏜️", prompt: NANO_PREFIX + "Dress him in a monochrome sand-tone outfit inspired by Fear of God Essentials with tonal trousers, a neutral top, and clean neutral footwear. Make it realistic and premium." },
    { id: "M11", label: "Night Out Sheer Layer",    emoji: "🌙", prompt: NANO_PREFIX + "Dress him in a slightly sheer fitted top under a lightweight jacket, dark jeans, and sharp evening shoes. Make the result modern, realistic, and premium." },
    { id: "M12", label: "Workwear Soft Utility",    emoji: "🪖", prompt: NANO_PREFIX + "Style him in clean Carhartt WIP style cargo pants, a cropped workwear jacket, a grey t-shirt, and subtle silver jewelry. Make it realistic and stylish." },
    { id: "M13", label: "Indigo Double Denim",      emoji: "💙", prompt: NANO_PREFIX + "Dress him in a Levi's dark denim shirt, matching dark denim jeans, a leather belt, and sharp fashion sunglasses. Make it realistic and premium." },
    { id: "M14", label: "Sleek Black City",         emoji: "🖤", prompt: NANO_PREFIX + "Dress him in black straight trousers, a black rib tank top, a lightweight black jacket, and sleek black sneakers. Make it realistic, urban, and polished." },
    { id: "M15", label: "Resort Crochet Man",       emoji: "🧶", prompt: NANO_PREFIX + "Dress him in a Jacquemus-inspired crochet shirt, light trousers, and a beaded necklace. Make the result realistic, summery, and fashionable." },
    { id: "M16", label: "Brooch Detail Tailoring",  emoji: "🎖️", prompt: NANO_PREFIX + "Dress him in a relaxed blazer, tailored trousers, a clean t-shirt, and a small elegant brooch. Make it realistic and refined." },
    { id: "M17", label: "Cuffless Beanie Fit",      emoji: "🧢", prompt: NANO_PREFIX + "Style him in an oversized t-shirt, straight pants, retro sneakers, and a cuffless beanie. Make the result realistic and trendy." },
    { id: "M18", label: "Soft Prep Polo",           emoji: "🎽", prompt: NANO_PREFIX + "Dress him in a Ralph Lauren style polo shirt, light chinos, and smart loafers or slim sneakers. Make it realistic and polished." },
    { id: "M19", label: "Urban Fisherman",          emoji: "🎣", prompt: NANO_PREFIX + "Dress him in cropped trousers, a camp collar shirt, and premium fisherman sandals. Make it realistic and stylish." },
    { id: "M20", label: "Color Pop Sneaker Base",   emoji: "🌈", prompt: NANO_PREFIX + "Dress him in a clean neutral outfit with bold colorful statement sneakers as the main focus. Make the result realistic and commercially attractive." },
    { id: "M21", label: "Soft Leather Weekend",     emoji: "🧥", prompt: NANO_PREFIX + "Dress him in a soft leather jacket, a white t-shirt, straight jeans, and ankle boots. Make it realistic and premium." },
    { id: "M22", label: "Athleisure Quiet Luxury",  emoji: "🏃", prompt: NANO_PREFIX + "Dress him in a premium zip hoodie, straight trousers, a clean cap, and premium New Balance style sneakers. Make it realistic and elevated." },
    { id: "M23", label: "Ecru Denim Summer",        emoji: "🤍", prompt: NANO_PREFIX + "Dress him in ecru jeans, an icy blue shirt, and clean canvas shoes. Make the result realistic and fresh." },
    { id: "M24", label: "Striped Riviera",          emoji: "⛵", prompt: NANO_PREFIX + "Dress him in a fine striped shirt, navy trousers, Ray-Ban Aviator sunglasses, and relaxed loafers. Make it realistic and Mediterranean-chic." },
    { id: "M25", label: "Statement Shades Look",    emoji: "🕶️", prompt: NANO_PREFIX + "Style him in a minimal outfit with bold Oakley or Prada fashion sunglasses as the main focus. Make it realistic and premium." },
    { id: "M26", label: "Indie Night Loose Shirt",  emoji: "🎸", prompt: NANO_PREFIX + "Dress him in a slightly open shirt, layered silver necklaces, dark jeans, and sleek boots or loafers. Make it realistic and attractive." },
    { id: "M27", label: "Tel Aviv Gallery Black",   emoji: "🖼️", prompt: NANO_PREFIX + "Dress him in relaxed black trousers, a premium black t-shirt, a small shoulder bag, and silver jewelry. Make it realistic and artistic." },
    { id: "M28", label: "Soft Cargo Sneaker",       emoji: "🎒", prompt: NANO_PREFIX + "Dress him in clean cargo pants, a fitted t-shirt, and Nike P-6000 style sneakers. Make it realistic and trendy." },
    { id: "M29", label: "Woven Slip-On Ease",       emoji: "🪡", prompt: NANO_PREFIX + "Dress him in light stone trousers, a textured shirt, and Bottega Veneta-inspired woven slip-on shoes. Make it realistic and premium." },
    { id: "M30", label: "Luxury Tote Weekend",      emoji: "👜", prompt: NANO_PREFIX + "Dress him in straight jeans, a premium top, clean shoes, and a luxury tote bag inspired by The Row. Make it realistic and upscale." },
  ],
  women: [
    { id: "L1",  label: "Quiet Luxury",            emoji: "🤍", prompt: "Using the reference image, transform the entire outfit into a 'quiet luxury' aesthetic: a perfectly tailored fine cashmere sweater and sleek trousers in monochrome beige. Keep the facial identity exact. Soft, expensive editorial lighting." },
    { id: "L2",  label: "Athleisure 3.0",          emoji: "🏋️", prompt: "Using the reference image, transform the outfit into premium athleisure: a matching high-quality sports bra and leggings set under a chic oversized blazer. Maintain the exact facial identity and background." },
    { id: "L3",  label: "Piratecore",              emoji: "🏴‍☠️", prompt: "Using the reference image, transform the outfit into a 'piratecore' aesthetic: a billowing white ruffled blouse with distressed leather pants and a waist sash. Keep the facial identity identical." },
    { id: "L4",  label: "Digital Rainbow",         emoji: "🌈", prompt: "Using the reference image, transform the outfit into a vibrant 'digital rainbow' look featuring neon acid-green and cyber-pink color blocking. Keep the facial identity exact. High contrast lighting." },
    { id: "L5",  label: "Polka Dot Retro",         emoji: "⚫", prompt: "Using the reference image, transform the outfit into a stunning vintage dress featuring bold black-and-white polka dots of varying sizes. Keep the face, body proportions, and background exactly the same." },
    { id: "L6",  label: "Modest & Chic",           emoji: "🕊️", prompt: "Using the reference image, transform the outfit into an elegant modest look: a long-sleeve, high-neck, full-length dress in luxurious draped silk. Keep the facial identity perfectly identical. Refined studio lighting." },
    { id: "L7",  label: "Matchy-Matchy Suit",      emoji: "💙", prompt: "Using the reference image, transform the outfit into a relaxed, matching two-piece tailored suit in a soft pastel blue tone. Maintain exact facial identity and background." },
    { id: "L8",  label: "Indie Sleaze",            emoji: "🎸", prompt: "Using the reference image, transform the outfit to an 'indie sleaze' aesthetic: a vintage band tee, a worn-in black leather jacket, and skinny jeans. Keep the facial identity exact. Flash photography style." },
    { id: "L9",  label: "Dark Academia",           emoji: "📚", prompt: "Using the reference image, transform the outfit into a 'dark academia' aesthetic: a dark brown wool tweed blazer over a knit vest and tailored plaid trousers. Keep the face exact. Moody, cinematic lighting." },
    { id: "L10", label: "Resort Luxe",             emoji: "🌴", prompt: "Using the reference image, transform the outfit into luxury resort wear: a breezy, lightweight white linen matching set (loose shirt and wide pants). Keep the facial identity exact. Golden hour sunlight." },
    { id: "W1",  label: "Cool Girl Barrel Denim",  emoji: "🛢️", prompt: NANO_PREFIX + "Dress her in Levi's-inspired barrel jeans, a fitted rib tank top, a slim belt, and sleek flat shoes. Make it realistic and trendy." },
    { id: "W2",  label: "Denim on Denim Soft",     emoji: "💙", prompt: NANO_PREFIX + "Dress her in a light denim shirt, matching denim jeans, a small shoulder bag, and stylish sunglasses. Make it realistic and fashionable." },
    { id: "W3",  label: "Sneakerina City",         emoji: "👟", prompt: NANO_PREFIX + "Dress her in a slim skirt or soft mini dress, Adidas Tokyo sneakers, a Tory Burch Romy shoulder bag, and slim Prada sunglasses. Make it realistic, youthful, and premium." },
    { id: "W4",  label: "High-Vamp Ballet Rich",   emoji: "🩰", prompt: NANO_PREFIX + "Dress her in tailored pants or a midi skirt with Alaïa or Le Monde Béryl style high-vamp ballet flats. Make it realistic and elegant." },
    { id: "W5",  label: "Mom Outfit Elevated",     emoji: "👜", prompt: NANO_PREFIX + "Dress her in straight jeans, a soft knit top, a premium structured handbag, and elegant flat shoes. Make it realistic and polished." },
    { id: "W6",  label: "Icy Blue Minimal",        emoji: "🧊", prompt: NANO_PREFIX + "Dress her in an icy blue statement top or dress with silver jewelry and simple premium footwear. Make it realistic and modern." },
    { id: "W7",  label: "Butter-to-Ice Transition",emoji: "🍦", prompt: NANO_PREFIX + "Dress her in cream, butter, and baby blue tones with premium accessories. Make it realistic and refined." },
    { id: "W8",  label: "Tory Bag Everyday",       emoji: "🛍️", prompt: NANO_PREFIX + "Style her in a minimal modern outfit with a Tory Burch Romy shoulder bag as the hero item. Make it realistic and premium." },
    { id: "W9",  label: "Soft Office Girl",        emoji: "💼", prompt: NANO_PREFIX + "Dress her in wide tailored trousers, a clean vest or fitted top, and elegant ballet flats or loafers. Make it realistic and modern." },
    { id: "W10", label: "White Tank Perfect Jean",  emoji: "🤍", prompt: NANO_PREFIX + "Dress her in a white cotton tank top, perfect blue jeans, flat sandals, and gold earrings. Make it realistic and stylish." },
    { id: "W11", label: "Sporty Luxe Skirt",       emoji: "🎽", prompt: NANO_PREFIX + "Dress her in a midi skirt, a zip hoodie or sporty knit, and sleek fashion sneakers. Make it realistic and premium." },
    { id: "W12", label: "Beach Club Linen Set",    emoji: "🏖️", prompt: NANO_PREFIX + "Dress her in a matching linen set, a woven or leather bag, and premium flat sandals. Make it realistic and elegant." },
    { id: "W13", label: "Statement Sunglasses",    emoji: "🕶️", prompt: NANO_PREFIX + "Style her in a minimal outfit with bold Prada or Ray-Ban statement sunglasses as the hero accessory. Make it realistic and chic." },
    { id: "W14", label: "Maxi Denim Mood",         emoji: "👖", prompt: NANO_PREFIX + "Dress her in a maxi denim skirt, a fitted top, a slim belt, and a compact bag. Make it realistic and fashion-forward." },
    { id: "W15", label: "Dark Romantic Daywear",   emoji: "🖤", prompt: NANO_PREFIX + "Dress her in soft sheer dark layers with silver jewelry and an elegant silhouette. Make it realistic and moody." },
    { id: "W16", label: "Soft Red Accent",         emoji: "❤️", prompt: NANO_PREFIX + "Dress her in a neutral outfit with one bold red or burgundy accessory as the main visual focus. Make it realistic and premium." },
    { id: "W17", label: "Israeli Night Out Denim",  emoji: "🌙", prompt: NANO_PREFIX + "Dress her in dark jeans, a satin or slightly sheer top, a compact evening bag, and low heels or fashion sandals. Make it realistic and polished." },
    { id: "W18", label: "Cargo Feminine Balance",   emoji: "🪖", prompt: NANO_PREFIX + "Dress her in soft cargo pants, a fitted tank or t-shirt, and delicate flats or low heels. Make it realistic and trendy." },
    { id: "W19", label: "Pop Sneaker Minimal",      emoji: "🌈", prompt: NANO_PREFIX + "Dress her in a clean minimalist outfit with colorful statement sneakers as the main focus. Make it realistic and commercial." },
    { id: "W20", label: "Silver Stack Girl",        emoji: "🥈", prompt: NANO_PREFIX + "Style her in a clean outfit with layered silver necklaces, stacked silver rings, and silver bracelets. Make it realistic and stylish." },
    { id: "W21", label: "Clean Black Tube Look",    emoji: "🖤", prompt: NANO_PREFIX + "Dress her in a sleek black fitted look with a structured handbag and sharp sunglasses. Make it realistic and premium." },
    { id: "W22", label: "Crochet Summer Girl",      emoji: "🌸", prompt: NANO_PREFIX + "Dress her in a crochet top, light denim or linen bottoms, and beachy jewelry. Make it realistic and summery." },
    { id: "W23", label: "Soft Prep Tennis",         emoji: "🎾", prompt: NANO_PREFIX + "Dress her in a pleated skirt, a light knit top, slim sneakers, and white socks. Make it realistic and trendy." },
    { id: "W24", label: "Chocolate Minimal",        emoji: "🍫", prompt: NANO_PREFIX + "Dress her in a monochrome chocolate brown outfit with premium fabrics and minimal accessories. Make it realistic and luxurious." },
    { id: "W25", label: "Neutral Resort Maxi",      emoji: "🌴", prompt: NANO_PREFIX + "Dress her in a soft neutral maxi dress, premium flat sandals, and a relaxed shoulder bag. Make it realistic and elegant." },
    { id: "W26", label: "Bomber + Slip Dress",      emoji: "✈️", prompt: NANO_PREFIX + "Dress her in a cropped bomber jacket over a silky slip dress. Make it realistic and fashionable." },
    { id: "W27", label: "Balletcore",               emoji: "🩰", prompt: NANO_PREFIX + "Dress her in a delicate cardigan, a soft skirt or slim trousers, and understated ballet flats. Make it realistic and subtle." },
    { id: "W28", label: "Merlot Accent Look",       emoji: "🍷", prompt: NANO_PREFIX + "Dress her in a refined neutral outfit with a merlot-colored handbag or shoes as the main visual focus. Make it realistic and modern." },
    { id: "W29", label: "Soft Leather City",        emoji: "🧥", prompt: NANO_PREFIX + "Dress her in tailored trousers, a white top, and a soft premium leather jacket. Make it realistic and premium." },
    { id: "W30", label: "Festival Polish",          emoji: "🎪", prompt: NANO_PREFIX + "Dress her in a polished festival look with a subtle shiny top, fashion sunglasses, and styled accessories. Make it realistic and wearable." },
    { id: "W31", label: "Classic White Shirt Reset",emoji: "🤍", prompt: NANO_PREFIX + "Dress her in an oversized white shirt, straight blue jeans, hoop earrings, and a premium small handbag. Make it realistic and chic." },
    { id: "W32", label: "Soft Utility Romper",      emoji: "🪖", prompt: NANO_PREFIX + "Dress her in a soft utility romper or utility set with flat sandals and clean accessories. Make it realistic and modern." },
    { id: "W33", label: "Ice Lavender Girl",        emoji: "💜", prompt: NANO_PREFIX + "Dress her in icy lavender tones with silver jewelry and minimal premium accessories. Make it realistic and photogenic." },
    { id: "W34", label: "Gallery White Monochrome", emoji: "🤍", prompt: NANO_PREFIX + "Dress her in an all-white or cream monochrome outfit with rich fabric textures and premium accessories. Make it realistic and sophisticated." },
    { id: "W35", label: "Romy Bag + Flat Look",     emoji: "👜", prompt: NANO_PREFIX + "Dress her in slim knitwear, blue jeans, elegant ballet flats, and a Tory Burch Romy bag. Make it realistic and premium." },
  ],
} as const;

// ─── FLUX PRESETS ─────────────────────────────────────────────────────────────
const FLUX_PREFIX =
  "RAW photorealistic portrait. 100% EXACT FACIAL IDENTITY MATCH. Keep the same person, same facial proportions, original background, and exact pose. Emphasize natural skin texture and micro-details. NO plastic skin, NO CGI. Apply the following styling: ";
const FLUX_SUFFIX =
  ". Shot on ARRI Alexa 65 with ARRI Prime DNA 50mm lens, exquisite studio lighting, hyper-realistic editorial finish.";

const PRESETS_FLUX = {
  beauty: [
    { id: "B1",  label: "Bloom Skin Glow",    emoji: "🌸", prompt: "Make the person's skin look deeply hydrated, radiant, and even-toned with a 'bloom skin' complexion. Keep the exact same facial identity, hair, and background. Soft studio beauty lighting, photorealistic." },
    { id: "B2",  label: "Pimple Patches",      emoji: "⭐", prompt: "Add cute, small star-shaped hydrocolloid pimple patches to the person's cheeks. Make the surrounding skin look clear. Keep the exact same face and background." },
    { id: "B3",  label: "Mob Wife Glam",       emoji: "🖤", prompt: "Apply bold luxury makeup to the person: dark burgundy lipstick, heavy contour, and sharp eyeliner. Keep the exact same facial identity and background. Direct flash photography, high contrast." },
    { id: "B4",  label: "Clean Girl Morning",  emoji: "🤍", prompt: "Apply minimal 'clean girl' makeup to the person: brushed-up fluffy eyebrows, glossy clear lips, and a subtle pink flush on the cheeks. Keep the exact same face and background. Natural daylight." },
    { id: "B5",  label: "Rockstar Smudge",     emoji: "🎸", prompt: "Apply messy, deliberately smudged black eyeliner and smoky eyeshadow to the person's eyes. Keep the exact same face and background. Edgy rockstar aesthetic." },
    { id: "B6",  label: "Coquette Flush",      emoji: "🎀", prompt: "Apply heavy pastel pink blush across the person's cheeks and nose. Keep the exact same facial identity and background. Soft romantic, dreamy pastel glow." },
    { id: "B7",  label: "Sun-Kissed",          emoji: "☀️", prompt: "Add a warm, sun-kissed bronzer effect and delicate faux freckles across the person's nose and cheeks. Keep the exact same face and background. Golden hour sunlight." },
    { id: "B8",  label: "Y2K Frost",           emoji: "💎", prompt: "Apply retro Y2K makeup to the person: frosty metallic silver eyeshadow and high-shine lip gloss. Keep the exact same face and background. Vintage digital camera aesthetic." },
    { id: "B9",  label: "Librarian Glasses",   emoji: "🤓", prompt: "Make the person wear a pair of stylish, thick-rimmed tortoiseshell glasses. Keep the exact same facial identity, expression, and background." },
    { id: "B10", label: "90s Editorial",        emoji: "📷", prompt: "Apply 90s editorial makeup to the person: visible brown lip liner and matte skin. Keep the exact same face and background. Harsh direct camera flash, high fashion editorial look." },
    { id: "B11", label: "Golden Hour Skin",     emoji: "✨", prompt: FLUX_PREFIX + "Give her luminous golden-hour skin with Armani Luminous Silk style foundation, Charlotte Tilbury Flawless Filter glow, and soft bronzed cheeks. Make it realistic and premium." },
    { id: "B12", label: "Cool Blush Flush",     emoji: "🌷", prompt: FLUX_PREFIX + "Give her fresh cool pink blush inspired by Dior Rosy Glow or Rare Beauty Soft Pinch, with natural skin and soft lashes. Make it realistic and youthful." },
    { id: "B13", label: "Watercolor Blush",     emoji: "🎨", prompt: FLUX_PREFIX + "Give her a soft watercolor blush look inspired by Patrick Ta or Rhode Pocket Blush with clean luminous skin. Make it realistic and modern." },
    { id: "B14", label: "Blurred Matte Lip",    emoji: "💋", prompt: FLUX_PREFIX + "Give her a blurred matte lip inspired by MAC Powder Kiss or Dior Addict Lip Tint, with soft skin and subtle lashes. Make it realistic and fashionable." },
    { id: "B15", label: "Ballet Slipper Lips",  emoji: "🩰", prompt: FLUX_PREFIX + "Give her ballet-slipper pink lips inspired by Dior Addict or MAC Lustreglass, with natural skin and fresh cheeks. Make it realistic and delicate." },
    { id: "B16", label: "Glossy Red Lip",       emoji: "❤️", prompt: FLUX_PREFIX + "Give her luminous skin, soft lashes, subtle eyeliner, and glossy red lips inspired by Chanel Rouge Coco. Make it realistic, elegant, and premium." },
    { id: "B17", label: "Maroon Bordeaux Lip",  emoji: "🍷", prompt: FLUX_PREFIX + "Give her soft skin, minimal eye makeup, and a rich maroon lip inspired by MAC Diva or NARS deep berry shades. Make it realistic and elegant." },
    { id: "B18", label: "Micro Liner",          emoji: "✏️", prompt: FLUX_PREFIX + "Give her ultra-thin precise eyeliner inspired by KVD Tattoo Liner or NYX Epic Ink, with natural skin and subtle lips. Make it realistic and clean." },
    { id: "B19", label: "Brown Tightline Soft", emoji: "🤎", prompt: FLUX_PREFIX + "Give her soft brown tightline eyeliner inspired by Victoria Beckham Satin Kajal, with natural skin and neutral lips. Make it realistic and flattering." },
    { id: "B20", label: "Colorwash Lids",       emoji: "🌈", prompt: FLUX_PREFIX + "Give her a soft colorwash eye look inspired by Half Magic or Ilia liquid shadow, with clean skin and subtle lips. Make it realistic and modern." },
    { id: "B21", label: "Soft Taupe Eye",       emoji: "🪶", prompt: FLUX_PREFIX + "Give her a soft taupe eye look inspired by Natasha Denona or Makeup by Mario nude tones, with natural skin and understated lips. Make it realistic and elegant." },
    { id: "B22", label: "Icy Blue Wash",        emoji: "🧊", prompt: FLUX_PREFIX + "Give her an icy blue eye wash inspired by Chanel blue shadow or About-Face, with clean skin and soft lips. Make it realistic and stylish." },
    { id: "B23", label: "Lavender Lid",         emoji: "💜", prompt: FLUX_PREFIX + "Give her pastel lavender eyelids inspired by Dior Backstage or Huda Beauty pastel tones, with fresh cheeks and soft lashes. Make it realistic and premium." },
    { id: "B24", label: "Gold Fleck Eye",       emoji: "✨", prompt: FLUX_PREFIX + "Give her subtle gold-fleck eye makeup inspired by Pat McGrath or Stila liquid shadow, with luminous skin and neutral lips. Make it realistic and elegant." },
    { id: "B25", label: "Pearl Inner Corner",   emoji: "🤍", prompt: FLUX_PREFIX + "Give her pearl inner-corner highlights inspired by Rare Beauty or Fenty, with clean skin and light lashes. Make it realistic and fresh." },
    { id: "B26", label: "High-Shine Skin",      emoji: "💫", prompt: FLUX_PREFIX + "Give her high-shine luminous skin inspired by Dior Forever Glow, Saie Glowy Super Gel, or Merit Great Skin. Make it realistic and glossy." },
    { id: "B27", label: "Soft Peach Glow",      emoji: "🍑", prompt: FLUX_PREFIX + "Give her soft peach blush and matching lips inspired by NARS Orgasm style tones or Tower 28. Make it realistic and flattering." },
    { id: "B28", label: "Underpainting Sculpt", emoji: "🎭", prompt: FLUX_PREFIX + "Give her softly sculpted makeup inspired by Makeup by Mario SoftSculpt or Charlotte Tilbury contour wand, with natural skin and subtle blush. Make it realistic." },
    { id: "B29", label: "Clean Brow Lift",      emoji: "⬆️", prompt: FLUX_PREFIX + "Give her lifted clean brows inspired by Benefit 24-HR Brow Setter or Anastasia Brow Freeze, with natural skin and minimal makeup. Make it realistic and fresh." },
    { id: "B30", label: "No-Makeup Filter",     emoji: "🫧", prompt: FLUX_PREFIX + "Give her a no-makeup beauty look with light NARS or Kosas style concealer, subtle mascara, healthy skin, and a Clinique Black Honey style lip balm. Make it realistic and effortless." },
    { id: "B31", label: "Pink Monochrome Face", emoji: "🌸", prompt: FLUX_PREFIX + "Give her matching pink tones on eyes, cheeks, and lips inspired by Dior Rosy Glow or Rare Beauty pink shades. Make it realistic and youthful." },
    { id: "B32", label: "Soft Coral Summer",    emoji: "🪸", prompt: FLUX_PREFIX + "Give her fresh coral cheeks and lips inspired by Benefit tint or Fenty coral shades. Make it realistic and sun-kissed." },
    { id: "B33", label: "Cool Neutral Contour", emoji: "🌫️", prompt: FLUX_PREFIX + "Give her cool-toned contour inspired by Fenty Match Stix Amber or Westman Atelier Biscuit, with clean skin and understated lips. Make it realistic." },
    { id: "B34", label: "Glossed Nude Lip",     emoji: "🫦", prompt: FLUX_PREFIX + "Give her a polished nude lip inspired by Charlotte Tilbury Pillow Talk with Fenty Gloss Bomb shine, plus soft skin and subtle lashes. Make it realistic and premium." },
    { id: "B35", label: "Diffused Berry Stain", emoji: "🫐", prompt: FLUX_PREFIX + "Give her a diffused berry lip stain inspired by Dior Lip Tint, Benefit Benetint, or Rom&nd, with clean skin and subtle eye makeup. Make it realistic and modern." },
    { id: "B36", label: "Feathered Red Lip",    emoji: "🌹", prompt: FLUX_PREFIX + "Give her a feathered red lip inspired by MAC Ruby Woo or Dior red lipstick tones, with minimal eye makeup and polished skin. Make it realistic and editorial." },
    { id: "B37", label: "Face Gems Light",      emoji: "💎", prompt: FLUX_PREFIX + "Give her very delicate Half Magic style face gems near the eyes, soft luminous skin, and fresh lips. Make it realistic and playful." },
    { id: "B38", label: "Glossy Lid Nude",      emoji: "🫙", prompt: FLUX_PREFIX + "Give her glossy nude eyelids inspired by Danessa Myricks or RMS, with clean skin and nude lips. Make it realistic and modern." },
    { id: "B39", label: "Sunburn Blush",        emoji: "🌞", prompt: FLUX_PREFIX + "Give her blush across the cheeks and nose inspired by Rhode Pocket Blush or Rare Beauty, with soft skin and natural lips. Make it realistic and trendy." },
    { id: "B40", label: "Soft Bronze Eye",      emoji: "🥉", prompt: FLUX_PREFIX + "Give her a soft bronze eye look inspired by Chanel Les Beiges or Armani Eye Tint, with warm skin and neutral lips. Make it realistic and elegant." },
    { id: "B41", label: "Bare Lash Bold Lip",   emoji: "👄", prompt: FLUX_PREFIX + "Give her minimal lashes, clean elegant skin, and a strong premium lipstick color inspired by Dior or Chanel. Make it realistic and high-end." },
    { id: "B42", label: "White Waterline",      emoji: "👁️", prompt: FLUX_PREFIX + "Give her a bright fresh-eyed look with white or nude waterline eyeliner inspired by MAKE UP FOR EVER or NYX, soft skin, and natural lips. Make it realistic and awake-looking." },
    { id: "B43", label: "Rosy Concealed Skin",  emoji: "🌺", prompt: FLUX_PREFIX + "Give her rosy concealed skin with light NARS, Kosas, or Dior style concealer, fresh pink tones, and minimal eye makeup. Make it realistic and naturally perfected." },
    { id: "B44", label: "Subtle Lash Lift",     emoji: "🦋", prompt: FLUX_PREFIX + "Give her separated lifted lashes inspired by Lancôme Lash Idôle or Maybelline Sky High, with clean skin and soft lips. Make it realistic and flattering." },
    { id: "B45", label: "Dopamine Pastel Lip",  emoji: "🍬", prompt: FLUX_PREFIX + "Give her a playful pastel lip inspired by Dior Addict, YSL Candy Glaze, or MAC pastel tones, with quiet skin and minimal eye makeup. Make it realistic and youthful." },
  ],
  accessories: [
    { id: "A1",  label: "Statement Belt",      emoji: "🪢", prompt: "Add a thick black leather belt with a large, chunky gold buckle to the person's waist. Keep the exact same face, body shape, clothing, and background." },
    { id: "A2",  label: "Charms Bag",          emoji: "🎒", prompt: "Make the person carry a trendy shoulder bag covered in colorful metal charms and keychains. Keep the exact same face, posture, and background." },
    { id: "A3",  label: "Kangol Hat",          emoji: "🧢", prompt: "Make the person wear a stylish black Kangol-style flat cap on their head. Keep the exact same facial features, outfit, and background." },
    { id: "A4",  label: "Silk Headscarf",      emoji: "🧣", prompt: "Wrap a luxurious printed silk scarf elegantly around the person's head or neck in a retro 60s style. Keep the exact same face and background." },
    { id: "A5",  label: "Big Sunnies",         emoji: "🕶️", prompt: "Make the person wear oversized, vintage 1970s tinted sunglasses. Keep the exact same face, hair, outfit, and background." },
    { id: "A6",  label: "Edgy Studs",          emoji: "⚡", prompt: "Add edgy silver metal studs and spikes to the person's clothing along the shoulders and collar. Keep the exact same face, pose, and background." },
    { id: "A7",  label: "Coquette Bows",       emoji: "🎀", prompt: "Add several small, delicate pink satin bows into the person's hair and attached to their clothing. Keep the exact same face and background." },
    { id: "A8",  label: "Statement Socks",     emoji: "🧦", prompt: "Make the person wear bright, colorful patterned statement socks peeking out of their shoes. Keep the exact same face, upper body, and background." },
    { id: "A9",  label: "Luxe Tote",           emoji: "👝", prompt: "Make the person carry an elegant, minimalist beige leather tote bag. Keep the exact same face, outfit, and background." },
    { id: "A10", label: "Wedge Revival",        emoji: "👡", prompt: "Change the person's shoes to trendy, chunky platform wedge sandals. Keep the exact same face, upper body, and background." },
  ],
  tops: [
    { id: "T1",  label: "Burgundy Bomber",     emoji: "🍷", prompt: "Change the person's top layer to a trendy burgundy-colored bomber jacket with a slight nylon sheen. Keep the exact same face, pants, and background." },
    { id: "T2",  label: "Multi-Layer Vibe",    emoji: "👕", prompt: "Change the person's top to a layered look featuring a white t-shirt peeking out from under a loose dark long-sleeve shirt. Keep the exact same face and background." },
    { id: "T3",  label: "Poetcore Cardigan",   emoji: "🧶", prompt: "Change the person's top to a chunky, oversized knit cardigan in a soft oatmeal color, draped slightly off one shoulder. Keep the exact same face and background." },
    { id: "T4",  label: "Faux Fur Extra",      emoji: "🐻", prompt: "Change the person's outerwear to a massive, luxurious dark brown faux fur coat. Keep the exact same face, lighting, and background." },
    { id: "T5",  label: "Soft Prep Polo",      emoji: "🎽", prompt: "Change the person's top to a fine-knit, elegant polo sweater with a contrasting collar. Keep the exact same face, lower body, and background." },
    { id: "T6",  label: "Sheer & Lace",        emoji: "🤍", prompt: "Change the person's top to a delicate, semi-sheer black lace long-sleeve shirt over a bralette. Keep the exact same face and background." },
    { id: "T7",  label: "Utility Cargo Vest",  emoji: "🪖", prompt: "Make the person wear a tactical, multi-pocket cargo vest in olive green over their current outfit. Keep the exact same face and background." },
    { id: "T8",  label: "Napoleon Edge",       emoji: "🎖️", prompt: "Change the person's top to a structured, tailored blazer featuring prominent military-style gold brass buttons. Keep the exact same face and background." },
    { id: "T9",  label: "Crochet Summer",      emoji: "🌊", prompt: "Change the person's top to an artisanal, open-weave crochet shirt in natural cream tones. Keep the exact same face and background. Warm summer lighting." },
    { id: "T10", label: "Boho Kimono",         emoji: "🌸", prompt: "Make the person wear a flowing, sheer dark kimono with moody floral prints over their outfit. Keep the exact same face, posture, and background." },
  ],
  bottoms: [
    { id: "D1",  label: "Barrel Fit Jeans",    emoji: "🛢️", prompt: "Change the person's pants to trendy 'barrel-fit' blue jeans that curve outward at the knees and taper at the ankle. Keep the exact same face, top, and background." },
    { id: "D2",  label: "Clean Straight Denim",emoji: "👖", prompt: "Change the person's pants to classic, crisp, straight-leg dark wash denim jeans. Keep the exact same face, top, and background." },
    { id: "D3",  label: "Wide-Leg Culottes",   emoji: "🌬️", prompt: "Change the person's lower garment to wide-leg, tailored wool culottes that end just above the ankle. Keep the exact same face, top, and background." },
    { id: "D4",  label: "90s Jorts",           emoji: "✂️", prompt: "Change the person's pants to baggy, knee-length denim shorts in a vintage light blue wash. Keep the exact same face, top, and background." },
    { id: "D5",  label: "Plaid Mini/Midi",     emoji: "🏴", prompt: "Change the person's lower garment to a pleated, tartan plaid skirt in red and black. Keep the exact same face, top, and background." },
    { id: "D6",  label: "Retro Low-Rise",      emoji: "💿", prompt: "Change the person's pants to low-rise, slightly flared jeans revealing the midriff, matching a Y2K aesthetic. Keep the exact same face, top, and background." },
    { id: "D7",  label: "Satin Slip Skirt",    emoji: "🥂", prompt: "Change the person's lower garment to an elegant, flowing silk slip midi skirt in champagne color. Keep the exact same face, top, and background." },
    { id: "D8",  label: "Tailored Trackpants", emoji: "🏃", prompt: "Change the person's pants to elevated, sporty trackpants with a sleek white side stripe down the leg. Keep the exact same face, top, and background." },
    { id: "D9",  label: "Parachute Pants",     emoji: "🪂", prompt: "Change the person's pants to baggy, lightweight nylon parachute pants with drawstrings at the ankles. Keep the exact same face, top, and background." },
    { id: "D10", label: "Sheer Maxi Skirt",    emoji: "🌑", prompt: "Change the person's lower garment to a trendy, semi-sheer black lace maxi skirt worn over dark shorts. Keep the exact same face, top, and background." },
  ],
  men: [
    { id: "M1",  label: "Denim Clean Hero",       emoji: "👖", prompt: FLUX_PREFIX + "Dress him in Levi's 501 or Levi's 568 jeans, a premium white t-shirt, New Balance 550 sneakers, and Ray-Ban Wayfarer sunglasses. Make it realistic, clean, fashionable, and commercially appealing." },
    { id: "M2",  label: "Tel Aviv Minimal Linen",  emoji: "🌿", prompt: FLUX_PREFIX + "Dress him in light linen pants, an open linen shirt, a white rib tank top, and Birkenstock Arizona leather sandals in a premium COS or Massimo Dutti style. Make it realistic, stylish, and suitable for a Tel Aviv summer." },
    { id: "M3",  label: "Retro Football Street",   emoji: "⚽", prompt: FLUX_PREFIX + "Dress him in an Adidas football-style jersey, slim track pants, Adidas Samba or Adidas Tokyo sneakers, and a small crossbody bag. Make the look realistic, trendy, and street-fashion driven." },
    { id: "M4",  label: "Silver Accessories Guy",  emoji: "🥈", prompt: FLUX_PREFIX + "Style him in a clean monochrome outfit with Tom Wood style silver rings, a Vitaly silver chain necklace, and a silver metal watch. Make the result realistic, modern, and commercially attractive." },
    { id: "M5",  label: "Israeli Smart Casual",    emoji: "✨", prompt: FLUX_PREFIX + "Dress him in relaxed tailored trousers, a premium knit polo in a Reiss or Zara Studio style, and elegant loafers. Make the result polished, realistic, and stylish." },
    { id: "M6",  label: "Relaxed Barrel Denim",    emoji: "🛢️", prompt: FLUX_PREFIX + "Dress him in relaxed barrel-fit jeans inspired by Levi's loose denim, a short-sleeve button shirt, a slim leather belt, and low-profile sneakers. Make it realistic and fashionable." },
    { id: "M7",  label: "Wraparound Tech Boy",     emoji: "🔭", prompt: FLUX_PREFIX + "Style him with technical pants, a lightweight overshirt, Salomon sneakers, and Oakley wraparound sunglasses. Make the result realistic, sporty, and fashion-forward." },
    { id: "M8",  label: "Beach-to-City Luxe",      emoji: "🏖️", prompt: FLUX_PREFIX + "Dress him in relaxed trousers, a white rib tank top, an open lightweight shirt, and premium Hermès-style leather sandals. Make it realistic, polished, and effortless." },
    { id: "M9",  label: "Grandpa Sneaker Cool",    emoji: "👟", prompt: FLUX_PREFIX + "Dress him in straight pants, a premium sweatshirt, and New Balance 990 sneakers. Make it look realistic, relaxed, and stylish." },
    { id: "M10", label: "Monochrome Sand",          emoji: "🏜️", prompt: FLUX_PREFIX + "Dress him in a monochrome sand-tone outfit inspired by Fear of God Essentials with tonal trousers, a neutral top, and clean neutral footwear. Make it realistic and premium." },
    { id: "M11", label: "Night Out Sheer Layer",    emoji: "🌙", prompt: FLUX_PREFIX + "Dress him in a slightly sheer fitted top under a lightweight jacket, dark jeans, and sharp evening shoes. Make the result modern, realistic, and premium." },
    { id: "M12", label: "Workwear Soft Utility",    emoji: "🪖", prompt: FLUX_PREFIX + "Style him in clean Carhartt WIP style cargo pants, a cropped workwear jacket, a grey t-shirt, and subtle silver jewelry. Make it realistic and stylish." },
    { id: "M13", label: "Indigo Double Denim",      emoji: "💙", prompt: FLUX_PREFIX + "Dress him in a Levi's dark denim shirt, matching dark denim jeans, a leather belt, and sharp fashion sunglasses. Make it realistic and premium." },
    { id: "M14", label: "Sleek Black City",         emoji: "🖤", prompt: FLUX_PREFIX + "Dress him in black straight trousers, a black rib tank top, a lightweight black jacket, and sleek black sneakers. Make it realistic, urban, and polished." },
    { id: "M15", label: "Resort Crochet Man",       emoji: "🧶", prompt: FLUX_PREFIX + "Dress him in a Jacquemus-inspired crochet shirt, light trousers, and a beaded necklace. Make the result realistic, summery, and fashionable." },
    { id: "M16", label: "Brooch Detail Tailoring",  emoji: "🎖️", prompt: FLUX_PREFIX + "Dress him in a relaxed blazer, tailored trousers, a clean t-shirt, and a small elegant brooch. Make it realistic and refined." },
    { id: "M17", label: "Cuffless Beanie Fit",      emoji: "🧢", prompt: FLUX_PREFIX + "Style him in an oversized t-shirt, straight pants, retro sneakers, and a cuffless beanie. Make the result realistic and trendy." },
    { id: "M18", label: "Soft Prep Polo",           emoji: "🎽", prompt: FLUX_PREFIX + "Dress him in a Ralph Lauren style polo shirt, light chinos, and smart loafers or slim sneakers. Make it realistic and polished." },
    { id: "M19", label: "Urban Fisherman",          emoji: "🎣", prompt: FLUX_PREFIX + "Dress him in cropped trousers, a camp collar shirt, and premium fisherman sandals. Make it realistic and stylish." },
    { id: "M20", label: "Color Pop Sneaker Base",   emoji: "🌈", prompt: FLUX_PREFIX + "Dress him in a clean neutral outfit with bold colorful statement sneakers as the main focus. Make the result realistic and commercially attractive." },
    { id: "M21", label: "Soft Leather Weekend",     emoji: "🧥", prompt: FLUX_PREFIX + "Dress him in a soft leather jacket, a white t-shirt, straight jeans, and ankle boots. Make it realistic and premium." },
    { id: "M22", label: "Athleisure Quiet Luxury",  emoji: "🏃", prompt: FLUX_PREFIX + "Dress him in a premium zip hoodie, straight trousers, a clean cap, and premium New Balance style sneakers. Make it realistic and elevated." },
    { id: "M23", label: "Ecru Denim Summer",        emoji: "🤍", prompt: FLUX_PREFIX + "Dress him in ecru jeans, an icy blue shirt, and clean canvas shoes. Make the result realistic and fresh." },
    { id: "M24", label: "Striped Riviera",          emoji: "⛵", prompt: FLUX_PREFIX + "Dress him in a fine striped shirt, navy trousers, Ray-Ban Aviator sunglasses, and relaxed loafers. Make it realistic and Mediterranean-chic." },
    { id: "M25", label: "Statement Shades Look",    emoji: "🕶️", prompt: FLUX_PREFIX + "Style him in a minimal outfit with bold Oakley or Prada fashion sunglasses as the main focus. Make it realistic and premium." },
    { id: "M26", label: "Indie Night Loose Shirt",  emoji: "🎸", prompt: FLUX_PREFIX + "Dress him in a slightly open shirt, layered silver necklaces, dark jeans, and sleek boots or loafers. Make it realistic and attractive." },
    { id: "M27", label: "Tel Aviv Gallery Black",   emoji: "🖼️", prompt: FLUX_PREFIX + "Dress him in relaxed black trousers, a premium black t-shirt, a small shoulder bag, and silver jewelry. Make it realistic and artistic." },
    { id: "M28", label: "Soft Cargo Sneaker",       emoji: "🎒", prompt: FLUX_PREFIX + "Dress him in clean cargo pants, a fitted t-shirt, and Nike P-6000 style sneakers. Make it realistic and trendy." },
    { id: "M29", label: "Woven Slip-On Ease",       emoji: "🪡", prompt: FLUX_PREFIX + "Dress him in light stone trousers, a textured shirt, and Bottega Veneta-inspired woven slip-on shoes. Make it realistic and premium." },
    { id: "M30", label: "Luxury Tote Weekend",      emoji: "👜", prompt: FLUX_PREFIX + "Dress him in straight jeans, a premium top, clean shoes, and a luxury tote bag inspired by The Row. Make it realistic and upscale." },
  ],
  women: [
    { id: "L1",  label: "Quiet Luxury",            emoji: "🤍", prompt: "Change the person's entire outfit to a 'quiet luxury' aesthetic: a perfectly tailored fine cashmere sweater and sleek trousers in monochrome beige. Keep the exact same face and background. High-end editorial photography." },
    { id: "L2",  label: "Athleisure 3.0",          emoji: "🏋️", prompt: "Change the person's outfit to premium athleisure: a matching high-quality sports bra and leggings set under a chic oversized blazer. Keep the exact same face and background." },
    { id: "L3",  label: "Piratecore",              emoji: "🏴‍☠️", prompt: "Change the person's outfit to a 'piratecore' aesthetic: a billowing white ruffled blouse with distressed leather pants and a waist sash. Keep the exact same face and background." },
    { id: "L4",  label: "Digital Rainbow",         emoji: "🌈", prompt: "Change the person's outfit to a vibrant 'digital rainbow' look featuring neon acid-green and cyber-pink color blocking. Keep the exact same face and background." },
    { id: "L5",  label: "Polka Dot Retro",         emoji: "⚫", prompt: "Change the person's outfit to a stunning vintage dress featuring bold black-and-white polka dots of varying sizes. Keep the exact same face, body proportions, and background." },
    { id: "L6",  label: "Modest & Chic",           emoji: "🕊️", prompt: "Change the person's outfit to an elegant modest look: a long-sleeve, high-neck, full-length dress in luxurious draped silk. Keep the exact same face and background." },
    { id: "L7",  label: "Matchy-Matchy Suit",      emoji: "💙", prompt: "Change the person's outfit to a relaxed, matching two-piece tailored suit in a soft pastel blue tone. Keep the exact same face and background." },
    { id: "L8",  label: "Indie Sleaze",            emoji: "🎸", prompt: "Change the person's outfit to an 'indie sleaze' aesthetic: a vintage band tee, a worn-in black leather jacket, and skinny jeans. Keep the exact same face and background." },
    { id: "L9",  label: "Dark Academia",           emoji: "📚", prompt: "Change the person's outfit to a 'dark academia' aesthetic: a dark brown wool tweed blazer over a knit vest and tailored plaid trousers. Keep the exact same face and background." },
    { id: "L10", label: "Resort Luxe",             emoji: "🌴", prompt: "Change the person's outfit to luxury resort wear: a breezy, lightweight white linen matching set (loose shirt and wide pants). Keep the exact same face and background. Golden hour sunlight." },
    { id: "W1",  label: "Cool Girl Barrel Denim",  emoji: "🛢️", prompt: FLUX_PREFIX + "Dress her in Levi's-inspired barrel jeans, a fitted rib tank top, a slim belt, and sleek flat shoes. Make it realistic and trendy." },
    { id: "W2",  label: "Denim on Denim Soft",     emoji: "💙", prompt: FLUX_PREFIX + "Dress her in a light denim shirt, matching denim jeans, a small shoulder bag, and stylish sunglasses. Make it realistic and fashionable." },
    { id: "W3",  label: "Sneakerina City",         emoji: "👟", prompt: FLUX_PREFIX + "Dress her in a slim skirt or soft mini dress, Adidas Tokyo sneakers, a Tory Burch Romy shoulder bag, and slim Prada sunglasses. Make it realistic, youthful, and premium." },
    { id: "W4",  label: "High-Vamp Ballet Rich",   emoji: "🩰", prompt: FLUX_PREFIX + "Dress her in tailored pants or a midi skirt with Alaïa or Le Monde Béryl style high-vamp ballet flats. Make it realistic and elegant." },
    { id: "W5",  label: "Mom Outfit Elevated",     emoji: "👜", prompt: FLUX_PREFIX + "Dress her in straight jeans, a soft knit top, a premium structured handbag, and elegant flat shoes. Make it realistic and polished." },
    { id: "W6",  label: "Icy Blue Minimal",        emoji: "🧊", prompt: FLUX_PREFIX + "Dress her in an icy blue statement top or dress with silver jewelry and simple premium footwear. Make it realistic and modern." },
    { id: "W7",  label: "Butter-to-Ice Transition",emoji: "🍦", prompt: FLUX_PREFIX + "Dress her in cream, butter, and baby blue tones with premium accessories. Make it realistic and refined." },
    { id: "W8",  label: "Tory Bag Everyday",       emoji: "🛍️", prompt: FLUX_PREFIX + "Style her in a minimal modern outfit with a Tory Burch Romy shoulder bag as the hero item. Make it realistic and premium." },
    { id: "W9",  label: "Soft Office Girl",        emoji: "💼", prompt: FLUX_PREFIX + "Dress her in wide tailored trousers, a clean vest or fitted top, and elegant ballet flats or loafers. Make it realistic and modern." },
    { id: "W10", label: "White Tank Perfect Jean",  emoji: "🤍", prompt: FLUX_PREFIX + "Dress her in a white cotton tank top, perfect blue jeans, flat sandals, and gold earrings. Make it realistic and stylish." },
    { id: "W11", label: "Sporty Luxe Skirt",       emoji: "🎽", prompt: FLUX_PREFIX + "Dress her in a midi skirt, a zip hoodie or sporty knit, and sleek fashion sneakers. Make it realistic and premium." },
    { id: "W12", label: "Beach Club Linen Set",    emoji: "🏖️", prompt: FLUX_PREFIX + "Dress her in a matching linen set, a woven or leather bag, and premium flat sandals. Make it realistic and elegant." },
    { id: "W13", label: "Statement Sunglasses",    emoji: "🕶️", prompt: FLUX_PREFIX + "Style her in a minimal outfit with bold Prada or Ray-Ban statement sunglasses as the hero accessory. Make it realistic and chic." },
    { id: "W14", label: "Maxi Denim Mood",         emoji: "👖", prompt: FLUX_PREFIX + "Dress her in a maxi denim skirt, a fitted top, a slim belt, and a compact bag. Make it realistic and fashion-forward." },
    { id: "W15", label: "Dark Romantic Daywear",   emoji: "🖤", prompt: FLUX_PREFIX + "Dress her in soft sheer dark layers with silver jewelry and an elegant silhouette. Make it realistic and moody." },
    { id: "W16", label: "Soft Red Accent",         emoji: "❤️", prompt: FLUX_PREFIX + "Dress her in a neutral outfit with one bold red or burgundy accessory as the main visual focus. Make it realistic and premium." },
    { id: "W17", label: "Israeli Night Out Denim",  emoji: "🌙", prompt: FLUX_PREFIX + "Dress her in dark jeans, a satin or slightly sheer top, a compact evening bag, and low heels or fashion sandals. Make it realistic and polished." },
    { id: "W18", label: "Cargo Feminine Balance",   emoji: "🪖", prompt: FLUX_PREFIX + "Dress her in soft cargo pants, a fitted tank or t-shirt, and delicate flats or low heels. Make it realistic and trendy." },
    { id: "W19", label: "Pop Sneaker Minimal",      emoji: "🌈", prompt: FLUX_PREFIX + "Dress her in a clean minimalist outfit with colorful statement sneakers as the main focus. Make it realistic and commercial." },
    { id: "W20", label: "Silver Stack Girl",        emoji: "🥈", prompt: FLUX_PREFIX + "Style her in a clean outfit with layered silver necklaces, stacked silver rings, and silver bracelets. Make it realistic and stylish." },
    { id: "W21", label: "Clean Black Tube Look",    emoji: "🖤", prompt: FLUX_PREFIX + "Dress her in a sleek black fitted look with a structured handbag and sharp sunglasses. Make it realistic and premium." },
    { id: "W22", label: "Crochet Summer Girl",      emoji: "🌸", prompt: FLUX_PREFIX + "Dress her in a crochet top, light denim or linen bottoms, and beachy jewelry. Make it realistic and summery." },
    { id: "W23", label: "Soft Prep Tennis",         emoji: "🎾", prompt: FLUX_PREFIX + "Dress her in a pleated skirt, a light knit top, slim sneakers, and white socks. Make it realistic and trendy." },
    { id: "W24", label: "Chocolate Minimal",        emoji: "🍫", prompt: FLUX_PREFIX + "Dress her in a monochrome chocolate brown outfit with premium fabrics and minimal accessories. Make it realistic and luxurious." },
    { id: "W25", label: "Neutral Resort Maxi",      emoji: "🌴", prompt: FLUX_PREFIX + "Dress her in a soft neutral maxi dress, premium flat sandals, and a relaxed shoulder bag. Make it realistic and elegant." },
    { id: "W26", label: "Bomber + Slip Dress",      emoji: "✈️", prompt: FLUX_PREFIX + "Dress her in a cropped bomber jacket over a silky slip dress. Make it realistic and fashionable." },
    { id: "W27", label: "Balletcore",               emoji: "🩰", prompt: FLUX_PREFIX + "Dress her in a delicate cardigan, a soft skirt or slim trousers, and understated ballet flats. Make it realistic and subtle." },
    { id: "W28", label: "Merlot Accent Look",       emoji: "🍷", prompt: FLUX_PREFIX + "Dress her in a refined neutral outfit with a merlot-colored handbag or shoes as the main visual focus. Make it realistic and modern." },
    { id: "W29", label: "Soft Leather City",        emoji: "🧥", prompt: FLUX_PREFIX + "Dress her in tailored trousers, a white top, and a soft premium leather jacket. Make it realistic and premium." },
    { id: "W30", label: "Festival Polish",          emoji: "🎪", prompt: FLUX_PREFIX + "Dress her in a polished festival look with a subtle shiny top, fashion sunglasses, and styled accessories. Make it realistic and wearable." },
    { id: "W31", label: "Classic White Shirt Reset",emoji: "🤍", prompt: FLUX_PREFIX + "Dress her in an oversized white shirt, straight blue jeans, hoop earrings, and a premium small handbag. Make it realistic and chic." },
    { id: "W32", label: "Soft Utility Romper",      emoji: "🪖", prompt: FLUX_PREFIX + "Dress her in a soft utility romper or utility set with flat sandals and clean accessories. Make it realistic and modern." },
    { id: "W33", label: "Ice Lavender Girl",        emoji: "💜", prompt: FLUX_PREFIX + "Dress her in icy lavender tones with silver jewelry and minimal premium accessories. Make it realistic and photogenic." },
    { id: "W34", label: "Gallery White Monochrome", emoji: "🤍", prompt: FLUX_PREFIX + "Dress her in an all-white or cream monochrome outfit with rich fabric textures and premium accessories. Make it realistic and sophisticated." },
    { id: "W35", label: "Romy Bag + Flat Look",     emoji: "👜", prompt: FLUX_PREFIX + "Dress her in slim knitwear, blue jeans, elegant ballet flats, and a Tory Burch Romy bag. Make it realistic and premium." },
  ],
} as const;

// Archive all legacy presets (kept for safety, not used directly by the new UI catalog)
const LEGACY_PRESETS = {
  nano: PRESETS_NANO,
  flux: PRESETS_FLUX,
} as const;

// New active catalog for UI organization (reuses legacy IDs & prompts)
const ACTIVE_PRESETS = {
  men: {
    hipsters: ["M17", "M27", "M28"], // Indie / gallery / soft cargo styles
    goodBoys: ["M1", "M5", "M18"], // Clean denim / smart casual / prep
    casual: ["M6", "M9", "M20"], // Relaxed barrel denim / grandpa sneakers / color-pop base
    nightOut: ["M11", "M26"], // Night out sheer layer / indie night
    familyEvent: ["M5", "M21", "M24"], // Smart casual / leather weekend / striped riviera
  },
  women: {
    casual: ["W1", "W5", "W9"], // Barrel denim / mom outfit / soft office
    nightOut: ["W17", "W30"], // Israeli night out / festival polish
    familyEvent: ["W5", "W24", "W25"], // Elevated mom / chocolate minimal / resort maxi
    hipsterEdgy: ["L8", "W3", "W15"], // Indie sleaze / sneakerina city / dark romantic
    swimwear: ["W12"], // Beach club linen set as beach/swim-adjacent look
  },
} as const;

function findPreset(id: string, engine: Engine) {
  const catalog = engine === "flux-pro" ? PRESETS_FLUX : PRESETS_NANO;
  for (const cat of Object.values(catalog)) {
    const found = (cat as { id: string; label: string; emoji: string; prompt: string }[]).find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

async function resizeAndCompress(source: Blob, maxDim = 1024, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2D context"));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
        "image/jpeg", quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Image load error")); };
    img.src = objectUrl;
  });
}

export default function StyleBooth() {
  const videoRef           = useRef<HTMLVideoElement>(null);
  const canvasRef          = useRef<HTMLCanvasElement>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);
  const secondFileInputRef = useRef<HTMLInputElement>(null);
  const capturedBlobRef    = useRef<Blob | null>(null);
  const secondImageBlobRef  = useRef<Blob | null>(null);

  const [stream,             setStream]             = useState<MediaStream | null>(null);
  const [cameraActive,       setCameraActive]       = useState(false);
  const [inputMode,          setInputMode]          = useState<InputMode>("camera");
  const [capturedImage,      setCapturedImage]      = useState<string | null>(null);
  const [secondImagePreview, setSecondImagePreview] = useState<string | null>(null);
  const [customPrompt,       setCustomPrompt]       = useState("");
  const [step,               setStep]               = useState<AppStep>("capture");
  const [analysisText,       setAnalysisText]       = useState("");
  const [recommendedIds,     setRecommendedIds]     = useState<string[]>([]);
  const [wildcardId,         setWildcardId]         = useState<string | null>(null);
  const [activeCategory,     setActiveCategory]     = useState<CategoryKey>("beauty");
  const [selectedPresetId,   setSelectedPresetId]   = useState<string | null>(null);
  const [engine,             setEngine]             = useState<Engine>("nano-pro");
  const [outputUrl,          setOutputUrl]          = useState<string | null>(null);
  const [history,            setHistory]            = useState<string[]>([]);
  const [latency,            setLatency]            = useState<number | null>(null);
  const [statusMsg,          setStatusMsg]          = useState("");
  const [error,              setError]              = useState<string | null>(null);
  const [countdown,          setCountdown]          = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) { video.srcObject = stream; video.play().catch(() => {}); }
    else { video.srcObject = null; }
  }, [stream]);

  useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()); }, [stream]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => {
      if (countdown === 1) {
        const video = videoRef.current;
        if (!video || video.readyState < 2) { setCountdown(0); return; }
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        const offscreen = document.createElement("canvas");
        offscreen.width = w; offscreen.height = h;
        const ctx = offscreen.getContext("2d");
        if (!ctx) { setCountdown(0); return; }
        ctx.drawImage(video, 0, 0, w, h);
        offscreen.toBlob(async (b) => {
          if (!b) { setCountdown(0); return; }
          try {
            const optimized = await resizeAndCompress(b);
            capturedBlobRef.current = optimized;
            setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(optimized); });
          } finally { setCountdown(0); }
        }, "image/jpeg", 0.92);
      } else {
        setCountdown((c) => (c - 1) as 0 | 1 | 2 | 3);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });
      setStream(ms); setCameraActive(true);
    } catch { setError("גישה למצלמה נדחתה. בדוק הרשאות ורענן."); }
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null); setCameraActive(false);
  }, [stream]);

  const startCountdown = useCallback(() => {
    if (!cameraActive || countdown !== 0) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) { setError("המצלמה מתחממת — נסה שנית."); return; }
    setError(null); setCountdown(3);
  }, [cameraActive, countdown]);

  const resetToCapture = useCallback(() => {
    setCapturedImage((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setSecondImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    setCustomPrompt("");
    capturedBlobRef.current = null;
    secondImageBlobRef.current = null;
    setStep("capture"); setAnalysisText(""); setRecommendedIds([]); setWildcardId(null);
    setSelectedPresetId(null); setOutputUrl(null); setError(null);
  }, []);

  const analyzeWithGemini = useCallback(async (blob: Blob) => {
    setStep("analyzing");
    setStatusMsg("Gemini מנתח את הסטייל שלך…");
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 1024;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No 2D context"));
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          const prefix = "data:image/jpeg;base64,";
          const base64String = dataUrl.startsWith(prefix)
            ? dataUrl.slice(prefix.length)
            : dataUrl.split(",")[1] ?? "";
          resolve(base64String);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Image load error"));
        };
        img.src = objectUrl;
      });
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `שגיאת ניתוח: ${res.status}`);
      }
      const data = (await res.json()) as {
        analysisText: string;
        recommendedPresets: string[];
        wildcardPreset: string;
      };
      setAnalysisText(data.analysisText);
      setRecommendedIds(data.recommendedPresets ?? []);
      setWildcardId(data.wildcardPreset ?? null);
      if (data.recommendedPresets?.[0]) {
        const first = data.recommendedPresets[0];
        setSelectedPresetId(first);
        if      (first.startsWith("B")) setActiveCategory("beauty");
        else if (first.startsWith("A")) setActiveCategory("accessories");
        else if (first.startsWith("T")) setActiveCategory("tops");
        else if (first.startsWith("D")) setActiveCategory("bottoms");
        else if (first.startsWith("M")) setActiveCategory("men");
        else if (first.startsWith("L") || first.startsWith("W")) setActiveCategory("women");
      }
      setStep("pick-preset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "הניתוח נכשל");
      setStep("capture");
    } finally { setStatusMsg(""); }
  }, []);

  const generateLook = useCallback(async () => {
    const blob = capturedBlobRef.current;
    const preset = selectedPresetId ? findPreset(selectedPresetId, engine) : undefined;
    const hasImageB = Boolean(secondImageBlobRef.current);
    const hasCustomText = typeof customPrompt === "string" && customPrompt.trim().length > 0;
    const valid = blob && (preset || hasImageB || hasCustomText);
    if (!valid) return;
    setStep("generating");
    setStatusMsg(
      `${
        engine === "flux-pro"
          ? "FLUX 2 Pro"
          : engine === "seedream"
            ? "Seedream 5 Lite"
            : "Nano Banana Pro"
      } מייצר את הלוק שלך…`
    );
    setError(null);
    const t0 = performance.now();
    try {
      // First, compress Image A and convert to base64
      const base64A = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          const maxDim = 1024;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No 2D context"));
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          const prefix = "data:image/jpeg;base64,";
          const base64String = dataUrl.startsWith(prefix)
            ? dataUrl.slice(prefix.length)
            : dataUrl.split(",")[1] ?? "";
          resolve(base64String);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Image load error"));
        };
        img.src = objectUrl;
      });

      // Optionally compress Image B (outfit reference) with same logic as Image A
      let base64B: string | undefined;
      const blobB = secondImageBlobRef.current;
      if (blobB) {
        base64B = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(blobB);
          img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const maxDim = 1024;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("No 2D context"));
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            const prefix = "data:image/jpeg;base64,";
            const base64String = dataUrl.startsWith(prefix)
              ? dataUrl.slice(prefix.length)
              : dataUrl.split(",")[1] ?? "";
            resolve(base64String);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Image load error"));
          };
          img.src = objectUrl;
        });
      }

      // Ask Gemini to build the core fashion prompt (Image A + optional Image B + optional preset + optional custom text)
      const promptRes = await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64A: base64A,
          imageBase64B: base64B ?? null,
          presetPrompt: preset?.prompt ?? "",
          customPrompt: customPrompt.trim() || null,
        }),
      });
      if (!promptRes.ok) {
        const err = await promptRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || `שגיאת יצירת פרומפט: ${promptRes.status}`
        );
      }
      const promptData = (await promptRes.json()) as { prompt: string };

      const fullPrompt =
        (engine === "flux-pro" ? FLUX_PREFIX : NANO_PREFIX) +
        promptData.prompt +
        (engine === "flux-pro" ? FLUX_SUFFIX : NANO_SUFFIX);

      const imagesBase64 = base64B ? [base64A, base64B] : [base64A];

      const res = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: fullPrompt, imagesBase64, engine }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `שגיאה: ${res.status}`);
      }
      const result = (await res.json()) as { images: { url: string }[] };
      const url = result.images?.[0]?.url;
      if (!url) throw new Error("לא התקבלה תמונה");
      setLatency((performance.now() - t0) / 1000);
      setOutputUrl(url);
      setHistory((prev) => (prev.includes(url) ? prev : [url, ...prev]));
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "הייצור נכשל");
      setStep("pick-preset");
    } finally { setStatusMsg(""); }
  }, [selectedPresetId, engine, customPrompt]);

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const optimized = await resizeAndCompress(file);
    capturedBlobRef.current = optimized;
    setCapturedImage(URL.createObjectURL(optimized));
    await analyzeWithGemini(optimized);
    e.target.value = "";
  }, [analyzeWithGemini]);

  const handleSecondImageChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSecondImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    const optimized = await resizeAndCompress(file);
    secondImageBlobRef.current = optimized;
    setSecondImagePreview(URL.createObjectURL(optimized));
    e.target.value = "";
  }, []);

  const clearSecondImage = useCallback(() => {
    setSecondImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    secondImageBlobRef.current = null;
  }, []);

  const switchMode = useCallback((mode: InputMode) => {
    setInputMode(mode); setError(null);
    if (mode === "camera") startCamera(); else stopCamera();
    resetToCapture();
  }, [startCamera, stopCamera, resetToCapture]);

  const currentPresets =
    (engine === "flux-pro" ? PRESETS_FLUX : PRESETS_NANO)[activeCategory];

  // ── מסך תוצאה ──────────────────────────────────────────────────────────────
  if (step === "result" && outputUrl) {
    const activePreset = findPreset(selectedPresetId ?? "", engine);
    return (
      <main className="min-h-screen bg-[#0e0c10] text-white flex flex-col items-center justify-center px-5 py-12" dir="rtl">
        <div className="w-full max-w-md flex flex-col items-center gap-8">
          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c084a0] font-medium">Your Look</p>
            <h2 className="text-2xl font-bold text-[#f0eaec] tracking-tight">{activePreset?.label ?? "Free-form"}</h2>
            <p className="text-[11px] text-[#4a4450]">
              {engine === "flux-pro"
                ? "FLUX 2 Pro"
                : engine === "seedream"
                  ? "Seedream 5"
                  : "Nano Banana Pro"}
            </p>
          </div>
          <div className="relative w-full rounded-2xl overflow-hidden border border-[#2a2530]" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.6)" }}>
            <img src={outputUrl} alt="לוק חדש" className="w-full object-cover block" />
            {latency !== null && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-[#8a8090] font-mono border border-white/5">
                {latency.toFixed(1)}s
              </div>
            )}
          </div>
          <div className="w-full flex flex-col gap-3">
            <div className="flex gap-3">
              <a href={outputUrl} download target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#f0eaec] text-[#0e0c10] hover:bg-white transition-colors text-center tracking-wide">
                שמור
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(outputUrl)}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#1a3a25] text-[#4ade80] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors text-center tracking-wide">
                שתף
              </a>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("pick-preset")}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#161318] border border-[#2a2530] text-[#a09aa6] hover:border-[#c084a0] hover:text-[#f0eaec] transition-all tracking-wide">
                לוק אחר
              </button>
              <button type="button" onClick={resetToCapture}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-[#161318] border border-[#2a2530] text-[#a09aa6] hover:border-[#4a4450] hover:text-[#f0eaec] transition-all tracking-wide">
                תמונה חדשה
              </button>
            </div>
          </div>
          {history.length > 1 && (
            <div className="w-full">
              <p className="text-[10px] text-[#4a4450] uppercase tracking-widest mb-3 text-right">ניסיונות קודמים</p>
              <div className="flex gap-2 overflow-x-auto pb-1" dir="ltr">
                {history.map((url, idx) => (
                  <img key={idx} src={url} alt="hist" onClick={() => setOutputUrl(url)}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition-all border ${
                      outputUrl === url ? "border-[#c084a0] opacity-100" : "border-transparent opacity-40 hover:opacity-70"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── מסך בחירת פריסט ────────────────────────────────────────────────────────
  if (step === "pick-preset" || step === "generating") {
    return (
      <main className="min-h-screen bg-[#0e0c10] text-white flex flex-col items-center px-5 py-8" dir="rtl">
        <div className="w-full max-w-2xl flex flex-col gap-6">
          <div className="flex gap-4 items-start p-4 rounded-2xl bg-[#161318] border border-[#2a2530]">
            {capturedImage && (
              <img src={capturedImage} alt="selfie" className="w-20 h-20 object-cover rounded-xl border border-[#2a2530] flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.4em] text-[#c084a0] font-medium mb-2">AI Style Read</p>
              <p className="text-[#c8c0cc] text-sm leading-relaxed">{analysisText}</p>
              {recommendedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {recommendedIds.map((id) => {
                    const p = findPreset(id, engine);
                    return p ? (
                      <button key={id} type="button" onClick={() => setSelectedPresetId((prev) => (prev === id ? null : id))}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#c084a0]/10 text-[#c084a0] border border-[#c084a0]/20 hover:bg-[#c084a0]/20 transition-colors font-medium">
                        {p.label}
                      </button>
                    ) : null;
                  })}
                  {wildcardId && (() => {
                    const p = findPreset(wildcardId, engine);
                    return p ? (
                      <button type="button" onClick={() => setSelectedPresetId((prev) => (prev === wildcardId ? null : wildcardId))}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[#2a2218] text-[#c4a45a] border border-[#c4a45a]/20 hover:bg-[#c4a45a]/10 transition-colors font-medium">
                        ✦ {p.label}
                      </button>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest text-[#4a4450] font-medium">מנוע</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEngine("nano-banana")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all tracking-wide ${
                  engine === "nano-banana"
                    ? "bg-[#1e1a14] border-[#c4a45a]/50 text-[#c4a45a]"
                    : "bg-transparent border-[#2a2530] text-[#4a4450] hover:text-[#8a8090] hover:border-[#3a3540]"
                }`}>
                Nano Banana
              </button>
              <button
                type="button"
                onClick={() => setEngine("nano-pro")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all tracking-wide ${
                  engine === "nano-pro"
                    ? "bg-[#1e1a14] border-[#c4a45a]/50 text-[#c4a45a]"
                    : "bg-transparent border-[#2a2530] text-[#4a4450] hover:text-[#8a8090] hover:border-[#3a3540]"
                }`}>
                Nano Banana Pro
              </button>
              <button
                type="button"
                onClick={() => setEngine("nano-2")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all tracking-wide ${
                  engine === "nano-2"
                    ? "bg-[#1e1a20] border-[#4ade80]/50 text-[#bbf7d0]"
                    : "bg-transparent border-[#2a2530] text-[#4a4450] hover:text-[#8a8090] hover:border-[#3a3540]"
                }`}>
                Nano Banana 2 (Fast)
              </button>
              <button
                type="button"
                onClick={() => setEngine("flux-pro")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all tracking-wide ${
                  engine === "flux-pro"
                    ? "bg-[#141820] border-[#7090c4]/50 text-[#7090c4]"
                    : "bg-transparent border-[#2a2530] text-[#4a4450] hover:text-[#8a8090] hover:border-[#3a3540]"
                }`}>
                FLUX 2 Pro
              </button>
              <button
                type="button"
                onClick={() => setEngine("seedream")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all tracking-wide ${
                  engine === "seedream"
                    ? "bg-[#111820] border-[#8b5cf6]/50 text-[#c4b5fd]"
                    : "bg-transparent border-[#2a2530] text-[#4a4450] hover:text-[#8a8090] hover:border-[#3a3540]"
                }`}>
                Seedream 5
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#161318] border border-[#2a2530] space-y-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#8a8090] font-medium text-right">
              תמונה ב׳: השראת לבוש (אופציונלי)
            </p>
            <div className="flex items-center gap-3">
              {secondImagePreview ? (
                <>
                  <img src={secondImagePreview} alt="Outfit reference" className="w-20 h-20 object-cover rounded-xl border border-[#2a2530] flex-shrink-0" />
                  <button type="button" onClick={clearSecondImage}
                    className="text-xs text-[#8a8090] hover:text-[#c084a0] transition-colors underline">
                    הסר תמונה
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => secondFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#3a3540] hover:border-[#c084a0]/50 text-[#5a5460] hover:text-[#c084a0] transition-all text-sm">
                  <span>🖼️</span>
                  בחר תמונה
                </button>
              )}
            </div>
            <input ref={secondFileInputRef} type="file" accept="image/*" onChange={handleSecondImageChange} className="hidden" />
            <div>
              <label className="block text-[10px] uppercase tracking-[0.3em] text-[#8a8090] font-medium text-right mb-2">
                בקשות מיוחדות (אופציונלי)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="הוסף הוראות סטיילינג, צבעים, או אווירה..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[#0e0c10] border border-[#2a2530] text-[#f0eaec] placeholder-[#4a4450] text-sm resize-none focus:outline-none focus:border-[#c084a0]/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {(Object.entries(CATEGORIES) as [CategoryKey, { label: string; emoji: string }][]).map(([key, cat]) => (
              <button key={key} type="button" onClick={() => setActiveCategory(key)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold border transition-all tracking-wide ${
                  activeCategory === key
                    ? "bg-[#1e1318] border-[#c084a0]/50 text-[#c084a0]"
                    : "bg-[#161318] border-[#2a2530] text-[#5a5460] hover:text-[#9a9098] hover:border-[#3a3540]"
                }`}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2">
            {currentPresets.map((preset) => {
              const isRecommended = recommendedIds.includes(preset.id);
              const isWildcard = wildcardId === preset.id;
              const isSelected = selectedPresetId === preset.id;
              return (
                <button key={preset.id} type="button" onClick={() => setSelectedPresetId((prev) => (prev === preset.id ? null : preset.id))}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-[#1e1318] border-[#c084a0] text-[#f0eaec]"
                      : "bg-[#161318] border-[#2a2530] text-[#5a5460] hover:border-[#3a3540] hover:text-[#9a9098]"
                  }`}>
                  {(isRecommended || isWildcard) && (
                    <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isWildcard ? "bg-[#c4a45a]" : "bg-[#c084a0]"}`} />
                  )}
                  <span className="text-lg leading-none">{preset.emoji}</span>
                  <span className="text-[9px] font-semibold leading-tight tracking-wide">{preset.label}</span>
                </button>
              );
            })}
          </div>

          <button type="button" onClick={generateLook}
            disabled={step === "generating" || (!selectedPresetId && !secondImagePreview && !customPrompt.trim())}
            className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase bg-[#f0eaec] text-[#0e0c10] hover:bg-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            {step === "generating"
              ? <span className="animate-pulse text-[#6a6470]">{statusMsg || "מייצר…"}</span>
              : `Generate${selectedPresetId ? ` — ${findPreset(selectedPresetId, engine)?.label}` : secondImagePreview || customPrompt.trim() ? " (free-form)" : ""}`}
          </button>

          <button type="button" onClick={resetToCapture}
            className="text-[#3a3540] text-xs hover:text-[#6a6470] transition-colors text-center tracking-wide">
            ← חזרה לצילום
          </button>

          {error && (
            <div className="px-4 py-3.5 rounded-xl bg-[#1a0e0e] border border-[#4a1515] text-[#e09090] text-sm">
              {error}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── מסך ניתוח ──────────────────────────────────────────────────────────────
  if (step === "analyzing") {
    return (
      <main className="min-h-screen bg-[#0e0c10] text-white flex flex-col items-center justify-center gap-8" dir="rtl">
        {capturedImage && (
          <img src={capturedImage} alt="selfie" className="w-36 h-36 object-cover rounded-2xl border border-[#2a2530] opacity-50" />
        )}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border border-[#2a2530]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#c084a0] border-l-transparent border-r-transparent border-b-transparent animate-spin" />
          </div>
          <p className="text-[#5a5460] text-xs uppercase tracking-[0.4em] font-medium animate-pulse">Reading your style</p>
        </div>
      </main>
    );
  }

  // ── מסך צילום ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0e0c10] text-white flex flex-col items-center px-5 py-12" dir="rtl">
      <header className="mb-10 text-center space-y-4 w-full max-w-lg">
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#c084a0] font-medium">Style AI Studio</p>
        <h1 className="text-4xl md:text-5xl font-bold text-[#f0eaec] leading-[1.1] tracking-tight">
          גלה את הלוק<br />
          <span className="text-[#c084a0]">שמחכה לך</span>
        </h1>
        <p className="text-[#5a5460] text-sm leading-relaxed">
          העלה תמונה · AI מנתח את הסטייל שלך · קבל לוק חדש תוך שניות
        </p>
      </header>

      <div className="flex gap-1 p-1 rounded-xl bg-[#161318] border border-[#2a2530] mb-6">
        {(["camera", "upload"] as InputMode[]).map((mode) => (
          <button key={mode} onClick={() => switchMode(mode)}
            className={`px-8 py-2.5 rounded-lg text-sm font-semibold transition-all tracking-wide ${
              inputMode === mode ? "bg-[#f0eaec] text-[#0e0c10]" : "text-[#4a4450] hover:text-[#8a8090]"
            }`}>
            {mode === "camera" ? "מצלמה" : "העלאה"}
          </button>
        ))}
      </div>

      <div className="w-full max-w-lg mb-6">
        <div className="relative rounded-2xl overflow-hidden border border-[#2a2530] bg-[#0b090d] aspect-video flex flex-col items-center justify-center"
          style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)" }}>
          <video ref={videoRef} autoPlay playsInline muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
              inputMode === "camera" && cameraActive && !capturedImage && countdown === 0 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden />

          {capturedImage && (
            <>
              <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover z-[1]" />
              <div className="absolute bottom-4 left-0 right-0 z-[2] flex justify-center">
                <button type="button" onClick={resetToCapture}
                  className="px-6 py-2 rounded-lg text-xs font-semibold bg-black/70 backdrop-blur-sm border border-white/10 text-[#a09aa6] hover:text-white transition-all tracking-wide">
                  צלם מחדש
                </button>
              </div>
            </>
          )}

          {countdown > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
              <span className="text-[min(30vw,160px)] font-bold text-white/90">{countdown}</span>
            </div>
          )}

          {inputMode === "camera" && cameraActive && !capturedImage && countdown === 0 && (
            <>
              <div className="absolute bottom-4 left-0 right-0 z-[2] flex justify-center">
                <button type="button" onClick={startCountdown}
                  className="px-10 py-3 rounded-xl text-sm font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all tracking-widest uppercase">
                  צלם
                </button>
              </div>
              <div className="absolute top-3 right-3 z-[2] flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] uppercase text-[#6a6470] tracking-widest">Live</span>
              </div>
            </>
          )}

          {inputMode === "camera" && !cameraActive && (
            <button type="button" onClick={startCamera} className="flex flex-col items-center gap-4 z-[1]">
              <div className="w-14 h-14 rounded-full border border-dashed border-[#3a3540] hover:border-[#c084a0] flex items-center justify-center transition-colors">
                <span className="text-2xl">📷</span>
              </div>
              <span className="text-xs text-[#4a4450] tracking-wide">הפעל מצלמה</span>
            </button>
          )}

          {inputMode === "upload" && !capturedImage && (
            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 z-[1]">
              <div className="w-14 h-14 rounded-full border border-dashed border-[#3a3540] hover:border-[#c084a0] flex items-center justify-center transition-colors">
                <span className="text-2xl">⬆️</span>
              </div>
              <span className="text-xs text-[#4a4450] tracking-wide">בחר תמונה</span>
            </button>
          )}
        </div>
      </div>

      {capturedImage && step === "capture" && (
        <div className="w-full max-w-lg mb-6">
          <button type="button"
            onClick={async () => { const b = capturedBlobRef.current; if (b) await analyzeWithGemini(b); }}
            className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase bg-[#f0eaec] text-[#0e0c10] hover:bg-white transition-colors">
            Analyze My Style
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {error && (
        <div className="w-full max-w-lg px-4 py-3.5 rounded-xl bg-[#1a0e0e] border border-[#4a1515] text-[#e09090] text-sm">
          {error}
        </div>
      )}

      <div className="w-full max-w-lg mt-10 flex justify-center gap-8">
        {[
          { s: "capture",     label: "צילום" },
          { s: "analyzing",   label: "ניתוח" },
          { s: "pick-preset", label: "בחירה" },
          { s: "result",      label: "תוצאה" },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${step === item.s ? "bg-[#c084a0]" : "bg-[#2a2530]"}`} />
            <span className={`text-[9px] uppercase tracking-widest transition-all ${step === item.s ? "text-[#c084a0]" : "text-[#2a2530]"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
