"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  NAVIGATION,
  NAVIGATION_LOOKUP,
  BREADCRUMB_ROOT,
  getBreadcrumbRoot,
} from "@/config/navigation";
import { useAuthStore } from "@/store";
import {
  LayoutDashboard,
  Users,
  Settings,
  Languages,
  Shield,
  FileText,
  Building2,
  Calendar,
  MessageSquare,
  BarChart3,
  UserCog,
  Key,
  Image,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useLanguagesStore } from "@/app/admin/languages/_store";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

function getBreadcrumbs(pathname: string, role?: string | null) {
  const trail = [];
  let current = pathname === "/" ? "/" : pathname;

  if (current.length > 1 && current.endsWith("/")) {
    current = current.slice(0, -1);
  }

  while (current) {
    const entry = NAVIGATION_LOOKUP[current];
    if (!entry) {
      break;
    }

    trail.push(entry);

    // If parent has no href but has a title, add it as a non-clickable breadcrumb
    if (entry.parentTitle && !entry.parent) {
      trail.push({
        title: entry.parentTitle,
        href: "#",
      });
      break;
    }

    if (!entry.parent) {
      break;
    }
    current = entry.parent;
  }

  trail.reverse();

  const breadcrumbRoot = getBreadcrumbRoot(role);
  const breadcrumbs = [
    breadcrumbRoot,
    ...trail.filter((crumb, index, array) => {
      if (crumb.href === "/" && index !== array.length - 1) {
        return false;
      }
      return true;
    }),
  ];

  const last = breadcrumbs[breadcrumbs.length - 1];
  return {
    items: breadcrumbs.slice(0, -1),
    current: last,
  };
}

function LanguageSwitcher() {
  const { selectedLanguage, setSelectedLanguage, availableLanguages } =
    useLanguagesStore();
  const currentLanguage = availableLanguages.find(
    (lang) => lang.code === selectedLanguage
  );

  return (
    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
      <SelectTrigger size="sm" className="w-fit min-w-[120px] rounded-full">
        <SelectValue
          placeholder={
            currentLanguage?.nativeName ||
            currentLanguage?.name ||
            selectedLanguage
          }
        />
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{language.nativeName}</span>
              <span className="text-muted-foreground text-xs">
                ({language.name})
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserAvatarDropdown() {
  const router = useRouter();
  const [user, setUser] = React.useState<{
    name: string;
    email: string;
    image?: string;
  } | null>(null);

  React.useEffect(() => {
    // Get user from localStorage (mock - replace with actual auth)
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser({ name: "Administrator", email: "admin@example.com" });
      }
    } else {
      setUser({ name: "Administrator", email: "admin@example.com" });
    }
  }, []);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("session_token");
    router.push("/signin");
  }, [router]);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AD";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image} alt={user?.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.name || "Administrator"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "admin@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <User className="mr-2 size-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings className="mr-2 size-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="mr-2 size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuthStore();
  const {
    getTranslationForKey,
    selectedLanguage,
    loadTranslations,
    translations,
  } = useLanguagesStore();

  // Icon map to convert icon names to components
  const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    Users,
    Settings,
    Languages,
    Shield,
    FileText,
    Building2,
    Calendar,
    MessageSquare,
    BarChart3,
    UserCog,
    Key,
    Image,
    Info,
  };

  // Navigation paths are now direct without language prefix
  // Filter navigation based on user permissions from cookies
  const [navigation, setNavigation] =
    React.useState<typeof NAVIGATION>(NAVIGATION);

  // Fetch filtered navigation from API (reads from cookies)
  React.useEffect(() => {
    fetch("/api/navigation")
      .then((res) => res.json())
      .then((data) => {
        if (data.navigation) {
          // Map icon names back to icon components (including nested items)
          const navigationWithIcons = data.navigation.map((section: any) => ({
            ...section,
            items: section.items.map((item: any) => ({
              ...item,
              icon: iconMap[item.iconName] || LayoutDashboard,
              // Handle nested items
              items: item.items
                ? item.items.map((subItem: any) => ({
                    ...subItem,
                    icon: iconMap[subItem.iconName] || LayoutDashboard,
                  }))
                : undefined,
            })),
          }));
          setNavigation(navigationWithIcons);
        }
      })
      .catch((error) => {
        console.error("Error fetching navigation:", error);
        // Fallback to minimal navigation
        setNavigation([
          {
            label: "Main",
            items: [
              {
                title: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                permission: null,
              },
            ],
          },
        ]);
      });
  }, []);
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (translations.length === 0) {
      loadTranslations();
    }
  }, [loadTranslations, translations.length]);

  React.useEffect(() => {
    // Auto-open menus that contain the active page
    const newOpenMenus: Record<string, boolean> = {};
    navigation.forEach((section) => {
      section.items.forEach((item) => {
        if (item.items) {
          const hasActiveSubItem = item.items.some(
            (subitem) =>
              subitem.href &&
              (pathname === subitem.href ||
                pathname.startsWith(`${subitem.href}/`))
          );
          if (hasActiveSubItem) {
            newOpenMenus[item.title] = true;
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [pathname, navigation]);

  const matchPath = React.useCallback(
    (href: string) => {
      if (href === "/") {
        return pathname === "/";
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    },
    [pathname]
  );
  const { items: breadcrumbItems, current } = React.useMemo(
    () => getBreadcrumbs(pathname, role),
    [pathname, role]
  );

  return (
    <SidebarProvider className="h-dvh overflow-hidden">
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-3 overflow-hidden ">
            <div className="shrink-0 size-8 flex items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold uppercase tracking-wide text-sidebar-primary-foreground">
              ES
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-tight truncate">
                East Shoa e-service
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                Control Centre
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {navigation.map((section) => (
            <SidebarGroup key={section.label}>
              <SidebarGroupLabel>
                {getTranslationForKey(section.label, selectedLanguage)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item, i) => {
                    const isActive = matchPath(item.href || "");
                    const hasSubItems = (item.items?.length ?? 0) > 0;
                    const hasActiveSubItem =
                      hasSubItems &&
                      item.items?.some(
                        (subitem) =>
                          pathname === subitem.href ||
                          pathname.startsWith(`${subitem.href}/`)
                      );
                    const shouldBeOpen =
                      openMenus[item.title] ?? (i === 0 || hasActiveSubItem);

                    return (
                      <Collapsible
                        key={item.title}
                        open={shouldBeOpen}
                        onOpenChange={(open) =>
                          setOpenMenus((prev) => ({
                            ...prev,
                            [item.title]: open,
                          }))
                        }
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              asChild={!hasSubItems && !!item.href}
                              isActive={isActive || hasActiveSubItem}
                            >
                              {hasSubItems ? (
                                <div className="flex w-full items-center gap-2 cursor-pointer">
                                  <item.icon className="size-4" />
                                  <span>
                                    {getTranslationForKey(
                                      item.title,
                                      selectedLanguage
                                    )}
                                  </span>
                                  <ChevronLeft className="ml-auto size-4 group-data-[state=open]/collapsible:-rotate-90" />
                                </div>
                              ) : (
                                <Link
                                  href={item.href || "#"}
                                  className="flex w-full items-center gap-2"
                                >
                                  <item.icon className="size-4" />
                                  <span>
                                    {getTranslationForKey(
                                      item.title,
                                      selectedLanguage
                                    )}
                                  </span>
                                </Link>
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          {hasSubItems ? (
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {item.items?.map((subitem) => (
                                  <SidebarMenuSubItem
                                    key={subitem.href || subitem.title}
                                  >
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={
                                        subitem.href
                                          ? pathname === subitem.href ||
                                            pathname.startsWith(
                                              `${subitem.href}/`
                                            )
                                          : false
                                      }
                                    >
                                      {subitem.href ? (
                                        <Link href={subitem.href}>
                                          {getTranslationForKey(
                                            subitem.title,
                                            selectedLanguage
                                          )}
                                        </Link>
                                      ) : (
                                        <span>
                                          {getTranslationForKey(
                                            subitem.title,
                                            selectedLanguage
                                          )}
                                        </span>
                                      )}
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          ) : null}
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
      </Sidebar>

      <SidebarInset className="grid grid-rows-[auto_1fr] overflow-hidden">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6 max-md:hidden" />
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Breadcrumb className="max-md:hidden">
                <BreadcrumbList>
                  {breadcrumbItems.map((breadcrumb) => (
                    <React.Fragment key={breadcrumb.href}>
                      <BreadcrumbItem>
                        {breadcrumb.href === "#" ? (
                          <span className="text-muted-foreground">
                            {breadcrumb.title}
                          </span>
                        ) : (
                          <BreadcrumbLink href={breadcrumb.href}>
                            {breadcrumb.title}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </React.Fragment>
                  ))}
                  <BreadcrumbItem>
                    <BreadcrumbPage>{current.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Separator orientation="vertical" className="h-6" />
              <LanguageSwitcher />
              <Separator orientation="vertical" className="h-6" />
              <UserAvatarDropdown />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto bg-background">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
