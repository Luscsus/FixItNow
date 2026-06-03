// Long-form legal copy for the /terms and /privacy pages, kept out of the i18n
// JSON (which is for short UI strings). Each document is provided per language;
// the LegalPage picks the active one from i18n.language.
//
// NOTE: This is template content, not legal advice. Have it reviewed by a
// qualified lawyer and aligned with your payment provider's terms before relying
// on it in production.

export type LegalBlock = { h: string; p?: string[]; ul?: string[] };
export type LegalDoc = {
  title: string;
  updated: string;
  disclaimer: string;
  intro: string[];
  blocks: LegalBlock[];
};

type Lang = "en" | "sl";

const TERMS_EN: LegalDoc = {
  title: "Terms of Service",
  updated: "Last updated: 3 June 2026",
  disclaimer:
    "This is template content and not legal advice. Please review with a qualified lawyer before relying on it.",
  intro: [
    "These Terms of Service (“Terms”) govern your use of the FixItNow website and web app at fixitnow.si (the “Platform”), operated by FixItNow (“we”, “us”).",
    "By creating an account or using the Platform, you agree to these Terms. If you do not agree, do not use the Platform.",
  ],
  blocks: [
    { h: "1. Definitions", ul: [
      "Customer — a user who requests services by creating a ticket.",
      "Provider — a verified tradesperson or business offering services through the Platform.",
      "Ticket — a service request created by a Customer.",
      "Invoice — a request for payment issued by a Provider for completed work.",
      "Platform Fee — the commission FixItNow charges on completed jobs.",
    ] },
    { h: "2. What FixItNow Is", p: [
      "FixItNow is an online marketplace that connects Customers with independent Providers. We are not a party to the service contract between a Customer and a Provider, are not the employer of any Provider, and do not ourselves perform any physical service. Providers are independent contractors solely responsible for their work.",
    ] },
    { h: "3. Eligibility & Accounts", ul: [
      "You must be at least 18 and able to form a binding contract.",
      "You must provide accurate information and keep it up to date.",
      "You are responsible for your credentials and all activity under your account; tell us immediately of any unauthorized use.",
      "We support email/password and third-party sign-in and optional two-factor authentication, which we recommend enabling.",
    ] },
    { h: "4. Provider Verification & Obligations", ul: [
      "Provider accounts are subject to review and approval before activation; approval may be refused or revoked at our discretion.",
      "Providers must hold all licenses, certifications, insurance, and permits required by law and perform work to a professional standard.",
      "Providers set their own rates, categories, and service radius and must represent their skills and pricing accurately.",
      "Providers must add payout details before accepting paid work and are responsible for their own taxes and regulatory compliance.",
    ] },
    { h: "5. Acceptable Use", p: ["You agree not to:"], ul: [
      "Use the Platform for any unlawful, fraudulent, or harmful purpose;",
      "Circumvent the Platform to avoid fees (e.g. arranging off-platform payment for jobs originating here);",
      "Post false, misleading, defamatory, or infringing content, or submit fake reviews;",
      "Scrape, reverse-engineer, overload, or interfere with the Platform or its security;",
      "Impersonate anyone or misrepresent your identity, affiliation, or qualifications.",
    ] },
    { h: "6. Tickets & Service Workflow", p: [
      "A Customer creates a Ticket describing the issue, location, and preferences. Matched Providers may accept it. Acceptance forms a direct service agreement between the Customer and the Provider; FixItNow facilitates but is not a party to it.",
      "Ticket status is tracked for transparency. Live location sharing, where enabled, is used only to coordinate arrival and is governed by our Privacy Policy. Customers must provide safe, lawful access and accurate information.",
    ] },
    { h: "7. Payments, Invoices & Fees", ul: [
      "When creating a Ticket, a Customer may choose to pay by invoice or by credit/debit card, subject to availability.",
      "Providers issue invoices for completed work; pricing is set by the Provider and estimates are not binding unless agreed.",
      "Card payments are handled by our third-party processor (e.g. Stripe). We do not store full card numbers; payment data is handled by the processor under its terms.",
      "FixItNow charges a Platform Fee on completed jobs (currently about 10%), shown before confirmation and subject to change with notice.",
      "Amounts are shown in euros (EUR) unless stated otherwise and may exclude applicable taxes. Provider payouts are released after completion and settlement, net of fees.",
    ] },
    { h: "8. Cancellations & Refunds", p: [
      "Customers may cancel a Ticket before a Provider accepts it at no charge. After acceptance, cancellation terms and any fees depend on the stage of work and what the parties agreed. Refund eligibility for completed or partial work is decided case-by-case and may depend on the Provider's policy and consumer-protection law. Disputes should first be raised between Customer and Provider in the in-app chat; FixItNow may mediate at its discretion but is not obligated to refund work it did not perform.",
    ] },
    { h: "9. Reviews & User Content", p: [
      "Customers may review Providers after a completed job. Reviews must be honest and lawful. You retain ownership of your content but grant FixItNow a worldwide, non-exclusive, royalty-free license to host, display, and use it to operate and promote the Platform. We may remove content that violates these Terms.",
    ] },
    { h: "10. Intellectual Property", p: [
      "The Platform, including its software, design, and trademarks (“FixItNow”), is owned by us or our licensors. You receive a limited, revocable, non-transferable license to use the Platform for its intended purpose. No other rights are granted.",
    ] },
    { h: "11. Privacy", p: [
      "Your use of the Platform is subject to our Privacy Policy, which explains how we process personal data under the GDPR and applicable law, including account, location, and payment-related data.",
    ] },
    { h: "12. Disclaimers", p: [
      "The Platform is provided “as is” and “as available” without warranties of any kind. We do not warrant the quality, safety, legality, or outcome of any service provided by a Provider, nor that the Platform will be uninterrupted or error-free.",
    ] },
    { h: "13. Limitation of Liability", p: [
      "To the maximum extent permitted by law, FixItNow is not liable for indirect or consequential damages, or for the acts or work of any Provider or Customer. Our total aggregate liability is limited to the greater of the Platform Fees you paid us in the prior 3 months or EUR 100. Nothing limits liability that cannot be excluded by law, including mandatory consumer rights.",
    ] },
    { h: "14. Suspension & Termination", p: [
      "We may suspend or terminate access for violation of these Terms, fraud, risk to other users, or as required by law. You may close your account at any time. Provisions on payment, liability, and indemnity survive termination.",
    ] },
    { h: "15. Changes to the Terms", p: [
      "We may update these Terms from time to time. Material changes will be notified through the Platform or by email. Continued use after changes take effect constitutes acceptance.",
    ] },
    { h: "16. Governing Law & Disputes", p: [
      "These Terms are governed by the laws of the Republic of Slovenia. Disputes are subject to the competent Slovenian courts, without prejudice to mandatory consumer rights. EU consumers may also use the EU Online Dispute Resolution platform.",
    ] },
    { h: "17. Contact", p: ["Questions about these Terms: info@fixitnow.si."] },
  ],
};

const TERMS_SL: LegalDoc = {
  title: "Pogoji uporabe",
  updated: "Zadnja posodobitev: 3. junij 2026",
  disclaimer:
    "To je predloga in ne pravni nasvet. Pred uporabo naj jo pregleda usposobljen pravnik.",
  intro: [
    "Ti pogoji uporabe („Pogoji“) urejajo vašo uporabo spletne strani in aplikacije FixItNow na fixitnow.si („Platforma“), ki jo upravlja FixItNow („mi“, „nas“).",
    "Z ustvarjenjem računa ali uporabo Platforme se strinjate s temi Pogoji. Če se ne strinjate, Platforme ne uporabljajte.",
  ],
  blocks: [
    { h: "1. Opredelitve", ul: [
      "Stranka — uporabnik, ki naroči storitve z ustvarjenjem zahtevka.",
      "Ponudnik — preverjen obrtnik ali podjetje, ki ponuja storitve prek Platforme.",
      "Zahtevek — prošnja za storitev, ki jo ustvari Stranka.",
      "Račun (faktura) — zahteva za plačilo, ki jo izda Ponudnik za opravljeno delo.",
      "Provizija platforme — provizija, ki jo FixItNow zaračuna za zaključena dela.",
    ] },
    { h: "2. Kaj je FixItNow", p: [
      "FixItNow je spletna tržnica, ki povezuje Stranke z neodvisnimi Ponudniki. Nismo pogodbena stranka v razmerju med Stranko in Ponudnikom, nismo delodajalec nobenega Ponudnika in sami ne opravljamo nobene fizične storitve. Ponudniki so neodvisni izvajalci, ki so sami odgovorni za svoje delo.",
    ] },
    { h: "3. Pogoji za uporabo in računi", ul: [
      "Imeti morate vsaj 18 let in biti sposobni skleniti zavezujočo pogodbo.",
      "Posredovati morate točne podatke in jih sproti posodabljati.",
      "Odgovorni ste za svoje poverilnice in vse dejavnosti na vašem računu; o nepooblaščeni uporabi nas takoj obvestite.",
      "Podpiramo prijavo z e-pošto/geslom in zunanjimi ponudniki ter neobvezno dvostopenjsko avtentikacijo, ki jo priporočamo.",
    ] },
    { h: "4. Preverjanje in obveznosti Ponudnikov", ul: [
      "Računi Ponudnikov so pred aktivacijo predmet pregleda in odobritve; odobritev lahko zavrnemo ali prekličemo po lastni presoji.",
      "Ponudniki morajo imeti vsa z zakonom zahtevana dovoljenja, certifikate in zavarovanja ter delo opraviti strokovno.",
      "Ponudniki sami določajo cene, kategorije in radij storitev ter morajo svoje znanje in cene predstaviti točno.",
      "Ponudniki morajo pred sprejemom plačanega dela dodati podatke za izplačilo in so sami odgovorni za davke in skladnost s predpisi.",
    ] },
    { h: "5. Sprejemljiva uporaba", p: ["Strinjate se, da ne boste:"], ul: [
      "uporabljali Platforme za nezakonite, goljufive ali škodljive namene;",
      "zaobšli Platforme za izogibanje provizijam (npr. dogovor o plačilu zunaj Platforme za dela, nastala tukaj);",
      "objavljali lažnih, zavajajočih, žaljivih ali kršečih vsebin ali oddajali lažnih ocen;",
      "zajemali podatkov, dekompilirali, preobremenjevali ali posegali v Platformo ali njeno varnost;",
      "se izdajali za drugo osebo ali napačno predstavljali svoje identitete ali kvalifikacij.",
    ] },
    { h: "6. Zahtevki in potek storitve", p: [
      "Stranka ustvari Zahtevek z opisom težave, lokacije in želja. Ustrezni Ponudniki ga lahko sprejmejo. Sprejem ustvari neposredno storitveno pogodbo med Stranko in Ponudnikom; FixItNow to omogoča, ni pa njena stranka.",
      "Stanje Zahtevka se beleži zaradi preglednosti. Deljenje lokacije v živo, kjer je omogočeno, se uporablja le za uskladitev prihoda in ureja ga naša Politika zasebnosti. Stranke morajo zagotoviti varen, zakonit dostop in točne podatke.",
    ] },
    { h: "7. Plačila, računi in provizije", ul: [
      "Pri ustvarjanju Zahtevka lahko Stranka izbere plačilo po računu ali s kreditno/debetno kartico, če je na voljo.",
      "Ponudniki izdajo račune za opravljeno delo; ceno določi Ponudnik, ocene niso zavezujoče, razen če je dogovorjeno.",
      "Plačila s kartico izvaja naš zunanji ponudnik (npr. Stripe). Celotnih številk kartic ne shranjujemo; plačilne podatke obdeluje ponudnik po svojih pogojih.",
      "FixItNow zaračuna Provizijo platforme za zaključena dela (trenutno približno 10 %), prikazano pred potrditvijo in podvrženo spremembam z obvestilom.",
      "Zneski so prikazani v evrih (EUR), razen če je navedeno drugače, in lahko ne vključujejo davkov. Izplačila Ponudnikom se sprostijo po zaključku in poravnavi, brez provizij.",
    ] },
    { h: "8. Preklici in vračila", p: [
      "Stranka lahko prekliče Zahtevek, preden ga Ponudnik sprejme, brezplačno. Po sprejemu so pogoji preklica in morebitne provizije odvisni od faze dela in dogovora strank. Upravičenost do vračila za opravljeno ali delno delo se presoja za vsak primer posebej. Spore je treba najprej reševati med Stranko in Ponudnikom v klepetu; FixItNow lahko posreduje po lastni presoji, ni pa dolžan vrniti plačila za delo, ki ga ni opravil.",
    ] },
    { h: "9. Ocene in uporabniška vsebina", p: [
      "Stranke lahko po zaključenem delu ocenijo Ponudnike. Ocene morajo biti poštene in zakonite. Ohranite lastništvo svoje vsebine, vendar FixItNow podelite svetovno, neizključno, brezplačno licenco za gostovanje, prikaz in uporabo za delovanje in promocijo Platforme. Vsebino, ki krši te Pogoje, lahko odstranimo.",
    ] },
    { h: "10. Intelektualna lastnina", p: [
      "Platforma, vključno s programsko opremo, oblikovanjem in blagovnimi znamkami („FixItNow“), je v lasti nas ali naših dajalcev licenc. Prejmete omejeno, preklicno, neprenosljivo licenco za uporabo Platforme v predvideni namen. Druge pravice niso podeljene.",
    ] },
    { h: "11. Zasebnost", p: [
      "Vaša uporaba Platforme je predmet naše Politike zasebnosti, ki pojasnjuje, kako obdelujemo osebne podatke skladno z GDPR in veljavno zakonodajo, vključno s podatki o računu, lokaciji in plačilih.",
    ] },
    { h: "12. Zavrnitve odgovornosti", p: [
      "Platforma je na voljo „kakršna je“ in „po razpoložljivosti“ brez kakršnih koli jamstev. Ne jamčimo za kakovost, varnost, zakonitost ali izid storitve Ponudnika niti da bo Platforma delovala brez prekinitev ali napak.",
    ] },
    { h: "13. Omejitev odgovornosti", p: [
      "V največjem obsegu, ki ga dovoljuje zakon, FixItNow ni odgovoren za posredno ali posledično škodo niti za dejanja ali delo katerega koli Ponudnika ali Stranke. Naša skupna odgovornost je omejena na večje od provizij, ki ste nam jih plačali v zadnjih 3 mesecih, ali 100 EUR. Nič ne omejuje odgovornosti, ki je po zakonu ni mogoče izključiti, vključno z obveznimi pravicami potrošnikov.",
    ] },
    { h: "14. Mirovanje in prekinitev", p: [
      "Dostop lahko začasno ustavimo ali prekinemo zaradi kršitve teh Pogojev, goljufije, tveganja za druge uporabnike ali kot to zahteva zakon. Račun lahko kadar koli zaprete. Določbe o plačilu, odgovornosti in odškodnini veljajo tudi po prekinitvi.",
    ] },
    { h: "15. Spremembe Pogojev", p: [
      "Te Pogoje lahko občasno posodobimo. O bistvenih spremembah vas obvestimo prek Platforme ali po e-pošti. Nadaljnja uporaba po uveljavitvi sprememb pomeni soglasje.",
    ] },
    { h: "16. Pravo in spori", p: [
      "Te Pogoje ureja pravo Republike Slovenije. Za spore so pristojna slovenska sodišča, brez poseganja v obvezne pravice potrošnikov. Potrošniki v EU lahko uporabijo tudi platformo EU za spletno reševanje sporov.",
    ] },
    { h: "17. Kontakt", p: ["Vprašanja o teh Pogojih: info@fixitnow.si."] },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy Policy",
  updated: "Last updated: 3 June 2026",
  disclaimer:
    "This is template content and not legal advice. Have it reviewed for GDPR compliance before relying on it.",
  intro: [
    "This Privacy Policy explains how FixItNow (“we”) collects, uses, and protects your personal data when you use fixitnow.si (the “Platform”). We act as data controller for the processing described here.",
  ],
  blocks: [
    { h: "1. Data We Collect", ul: [
      "Account data: name, email, password (hashed), role, and profile picture.",
      "Provider data: trades, hourly rate, years of experience, service radius, bio, and payout (bank/IBAN) details.",
      "Ticket data: descriptions, photos, addresses, and status history of jobs.",
      "Location data: addresses you enter and, where you enable it, live location used to coordinate a job in progress.",
      "Communications: in-app chat messages and notifications.",
      "Payment data: limited card details (brand and last four digits) and payment/invoice status. Full card numbers are handled by our payment processor, not stored by us.",
      "Technical data: device, browser, and usage information needed to operate and secure the Platform.",
    ] },
    { h: "2. How We Use Your Data", ul: [
      "To create and manage your account and provide the Platform's features.",
      "To match Customers with Providers by category and location and to coordinate jobs.",
      "To process payments and payouts and to issue invoices.",
      "To send service notifications and, where permitted, important updates.",
      "To maintain safety, prevent fraud and abuse, and comply with legal obligations.",
    ] },
    { h: "3. Legal Bases (GDPR)", ul: [
      "Performance of a contract — to provide the Platform and fulfil bookings.",
      "Legitimate interests — to secure the Platform, prevent fraud, and improve our service.",
      "Consent — for optional features such as live location sharing or marketing, which you may withdraw at any time.",
      "Legal obligation — to meet accounting, tax, and other legal requirements.",
    ] },
    { h: "4. Sharing Your Data", p: [
      "We share data only as needed: between Customers and their matched Providers to perform a job; with service providers acting on our behalf (e.g. payment processing, hosting, email delivery, image storage); and where required by law. We do not sell your personal data.",
    ] },
    { h: "5. Payment Data", p: [
      "Card payments are processed by a third-party provider (e.g. Stripe). We store only non-sensitive details such as card brand and the last four digits to let you identify a saved card. We do not store full card numbers or security codes.",
    ] },
    { h: "6. Data Retention", p: [
      "We keep personal data only as long as necessary for the purposes above or as required by law (e.g. accounting records). When no longer needed, data is deleted or anonymized.",
    ] },
    { h: "7. Your Rights", p: ["Subject to applicable law, you have the right to:"], ul: [
      "access, correct, or delete your personal data;",
      "restrict or object to certain processing;",
      "data portability;",
      "withdraw consent at any time;",
      "lodge a complaint with your local data protection authority (in Slovenia, the Information Commissioner).",
    ] },
    { h: "8. Security", p: [
      "We use technical and organizational measures such as encryption in transit, hashed passwords, and access controls to protect your data. No system is completely secure, but we work to protect your information and to notify you of incidents where required.",
    ] },
    { h: "9. International Transfers", p: [
      "Where data is processed outside the EEA by our service providers, we rely on appropriate safeguards such as standard contractual clauses.",
    ] },
    { h: "10. Changes", p: [
      "We may update this Policy. Material changes will be notified through the Platform or by email.",
    ] },
    { h: "11. Contact", p: [
      "For privacy questions or to exercise your rights, contact: info@fixitnow.si.",
    ] },
  ],
};

const PRIVACY_SL: LegalDoc = {
  title: "Politika zasebnosti",
  updated: "Zadnja posodobitev: 3. junij 2026",
  disclaimer:
    "To je predloga in ne pravni nasvet. Pred uporabo naj jo pregledajo glede skladnosti z GDPR.",
  intro: [
    "Ta politika zasebnosti pojasnjuje, kako FixItNow („mi“) zbira, uporablja in varuje vaše osebne podatke pri uporabi fixitnow.si („Platforma“). Za tukaj opisano obdelavo nastopamo kot upravljavec podatkov.",
  ],
  blocks: [
    { h: "1. Podatki, ki jih zbiramo", ul: [
      "Podatki računa: ime, e-pošta, geslo (zgoščeno), vloga in profilna slika.",
      "Podatki Ponudnika: storitve, urna postavka, leta izkušenj, radij storitev, opis in podatki za izplačilo (banka/IBAN).",
      "Podatki zahtevkov: opisi, fotografije, naslovi in zgodovina stanj del.",
      "Podatki o lokaciji: naslovi, ki jih vnesete, in, kjer to omogočite, lokacija v živo za uskladitev dela v teku.",
      "Komunikacije: sporočila v klepetu in obvestila.",
      "Plačilni podatki: omejeni podatki o kartici (znamka in zadnje štiri številke) ter stanje plačil/računov. Celotne številke kartic obdeluje naš plačilni ponudnik in jih ne shranjujemo.",
      "Tehnični podatki: podatki o napravi, brskalniku in uporabi za delovanje in varnost Platforme.",
    ] },
    { h: "2. Kako uporabljamo podatke", ul: [
      "Za ustvarjanje in upravljanje računa ter zagotavljanje funkcij Platforme.",
      "Za povezovanje Strank s Ponudniki po kategoriji in lokaciji ter uskladitev del.",
      "Za obdelavo plačil in izplačil ter izdajanje računov.",
      "Za pošiljanje storitvenih obvestil in, kjer je dovoljeno, pomembnih posodobitev.",
      "Za zagotavljanje varnosti, preprečevanje goljufij in skladnost z zakonom.",
    ] },
    { h: "3. Pravne podlage (GDPR)", ul: [
      "Izvajanje pogodbe — za zagotavljanje Platforme in izvedbo naročil.",
      "Zakoniti interesi — za varnost Platforme, preprečevanje goljufij in izboljšave.",
      "Privolitev — za neobvezne funkcije, kot sta deljenje lokacije v živo ali trženje, ki jo lahko kadar koli prekličete.",
      "Zakonska obveznost — za računovodske, davčne in druge zahteve.",
    ] },
    { h: "4. Deljenje podatkov", p: [
      "Podatke delimo le po potrebi: med Strankami in njihovimi Ponudniki za izvedbo dela; s ponudniki storitev v našem imenu (npr. obdelava plačil, gostovanje, e-pošta, shranjevanje slik); in kadar to zahteva zakon. Vaših osebnih podatkov ne prodajamo.",
    ] },
    { h: "5. Plačilni podatki", p: [
      "Plačila s kartico obdeluje zunanji ponudnik (npr. Stripe). Shranjujemo le neobčutljive podatke, kot sta znamka kartice in zadnje štiri številke, da prepoznate shranjeno kartico. Celotnih številk kartic ali varnostnih kod ne shranjujemo.",
    ] },
    { h: "6. Hramba podatkov", p: [
      "Osebne podatke hranimo le toliko časa, kolikor je potrebno za navedene namene ali kot zahteva zakon (npr. računovodski zapisi). Ko niso več potrebni, jih izbrišemo ali anonimiziramo.",
    ] },
    { h: "7. Vaše pravice", p: ["Skladno z veljavnim pravom imate pravico do:"], ul: [
      "dostopa, popravka ali izbrisa svojih osebnih podatkov;",
      "omejitve ali ugovora določeni obdelavi;",
      "prenosljivosti podatkov;",
      "preklica privolitve kadar koli;",
      "pritožbe pri nadzornem organu (v Sloveniji Informacijski pooblaščenec).",
    ] },
    { h: "8. Varnost", p: [
      "Uporabljamo tehnične in organizacijske ukrepe, kot so šifriranje pri prenosu, zgoščena gesla in nadzor dostopa. Noben sistem ni popolnoma varen, a si prizadevamo zaščititi vaše podatke in vas obvestiti o incidentih, kjer je to zahtevano.",
    ] },
    { h: "9. Mednarodni prenosi", p: [
      "Kjer naši ponudniki storitev podatke obdelujejo zunaj EGP, se zanašamo na ustrezne zaščitne ukrepe, kot so standardne pogodbene klavzule.",
    ] },
    { h: "10. Spremembe", p: [
      "To politiko lahko posodobimo. O bistvenih spremembah vas obvestimo prek Platforme ali po e-pošti.",
    ] },
    { h: "11. Kontakt", p: [
      "Za vprašanja o zasebnosti ali uveljavljanje pravic pišite na: info@fixitnow.si.",
    ] },
  ],
};

export const TERMS: Record<Lang, LegalDoc> = { en: TERMS_EN, sl: TERMS_SL };
export const PRIVACY: Record<Lang, LegalDoc> = { en: PRIVACY_EN, sl: PRIVACY_SL };

export function pickLang(language: string): Lang {
  return language.toLowerCase().startsWith("sl") ? "sl" : "en";
}
