<template>
  <div/>
</template>

<script setup lang="ts">
type AdsWindow = Window & {
  __adsLoaded?: boolean
  adsbygoogle?: Record<string, unknown>[]
}

onMounted(() => {
  if (import.meta.client) {
    const w = window as AdsWindow
    // 既に読み込み済みならスキップ
    if (w.__adsLoaded) {
      return
    }
    w.__adsLoaded = true

    const script = document.createElement('script')
    script.async = true
    script.src = '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    document.head.appendChild(script)

    script.onload = () => {
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({
        google_ad_client: 'ca-pub-0917187897820609',
        enable_page_level_ads: true
      })
    }
  }
})
</script>
