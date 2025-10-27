import React, { useState } from 'react'

export default function App() {
  const [downloading, setDownloading] = useState(null)

  const handleDownload = async (apkFile, appName) => {
    setDownloading(appName)
    
    try {
      // APK faylini yuklab olish
      const response = await fetch(`/apk/${apkFile}`)
      const blob = await response.blob()
      
      // Faylni yuklab olish uchun link yaratish
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = apkFile
      document.body.appendChild(link)
      link.click()
      
      // Tozalash
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      // Muvaffaqiyatli xabar
      alert(`${appName} muvaffaqiyatli yuklab olindi!`)
    } catch (error) {
      console.error('Yuklab olishda xatolik:', error)
      alert('Yuklab olishda xatolik yuz berdi. Qaytadan urinib ko\'ring.')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 flex items-center justify-center p-4'>
      {/* Android-style background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-20 w-24 h-24 bg-white rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-28 h-28 bg-white rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Android-style card with Material Design elevation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Android-style header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-center relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              {/* Asosiy logo */}
              <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <img 
                  src="/logos/logo.png" 
                  alt="Asosiy Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Android Dasturlar</h1>
              <p className="text-white/90 text-sm md:text-base">Bizning mobil ilovalarni yuklab oling</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Marketplace App */}
            <button 
              onClick={() => handleDownload('marketplace.apk', 'Marketplace')}
              disabled={downloading === 'Marketplace'}
              className="cursor-pointer w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  {downloading === 'Marketplace' ? (
                    <div className="loading loading-spinner loading-sm text-white"></div>
                  ) : (
                    <img 
                      src="/logos/marketplace-logo.png" 
                      alt="Marketplace Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">
                    {downloading === 'Marketplace' ? 'Yuklanmoqda...' : 'Marketplace'}
                  </div>
                  <div className="text-white/80 text-sm">Android Dastur</div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </div>
              </div>
            </button>

            {/* Store Owner App */}
            <button 
              onClick={() => handleDownload('dokon.apk', 'Do\'kon Egasi')}
              disabled={downloading === 'Do\'kon Egasi'}
              className="cursor-pointer w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  {downloading === 'Do\'kon Egasi' ? (
                    <div className="loading loading-spinner loading-sm text-white"></div>
                  ) : (
                    <img 
                      src="/logos/dokon-logo.png" 
                      alt="Do'kon Egasi Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">
                    {downloading === 'Do\'kon Egasi' ? 'Yuklanmoqda...' : 'Do\'kon Egasi'}
                  </div>
                  <div className="text-white/80 text-sm">Android Dastur</div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </div>
              </div>
            </button>

            {/* Agent App */}
            <button 
              onClick={() => handleDownload('agent.apk', 'Agent')}
              disabled={downloading === 'Agent'}
              className="cursor-pointer w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:transform-none"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  {downloading === 'Agent' ? (
                    <div className="loading loading-spinner loading-sm text-white"></div>
                  ) : (
                    <img 
                      src="/logos/agent-logo.png" 
                      alt="Agent Logo" 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg">
                    {downloading === 'Agent' ? 'Yuklanmoqda...' : 'Agent'}
                  </div>
                  <div className="text-white/80 text-sm">Android Dastur</div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </div>
              </div>
            </button>
          </div>

          {/* Android-style footer */}
          <div className="px-6 pb-6">
            <div className="bg-gray-100 rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-3 text-gray-600 text-sm">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.6589 13.8533 8 12 8s-3.5902.6589-5.1367 1.4087L4.841 5.9062a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
                  </svg>
                </div>
                <span className="font-medium">Android uchun optimallashtirilgan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
