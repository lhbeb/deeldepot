"use client";

import AdminLayout from '@/components/AdminLayout';

export default function MailProjectPage() {
    return (
        <AdminLayout title="Mail Project">
            {/* Full-bleed iframe — negative margins cancel AdminLayout's padding */}
            <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mb-8" style={{ height: 'calc(100vh - 120px)' }}>
                <iframe
                    src="https://DeelDepot-mailproject.vercel.app/"
                    title="Mail Project"
                    className="w-full h-full border-0"
                    allow="clipboard-read; clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                />
            </div>
        </AdminLayout>
    );
}
