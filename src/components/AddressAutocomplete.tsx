"use client";

import { useEffect, useRef, useState } from "react";
import { usePlaces, type Suggestion } from "@/lib/googleMaps";

// Input de dirección con autocompletado de Google Places (New) y dropdown propio
// (estilo sobrio de la marca). Restringe las sugerencias a España y, al elegir
// una, comprueba si incluye número de calle (street_number).
//
// `onChange(value, hasNumber)` se llama:
//  - al teclear: hasNumber = true si el texto ya contiene un número (no obliga a
//    elegir una sugerencia); si no, false hasta elegir una con número;
//  - al elegir una sugerencia: hasNumber = si la dirección lleva street_number.
// Si Google no está disponible, degrada a input normal y reporta hasNumber=true
// para no bloquear el formulario.
export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  wrapperClassName,
  id,
  inputRef,
  ariaLabel,
  required,
}: {
  value: string;
  onChange: (value: string, hasNumber: boolean) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  id?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  ariaLabel?: string;
  required?: boolean;
}) {
  const { lib, failed, ensureLoaded } = usePlaces();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<object | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);
  const focusedRef = useRef(false);

  // Cierra el dropdown al hacer clic fuera.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Caso "usuario rápido": si empezó a escribir ANTES de que Maps terminara de
  // cargar, `buscar` no encontró librería y no sugirió nada. Cuando la librería
  // llega, se busca sobre lo ya escrito (si el campo sigue enfocado), para que el
  // autocompletado aparezca sin perder el texto ni el foco.
  useEffect(() => {
    if (lib && focusedRef.current && value.trim().length >= 3) {
      buscar(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib]);

  function buscar(input: string) {
    if (!lib || input.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (!tokenRef.current) tokenRef.current = new lib.AutocompleteSessionToken();
    const myId = ++reqIdRef.current;
    lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: tokenRef.current ?? undefined,
      includedRegionCodes: ["es"],
      language: "es",
      region: "ES",
    })
      .then((res) => {
        if (myId !== reqIdRef.current) return; // ignora respuestas obsoletas
        const list = (res.suggestions ?? []).filter((s) => s.placePrediction);
        setSuggestions(list);
        setOpen(list.length > 0);
        setActiveIndex(-1);
      })
      .catch(() => {
        if (myId !== reqIdRef.current) return;
        setSuggestions([]);
        setOpen(false);
      });
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    // Se da por válido el número si Maps degradó (failed) o si el texto escrito a
    // mano ya incluye un número (no se obliga a elegir una sugerencia).
    onChange(v, failed || /\d/.test(v));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(v), 200);
  }

  async function elegir(s: Suggestion) {
    const pred = s.placePrediction;
    if (!pred) return;
    setOpen(false);
    setSuggestions([]);
    try {
      const place = pred.toPlace();
      const { place: full } = await place.fetchFields({
        fields: ["formattedAddress", "addressComponents"],
      });
      const formatted = full.formattedAddress ?? pred.text.text;
      const hasNumber = Boolean(
        full.addressComponents?.some((c) => c.types.includes("street_number"))
      );
      onChange(formatted, hasNumber);
    } catch {
      onChange(pred.text.text, false);
    } finally {
      tokenRef.current = null; // nueva sesión de facturación tras cada selección
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        elegir(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative ${wrapperClassName ?? ""}`}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          focusedRef.current = true;
          // Intención de usar el campo → dispara la carga de Maps (una sola vez,
          // compartida). Al ser en el foco (antes de escribir), la librería tiene
          // tiempo de cargar mientras el usuario teclea las primeras letras.
          ensureLoaded();
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          focusedRef.current = false;
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        required={required}
        autoComplete="off"
        className={className}
      />

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-72 overflow-auto rounded-card border border-hairline bg-white py-1 text-left shadow-card"
        >
          {suggestions.map((s, i) => {
            const pred = s.placePrediction!;
            const main = pred.mainText?.text ?? pred.text.text;
            const sec = pred.secondaryText?.text ?? "";
            return (
              <li key={`${pred.placeId}-${i}`}>
                <button
                  type="button"
                  // onMouseDown (no onClick) para seleccionar antes del blur.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(s);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-2 transition-colors ${
                    i === activeIndex ? "bg-gris" : "hover:bg-gris"
                  }`}
                >
                  <span className="text-sm text-black">{main}</span>
                  {sec && <span className="text-xs text-black/50">{sec}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
