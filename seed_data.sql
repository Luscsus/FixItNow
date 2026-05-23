-- =============================================================================
-- Seed script: 50 providers, 100 customers, 100 tickets
-- All accounts use password: Password1!
-- Bcrypt hash below corresponds to that password (cost 10)
-- =============================================================================

DO $$
DECLARE
    -- -------------------------------------------------------------------------
    -- Source arrays for believable data
    -- -------------------------------------------------------------------------
    first_names TEXT[] := ARRAY[
        'James','John','Robert','Michael','William','David','Richard','Joseph',
        'Thomas','Charles','Mary','Patricia','Jennifer','Linda','Barbara',
        'Elizabeth','Susan','Jessica','Sarah','Karen','Daniel','Matthew',
        'Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua','Kenneth',
        'Emily','Ashley','Michelle','Amanda','Melissa','Laura','Rebecca',
        'Sharon','Cynthia','Kathleen'
    ];
    last_names TEXT[] := ARRAY[
        'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis',
        'Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson',
        'Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez',
        'Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis',
        'Robinson','Walker','Young','Allen','King','Wright','Scott','Torres',
        'Nguyen','Hill','Flores'
    ];
    street_names TEXT[] := ARRAY[
        'Partizanska cesta','Koroška cesta','Gosposvetska cesta','Tyrševa ulica',
        'Maistrova ulica','Prešernova ulica','Cankarjeva ulica','Gregorčičeva ulica',
        'Ulica talcev','Lackova cesta','Žolgarjeva ulica','Betnavska cesta',
        'Ptujska cesta','Cesta proletarskih brigad','Tržaška cesta','Ob Dravi',
        'Mladinska ulica','Trubarjeva ulica','Šolska ulica','Industrijska ulica'
    ];
    -- Maribor city neighbourhoods and nearby towns
    city_names TEXT[] := ARRAY[
        'Maribor','Maribor','Maribor','Maribor','Maribor',
        'Maribor','Maribor','Maribor','Limbuš','Kamnica',
        'Hoče','Ruše','Ptuj','Slovenska Bistrica','Lenart',
        'Pesnica','Šentilj','Miklavž na Dravi','Duplek','Fram'
    ];
    -- Slovenian postal codes matching the cities above
    postal_codes TEXT[] := ARRAY[
        '2000','2000','2000','2000','2000',
        '2000','2000','2000','2311','2351',
        '2311','2342','2250','2310','2230',
        '2211','2212','2204','2241','2313'
    ];
    -- Coordinates use a 16-col × 16-row grid (step 0.025° lon, 0.016° lat)
    -- anchored at (46.430, 15.490) — covers the entire Maribor metro area.
    -- Global index g: providers 0-49, customers 50-149, tickets 150-249.
    -- This guarantees every (address, lat, lon) triple is unique across all loops.
    categories TEXT[] := ARRAY[
        'PLUMBING','ELECTRICAL','CARPENTRY','PAINTING','CLEANING',
        'GARDENING','MOVING','APPLIANCE_REPAIR','HVAC','ROOFING',
        'LOCKSMITH','PEST_CONTROL','TUTORING','IT_SUPPORT','OTHER'
    ];
    ticket_statuses TEXT[] := ARRAY[
        'PENDING_APPROVAL','DECLINED','APPROVED','IN_TRANSIT',
        'PENDING_PROVIDER_INVOICE','PENDING_PAYMENT','COMPLETED','CANCELLED'
    ];
    ticket_priorities TEXT[] := ARRAY['LOW','MEDIUM','HIGH','CRITICAL'];
    service_titles TEXT[] := ARRAY[
        'Leaking Kitchen Sink',
        'Dripping Bathroom Faucet',
        'Non-functional Electrical Outlets',
        'Ceiling Fan Installation',
        'Hardwood Floor Repair',
        'Interior Apartment Painting',
        'Post-renovation Deep Clean',
        'Garden Maintenance & Lawn Mowing',
        'Apartment Moving Assistance',
        'Washing Machine Repair',
        'AC Unit Noise & Cooling Issue',
        'Roof Leak Repair',
        'Emergency Lockout',
        'Mice Infestation Extermination',
        'High School Math Tutoring',
        'Slow Computer & Malware Removal',
        'Running Toilet Repair',
        'Circuit Breaker Tripping',
        'Deck Sanding & Waterproofing',
        'Exterior Window Frame Painting',
        'Full Home Carpet Cleaning',
        'Tree Trimming & Yard Cleanup',
        'Grand Piano Relocation',
        'Dishwasher Drainage Issue',
        'Furnace Efficiency Problem',
        'Clogged Gutter Cleaning',
        'Door Lock Replacement',
        'Kitchen Ant Infestation',
        'English Tutoring for Adults',
        'Home Network Setup',
        'Burst Pipe Emergency',
        'Security Lighting Installation',
        'Custom Built-in Shelving',
        'Full Exterior House Painting',
        'Post-construction Kitchen Clean',
        'Hedge Trimming & Shrub Shaping',
        'Furniture Assembly & Arrangement',
        'Refrigerator Not Cooling',
        'Water Heater Replacement',
        'Chimney Inspection & Cleaning'
    ];
    ticket_categories TEXT[] := ARRAY[
        'PLUMBING','PLUMBING','ELECTRICAL','ELECTRICAL','CARPENTRY',
        'PAINTING','CLEANING','GARDENING','MOVING','APPLIANCE_REPAIR',
        'HVAC','ROOFING','LOCKSMITH','PEST_CONTROL','TUTORING',
        'IT_SUPPORT','PLUMBING','ELECTRICAL','CARPENTRY','PAINTING',
        'CLEANING','GARDENING','MOVING','APPLIANCE_REPAIR','HVAC',
        'ROOFING','LOCKSMITH','PEST_CONTROL','TUTORING','IT_SUPPORT',
        'PLUMBING','ELECTRICAL','CARPENTRY','PAINTING','CLEANING',
        'GARDENING','MOVING','APPLIANCE_REPAIR','HVAC','ROOFING'
    ];
    service_descriptions TEXT[] := ARRAY[
        'Kitchen sink is leaking and needs immediate repair.',
        'Bathroom faucet dripping constantly, needs replacement.',
        'Electrical outlets not working in the living room.',
        'Need ceiling fan installed in the master bedroom.',
        'Hardwood floor repair needed in the hallway.',
        'Interior painting for a 3-bedroom apartment.',
        'Deep cleaning service needed for entire house after renovation.',
        'Garden maintenance and lawn mowing required.',
        'Moving assistance needed for a 2-bedroom apartment across town.',
        'Washing machine not spinning properly during the rinse cycle.',
        'Air conditioning unit making loud noise and not cooling well.',
        'Roof leak above master bedroom during rain.',
        'Locked out of the house and need a locksmith urgently.',
        'Mice infestation in the basement, need professional exterminator.',
        'Math tutoring for high school student preparing for exams.',
        'Computer running very slow and possibly infected with malware.',
        'Toilet keeps running after flushing, wasting a lot of water.',
        'Circuit breaker keeps tripping whenever the microwave is used.',
        'Deck needs sanding, staining and waterproofing before summer.',
        'Window frames and shutters need repainting on exterior.',
        'Carpet cleaning for an entire 4-bedroom home.',
        'Tree trimming, stump removal and general yard cleanup.',
        'Grand piano needs to be moved to a new location downtown.',
        'Dishwasher not draining properly after every cycle.',
        'Furnace not heating efficiently, high energy bills this winter.',
        'Gutters clogged and need cleaning and inspection.',
        'Front and back door lock replacement needed after break-in.',
        'Ant infestation in kitchen spreading to pantry area.',
        'English language tutoring for adult professional.',
        'Home network setup, router configuration and device connectivity.',
        'Pipe burst in basement after frost, water everywhere.',
        'Outdoor security lighting installation around the perimeter.',
        'Custom built-in shelving installation in home office.',
        'Full exterior house painting including trim and garage door.',
        'Post-construction cleaning after kitchen remodel.',
        'Hedge trimming and ornamental shrub shaping in front yard.',
        'Furniture assembly and rearrangement for new home setup.',
        'Refrigerator stopped cooling, food is at risk.',
        'Water heater replacement, current unit is 15 years old.',
        'Chimney inspection, cleaning and minor tuckpointing needed.'
    ];
    provider_bios TEXT[] := ARRAY[
        'Experienced professional with over 10 years in the industry. Reliable, efficient and always on time.',
        'Licensed and fully insured specialist. Customer satisfaction is my absolute top priority.',
        'Family-owned business proudly serving the community for 15 years. Quality work at fair prices.',
        'Certified technician with expertise in both residential and commercial projects of all sizes.',
        'Dedicated professional committed to delivering excellent results on time and within budget.',
        'Award-winning service provider known for meticulous attention to detail and craftsmanship.',
        'Highly rated by hundreds of satisfied customers. Available 24/7 for emergency calls.',
        'Skilled craftsman with a passion for quality work and a track record of exceptional customer service.',
        'Advanced certifications and specialized training in the latest industry techniques and materials.',
        'Dependable expert who takes pride in every job whether it is big or small. Free estimates always.'
    ];

    -- -------------------------------------------------------------------------
    -- Runtime variables
    -- -------------------------------------------------------------------------
    bcrypt_pw      TEXT    := '$2a$10$hACwQ5/HQI6FhbIISOUVeusy3sKyUDhSq36jYjFMV4s.OioFAKCvK'; -- Password1!

    provider_ids   UUID[]   := ARRAY[]::UUID[];
    customer_ids   UUID[]   := ARRAY[]::UUID[];
    prov_loc_ids   BIGINT[] := ARRAY[]::BIGINT[];
    cust_loc_ids   BIGINT[] := ARRAY[]::BIGINT[];
    tick_loc_ids   BIGINT[] := ARRAY[]::BIGINT[];

    new_uid        UUID;
    new_loc_id     BIGINT;
    i              INT;
    j              INT;
    city_i         INT;
    fn             TEXT;
    ln             TEXT;
    lat            NUMERIC;
    lon            NUMERIC;
    street_num     INT;
    num_cats       INT;
    cat_idx        INT;
    tick_status    TEXT;
    tick_priority  TEXT;
    tick_uid       UUID;
    tick_prov_id   UUID;
    estimated      NUMERIC(10,2);
    base_ts        TIMESTAMP;
BEGIN
    base_ts := NOW() - INTERVAL '365 days';

    -- =========================================================================
    -- 1. PROVIDER LOCATIONS (50)
    --    Global grid index g = i-1 (0..49).
    --    16-column × 16-row grid; step 0.025° lon, 0.016° lat → fully unique.
    -- =========================================================================
    FOR i IN 1..50 LOOP
        city_i     := ((i - 1) % 20) + 1;
        street_num := 100 + ((i * 7 + 13) % 8900);
        lat        := 46.430 + ((i - 1) / 16) * 0.016;
        lon        := 15.490 + ((i - 1) % 16) * 0.025;

        INSERT INTO locations (address, latitude, longitude, created_at, updated_at)
        VALUES (
            street_names[((i - 1) % 20) + 1] || ' ' || street_num || ', '
                || postal_codes[city_i] || ' ' || city_names[city_i],
            lat, lon,
            base_ts + (i * INTERVAL '1 day'),
            base_ts + (i * INTERVAL '1 day')
        )
        ON CONFLICT ON CONSTRAINT uq_locations_address
            DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id INTO new_loc_id;

        prov_loc_ids := array_append(prov_loc_ids, new_loc_id);
    END LOOP;

    -- =========================================================================
    -- 2. CUSTOMER LOCATIONS (100)
    --    Global grid index g = i+49 (50..149) — no overlap with providers.
    -- =========================================================================
    FOR i IN 1..100 LOOP
        city_i     := ((i + 3 - 1) % 20) + 1;
        street_num := 200 + ((i * 11 + 7) % 7800);
        lat        := 46.430 + ((i + 49) / 16) * 0.016;
        lon        := 15.490 + ((i + 49) % 16) * 0.025;

        INSERT INTO locations (address, latitude, longitude, created_at, updated_at)
        VALUES (
            street_names[((i + 5 - 1) % 20) + 1] || ' ' || street_num || ', '
                || postal_codes[city_i] || ' ' || city_names[city_i],
            lat, lon,
            base_ts + (i * INTERVAL '8 hours'),
            base_ts + (i * INTERVAL '8 hours')
        )
        ON CONFLICT ON CONSTRAINT uq_locations_address
            DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id INTO new_loc_id;

        cust_loc_ids := array_append(cust_loc_ids, new_loc_id);
    END LOOP;

    -- =========================================================================
    -- 3. TICKET LOCATIONS (100)
    --    Global grid index g = i+149 (150..249) — no overlap with above two.
    -- =========================================================================
    FOR i IN 1..100 LOOP
        city_i     := ((i + 7 - 1) % 20) + 1;
        street_num := 50 + ((i * 17 + 3) % 9900);
        lat        := 46.430 + ((i + 149) / 16) * 0.016;
        lon        := 15.490 + ((i + 149) % 16) * 0.025;

        INSERT INTO locations (address, latitude, longitude, created_at, updated_at)
        VALUES (
            street_names[((i + 9 - 1) % 20) + 1] || ' ' || street_num || ', '
                || postal_codes[city_i] || ' ' || city_names[city_i],
            lat, lon,
            base_ts + (i * INTERVAL '6 hours'),
            base_ts + (i * INTERVAL '6 hours')
        )
        ON CONFLICT ON CONSTRAINT uq_locations_address
            DO UPDATE SET updated_at = EXCLUDED.updated_at
        RETURNING id INTO new_loc_id;

        tick_loc_ids := array_append(tick_loc_ids, new_loc_id);
    END LOOP;

    -- =========================================================================
    -- 4. PROVIDERS (50) — insert into users then providers
    -- =========================================================================
    FOR i IN 1..50 LOOP
        fn     := first_names[((i - 1) % array_length(first_names, 1)) + 1];
        ln     := last_names[((i - 1) % array_length(last_names, 1)) + 1];
        new_uid := gen_random_uuid();
        city_i  := ((i - 1) % 20) + 1;
        lat     := 46.430 + ((i - 1) / 16) * 0.016;   -- same grid as loop 1
        lon     := 15.490 + ((i - 1) % 16) * 0.025;

        INSERT INTO users (
            id, user_type, email, password,
            first_name, last_name, role, status,
            email_verified, two_factor_enabled,
            location_id, created_at, updated_at
        ) VALUES (
            new_uid, 'PROVIDER',
            lower(fn) || '.' || lower(ln) || i || '@servicepro.example.com',
            bcrypt_pw,
            fn, ln,
            'PROVIDER', 'ACTIVE',
            TRUE, FALSE,
            prov_loc_ids[i],
            base_ts + (i * INTERVAL '2 days'),
            base_ts + (i * INTERVAL '2 days')
        );

        INSERT INTO providers (
            id, location_lat, location_lon,
            price_per_hour, years_of_experience, service_radius_km,
            bio, phone_number,
            approved_at, approved_by, rejection_reason
        ) VALUES (
            new_uid, lat, lon,
            (25 + (i * 3) % 75)::NUMERIC(10,2),
            (i % 20) + 1,
            10 + (i % 40),
            provider_bios[((i - 1) % array_length(provider_bios, 1)) + 1],
            '(' || (200 + i) || ') 555-' || LPAD(((i * 97) % 9000 + 1000)::TEXT, 4, '0'),
            base_ts + ((i + 3) * INTERVAL '2 days'),
            NULL, NULL
        );

        -- Assign 1–3 categories per provider (deterministic, spread across all 15)
        num_cats := (i % 3) + 1;
        FOR j IN 1..num_cats LOOP
            cat_idx := ((i + j * 5 - 1) % array_length(categories, 1)) + 1;
            INSERT INTO provider_categories (provider_id, category)
            VALUES (new_uid, categories[cat_idx])
            ON CONFLICT DO NOTHING;
        END LOOP;

        provider_ids := array_append(provider_ids, new_uid);
    END LOOP;

    -- =========================================================================
    -- 5. CUSTOMERS (100)
    -- =========================================================================
    FOR i IN 1..100 LOOP
        fn      := first_names[((i + 9 - 1) % array_length(first_names, 1)) + 1];
        ln      := last_names[((i + 12 - 1) % array_length(last_names, 1)) + 1];
        new_uid := gen_random_uuid();

        INSERT INTO users (
            id, user_type, email, password,
            first_name, last_name, role, status,
            email_verified, two_factor_enabled,
            location_id, created_at, updated_at
        ) VALUES (
            new_uid, 'USER',
            lower(fn) || '.' || lower(ln) || i || '@customer.example.com',
            bcrypt_pw,
            fn, ln,
            'CUSTOMER', 'ACTIVE',
            TRUE, FALSE,
            cust_loc_ids[i],
            base_ts + (i * INTERVAL '3 days'),
            base_ts + (i * INTERVAL '3 days')
        );

        customer_ids := array_append(customer_ids, new_uid);
    END LOOP;

    -- =========================================================================
    -- 6. TICKETS (100)
    -- =========================================================================
    FOR i IN 1..100 LOOP
        tick_uid      := customer_ids[((i - 1) % array_length(customer_ids, 1)) + 1];
        tick_status   := ticket_statuses[((i - 1) % array_length(ticket_statuses, 1)) + 1];
        tick_priority := ticket_priorities[((i - 1) % array_length(ticket_priorities, 1)) + 1];

        -- Only assign a provider for tickets that are past approval
        IF tick_status IN ('APPROVED','IN_TRANSIT','PENDING_PROVIDER_INVOICE','PENDING_PAYMENT','COMPLETED') THEN
            tick_prov_id := provider_ids[((i - 1) % array_length(provider_ids, 1)) + 1];
        ELSE
            tick_prov_id := NULL;
        END IF;

        -- Only set estimated cost when an invoice has been raised or paid
        IF tick_status IN ('PENDING_PROVIDER_INVOICE','PENDING_PAYMENT','COMPLETED') THEN
            estimated := (50 + ((i * 23) % 950))::NUMERIC(10,2);
        ELSE
            estimated := NULL;
        END IF;

        INSERT INTO tickets (
            user_id, location_id, service_type, category, description,
            assigned_service_provider_id, status, priority,
            estimated_cost, created_at, updated_at
        ) VALUES (
            tick_uid,
            tick_loc_ids[i],
            service_titles[((i - 1) % array_length(service_titles, 1)) + 1],
            ticket_categories[((i - 1) % array_length(ticket_categories, 1)) + 1],
            service_descriptions[((i - 1) % array_length(service_descriptions, 1)) + 1],
            tick_prov_id,
            tick_status,
            tick_priority,
            estimated,
            base_ts + (i * INTERVAL '4 days'),
            base_ts + (i * INTERVAL '4 days') + INTERVAL '2 hours'
        );
    END LOOP;

    RAISE NOTICE 'Seed complete — 50 providers, 100 customers, 100 tickets inserted.';
END $$;
