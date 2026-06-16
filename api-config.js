(function resolveAviaApiBaseUrl(){
  var current = window.AVIA_API_BASE_URL;
  var host = window.location.hostname;
  var origin = window.location.origin;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  var fallback = isLocal ? "http://localhost:8080" : origin;
  var resolved = String(current || fallback).replace(/\/$/, "");

  window.AVIA_API_BASE_URL = resolved;
  window.AVIA_API_BASE_URL_RESOLVED = resolved;
})();
