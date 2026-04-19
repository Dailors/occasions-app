// app/dashboard/layout.tsx
// Minimal wrapper — sidebar is rendered by each inner layout separately.
// This prevents double-sidebar when navigating into /dashboard/[eventId].

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
