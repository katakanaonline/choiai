"use client";

import React, { ReactNode, useState } from "react";

/**
 * AdminLayout - 管理画面共通レイアウト
 *
 * 機能:
 * - サイドバーナビゲーション
 * - ヘッダー（タイトル、ユーザー情報）
 * - レスポンシブ対応
 */

export interface NavItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  badge?: string | number;
  children?: NavItem[];
}

export interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  currentNavId?: string;
  onNavClick?: (item: NavItem) => void;
  userName?: string;
  userEmail?: string;
  logo?: ReactNode;
  headerActions?: ReactNode;
}

export function AdminLayout({
  children,
  title,
  subtitle,
  navItems,
  currentNavId,
  onNavClick,
  userName,
  userEmail,
  logo,
  headerActions,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* モバイルサイドバーオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:inset-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* ロゴ */}
        <div className="flex h-16 items-center gap-2 border-b px-4">
          {logo || (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
              C
            </div>
          )}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={currentNavId === item.id}
                onClick={() => {
                  onNavClick?.(item);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </ul>
        </nav>

        {/* ユーザー情報 */}
        {(userName || userEmail) && (
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                {userName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                {userName && (
                  <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        {/* ヘッダー */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-4 shadow-sm">
          {/* モバイルメニューボタン */}
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* タイトル */}
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>

          {/* ヘッダーアクション */}
          {headerActions}
        </header>

        {/* コンテンツ */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItemComponent({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded);
    } else {
      onClick();
    }
  };

  return (
    <li>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors
          ${isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"}
        `}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {hasChildren && expanded && (
        <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              isActive={false}
              onClick={onClick}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default AdminLayout;
