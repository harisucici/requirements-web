<template>
  <div class="wasteland-shell">
    <div class="station-band"><span class="band-track"><span>INDEPENDENT TOOL WORKSHOP <i aria-hidden="true">✦</i> EST. 2077 <i aria-hidden="true">✦</i> STILL BUILDING <i aria-hidden="true">✦</i> HANDCRAFTED CODE ON EVERY CYCLE <i aria-hidden="true">✦</i> &nbsp;&nbsp;&nbsp;</span><span aria-hidden="true">INDEPENDENT TOOL WORKSHOP <i aria-hidden="true">✦</i> EST. 2077 <i aria-hidden="true">✦</i> STILL BUILDING <i aria-hidden="true">✦</i> HANDCRAFTED CODE ON EVERY CYCLE <i aria-hidden="true">✦</i> &nbsp;&nbsp;&nbsp;</span></span></div>
    <AppHeader />
    <main class="station-main"><slot /></main>
    <AppFooter />
    <CookieConsentBanner />
    <ToastContainer />
  </div>
</template>
