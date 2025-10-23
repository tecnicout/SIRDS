import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * SplitText replacement that does manual DOM splitting (lines / words / chars)
 * Avoids using the paid `gsap/SplitText` plugin and the @gsap/react helper.
 */
const SplitText = ({
  text = '',
  className = '',
  // stagger delay in ms (UI shows 70 ms)
  delay = 70,
  // animation duration in seconds (UI shows 2s)
  duration = 2,
  // ease as gsap string (UI suggests elastic.out(1, 0.3))
  ease = 'elastic.out(1, 0.3)',
  splitType = 'chars', // 'lines' | 'words' | 'chars'
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  showCompletionToast = false,
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // cleanup any previous ScrollTriggers
    const existing = ScrollTrigger.getAll().filter((st) => st.trigger === el);
    existing.forEach((st) => st.kill());

    // choose targets depending on splitType
    let targets;
    if (splitType === 'chars') {
      targets = el.querySelectorAll('.split-char');
    } else if (splitType === 'words') {
      targets = el.querySelectorAll('.split-word');
    } else {
      targets = el.querySelectorAll('.split-line');
    }

    if (!targets || targets.length === 0) return;

    const startPct = (1 - threshold) * 100;
    const start = `top ${startPct}% ${rootMargin}`;

    const anim = gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true
        },
        onComplete: () => {
          try {
            onLetterAnimationComplete?.();
            if (showCompletionToast) {
              // simple toast
              const toast = document.createElement('div');
              toast.textContent = 'Animación completada';
              Object.assign(toast.style, {
                position: 'fixed',
                right: '20px',
                bottom: '20px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '10px 14px',
                borderRadius: '8px',
                zIndex: 9999,
                fontSize: '13px',
                opacity: '0'
              });
              document.body.appendChild(toast);
              gsap.to(toast, { y: -10, opacity: 1, duration: 0.35, ease: 'power2.out' });
              setTimeout(() => {
                gsap.to(toast, { y: 10, opacity: 0, duration: 0.45, ease: 'power2.in', onComplete: () => toast.remove() });
              }, 1600);
            }
          } catch (e) {
            // ignore
          }
        },
        willChange: 'transform, opacity',
        force3D: true
      }
    );

    return () => {
      try {
        anim.kill();
      } catch (e) {}
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, onLetterAnimationComplete]);

  // Build JSX structure manually
  const renderLines = () => {
    const lines = String(text).split('\n');

    return lines.map((line, i) => {
      const keyLine = `line-${i}`;
      if (splitType === 'chars') {
        return (
          <div key={keyLine} className="split-line break-words">
            {Array.from(line).map((ch, idx) => (
              <span key={`c-${i}-${idx}`} className="split-char inline-block">{ch === ' ' ? '\u00A0' : ch}</span>
            ))}
          </div>
        );
      }

      if (splitType === 'words') {
        const words = line.split(' ').filter(Boolean);
        return (
          <div key={keyLine} className="split-line break-words">
            {words.map((w, idx) => (
              <span key={`w-${i}-${idx}`} className="split-word inline-block mr-1">{w}</span>
            ))}
          </div>
        );
      }

      // default: lines
      return (
        <div key={keyLine} className="split-line break-words">{line}</div>
      );
    });
  };

  const Tag = tag;
  const classes = `split-parent overflow-hidden inline-block whitespace-normal ${className}`;
  const style = { textAlign };

  return (
    <Tag ref={ref} className={classes} style={style} aria-label={typeof text === 'string' ? text.replace(/\n/g, ' ') : undefined}>
      {renderLines()}
    </Tag>
  );
};

export default SplitText;
