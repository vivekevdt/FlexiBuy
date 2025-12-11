
import 'dotenv/config';                   
import { createClient } from "@supabase/supabase-js";
import { faker } from "@faker-js/faker";

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const items = [];
  const categories = ["electronics", "clothes", "home", "books", "shoes"];

  for (let i = 0; i < 500; i++) {
    items.push({
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
      category: categories[Math.floor(Math.random() * categories.length)],
      image_url: faker.image.urlPicsumPhotos()
    });
  }

  await client.from("products").insert(items);
}

run();
