// fedai-backend-proxy/src/api/utils/constants.js

const IPAPI_CO_URL = 'https://ipapi.co/json/';
const IP_API_COM_URL = 'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,query';
const OPEN_METEO_API_BASE = 'https://api.open-meteo.com/v1';
const OPEN_METEO_ARCHIVE_API_BASE = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_ELEVATION_API_URL_PREFIX = 'https://api.open-elevation.com/api/v1/lookup?locations=';
const OPEN_TOPO_DATA_API_URL_PREFIX = 'https://api.opentopodata.org/v1/etopo1?locations=';
const SOILGRIDS_API_URL_PREFIX = 'https://soilgrids.org/soilgrids/v2.0/properties/query';
const OPEN_PLANTBOOK_API_URL_PREFIX = 'https://open.plantbook.io/api/v1/plant/detail/';
const GEOLOCATION_API_TIMEOUT_MS = 7000;

module.exports = {
  IPAPI_CO_URL,
  IP_API_COM_URL,
  OPEN_METEO_API_BASE,
  OPEN_METEO_ARCHIVE_API_BASE,
  OPEN_ELEVATION_API_URL_PREFIX,
  OPEN_TOPO_DATA_API_URL_PREFIX,
  SOILGRIDS_API_URL_PREFIX,
  OPEN_PLANTBOOK_API_URL_PREFIX,
  GEOLOCATION_API_TIMEOUT_MS,
};