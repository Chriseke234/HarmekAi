import { NextResponse } from "next/server";

/**
 * Lightweight vanilla JavaScript embed script for any business website.
 * Usage:
 * <script src="https://your-sage-domain.com/api/widget/loader.js" data-widget-key="YOUR_KEY" async></script>
 */
export async function GET(request: Request) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;

  const script = `(function() {
  if (window.__SAGE_AI_WIDGET_LOADED__) return;
  window.__SAGE_AI_WIDGET_LOADED__ = true;

  var scriptEl = document.currentScript || document.querySelector('script[data-widget-key]');
  var widgetKey = scriptEl ? scriptEl.getAttribute('data-widget-key') : null;
  if (!widgetKey) {
    console.warn('[Harmek AI] Missing data-widget-key attribute on embed script.');
    return;
  }

  var baseUrl = ${JSON.stringify(origin)};
  var isOpen = false;

  var container = document.createElement('div');
  container.id = 'sage-ai-widget-root';
  container.style.position = 'fixed';
  container.style.bottom = '20px';
  container.style.right = '20px';
  container.style.zIndex = '2147483000';
  container.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif';

  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/widget/' + encodeURIComponent(widgetKey);
  iframe.title = 'Harmek AI Chat Assistant';
  iframe.style.display = 'none';
  iframe.style.width = '380px';
  iframe.style.maxWidth = 'calc(100vw - 32px)';
  iframe.style.height = '580px';
  iframe.style.maxHeight = 'calc(100vh - 104px)';
  iframe.style.border = '1px solid #262626';
  iframe.style.borderRadius = '16px';
  iframe.style.boxShadow = '0 20px 50px rgba(2, 6, 23, 0.55)';
  iframe.style.marginBottom = '12px';
  iframe.style.background = '#0A0A0A';

  var button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', 'Open chat assistant');
  button.style.width = '60px';
  button.style.height = '60px';
  button.style.borderRadius = '9999px';
  button.style.border = '2px solid rgba(103, 232, 249, 0.55)';
  button.style.background = '#FFFFFF';
  button.style.padding = '0';
  button.style.overflow = 'hidden';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.marginLeft = 'auto';
  button.style.boxShadow = '0 10px 28px rgba(6, 182, 212, 0.35)';
  button.innerHTML = '<img src="' + baseUrl + '/harmek-mascot.jpg" alt="HARMEK AI Chat" style="width:100%;height:100%;object-fit:cover;object-position:top;" />';

  button.addEventListener('click', function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
  });

  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
