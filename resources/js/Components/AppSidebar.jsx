import { Link, usePage } from '@inertiajs/react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/Components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { User, Home, DatabaseZapIcon, ImagePlus, PlusSquareIcon, IdCardIcon, UserPlus2, Users , LucideFilePlus, Settings, HistoryIcon, IdCardLanyard , LogOut, ChevronRight, ShieldCheck } from "lucide-react";

// Definisikan item menu navigasi
const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Cetak Ulang", url: "/re-print", icon: User, permission: 'reprint id cards'},
    { title: "Bulk Add Kandidat", url: "/candidates/bulk-add", icon: DatabaseZapIcon, permission: 'bulk add candidates' },
    {
        title: "Karyawan Baru",
        icon: LucideFilePlus,
        subItems: [
            { title: "Tambah Kandidat", url: "/candidates", icon: UserPlus2, permission: 'view candidates' },
            { title: "Upload Gambar", url: "/candidates/upload-image", icon: ImagePlus, permission: 'upload images' },
            { title: "Tambah NIK", url: "/candidates/upload-nik", icon: PlusSquareIcon, permission: 'upload nik' },
            { title: "Cetak ID Card", url: "/candidates/print-id-card", icon: IdCardIcon, permission: 'print id cards' },
        ],
    },
    {
        title: "Settings",
        icon: Settings,
        subItems: [
            { title: "Profile", url: "/profile", icon: User },
            { title: "Users Settings", url: "/settings/user-management", icon: Users, permission: 'manage users' },
            { title: "Role Management", url: "/settings/role-management", icon: ShieldCheck, permission: 'manage roles' },
            { title: "Log History", url: "/settings/log-history", icon: HistoryIcon, permission: 'view logs' },
            { title: "ID Card Template", url: "/settings/id-card-template", icon: IdCardLanyard, permission: 'manage id card templates' },
        ],
    },
];

export function AppSidebar() {
    const { url, props } = usePage();
    const permissions = props.auth?.user?.permissions ?? [];
    const can = (perm) => !perm || permissions.includes(perm);

    const visibleMenu = menuItems
        .map((item) => {
            if (item.subItems) {
                const visibleSubs = item.subItems.filter((s) => can(s.permission));
                if (visibleSubs.length === 0) return null;
                return { ...item, subItems: visibleSubs };
            }
            return can(item.permission) ? item : null;
        })
        .filter(Boolean);

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <span className="font-semibold">PICS System</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {visibleMenu.map((item) =>
                                item.subItems ? (
                                    <Collapsible key={item.title} asChild defaultOpen className="group/collapsible">
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={item.title}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.subItems.map((subItem) => (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild isActive={url.startsWith(subItem.url) && !item.subItems.some(si => si !== subItem && url.startsWith(si.url) && si.url.length > subItem.url.length)}>
                                                                <Link href={subItem.url}>
                                                                    <subItem.icon />
                                                                    <span>{subItem.title}</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ) : (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={url.startsWith(item.url)}>
                                            <Link href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild className="text-red-500 hover:bg-red-50 hover:text-red-600">
                            <Link href="/logout" method="post" as="button">
                                <LogOut />
                                <span>Logout</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
