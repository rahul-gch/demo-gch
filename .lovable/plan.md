# Add sample denim products to Sharabati's Showroom

Sharabati (Fabric Mill / Weaver, Egypt) currently has an empty Showroom. Add a small starter catalogue of denim fabrics only — matching what they actually weave (denim flat fabric, luxury denim, artisan selvedge).

## Products to add

1. **Classic Rigid Denim 13.5oz** — 100% cotton right-hand twill, indigo rope-dyed warp, non-stretch. Materials: Cotton, Indigo-dyed Cotton.
2. **Comfort Stretch Denim 10.5oz** — cotton/elastane power stretch with high recovery for skinny and slim fits. Materials: Cotton, Elastane.
3. **Artisan Selvedge Denim 14oz** — shuttle-loom selvedge with slub character and unbalanced twill. Materials: Cotton, Selvedge.
4. **Sustainable Recycled Denim 12oz** — recycled cotton blended with organic cotton, laser-friendly finish, reduced-water indigo dyeing. Materials: Recycled Cotton, Organic Cotton.
5. **Luxury Black Denim 11oz** — sulphur-black overdye with soft hand feel and colour-fast finish for premium collections. Materials: Cotton, Tencel.

Each product gets a short description, a denim fabric image, its material tags, and is published as active so connected partners can browse it and request samples.

## Technical notes

- Rows are inserted into `public.showroom_products` with `org_id = 3b85de28-c147-494a-9a05-f5ff07601423`, `is_active = true`, materials as text arrays, and one image URL each.
- No code changes: the existing Showroom workspace, product cards, and sample-order flow already read from this table.
