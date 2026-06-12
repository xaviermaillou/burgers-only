function formatCoordinate(value, positiveLabel, negativeLabel) {
  const absoluteValue = Math.abs(value).toFixed(4);
  const direction = value >= 0 ? positiveLabel : negativeLabel;
  return `${absoluteValue}° ${direction}`;
}

async function loadAreas() {
  const response = await fetch('/data/luxembourg-areas.json');
  if (!response.ok) {
    throw new Error(`Failed to load Luxembourg areas: ${response.status}`);
  }

  return response.json();
}

function isInsideArea(coords, area) {
  return (
    coords.latitude >= area.minLat &&
    coords.latitude <= area.maxLat &&
    coords.longitude >= area.minLon &&
    coords.longitude <= area.maxLon
  );
}

function formatArea(area) {
  if (!area) {
    return '';
  }

  if (area.city) {
    return `${area.name}, ${area.city}`;
  }

  return area.name || '';
}

function formatPosition(coords, areaLabel) {
  if (areaLabel) {
    return areaLabel;
  }

  const latitude = formatCoordinate(coords.latitude, 'N', 'S');
  const longitude = formatCoordinate(coords.longitude, 'E', 'W');
  return `${latitude}, ${longitude}`;
}

function resolveArea(coords, areas) {
  const match = areas.find((area) => isInsideArea(coords, area));
  return match || { name: 'Luxembourg' };
}

export function initGeotag({
  element,
  threshold = 28,
  hiddenClass = 'geotag-hidden',
  onLocated = null
}) {
  if (!element) {
    return {
      locate: async () => {},
      update: () => {}
    };
  }

  const textElement = element.querySelector('.location-text');
  let areasPromise = null;

  const setText = (value) => {
    if (textElement) {
      textElement.textContent = value;
    }
  };

  const getAreas = async () => {
    if (!areasPromise) {
      areasPromise = loadAreas();
    }

    return areasPromise;
  };

  const update = () => {
    if (window.scrollY > threshold) {
      document.body.classList.add(hiddenClass);
    } else {
      document.body.classList.remove(hiddenClass);
    }
  };

  const locate = async () => {
    if (!('geolocation' in navigator)) {
      setText('Localisation indisponible');
      return null;
    }

    setText('Localisation en cours...');
    element.disabled = true;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const areas = await getAreas();
            const area = resolveArea(position.coords, areas);
            setText(formatPosition(position.coords, formatArea(area)));
          } catch {
            setText(formatPosition(position.coords, ''));
          }

          element.disabled = false;
          if (typeof onLocated === 'function') {
            onLocated(position);
          }
          resolve(position);
        },
        () => {
          setText('Autoriser la localisation');
          element.disabled = false;
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  element.addEventListener('click', locate);
  window.addEventListener('scroll', update, { passive: true });

  return {
    locate,
    update
  };
}
