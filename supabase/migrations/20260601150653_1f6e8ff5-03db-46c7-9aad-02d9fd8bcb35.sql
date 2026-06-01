
-- 1. Wipe demo data
TRUNCATE public.org_documents, public.org_members, public.orgs CASCADE;

-- 2. Remove demo auth users
DELETE FROM auth.users
WHERE email IN (
  'rahul@gch.local', 'george@gch.local', 'maria@gch.local', 'admin@gch.local'
);

-- 3. Seed real-world apparel ecosystem orgs (public record)
INSERT INTO public.orgs (slug, name, type, country, region, size, tier, certifications, description, website) VALUES
-- Brands
('patagonia',       'Patagonia',              'brand',    'USA',         'Americas', 'L', 1, ARRAY['Fair Trade','bluesign','GOTS','RCS']::text[], 'Outdoor apparel brand, B Corp certified, 1% for the Planet member.', 'https://www.patagonia.com'),
('eileen-fisher',   'Eileen Fisher',          'brand',    'USA',         'Americas', 'L', 1, ARRAY['GOTS','RWS','Bluesign']::text[],            'Women''s apparel brand with circular take-back programme.', 'https://www.eileenfisher.com'),
('stella-mccartney','Stella McCartney',       'brand',    'UK',          'EU',       'L', 1, ARRAY['GOTS','GRS','LWG']::text[],                 'Luxury fashion house pioneering vegetarian and sustainable materials.', 'https://www.stellamccartney.com'),
('veja',            'Veja',                   'brand',    'France',      'EU',       'M', 1, ARRAY['Fair Trade','Organic']::text[],             'Footwear brand using wild rubber from Amazon and organic cotton.', 'https://www.veja-store.com'),
('nudie-jeans',     'Nudie Jeans',            'brand',    'Sweden',      'EU',       'M', 1, ARRAY['GOTS','Fair Wear']::text[],                 'Denim brand with lifetime free repairs and 100% organic cotton.', 'https://www.nudiejeans.com'),
-- Suppliers
('arvind',          'Arvind Limited',         'supplier', 'India',       'APAC',     'L', 2, ARRAY['GOTS','BCI','Bluesign','LEED']::text[],     'Vertically integrated textile manufacturer, denim and woven leader.', 'https://www.arvind.com'),
('welspun',         'Welspun India',          'supplier', 'India',       'APAC',     'L', 2, ARRAY['GOTS','OEKO-TEX','GRS','BCI']::text[],     'Home textiles giant supplying global retailers.', 'https://www.welspunindia.com'),
('esquel',          'Esquel Group',           'supplier', 'Hong Kong',   'APAC',     'L', 2, ARRAY['BCI','GOTS','Higg FEM']::text[],           'Premium cotton shirt manufacturer with integrated supply chain.', 'https://www.esquel.com'),
('texhong',         'Texhong Textile',        'supplier', 'China',       'APAC',     'L', 3, ARRAY['OEKO-TEX','BCI']::text[],                   'Yarn and fabric producer with operations across Asia.', 'https://www.texhong.com'),
('calik-denim',     'Calik Denim',            'supplier', 'Turkey',      'EU',       'L', 2, ARRAY['GRS','OEKO-TEX','Bluesign']::text[],       'Premium denim mill supplying European and US brands.', 'https://www.calikdenim.com'),
('continental',     'Continental Clothing',   'supplier', 'Germany',     'EU',       'M', 2, ARRAY['GOTS','Fair Wear','PETA']::text[],         'Ethical blanks manufacturer (EarthPositive, Salvage).', 'https://www.continentalclothing.com'),
-- Verifiers
('control-union',   'Control Union',          'verifier', 'Netherlands', 'EU',       'L', 2, ARRAY['ISO 17065','ISO 17021']::text[],           'Global certification body for GOTS, GRS, RCS, OCS and others.', 'https://www.controlunion.com'),
('sgs',             'SGS',                    'verifier', 'Switzerland', 'EU',       'L', 2, ARRAY['ISO 17021','SMETA','ISO 17065']::text[],   'World''s largest inspection, verification, testing and certification company.', 'https://www.sgs.com'),
('bureau-veritas',  'Bureau Veritas',         'verifier', 'France',      'EU',       'L', 2, ARRAY['ISO 17021','SMETA','ISO 17065']::text[],   'Independent third-party conformity assessment and certification.', 'https://www.bureauveritas.com'),
('intertek',        'Intertek',               'verifier', 'UK',          'EU',       'L', 2, ARRAY['ISO 17021','SMETA','OEKO-TEX']::text[],    'Total quality assurance provider for textile, retail and consumer goods.', 'https://www.intertek.com'),
('tuv-rheinland',   'TÜV Rheinland',          'verifier', 'Germany',     'EU',       'L', 2, ARRAY['ISO 17021','OEKO-TEX']::text[],            'Independent testing, inspection and certification services.', 'https://www.tuv.com'),
-- Regulators / standards bodies
('textile-exchange','Textile Exchange',       'regulator','USA',         'Americas', 'S', 1, ARRAY[]::text[],                                    'Global non-profit owner of GRS, RCS, OCS, RWS and RMS standards.', 'https://textileexchange.org'),
('gots',            'GOTS (Global Standard)', 'regulator','Germany',     'EU',       'S', 1, ARRAY[]::text[],                                    'Global Organic Textile Standard — owner of the GOTS certification.', 'https://global-standard.org'),
('zdhc',            'ZDHC Foundation',        'regulator','Netherlands', 'EU',       'S', 1, ARRAY[]::text[],                                    'Zero Discharge of Hazardous Chemicals programme for textile industry.', 'https://www.roadmaptozero.com'),
('fair-wear',       'Fair Wear Foundation',   'regulator','Netherlands', 'EU',       'S', 1, ARRAY[]::text[],                                    'Non-profit improving labour conditions in garment supply chains.', 'https://www.fairwear.org');

-- 4. Allow inserts on orgs (no INSERT policy existed; needed for users to create their own org on signup)
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "orgs insert by authenticated" ON public.orgs FOR INSERT TO authenticated WITH CHECK (true)';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
