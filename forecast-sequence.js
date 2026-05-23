// Home-only enhancer. It no longer renders any forecast.
// It only loads the approved AVIA forecast and the use-case card links once.
(function(){
  function loadScript(src){
    if(document.querySelector('script[src="'+src+'"]')) return;
    var script=document.createElement('script');
    script.src=src;
    document.body.appendChild(script);
  }

  function loadHomeEnhancements(){
    if(document.querySelector('.demand-chart')) loadScript('forecast-clean.js');
    if(document.querySelector('.use-cases-section .showcase-card')) loadScript('use-case-links.js');
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',loadHomeEnhancements);
  }else{
    loadHomeEnhancements();
  }
})();
