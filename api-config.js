(function resolveAviaApiBaseUrl(){
  var stored = "";
  try { stored = localStorage.getItem("avia_api_base_url") || ""; } catch (_) {}
  var current = window.AVIA_API_BASE_URL || stored;
  var host = window.location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  var fallback = isLocal ? "http://localhost:18000" : "https://api.aviarockets.cl";
  var resolved = String(current || fallback).replace(/\/$/, "");

  window.AVIA_API_BASE_URL = resolved;
  window.AVIA_API_BASE_URL_RESOLVED = resolved;

  var nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (nativeFetch && !window.__AVIA_SINGLE_API_GUARD__) {
    window.__AVIA_SINGLE_API_GUARD__ = true;
    window.fetch = function(input, init) {
      var url = typeof input === "string" ? input : input && input.url;
      if (url && /^https:\/\/aviarockets\.cl\/api\//.test(url)) {
        var apiUrl = url.replace(/^https:\/\/aviarockets\.cl/, "https://api.aviarockets.cl");
        return nativeFetch(apiUrl, init);
      }
      return nativeFetch(input, init);
    };
  }
})();
