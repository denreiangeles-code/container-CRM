import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { supabase } from './config/supabase'
import { api } from './lib/api'
import { ToastHost, ConfirmHost } from './lib/notify'
import { preloadAppData } from './lib/dataCache'
import { Screen } from './types/crm'
import Login from './Login'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'

// ─── Lazy Screen Modules ────────────────────────────────────────────────────────
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'))
const OutreachDashboard = lazy(() => import('./features/dashboard/OutreachDashboard'))
const InquiryDashboard = lazy(() => import('./features/dashboard/InquiryDashboard'))
const ProspectSheet = lazy(() => import('./features/pipeline/ProspectSheet'))
const InquiryList = lazy(() => import('./features/pipeline/InquiryList'))
const QuotationList = lazy(() => import('./features/pipeline/QuotationList'))
const SalesTracker = lazy(() => import('./features/pipeline/SalesTracker'))
const ActiveClientsDashboard = lazy(() => import('./features/customers/ActiveClientsDashboard'))
const CustomerAccounts = lazy(() => import('./features/customers/CustomerAccounts'))
const ContactOutreach = lazy(() => import('./features/customers/ContactOutreach'))
const Contracts = lazy(() => import('./features/contracts/Contracts'))
const DailyTasks = lazy(() => import('./features/reports/DailyTasks'))
const RemovedSheet = lazy(() => import('./features/removed/RemovedSheet'))
const Deliverability = lazy(() => import('./features/removed/Deliverability'))
const ContainerCatalog = lazy(() => import('./features/catalog/ContainerCatalog'))
const PICPerformance = lazy(() => import('./features/analytics/PICPerformance'))
const ProfitAnalytics = lazy(() => import('./features/analytics/ProfitAnalytics'))
const DailyTargets = lazy(() => import('./features/reports/DailyTargets'))
const ServiceTerritories = lazy(() => import('./features/reports/ServiceTerritories'))
const SystemSettings = lazy(() => import('./features/settings/SystemSettings'))
const UserProfileSettings = lazy(() => import('./features/settings/UserProfileSettings').then(m => ({ default: m.UserProfileSettings })))
const UserManagement = lazy(() => import('./features/settings/UserManagement').then(m => ({ default: m.UserManagement })))
const ResetPassword = lazy(() => import('./features/settings/ResetPassword'))
const InquiryValidation = lazy(() => import('./features/operations/InquiryValidation'))
const InventoryManagement = lazy(() => import('./features/operations/InventoryManagement'))
const Pickups = lazy(() => import('./features/contracts/Pickups'))
const BestClients = lazy(() => import('./features/analytics/BestClients'))
const InquiryFunnel = lazy(() => import('./features/analytics/InquiryFunnel'))
const MonthlyReport = lazy(() => import('./features/reports/MonthlyReport'))

// ─── App Root Shell ───────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    new URLSearchParams(window.location.search).has('google_sync') ? 'system-settings' : 'dashboard'
  )
  const [sidebarPinned, setSidebarPinnedState] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarMode')
    return stored ? stored === 'expanded' : true
  })
  const setSidebarPinned = (pinned: boolean) => {
    localStorage.setItem('sidebarMode', pinned ? 'expanded' : 'collapsed')
    setSidebarPinnedState(pinned)
  }
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const [session, setSession] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<{ role?: string } | null>(null)

  useEffect(() => {
    if (!session) { setCurrentProfile(null); return }
    api.get('/auth/me').then(res => {
      const p = res.data.data
      setCurrentProfile(p)
      preloadAppData()
      if (p?.role === 'operations') {
        setScreen(s => s === 'dashboard' ? 'pickups' : s)
      } else if (p?.role === 'procurement') {
        setScreen(s => s === 'dashboard' ? 'inquiry-validation' : s)
      }
    }).catch(console.error)
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.provider_refresh_token && session?.user) {
        api.post('/auth/google/sync-provider', {
          refresh_token: session.provider_refresh_token,
          email: session.user.email
        }).catch(console.error);
      }
      setAuthChecking(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      setSession(session)
      if (session?.provider_refresh_token && session?.user) {
        api.post('/auth/google/sync-provider', {
          refresh_token: session.provider_refresh_token,
          email: session.user.email
        }).catch(console.error);
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleNav = useCallback((s: Screen) => setScreen(s), [])

  if (authChecking) return null;
  if (isPasswordRecovery) return (
    <>
      <Suspense fallback={<div className="loading-row"><span className="spinner" />Loading…</div>}>
        <ResetPassword onDone={() => setIsPasswordRecovery(false)} />
      </Suspense>
      <ToastHost />
    </>
  );
  if (!session) return <><Login onLogin={() => {}} /><ToastHost /></>;

  const renderScreen = () => {
    switch (screen) {
      case 'dashboard':           return <Dashboard onNav={handleNav} session={session} />
      case 'outreach-dashboard':  return <OutreachDashboard />
      case 'inquiry-dashboard':   return <InquiryDashboard />
      case 'prospects':           return <ProspectSheet mode="prospect" onNav={handleNav} />
      case 'warm-leads':          return <ProspectSheet mode="warm" onNav={handleNav} />
      case 'inquiries':           return <InquiryList />
      case 'quotations':          return <QuotationList />
      case 'sales-tracker':       return <SalesTracker />
      case 'active-clients':      return <ActiveClientsDashboard role={currentProfile?.role} onNav={handleNav} />
      case 'customers':           return <CustomerAccounts role={currentProfile?.role} />
      case 'contact-outreach':    return <ContactOutreach />
      case 'contracts':           return <Contracts />
      case 'daily-tasks':         return <DailyTasks />
      case 'removed':             return <RemovedSheet />
      case 'deliverability':      return <Deliverability />
      case 'container-catalog':   return <ContainerCatalog />
      case 'pic-performance':     return <PICPerformance />
      case 'profit-analytics':    return <ProfitAnalytics />
      case 'daily-targets':       return <DailyTargets />
      case 'service-territories': return <ServiceTerritories />
      case 'system-settings':     return <SystemSettings onNav={handleNav} />
      case 'profile-settings':    return <UserProfileSettings session={session} />
      case 'user-management':     return currentProfile?.role === 'admin' ? <UserManagement /> : <Dashboard onNav={handleNav} session={session} />
      case 'inquiry-validation':  return ['admin', 'procurement'].includes(currentProfile?.role ?? '') ? <InquiryValidation /> : <Dashboard onNav={handleNav} session={session} />
      case 'inventory-management': return <InventoryManagement role={currentProfile?.role} />
      case 'pickups':             return <Pickups />
      case 'best-clients':        return <BestClients />
      case 'inquiry-funnel':      return <InquiryFunnel />
      case 'monthly-report':     return <MonthlyReport />
      default:                    return <Dashboard onNav={handleNav} session={session} />
    }
  }

  const isSidebarExpanded = sidebarPinned || isHoveringSidebar

  return (
    <div data-theme={isDark ? 'dark' : undefined} style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>

      {/* Physical spacer for layout so it doesn't push when hovering */}
      <div style={{
        width: sidebarPinned ? 240 : 68,
        minWidth: sidebarPinned ? 240 : 68,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }} />

      {/* Floating Sidebar */}
      <div
        onMouseEnter={() => setIsHoveringSidebar(true)}
        onMouseLeave={() => setIsHoveringSidebar(false)}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 90, display: 'flex' }}
      >
        <Sidebar
          active={screen}
          onNav={handleNav}
          expanded={isSidebarExpanded}
          pinned={sidebarPinned}
          onTogglePin={() => setSidebarPinned(!sidebarPinned)}
          role={currentProfile?.role}
        />
      </div>

      <div className="workspace" style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div className="ws-card">
          <TopBar isDark={isDark} onToggleDark={() => setIsDark(d => !d)} session={session} onNav={handleNav} role={currentProfile?.role} />
          <div key={screen} className="screen-transition">
            <Suspense fallback={<div className="loading-row"><span className="spinner" />Loading…</div>}>
              {renderScreen()}
            </Suspense>
          </div>
        </div>
      </div>
      <ToastHost />
      <ConfirmHost />
    </div>
  )
}
