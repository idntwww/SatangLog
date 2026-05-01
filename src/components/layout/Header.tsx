"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores/ui.store";

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar, toggleMobileNav } = useUIStore();

  const userName = session?.user?.name ?? "ผู้ใช้";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleMenuClick = () => {
    // On mobile (< md): open mobile nav sheet
    // On desktop (>= md): toggle sidebar collapse
    if (window.innerWidth < 768) {
      toggleMobileNav();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background">
      {/* Left: Hamburger menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMenuClick}
        aria-label="เปิด/ปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Right: User info */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline-block text-sm font-medium">
              {userName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              <span>ตั้งค่าบัญชี</span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            <span>ออกจากระบบ</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
