'use client'
// app/dashboard/inbox/page.tsx
import { InboxPanel } from '@/components/inbox/InboxPanel'

export default function InboxPage() {
  return (
    <div className="h-full flex flex-col gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
      <h1 className="text-xl font-bold text-gray-900 flex-shrink-0">WhatsApp Inbox</h1>
      <div className="flex-1 overflow-hidden">
        <InboxPanel />
      </div>
    </div>
  )
}
