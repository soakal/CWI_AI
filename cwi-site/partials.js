/* CWI — shared nav + footer, injected so every page stays consistent.
   Pages include <div data-cwi-nav></div> and <div data-cwi-footer></div>. */
(function () {
  var MARK =
    '<svg class="mk" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="6" y="6" width="108" height="108" rx="30" fill="#0E0E11"></rect>' +
    '<rect x="6.8" y="6.8" width="106.4" height="106.4" rx="29.2" stroke="rgba(255,255,255,.10)" stroke-width="1.6"></rect>' +
    '<path d="M41 28 H79 a16 16 0 0 1 16 16 V60 a16 16 0 0 1 -16 16 H55 l-13 12 V76 h-1 a16 16 0 0 1 -16 -16 V44 a16 16 0 0 1 16 -16 Z" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"></path>' +
    '<path d="M37 52 H45 L50 43 L55 60 L60 34 L65 60 L70 43 L75 52 H83" fill="none" stroke="#FF5A1F" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path>' +
    '</svg>';

  var NAV =
    '<header class="nav"><nav class="nav-in">' +
      '<a class="brand" href="index.html" aria-label="CWI home">' + MARK +
        '<span class="wm">CWI<small>Compute With Imagination</small></span></a>' +
      '<div class="nav-links">' +
        '<a href="how-it-works.html">How it works</a>' +
        '<a href="industries.html">Industries</a>' +
        '<a href="pricing.html">Pricing</a>' +
        '<a href="compare.html">Compare</a>' +
        '<a href="testimonials.html">Proof</a>' +
        '<a href="roi.html">ROI Calculator</a>' +
      '</div>' +
      '<div class="nav-cta">' +
        '<a class="nav-tel" href="tel:+17348129971"><span class="dot"></span>(734)\u00A0812\u20119971</a>' +
        '<button class="nav-burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
        '<a class="btn btn-ghost btn-sm" href="free-audit.html">Free audit</a>' +
        '<a class="btn btn-primary btn-sm" href="demo.html">Book a demo</a>' +
      '</div>' +
    '</nav></header>';

  var FOOTER =
    '<footer class="footer"><div class="wrap"><div class="footer-grid">' +
      '<div><a class="brand" href="index.html">' + MARK +
        '<span class="wm">CWI<small>Compute With Imagination</small></span></a>' +
        '<p style="color:var(--steel);font-size:14px;margin-top:18px;max-width:34ch">The always\u2011on AI receptionist for local business. The line is always live.</p>' +
        '<div class="live-wave" style="margin-top:20px"><i style="animation-delay:0s"></i><i style="animation-delay:.12s"></i><i style="animation-delay:.24s"></i><i style="animation-delay:.08s"></i><i style="animation-delay:.3s"></i></div></div>' +
      '<div><h5>Product</h5>' +
        '<a class="lnk" href="how-it-works.html">How it works</a>' +
        '<a class="lnk" href="industries.html">Industries</a>' +
        '<a class="lnk" href="pricing.html">Pricing</a>' +
        '<a class="lnk" href="compare.html">Compare</a>' +
        '<a class="lnk" href="testimonials.html">Proof</a>' +
        '<a class="lnk" href="roi.html">ROI Calculator</a>' +
        '<a class="lnk" href="free-audit.html">Free audit</a>' +
        '<a class="lnk" href="demo.html">Book a demo</a></div>' +
      '<div><h5>Company</h5>' +
        '<a class="lnk" href="how-it-works.html">How It Works</a>' +
        '<a class="lnk" href="mailto:brian@cwiai.net">Contact</a></div>' +
      '<div><h5>Get started</h5>' +
        '<a class="lnk" href="tel:+17348129971">(734)\u00A0812\u20119971</a>' +
        '<a class="lnk" href="mailto:brian@cwiai.net">brian@cwiai.net</a>' +
        '<a class="lnk" href="demo.html">Book a demo \u2192</a></div>' +
    '</div>' +
    '<div class="footer-bottom"><span>\u00A9 <span data-year>2026</span> CWI AI LLC \u00B7 Brian Kalsic \u00B7 Southgate, MI \u00B7 cwiai.net</span>' +
      '<span><a href="privacy.html">Privacy</a> \u00B7 <a href="terms.html">Terms</a></span></div>' +
    '</div></footer>';

  function inject() {
    var n = document.querySelector('[data-cwi-nav]');
    if (n) n.outerHTML = NAV;
    var f = document.querySelector('[data-cwi-footer]');
    if (f) f.outerHTML = FOOTER;
    // active link
    var path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
