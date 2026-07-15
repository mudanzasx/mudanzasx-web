"use client";

// Carga de la Maps JavaScript API (librería Places) UNA sola vez y de forma
// perezosa (solo cuando un campo de dirección la necesita). Usamos la Places API
// (New): AutocompleteSuggestion para las sugerencias y Place.fetchFields para
// resolver la dirección elegida y comprobar el número de calle.

import { useEffect, useState } from "react";

// --- Formas mínimas de lo que usamos de la API (evita depender de @types) ---
export type AddressComponent = {
  types: string[];
  longText: string;
  shortText: string;
};

export type PlaceLike = {
  formattedAddress?: string | null;
  addressComponents?: AddressComponent[];
  fetchFields: (options: { fields: string[] }) => Promise<{ place: PlaceLike }>;
};

type FormattableText = { text: string } | null;

export type PlacePrediction = {
  placeId: string;
  text: { text: string };
  mainText?: FormattableText;
  secondaryText?: FormattableText;
  toPlace: () => PlaceLike;
};

export type Suggestion = { placePrediction: PlacePrediction | null };

type AutocompleteRequest = {
  input: string;
  sessionToken?: object;
  includedRegionCodes?: string[];
  language?: string;
  region?: string;
};

export type PlacesLibrary = {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (
      request: AutocompleteRequest
    ) => Promise<{ suggestions: Suggestion[] }>;
  };
  AutocompleteSessionToken: new () => object;
};

type MapsGlobal = {
  maps?: { importLibrary?: (name: string) => Promise<unknown> };
};

declare global {
  interface Window {
    google?: MapsGlobal;
  }
}

let placesPromise: Promise<PlacesLibrary> | null = null;

// Devuelve (y memoiza) la librería Places, cargando el script si hace falta.
export function loadPlacesLibrary(): Promise<PlacesLibrary> {
  if (placesPromise) return placesPromise;

  placesPromise = new Promise<PlacesLibrary>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY."));
      return;
    }

    const usarLib = () => {
      window
        .google!.maps!.importLibrary!("places")
        .then((lib) => resolve(lib as PlacesLibrary))
        .catch(reject);
    };

    // Con loading=async, google.maps.importLibrary puede no existir todavía en
    // el momento del onload; esperamos (poll breve) a que esté disponible.
    const esperarImportLibrary = () => {
      const t0 = Date.now();
      const check = () => {
        if (window.google?.maps?.importLibrary) {
          usarLib();
        } else if (Date.now() - t0 > 10000) {
          reject(new Error("Google Maps no se inicializó a tiempo."));
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    };

    if (window.google?.maps?.importLibrary) {
      usarLib();
      return;
    }

    // Reutiliza el script si ya está inyectado (una sola carga en la página).
    const existente = document.getElementById(
      "google-maps-js"
    ) as HTMLScriptElement | null;
    if (existente) {
      esperarImportLibrary();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&loading=async&libraries=places&language=es&region=ES`;
    script.onload = esperarImportLibrary;
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return placesPromise;
}

// Disparo perezoso de la carga: NO empieza en el montaje, sino cuando el usuario
// muestra intención de usar un campo de dirección (primer foco). La carga es
// única y compartida (singleton `placesPromise`), así que da igual qué campo la
// dispare —hero o formulario—: todas las instancias de `usePlaces` montadas se
// enteran a la vez a través de estos listeners.
let loadingTriggered = false;
const triggerListeners = new Set<() => void>();

export function ensurePlacesLoading(): void {
  if (loadingTriggered) return; // idempotente: una sola carga por página
  loadingTriggered = true;
  loadPlacesLibrary(); // arranca la carga (el singleton evita duplicados)
  triggerListeners.forEach((fn) => fn());
  triggerListeners.clear();
}

// Hook: expone la librería cuando está lista, si la carga falló (para degradar
// con elegancia y no bloquear el formulario) y `ensureLoaded` para dispararla
// bajo demanda desde el `onFocus` de un campo de dirección.
export function usePlaces(): {
  lib: PlacesLibrary | null;
  failed: boolean;
  ensureLoaded: () => void;
} {
  const [lib, setLib] = useState<PlacesLibrary | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let activo = true;
    // Se suscribe al resultado de la carga compartida. Si la carga ya se disparó
    // (otro campo la inició antes de montar este), se engancha de inmediato.
    const attach = () => {
      loadPlacesLibrary()
        .then((l) => {
          if (activo) setLib(l);
        })
        .catch(() => {
          if (activo) setFailed(true);
        });
    };
    if (loadingTriggered) {
      attach();
    } else {
      triggerListeners.add(attach);
    }
    return () => {
      activo = false;
      triggerListeners.delete(attach);
    };
  }, []);

  return { lib, failed, ensureLoaded: ensurePlacesLoading };
}
