import { NavLink } from 'react-router-dom'
import { Upload, LayoutDashboard, SmilePlus, Tags, AlertTriangle, TrendingUp, GitCompare, FileText, MessageSquare } from 'lucide-react'

const navItems = [
  { path: '/', label: 'Upload Data', icon: Upload, alwaysEnabled: true },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sentiment', label: 'Sentiment Analysis', icon: SmilePlus },
  { path: '/topics', label: 'Topics & Aspects', icon: Tags },
  { path: '/priorities', label: 'Issue Priorities', icon: AlertTriangle },
  { path: '/trends', label: 'Trend Analysis', icon: TrendingUp },
  { path: '/comparison', label: 'Product Comparison', icon: GitCompare },
  { path: '/summaries', label: 'AI Summaries', icon: FileText },
  { path: '/reviews', label: 'Browse Reviews', icon: MessageSquare },
]

export default function Sidebar({ analysisReady }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>ReviewLens</h1>
        <p>AI-Powered Review Intelligence</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ path, label, icon: Icon, alwaysEnabled }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${!alwaysEnabled && !analysisReady ? 'disabled' : ''}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
