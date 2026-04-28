import { useEffect, useRef, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const SCRIPT_ID = 'google-maps-places-script';

let scriptPromise = null;
const loadGoogleMaps = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY in client/.env'));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const wait = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(wait);
          resolve(window.google);
        }
      }, 80);
      return;
    }

    // Google Maps invokes this callback once Places is ready.
    window.__daunMapsLoaded = () => {
      if (window.google?.maps?.places) resolve(window.google);
      else reject(new Error('Google Maps loaded but Places library is missing'));
    };
    // Optional: surface authentication errors (invalid key, referrer not allowed, billing off)
    window.gm_authFailure = () => {
      scriptPromise = null;
      reject(new Error('Google Maps authentication failed — check API key, allowed referrers, and that Places API is enabled'));
    };

    const s = document.createElement('script');
    s.id = SCRIPT_ID;
    s.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async&callback=__daunMapsLoaded`;
    s.async = true;
    s.defer = true;
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load https://maps.googleapis.com/maps/api/js — check network/CORS'));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
};

/**
 * Address input backed by Google Places Autocomplete.
 *
 * Calls onChange({ target: { name: 'deliveryAddress', value }}) with the formatted address
 * and onPlace(place) with the full Google place object when the user picks a suggestion.
 */
const AddressAutocomplete = ({
  value,
  onChange,
  onPlace,
  placeholder = 'Start typing an address…',
  className = '',
  required = false,
  countryRestrictions = ['us'],
  inputId,
  showStatus = true,
}) => {
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error | manual
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // { address, lat, lng }

  useEffect(() => {
    let mounted = true;

    if (!API_KEY) {
      setStatus('manual');
      setError('Address autocomplete unavailable — please type manually.');
      return;
    }

    loadGoogleMaps()
      .then((google) => {
        if (!mounted || !inputRef.current) return;
        try {
          const ac = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ['formatted_address', 'geometry', 'name', 'address_components', 'place_id'],
            types: ['address'],
            componentRestrictions: { country: countryRestrictions },
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            const addr = place?.formatted_address || inputRef.current?.value || '';
            if (addr) onChange?.({ target: { name: 'deliveryAddress', value: addr } });
            if (place?.geometry?.location) {
              setSelected({
                address: addr,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              });
            } else {
              setSelected(null);
            }
            if (onPlace) onPlace(place);
          });
          acRef.current = ac;
          setStatus('ready');
        } catch (e) {
          setStatus('error');
          setError(e?.message || 'Failed to initialize autocomplete.');
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setStatus('error');
        setError(e?.message || 'Could not load Google Maps.');
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear "selected" indicator when the user manually edits the value after a pick
  const handleChange = (e) => {
    if (selected && e.target.value !== selected.address) {
      setSelected(null);
    }
    onChange?.(e);
  };

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        name="deliveryAddress"
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        required={required}
        autoComplete="off"
      />

      {showStatus && (
        <div style={{ marginTop: 8, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {status === 'loading' && (
            <span style={{ color: 'var(--color-text-muted, #7A6B6B)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#C9A876', marginRight: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
              Loading Google Maps…
            </span>
          )}
          {status === 'ready' && !selected && (
            <span style={{ color: 'var(--color-text-muted, #7A6B6B)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4A7C59', marginRight: 6 }} />
              Autocomplete ready — start typing
            </span>
          )}
          {status === 'ready' && selected && (
            <span style={{ color: '#4A7C59', fontWeight: 600 }}>
              ✓ Verified · {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
            </span>
          )}
          {(status === 'error' || status === 'manual') && (
            <span style={{ color: '#C0392B' }}>
              ⚠ {error}
            </span>
          )}
        </div>
      )}
    </>
  );
};

export default AddressAutocomplete;
