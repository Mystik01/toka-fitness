'use client';

import React from "react";
import { getApiUrl } from "@/app/lib/apiClient";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const handleLogout = async () => {
        try {
            await fetch(`${getApiUrl()}/api/logout`, { method: 'POST', credentials: 'include' });
            window.location.href = '/auth/login';
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-white flex relative">
            {/* Logout button removed as it is not needed on auth pages */}

            <div className="w-full flex flex-col md:flex-row">
                {/* Left side - Branding/Info */}
                <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white md:w-1/2 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-bold">Welcome</h1>
                                <p className="text-xl text-indigo-100">
                                    Your Fitness Journey Starts Here
                                </p>
                            </div>
                            
                            <div className="space-y-4 pt-8">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">💪</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Track Your Progress</h3>
                                        <p className="text-indigo-100 text-sm">Monitor your fitness goals and achievements</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">📅</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Join Classes</h3>
                                        <p className="text-indigo-100 text-sm">Book your favorite fitness classes easily</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🏆</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Achieve Goals</h3>
                                        <p className="text-indigo-100 text-sm">Reach new milestones with personalized plans</p>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 md:w-1/2 bg-white overflow-y-auto">
                    <div className="w-full mx-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}