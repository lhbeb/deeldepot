'use client';

import AdminLayout from '@/components/AdminLayout';

export default function AnalyticsPage() {
    return (
        <AdminLayout
            title="Analytics"
            subtitle="Traffic & visitor insights"
        >
            <div className="h-full -mx-6 -my-6">
                <iframe
                    src="https://analyticsapp-five.vercel.app/"
                    className="w-full border-0 rounded-b-2xl"
                    style={{ height: 'calc(100vh - 8rem)' }}
                    title="Analytics Dashboard"
                    allowFullScreen
                />
            </div>
        </AdminLayout>
    );
}
