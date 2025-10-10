"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Home, Dumbbell, Apple, Calendar, Settings, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type NavBarProps = {
  user?: { email: string } | null;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
};

const navItems = [
    { label: "Home", key: "dashboard", icon: Home },
    { label: "Classes", key: "dashboard/classes", icon: Calendar },
    { label: "Workouts", key: "dashboard/workouts", icon: Dumbbell },
    { label: "Nutrition", key: "dashboard/nutrition", icon: Apple },
];

const bottomItems = [
    { label: "Settings", key: "dashboard/settings", icon: Settings },
    { label: "Account", key: "dashboard/account", icon: User },
];

const NavBar: React.FC<NavBarProps> = React.memo(({ user, onLogout, isOpen, onToggle }) => {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col justify-between h-full bg-gray-800 text-white w-64">
                <div>
                    <div className="flex items-center p-6">
                        <span className="font-bold text-xl">Dashboard</span>
                    </div>
                    <nav className="mt-4 flex flex-col gap-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.key}
                                    href={`/${item.key}`}
                                    className="flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex flex-col gap-1 mb-4 px-3">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.key}
                                href={`/${item.key}`}
                                className="flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden bg-white shadow-sm border-b">
                <div className="flex justify-between items-center px-4 py-3">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-gray-600" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-600" />
                            )}
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            {user?.email || 'User'}
                        </span>
                        <button
                            onClick={onLogout}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={onToggle}
                                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            />
                            
                            {/* Mobile Menu */}
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 left-0 h-full w-80 bg-gray-800 text-white z-50 overflow-y-auto"
                            >
                                <div className="flex flex-col h-full">
                                    {/* Mobile Menu Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-gray-700">
                                        <span className="font-bold text-xl">Dashboard</span>
                                        <button
                                            onClick={onToggle}
                                            className="p-2 rounded-md hover:bg-gray-700 transition-colors"
                                            aria-label="Close menu"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* User Info */}
                                    <div className="px-6 py-4 border-b border-gray-700">
                                        <p className="text-sm text-gray-300">Signed in as</p>
                                        <p className="text-sm font-medium text-white truncate">
                                            {user?.email || 'User'}
                                        </p>
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex-1 px-3 py-4">
                                        <nav className="flex flex-col gap-1">
                                            {navItems.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.key}
                                                        href={`/${item.key}`}
                                                        onClick={onToggle}
                                                        className="flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </nav>
                                    </div>

                                    {/* Bottom Items */}
                                    <div className="px-3 py-4 border-t border-gray-700">
                                        <nav className="flex flex-col gap-1">
                                            {bottomItems.map((item) => {
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={item.key}
                                                        href={`/${item.key}`}
                                                        onClick={onToggle}
                                                        className="flex items-center gap-3 px-3 py-3 hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </nav>
                                        
                                        {/* Mobile Logout Button */}
                                        <button
                                            onClick={() => {
                                                onToggle();
                                                onLogout();
                                            }}
                                            className="w-full mt-4 px-3 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </header>

            {/* Desktop Header (only user info and logout) */}
            <header className="hidden lg:block bg-white shadow-sm border-b px-6 py-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            Welcome, {user?.email || 'User'}
                        </span>
                        <button
                            onClick={onLogout}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>
        </>
    );
});

NavBar.displayName = 'NavBar';

export default NavBar;