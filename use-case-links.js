function aviaUseCaseLinks(){
  const cards=[...document.querySelectorAll('.use-cases-section .showcase-card')];
  const targets=['ops-legal.html','ops-flota.html','avia-intelligence.html'];
  cards.slice(0,3).forEach((card,index)=>{
    card.setAttribute('role','link');
    card.setAttribute('tabindex','0');
    card.style.cursor='pointer';
    card.addEventListener('click',(event)=>{
      if(event.target.closest('a,button'))return;
      window.location.href=targets[index];
    });
    card.addEventListener('keydown',(event)=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        window.location.href=targets[index];
      }
    });
  });
  if(!document.getElementById('avia-use-case-links-style')){
    const style=document.createElement('style');
    style.id='avia-use-case-links-style';
    style.textContent='.use-cases-section .showcase-card{transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.use-cases-section .showcase-card:hover{transform:translateY(-4px);border-color:rgba(71,163,255,.42);box-shadow:0 18px 46px rgba(10,108,255,.14)}.use-cases-section .showcase-card:focus-visible{outline:2px solid rgba(71,163,255,.85);outline-offset:4px}';
    document.head.appendChild(style);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aviaUseCaseLinks);else aviaUseCaseLinks();
