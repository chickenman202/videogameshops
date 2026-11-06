import type { ShopView } from "@/lib/shop-view";
import { slugify, storeSlug } from "@/lib/slug";
import { getStateFromInput } from "@/lib/states";

/**
 * Temporary local preview. These six rows are copied from data/stores.json
 * on the import branch. Nothing here is guessed. Callers must use this only
 * when the live catalog has zero shops.
 */
type FixtureInput = {
  id: string;
  name: string;
  address?: string;
  city: string;
  region: string;
  country: string;
  countryName: string;
  zip?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  photo?: string;
  hoursRaw?: string;
  about?: string;
  lat: number;
  lng: number;
};

function shop(input: FixtureInput): ShopView {
  const us = getStateFromInput(input.country === "US" ? input.region : "");
  const code = us?.abbreviation || input.country;
  return {
    id: input.id,
    slug: storeSlug(input.name, input.city, code),
    name: input.name,
    address: input.address ?? "",
    city: input.city,
    citySlug: slugify(input.city),
    state: us?.name || input.region,
    stateSlug: us?.slug ?? "",
    stateAbbr: us?.abbreviation ?? "",
    zip: input.zip ?? null,
    country: input.country,
    countryName: input.countryName,
    phone: input.phone ?? null,
    website: input.website ?? null,
    about: input.about ?? null,
    hours: null,
    hoursRaw: input.hoursRaw ?? null,
    platforms: [],
    sellsNew: false,
    sellsUsed: false,
    tradeIns: false,
    repairs: false,
    lat: input.lat,
    lng: input.lng,
    photo: input.photo ?? null,
    facebook: input.facebook ?? null,
    instagram: input.instagram ?? null,
    twitter: input.twitter ?? null,
    otherSocials: [],
    updatedAt: "2026-11-06",
  };
}

export const FIXTURE_SHOPS: ShopView[] = [
  shop({
    id: "preview-press-start",
    name: "Press Start Video Games",
    address: "102 1st St N",
    city: "Alabaster",
    region: "Alabama",
    country: "US",
    countryName: "United States",
    zip: "35007",
    phone: "2056243234",
    website: "https://pressstartal.com/",
    instagram: "https://www.instagram.com/pressstart_al",
    photo:
      "https://pressstartal.com/wp-content/uploads/sites/42/Press-Start-Gaming-Store-Near-Birmingham-in-Alabaster-Buy-Sell-Trade-Parties_5.jpg",
    hoursRaw: "Mo,Tu,We,Th,Fr,Sa 08:00-18:00",
    about:
      "Established in 2014, Press Start was founded on a dream. One of having a place where gamers could not only play but also purchase or trade their games at a reasonable price.",
    lat: 33.2439176,
    lng: -86.8163246,
  }),
  shop({
    id: "preview-culture-shock",
    name: "Culture Shock Houston Premium Outlets- Anime, Pop Culture, Pokemon, Video Games, Funko",
    address: "29300 Hempstead Rd #1208",
    city: "Cypress",
    region: "Texas",
    country: "US",
    countryName: "United States",
    zip: "29300",
    phone: "+12819307918",
    website: "https://www.cultureshockpcs.com/",
    photo: "http://cultureshockpcs.com/cdn/shop/files/cs1_af3f2c7f-8612-4126-9c23-1b1ab8503afd.png?v=1726702427",
    lat: 29.9978113,
    lng: -95.7557595,
  }),
  shop({
    id: "preview-maxxi",
    name: "Maxxi Games",
    address: "16 Rue Paul Bert",
    city: "Aix-en-Provence",
    region: "Provence-Alpes-Cote d'Azur",
    country: "FR",
    countryName: "France",
    facebook: "https://www.facebook.com/maxxigamesaix",
    hoursRaw: "Mo-Sa 10:00-19:00",
    lat: 43.5305581,
    lng: 5.4487317,
  }),
  shop({
    id: "preview-pixeles",
    name: "Pixeles",
    address: "188 Juan B. Justo",
    city: "Beccar",
    region: "Buenos Aires",
    country: "AR",
    countryName: "Argentina",
    zip: "B1643",
    facebook: "https://www.facebook.com/Pixeles-Juegos-279519202994276",
    hoursRaw: "Mo-Sa 10:00-13:30,15:30-19:30; Su off",
    lat: -34.4610524,
    lng: -58.5291446,
  }),
  shop({
    id: "preview-maze",
    name: "Maze of Games",
    address: "Rruga Ramazan Shijaku",
    city: "Tirana",
    region: "Tirane",
    country: "AL",
    countryName: "Albania",
    phone: "+355698234238",
    lat: 41.3352116,
    lng: 19.8185605,
  }),
  shop({
    id: "preview-bauseli",
    name: "Esports Bauseli",
    city: "la Massana",
    region: "La Massana",
    country: "AD",
    countryName: "Andorra",
    lat: 42.5483125,
    lng: 1.5133131,
  }),
];
