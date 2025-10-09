import React from "react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 sm:flex sm:items-center sm:justify-center sm:p-4">
            <div className="min-h-screen sm:min-h-0 w-full max-w-md bg-white sm:rounded-lg sm:shadow-md p-6 sm:p-8 flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-center mb-8 text-black">Welcome</h1>
                <div>{children}</div>
            </div>
        </div>
    );
}