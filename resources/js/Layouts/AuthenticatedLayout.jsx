import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/Components/ui/sidebar";
import { AppSidebar } from "@/Components/AppSidebar";

export default function AuthenticatedLayout({ header, children }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {header && (
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <div className="ml-2">{header}</div>
                    </header>
                )}
                <main>{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
