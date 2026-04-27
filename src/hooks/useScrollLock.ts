import { useEffect } from 'react';

/**
 * Hook para travar o scroll do fundo quando uma modal está aberta.
 * Utiliza um contador global no elemento HTML para permitir múltiplas modais sobrepostas.
 */
export const useScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;

    // Incrementa o contador de travas no HTML
    const html = document.documentElement;
    const currentLocks = parseInt(html.getAttribute('data-scroll-locks') || '0');
    const newLocks = currentLocks + 1;
    
    html.setAttribute('data-scroll-locks', newLocks.toString());
    html.classList.add('no-scroll');

    return () => {
      // Decrementa ao fechar/desmontar
      const latestLocks = parseInt(html.getAttribute('data-scroll-locks') || '0');
      const remainingLocks = Math.max(0, latestLocks - 1);
      
      html.setAttribute('data-scroll-locks', remainingLocks.toString());
      
      if (remainingLocks === 0) {
        html.classList.remove('no-scroll');
        html.removeAttribute('data-scroll-locks');
      }
    };
  }, [isOpen]);
};