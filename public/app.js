(function(){
  const wrapId = 'toast-wrap';
  function ensureWrap(){
    let el = document.getElementById(wrapId);
    if (!el) {
      el = document.createElement('div');
      el.id = wrapId;
      el.className = 'toast-wrap';
      document.body.appendChild(el);
    }
    return el;
  }
  function toast(message, type='good', timeout=1800){
    const wrap = ensureWrap();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    wrap.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transition='opacity .2s ease'; }, timeout);
    setTimeout(()=>{ t.remove(); if(!wrap.children.length) wrap.remove(); }, timeout+250);
  }
  async function copy(text){
    try { await navigator.clipboard.writeText(text); toast('Copié dans le presse-papiers'); }
    catch(e){ toast('Impossible de copier', 'bad'); }
  }
  window.app = { toast, copy };
})();
