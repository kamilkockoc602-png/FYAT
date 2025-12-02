// panel.js — improved: auth guard, robust menu toggle, click-outside close (mobile),
// menu search (debounced), load iframe, theme, logout, role-based visibility, iframe cleaning
(function(){
  // --- Auth guard (quick client-side check) ---
  try {
    const hasToken = !!localStorage.getItem('token');
    const isLoggedInFlag = localStorage.getItem('isLoggedIn') === 'true';
    const hasUsername = !!localStorage.getItem('username');
    if (!hasToken && !isLoggedInFlag && !hasUsername) {
      // If user is not logged in, redirect to index
      // Use replace so back button doesn't keep panel.html
      window.location.replace('index.html');
      return;
    }
  } catch (err) {
    try { window.location.replace('index.html'); } catch(e) {}
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const menuList = document.getElementById('menuList');
    const iframe = document.getElementById('contentIFrame');
    const themeToggle = document.getElementById('themeToggle');
    const logoutBtn = document.getElementById('logoutBtn');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const sidebarSearch = document.getElementById('sidebarSearch');

    // sanity checks
    if (!menuToggle || !sidebar || !menuList || !iframe) {
      console.warn('panel.js: missing expected DOM elements (menuToggle/sidebar/menuList/iframe)');
    }

    // init username and role
    const username = localStorage.getItem('username') || localStorage.getItem('user') || 'Misafir';
    const role = localStorage.getItem('role') || 'user';
    if (usernameDisplay) usernameDisplay.textContent = username;

    // role-based visibility
    menuList.querySelectorAll('[data-role]').forEach(el => {
      const req = el.getAttribute('data-role') || 'everyone';
      if (req === 'admin' && role !== 'admin') el.style.display = 'none';
      else el.style.display = '';
    });

    // restore sidebar collapsed state (desktop)
    if (localStorage.getItem('sidebarCollapsed') === '1' && window.innerWidth > 900) {
      sidebar.classList.add('collapsed');
    }

    // Toggle behavior (robust)
    function isMobileView() { return window.innerWidth <= 900; }

    function openMobileSidebar() {
      sidebar.classList.add('open');
      // add overlay to capture outside clicks
      addOverlay();
    }
    function closeMobileSidebar() {
      sidebar.classList.remove('open');
      removeOverlay();
    }
    function toggleSidebar() {
      if (isMobileView()) {
        if (sidebar.classList.contains('open')) closeMobileSidebar();
        else openMobileSidebar();
      } else {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
      }
    }

    // overlay helpers (to close mobile sidebar when clicking outside)
    let _overlay = null;
    function addOverlay() {
      if (_overlay) return;
      _overlay = document.createElement('div');
      _overlay.style.position = 'fixed';
      _overlay.style.inset = '0';
      _overlay.style.zIndex = '55';
      _overlay.style.background = 'transparent';
      document.body.appendChild(_overlay);
      _overlay.addEventListener('click', () => closeMobileSidebar());
    }
    function removeOverlay() {
      if (!_overlay) return;
      _overlay.remove();
      _overlay = null;
    }

    // attach toggle
    if (menuToggle) menuToggle.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });

    // close mobile sidebar on resize if crossing breakpoint
    window.addEventListener('resize', () => {
      if (!isMobileView()) {
        removeOverlay();
        sidebar.classList.remove('open');
      }
    });

    // Clicking outside sidebar should close mobile sidebar (for safety)
    document.addEventListener('click', (e) => {
      if (!isMobileView()) return;
      if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        closeMobileSidebar();
      }
    });

    // Helper: append embedded=1 to URLs (only once)
    function buildEmbeddedUrl(target) {
      try {
        const url = new URL(target, window.location.href);
        if (!url.searchParams.has('embedded')) url.searchParams.set('embedded','1');
        return url.toString();
      } catch (e) {
        if (target.indexOf('?') === -1) return target + '?embedded=1';
        if (target.indexOf('embedded=') === -1) return target + '&embedded=1';
        return target;
      }
    }

    // Set active menu item
    function setActiveItem(el) {
      menuList.querySelectorAll('.menu-item').forEach(li => li.classList.remove('active'));
      if (el) el.classList.add('active');
    }

    
    function loadTargetUrl(target) {
      const url = buildEmbeddedUrl(target);
     
      const current = iframe.getAttribute('src') || '';
      if (current === url) return;
      iframe.setAttribute('src', url);
    }

   
    menuList.addEventListener('click', (e) => {
      const li = e.target.closest('.menu-item');
      if (!li) return;
      const target = li.getAttribute('data-target');
      if (!target) return;
      loadTargetUrl(target);
      setActiveItem(li);
      if (isMobileView()) closeMobileSidebar();
    });

  
    const firstVisible = Array.from(menuList.children).find(li => li.style.display !== 'none');
    if (firstVisible) setActiveItem(firstVisible);

   
    function applyTheme(isDark) {
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('themeDark', isDark ? '1' : '0');
      if (themeToggle) themeToggle.textContent = isDark ? '☀️' : '🌙';
    }
    const savedTheme = localStorage.getItem('themeDark');
    if (savedTheme !== null) applyTheme(savedTheme === '1');
    else applyTheme(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (themeToggle) themeToggle.addEventListener('click', () => applyTheme(!document.documentElement.classList.contains('dark')));

   
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });

    
    function cleanIframeDom() {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;
        const hideSelectors = ['#sidebar', '.sidebar', 'aside', '.left', '.menu', '.menu-wrapper', '.side-nav', '#leftNav'];
        hideSelectors.forEach(sel => doc.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        const hideToggles = ['#toggleBtn', '.toggleBtn', '.menu-toggle', '.btn-toggle'];
        hideToggles.forEach(sel => doc.querySelectorAll(sel).forEach(el => el.style.display = 'none'));
        const mainCandidates = ['.main', '#mainContainer', 'main', '.content', '.page'];
        mainCandidates.forEach(sel => doc.querySelectorAll(sel).forEach(el => { el.style.marginLeft = '0'; el.style.paddingLeft = el.style.paddingLeft || '18px'; el.style.maxWidth = 'none'; }));
        doc.documentElement.classList.add('embedded-iframe');
      } catch (err) {
        // cross-origin -> ignore
      }
    }
    iframe.addEventListener('load', () => {
      iframe.style.opacity = '0';
      setTimeout(()=>{ iframe.style.transition = 'opacity 240ms ease'; iframe.style.opacity = '1'; }, 10);
      cleanIframeDom();
      setTimeout(cleanIframeDom, 350);
      setTimeout(cleanIframeDom, 1200);
    });

    // -------------------------
    // Sidebar SEARCH (debounced)
    // -------------------------
    function debounce(fn, wait){
      let t = null;
      return function(...args){
        clearTimeout(t);
        t = setTimeout(()=> fn.apply(this, args), wait);
      };
    }

    function runSidebarSearch(q) {
      const term = (q||'').toLowerCase().trim();
      const items = Array.from(menuList.querySelectorAll('.menu-item'));
      if (!term) {
        items.forEach(li => li.style.display = '');
        return;
      }
      let firstShown = null;
      items.forEach(li => {
        const txt = (li.textContent || '').toLowerCase();
        if (txt.indexOf(term) !== -1) {
          li.style.display = '';
          if (!firstShown) firstShown = li;
        } else {
          li.style.display = 'none';
        }
      });
     
      const anyVisible = items.some(li => li.style.display !== 'none');
      let noElem = document.getElementById('menu-no-results');
      if (!anyVisible) {
        if (!noElem) {
          noElem = document.createElement('div');
          noElem.id = 'menu-no-results';
          noElem.style.padding = '10px';
          noElem.style.color = 'var(--muted)';
          noElem.textContent = 'Sonuç bulunamadı';
          menuList.appendChild(noElem);
        }
      } else {
        if (noElem) noElem.remove();
      }
    
      const active = menuList.querySelector('.menu-item.active');
      if (active && active.style.display === 'none') {
        if (firstShown) setActiveItem(firstShown);
      } else if (!active && firstShown) {
        setActiveItem(firstShown);
      }
    }

    const debouncedSearch = debounce((e) => runSidebarSearch(e.target.value), 180);
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', debouncedSearch);
    
      sidebarSearch.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          const first = Array.from(menuList.children).find(li => li.style.display !== 'none');
          if (first) {
            const target = first.getAttribute('data-target');
            if (target) loadTargetUrl(target);
            setActiveItem(first);
            if (isMobileView()) closeMobileSidebar();
          }
        }
        if (ev.key === 'Escape') {
          sidebarSearch.value = '';
          runSidebarSearch('');
        }
      });
    }

    // 
    menuList.addEventListener('keydown', (ev) => {
      const focusable = Array.from(menuList.querySelectorAll('.menu-item')).filter(li => li.style.display !== 'none');
      if (!focusable.length) return;
      const activeIndex = focusable.findIndex(li => li.classList.contains('active'));
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        const next = focusable[(Math.max(0, activeIndex) + 1) % focusable.length];
        setActiveItem(next);
        next.scrollIntoView({block:'nearest'});
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        const prev = focusable[( (activeIndex <= 0 ? focusable.length : activeIndex) - 1) % focusable.length];
        setActiveItem(prev);
        prev.scrollIntoView({block:'nearest'});
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        const cur = focusable[activeIndex >= 0 ? activeIndex : 0];
        if (cur) {
          const t = cur.getAttribute('data-target');
          if (t) loadTargetUrl(t);
          if (isMobileView()) closeMobileSidebar();
        }
      }
    });

    
    Array.from(menuList.querySelectorAll('.menu-item')).forEach(li => {
      li.setAttribute('tabindex','-1');
    
      const btn = li.querySelector('.menu-link');
      if (btn) {
        btn.addEventListener('click', () => li.focus());
      }
    });

  }); 
})(); 