'use client';

const FLY_MS = 760;
const END_SIZE = 26;

function bumpCart(target: HTMLElement) {
  target.animate(
    [
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.22) rotate(-8deg)', offset: 0.35 },
      { transform: 'scale(0.94) rotate(5deg)', offset: 0.65 },
      { transform: 'scale(1) rotate(0deg)' },
    ],
    { duration: 520, easing: 'ease-out' }
  );
}

/**
 * Mahsulot rasmini savat tugmasigacha "uchirib" boradi va tugmani silkitadi.
 * source — rasmning o'zi yoki ichida rasm bor element (kartochka).
 */
export function flyToCart(source: Element | null) {
  if (typeof window === 'undefined') return;
  // Pastki menyudagi savat tugmasi (BottomNavigation, data-cart-target)
  const target = document.querySelector<HTMLElement>('[data-cart-target]');
  if (!target) return;

  const img = source instanceof HTMLImageElement ? source : source?.querySelector('img');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!img || reduceMotion) {
    bumpCart(target);
    return;
  }

  const from = img.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = Math.min(from.width, from.height, 140);
  const startX = from.left + from.width / 2;
  const startY = from.top + from.height / 2;
  const dx = to.left + to.width / 2 - startX;
  const dy = to.top + to.height / 2 - startY;

  const flyer = document.createElement('img');
  flyer.src = img.currentSrc || img.src;
  flyer.alt = '';
  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${startX - size / 2}px`,
    top: `${startY - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: 'cover',
    borderRadius: '50%',
    border: '3px solid #fff',
    boxShadow: '0 14px 30px -8px rgba(249, 115, 22, 0.65)',
    zIndex: '90',
    pointerEvents: 'none',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(flyer);

  // Kvadratik egri chiziq bo'ylab: avval biroz yuqoriga, keyin savatga
  const cx = dx * 0.5;
  const cy = Math.min(0, dy) - 140;
  const endScale = END_SIZE / size;
  const steps = 12;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 2 * (1 - t) * t * cx + t * t * dx;
    const y = 2 * (1 - t) * t * cy + t * t * dy;
    const scale = t < 0.15 ? 1 + t : 1.15 + (endScale - 1.15) * ((t - 0.15) / 0.85);
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: t > 0.9 ? 0.6 : 1 });
  }

  const anim = flyer.animate(frames, { duration: FLY_MS, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' });
  const done = () => {
    flyer.remove();
    bumpCart(target);
  };
  anim.onfinish = done;
  anim.oncancel = () => flyer.remove();
}
