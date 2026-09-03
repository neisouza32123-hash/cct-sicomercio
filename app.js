const clauses = window.CCT_CLAUSES || [];
const search = document.getElementById('search');
const clearSearch = document.getElementById('clearSearch');
const list = document.getElementById('list');
const count = document.getElementById('count');
const filters = document.getElementById('filters');
const openFavs = document.getElementById('openFavs');
const bottomFavs = document.getElementById('bottomFavs');
let currentCat = 'Todas';
const cats = ['Todas', ...new Set(clauses.map(c => c.category)), 'Favoritas'];

const favs = () => new Set(JSON.parse(localStorage.getItem('cct-favs') || '[]'));
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function plain(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function highlight(text,q){
  if(!q) return esc(text);
  const parts=q.trim().split(/\s+/).filter(Boolean).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  if(!parts.length) return esc(text);
  const re=new RegExp('('+parts.join('|')+')','ig');
  return esc(text).replace(re,'<mark>$1</mark>');
}

function activateFavorites(){
  currentCat='Favoritas';
  renderFilters();
  render();
  document.getElementById('list').scrollIntoView({behavior:'smooth', block:'start'});
}

function renderFilters(){
  filters.innerHTML = cats.map(c => `<button class="filter ${c===currentCat?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  filters.querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      currentCat = b.dataset.cat;
      renderFilters();
      render();
    };
  });
}

function render(){
  const q = search.value.trim();
  const qp = plain(q);
  const fs = favs();
  let data = clauses.filter(c => {
    if (currentCat === 'Favoritas' && !fs.has(c.number)) return false;
    if (currentCat !== 'Todas' && currentCat !== 'Favoritas' && c.category !== currentCat) return false;
    if (!qp) return true;
    return plain(c.title + ' ' + c.text + ' ' + c.category).includes(qp);
  });

  count.textContent = `${data.length} de ${clauses.length}`;

  if (!data.length) {
    list.innerHTML = '<div class="empty">Nenhuma cláusula encontrada. Tente outra palavra ou escolha outro filtro.</div>';
    return;
  }

  list.innerHTML = data.map(c => `
    <details class="clause" id="clause-${c.number}">
      <summary>
        <div class="row">
          <div class="num">${c.number}</div>
          <div>
            <div class="ctitle">${highlight(c.title,q)}</div>
            <span class="cat">${esc(c.category)}</span>
          </div>
        </div>
      </summary>
      <div class="content">
        ${highlight(c.text,q)}
        <div class="actions">
          <button class="btn fav ${fs.has(c.number)?'on':''}" data-fav="${c.number}">${fs.has(c.number)?'★ Favorita':'☆ Favoritar'}</button>
          <button class="btn share" data-share="${c.number}">Compartilhar</button>
          <a class="btn" href="cct-oficial.pdf#page=${Math.max(1,c.number+14)}" target="_blank">PDF oficial</a>
        </div>
      </div>
    </details>
  `).join('');

  list.querySelectorAll('[data-fav]').forEach(b => b.onclick = e => {
    e.preventDefault();
    const n = +b.dataset.fav;
    const s = favs();
    s.has(n) ? s.delete(n) : s.add(n);
    localStorage.setItem('cct-favs', JSON.stringify([...s]));
    render();
  });

  list.querySelectorAll('[data-share]').forEach(b => b.onclick = async () => {
    const c = clauses.find(x => x.number === +b.dataset.share);
    const txt = `${c.title}\n\nConsulte na CCT Sicomércio Feira 2025/2026.`;
    const url = location.href.split('#')[0] + '#clause-' + c.number;
    if (navigator.share) {
      try { await navigator.share({title:c.title, text:txt, url}); } catch(e) {}
    } else {
      navigator.clipboard?.writeText(`${txt}\n${url}`);
      b.textContent = 'Copiado';
      setTimeout(() => b.textContent = 'Compartilhar', 1200);
    }
  });
}

search.addEventListener('input', render);
clearSearch?.addEventListener('click', () => {
  search.value = '';
  search.focus();
  render();
});

document.querySelectorAll('[data-term]').forEach(b => b.onclick = () => {
  search.value = b.dataset.term;
  currentCat = 'Todas';
  renderFilters();
  render();
  document.getElementById('buscar').scrollIntoView({behavior:'smooth'});
  search.focus();
});

openFavs?.addEventListener('click', activateFavorites);
bottomFavs?.addEventListener('click', activateFavorites);

renderFilters();
render();

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if(installBtn) installBtn.hidden = false;
});
installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./service-worker.js');
}

window.addEventListener('hashchange', () => {
  const el = document.querySelector(location.hash);
  if (el) {
    el.open = true;
    el.scrollIntoView({behavior:'smooth'});
  }
});
if (location.hash) {
  setTimeout(() => window.dispatchEvent(new Event('hashchange')), 300);
}
