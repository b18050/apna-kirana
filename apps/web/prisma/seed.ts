import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const products = [
  { name: "Aashirvaad Atta", nameHi: "आशीर्वाद आटा", category: "atta_dal", unit: "kg", mrpPaise: 6200, pricePaise: 5490, stockQty: 40, imageEmoji: "🌾" },
  { name: "Fortune Chawal", nameHi: "फॉर्च्यून चावल", category: "atta_dal", unit: "kg", mrpPaise: 9000, pricePaise: 8200, stockQty: 30, imageEmoji: "🍚" },
  { name: "Toor Dal", nameHi: "तूर दाल", category: "atta_dal", unit: "kg", mrpPaise: 18000, pricePaise: 16400, stockQty: 25, imageEmoji: "🟡" },
  { name: "Chana Dal", nameHi: "चना दाल", category: "atta_dal", unit: "kg", mrpPaise: 12000, pricePaise: 10800, stockQty: 20, imageEmoji: "🫘" },
  { name: "Fortune Kachi Ghani Tel", nameHi: "फॉर्च्यून तेल", category: "oil_masala", unit: "L", mrpPaise: 18000, pricePaise: 16500, stockQty: 18, imageEmoji: "🫙" },
  { name: "Tata Salt", nameHi: "टाटा नमक", category: "oil_masala", unit: "packet", mrpPaise: 2800, pricePaise: 2400, stockQty: 50, imageEmoji: "🧂" },
  { name: "Haldi powder", nameHi: "हल्दी पाउडर", category: "oil_masala", unit: "packet", mrpPaise: 4500, pricePaise: 3900, stockQty: 35, imageEmoji: "🟨" },
  { name: "Lal mirch", nameHi: "लाल मिर्च", category: "oil_masala", unit: "packet", mrpPaise: 5000, pricePaise: 4400, stockQty: 28, imageEmoji: "🌶️" },
  { name: "Amul Taaza doodh", nameHi: "अमूल दूध", category: "dairy", unit: "L", mrpPaise: 5800, pricePaise: 5600, stockQty: 24, imageEmoji: "🥛" },
  { name: "Amul Butter", nameHi: "अमूल बटर", category: "dairy", unit: "packet", mrpPaise: 5800, pricePaise: 5600, stockQty: 16, imageEmoji: "🧈" },
  { name: "Dahi (1 kg)", nameHi: "दही", category: "dairy", unit: "kg", mrpPaise: 8000, pricePaise: 7200, stockQty: 12, imageEmoji: "🥣" },
  { name: "Pyaaz", nameHi: "प्याज", category: "veggies", unit: "kg", mrpPaise: 4000, pricePaise: 3500, stockQty: 40, imageEmoji: "🧅" },
  { name: "Tamatar", nameHi: "टमाटर", category: "veggies", unit: "kg", mrpPaise: 5000, pricePaise: 4200, stockQty: 35, imageEmoji: "🍅" },
  { name: "Aloo", nameHi: "आलू", category: "veggies", unit: "kg", mrpPaise: 3000, pricePaise: 2500, stockQty: 50, imageEmoji: "🥔" },
  { name: "Hari mirch", nameHi: "हरी मिर्च", category: "veggies", unit: "g", mrpPaise: 2000, pricePaise: 1500, stockQty: 15, imageEmoji: "🫑" },
  { name: "Parle-G", nameHi: "पारले-जी", category: "snacks", unit: "packet", mrpPaise: 1000, pricePaise: 1000, stockQty: 80, imageEmoji: "🍪" },
  { name: "Maggi 2-minute", nameHi: "मैगी", category: "snacks", unit: "packet", mrpPaise: 1400, pricePaise: 1400, stockQty: 60, imageEmoji: "🍜" },
  { name: "Haldiram Bhujia", nameHi: "भुजिया", category: "snacks", unit: "packet", mrpPaise: 5500, pricePaise: 4900, stockQty: 22, imageEmoji: "🥨" },
  { name: "Surf Excel", nameHi: "सर्फ एक्सेल", category: "personal", unit: "kg", mrpPaise: 14000, pricePaise: 12800, stockQty: 14, imageEmoji: "🫧" },
  { name: "Colgate paste", nameHi: "कोलगेट", category: "personal", unit: "packet", mrpPaise: 6500, pricePaise: 5900, stockQty: 20, imageEmoji: "🦷" },
  { name: "Clinic Plus shampoo", nameHi: "क्लिनिक प्लस", category: "personal", unit: "packet", mrpPaise: 8500, pricePaise: 7900, stockQty: 12, imageEmoji: "🧴" },
];

async function main() {
  if (process.env.SEED_RESET === "true") {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.address.deleteMany();
    await prisma.pushToken.deleteMany();
    await prisma.otpChallenge.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.product.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.storeSettings.deleteMany();
  }

  const existingCount = await prisma.product.count();
  if (existingCount === 0) {
    await prisma.product.createMany({ data: products });
    console.log(`Seeded ${products.length} SKUs. IST catalog ready.`);
  } else {
    console.log(`Catalog already has ${existingCount} SKUs; skipping product seed.`);
  }

  await prisma.storeSettings.upsert({
    where: { id: "store" },
    update: {},
    create: { id: "store" },
  });

  const offerCount = await prisma.offer.count();
  if (offerCount === 0) {
    await prisma.offer.create({
      data: {
        title: "Festival sale",
        titleHi: "त्योहार सेल",
        body: "Offers will show here when the dukaanidar turns them on.",
        bodyHi: "दुकानदार चालू करेगा तब यहाँ ऑफर दिखेगा।",
        kind: "sale",
        isActive: false,
      },
    });
  }

  const password = process.env.ADMIN_PASSWORD ?? "kirana123";
  const hashed = await hash(password, 10);
  console.log(`Owner login: ${process.env.ADMIN_EMAIL ?? "owner@apnakirana.in"}`);
  console.log(`(password hash stored only in env; hash=${hashed.slice(0, 8)}…)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
