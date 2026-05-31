#!/usr/bin/env python3
"""
FixItNow — API seed script
Generates 50 providers, 50 users and 100 tickets.
All names are Slovene, all locations are within ~100 km of Maribor.
~40 % of providers and ~30 % of users get a profile picture.
~40 % of tickets get 1-3 category-relevant images.

Why providers are inserted via the DB
──────────────────────────────────────
The provider registration endpoint calls Nominatim (OpenStreetMap) to geocode
the supplied address before saving.  In many dev environments Nominatim is
unreachable (corporate proxy, Docker network isolation, etc.), causing every
registration to fail with HTTP 400.  Inserting providers directly through
psycopg2 uses pre-calculated coordinates and skips the geocoding call
entirely, which is the same approach used in seed_data.sql.

Requirements:
    pip install requests psycopg2-binary

Usage:
    python seed_api.py
"""

import random
import sys
import time
import uuid as _uuid
from datetime import datetime, timedelta
from typing import Optional

import psycopg2
import requests

# ──────────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ──────────────────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8080"

ADMIN_EMAIL    = "luka1.grobelnik@gmail.com"
ADMIN_PASSWORD = "Geslo123!"

DB_CONFIG = {
    "host":     "localhost",
    "port":     5433,
    "dbname":   "backend_db",
    "user":     "postgres",
    "password": "postgres",
}

SEED_PASSWORD = "Password1!"

# Bcrypt hash of SEED_PASSWORD ("Password1!", cost 10)
# Used for direct DB inserts – avoids requiring bcrypt in Python.
SEED_PASSWORD_HASH = "$2a$10$hACwQ5/HQI6FhbIISOUVeusy3sKyUDhSq36jYjFMV4s.OioFAKCvK"

# ──────────────────────────────────────────────────────────────────────────────
# SLOVENE NAMES
# ──────────────────────────────────────────────────────────────────────────────
MALE_FIRST = [
    "Luka", "Rok", "Andrej", "Matej", "Jure", "Gregor", "Nejc", "Miha",
    "Blaž", "Tomaž", "Peter", "Simon", "Aleš", "Boštjan", "Marko", "Igor",
    "Tadej", "Janez", "Borut", "Tine", "Klemen", "Žiga", "Matic", "Urban",
    "Primož", "Jernej", "Valter", "Dejan", "Goran", "Renato",
]
FEMALE_FIRST = [
    "Ana", "Maja", "Petra", "Katja", "Nina", "Tina", "Sara", "Eva",
    "Metka", "Nataša", "Mateja", "Sandra", "Barbara", "Alenka", "Irena",
    "Mojca", "Vesna", "Karmen", "Urška", "Špela", "Živa", "Nuša", "Lea",
    "Ines", "Helena", "Simona", "Darja", "Renata", "Slavica", "Lidija",
]
LAST_NAMES = [
    "Novak", "Horvat", "Kovačič", "Krajnc", "Potočnik", "Kolar", "Zupančič",
    "Žnidarič", "Majcen", "Vogel", "Mlakar", "Hribar", "Oblak", "Štefanič",
    "Rupnik", "Gašparič", "Sušnik", "Rant", "Leskovec", "Kerec", "Žagar",
    "Breznik", "Pušnik", "Šenk", "Veber", "Gaberc", "Škorjanc", "Celar",
    "Toplak", "Fras", "Cafuta", "Vukovic", "Planinc", "Štuhec", "Kokol",
    "Ferlinc", "Divjak", "Herič", "Meznarič", "Vrečko",
]

# ──────────────────────────────────────────────────────────────────────────────
# LOCATIONS  – cities within ~100 km of Maribor
#
# Providers: pre-calculated coordinates → geocoding is NOT called.
# Users / Tickets: location is stored as plain text; no geocoding needed.
# ──────────────────────────────────────────────────────────────────────────────
LOCATIONS = [
    {"city": "Maribor",            "postal": "2000", "country": "Slovenia",
     "lat": 46.5547, "lon": 15.6467,
     "streets": ["Partizanska cesta", "Gosposvetska cesta", "Koroška cesta",
                 "Tržaška cesta", "Maistrova ulica", "Ulica talcev",
                 "Betnavska cesta", "Prešernova ulica"]},
    {"city": "Ptuj",               "postal": "2250", "country": "Slovenia",
     "lat": 46.4200, "lon": 15.8692,
     "streets": ["Prešernova ulica", "Osojnikova cesta", "Ormoška cesta"]},
    {"city": "Celje",              "postal": "3000", "country": "Slovenia",
     "lat": 46.2311, "lon": 15.2682,
     "streets": ["Mariborska cesta", "Prešernova ulica", "Cankarjeva ulica"]},
    {"city": "Velenje",            "postal": "3320", "country": "Slovenia",
     "lat": 46.3591, "lon": 15.1115,
     "streets": ["Šaleška cesta", "Prešernova cesta", "Tomšičeva ulica"]},
    {"city": "Slovenj Gradec",     "postal": "2380", "country": "Slovenia",
     "lat": 46.5134, "lon": 15.0806,
     "streets": ["Francetova cesta", "Partizanska cesta", "Glavni trg"]},
    {"city": "Murska Sobota",      "postal": "9000", "country": "Slovenia",
     "lat": 46.6643, "lon": 16.1662,
     "streets": ["Lendavska ulica", "Prešernova ulica", "Štefanova ulica"]},
    {"city": "Ljutomer",           "postal": "9240", "country": "Slovenia",
     "lat": 46.5194, "lon": 16.0138,
     "streets": ["Prešernova ulica", "Ormoška cesta"]},
    {"city": "Ormož",              "postal": "2270", "country": "Slovenia",
     "lat": 46.4088, "lon": 16.1511,
     "streets": ["Ptujska cesta", "Kolodvorska ulica"]},
    {"city": "Lenart",             "postal": "2230", "country": "Slovenia",
     "lat": 46.5760, "lon": 15.8317,
     "streets": ["Ptujska cesta", "Maistrova ulica"]},
    {"city": "Ruše",               "postal": "2342", "country": "Slovenia",
     "lat": 46.5391, "lon": 15.5171,
     "streets": ["Mariborska cesta", "Šolska ulica"]},
    {"city": "Radlje ob Dravi",    "postal": "2360", "country": "Slovenia",
     "lat": 46.6142, "lon": 15.2244,
     "streets": ["Mariborska cesta", "Koroška cesta"]},
    {"city": "Šentjur",            "postal": "3230", "country": "Slovenia",
     "lat": 46.2195, "lon": 15.3963,
     "streets": ["Celjska cesta", "Mestna ulica"]},
    {"city": "Šmarje pri Jelšah",  "postal": "3240", "country": "Slovenia",
     "lat": 46.2286, "lon": 15.5166,
     "streets": ["Vegova ulica", "Borštnikova ulica"]},
    {"city": "Slovenska Bistrica", "postal": "2310", "country": "Slovenia",
     "lat": 46.3913, "lon": 15.5718,
     "streets": ["Partizanska cesta", "Kolodvorska ulica", "Trg svobode"]},
    {"city": "Gornja Radgona",     "postal": "9250", "country": "Slovenia",
     "lat": 46.6758, "lon": 15.9979,
     "streets": ["Partizanska ulica", "Maistrova ulica"]},
]

# ──────────────────────────────────────────────────────────────────────────────
# SERVICE CATEGORIES
# ──────────────────────────────────────────────────────────────────────────────
ALL_CATEGORIES = [
    "PLUMBING", "ELECTRICAL", "CARPENTRY", "PAINTING", "CLEANING",
    "GARDENING", "MOVING", "APPLIANCE_REPAIR", "HVAC", "ROOFING",
    "LOCKSMITH", "PEST_CONTROL", "TUTORING", "IT_SUPPORT", "OTHER",
]
COMMON_CATEGORIES = [
    "PLUMBING", "ELECTRICAL", "CARPENTRY", "PAINTING",
    "CLEANING", "GARDENING", "APPLIANCE_REPAIR",
]

# ──────────────────────────────────────────────────────────────────────────────
# PROVIDER BIOS  (Slovene, {years} replaced at runtime)
# ──────────────────────────────────────────────────────────────────────────────
PROVIDER_BIOS = {
    "PLUMBING":        "Specialist za vodovodne instalacije z {years} leti izkušenj. Hitro in zanesljivo odpravljam napake pri vodovodnih napeljavah, kopalniški opremi in kuhinjskih elementih.",
    "ELECTRICAL":      "Certificiran elektrotehnik z {years} leti prakse pri elektroinštalacijah v stanovanjih in poslovnih prostorih. Hitra odzivnost in garancija na delo.",
    "CARPENTRY":       "Izkušen mizar z {years} leti v industriji. Specializiran za notranje mizarstvo, popravilo pohištva po naročilu in vgradnjo lesenih tal.",
    "PAINTING":        "Strokovni pleskar z {years} leti izkušenj. Barvam notranjost in fasade, zagotavljam visokokakovostne premaze in urejen videz prostora.",
    "CLEANING":        "Profesionalna čistilna storitev z {years} leti delovanja. Ponujam generalna in redna čiščenja stanovanj, pisarn in industrijskih prostorov.",
    "GARDENING":       "Izkušeni vrtnar z {years} leti prakse. Vzdržujem in urejam vrtove, sadne nasade in zelene površine po vaših željah.",
    "MOVING":          "Zanesljiv selitveni servis z {years} leti izkušenj. Skrbno ravnam s pohištvom in vrednostnimi predmeti, organiziram celotno selitev.",
    "APPLIANCE_REPAIR":"Pooblaščeni serviser gospodinjskih aparatov z {years} leti izkušenj. Hitri odzivni časi in garancija na vsa opravljena popravila.",
    "HVAC":            "Specialist za klimatske naprave in ogrevalne sisteme z {years} leti izkušenj. Certificiran tehnik za montažo, vzdrževanje in popravila.",
    "ROOFING":         "Izkušen krovač z {years} leti prakse. Izvajam popravila in sanacije vseh vrst streh, tesnenje dimnikov in žlebov.",
    "LOCKSMITH":       "Ključavničar z {years} leti izkušenj. Odpiranje vrat brez poškodb, zamenjava ključavnic in namestitev varnostnih vrat – dosegljiv 24/7.",
    "PEST_CONTROL":    "Strokovno zatiranje škodljivcev z {years} leti izkušenj. Uporabljam varne in ekološko prijazne metode z garancijo na izvedbo.",
    "TUTORING":        "Diplomiran strokovnjak z {years} leti pedagoškega dela. Nudim individualne inštrukcije, prilagojene tempu in potrebam učenca.",
    "IT_SUPPORT":      "IT strokovnjak z {years} leti izkušenj. Servisiranje računalnikov, nastavitev omrežij in programske opreme za dom in podjetja.",
    "OTHER":           "Splošni mojster z {years} leti izkušenj pri raznih hišnih opravilih. Prihajam na dom in rešim vsako težavo hitro ter po ugodnih cenah.",
}

# ──────────────────────────────────────────────────────────────────────────────
# TICKET TEMPLATES  (serviceType, description)  –  Slovene
# ──────────────────────────────────────────────────────────────────────────────
TICKET_TEMPLATES = {
    "PLUMBING": [
        ("Uhajanje vode pod pultom",      "Pod kuhinjskim pultom puška voda – verjetno razpokana cev ali spoj. Prosim za čim prejšnji pregled in popravilo."),
        ("Zamašen odtok v kopalnici",     "Odtok v kopalnici je popolnoma zamazan; voda stoji in ne odteka. Potrebna urgentna rešitev."),
        ("Zamenjava pipe v kuhinji",       "Stara kuhinjska pipa nenehno kaplja. Imam že novo pipo, potrebujem le montažo."),
        ("Popravilo WC kotličke",          "WC kotliček nenehno teče in povzroča visok račun za vodo. Potrebna zamenjava notranjega mehanizma."),
        ("Namestitev tuš kabine",          "Kupil sem novo tuš kabino in potrebujem strokovno montažo v kopalnici."),
    ],
    "ELECTRICAL": [
        ("Vtičnica ne deluje v dnevni sobi",      "Vtičnica v dnevni sobi ne daje napetosti. Prosim za pregled in zamenjavo, če je potrebno."),
        ("Namestitev LED luči v hodniku",          "Želim namestiti tri LED svetilke v hodniku. Imam že fiksirane točke, potrebujem električno priključitev."),
        ("Varovalka se stalno izklopi",            "Varovalka za kuhinjski tokokrog se ponavlja izklopi pri hkratni uporabi aparatov. Prosim za pregled napeljave."),
        ("Namestitev zunanjega senzorja gibanja",  "Potrebujem namestitev varnostne luči z detektorjem gibanja na fasadi hiše."),
        ("Interfon ne deluje",                     "Zvonec pri interfonu deluje, a vrat na daljavo ne morem odkleniti. Verjetna okvara elektronike."),
    ],
    "CARPENTRY": [
        ("Popravilo vhodnih vrat",         "Vhodna vrata se ne zapirajo pravilno in prepuščajo hlad. Potrebna nastavitev ali popravilo."),
        ("Montaža police v otroški sobi",  "Imam kupljeno leseno polico (180 cm), ki jo je treba varno pritrditi na steno v otroški sobi."),
        ("Popravilo kuhinjske omare",      "Kuhinjska omara se ne odpira pravilno – tir za drsna vrata je polomljen."),
        ("Popravilo dvignjenega parketa",  "V dnevni sobi se je dvignilo pet parketnih desk. Potrebno pritrditev in brušenje."),
        ("Vgradnja garderobne omare",      "Potrebujem montažo garderobne omare IKEA PAX v spalnici (skupaj 9 elementov)."),
    ],
    "PAINTING": [
        ("Barvanje dnevne sobe",           "Dnevna soba (~40 m²) potrebuje novo plast barve. Barva je izbrana, iščem zanesljivega izvajalca."),
        ("Obnova zunanje fasade",          "Fasada hiše je bila nazadnje pleskana pred 10 leti in potrebuje celovito obnovo."),
        ("Barvanje otroške sobe",          "Otroška soba (~15 m²) zahteva prebarv v svetlo modro in belo. Možne ilustracije na steni."),
        ("Pleskanje skupnega stopnišča",   "Skupno stopnišče (3 etaže) v večstanovanjski hiši potrebuje osvežitev."),
        ("Antikorozijska zaščita ograje",  "Kovinska ograja okrog hiše je zahrjavela; potrebno peskarjenje in antikorozijska barva."),
    ],
    "CLEANING": [
        ("Generalno čiščenje po selitvi",   "60 m² stanovanje po selitvi potrebuje temeljito čiščenje, vključno z okni in ploščicami."),
        ("Tedensko čiščenje pisarne",        "Iščem zanesljivega čistilca za tedensko čiščenje pisarne (~120 m²)."),
        ("Čiščenje po gradbenih delih",      "Po prenovi kopalnice je po stanovanju ogromno prahu in madežev – potrebno generalno čiščenje."),
        ("Globinsko pranje preproge",        "Preproga v dnevni sobi (4×3 m) ima stare madeže. Iščem strokovni pralni servis."),
        ("Čiščenje strešnih oken",           "Šest strešnih oken je umazanih od znotraj in zunaj. Potrebujem varno in temeljito čiščenje."),
    ],
    "GARDENING": [
        ("Košnja in urejanje robov",               "Travnik (~500 m²) je treba pokositi in urediti robove ob poti ter ograji."),
        ("Spomladanski rez sadnega drevja",        "Imam pet sadnih dreves (jablane, hruške), ki jih je treba porezati pred cvetenjem."),
        ("Ureditev zelenjavnih gredic",            "Postaviti želim dve novi gredici (2×5 m) z jeklenimi okvirji in napolniti z vrtno prstjo."),
        ("Odstranitev panja",                      "Po poseku drevesa je ostal velik panj, ki ga je treba popolnoma uklaniti."),
        ("Namestitev namakalnega sistema",         "Potrebujem namestitev avtomatskega namakalnega sistema za zelenjavni vrt (~50 m²)."),
    ],
    "MOVING": [
        ("Selitev garsonjere",                 "Selim se iz garsonjere (30 m²) v 2-sobno stanovanje v istem mestu. Imate prevoz in montažo?"),
        ("Transport velikega kavča",           "Potrebujem prevoz kavča in otomana (skupaj ~3 m) na drug naslov v mestu."),
        ("Selitev pisarniških prostorov",      "Podjetje se seli; 10 delovnih mest z računalniki, mizami in omarami."),
        ("Dostava gospodinjskih aparatov",     "Kupil sem hladilnik in pomivalni stroj; potrebujem dostavo, namestitev in priklop."),
        ("Selitev s sestavljanjem pohištva",   "Tro-sobno stanovanje; iščem ekipo za pakiranje, prevoz in sestavo IKEA pohištva."),
    ],
    "APPLIANCE_REPAIR": [
        ("Pralni stroj ne odtaka",         "Po pranju pralni stroj ne odtaka vode. Verjetno je zamašen filter ali okvarjena črpalka."),
        ("Hladilnik ne hladi",             "Hladilnik ne dosega nastavljene temperature. Vsebina se kvari – potrebna urgentna diagnoza."),
        ("Pomivalni stroj pušča vodo",     "Med delovanjem pomivalnega stroja se nabira voda na tleh. Potrebno hitro popravilo."),
        ("Pečica se ne ogreje pravilno",   "Električna pečica ne doseže nastavljene temperature. Verjetno okvarjen grelni element."),
        ("Sušilni stroj oddaja glasen zvok","Sušilni stroj med delovanjem brenči in vibrira bolj kot običajno. Potrebna diagnoza."),
    ],
    "HVAC": [
        ("Letni servis klimatske naprave",     "Pred poletno sezono potrebujem servis in dezinfekcijo filtrov klimatske naprave."),
        ("Montaža split klimatske naprave",    "Kupil sem split klimatsko napravo za dnevno sobo. Potrebujem montažo notranje in zunanje enote."),
        ("Plinski kotel ne deluje",            "Plinski kotel se je pokvaril in hiša je brez ogrevanja. Potreben urgentni servisni obisk."),
        ("Zamenjava termostatnega ventila",    "Termostatski ventil na radiatorju v spalnici kaplja. Potrebujem zamenjavo."),
        ("Čiščenje prezračevalnega kanala",    "Kuhinjski prezračevalni kanal je zamašen z maščobo. Potrebno strokovno čiščenje."),
    ],
    "ROOFING": [
        ("Sanacija strehe po toči",        "Po nedavnem neurju s točo so se poškodovale strešne plošče. Potrebna ocena škode in popravilo."),
        ("Zamenjava razpokanih strešnikov","Na strehi je pet razpokanih strešnikov, ki puščajo med dežjem. Treba jih je zamenjati."),
        ("Tesnenje okrog dimnika",         "Okrog dimnika se nabira voda, ki teče v podstrešje. Potrebno tesnenje in hidroizolacija."),
        ("Čiščenje zamašenih žlebov",      "Žlebi so zamašeni z listjem; voda se preliva in ogroža temelje. Potrebno čiščenje."),
        ("Montaža snegobrana",             "Pred zimsko sezono potrebujem namestitev snegobrana na delu strehe nad vhodom."),
    ],
    "LOCKSMITH": [
        ("Ključ se je zlomil v ključavnici",    "Ključ se je zlomil v ključavnici vhodnih vrat. Zaklenjen sem zunaj – prosim za urgentno pomoč."),
        ("Zamenjava ključavnice po vlomu",      "Po vlomilskem poskusu je ključavnica poškodovana. Potrebujem varnostno zamenjavo."),
        ("Namestitev protivlomnih vrat",        "Želim namestiti certificirana protivlomna vrata (razred WK2) na vhod v stanovanje."),
        ("Duplikat avtomobilskega ključa",      "Izgubil sem en ključ od avtomobila. Potrebujem duplikat z daljinskim upravljalnikom."),
        ("Varnostni sef se ne odpre",           "Vgradni sef ne sprejema kode. Verjetno je prišlo do napake v elektroniki."),
    ],
    "PEST_CONTROL": [
        ("Kolonija mravelj v kuhinji",      "V kuhinji se je pojavila kolonija mravelj, ki prihajajo skozi razpoko pri oknu. Potrebno tretiranje."),
        ("Podgane v kleti",                 "V kleti so sledovi podgan; zvoke slišim ponoči. Potrebujem strokovno dezinsekcijo."),
        ("Sršenovo gnezdo v podstrešju",    "V podstrešju je aktivno sršenovo gnezdo. Potrebujem varno in strokovno odstranitev."),
        ("Ščurki v stanovanju",             "V kuhinji sem opazil ščurke. Kljub lastnim poskusom jih ne morem pregnati."),
        ("Miši kljub pastim",               "Kljub miši-lovkam se glodavci vračajo. Potrebujem strokovno dezinsekcijo celotne hiše."),
    ],
    "TUTORING": [
        ("Inštrukcije iz matematike za 8. razred", "Sin (8. razred) ima težave z algebro in geometrijo. Iščem potrpežljivega in izkušenega inštruktorja."),
        ("Angleščina za nivo B2/C1",               "Pripravljam se na jezikovno potrdilo. Potrebujem intenzivne inštrukcije 2× tedensko."),
        ("Fizika za maturo",                        "Hčerka se pripravlja na maturo iz fizike – posebej mehanika in elektromagnetizem."),
        ("Slovenščina za tujce",                    "Sem tujec in se učim slovensko. Iščem izkušenega učitelja za pogovorno prakso."),
        ("Kemija za 2. letnik srednje šole",        "Sin ima težave s kemijskimi enačbami in stehiometrijo. Iščem inštruktorja."),
    ],
    "IT_SUPPORT": [
        ("Prenosni računalnik se ne prižge",    "Prenosnik se ne odziva na tipko za vklop. Potrebujem diagnozo in popravilo."),
        ("Namestitev sistema Windows 11",        "Stari računalnik bi rad posodobil na Windows 11. Potrebujem strokovno pomoč."),
        ("Obnova izgubljenih podatkov",          "Na USB ključu imam važne datoteke, ki niso več vidne. Iščem obnovitveno rešitev."),
        ("Nastavitev domačega omrežja",          "Po selitvi moram nastaviti Wi-Fi, omrežni tiskalnik in NAS strežnik."),
        ("Računalnik okužen z virusom",          "Računalnik deluje počasi, pojavlja se agresivno oglaševanje. Verjetna okužba z zlonamerno programsko opremo."),
    ],
    "OTHER": [
        ("Montaža IKEA omare",         "Kupil sem garderobno omaro IKEA PAX (3 moduli). Potrebujem pomoč pri sestavi in pritrditvi."),
        ("Popravilo žičene ograje",    "Del žičene ograje okrog vrta se je porušil. Potrebna zamenjava ~5 m ograje."),
        ("Montaža žaluzij",            "Potrebujem namestitev zunanjih žaluzij na treh oknih v dnevni sobi."),
        ("Barvanje betonskega dvorišča","Dvorišče (~15 m²) je treba premazati z barvo za beton. Material imam."),
        ("Transport gradbenega materiala","Potrebujem prevoz ~1 tone gramoza in peska na gradbišče v bližini."),
    ],
}

PRIORITIES       = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
PRIORITY_WEIGHTS = [0.15, 0.50, 0.25, 0.10]

# ──────────────────────────────────────────────────────────────────────────────
# IMAGES
# ──────────────────────────────────────────────────────────────────────────────
MALE_PORTRAIT_INDICES   = list(range(1, 41))
FEMALE_PORTRAIT_INDICES = list(range(1, 41))

def male_portrait(n: int)   -> str: return f"https://randomuser.me/api/portraits/men/{n}.jpg"
def female_portrait(n: int) -> str: return f"https://randomuser.me/api/portraits/women/{n}.jpg"

CATEGORY_IMAGES: dict[str, list[str]] = {
    "PLUMBING":        ["https://images.unsplash.com/photo-1585704032915-c3400305e979?w=800&q=80",
                        "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&q=80",
                        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
    "ELECTRICAL":      ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
                        "https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=800&q=80",
                        "https://images.unsplash.com/photo-1581092160607-ee22731c9f71?w=800&q=80"],
    "CARPENTRY":       ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
                        "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
                        "https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=800&q=80"],
    "PAINTING":        ["https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=800&q=80",
                        "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80",
                        "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=800&q=80"],
    "CLEANING":        ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80",
                        "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80",
                        "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80"],
    "GARDENING":       ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
                        "https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800&q=80",
                        "https://images.unsplash.com/photo-1572461226335-5571a418c0a0?w=800&q=80"],
    "MOVING":          ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
                        "https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?w=800&q=80",
                        "https://images.unsplash.com/photo-1471086569966-db3eebc25a59?w=800&q=80"],
    "APPLIANCE_REPAIR":["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
                        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
                        "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&q=80"],
    "HVAC":            ["https://images.unsplash.com/photo-1621905251189-08b45249ff1e?w=800&q=80",
                        "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
                        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80"],
    "ROOFING":         ["https://images.unsplash.com/photo-1632823471565-1ecdf5c6da22?w=800&q=80",
                        "https://images.unsplash.com/photo-1595835018349-198460e1d309?w=800&q=80",
                        "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=800&q=80"],
    "LOCKSMITH":       ["https://images.unsplash.com/photo-1622558664283-eb8cc53f4b05?w=800&q=80",
                        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80",
                        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80"],
    "PEST_CONTROL":    ["https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&q=80",
                        "https://images.unsplash.com/photo-1568376794508-ae52c6ab3929?w=800&q=80",
                        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80"],
    "TUTORING":        ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
                        "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800&q=80",
                        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80"],
    "IT_SUPPORT":      ["https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&q=80",
                        "https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&q=80",
                        "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=80"],
    "OTHER":           ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
                        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
                        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"],
}

# ──────────────────────────────────────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────────────────────────────────────
def ok(msg: str):   print(f"  ✔  {msg}")
def warn(msg: str): print(f"  ⚠  {msg}")
def err(msg: str):  print(f"  ✘  {msg}", file=sys.stderr)

def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}

def random_name(female_chance: float = 0.45) -> tuple[str, str, str]:
    gender = "female" if random.random() < female_chance else "male"
    first  = random.choice(FEMALE_FIRST if gender == "female" else MALE_FIRST)
    last   = random.choice(LAST_NAMES)
    return first, last, gender

def random_loc() -> dict:
    loc    = random.choice(LOCATIONS)
    street = random.choice(loc["streets"])
    number = str(random.randint(1, 99))
    return {**loc, "street": street, "number": number}

def random_phone() -> str:
    return f"+386 {random.randint(30, 69)} {random.randint(100, 999)} {random.randint(100, 999)}"

def future_dt(days_min: int = 1, days_max: int = 30) -> str:
    dt = datetime.now() + timedelta(days=random.randint(days_min, days_max),
                                    hours=random.randint(7, 18))
    return dt.strftime("%Y-%m-%dT%H:%M:%S")

def slug(name: str) -> str:
    """Lower-case ASCII slug used for generating e-mail addresses."""
    return (name.lower()
            .replace("š", "s").replace("ž", "z").replace("č", "c")
            .replace("ć", "c").replace("đ", "d").replace("á", "a")
            .replace("é", "e").replace("í", "i").replace("ó", "o")
            .replace("ú", "u"))

def login(email: str, password: str) -> Optional[str]:
    try:
        r = requests.post(f"{BASE_URL}/api/v1/auth/login",
                          json={"email": email, "password": password}, timeout=10)
        if r.status_code == 200:
            return r.json().get("accessToken")
        err(f"Login failed for {email}: HTTP {r.status_code} – {r.text[:120]}")
    except Exception as exc:
        err(f"Login error for {email}: {exc}")
    return None

def db_connect():
    return psycopg2.connect(**DB_CONFIG)


# ──────────────────────────────────────────────────────────────────────────────
# STEP 1 – CREATE 50 PROVIDERS DIRECTLY IN THE DATABASE
#
# Bypasses the provider registration endpoint (which calls Nominatim geocoding).
# Schema:
#   locations  → id (BIGSERIAL), latitude, longitude, street_name, street_number,
#                city, postal_code, country, created_at, updated_at
#   users      → id (UUID), user_type='PROVIDER', role='PROVIDER', status='ACTIVE',
#                email_verified=TRUE, location_id=<fk>, profile_picture_url, …
#   providers  → id=<users.id>, phone_number, price_per_hour,
#                years_of_experience, service_radius_km, bio
#   provider_categories → provider_id, category
# ──────────────────────────────────────────────────────────────────────────────
def create_providers_via_db(n: int = 50) -> list[str]:
    print(f"\n{'─'*60}")
    print(f"STEP 1 – Creating {n} providers directly in the database")
    print(f"         (bypasses geocoding – uses pre-calculated coordinates)")
    print(f"{'─'*60}")

    male_pool   = random.sample(MALE_PORTRAIT_INDICES,   len(MALE_PORTRAIT_INDICES))
    female_pool = random.sample(FEMALE_PORTRAIT_INDICES, len(FEMALE_PORTRAIT_INDICES))

    emails:       list[str] = []
    used_emails:  set[str]  = set()

    try:
        conn = db_connect()
        cur  = conn.cursor()
    except Exception as exc:
        err(f"DB connection failed: {exc}")
        return []

    try:
        for i in range(1, n + 1):
            first, last, gender = random_name(female_chance=0.35)
            loc   = random_loc()
            years = random.randint(2, 25)

            primary = random.choice(ALL_CATEGORIES)
            extra   = random.sample([c for c in COMMON_CATEGORIES if c != primary],
                                    k=random.randint(0, 2))
            categories = list(dict.fromkeys([primary] + extra))

            bio = PROVIDER_BIOS[primary].format(years=years)

            # Unique e-mail
            base  = f"{slug(first)}.{slug(last)}@izvajalec.si"
            email = base
            ctr   = 2
            while email in used_emails:
                email = f"{slug(first)}.{slug(last)}{ctr}@izvajalec.si"
                ctr  += 1
            used_emails.add(email)

            # Small random offset so providers aren't all at the exact city centre
            lat = round(loc["lat"] + random.uniform(-0.04, 0.04), 7)
            lon = round(loc["lon"] + random.uniform(-0.06, 0.06), 7)

            # Profile picture for ~40 % of providers
            pic_url = None
            if random.random() < 0.40:
                if gender == "female" and female_pool:
                    pic_url = female_portrait(female_pool.pop())
                elif male_pool:
                    pic_url = male_portrait(male_pool.pop())

            try:
                # 1. Insert location
                cur.execute(
                    """
                    INSERT INTO locations
                        (latitude, longitude, street_name, street_number,
                         city, postal_code, country, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    RETURNING id
                    """,
                    (lat, lon, loc["street"], loc["number"],
                     loc["city"], loc["postal"], loc["country"]),
                )
                location_id = cur.fetchone()[0]

                # 2. Insert user row (discriminator: PROVIDER)
                provider_id = str(_uuid.uuid4())
                cur.execute(
                    """
                    INSERT INTO users
                        (id, user_type, email, password,
                         first_name, last_name,
                         role, status,
                         email_verified, two_factor_enabled,
                         location_id, profile_picture_url,
                         notification_preferences,
                         created_at, updated_at)
                    VALUES
                        (%s, 'PROVIDER', %s, %s,
                         %s, %s,
                         'PROVIDER', 'ACTIVE',
                         TRUE, FALSE,
                         %s, %s,
                         '{}',
                         NOW(), NOW())
                    """,
                    (provider_id, email, SEED_PASSWORD_HASH,
                     first, last,
                     location_id, pic_url),
                )

                # 3. Insert provider row
                cur.execute(
                    """
                    INSERT INTO providers
                        (id, phone_number, price_per_hour,
                         years_of_experience, service_radius_km, bio)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (provider_id, random_phone(),
                     round(random.uniform(15, 80), 2),
                     years,
                     random.choice([20, 30, 50, 75, 100]),
                     bio),
                )

                # 4. Insert categories
                for cat in categories:
                    cur.execute(
                        "INSERT INTO provider_categories (provider_id, category) VALUES (%s, %s)",
                        (provider_id, cat),
                    )

                conn.commit()
                pic_tag = " 📷" if pic_url else ""
                ok(f"[{i:02d}/{n}] {first} {last} <{email}>  {loc['city']}  ({', '.join(categories)}){pic_tag}")
                emails.append(email)

            except Exception as exc:
                conn.rollback()
                warn(f"[{i:02d}/{n}] DB insert failed for {email}: {exc}")

    finally:
        cur.close()
        conn.close()

    print(f"\n  → {len(emails)} / {n} providers created.")
    return emails


# ──────────────────────────────────────────────────────────────────────────────
# STEP 2 – REGISTER 50 REGULAR USERS  (via API)
# ──────────────────────────────────────────────────────────────────────────────
def register_users(n: int = 50) -> list[str]:
    print(f"\n{'─'*60}")
    print(f"STEP 2 – Registering {n} users via the API")
    print(f"{'─'*60}")

    emails:      list[str] = []
    used_emails: set[str]  = set()

    for i in range(1, n + 1):
        first, last, _ = random_name(female_chance=0.50)

        base  = f"{slug(first)}.{slug(last)}@mail.si"
        email = base
        ctr   = 2
        while email in used_emails:
            email = f"{slug(first)}.{slug(last)}{ctr}@mail.si"
            ctr  += 1
        used_emails.add(email)

        try:
            r = requests.post(
                f"{BASE_URL}/api/v1/auth/register",
                json={"firstName": first, "lastName": last,
                      "email": email, "password": SEED_PASSWORD},
                timeout=10,
            )
            if r.status_code in (200, 201):
                ok(f"[{i:02d}/{n}] {first} {last} <{email}>")
                emails.append(email)
            else:
                warn(f"[{i:02d}/{n}] Failed for {email}: HTTP {r.status_code} – {r.text[:150]}")
        except Exception as exc:
            err(f"[{i:02d}/{n}] Request error: {exc}")

        time.sleep(0.12)

    print(f"\n  → {len(emails)} / {n} users registered.")
    return emails


# ──────────────────────────────────────────────────────────────────────────────
# STEP 3 – ACTIVATE USERS IN THE DATABASE
#   Regular users are created with emailVerified=false / PENDING_VERIFICATION.
#   We bypass e-mail confirmation with a direct DB update.
# ──────────────────────────────────────────────────────────────────────────────
def activate_users_in_db(emails: list[str]) -> int:
    print(f"\n{'─'*60}")
    print("STEP 3 – Activating user accounts in the database")
    print(f"{'─'*60}")

    try:
        conn = db_connect()
        cur  = conn.cursor()
        cur.execute(
            """
            UPDATE users
               SET email_verified = TRUE,
                   status         = 'ACTIVE'
             WHERE email = ANY(%s)
               AND status = 'PENDING_VERIFICATION'
            """,
            (emails,),
        )
        affected = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        ok(f"Activated {affected} user account(s).")
        return affected
    except Exception as exc:
        err(f"DB activation failed: {exc}")
        return 0


# ──────────────────────────────────────────────────────────────────────────────
# STEP 4 – PROFILE PICTURES FOR ~30 % OF USERS  (via API)
# ──────────────────────────────────────────────────────────────────────────────
def set_profile_pictures(user_emails: list[str]) -> int:
    print(f"\n{'─'*60}")
    print("STEP 4 – Setting profile pictures for ~30 % of users")
    print(f"{'─'*60}")

    male_pool   = random.sample(MALE_PORTRAIT_INDICES,   len(MALE_PORTRAIT_INDICES))
    female_pool = random.sample(FEMALE_PORTRAIT_INDICES, len(FEMALE_PORTRAIT_INDICES))
    updated = 0

    for email in user_emails:
        if random.random() > 0.30:
            continue

        token = login(email, SEED_PASSWORD)
        if not token:
            continue

        if male_pool and random.random() > 0.45:
            url = male_portrait(male_pool.pop())
        elif female_pool:
            url = female_portrait(female_pool.pop())
        else:
            continue

        r = requests.patch(
            f"{BASE_URL}/api/v1/users/me/profile-picture",
            json={"url": url},
            headers=auth_header(token),
            timeout=10,
        )
        if r.status_code in (200, 204):
            ok(f"Profile picture set for {email}")
            updated += 1
        else:
            warn(f"Could not set picture for {email}: HTTP {r.status_code} – {r.text[:120]}")

        time.sleep(0.15)

    print(f"\n  → {updated} profile picture(s) set.")
    return updated


# ──────────────────────────────────────────────────────────────────────────────
# STEP 5 – CREATE 100 TICKETS  (via API, authenticated as users)
# ──────────────────────────────────────────────────────────────────────────────
def create_tickets(user_emails: list[str], n: int = 100) -> int:
    print(f"\n{'─'*60}")
    print(f"STEP 5 – Creating {n} tickets")
    print(f"{'─'*60}")

    if not user_emails:
        err("No user e-mails available – cannot create tickets.")
        return 0

    print("  Logging in users …")
    user_tokens: dict[str, str] = {}
    for email in user_emails:
        token = login(email, SEED_PASSWORD)
        if token:
            user_tokens[email] = token
        time.sleep(0.08)

    if not user_tokens:
        err("Could not log in any user – aborting.")
        return 0

    token_list    = list(user_tokens.items())
    created_count = 0

    for i in range(1, n + 1):
        email, token = random.choice(token_list)
        category     = random.choice(ALL_CATEGORIES)
        svc_type, desc = random.choice(TICKET_TEMPLATES[category])
        loc          = random_loc()
        priority     = random.choices(PRIORITIES, weights=PRIORITY_WEIGHTS, k=1)[0]

        # ~40 % of tickets get 1-3 category-relevant images
        image_urls: list[str] = []
        if random.random() < 0.40:
            pool       = CATEGORY_IMAGES[category]
            image_urls = random.sample(pool, random.randint(1, min(3, len(pool))))

        # ~25 % of tickets include a requested time window
        start_at = end_at = None
        if random.random() < 0.25:
            start_at = future_dt(days_min=1, days_max=14)
            end_at   = (datetime.fromisoformat(start_at) +
                        timedelta(hours=random.randint(1, 4))).strftime("%Y-%m-%dT%H:%M:%S")

        payload: dict = {
            "serviceType": svc_type,
            "category":    category,
            "description": desc,
            "location":    f"{loc['street']} {loc['number']}, {loc['city']}",
            "latitude":    round(loc["lat"] + random.uniform(-0.05, 0.05), 6),
            "longitude":   round(loc["lon"] + random.uniform(-0.05, 0.05), 6),
            "priority":    priority,
        }
        if image_urls: payload["imageUrls"]        = image_urls
        if start_at:   payload["requestedStartAt"] = start_at
        if start_at:   payload["requestedEndAt"]   = end_at

        try:
            r = requests.post(
                f"{BASE_URL}/api/tickets",
                json=payload,
                headers=auth_header(token),
                timeout=10,
            )
            if r.status_code in (200, 201):
                img_tag = f"  [{len(image_urls)} img]" if image_urls else ""
                ok(f"[{i:03d}/{n}] [{priority}] {svc_type}{img_tag}  ({loc['city']})")
                created_count += 1
            else:
                warn(f"[{i:03d}/{n}] Failed: HTTP {r.status_code} – {r.text[:150]}")
        except Exception as exc:
            err(f"[{i:03d}/{n}] Request error: {exc}")

        time.sleep(0.12)

    print(f"\n  → {created_count} / {n} tickets created.")
    return created_count


# ──────────────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────────────
def main():
    random.seed(42)   # reproducible run; remove for different data each time

    print("╔══════════════════════════════════════════════════════════╗")
    print("║         FixItNow – API seed  (Maribor region, SLO)       ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"  Target : {BASE_URL}")
    print(f"  Admin  : {ADMIN_EMAIL}")

    # Verify admin login
    print(f"\n{'─'*60}")
    print("STEP 0 – Verifying admin login")
    print(f"{'─'*60}")
    admin_token = login(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        err("Cannot obtain admin token. Make sure seed_data.sql was applied first.")
        sys.exit(1)
    ok(f"Logged in as admin ({ADMIN_EMAIL})")

    # Run all steps
    provider_emails = create_providers_via_db(50)
    user_emails     = register_users(50)
    activate_users_in_db(user_emails)
    set_profile_pictures(user_emails)
    create_tickets(user_emails, 100)

    print(f"\n{'═'*60}")
    print("  SEED COMPLETE")
    print(f"  Providers created : {len(provider_emails)}  (via DB, status=ACTIVE)")
    print(f"  Users created     : {len(user_emails)}  (via API, status=ACTIVE)")
    print(f"  Common password   : {SEED_PASSWORD}")
    print(f"{'═'*60}\n")


if __name__ == "__main__":
    main()
