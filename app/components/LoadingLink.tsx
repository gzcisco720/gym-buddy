'use client'

import Link from 'next/link'
import { useRouteLoading } from './RouteLoading'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

interface LoadingLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

/**
 * 增强的 Link 组件，点击时自动显示 loading
 */
export function LoadingLink({ href, children, className, ...props }: LoadingLinkProps) {
  const { setLoading } = useRouteLoading()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  )
}

/**
 * 手动控制 loading 的 Hook
 */
export function useManualLoading() {
  const { setLoading } = useRouteLoading()
  
  const showLoading = () => setLoading(true)
  const hideLoading = () => setLoading(false)
  
  return { showLoading, hideLoading }
}