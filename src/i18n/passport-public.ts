import { OFFICIAL_71_FIELDS, type FieldGroupId } from "../config/battery-fields.ts";

export type PublicPassportLocale = "en" | "de" | "fr" | "nl" | "es" | "it" | "pl";

export const PUBLIC_PASSPORT_LOCALES: readonly {
  code: PublicPassportLocale;
  nativeName: string;
}[] = [
  { code: "en", nativeName: "EN" },
  { code: "de", nativeName: "DE" },
  { code: "fr", nativeName: "FR" },
  { code: "nl", nativeName: "NL" },
  { code: "es", nativeName: "ES" },
  { code: "it", nativeName: "IT" },
  { code: "pl", nativeName: "PL" },
] as const;

export interface PublicPassportUiCopy {
  passportSubtitle: string;
  simpleQrSubtitle: string;
  manufacturerNotice: string;
  workingFieldNotice: string;
  restrictedOmittedNote: string;
  publicTierBadge: string;
  tabs: {
    passport: string;
    passportMobile: string;
    repair: string;
    repairMobile: string;
    supply: string;
    supplyMobile: string;
    provenance: string;
    provenanceMobile: string;
  };
  groups: Record<FieldGroupId, string>;
  publicBadge: string;
  unitBanner: {
    serial: string;
    gtin: string;
    batch: string;
    manufactured: string;
    status: string;
  };
  repairHeading: string;
  repairIntro: string;
  supplyHeading: string;
  supplyIntro: string;
  provenanceHeading: string;
  operatorDeclarationLabel: string;
  operatorDeclarationValue: string;
  declaredTimestampLabel: string;
  recyclingHeading: string;
  recyclingSubheading: string;
  recyclingFallback: string;
  jsonLdLinkLabel: string;
  simpleQr: {
    badge: string;
    docHeading: string;
    docDownload: string;
    docExternalLink: string;
    docNotAttached: string;
    collectionHeading: string;
    manufacturerLabel: string;
    addressLabel: string;
    modelLabel: string;
    markingLabel: string;
  };
}

export const PUBLIC_PASSPORT_UI: Record<PublicPassportLocale, PublicPassportUiCopy> = {
  en: {
    passportSubtitle: "Digital Battery Passport",
    simpleQrSubtitle: "EU Battery Information & Declaration (Article 13(6))",
    manufacturerNotice:
      "Declared by economic operator; not verified by CratePass.",
    workingFieldNotice: "Working field list — check against official regulation.",
    restrictedOmittedNote:
      "Restricted fields for authorities and repair operators are omitted from this public view.",
    publicTierBadge: "Public tier only",
    tabs: {
      passport: "Passport data",
      passportMobile: "Passport",
      repair: "Care & repair info",
      repairMobile: "Repair",
      supply: "Supply notes",
      supplyMobile: "Supply",
      provenance: "Provenance & recycling",
      provenanceMobile: "Provenance",
    },
    groups: {
      identity: "Identity & Conformity",
      integrity: "Specifications & Performance",
      careRepair: "Safety, Servicing & Dismantling",
      impact: "Composition, Carbon & End-of-Life",
    },
    publicBadge: "Public",
    unitBanner: {
      serial: "Item Serial Number",
      gtin: "GS1 GTIN (01)",
      batch: "Batch / Lot",
      manufactured: "Manufactured",
      status: "Lifecycle Status",
    },
    repairHeading: "Care, handling & external spare-parts information",
    repairIntro:
      "Published manufacturer care notes. Do not open sealed lithium enclosures; internal service belongs strictly to authorised technicians.",
    supplyHeading: "Disclosed supply & origin notes",
    supplyIntro:
      "Self-declared locations submitted by the economic operator for this battery model.",
    provenanceHeading: "Provenance & publication record",
    operatorDeclarationLabel: "Economic operator declaration",
    operatorDeclarationValue: "Declared by economic operator",
    declaredTimestampLabel: "Declared timestamp (UTC)",
    recyclingHeading: "End-of-life & recycling instructions",
    recyclingSubheading:
      "Separate collection required — do not dispose with unsorted waste",
    recyclingFallback:
      "Return spent batteries through an authorised municipal battery collection point, dealer take-back programme, or producer collection operator.",
    jsonLdLinkLabel: "EU Registry JSON-LD",
    simpleQr: {
      badge: "Article 13(6) Simple QR Record",
      docHeading: "EU Declaration of Conformity",
      docDownload: "Download EU Declaration of Conformity (PDF)",
      docExternalLink: "Open EU Declaration of Conformity",
      docNotAttached: "Reference declared below.",
      collectionHeading: "Separate Collection & Disposal Instructions",
      manufacturerLabel: "Manufacturer",
      addressLabel: "Postal Address",
      modelLabel: "Model / SKU",
      markingLabel: "Separate Collection Marking",
    },
  },
  de: {
    passportSubtitle: "Digitaler Batteriepass",
    simpleQrSubtitle: "EU-Batterieinformationen & Konformitätserklärung (Art. 13(6))",
    manufacturerNotice:
      "Erklärung des Wirtschaftsakteurs; keine Prüfung durch CratePass.",
    workingFieldNotice: "Arbeitsfeldliste — bitte mit offizieller EU-Verordnung abgleichen.",
    restrictedOmittedNote:
      "Zugangsbeschränkte Felder für Behörden und Reparaturbetriebe sind in dieser öffentlichen Ansicht ausgeblendet.",
    publicTierBadge: "Nur öffentlicher Bereich",
    tabs: {
      passport: "Passdaten",
      passportMobile: "Passdaten",
      repair: "Pflege & Reparatur",
      repairMobile: "Reparatur",
      supply: "Herkunft & Lieferkette",
      supplyMobile: "Herkunft",
      provenance: "Nachweis & Recycling",
      provenanceMobile: "Recycling",
    },
    groups: {
      identity: "Identität & Konformität",
      integrity: "Spezifikationen & Leistung",
      careRepair: "Sicherheit, Wartung & Demontage",
      impact: "Zusammensetzung, CO2 & Entsorgung",
    },
    publicBadge: "Öffentlich",
    unitBanner: {
      serial: "Seriennummer",
      gtin: "GS1 GTIN (01)",
      batch: "Charge / Los",
      manufactured: "Herstellungsdatum",
      status: "Lebenszyklusstatus",
    },
    repairHeading: "Pflege-, Handhabungs- & Ersatzteilhinweise",
    repairIntro:
      "Veröffentlichte Herstellerhinweise. Versiegelte Lithium-Gehäuse nicht öffnen; interne Arbeiten nur durch autorisierte Fachkräfte.",
    supplyHeading: "Angaben zu Herstellungsort & Herkunft",
    supplyIntro: "Selbstauskunft des Wirtschaftsakteurs für dieses Batteriemodell.",
    provenanceHeading: "Veröffentlichungs- & Herkunftsnachweis",
    operatorDeclarationLabel: "Erklärung des Wirtschaftsakteurs",
    operatorDeclarationValue: "Vom Wirtschaftsakteur eingereicht",
    declaredTimestampLabel: "Erklärungszeitpunkt (UTC)",
    recyclingHeading: "Entsorgungs- & Recyclinghinweise",
    recyclingSubheading:
      "Getrennte Sammlung erforderlich — nicht im unsortierten Hausmüll entsorgen",
    recyclingFallback:
      "Altbatterien an einer kommunalen Sammelstelle, beim Fachhändler oder über ein autorisiertes Rücknahmesystem abgeben.",
    jsonLdLinkLabel: "EU-Register JSON-LD",
    simpleQr: {
      badge: "Artikel 13(6) QR-Eintrag",
      docHeading: "EU-Konformitätserklärung",
      docDownload: "EU-Konformitätserklärung herunterladen (PDF)",
      docExternalLink: "EU-Konformitätserklärung öffnen",
      docNotAttached: "Referenz siehe unten.",
      collectionHeading: "Hinweise zur getrennten Sammlung & Entsorgung",
      manufacturerLabel: "Hersteller",
      addressLabel: "Postanschrift",
      modelLabel: "Modell / SKU",
      markingLabel: "Kennzeichnung getrennte Sammlung",
    },
  },
  fr: {
    passportSubtitle: "Passeport Numérique de Batterie",
    simpleQrSubtitle: "Informations Batterie UE & Déclaration (Art. 13(6))",
    manufacturerNotice:
      "Déclaré par l'opérateur économique ; non contrôlé par CratePass.",
    workingFieldNotice: "Liste de champs de travail — à vérifier selon le règlement officiel.",
    restrictedOmittedNote:
      "Les champs restreints réservés aux autorités et réparateurs sont masqués dans cette vue publique.",
    publicTierBadge: "Accès public uniquement",
    tabs: {
      passport: "Données du passeport",
      passportMobile: "Passeport",
      repair: "Entretien & réparation",
      repairMobile: "Réparation",
      supply: "Origine & chaîne",
      supplyMobile: "Origine",
      provenance: "Traçabilité & recyclage",
      provenanceMobile: "Recyclage",
    },
    groups: {
      identity: "Identité & Conformité",
      integrity: "Spécifications & Performance",
      careRepair: "Sécurité, Entretien & Démontage",
      impact: "Composition, Carbone & Fin de vie",
    },
    publicBadge: "Public",
    unitBanner: {
      serial: "Numéro de série",
      gtin: "GS1 GTIN (01)",
      batch: "Lot de fabrication",
      manufactured: "Date de fabrication",
      status: "Statut du cycle de vie",
    },
    repairHeading: "Entretien, manipulation et pièces externes",
    repairIntro:
      "Notes publiées par le fabricant. Ne pas ouvrir le boîtier lithium scellé ; intervention interne réservée aux techniciens agréés.",
    supplyHeading: "Informations de fabrication et d'origine",
    supplyIntro: "Déclaration de l'opérateur économique pour ce modèle de batterie.",
    provenanceHeading: "Enregistrement de publication",
    operatorDeclarationLabel: "Déclaration de l'opérateur",
    operatorDeclarationValue: "Déclaré par l'opérateur économique",
    declaredTimestampLabel: "Date de déclaration (UTC)",
    recyclingHeading: "Instructions de fin de vie et recyclage",
    recyclingSubheading:
      "Collecte séparée obligatoire — ne pas jeter avec les déchets ménagers",
    recyclingFallback:
      "Rapportez les batteries usagées en point de collecte municipal agréé, chez un revendeur ou auprès d'un éco-organisme.",
    jsonLdLinkLabel: "Registre UE JSON-LD",
    simpleQr: {
      badge: "Notice QR Article 13(6)",
      docHeading: "Déclaration UE de conformité",
      docDownload: "Télécharger la Déclaration UE de conformité (PDF)",
      docExternalLink: "Ouvrir la Déclaration UE de conformité",
      docNotAttached: "Référence indiquée ci-dessous.",
      collectionHeading: "Collecte séparée et instructions d'élimination",
      manufacturerLabel: "Fabricant",
      addressLabel: "Adresse postale",
      modelLabel: "Modèle / SKU",
      markingLabel: "Marquage collecte séparée",
    },
  },
  nl: {
    passportSubtitle: "Digitaal Batterijpaspoort",
    simpleQrSubtitle: "EU-Batterij-informatie & Verklaring (Art. 13(6))",
    manufacturerNotice:
      "Verklaard door de marktdeelnemer; niet gecontroleerd door CratePass.",
    workingFieldNotice: "Werkveldenlijst — controleer aan de hand van de officiële verordening.",
    restrictedOmittedNote:
      "Beperkte velden voor autoriteiten en reparateurs zijn weggelaten in deze openbare weergave.",
    publicTierBadge: "Alleen openbaar niveau",
    tabs: {
      passport: "Paspoortgegevens",
      passportMobile: "Paspoort",
      repair: "Onderhoud & reparatie",
      repairMobile: "Reparatie",
      supply: "Herkomst",
      supplyMobile: "Herkomst",
      provenance: "Herkomst & recycling",
      provenanceMobile: "Recycling",
    },
    groups: {
      identity: "Identiteit & Conformiteit",
      integrity: "Specificaties & Prestaties",
      careRepair: "Veiligheid, Onderhoud & Demontage",
      impact: "Samenstelling, CO2 & Afvalbeheer",
    },
    publicBadge: "Openbaar",
    unitBanner: {
      serial: "Serienummer",
      gtin: "GS1 GTIN (01)",
      batch: "Batch / Partij",
      manufactured: "Productiedatum",
      status: "Levenscyclusstatus",
    },
    repairHeading: "Onderhoud, gebruik & externe reserveonderdelen",
    repairIntro:
      "Gepubliceerde instructies van de fabrikant. Open geen verzegelde lithiumbehuizingen; interne service is uitsluitend voor erkende technici.",
    supplyHeading: "Opgegeven productie- en herkomstgegevens",
    supplyIntro: "Door de marktdeelnemer opgegeven locaties voor dit batterijmodel.",
    provenanceHeading: "Publicatie- en herkomstregistratie",
    operatorDeclarationLabel: "Verklaring marktdeelnemer",
    operatorDeclarationValue: "Ingediend door marktdeelnemer",
    declaredTimestampLabel: "Tijdstip verklaring (UTC)",
    recyclingHeading: "Afval- & recyclinginstructies",
    recyclingSubheading:
      "Gescheiden inzameling verplicht — niet bij het restafval gooien",
    recyclingFallback:
      "Lever lege batterijen in bij een erkend gemeentelijk inzamelpunt, fietsenmaker of terugnameprogramma.",
    jsonLdLinkLabel: "EU-register JSON-LD",
    simpleQr: {
      badge: "Artikel 13(6) QR-record",
      docHeading: "EU-conformiteitsverklaring",
      docDownload: "EU-conformiteitsverklaring downloaden (PDF)",
      docExternalLink: "EU-conformiteitsverklaring openen",
      docNotAttached: "Referentie hieronder vermeld.",
      collectionHeading: "Gescheiden inzameling & verwijdering",
      manufacturerLabel: "Fabrikant",
      addressLabel: "Postadres",
      modelLabel: "Model / SKU",
      markingLabel: "Markering gescheiden inzameling",
    },
  },
  es: {
    passportSubtitle: "Pasaporte Digital de Batería",
    simpleQrSubtitle: "Información de Batería UE y Declaración (Art. 13(6))",
    manufacturerNotice:
      "Declarado por el operador económico; sin revisión por CratePass.",
    workingFieldNotice: "Lista de campos de trabajo — consulte el reglamento oficial.",
    restrictedOmittedNote:
      "Los campos restringidos para autoridades y reparadores se omiten en esta vista pública.",
    publicTierBadge: "Solo nivel público",
    tabs: {
      passport: "Datos del pasaporte",
      passportMobile: "Pasaporte",
      repair: "Cuidado y reparación",
      repairMobile: "Reparación",
      supply: "Origen y suministro",
      supplyMobile: "Origen",
      provenance: "Registro y reciclaje",
      provenanceMobile: "Reciclaje",
    },
    groups: {
      identity: "Identidad y Conformidad",
      integrity: "Especificaciones y Rendimiento",
      careRepair: "Seguridad, Servicio y Desmontaje",
      impact: "Composición, Carbono y Fin de vida",
    },
    publicBadge: "Público",
    unitBanner: {
      serial: "Número de serie",
      gtin: "GS1 GTIN (01)",
      batch: "Lote",
      manufactured: "Fecha de fabricación",
      status: "Estado del ciclo de vida",
    },
    repairHeading: "Cuidado, manejo y repuestos externos",
    repairIntro:
      "Notas publicadas por el fabricante. No abra carcasas selladas de litio; el servicio interno corresponde solo a técnicos autorizados.",
    supplyHeading: "Notas de origen y fabricación",
    supplyIntro: "Ubicaciones declaradas por el operador económico para este modelo.",
    provenanceHeading: "Registro de publicación",
    operatorDeclarationLabel: "Declaración del operador",
    operatorDeclarationValue: "Declarado por el operador económico",
    declaredTimestampLabel: "Fecha de declaración (UTC)",
    recyclingHeading: "Instrucciones de reciclaje y fin de vida",
    recyclingSubheading:
      "Recogida separada obligatoria — no desechar con residuos domésticos",
    recyclingFallback:
      "Entregue las baterías usadas en un punto limpio municipal autorizado, distribuidor o sistema de recogida del productor.",
    jsonLdLinkLabel: "Registro UE JSON-LD",
    simpleQr: {
      badge: "Registro QR Artículo 13(6)",
      docHeading: "Declaración UE de Conformidad",
      docDownload: "Descargar Declaración UE de Conformidad (PDF)",
      docExternalLink: "Abrir Declaración UE de Conformidad",
      docNotAttached: "Referencia indicada abajo.",
      collectionHeading: "Recogida separada e instrucciones de eliminación",
      manufacturerLabel: "Fabricante",
      addressLabel: "Dirección postal",
      modelLabel: "Modelo / SKU",
      markingLabel: "Marcado de recogida separada",
    },
  },
  it: {
    passportSubtitle: "Passaporto Digitale della Batteria",
    simpleQrSubtitle: "Informazioni Batteria UE & Dichiarazione (Art. 13(6))",
    manufacturerNotice:
      "Dichiarato dall'operatore economico; non controllato da CratePass.",
    workingFieldNotice: "Elenco campi operativo — verificare rispetto al regolamento ufficiale.",
    restrictedOmittedNote:
      "I campi riservati alle autorità e ai riparatori sono omessi da questa vista pubblica.",
    publicTierBadge: "Solo livello pubblico",
    tabs: {
      passport: "Dati passaporto",
      passportMobile: "Passaporto",
      repair: "Cura e riparazione",
      repairMobile: "Riparazione",
      supply: "Origine e filiera",
      supplyMobile: "Origine",
      provenance: "Registro e riciclo",
      provenanceMobile: "Riciclo",
    },
    groups: {
      identity: "Identità e Conformità",
      integrity: "Specifiche e Prestazioni",
      careRepair: "Sicurezza, Assistenza e Smontaggio",
      impact: "Composizione, Carbonio e Fine vita",
    },
    publicBadge: "Pubblico",
    unitBanner: {
      serial: "Numero di serie",
      gtin: "GS1 GTIN (01)",
      batch: "Lotto",
      manufactured: "Data di produzione",
      status: "Stato del ciclo di vita",
    },
    repairHeading: "Cura, gestione e ricambi esterni",
    repairIntro:
      "Note pubblicate dal produttore. Non aprire involucri al litio sigillati; l'assistenza interna spetta solo a tecnici autorizzati.",
    supplyHeading: "Note su produzione e origine",
    supplyIntro: "Sedi autodichiarate dall'operatore economico per questo modello.",
    provenanceHeading: "Registro di pubblicazione",
    operatorDeclarationLabel: "Dichiarazione dell'operatore",
    operatorDeclarationValue: "Dichiarato dall'operatore economico",
    declaredTimestampLabel: "Data dichiarazione (UTC)",
    recyclingHeading: "Istruzioni di fine vita e riciclo",
    recyclingSubheading:
      "Raccolta differenziata obbligatoria — non smaltire nei rifiuti indifferenziati",
    recyclingFallback:
      "Consegnare le batterie esauste presso un centro di raccolta comunale autorizzato, un rivenditore o un consorzio di raccolta.",
    jsonLdLinkLabel: "Registro UE JSON-LD",
    simpleQr: {
      badge: "Scheda QR Articolo 13(6)",
      docHeading: "Dichiarazione di Conformità UE",
      docDownload: "Scarica Dichiarazione di Conformità UE (PDF)",
      docExternalLink: "Apri Dichiarazione di Conformità UE",
      docNotAttached: "Riferimento indicato sotto.",
      collectionHeading: "Raccolta differenziata e smaltimento",
      manufacturerLabel: "Produttore",
      addressLabel: "Indirizzo postale",
      modelLabel: "Modello / SKU",
      markingLabel: "Marcatura raccolta differenziata",
    },
  },
  pl: {
    passportSubtitle: "Cyfrowy Paszport Baterii",
    simpleQrSubtitle: "Informacje o Baterii UE i Deklaracja (Art. 13(6))",
    manufacturerNotice:
      "Deklaracja podmiotu gospodarczego; bez kontroli ze strony CratePass.",
    workingFieldNotice: "Robocza lista pól — sprawdź z oficjalnym rozporządzeniem UE.",
    restrictedOmittedNote:
      "Pola zastrzeżone dla organów nadzoru i serwisów naprawczych są ukryte w widoku publicznym.",
    publicTierBadge: "Tylko poziom publiczny",
    tabs: {
      passport: "Dane paszportu",
      passportMobile: "Paszport",
      repair: "Obsługa i naprawa",
      repairMobile: "Naprawa",
      supply: "Pochodzenie",
      supplyMobile: "Pochodzenie",
      provenance: "Rejestr i recykling",
      provenanceMobile: "Recykling",
    },
    groups: {
      identity: "Tożsamość i Zgodność",
      integrity: "Specyfikacja i Wydajność",
      careRepair: "Bezpieczeństwo, Serwis i Demontaż",
      impact: "Skład, Ślad węglowy i Recykling",
    },
    publicBadge: "Publiczne",
    unitBanner: {
      serial: "Numer seryjny",
      gtin: "GS1 GTIN (01)",
      batch: "Partia / Seria",
      manufactured: "Data produkcji",
      status: "Status cyklu życia",
    },
    repairHeading: "Obsługa, bezpieczeństwo i części zewnętrzne",
    repairIntro:
      "Instrukcje opublikowane przez producenta. Nie otwierać szczelnej obudowy litowej; serwis wewnętrzny wyłącznie dla autoryzowanych techników.",
    supplyHeading: "Informacje o miejscu produkcji",
    supplyIntro: "Lokalizacje zadeklarowane przez podmiot gospodarczy dla tego modelu.",
    provenanceHeading: "Zapis publikacji i pochodzenia",
    operatorDeclarationLabel: "Deklaracja podmiotu gospodarczego",
    operatorDeclarationValue: "Zadeklarowane przez podmiot gospodarczy",
    declaredTimestampLabel: "Znacznik czasu deklaracji (UTC)",
    recyclingHeading: "Instrukcje utylizacji i recyklingu",
    recyclingSubheading:
      "Wymagana selektywna zbiórka — nie wyrzucać z odpadami zmieszanymi",
    recyclingFallback:
      "Zużyte baterie oddaj do autoryzowanego punktu zbiórki odpadów, sklepu rowerowego lub systemu zbiórki producenta.",
    jsonLdLinkLabel: "Rejestr UE JSON-LD",
    simpleQr: {
      badge: "Karta QR Artykuł 13(6)",
      docHeading: "Deklaracja Zgodności UE",
      docDownload: "Pobierz Deklarację Zgodności UE (PDF)",
      docExternalLink: "Otwórz Deklarację Zgodności UE",
      docNotAttached: "Numer referencyjny poniżej.",
      collectionHeading: "Selektywna zbiórka i instrukcje utylizacji",
      manufacturerLabel: "Producent",
      addressLabel: "Adres pocztowy",
      modelLabel: "Model / SKU",
      markingLabel: "Oznakowanie selektywnej zbiórki",
    },
  },
};

/**
 * Compact static translations for all 71 official Annex XIII field labels across
 * DE, FR, NL, ES, IT, and PL (EN reads directly from src/config/battery-fields.ts).
 * Tuple order: [de, fr, nl, es, it, pl]
 */
const FIELD_LABELS_EU: Readonly<
  Record<string, readonly [string, string, string, string, string, string]>
> = {
  unique_identifier: [
    "Eindeutige Kennung",
    "Identifiant unique",
    "Unieke identificatiecode",
    "Identificador único",
    "Identificativo univoco",
    "Unikalny identyfikator",
  ],
  registering_entity_identity: [
    "Registrierende Stelle",
    "Entité enregistrant le passeport",
    "Registrerende entiteit",
    "Entidad registradora",
    "Soggetto registrante",
    "Podmiot rejestrujący paszport",
  ],
  manufacturer_name: [
    "Herstellername / Marke",
    "Nom du fabricant / marque",
    "Naam / merk fabrikant",
    "Nombre o marca del fabricante",
    "Nome / marchio del produttore",
    "Nazwa / znak towarowy producenta",
  ],
  manufacturer_postal_address: [
    "Postanschrift des Herstellers",
    "Adresse postale du fabricant",
    "Postadres fabrikant",
    "Dirección postal del fabricante",
    "Indirizzo postale del produttore",
    "Adres pocztowy producenta",
  ],
  manufacturer_contact_digital: [
    "Website & E-Mail des Herstellers",
    "Site web et e-mail du fabricant",
    "Website & e-mail fabrikant",
    "Web y correo del fabricante",
    "Sito web ed e-mail del produttore",
    "Strona WWW i e-mail producenta",
  ],
  battery_category: [
    "Batteriekategorie",
    "Catégorie de batterie",
    "Batterijcategorie",
    "Categoría de batería",
    "Categoria di batteria",
    "Kategoria baterii",
  ],
  model_serial_number: [
    "Modell- / Chargen- / Seriennummer",
    "Modèle / lot / numéro de série",
    "Model / batch / serienummer",
    "Modelo / lote / número de serie",
    "Modello / lotto / numero di serie",
    "Model / partia / numer seryjny",
  ],
  place_of_manufacture: [
    "Herstellungsort",
    "Lieu de fabrication",
    "Plaats van vervaardiging",
    "Lugar de fabricación",
    "Luogo di fabbricazione",
    "Miejsce produkcji",
  ],
  date_of_manufacturing: [
    "Herstellungsdatum",
    "Date de fabrication",
    "Productiedatum",
    "Fecha de fabricación",
    "Data di fabbricazione",
    "Data produkcji",
  ],
  weight_kg: [
    "Gewicht",
    "Poids",
    "Gewicht",
    "Peso",
    "Peso",
    "Masa",
  ],
  capacity_ah: [
    "Nennkapazität",
    "Capacité nominale",
    "Nominale capaciteit",
    "Capacidad nominal",
    "Capacità nominale",
    "Pojemność znamionowa",
  ],
  chemistry_type: [
    "Zellchemie",
    "Chimie de la batterie",
    "Batterijchemie",
    "Química de la batería",
    "Chimica della batteria",
    "Chemia ogniw",
  ],
  hazardous_substances_other: [
    "Gefährliche Stoffe (außer Hg/Cd/Pb)",
    "Substances dangereuses (hors Hg/Cd/Pb)",
    "Gevaarlijke stoffen (geen Hg/Cd/Pb)",
    "Sustancias peligrosas (no Hg/Cd/Pb)",
    "Sostanze pericolose (non Hg/Cd/Pb)",
    "Substancje niebezpieczne (inne niż Hg/Cd/Pb)",
  ],
  extinguishing_agent: [
    "Geeignetes Löschmittel",
    "Agent extincteur utilisable",
    "Geschikt blusmiddel",
    "Agente extintor utilizable",
    "Agente estinguente utilizzabile",
    "Odpowiedni środek gaśniczy",
  ],
  critical_raw_materials: [
    "Kritische Rohstoffe (>0,1 % Gew.)",
    "Matières premières critiques (>0,1 %)",
    "Kritieke grondstoffen (>0,1%)",
    "Materias primas críticas (>0,1%)",
    "Materie prime critiche (>0,1%)",
    "Surowce krytyczne (>0,1% masy)",
  ],
  material_composition_summary: [
    "Materialzusammensetzung (Übersicht)",
    "Composition matérielle (résumé)",
    "Materiaalsamenstelling (overzicht)",
    "Composición de materiales (resumen)",
    "Composizione dei materiali (sintesi)",
    "Skład materiałowy (podsumowanie)",
  ],
  carbon_footprint_declaration: [
    "CO2-Fußabdruck-Erklärung",
    "Déclaration d'empreinte carbone",
    "Koolstofvoetafdrukverklaring",
    "Declaración de huella de carbono",
    "Dichiarazione impronta di carbonio",
    "Deklaracja śladu węglowego",
  ],
  carbon_footprint_label: [
    "CO2-Fußabdruck-Leistungsklasse",
    "Classe d'empreinte carbone",
    "Koolstofvoetafdruklabel",
    "Etiqueta de huella de carbono",
    "Classe impronta di carbonio",
    "Klasa śladu węglowego",
  ],
  due_diligence_report: [
    "Sorgfaltspflichtbericht Lieferkette",
    "Rapport de devoir de diligence",
    "Rapport zorgvuldigheid toeleveringsketen",
    "Informe de diligencia debida",
    "Relazione dovuta diligenza",
    "Raport należytej staranności",
  ],
  recovered_cobalt_percent: [
    "Anteil recyceltes Kobalt",
    "Part de cobalt recyclé",
    "Aandeel gerecycled kobalt",
    "% de cobalto recuperado",
    "% di cobalto recuperato",
    "Udział odzyskanego kobaltu",
  ],
  recovered_lithium_percent: [
    "Anteil recyceltes Lithium",
    "Part de lithium recyclé",
    "Aandeel gerecycled lithium",
    "% de litio recuperado",
    "% di litio recuperato",
    "Udział odzyskanego litu",
  ],
  recovered_nickel_percent: [
    "Anteil recyceltes Nickel",
    "Part de nickel recyclé",
    "Aandeel gerecycled nikkel",
    "% de níquel recuperado",
    "% di nichel recuperato",
    "Udział odzyskanego niklu",
  ],
  recovered_lead_percent: [
    "Anteil recyceltes Blei",
    "Part de plomb recyclé",
    "Aandeel gerecycled lood",
    "% de plomo recuperado",
    "% di piombo recuperato",
    "Udział odzyskanego ołowiu",
  ],
  renewable_content_share: [
    "Anteil erneuerbarer Inhalte",
    "Part de contenu renouvelable",
    "Aandeel hernieuwbare inhoud",
    "Porcentaje de contenido renovable",
    "Quota di contenuto rinnovabile",
    "Udział surowców odnawialnych",
  ],
  rated_capacity_duplicate: [
    "Nennkapazität (Referenz)",
    "Capacité assignée (référence)",
    "Nominale capaciteit (referentie)",
    "Capacidad nominal (referencia)",
    "Capacità nominale (riferimento)",
    "Pojemność znamionowa (odniesienie)",
  ],
  minimal_voltage_v: [
    "Mindestspannung",
    "Tension minimale",
    "Minimale spanning",
    "Tensión mínima",
    "Tensione minima",
    "Napięcie minimalne",
  ],
  nominal_voltage_v: [
    "Nennspannung",
    "Tension nominale",
    "Nominale spanning",
    "Tensión nominal",
    "Tensione nominale",
    "Napięcie znamionowe",
  ],
  maximum_voltage_v: [
    "Höchstspannung",
    "Tension maximale",
    "Maximale spanning",
    "Tensión máxima",
    "Tensione massima",
    "Napięcie maksymalne",
  ],
  original_power_w: [
    "Ursprüngliche Leistungsfähigkeit",
    "Capacité de puissance initiale",
    "Oorspronkelijk vermogen",
    "Capacidad de potencia original",
    "Capacità di potenza originale",
    "Pierwotna moc znamionowa",
  ],
  power_limits_w: [
    "Leistungsgrenzen",
    "Limites de puissance",
    "Vermogensgrenzen",
    "Límites de potencia",
    "Limiti di potenza",
    "Limity mocy",
  ],
  expected_lifetime_cycles: [
    "Erwartete Zyklenlebensdauer",
    "Durée de vie prévue en cycles",
    "Verwachte levensduur in cycli",
    "Vida útil esperada en ciclos",
    "Durata prevista in cicli",
    "Oczekiwana żywotność (cykle)",
  ],
  expected_lifetime_test_ref: [
    "Referenztest für Lebensdauer",
    "Test de référence de durée de vie",
    "Referentietest levensduur",
    "Ensayo de referencia de vida útil",
    "Test di riferimento per la durata",
    "Test referencyjny żywotności",
  ],
  exhaustion_capacity_threshold: [
    "Kapazitätsschwelle für Erschöpfung",
    "Seuil de capacité d'épuisement",
    "Capaciteitsdrempel uitputting",
    "Umbral de capacidad de agotamiento",
    "Soglia di capacità per esaurimento",
    "Próg pojemności wyczerpania",
  ],
  temperature_range_c: [
    "Zulässiger Temperaturbereich",
    "Plage de température",
    "Temperatuurbereik",
    "Rango de temperatura",
    "Intervallo di temperatura",
    "Zakres temperatur pracy",
  ],
  commercial_warranty_period: [
    "Gewerbliche Garantiezeit",
    "Période de garantie commerciale",
    "Commerciële garantieperiode",
    "Período de garantía comercial",
    "Periodo di garanzia commerciale",
    "Okres gwarancji handlowej",
  ],
  initial_rte_percent: [
    "Anfänglicher Hin- und Rückwirkungsgrad",
    "Rendement énergétique aller-retour initial",
    "Initiële round-trip-efficiëntie",
    "Eficiencia energética inicial ida y vuelta",
    "Efficienza energetica iniziale andata/ritorno",
    "Początkowa sprawność cyklu",
  ],
  midlife_rte_percent: [
    "Wirkungsgrad bei 50 % Lebensdauer",
    "Rendement à 50 % de durée de vie",
    "Efficiëntie bij 50% levensduur",
    "Eficiencia al 50% de vida útil",
    "Efficienza al 50% della vita utile",
    "Sprawność w połowie żywotności",
  ],
  internal_resistance_ohms: [
    "Zell- und Pack-Innenwiderstand",
    "Résistance interne cellule et pack",
    "Interne cel- en packweerstand",
    "Resistencia interna de celda y paquete",
    "Resistenza interna cella e pacco",
    "Rezystancja wewnętrzna ogniwa i pakietu",
  ],
  charge_c_rate: [
    "Lade-C-Rate (Zyklenlebensdauertest)",
    "Taux C de charge",
    "Laad-C-snelheid",
    "Tasa C de carga",
    "Tasso C di carica",
    "Współczynnik C ładowania",
  ],
  discharge_c_rate: [
    "Entlade-C-Rate",
    "Taux C de décharge",
    "Ontlaad-C-snelheid",
    "Tasa C de descarga",
    "Tasso C di scarica",
    "Współczynnik C rozładowania",
  ],
  art_13_4_marking: [
    "Kennzeichnung Artikel 13(4)",
    "Marquage article 13(4)",
    "Markering artikel 13(4)",
    "Marcado artículo 13(4)",
    "Marcatura articolo 13(4)",
    "Oznakowanie artykuł 13(4)",
  ],
  cd_pb_symbol: [
    "Cadmium- oder Bleisymbol (Cd/Pb)",
    "Symbole cadmium ou plomb (Cd/Pb)",
    "Cadmium- of loodsymbool (Cd/Pb)",
    "Símbolo de cadmio o plomo (Cd/Pb)",
    "Simbolo cadmio o piombo (Cd/Pb)",
    "Symbol kadmu lub ołowiu (Cd/Pb)",
  ],
  eu_doc_link: [
    "EU-Konformitätserklärung",
    "Déclaration UE de conformité",
    "EU-conformiteitsverklaring",
    "Declaración UE de conformidad",
    "Dichiarazione di conformità UE",
    "Deklaracja zgodności UE",
  ],
  waste_battery_info: [
    "Informationen zu Altbatterien",
    "Informations sur les déchets de batteries",
    "Informatie over afgedankte batterijen",
    "Información sobre residuos de baterías",
    "Informazioni sui rifiuti di batterie",
    "Informacje o zużytych bateriach",
  ],
  instructions_printable: [
    "Druckbare Gebrauchsanleitung",
    "Instructions d'utilisation imprimables",
    "Afdrukbare gebruiksaanwijzing",
    "Instrucciones de uso imprimibles",
    "Istruzioni per l'uso stampabili",
    "Instrukcja obsługi do druku",
  ],
  detailed_composition: [
    "Detaillierte Zusammensetzung (Kathode/Anode)",
    "Composition détaillée (cathode/anode)",
    "Gedetailleerde samenstelling (kathode/anode)",
    "Composición detallada (cátodo/ánodo)",
    "Composizione dettagliata (catodo/anodo)",
    "Szczegółowy skład (katoda/anoda)",
  ],
  spare_parts_info: [
    "Ersatzteile (Teilenummer & Kontakt)",
    "Pièces de rechange (réf. et contact)",
    "Reserveonderdelen (nummer & contact)",
    "Piezas de repuesto (ref. y contacto)",
    "Pezzi di ricambio (codice e contatto)",
    "Części zamienne (numery i kontakt)",
  ],
  dismantling_information: [
    "Demontageinformationen",
    "Informations de démontage",
    "Demontage-informatie",
    "Información de desmontaje",
    "Informazioni di smontaggio",
    "Informacje o demontażu",
  ],
  safety_measures: [
    "Sicherheitsmaßnahmen",
    "Mesures de sécurité",
    "Veiligheidsmaatregelen",
    "Medidas de seguridad",
    "Misure di sicurezza",
    "Środki bezpieczeństwa",
  ],
  compliance_test_reports: [
    "Prüfberichtsergebnisse",
    "Résultats des rapports d'essai",
    "Testrapportresultaten",
    "Resultados de informes de ensayo",
    "Risultati dei rapporti di prova",
    "Wyniki raportów z badań",
  ],
  individual_rated_capacity: [
    "Individuelle Nennkapazität",
    "Capacité nominale individuelle",
    "Individuele nominale capaciteit",
    "Capacidad nominal individual",
    "Capacità nominale individuale",
    "Indywidualna pojemność znamionowa",
  ],
  individual_performance_values: [
    "Individuelle Leistungswerte",
    "Valeurs de performance individuelles",
    "Individuele prestatiewaarden",
    "Valores de rendimiento individuales",
    "Valori di prestazione individuali",
    "Indywidualne wartości wydajności",
  ],
  individual_power_w: [
    "Individuelle Leistung",
    "Puissance individuelle",
    "Individueel vermogen",
    "Potencia individual",
    "Potenza individuale",
    "Indywidualna moc",
  ],
  power_fade_percent: [
    "Leistungsabnahme",
    "Perte de puissance",
    "Vermogensverlies",
    "Pérdida de potencia",
    "Riduzione di potenza",
    "Spadek mocy",
  ],
  individual_internal_resistance: [
    "Individueller Innenwiderstand",
    "Résistance interne individuelle",
    "Individuele interne weerstand",
    "Resistencia interna individual",
    "Resistenza interna individuale",
    "Indywidualna rezystancja wewnętrzna",
  ],
  resistance_increase_percent: [
    "Innenwiderstandszunahme",
    "Augmentation de la résistance interne",
    "Toename interne weerstand",
    "Incremento de resistencia interna",
    "Aumento della resistenza interna",
    "Wzrost rezystancji wewnętrznej",
  ],
  individual_rte_percent: [
    "Individueller Hin- und Rückwirkungsgrad",
    "Rendement aller-retour individuel",
    "Individuele round-trip-efficiëntie",
    "Eficiencia ida y vuelta individual",
    "Efficienza andata/ritorno individuale",
    "Indywidualna sprawność cyklu",
  ],
  individual_rte_fade_percent: [
    "Rückgang des Wirkungsgrads",
    "Perte de rendement aller-retour",
    "Afname round-trip-efficiëntie",
    "Pérdida de eficiencia ida y vuelta",
    "Calo di efficienza andata/ritorno",
    "Spadek sprawności cyklu",
  ],
  performance_value_years: [
    "Lebensdauerwert (Jahre)",
    "Durée de vie opérationnelle (ans)",
    "Levensduurwaarde (jaren)",
    "Valor de vida útil (años)",
    "Valore di durata utile (anni)",
    "Wartość żywotności (lata)",
  ],
  performance_value_metric: [
    "Leistungs- / Lebensdauerkennzahl",
    "Indicateur de performance / durée de vie",
    "Prestatie- / levensduurmetriek",
    "Métrica de rendimiento / vida útil",
    "Metrica prestazioni / durata",
    "Wskaźnik wydajności / żywotności",
  ],
  state_of_certified_energy: [
    "Zustand der nachgewiesenen Energie (SOCE)",
    "État d'énergie attestée (SOCE)",
    "Status van vastgestelde energie (SOCE)",
    "Estado de energía acreditada (SOCE)",
    "Stato dell'energia attestata (SOCE)",
    "Stan poświadczonej energii (SOCE)",
  ],
  remaining_capacity_ah: [
    "Verbleibende Kapazität",
    "Capacité restante",
    "Resterende capaciteit",
    "Capacidad restante",
    "Capacità residua",
    "Pozostała pojemność",
  ],
  remaining_power_w: [
    "Verbleibende Leistungsfähigkeit",
    "Puissance restante",
    "Resterend vermogen",
    "Potencia restante",
    "Potenza residua",
    "Pozostała moc",
  ],
  remaining_rte_percent: [
    "Verbleibender Wirkungsgrad",
    "Rendement aller-retour restant",
    "Resterende round-trip-efficiëntie",
    "Eficiencia restante",
    "Efficienza residua",
    "Pozostała sprawność cyklu",
  ],
  self_discharge_evolution: [
    "Entwicklung der Selbstentladerate",
    "Évolution du taux d'autodécharge",
    "Verloop zelfontlading",
    "Evolución de la autodescarga",
    "Evoluzione dell'autoscarica",
    "Zmiana tempa samorozładowania",
  ],
  ohmic_resistance: [
    "Ohmscher Widerstand",
    "Résistance ohmique",
    "Ohmse weerstand",
    "Resistencia óhmica",
    "Resistenza ohmica",
    "Rezystancja omowa",
  ],
  battery_status: [
    "Batteriestatus",
    "Statut de la batterie",
    "Batterijstatus",
    "Estado de la batería",
    "Stato della batteria",
    "Status baterii",
  ],
  cycle_count: [
    "Lade- / Entladezyklen",
    "Cycles de charge/décharge",
    "Laad-/ontlaadcycli",
    "Ciclos de carga/descarga",
    "Cicli di carica/scarica",
    "Cykle ładowania/rozładowania",
  ],
  negative_events_log: [
    "Negative Ereignisse (Unfälle)",
    "Événements négatifs (accidents)",
    "Negatieve gebeurtenissen (incidenten)",
    "Eventos negativos (accidentes)",
    "Eventi negativi (incidenti)",
    "Zdarzenia negatywne (wypadki)",
  ],
  environmental_conditions_log: [
    "Betriebs-Umgebungsbedingungen",
    "Conditions environnementales d'exploitation",
    "Omgevingsomstandigheden tijdens gebruik",
    "Condiciones ambientales de operación",
    "Condizioni ambientali operative",
    "Warunki środowiskowe pracy",
  ],
  periodic_state_of_charge: [
    "Periodischer Ladezustand (SoC)",
    "État de charge périodique (SoC)",
    "Periodieke laadstatus (SoC)",
    "Estado de carga periódico (SoC)",
    "Stato di carica periodico (SoC)",
    "Okresowy stan naładowania (SoC)",
  ],
};

const EU_INDEX_MAP: Record<Exclude<PublicPassportLocale, "en">, number> = {
  de: 0,
  fr: 1,
  nl: 2,
  es: 3,
  it: 4,
  pl: 5,
};

const ENGLISH_LABEL_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  OFFICIAL_71_FIELDS.map((f) => [f.key, f.label]),
);

export function getLocalizedFieldLabel(
  fieldKey: string,
  locale: PublicPassportLocale,
): string {
  if (locale === "en") {
    return ENGLISH_LABEL_MAP[fieldKey] ?? fieldKey;
  }
  const tuple = FIELD_LABELS_EU[fieldKey];
  if (tuple) {
    return tuple[EU_INDEX_MAP[locale]];
  }
  return ENGLISH_LABEL_MAP[fieldKey] ?? fieldKey;
}

export function getTranslatedFieldKeyCount(): number {
  return Object.keys(FIELD_LABELS_EU).length;
}
