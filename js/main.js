/**
 * ==========================================================================
 * VISTA BRASIL BEACH - LANDING PAGE SCRIPTS
 * Interatividade, Rastreamento Meta Pixel, Validação de Leads e UTMs
 * ==========================================================================
 */

(function () {
  'use strict';

  // ─── CONFIGURAÇÕES GERAIS ───
  const CONFIG = {
    brokerName: 'Paulo Godoi',
    whatsappNumber: '5565984082191', // (65) 98408-2191
    whatsappBaseUrl: 'https://wa.me/5565984082191',
    youtubeVideoId: '8Ks_w2QtdtQ',
    utmKeys: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  };

  // ─── HELPER: PROPAGAÇÃO DE UTMS ───
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const utmObj = {};
    CONFIG.utmKeys.forEach(k => {
      if (params.get(k)) utmObj[k] = params.get(k);
    });
    return utmObj;
  }

  function appendUtmToUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const currentParams = new URLSearchParams(window.location.search);
      CONFIG.utmKeys.forEach(k => {
        const val = currentParams.get(k);
        if (val) parsedUrl.searchParams.set(k, val);
      });
      return parsedUrl.toString();
    } catch (e) {
      return url;
    }
  }

  // ─── HELPER: EVENTOS META PIXEL & GTM DATALAYER ───
  function trackEvent(eventName, params = {}) {
    // 1. Meta Pixel
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('track', eventName, params);
        console.log(`[Meta Pixel] Event '${eventName}' disparado:`, params);
      } else {
        console.log(`[Meta Pixel Simulado] '${eventName}':`, params);
      }
    } catch (err) {
      console.warn('[Meta Pixel Error]:', err);
    }

    // 2. Google Tag Manager / dataLayer
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: eventName,
        ...params
      });
    } catch (err) {}
  }

  function trackCustomEvent(customName, params = {}) {
    try {
      if (typeof window.fbq === 'function') {
        window.fbq('trackCustom', customName, params);
        console.log(`[Meta Pixel Custom] '${customName}':`, params);
      }
    } catch (e) {}

    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: customName,
        ...params
      });
    } catch (e) {}
  }

  // ─── 1. NAVBAR SCROLL & MENU MOBILE ───
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  function handleNavScroll() {
    if (!header) return;
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });

    // Fechar ao clicar em qualquer link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('mobile-open');
      });
    });
  }

  // ─── 2. BOTÕES WHATSAPP COM RASTREIO E UTMS ───
  document.querySelectorAll('a[data-wa-cta]').forEach(btn => {
    const originalHref = btn.getAttribute('href') || CONFIG.whatsappBaseUrl;
    btn.setAttribute('href', appendUtmToUrl(originalHref));

    btn.addEventListener('click', () => {
      const location = btn.getAttribute('data-location') || 'geral';
      trackEvent('Contact', {
        content_name: 'WhatsApp Click',
        cta_location: location,
        broker: CONFIG.brokerName
      });
    });
  });

  // ─── 3. MÁSCARA E VALIDAÇÃO DE TELEFONE (BRASIL) ───
  function maskPhone(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      input.value = `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7)}`;
    } else if (v.length > 6) {
      input.value = `(${v.substring(0, 2)}) ${v.substring(2, 6)}-${v.substring(6)}`;
    } else if (v.length > 2) {
      input.value = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    } else if (v.length > 0) {
      input.value = `(${v}`;
    } else {
      input.value = '';
    }
  }

  const phoneInputs = document.querySelectorAll('input[type="tel"]');
  phoneInputs.forEach(input => {
    input.addEventListener('input', () => maskPhone(input));
  });

  // ─── 4. CAPTAÇÃO DE LEADS COM RASTREIO DETALHADO ───
  function setupLeadForm(formId, successId, locationSource = 'card') {
    const form = document.getElementById(formId);
    const successBox = document.getElementById(successId);
    if (!form) return;

    let hasStartedInteraction = false;

    // Rastreia primeiro toque no formulário (Início de conversão)
    form.querySelectorAll('input, select').forEach(field => {
      field.addEventListener('focus', () => {
        if (!hasStartedInteraction) {
          hasStartedInteraction = true;
          trackCustomEvent('LeadForm_Started', {
            form_id: formId,
            source: locationSource
          });
          trackEvent('InitiateCheckout', {
            content_name: 'Vista Brasil Beach - Formulário Iniciado',
            source: locationSource
          });
        }
      });

      // Limpar erro ao digitar
      field.addEventListener('input', () => {
        field.classList.remove('input-error');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const nomeField = form.querySelector('[name="nome"]');
      const telField = form.querySelector('[name="tel"]');
      const emailField = form.querySelector('[name="email"]');
      const interesseField = form.querySelector('[name="interesse"]');
      const consentField = form.querySelector('[name="consent"]');

      let isValid = true;

      // Validação Nome
      if (!nomeField || nomeField.value.trim().length < 3) {
        if (nomeField) nomeField.classList.add('input-error');
        isValid = false;
      }

      // Validação Telefone
      const rawDigits = telField ? telField.value.replace(/\D/g, '') : '';
      if (!telField || rawDigits.length < 10) {
        if (telField) telField.classList.add('input-error');
        isValid = false;
      }

      // Validação Consentimento
      if (consentField && !consentField.checked) {
        consentField.parentElement.style.color = 'var(--danger)';
        isValid = false;
      } else if (consentField) {
        consentField.parentElement.style.color = '';
      }

      if (!isValid) return;

      const nome = nomeField.value.trim();
      const tel = telField.value.trim();
      const email = emailField ? emailField.value.trim() : '';
      const interesse = interesseField ? interesseField.value : 'Informações Gerais';

      // ── Disparo do Evento LEAD no Meta Pixel & dataLayer ──
      trackEvent('Lead', {
        content_name: 'Vista Brasil Beach',
        content_category: 'Imóvel de Alto Padrão',
        lead_name: nome,
        interesse: interesse,
        source_location: locationSource,
        value: 0.00,
        currency: 'BRL'
      });

      // Monta mensagem personalizada para o corretor Paulo Godoi
      let message = `Olá Paulo! Sou *${nome}*.\n`;
      message += `Vim pelo site do *Vista Brasil Beach* e tenho interesse em: *${interesse}*.\n`;
      message += `Meu WhatsApp: ${tel}\n`;
      if (email) message += `Meu E-mail: ${email}\n`;
      message += `Gostaria de receber a apresentação completa e detalhes do empreendimento.`;

      const finalWaUrl = appendUtmToUrl(`${CONFIG.whatsappBaseUrl}?text=${encodeURIComponent(message)}`);

      // Atualiza interface com estado de sucesso
      form.style.display = 'none';
      if (successBox) {
        successBox.classList.add('active');
        const openBtn = successBox.querySelector('.btn-wa-success');
        if (openBtn) openBtn.href = finalWaUrl;
      }

      // Abre WhatsApp
      window.open(finalWaUrl, '_blank', 'noopener');
    });
  }

  // Inicializa formulários (na seção e no modal)
  setupLeadForm('mainLeadForm', 'mainLeadSuccess', 'secao_agende');
  setupLeadForm('modalLeadForm', 'modalLeadSuccess', 'modal_popup');

  // ─── 5. GALERIA INTERATIVA (FILTROS POR ABAS & SLIDER) ───
  const galleryItems = [
    {
      category: 'decorado',
      title: 'Living Integrado com Vista para a Lagoa',
      tag: 'Apartamento Decorado',
      img: 'assets/images/refugio_apartamento_living_hd.jpg'
    },
    {
      category: 'decorado',
      title: 'Suíte Master de Altíssimo Padrão',
      tag: 'Apartamento Decorado',
      img: 'assets/images/mpxe9nsc-Suite_Master_Pos.png'
    },
    {
      category: 'decorado',
      title: 'Hall Social Monumental da Torre',
      tag: 'Acesso Exclusivo',
      img: 'assets/images/mpxe9ns7-Hall_extendida.png'
    },
    {
      category: 'lazer',
      title: 'Gourmet Externo & Steak House',
      tag: '+15 Itens de Lazer',
      img: 'assets/images/mpxe9nsc-Gourmet_Externo-jpg.webp'
    },
    {
      category: 'lazer',
      title: 'Stand-up Paddle e Caiaque na Praia',
      tag: 'Crystal Lagoons',
      img: 'assets/images/mpxe9nsq-1-jpg.webp'
    },
    {
      category: 'lazer',
      title: 'Águas Cristalinas e Banho Seguro',
      tag: 'Lazer & Família',
      img: 'assets/images/mpxe9nsp-10-jpg.webp'
    },
    {
      category: 'praia',
      title: 'Praia Privativa de Areia Branca',
      tag: 'Exclusividade Única no Brasil',
      img: 'assets/images/hero_brasil_beach_hd.jpg'
    },
    {
      category: 'praia',
      title: 'Lazer e Descanso à Beira da Lagoa',
      tag: 'Complexo Brasil Beach',
      img: 'assets/images/mpxe9nsq-8-jpg.webp'
    },
    {
      category: 'praia',
      title: 'Vista Panorâmica Aérea da Lagoa e Torres',
      tag: 'Complexo Brasil Beach',
      img: 'assets/images/mpxe9nsj-Aerea_Quartos_v1-1024x746.webp'
    }
  ];

  let currentCategory = 'all';
  let currentPage = 0;
  const itemsPerPage = 3;

  const galleryTrack = document.getElementById('galleryTrack');
  const sliderDots = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('galleryPrev');
  const nextBtn = document.getElementById('galleryNext');
  const tabButtons = document.querySelectorAll('.tab-btn');

  function getFilteredItems() {
    if (currentCategory === 'all') return galleryItems;
    return galleryItems.filter(item => item.category === currentCategory);
  }

  function renderGallery() {
    if (!galleryTrack) return;
    const filtered = getFilteredItems();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    if (currentPage >= totalPages) currentPage = 0;

    const start = currentPage * itemsPerPage;
    const currentItems = filtered.slice(start, start + itemsPerPage);

    galleryTrack.innerHTML = '';
    currentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = `
        <img src="${item.img}" alt="${item.title}" loading="lazy">
        <div class="gallery-card-overlay">
          <span class="gallery-tag">${item.tag}</span>
          <h4 class="gallery-caption">${item.title}</h4>
        </div>
      `;
      card.addEventListener('click', () => openLightbox(item.img, item.title));
      galleryTrack.appendChild(card);
    });

    // Render Dots
    if (sliderDots) {
      sliderDots.innerHTML = '';
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === currentPage ? 'active' : ''}`;
        dot.addEventListener('click', () => {
          currentPage = i;
          renderGallery();
        });
        sliderDots.appendChild(dot);
      }
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(getFilteredItems().length / itemsPerPage);
      currentPage = (currentPage - 1 + totalPages) % totalPages;
      renderGallery();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(getFilteredItems().length / itemsPerPage);
      currentPage = (currentPage + 1) % totalPages;
      renderGallery();
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-tab');
      currentPage = 0;
      renderGallery();
    });
  });

  renderGallery();

  // ─── 6. LIGHTBOX MODAL DE FOTOS ───
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');

  function openLightbox(src, caption) {
    if (!lightboxModal) return;
    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    trackCustomEvent('Gallery_ImageView', { image: caption });
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    lightboxModal.addEventListener('click', e => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // ─── 7. MODAL DE AGENDAMENTO / FICHA TÉCNICA ───
  const leadModal = document.getElementById('leadModal');
  const modalClose = document.getElementById('modalClose');

  function openLeadModal(triggerName = 'Geral') {
    if (!leadModal) return;
    leadModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    trackCustomEvent('Modal_Opened', { trigger: triggerName });
  }

  function closeLeadModal() {
    if (!leadModal) return;
    leadModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const trigger = btn.getAttribute('data-open-modal') || 'Botão';
      openLeadModal(trigger);
    });
  });

  if (modalClose) modalClose.addEventListener('click', closeLeadModal);
  if (leadModal) {
    leadModal.addEventListener('click', e => {
      if (e.target === leadModal) closeLeadModal();
    });
  }

  // ─── 8. VÍDEO OFICIAL (YOUTUBE EMBED) ───
  const videoPlayBtn = document.getElementById('videoPlayBtn');
  const videoBox = document.getElementById('videoBox');

  if (videoPlayBtn && videoBox) {
    videoPlayBtn.addEventListener('click', () => {
      trackCustomEvent('Video_Play', { video_id: CONFIG.youtubeVideoId });
      videoBox.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${CONFIG.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1" 
          title="Vídeo Oficial Vista Brasil Beach" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen 
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;">
        </iframe>
      `;
    });
  }

  // ─── 9. ANIMAÇÕES REVEAL NO SCROLL ───
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // ─── ANO ATUAL NO FOOTER ───
  const yearEl = document.getElementById('currentYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
