import { ReactNode } from 'react'

export const metadata = {
    title: 'Principal Portal - School Admission System',
    description: 'Principal calendar view for counselling sessions',
}

export default function PrincipalLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </div>
        </div>
    )
}
