# Image Generation Continuation Plan

This plan is designed to be used in a new chat to resume generating the remaining AFINJU product images after hitting the generation API quota limit.

## Context
In the previous session, we generated 3 images (Hero, Detail, Lifestyle) for the first 4 **Authority Sets** (Red, Blue, Black, and Brown). These sets included the matching half-shoe, clutch purse, and Gobi cap. 

We still have **6 products** left to generate images for. They currently have temporary Unsplash placeholder URLs in `scripts/seed-more.ts`.

## Remaining Products (6 Total)
For each of these products, we need **3 images**:
1.  **Hero Shot**: Clean studio lighting, solid neutral background (beige or light grey), high-end e-commerce style.
2.  **Detail Shot**: Macro close-up showing craftsmanship, textures, stitching, or hardware. Warm dramatic lighting.
3.  **Lifestyle Shot**: Luxury editorial style, worn or held by a sharp-dressed African man in a high-end setting (hotel lobby, classic study, modern living room).

### 1. AFINJU Executive Leather Briefcase
- **Prompt Ideas**: Premium Nigerian full-grain leather briefcase, brass hardware, microsuede interior.
- **Images Needed**: Hero, Open Detail (lining/hardware), Lifestyle (executive holding it).

### 2. AFINJU Premium Leather Loafers
- **Prompt Ideas**: Hand-stitched premium men's leather loafers, classic style.
- **Images Needed**: Hero, Stitching Detail, Lifestyle (worn with tailored trousers).

### 3. AFINJU Signature Agbada Set
- **Prompt Ideas**: Luxurious three-piece Agbada set (Outer Robe, Buba, Sokoto) in premium Aso-Oke fabric with intricate hand-embroidery.
- **Images Needed**: Hero (Folded or on invisible mannequin), Embroidery Detail, Lifestyle (Worn by man standing confidently).

### 4. AFINJU Classic Leather Mules
- **Prompt Ideas**: Elegant backless leather mules, slip-on design, low stacked heel. Black/Brown/Blue options.
- **Images Needed**: Hero (Side profile), Heel/Leather Texture Detail, Lifestyle (Worn with traditional native attire).

### 5. AFINJU Premium Gobi Cap
- **Prompt Ideas**: Traditional Yoruba Fila (Gobi style), handcrafted, structured base.
- **Images Needed**: Hero (Folded traditional style), Fabric Texture Detail, Lifestyle (worn with Agbada).

### 6. AFINJU Signature Oil Perfume
- **Prompt Ideas**: Premium glass bottle, dark amber/woody tones, luxurious packaging.
- **Images Needed**: Hero (Bottle on podium), Glass/Oil Detail, Lifestyle (Bottle on a luxury vanity).

## Instructions for the Next AI Assistant
1.  Use the `generate_image` tool to create the 18 images described above.
2.  Use consistent naming conventions (e.g., `briefcase_hero`, `agbada_lifestyle`).
3.  Once generated, copy (or move) all generated `.png` files to two locations:
    - `public/products/`
    - `/Users/sulaymaanabubakr/Desktop/afinju/`
4.  Update the `scripts/seed-more.ts` file. Replace the temporary Unsplash URLs (`https://images.unsplash.com/...`) for the remaining 6 products with the new local file paths (e.g., `/products/briefcase_hero_12345.png`).
5.  If the user has provided the `service-account.json` credentials file, run the seed script to push these products to Firestore:
    ```bash
    cd functions && npm i firebase-admin -D && npx tsx ../scripts/seed-more.ts
    ```
