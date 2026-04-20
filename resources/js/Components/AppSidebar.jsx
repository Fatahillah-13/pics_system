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
import { User, Home, ImagePlus, UserPlus2, Users , LucideFilePlus, Settings, IdCardLanyard , LogOut, ChevronRight } from "lucide-react";

// Definisikan item menu navigasi
const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Cetak Ulang", url: "/re-print", icon: User },
    {
        title: "Karyawan Baru",
        icon: LucideFilePlus,
        subItems: [
            { title: "Tambah Kandidat", url: "/candidates", icon: UserPlus2 },
            { title: "Upload Gambar", url: "/candidates/upload-image", icon: ImagePlus },
        ],
    },
    {
        title: "Settings",
        icon: Settings,
        subItems: [
            { title: "Profile", url: "/profile", icon: User },
            { title: "Users Settings", url: "/users-settings", icon: Users },
            { title: "ID Card Template", url: "/id-card-template", icon: IdCardLanyard },
        ],
    },
];

export function AppSidebar() {
    const { url } = usePage();

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
                            {menuItems.map((item) =>
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
