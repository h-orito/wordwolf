<template>
  <div></div>
</template>

<script setup lang="ts">
onMounted(() => {
  if (import.meta.client) {
    // 既に読み込み済みならスキップ
    if ((window as any).__adsLoaded) {
      return
    }
    (window as any).__adsLoaded = true

    const script = document.createElement('script')
    script.async = true
    script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    document.head.appendChild(script)

    script.onload = () => {
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
      ;(window as any).adsbygoogle.push({
        google_ad_client: 'ca-pub-0917187897820609',
        enable_page_level_ads: true
      })
    }
  }
})
</script>
