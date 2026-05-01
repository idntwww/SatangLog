"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  FileUp,
  Settings,
  ChevronLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUIStore } from "@/stores/ui.store";

const navItems = [
  {
    label: "แดชบอร์ด",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "รายการธุรกรรม",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "วิเคราะห์",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "นำเข้า/ส่งออก",
    href: "/import",
    icon: FileUp,
  },
  {
    label: "ตั้งค่า",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo / Title */}
        <div className="flex items-center h-16 px-4 border-b">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <span className="text-xl font-bold shrink-0">💰</span>
            {sidebarOpen && (
              <span className="text-lg font-bold whitespace-nowrap">
                SatangLog
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse Button */}
        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="w-full justify-center"
            aria-label={sidebarOpen ? "ย่อเมนู" : "ขยายเมนู"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !sidebarOpen && "rotate-180"
              )}
            />
            {sidebarOpen && <span className="ml-2">ย่อเมนู</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
