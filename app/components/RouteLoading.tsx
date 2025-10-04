'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

// 创建 Loading Context
const LoadingContext = createContext<{
  isLoading: boolean
  setLoading: (loading: boolean) => void
}>({
  isLoading: false,
  setLoading: () => {}
})

// Provider 组件
export function RouteLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    // 当路径改变时，显示 loading
    if (pathname !== prevPathname) {
      setIsLoading(true)
      
      // 模拟页面加载时间，然后隐藏 loading
      const timer = setTimeout(() => {
        setIsLoading(false)
        setPrevPathname(pathname)
      }, 500) // 500ms 的 loading 显示时间

      return () => clearTimeout(timer)
    }
  }, [pathname, prevPathname])

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
      <RouteLoading />
    </LoadingContext.Provider>
  )
}

// Loading UI 组件
function RouteLoading() {
  const { isLoading } = useContext(LoadingContext)

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-blue-300 rounded-full animate-spin opacity-50" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        
        {/* Loading text */}
        <div className="text-sm text-gray-600 animate-pulse">
          Loading ...
        </div>
      </div>
    </div>
  )
}

// Hook for manual loading control
export function useRouteLoading() {
  return useContext(LoadingContext)
}