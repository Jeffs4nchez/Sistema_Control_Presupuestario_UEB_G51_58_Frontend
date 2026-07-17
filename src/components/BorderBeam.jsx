import React from 'react';

export const BorderBeam = ({ 
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = 'var(--color-primary)',
  colorTo = 'var(--color-secondary)',
  delay = 0,
  className = ''
}) => {
  const styles = `
    @keyframes border-beam {
      100% {
        offset-distance: 100%;
      }
    }

    .border-beam {
      pointer-events: none;
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: calc(var(--border-width, 1.5px) * 1px) solid transparent;
      --mask-clip: padding-box, border-box;
      --mask-composite: intersect;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }

    .border-beam::after {
      content: '';
      position: absolute;
      aspect-ratio: 1;
      width: calc(var(--size, 200px) * 1px);
      height: calc(var(--size, 200px) * 1px);
      background: linear-gradient(
        to left,
        var(--color-from, #ffaa40),
        var(--color-to, #9c40ff),
        transparent
      );
      animation: border-beam calc(var(--duration, 15s) * 1s) infinite linear;
      animation-delay: var(--delay, 0s);
      offset-anchor: calc(var(--anchor, 90) * 1%) 50%;
      offset-path: rect(0 auto auto 0 round calc(var(--size, 200px) * 1px));
    }
  `;

  const inlineStyles = {
    '--size': size,
    '--duration': duration,
    '--anchor': anchor,
    '--border-width': borderWidth,
    '--color-from': colorFrom,
    '--color-to': colorTo,
    '--delay': `${-delay}s`,
  };

  return (
    <>
      <style>{styles}</style>
      <div className={`border-beam ${className}`} style={inlineStyles} />
    </>
  );
};
