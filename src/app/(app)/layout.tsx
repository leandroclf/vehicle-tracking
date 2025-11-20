'use client';

import { SidebarProvider } from '@/lib/sidebar-context';
import { RealtimeProvider } from '@/lib/providers/RealtimeProvider';
import RealtimeIntegration from '@/components/realtime/RealtimeIntegration';
import { UpdateLoopDetector } from '@/components/ui/UpdateLoopDetector';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <UpdateLoopDetector maxUpdatesPerSecond={40}>
            <SidebarProvider>
                <RealtimeProvider wsUrl={process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}>
                    <RealtimeIntegration>
                        {children}
                    </RealtimeIntegration>
                </RealtimeProvider>
            </SidebarProvider>
        </UpdateLoopDetector>
    );
}
