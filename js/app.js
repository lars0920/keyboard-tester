/* ==========================================================================
   AURA 75 - LANDING PAGE INTERACTION ENGINE & CHECKOUT FUNNEL
   Manages Option Selection, Sticky Buy Box, Countdown Timer, Checkout Modal, Video Sound
   ========================================================================== */

// Base Pricing Configuration
const PRICING = {
  base: 285000,
  original: 349000,
  plates: {
    brass: 20000,
    pc: 0,
    fr4: 0
  }
};

// Current Selected Options State
const currentOptions = {
  case: 'black',
  caseName: '미드나잇 블랙',
  plate: 'brass',
  plateName: '황동 (Brass)',
  switch: 'creamy',
  switchName: 'Creamy Linear',
  keycap: 'cyber',
  keycapName: '사이버펑크 다크 PBT'
};

// Helper: Format KRW Currency
function formatKRW(amount) {
  return '₩' + amount.toLocaleString('ko-KR');
}

// 0. Toggle Video Sound (Mute / Unmute Video Music)
function toggleVideoSound() {
  const video = document.getElementById('heroVideoPlayer');
  const icon = document.getElementById('videoSoundIcon');
  const text = document.getElementById('videoSoundText');
  const chip = document.getElementById('btnVideoSoundToggle');

  if (!video) return;

  if (video.muted) {
    video.muted = false;
    video.volume = 0.8;
    if (icon) icon.className = 'fa-solid fa-volume-high text-emerald';
    if (text) text.textContent = '음악 끄기 (ON)';
    if (chip) chip.classList.add('active');
  } else {
    video.muted = true;
    if (icon) icon.className = 'fa-solid fa-volume-xmark';
    if (text) text.textContent = '음악 켜기 (OFF)';
    if (chip) chip.classList.remove('active');
  }
}

// 1. Option Selection Handler
function selectOption(group, value, element) {
  const parentGrid = element.closest('.option-chips-grid');
  if (parentGrid) {
    parentGrid.querySelectorAll('.option-chip').forEach(chip => chip.classList.remove('active'));
  }
  element.classList.add('active');

  currentOptions[group] = value;
  const name = element.getAttribute('data-name');
  if (name) {
    currentOptions[group + 'Name'] = name;
  }

  const labelEl = document.getElementById(`selected${group.charAt(0).toUpperCase() + group.slice(1)}Label`);
  if (labelEl) {
    labelEl.textContent = name;
  }

  if (group === 'switch' && typeof selectSoundSwitch === 'function') {
    selectSoundSwitch(value);
  }

  updatePriceAndSummaries();
}

// 2. Calculate Total & Update All UI Displays
function updatePriceAndSummaries() {
  const plateAddOn = PRICING.plates[currentOptions.plate] || 0;
  const totalPrice = PRICING.base + plateAddOn;
  const totalOriginal = PRICING.original + plateAddOn;

  const sumCase = document.getElementById('sumCase');
  const sumPlate = document.getElementById('sumPlate');
  const sumSwitch = document.getElementById('sumSwitch');
  const sumKeycap = document.getElementById('sumKeycap');

  if (sumCase) sumCase.textContent = currentOptions.caseName;
  if (sumPlate) sumPlate.textContent = `${currentOptions.plateName} ${plateAddOn > 0 ? '(+' + formatKRW(plateAddOn) + ')' : ''}`;
  if (sumSwitch) sumSwitch.textContent = currentOptions.switchName;
  if (sumKeycap) sumKeycap.textContent = currentOptions.keycapName;

  const summaryOriginalPrice = document.getElementById('summaryOriginalPrice');
  const summaryTotalPrice = document.getElementById('summaryTotalPrice');
  if (summaryOriginalPrice) summaryOriginalPrice.textContent = formatKRW(totalOriginal);
  if (summaryTotalPrice) summaryTotalPrice.textContent = formatKRW(totalPrice);

  const stickyOptionSummary = document.getElementById('stickyOptionSummary');
  const stickyOriginalPrice = document.getElementById('stickyOriginalPrice');
  const stickyTotalPrice = document.getElementById('stickyTotalPrice');
  const stickyThumbColor = document.getElementById('stickyThumbColor');

  if (stickyOptionSummary) {
    stickyOptionSummary.textContent = `${currentOptions.caseName.replace('아노다이징 ', '')} / ${currentOptions.plateName.split(' ')[0]} / ${currentOptions.switchName.split(' ')[1] || currentOptions.switchName}`;
  }
  if (stickyOriginalPrice) stickyOriginalPrice.textContent = formatKRW(totalOriginal);
  if (stickyTotalPrice) stickyTotalPrice.textContent = formatKRW(totalPrice);
  if (stickyThumbColor) {
    const activeChip = document.querySelector(`.option-chip[data-group="case"][data-value="${currentOptions.case}"]`);
    if (activeChip) stickyThumbColor.style.background = activeChip.getAttribute('data-hex') || '#1e293b';
  }

  const modalTotalPrice = document.getElementById('modalTotalPrice');
  const submitBtnText = document.getElementById('submitBtnText');
  const modalOptionsSummary = document.getElementById('modalOptionsSummary');

  if (modalTotalPrice) modalTotalPrice.textContent = formatKRW(totalPrice);
  if (submitBtnText) submitBtnText.textContent = `${formatKRW(totalPrice)} 결제하고 혜택 완료하기`;
  if (modalOptionsSummary) {
    modalOptionsSummary.innerHTML = `
      <span class="badge-opt">${currentOptions.caseName.replace('아노다이징 ', '')}</span>
      <span class="badge-opt">${currentOptions.plateName}</span>
      <span class="badge-opt">${currentOptions.switchName}</span>
      <span class="badge-opt">${currentOptions.keycapName}</span>
    `;
  }
}

// 3. Countdown Urgency Timer Engine
function startCountdownTimer() {
  let totalSeconds = (8 * 3600) + (42 * 60) + 19;

  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--;
    } else {
      totalSeconds = 12 * 3600;
    }

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// 4. Scroll Helper & Sticky Buy Box Controller
function scrollToConfigurator() {
  const target = document.getElementById('configurator');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

function initStickyBuyBoxScroll() {
  const stickyBox = document.getElementById('stickyBuyBox');
  if (!stickyBox) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      stickyBox.classList.add('visible');
    } else {
      stickyBox.classList.remove('visible');
    }
  });
}

// 5. FAQ Accordion Toggle
function toggleFaq(btn) {
  const faqItem = btn.closest('.faq-item');
  if (faqItem) {
    faqItem.classList.toggle('active');
  }
}

// 6. Checkout Modal Flow
function openCheckoutModal() {
  updatePriceAndSummaries();
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('userName').value;
  const phone = document.getElementById('userPhone').value;
  const address = document.getElementById('userAddress').value;

  if (!name || !phone || !address) {
    alert('필수 입력 항목을 모두 작성해주세요.');
    return;
  }

  const submitBtn = document.getElementById('btnSubmitOrder');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> 결제 처리 중...';

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;

    closeCheckoutModal();

    const randomOrderNo = 'AUR-2026-' + Math.floor(10000 + Math.random() * 90000);
    const orderNoEl = document.getElementById('successOrderNo');
    if (orderNoEl) orderNoEl.textContent = randomOrderNo;

    const successModal = document.getElementById('successModal');
    if (successModal) {
      successModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }, 1200);
}

function closeSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (successModal) {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Hash Smooth Scroll Handler
function handleHashScroll() {
  const hash = window.location.hash;
  if (hash === '#sound-test' || hash === '#sound-experience') {
    const target = document.getElementById('sound-test');
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  } else if (hash === '#configurator') {
    const target = document.getElementById('configurator');
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.pay-method-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.pay-method-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const radio = chip.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  startCountdownTimer();
  initStickyBuyBoxScroll();
  updatePriceAndSummaries();
  handleHashScroll();
});

window.addEventListener('hashchange', handleHashScroll);
