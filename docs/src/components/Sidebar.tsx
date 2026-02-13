import { FolderOpen, Globe, Wrench, Shield, Download, Database, MessageSquare } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

export function Sidebar({ activeSection, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'project', label: 'Project', icon: FolderOpen },
    { id: 'apis', label: 'APIs', icon: Globe },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'resources', label: 'Resources', icon: Database },
    { id: 'prompts', label: 'Prompts', icon: MessageSquare },
    { id: 'auth', label: 'Auth & Policies', icon: Shield },
    { id: 'export', label: 'Export', icon: Download },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>MCP Builder</h3>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

